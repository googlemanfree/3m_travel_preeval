import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: new Map<any, any[]>(),
  inserts: [] as Array<{ table: any; values: any }>,
  updates: [] as Array<{ table: any; values: any }>,
  emails: [] as any[],
  notified: [] as any[],
  nextId: 100,
  failEmailTo: "" as string,
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: (table: any) => { const chain: any = { where: () => chain, orderBy: () => chain, limit: () => chain, offset: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.rows.get(table) ?? []) }; return chain; } }),
    insert: (table: any) => ({ values: async (values: any) => { const row = { id: state.nextId++, createdAt: new Date(), ...values }; state.inserts.push({ table, values }); state.rows.set(table, [...(state.rows.get(table) ?? []), row]); } }),
    update: (table: any) => ({ set: (values: any) => ({ where: async () => { state.updates.push({ table, values }); state.rows.set(table, (state.rows.get(table) ?? []).map((row) => ({ ...row, ...values }))); } }) }),
  }),
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "agent@3mtravelagency.com" }) }));
vi.mock("./_core/email", () => ({ sendEmail: async (message: any) => { if (state.failEmailTo && message.to === state.failEmailTo) throw new Error("smtp down"); state.emails.push(message); } }));
vi.mock("./routers/adminNotifications", () => ({ notifyAdmins: async (input: any) => { state.notified.push(input); } }));
vi.mock("./routers/candidate", async () => {
  const { publicProcedure } = await import("./_core/trpc");
  return { candidateProcedure: publicProcedure.use(async ({ next }) => next({ ctx: { candidate: { id: 9, email: "client@example.com" } } as any })), findCandidateFromAuthorizationHeader: async () => null, getOrCreateCandidateForPlatformUser: async () => null };
});

import { agencySettings, flightBookingRequestHistory, flightBookingRequests } from "../drizzle/schema";
import { FARE_CHECK_MAX_AGE_HOURS, compareFares, describeFareComparison, fareAgeHours, refuseWithoutFreshFare } from "../shared/flightFareCheck";
import { CHANGE_KINDS, HISTORY, collectChangeRequests, computeDeskStats, departureAtOf, findStaleRequests, planPreDepartureReminder, planQuoteReminder, type DeskRequest, type HistoryRow } from "../shared/flightFollowUps";
import { assessTravelers, checkTraveler, expectedTravelerCount, extractTravelers, lastTravelDateOf, parseIsoDate } from "../shared/flightTravelerCheck";
import { recheckLiveFare } from "./routers/flights";
import { flightBookingRouter } from "./routers/flightBooking";
import { flightFollowUpRouter } from "./routers/flightFollowUp";
import { runFlightFollowUps } from "./scheduled/flightFollowUps";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const NOW = new Date("2026-09-26T12:00:00Z");
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000);
const at = (iso: string) => new Date(iso);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  state.rows = new Map();
  state.inserts = [];
  state.updates = [];
  state.emails = [];
  state.notified = [];
  state.nextId = 100;
  state.failEmailTo = "";
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); delete process.env.SEARCHAPI_KEY; });

// ─── Contrôle des voyageurs ─────────────────────────────────────────────────────────────────────────────────────

describe("dates et contrôle d'un voyageur", () => {
  const valid = { fullName: "Aïcha Nkolo", passportNumber: "CE123456", passportExpiry: "2031-05-01", dateOfBirth: "1994-03-12" };
  const check = (overrides: Record<string, string> = {}, lastTravelDate: string | null = "2026-12-20") => checkTraveler({ ...valid, ...overrides }, { lastTravelDate, today: NOW });
  const errors = (issues: ReturnType<typeof check>) => issues.filter((issue) => issue.severity === "error").map((issue) => issue.field);

  it("une date réelle seulement : le 31 février et les formats libres sont refusés", () => {
    expect(parseIsoDate("2026-02-28")).not.toBeNull();
    expect(parseIsoDate("2026-02-31")).toBeNull();
    expect(parseIsoDate("12/03/1994")).toBeNull();
    expect(parseIsoDate("")).toBeNull();
    expect(parseIsoDate(undefined)).toBeNull();
  });

  it("un voyageur complet et valide n'a aucun problème (accents et apostrophes acceptés)", () => {
    expect(check()).toEqual([]);
    expect(check({ fullName: "Jean-Marie N’Dour" })).toEqual([]);
    expect(check({ passportNumber: "ce 123 456" })).toEqual([]);
  });

  it("chaque champ manquant ou invalide est signalé en erreur", () => {
    expect(errors(check({ fullName: "" }))).toEqual(["fullName"]);
    expect(errors(check({ fullName: "Aicha 2 Nkolo" }))).toEqual(["fullName"]);
    expect(errors(check({ passportNumber: "" }))).toEqual(["passportNumber"]);
    expect(errors(check({ passportNumber: "AB-12" }))).toEqual(["passportNumber"]);
    expect(errors(check({ passportExpiry: "" }))).toEqual(["passportExpiry"]);
    expect(errors(check({ passportExpiry: "demain" }))).toEqual(["passportExpiry"]);
    expect(errors(check({ dateOfBirth: "" }))).toEqual(["dateOfBirth"]);
    expect(errors(check({ dateOfBirth: "2027-01-01" }))).toEqual(["dateOfBirth"]);
    expect(errors(check({ dateOfBirth: "1800-01-01" }))).toEqual(["dateOfBirth"]);
  });

  it("un seul mot dans le nom : avertissement, pas erreur (les mononymes existent)", () => {
    const issues = check({ fullName: "Nkolo" });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "fullName", severity: "warning" });
  });

  it("passeport expiré avant la fin du voyage : erreur ; sans date de voyage : expiré aujourd'hui", () => {
    expect(errors(check({ passportExpiry: "2026-12-19" }))).toEqual(["passportExpiry"]);
    expect(errors(check({ passportExpiry: "2026-09-01" }, null))).toEqual(["passportExpiry"]);
    expect(check({ passportExpiry: "2026-12-20" }).map((issue) => issue.severity)).toEqual(["warning"]);
  });

  it("moins de 6 mois de validité après le voyage : avertissement seulement (la règle dépend du pays) ; pile 6 mois : rien", () => {
    const soon = check({ passportExpiry: "2027-06-19" });
    expect(soon).toHaveLength(1);
    expect(soon[0]).toMatchObject({ field: "passportExpiry", severity: "warning" });
    expect(soon[0].message).toMatch(/pays/);
    expect(check({ passportExpiry: "2027-06-20" })).toEqual([]);
  });

  it("fin de mois : 6 mois après le 31 août = 28 février (pas de dérive au mois suivant)", () => {
    expect(check({ passportExpiry: "2027-02-28" }, "2026-08-31")).toEqual([]);
    expect(check({ passportExpiry: "2027-02-27" }, "2026-08-31").map((issue) => issue.severity)).toEqual(["warning"]);
  });
});

describe("voyageurs d'une demande", () => {
  const flight = { departureDate: "2026-12-20", pricedPassengers: 2, returnFlight: { departureDate: "2027-01-10" } };
  const traveler = (name: string, extra: Record<string, string> = {}) => ({ fullName: name, passportNumber: "CE123456", passportExpiry: "2031-05-01", dateOfBirth: "1994-03-12", ...extra });

  it("dernier jour de voyage : le retour s'il existe, sinon le départ, sinon rien d'inventé", () => {
    expect(lastTravelDateOf(flight)).toBe("2027-01-10");
    expect(lastTravelDateOf({ departureDate: "2026-12-20" })).toBe("2026-12-20");
    expect(lastTravelDateOf({ departureDate: "bientôt" })).toBeNull();
    expect(lastTravelDateOf(null)).toBeNull();
  });

  it("nombre attendu : celui de la demande, sinon les voyageurs facturés, sinon 1", () => {
    expect(expectedTravelerCount(flight, [{ travelers: 3 }])).toBe(3);
    expect(expectedTravelerCount(flight, [{}])).toBe(2);
    expect(expectedTravelerCount({}, [{}])).toBe(1);
    expect(expectedTravelerCount(flight, [{ travelers: 40 }])).toBe(2);
  });

  it("la liste dédiée prime ; sinon le passager principal saisi à la réservation (anciennes demandes)", () => {
    expect(extractTravelers([{ fullName: "A B", travelerDetails: [traveler("Aïcha Nkolo"), traveler("Paul Mbarga")] }])).toHaveLength(2);
    const legacy = extractTravelers([{ fullName: "Aïcha Nkolo", passportNumber: "ce 123456", passportExpiry: "2031-05-01", dateOfBirth: "1994-03-12" }]);
    expect(legacy).toHaveLength(1);
    expect(legacy[0].passportNumber).toBe("CE123456");
    expect(extractTravelers([{ fullName: "Aïcha", email: "a@b.cd" }])).toEqual([]);
    expect(extractTravelers("n'importe quoi")).toEqual([]);
  });

  it("prêt à émettre seulement si tous les voyageurs attendus sont saisis, sans erreur ; les messages disent lesquels", () => {
    const both = assessTravelers({ flightData: flight, passengerData: [{ travelerDetails: [traveler("Aïcha Nkolo"), traveler("Paul Mbarga")] }], today: NOW });
    expect(both).toMatchObject({ expected: 2, provided: 2, complete: true, errors: 0 });
    const missingOne = assessTravelers({ flightData: flight, passengerData: [{ travelerDetails: [traveler("Aïcha Nkolo")] }], today: NOW });
    expect(missingOne.complete).toBe(false);
    expect(missingOne.messages[0]).toContain("1 voyageur(s) renseigné(s) sur 2");
    const none = assessTravelers({ flightData: flight, passengerData: [{}], today: NOW });
    expect(none.messages[0]).toBe("Aucun voyageur n’est renseigné.");
    const expired = assessTravelers({ flightData: flight, passengerData: [{ travelerDetails: [traveler("Aïcha Nkolo"), traveler("Paul Mbarga", { passportExpiry: "2026-11-01" })] }], today: NOW });
    expect(expired.complete).toBe(false);
    expect(expired.messages.join(" ")).toContain("Voyageur 2 :");
  });
});

// ─── Revérification du tarif ────────────────────────────────────────────────────────────────────────────────────

describe("comparaison des tarifs", () => {
  it("inchangé, en baisse, en hausse (avec pourcentage), introuvable, fournisseur muet", () => {
    expect(compareFares(300_000, 300_000)).toEqual({ kind: "same", oldTotal: 300_000, newTotal: 300_000, delta: 0 });
    expect(compareFares(300_000, 270_000)).toMatchObject({ kind: "lower", delta: -30_000, percent: 10 });
    expect(compareFares(300_000, 330_000)).toMatchObject({ kind: "higher", delta: 30_000, percent: 10 });
    expect(compareFares(300_000, null)).toEqual({ kind: "not_found", oldTotal: 300_000 });
    expect(compareFares(300_000, 0)).toEqual({ kind: "not_found", oldTotal: 300_000 });
    expect(compareFares(300_000, 330_000, false)).toEqual({ kind: "unavailable", oldTotal: 300_000 });
  });

  it("les phrases disent quoi faire, sans promesse de tarif", () => {
    expect(describeFareComparison(compareFares(300_000, 330_000))).toMatch(/hausse.*avant tout paiement/);
    expect(describeFareComparison(compareFares(300_000, null))).toMatch(/Ne demandez pas de paiement/);
    expect(describeFareComparison(compareFares(300_000, 300_000))).toMatch(/inchangé/);
    expect(describeFareComparison(compareFares(300_000, 300_000, false))).toMatch(/Réessayez/);
  });

  it("ancienneté d'un relevé ; date absente ou invalide = inconnue", () => {
    expect(fareAgeHours(hoursAgo(5), NOW)).toBe(5);
    expect(fareAgeHours(null, NOW)).toBeNull();
    expect(fareAgeHours("pas une date", NOW)).toBeNull();
  });

  it("demander un paiement : relevé récent requis, sinon refus — sauf dérogation motivée (8 caractères au moins)", () => {
    expect(refuseWithoutFreshFare({ referenceAt: hoursAgo(2), now: NOW })).toBeNull();
    expect(refuseWithoutFreshFare({ referenceAt: hoursAgo(FARE_CHECK_MAX_AGE_HOURS + 1), now: NOW })).toMatch(/Revérifier le tarif/);
    expect(refuseWithoutFreshFare({ referenceAt: null, now: NOW })).toMatch(/date inconnue/);
    expect(refuseWithoutFreshFare({ referenceAt: hoursAgo(30), now: NOW, waiverReason: "court" })).not.toBeNull();
    expect(refuseWithoutFreshFare({ referenceAt: hoursAgo(30), now: NOW, waiverReason: "Client a confirmé par téléphone" })).toBeNull();
  });

  it("un dernier contrôle défavorable bloque même s'il est récent, jusqu'à dérogation", () => {
    expect(refuseWithoutFreshFare({ referenceAt: hoursAgo(1), now: NOW, lastCheck: "higher" })).toMatch(/hausse/);
    expect(refuseWithoutFreshFare({ referenceAt: hoursAgo(1), now: NOW, lastCheck: "not_found" })).toMatch(/n’apparaît plus/);
    expect(refuseWithoutFreshFare({ referenceAt: hoursAgo(1), now: NOW, lastCheck: "same" })).toBeNull();
    expect(refuseWithoutFreshFare({ referenceAt: hoursAgo(1), now: NOW, lastCheck: "higher", waiverReason: "Client prévenu de la hausse" })).toBeNull();
  });
});

describe("relevé en direct du tarif", () => {
  const flight = { origin: "NSI", destination: "CDG", departureDate: "2026-11-20", departureTime: "22:00", flightNumber: "AT 280", cabinClass: "ECONOMY", pricedPassengers: 2, totalPrice: 300_000 };
  const providerItem = (number: string, time: string, price: number) => ({ flights: [{ flight_number: number, airline: "Royal Air Maroc", departure_airport: { id: "NSI", date: "2026-11-20", time }, arrival_airport: { id: "CDG", time: "08:00" } }], total_duration: 600, price });
  const respond = (body: unknown, ok = true, status = 200) => vi.fn(async () => ({ ok, status, json: async () => body, text: async () => "" }) as any);

  it("retrouve le même vol (numéro, date, heure) et renvoie son tarif actuel en FCFA", async () => {
    const fetchImpl = respond({ best_flights: [providerItem("AT 999", "10:00", 100)], other_flights: [providerItem("AT 280", "22:00", 500)] });
    const result = await recheckLiveFare(flight, { apiKey: "k", fetchImpl });
    expect(result).toMatchObject({ status: "checked", found: true, newTotal: Math.round(500 * 655.957) });
    const url = new URL((fetchImpl.mock.calls[0] as any)[0]);
    expect(url.searchParams.get("adults")).toBe("2");
    expect(url.searchParams.get("flight_type")).toBe("one_way");
    expect(url.searchParams.get("departure_id")).toBe("NSI");
    expect(url.searchParams.get("outbound_date")).toBe("2026-11-20");
  });

  it("aller-retour : relevé en aller-retour avec la date du retour choisi", async () => {
    const fetchImpl = respond({ best_flights: [providerItem("AT 280", "22:00", 500)] });
    await recheckLiveFare({ ...flight, returnFlight: { departureDate: "2027-01-10" } }, { apiKey: "k", fetchImpl });
    const url = new URL((fetchImpl.mock.calls[0] as any)[0]);
    expect(url.searchParams.get("flight_type")).toBe("round_trip");
    expect(url.searchParams.get("return_date")).toBe("2027-01-10");
  });

  it("vol absent des résultats : found = false, aucun tarif inventé", async () => {
    const result = await recheckLiveFare(flight, { apiKey: "k", fetchImpl: respond({ best_flights: [providerItem("AT 999", "10:00", 100)] }) });
    expect(result).toMatchObject({ status: "checked", found: false, newTotal: null });
  });

  it("clé absente, fournisseur en erreur, panne réseau ou parcours illisible : « unavailable », jamais de tarif", async () => {
    expect(await recheckLiveFare(flight, { apiKey: "", fetchImpl: respond({}) })).toMatchObject({ status: "unavailable" });
    expect(await recheckLiveFare(flight, { apiKey: "k", fetchImpl: respond({}, false, 429) })).toMatchObject({ status: "unavailable", reason: expect.stringContaining("429") });
    expect(await recheckLiveFare(flight, { apiKey: "k", fetchImpl: vi.fn(async () => { throw new Error("réseau coupé"); }) as any })).toMatchObject({ status: "unavailable", reason: "réseau coupé" });
    expect(await recheckLiveFare({ ...flight, departureDate: "bientôt" }, { apiKey: "k", fetchImpl: respond({}) })).toMatchObject({ status: "unavailable" });
  });
});

// ─── Relances et suivi ──────────────────────────────────────────────────────────────────────────────────────────

describe("relance d'un devis non payé", () => {
  const base = { status: "revalidated", clientValidated: false, awaitingSince: hoursAgo(25), remindersSent: 0, lastReminderAt: null as Date | null, departureAt: at("2026-12-20T22:00:00Z"), optedOut: false, now: NOW };

  it("première relance à 24 h, seconde à 48 h, jamais une troisième", () => {
    expect(planQuoteReminder({ ...base, awaitingSince: hoursAgo(23) })).toMatchObject({ due: false, reason: "trop tôt" });
    expect(planQuoteReminder(base)).toEqual({ due: true, stage: 1 });
    expect(planQuoteReminder({ ...base, awaitingSince: hoursAgo(30), remindersSent: 1, lastReminderAt: hoursAgo(5) })).toMatchObject({ due: false });
    expect(planQuoteReminder({ ...base, awaitingSince: hoursAgo(49), remindersSent: 1, lastReminderAt: hoursAgo(24) })).toEqual({ due: true, stage: 2 });
    expect(planQuoteReminder({ ...base, awaitingSince: hoursAgo(100), remindersSent: 2, lastReminderAt: hoursAgo(30) })).toMatchObject({ due: false, reason: "maximum atteint" });
  });

  it("jamais pour un client qui a déclaré ou fait confirmer son paiement (« revalidé » après paiement confirmé)", () => {
    expect(planQuoteReminder({ ...base, status: "revalidated", clientValidated: true })).toMatchObject({ due: false });
    expect(planQuoteReminder({ ...base, status: "awaiting_payment", clientValidated: true })).toMatchObject({ due: false });
    expect(planQuoteReminder({ ...base, status: "awaiting_payment", clientValidated: false })).toEqual({ due: true, stage: 1 });
    for (const status of ["pending_review", "assigned", "needs_info", "issued", "cancelled"]) expect(planQuoteReminder({ ...base, status }).due).toBe(false);
  });

  it("stop : désinscrit, départ passé, date d'attente inconnue", () => {
    expect(planQuoteReminder({ ...base, optedOut: true })).toMatchObject({ due: false, reason: "désinscrit" });
    expect(planQuoteReminder({ ...base, departureAt: hoursAgo(1) })).toMatchObject({ due: false, reason: "départ passé" });
    expect(planQuoteReminder({ ...base, awaitingSince: null })).toMatchObject({ due: false });
  });
});

describe("rappel avant le départ", () => {
  const depart = (hours: number) => new Date(NOW.getTime() + hours * 3_600_000);
  it("billet émis, départ dans 3 jours ou moins, une seule fois, jamais après le départ", () => {
    expect(planPreDepartureReminder({ status: "issued", departureAt: depart(60), alreadySent: false, now: NOW })).toBe(true);
    expect(planPreDepartureReminder({ status: "issued", departureAt: depart(72), alreadySent: false, now: NOW })).toBe(true);
    expect(planPreDepartureReminder({ status: "issued", departureAt: depart(73), alreadySent: false, now: NOW })).toBe(false);
    expect(planPreDepartureReminder({ status: "issued", departureAt: depart(-2), alreadySent: false, now: NOW })).toBe(false);
    expect(planPreDepartureReminder({ status: "issued", departureAt: depart(10), alreadySent: true, now: NOW })).toBe(false);
    expect(planPreDepartureReminder({ status: "revalidated", departureAt: depart(10), alreadySent: false, now: NOW })).toBe(false);
    expect(planPreDepartureReminder({ status: "issued", departureAt: null, alreadySent: false, now: NOW })).toBe(false);
  });

  it("date de départ lue depuis le vol enregistré ; illisible = null", () => {
    expect(departureAtOf({ departureDate: "2026-12-20", departureTime: "22:00" })?.toISOString()).toBe("2026-12-20T22:00:00.000Z");
    expect(departureAtOf({ departureDate: "2026-12-20" })).not.toBeNull();
    expect(departureAtOf({ departureDate: "20/12/2026" })).toBeNull();
    expect(departureAtOf(undefined)).toBeNull();
  });
});

describe("tableau de bord du comptoir", () => {
  const request = (id: number, overrides: Partial<DeskRequest> = {}): DeskRequest => ({ id, requestRef: `3M-FL-${id}`, status: "pending_review", priority: "normal", clientValidated: false, assignedAgentEmail: null, createdAt: hoursAgo(30), pnrReference: null, issuedPdfUrl: null, flightData: { departureDate: "2027-03-01" }, ...overrides });
  const row = (requestId: number, action: string, hours: number, extra: Partial<HistoryRow> = {}): HistoryRow => ({ requestId, action, createdAt: hoursAgo(hours), ...extra });

  it("délais médians depuis la création : première réponse du comptoir, paiement confirmé, émission — sans compter les actions du client", () => {
    const requests = [request(1, { createdAt: hoursAgo(50) }), request(2, { createdAt: hoursAgo(50) }), request(3, { createdAt: hoursAgo(50) })];
    const history = [
      row(1, "created", 50), row(1, "traveler_details_submitted", 49), row(1, "assigned", 46), row(1, "payment_approved", 40), row(1, "pnr_issued", 30),
      row(2, "created", 50), row(2, "client_change_request", 49), row(2, "status_changed", 44),
      row(3, "created", 50),
    ];
    expect(computeDeskStats(requests, history)).toEqual({ requests: 3, firstResponseMedianHours: 5, firstResponseCount: 2, paymentApprovalMedianHours: 10, paymentApprovalCount: 1, issuanceMedianHours: 20, issuanceCount: 1 });
  });

  it("aucune donnée : médianes nulles, pas de zéro trompeur", () => {
    expect(computeDeskStats([], [])).toMatchObject({ firstResponseMedianHours: null, paymentApprovalMedianHours: null, issuanceMedianHours: null });
  });

  it("à traiter : sans réponse après 12 h, paiement déclaré à vérifier après 24 h, billet sans document, départ proche non émis", () => {
    const requests = [
      request(1),
      request(2, { createdAt: hoursAgo(5) }),
      request(3, { status: "awaiting_payment", clientValidated: true }),
      request(4, { status: "issued", pnrReference: "ABC123" }),
      request(5, { status: "assigned", flightData: { departureDate: "2026-09-28", departureTime: "10:00" } }),
      request(6, { status: "issued", issuedPdfUrl: "https://x/y.pdf" }),
    ];
    const history = [row(1, "created", 30), row(3, "client_validated", 40), row(4, "pnr_issued", 3), row(5, "assigned", 20)];
    const stale = findStaleRequests(requests, history, NOW);
    expect(stale.map((item) => `${item.requestId}:${item.reason}`).sort()).toEqual(["1:no_response", "3:payment_to_verify", "4:issued_without_document", "5:departure_soon_unissued"]);
    expect(stale[0].requestId).toBe(3);
    expect(stale.find((item) => item.requestId === 3)?.hours).toBe(40);
  });

  it("une demande déjà prise en charge n'est plus « sans réponse » ; une action du client ne compte pas comme réponse", () => {
    expect(findStaleRequests([request(1)], [row(1, "assigned", 20)], NOW)).toEqual([]);
    expect(findStaleRequests([request(1)], [row(1, "client_change_request", 20)], NOW).map((item) => item.reason)).toEqual(["no_response"]);
  });
});

describe("demandes de modification (historique)", () => {
  it("ouverte tant qu'aucune ligne « traitée » ne porte son identifiant ; le type inconnu devient « autre »", () => {
    const history: HistoryRow[] = [
      { id: 1, requestId: 5, action: HISTORY.changeRequest, oldValue: "cancel", details: "Je ne peux plus voyager", createdAt: hoursAgo(30) },
      { id: 2, requestId: 5, action: HISTORY.changeHandled, newValue: "1", details: "Annulation faite", createdAt: hoursAgo(20) },
      { id: 3, requestId: 5, action: HISTORY.changeRequest, oldValue: "n'importe quoi", details: "Autre chose", createdAt: hoursAgo(5) },
    ];
    const list = collectChangeRequests(history);
    expect(list.map((change) => change.id)).toEqual([3, 1]);
    expect(list[0]).toMatchObject({ kind: "other", handledAt: null });
    expect(list[1]).toMatchObject({ kind: "cancel", handledNote: "Annulation faite" });
    expect(list[1].handledAt).not.toBeNull();
  });
});

// ─── Routeur ────────────────────────────────────────────────────────────────────────────────────────────────────

const flightRow = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  requestRef: "3M-FL-TEST",
  candidateId: 9,
  candidateEmail: "client@example.com",
  status: "revalidated",
  priority: "normal",
  clientValidated: false,
  assignedAgentEmail: null,
  pnrReference: null,
  issuedPdfUrl: null,
  issuanceChecklist: null,
  createdAt: hoursAgo(1),
  flightData: { origin: "NSI", destination: "CDG", originCity: "Yaoundé", destinationCity: "Paris", departureDate: "2026-12-20", departureTime: "22:00", flightNumber: "AT 280", cabinClass: "ECONOMY", pricedPassengers: 2, totalPrice: 300_000 },
  passengerData: [{ fullName: "Aïcha Nkolo", email: "client@example.com", travelers: 2 }],
  ...overrides,
});
const seed = (row = flightRow()) => state.rows.set(flightBookingRequests, [row]);
const traveler = (name: string, extra: Record<string, string> = {}) => ({ fullName: name, passportNumber: "ce123456", passportExpiry: "2031-05-01", dateOfBirth: "1994-03-12", ...extra });
const client = () => flightFollowUpRouter.createCaller({ req: { headers: {} } } as any);
const historyActions = () => (state.rows.get(flightBookingRequestHistory) ?? []).map((row) => row.action);

describe("voyageurs : enregistrement", () => {
  it("enregistre les deux voyageurs dans le premier passager, journalise et prévient l'administration", async () => {
    seed();
    const result = await client().submitTravelers({ requestId: 5, travelers: [traveler("Aïcha Nkolo"), traveler("Paul Mbarga")] });
    expect(result).toEqual({ success: true, warnings: [] });
    const saved = state.updates.find((entry) => entry.table === flightBookingRequests)!.values.passengerData;
    expect(saved[0].fullName).toBe("Aïcha Nkolo");
    expect(saved[0].travelerDetails).toHaveLength(2);
    expect(saved[0].travelerDetails[0].passportNumber).toBe("CE123456");
    expect(historyActions()).toEqual([HISTORY.travelerDetails]);
    expect(state.notified).toHaveLength(1);
    expect(state.notified[0].message).toContain("3M-FL-TEST");
  });

  it("refuse tout enregistrement avec une erreur (passeport expiré avant le retour) et n'écrit rien", async () => {
    seed();
    await expect(client().submitTravelers({ requestId: 5, travelers: [traveler("Aïcha Nkolo"), traveler("Paul Mbarga", { passportExpiry: "2026-11-01" })] })).rejects.toThrow(/Voyageur 2/);
    expect(state.updates).toHaveLength(0);
    expect(state.inserts).toHaveLength(0);
  });

  it("refuse un nombre de voyageurs inférieur à celui de la réservation", async () => {
    seed();
    await expect(client().submitTravelers({ requestId: 5, travelers: [traveler("Aïcha Nkolo")] })).rejects.toThrow(/2 voyageur\(s\) attendu/);
    expect(state.updates).toHaveLength(0);
  });

  it("un avertissement (moins de 6 mois de validité) n'empêche pas l'enregistrement mais est renvoyé", async () => {
    seed(flightRow({ passengerData: [{ email: "client@example.com", travelers: 1 }] }));
    const result = await client().submitTravelers({ requestId: 5, travelers: [traveler("Aïcha Nkolo", { passportExpiry: "2027-03-01" })] });
    expect(result.success).toBe(true);
    expect(result.warnings.join(" ")).toMatch(/6 mois/);
    expect(state.updates).toHaveLength(1);
  });

  it("aucune modification sur un billet émis ou une réservation annulée", async () => {
    for (const status of ["issued", "cancelled"]) {
      state.rows = new Map();
      seed(flightRow({ status }));
      await expect(client().submitTravelers({ requestId: 5, travelers: [traveler("Aïcha Nkolo"), traveler("Paul Mbarga")] })).rejects.toThrow(/terminée/);
    }
    expect(state.updates).toHaveLength(0);
  });

  it("le comptoir saisit les mêmes données avec les mêmes contrôles, sous son nom", async () => {
    seed();
    await client().adminSaveTravelers({ sessionToken: "t", requestId: 5, travelers: [traveler("Aïcha Nkolo"), traveler("Paul Mbarga")] });
    expect(state.rows.get(flightBookingRequestHistory)![0]).toMatchObject({ changedBy: "agent@3mtravelagency.com", action: HISTORY.travelerDetails });
    await expect(client().adminSaveTravelers({ sessionToken: "t", requestId: 5, travelers: [traveler("Aïcha 2"), traveler("Paul Mbarga")] })).rejects.toThrow(/lettres/);
  });
});

describe("demandes de modification : côté client", () => {
  it("crée la demande, alerte le comptoir, accuse réception au client et ne modifie pas la réservation", async () => {
    seed();
    const result = await client().requestChange({ requestId: 5, kind: "change_date", message: "Je voudrais partir le 27 décembre." });
    expect(result).toEqual({ success: true, deskNotified: true });
    expect(state.rows.get(flightBookingRequestHistory)![0]).toMatchObject({ action: HISTORY.changeRequest, oldValue: "change_date", details: "Je voudrais partir le 27 décembre.", changedBy: "client@example.com" });
    expect(state.updates).toHaveLength(0);
    expect(state.emails).toHaveLength(2);
    expect(state.emails[0].subject).toContain("Demande de modification");
    expect(state.emails[1].to).toBe("client@example.com");
    expect(state.emails[1].html).toContain("conditions de votre billet");
    expect(state.emails[1].html).not.toMatch(/remboursement garanti|sans frais/i);
    expect(state.notified).toHaveLength(1);
  });

  it("une seule demande ouverte à la fois ; une fois traitée, une nouvelle est possible", async () => {
    seed();
    await client().requestChange({ requestId: 5, kind: "cancel", message: "Je dois annuler mon voyage." });
    await expect(client().requestChange({ requestId: 5, kind: "other", message: "Une autre demande encore." })).rejects.toThrow(/déjà en cours/);
    const asked = state.rows.get(flightBookingRequestHistory)![0];
    await client().resolveChange({ sessionToken: "t", requestId: 5, historyId: asked.id, note: "Annulation enregistrée." });
    await expect(client().requestChange({ requestId: 5, kind: "other", message: "Une autre demande encore." })).resolves.toMatchObject({ success: true });
  });

  it("message trop court refusé ; réservation annulée refusée ; e-mail du comptoir en panne : la demande reste enregistrée", async () => {
    seed();
    await expect(client().requestChange({ requestId: 5, kind: "other", message: "court" })).rejects.toThrow();
    state.rows = new Map();
    seed(flightRow({ status: "cancelled" }));
    await expect(client().requestChange({ requestId: 5, kind: "other", message: "Une demande valable ici." })).rejects.toThrow(/déjà annulée/);
    state.rows = new Map();
    seed();
    state.failEmailTo = "hello@3mtravelagency.com";
    const result = await client().requestChange({ requestId: 5, kind: "other", message: "Une demande valable ici." });
    expect(result).toEqual({ success: true, deskNotified: false });
    expect(historyActions()).toEqual([HISTORY.changeRequest]);
  });

  it("l'aperçu de l'espace client donne voyageurs attendus/saisis et l'état des demandes", async () => {
    seed(flightRow({ passengerData: [{ travelers: 2, travelerDetails: [traveler("Aïcha Nkolo"), traveler("Paul Mbarga")] }] }));
    state.rows.set(flightBookingRequestHistory, [
      { id: 1, requestId: 5, action: HISTORY.changeRequest, oldValue: "cancel", details: "Annuler svp.", createdAt: hoursAgo(10) },
      { id: 2, requestId: 5, action: HISTORY.changeHandled, newValue: "1", details: "Fait.", createdAt: hoursAgo(5) },
    ]);
    const overview = await client().myOverview();
    expect(overview).toHaveLength(1);
    expect(overview[0].travelers).toMatchObject({ expected: 2, provided: 2, complete: true });
    expect(overview[0].changeRequests[0]).toMatchObject({ id: 1, kind: "cancel", handled: true, handledNote: "Fait." });
  });

  it("chaque écriture du client est limitée à SES réservations et le routeur est enregistré", () => {
    const source = read("server/routers/flightFollowUp.ts");
    for (const name of ["submitTravelers", "requestChange"]) {
      const section = source.slice(source.indexOf(`${name}: candidateProcedure`), source.indexOf(`${name}: candidateProcedure`) + 700);
      expect(section, name).toContain("eq(flightBookingRequests.candidateId, ctx.candidate.id)");
    }
    expect(source.slice(source.indexOf("myOverview"), source.indexOf("myOverview") + 500)).toContain("eq(flightBookingRequests.candidateId, ctx.candidate.id)");
    expect(read("server/routers.ts")).toContain("flightFollowUp: flightFollowUpRouter");
  });
});

describe("demandes de modification : côté comptoir", () => {
  it("clôture, prévient le client avec la réponse de l'agence, et reste sans effet la deuxième fois", async () => {
    seed();
    state.rows.set(flightBookingRequestHistory, [{ id: 7, requestId: 5, action: HISTORY.changeRequest, oldValue: "change_date", details: "Décaler d'une semaine", createdAt: hoursAgo(3) }]);
    const first = await client().resolveChange({ sessionToken: "t", requestId: 5, historyId: 7, note: "Possible avec 45 000 FCFA de frais de compagnie." });
    expect(first).toEqual({ success: true, alreadyHandled: false, notified: true });
    expect(state.emails[0].to).toBe("client@example.com");
    expect(state.emails[0].html).toContain("Possible avec 45 000 FCFA");
    const second = await client().resolveChange({ sessionToken: "t", requestId: 5, historyId: 7, note: "" });
    expect(second).toEqual({ success: true, alreadyHandled: true, notified: false });
    expect(state.emails).toHaveLength(1);
  });

  it("demande inconnue : introuvable ; e-mail en panne : clôturée mais le comptoir est prévenu de contacter le client", async () => {
    seed();
    await expect(client().resolveChange({ sessionToken: "t", requestId: 5, historyId: 999, note: "" })).rejects.toThrow(/introuvable/);
    state.rows.set(flightBookingRequestHistory, [{ id: 7, requestId: 5, action: HISTORY.changeRequest, oldValue: "other", details: "Question", createdAt: hoursAgo(3) }]);
    state.failEmailTo = "client@example.com";
    expect(await client().resolveChange({ sessionToken: "t", requestId: 5, historyId: 7, note: "" })).toEqual({ success: true, alreadyHandled: false, notified: false });
  });

  it("le tableau de bord réunit statistiques, demandes à traiter et modifications ouvertes", async () => {
    state.rows.set(flightBookingRequests, [flightRow({ id: 1, requestRef: "R1", status: "pending_review", createdAt: hoursAgo(30) }), flightRow({ id: 2, requestRef: "R2", status: "assigned", createdAt: hoursAgo(20) })]);
    state.rows.set(flightBookingRequestHistory, [
      { id: 1, requestId: 1, action: "created", createdAt: hoursAgo(30) },
      { id: 2, requestId: 2, action: "created", createdAt: hoursAgo(20) },
      { id: 3, requestId: 2, action: "assigned", createdAt: hoursAgo(18) },
      { id: 4, requestId: 2, action: HISTORY.changeRequest, oldValue: "cancel", details: "Annuler", createdAt: hoursAgo(2) },
    ]);
    const overview = await client().deskOverview({ sessionToken: "t" });
    expect(overview.stats).toMatchObject({ requests: 2, firstResponseMedianHours: 2, firstResponseCount: 1 });
    expect(overview.stale).toEqual([expect.objectContaining({ requestRef: "R1", reason: "no_response", label: "Aucune réponse du comptoir", hours: 30 })]);
    expect(overview.openChanges).toEqual([expect.objectContaining({ requestRef: "R2", kind: "cancel", historyId: 4 })]);
  });
});

describe("revérification du tarif (routeur)", () => {
  const providerBody = (price: number) => ({ best_flights: [{ flights: [{ flight_number: "AT 280", airline: "Royal Air Maroc", departure_airport: { id: "NSI", date: "2026-12-20", time: "22:00" }, arrival_airport: { id: "CDG", time: "08:00" } }], total_duration: 600, price }] });
  const stubProvider = (body: unknown, ok = true) => { process.env.SEARCHAPI_KEY = "test-key"; vi.stubGlobal("fetch", vi.fn(async () => ({ ok, status: ok ? 200 : 503, json: async () => body, text: async () => "" }))); };

  it("hausse : journalise ancien tarif, résultat et description, et le dit au conseiller", async () => {
    seed();
    stubProvider(providerBody(500)); // 500 € ≈ 327 979 FCFA contre 300 000 enregistrés
    const result = await client().recheckFare({ sessionToken: "t", requestId: 5 });
    expect(result.comparison).toMatchObject({ kind: "higher", oldTotal: 300_000 });
    expect(result.description).toMatch(/hausse/);
    expect(result.retrievedAt).not.toBeNull();
    expect(state.rows.get(flightBookingRequestHistory)![0]).toMatchObject({ action: HISTORY.fareChecked, oldValue: "300000", newValue: "higher", changedBy: "agent@3mtravelagency.com" });
  });

  it("fournisseur muet : « unavailable » journalisé avec le motif ; vol disparu : « not_found »", async () => {
    seed();
    stubProvider({}, false);
    expect((await client().recheckFare({ sessionToken: "t", requestId: 5 })).comparison.kind).toBe("unavailable");
    stubProvider({ best_flights: [] });
    expect((await client().recheckFare({ sessionToken: "t", requestId: 5 })).comparison.kind).toBe("not_found");
    expect((state.rows.get(flightBookingRequestHistory) ?? []).map((row) => row.newValue)).toEqual(["unavailable", "not_found"]);
  });

  it("refuse sans tarif initial enregistré, et sur un billet émis ou une demande annulée", async () => {
    seed(flightRow({ flightData: { origin: "NSI", destination: "CDG" } }));
    await expect(client().recheckFare({ sessionToken: "t", requestId: 5 })).rejects.toThrow(/tarif initial/);
    state.rows = new Map();
    seed(flightRow({ status: "issued" }));
    await expect(client().recheckFare({ sessionToken: "t", requestId: 5 })).rejects.toThrow(/déjà émis/);
  });
});

// ─── Garde-fous du parcours de réservation ──────────────────────────────────────────────────────────────────────

describe("demander un paiement : tarif relevé récemment", () => {
  const admin = () => flightBookingRouter.createCaller({ req: { headers: {} } } as any);

  it("tarif de plus de 12 h sans contrôle : refus ; avec dérogation motivée : accepté et journalisé dans l'historique", async () => {
    seed(flightRow({ status: "assigned", createdAt: hoursAgo(30) }));
    await expect(admin().updateStatus({ sessionToken: "t", requestId: 5, status: "awaiting_payment" })).rejects.toThrow(/dérogation motivée/);
    expect(state.updates).toHaveLength(0);
    await admin().updateStatus({ sessionToken: "t", requestId: 5, status: "awaiting_payment", fareWaiverReason: "Client a confirmé le tarif par téléphone" });
    expect(state.updates[0].values).toMatchObject({ status: "awaiting_payment" });
    expect(state.rows.get(flightBookingRequestHistory)![0].details).toContain("Dérogation au contrôle du tarif : Client a confirmé le tarif par téléphone");
  });

  it("tarif récent : accepté sans formalité ; un contrôle récent le rafraîchit", async () => {
    seed(flightRow({ status: "assigned", createdAt: hoursAgo(2) }));
    await admin().updateStatus({ sessionToken: "t", requestId: 5, status: "revalidated" });
    expect(state.updates).toHaveLength(1);
    state.updates = [];
    state.rows = new Map();
    seed(flightRow({ status: "assigned", createdAt: hoursAgo(40) }));
    state.rows.set(flightBookingRequestHistory, [{ id: 1, requestId: 5, action: HISTORY.fareChecked, newValue: "same", createdAt: hoursAgo(1) }]);
    await admin().updateStatus({ sessionToken: "t", requestId: 5, status: "revalidated" });
    expect(state.updates).toHaveLength(1);
  });

  it("dernier contrôle en hausse : refus tant que le conseiller ne motive pas la dérogation", async () => {
    seed(flightRow({ status: "assigned", createdAt: hoursAgo(2) }));
    state.rows.set(flightBookingRequestHistory, [{ id: 1, requestId: 5, action: HISTORY.fareChecked, newValue: "higher", createdAt: hoursAgo(1) }]);
    await expect(admin().updateStatus({ sessionToken: "t", requestId: 5, status: "awaiting_payment" })).rejects.toThrow(/hausse/);
  });

  it("les autres changements de statut ne demandent aucun contrôle de tarif", async () => {
    seed(flightRow({ status: "assigned", createdAt: hoursAgo(200) }));
    await admin().updateStatus({ sessionToken: "t", requestId: 5, status: "needs_info", details: "Merci de préciser vos dates." });
    await admin().updateStatus({ sessionToken: "t", requestId: 5, status: "cancelled" });
    expect(state.updates).toHaveLength(2);
  });
});

describe("émettre un billet : passeports des voyageurs", () => {
  const admin = () => flightBookingRouter.createCaller({ req: { headers: {} } } as any);
  const fullChecklist = { identity_verified: true, passport_valid: true, fare_revalidated: true, payment_verified: true, pnr_document_ready: true };

  it("refusée sans données passeport (ou avec un passeport expiré avant le retour), même checklist complète", async () => {
    seed(flightRow({ status: "revalidated", issuanceChecklist: fullChecklist, clientValidated: true }));
    await expect(admin().updatePnrAndIssuedPdf({ sessionToken: "t", requestId: 5, pnrReference: "ABC123", advisorInitials: "AD" })).rejects.toThrow(/données passeport/);
    state.rows = new Map();
    seed(flightRow({ status: "revalidated", issuanceChecklist: fullChecklist, passengerData: [{ travelers: 1, travelerDetails: [traveler("Aïcha Nkolo", { passportExpiry: "2026-11-01" })] }], flightData: { ...flightRow().flightData, pricedPassengers: 1 } }));
    await expect(admin().updatePnrAndIssuedPdf({ sessionToken: "t", requestId: 5, pnrReference: "ABC123", advisorInitials: "AD" })).rejects.toThrow(/expire avant la fin du voyage/);
    expect(state.updates).toHaveLength(0);
  });

  it("acceptée quand tous les voyageurs sont saisis et valides", async () => {
    seed(flightRow({ status: "revalidated", issuanceChecklist: fullChecklist, passengerData: [{ travelers: 2, travelerDetails: [traveler("Aïcha Nkolo"), traveler("Paul Mbarga")] }] }));
    await expect(admin().updatePnrAndIssuedPdf({ sessionToken: "t", requestId: 5, pnrReference: "ABC123", advisorInitials: "AD" })).resolves.toMatchObject({ success: true });
    expect(state.updates.some((entry) => entry.values.status === "issued")).toBe(true);
  });

  it("la même règle protège l'émission avec document PDF, avant tout téléversement", () => {
    const source = read("server/routers/flightBooking.ts");
    const upload = source.slice(source.indexOf("adminUploadPnrDocument: publicProcedure"), source.indexOf("exportAuditHistoryPdf"));
    expect(upload.indexOf("travelerRefusal(existing")).toBeGreaterThan(-1);
    expect(upload.indexOf("travelerRefusal(existing")).toBeLessThan(upload.indexOf("storagePut("));
  });
});

// ─── Tâche planifiée ────────────────────────────────────────────────────────────────────────────────────────────

describe("tâche quotidienne : relances des vols", () => {
  const unpaid = (id: number, overrides: Record<string, unknown> = {}) => flightRow({ id, requestRef: `3M-FL-${id}`, candidateEmail: `client${id}@example.com`, status: "revalidated", ...overrides });
  const asked = (id: number, hours: number) => ({ id: 500 + id, requestId: id, action: "status_changed", newValue: "revalidated", createdAt: hoursAgo(hours) });

  it("relance 1 d'un devis en attente depuis plus de 24 h : e-mail avec lien de paiement et désinscription, inscrit dans l'historique", async () => {
    state.rows.set(flightBookingRequests, [unpaid(1)]);
    state.rows.set(flightBookingRequestHistory, [asked(1, 26)]);
    const outcomes = await runFlightFollowUps((await (await import("./db")).getDb())!, { now: NOW });
    expect(outcomes).toEqual([{ requestRef: "3M-FL-1", kind: "quote_reminder", stage: 1, sent: true }]);
    expect(state.emails).toHaveLength(1);
    expect(state.emails[0].to).toBe("client1@example.com");
    expect(state.emails[0].html).toContain("/paiement?ref=3M-FL-1");
    expect(state.emails[0].html).toContain("/api/reminders/stop?e=client1%40example.com&amp;t=");
    expect(state.inserts.filter((entry) => entry.table === flightBookingRequestHistory).map((entry) => entry.values.action)).toEqual([HISTORY.quoteReminder]);
  });

  it("aperçu (dryRun) : liste ce qui partirait, n'envoie ni n'écrit rien", async () => {
    state.rows.set(flightBookingRequests, [unpaid(1)]);
    state.rows.set(flightBookingRequestHistory, [asked(1, 26)]);
    const outcomes = await runFlightFollowUps((await (await import("./db")).getDb())!, { now: NOW, dryRun: true });
    expect(outcomes).toEqual([{ requestRef: "3M-FL-1", kind: "quote_reminder", stage: 1, sent: false }]);
    expect(state.emails).toHaveLength(0);
    expect(state.inserts).toHaveLength(0);
  });

  it("trop tôt, paiement déjà déclaré ou confirmé : aucune relance", async () => {
    state.rows.set(flightBookingRequests, [unpaid(1), unpaid(2, { status: "awaiting_payment", clientValidated: true }), unpaid(3, { clientValidated: true })]);
    state.rows.set(flightBookingRequestHistory, [asked(1, 10), asked(2, 40), asked(3, 40)]);
    expect(await runFlightFollowUps((await (await import("./db")).getDb())!, { now: NOW })).toEqual([]);
    expect(state.emails).toHaveLength(0);
  });

  it("une relance déjà envoyée depuis la demande de règlement compte ; une nouvelle demande de règlement repart de zéro", async () => {
    state.rows.set(flightBookingRequests, [unpaid(1)]);
    state.rows.set(flightBookingRequestHistory, [asked(1, 60), { id: 900, requestId: 1, action: HISTORY.quoteReminder, newValue: "1", createdAt: hoursAgo(30) }]);
    expect((await runFlightFollowUps((await (await import("./db")).getDb())!, { now: NOW, dryRun: true })).map((outcome) => outcome.stage)).toEqual([2]);
    state.rows.set(flightBookingRequestHistory, [{ id: 900, requestId: 1, action: HISTORY.quoteReminder, newValue: "1", createdAt: hoursAgo(80) }, asked(1, 26)]);
    expect((await runFlightFollowUps((await (await import("./db")).getDb())!, { now: NOW, dryRun: true })).map((outcome) => outcome.stage)).toEqual([1]);
  });

  it("désinscrit : ni relance de devis ni rappel de départ", async () => {
    state.rows.set(flightBookingRequests, [unpaid(1), flightRow({ id: 2, requestRef: "3M-FL-2", status: "issued", flightData: { originCity: "Yaoundé", destinationCity: "Paris", departureDate: "2026-09-28", departureTime: "10:00" } })]);
    state.rows.set(flightBookingRequestHistory, [asked(1, 26)]);
    state.rows.set(agencySettings, [{ id: 1, settingKey: "opted" }]);
    expect(await runFlightFollowUps((await (await import("./db")).getDb())!, { now: NOW })).toEqual([]);
  });

  it("rappel avant départ : billet émis qui part dans moins de 3 jours, une seule fois, sans horaire d'enregistrement inventé", async () => {
    state.rows.set(flightBookingRequests, [flightRow({ id: 2, requestRef: "3M-FL-2", status: "issued", pnrReference: "XYZ789", flightData: { originCity: "Yaoundé", destinationCity: "Paris", departureDate: "2026-09-28", departureTime: "10:00" } })]);
    const first = await runFlightFollowUps((await (await import("./db")).getDb())!, { now: NOW });
    expect(first).toEqual([{ requestRef: "3M-FL-2", kind: "pre_departure", stage: 1, sent: true }]);
    expect(state.emails[0].subject).toContain("Votre départ approche");
    expect(state.emails[0].html).toContain("XYZ789");
    expect(state.emails[0].html).toContain("Yaoundé → Paris");
    expect(state.emails[0].html).not.toMatch(/\d+\s*h(eures)? avant/i);
    const second = await runFlightFollowUps((await (await import("./db")).getDb())!, { now: NOW });
    expect(second).toEqual([]);
    expect(state.emails).toHaveLength(1);
  });

  it("un envoi en échec n'arrête pas les autres demandes et n'est pas inscrit comme envoyé", async () => {
    state.rows.set(flightBookingRequests, [unpaid(1), unpaid(2)]);
    state.rows.set(flightBookingRequestHistory, [asked(1, 26), asked(2, 26)]);
    state.failEmailTo = "client1@example.com";
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const outcomes = await runFlightFollowUps((await (await import("./db")).getDb())!, { now: NOW });
    errors.mockRestore();
    expect(outcomes).toEqual([{ requestRef: "3M-FL-1", kind: "quote_reminder", stage: 0, sent: false, error: "échec" }, { requestRef: "3M-FL-2", kind: "quote_reminder", stage: 1, sent: true }]);
    expect(state.inserts.filter((entry) => entry.table === flightBookingRequestHistory)).toHaveLength(1);
  });

  it("la tâche des documents lance ces relances sans qu'un échec ici masque les documents", () => {
    const job = read("server/scheduled/documentReminderJob.ts");
    expect(job).toContain("runFlightFollowUps(db, { dryRun })");
    const call = job.indexOf("runFlightFollowUps(db, { dryRun })");
    expect(job.slice(job.lastIndexOf("try {", call), call)).toBeTruthy();
    expect(job.slice(call, call + 200)).toContain("catch");
  });

  it("types de demandes proposés au client", () => {
    expect([...CHANGE_KINDS]).toEqual(["change_date", "cancel", "correct_name", "other"]);
  });
});
