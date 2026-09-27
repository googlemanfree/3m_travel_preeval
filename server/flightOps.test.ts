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
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: (table: any) => { const chain: any = { where: () => chain, orderBy: () => chain, limit: () => chain, offset: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.rows.get(table) ?? []) }; return chain; } }),
    insert: (table: any) => ({ values: async (values: any) => { const row = { id: state.nextId++, createdAt: new Date(), ...values }; state.inserts.push({ table, values }); state.rows.set(table, [...(state.rows.get(table) ?? []), row]); } }),
    update: (table: any) => ({ set: (values: any) => ({ where: async () => { state.updates.push({ table, values }); state.rows.set(table, (state.rows.get(table) ?? []).map((row) => ({ ...row, ...values }))); } }) }),
  }),
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "agent@3mtravelagency.com" }) }));
vi.mock("./_core/email", () => ({ sendEmail: async (message: any) => { state.emails.push(message); } }));
vi.mock("./routers/adminNotifications", () => ({ notifyAdmins: async (input: any) => { state.notified.push(input); } }));
vi.mock("./routers/candidate", async () => {
  const { publicProcedure } = await import("./_core/trpc");
  return { candidateProcedure: publicProcedure.use(async ({ next }) => next({ ctx: { candidate: { id: 9, email: "client@example.com" } } as any })), findCandidateFromAuthorizationHeader: async () => null, getOrCreateCandidateForPlatformUser: async () => null };
});

import { flightBookingRequestHistory, flightBookingRequests } from "../drizzle/schema";
import { airportForDestination, flightsLinkForDestination } from "../shared/destinationAirports";
import { buildDeskAlertText, extractDeskAlertData } from "../shared/flightDeskAlert";
import { DESK_THRESHOLDS, HISTORY, computeFunnel, currentOptionDeadline, findStaleRequests, planNeedsInfoReminder, type DeskRequest, type HistoryRow } from "../shared/flightFollowUps";
import { flightNextStep } from "../shared/flightRequestStatus";
import { assessTravelers, expectedTravelerCount } from "../shared/flightTravelerCheck";
import { buildDeskAlertEmail } from "./services/flightDeskAlert";
import { buildBookingConfirmationEmail } from "./services/flightBookingConfirmation";
import { createTravelSheetPdf, sheetLegs, travelSheetAttachment } from "./services/flightTravelSheet";
import { flightBookingRouter } from "./routers/flightBooking";
import { flightFollowUpRouter } from "./routers/flightFollowUp";
import { runFlightFollowUps } from "./scheduled/flightFollowUps";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const NOW = new Date("2026-09-26T12:00:00Z");
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000);
const inHours = (hours: number) => new Date(NOW.getTime() + hours * 3_600_000);
const db = async () => (await (await import("./db")).getDb())!;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  state.rows = new Map();
  state.inserts = [];
  state.updates = [];
  state.emails = [];
  state.notified = [];
  state.nextId = 100;
});
afterEach(() => vi.useRealTimers());

const traveler = (name: string, extra: Record<string, string> = {}) => ({ fullName: name, passportNumber: "CE123456", passportExpiry: "2031-05-01", dateOfBirth: "1994-03-12", ...extra });
const flightRow = (overrides: Record<string, unknown> = {}) => ({
  id: 5, requestRef: "3M-FL-TEST", flightId: "SA-0-AT 280", candidateId: 9, candidateEmail: "client@example.com", status: "revalidated", priority: "normal", clientValidated: false, assignedAgentEmail: null, pnrReference: null, issuedPdfUrl: null, issuanceChecklist: null, createdAt: hoursAgo(1),
  flightData: { origin: "NSI", destination: "CDG", originCity: "Yaoundé", destinationCity: "Paris", departureDate: "2026-12-20", departureTime: "22:00", flightNumber: "AT 280", cabinClass: "ECONOMY", pricedPassengers: 1, totalPrice: 300_000, airline: { name: "Royal Air Maroc" } },
  passengerData: [{ fullName: "Aïcha Nkolo", email: "client@example.com", travelers: 1 }],
  ...overrides,
});
const seed = (row = flightRow()) => state.rows.set(flightBookingRequests, [row]);
const api = (headers: Record<string, string> = {}) => flightFollowUpRouter.createCaller({ req: { headers } } as any);

// ─── Bébés ──────────────────────────────────────────────────────────────────────────────────────────────────────

describe("bébés : tarif à chiffrer et passeport à recueillir", () => {
  const flight = { pricedPassengers: 2 };
  it("les bébés s'ajoutent aux voyageurs attendus (chacun a son passeport), plafonnés à 9", () => {
    expect(expectedTravelerCount(flight, [{ travelers: 2, infants: 1 }])).toBe(3);
    expect(expectedTravelerCount(flight, [{ infants: 2 }])).toBe(4);
    expect(expectedTravelerCount(flight, [{ travelers: 9, infants: 4 }])).toBe(9);
    expect(expectedTravelerCount(flight, [{ travelers: 2, infants: 99 }])).toBe(2);
    expect(expectedTravelerCount(flight, [{ travelers: 2 }])).toBe(2);
  });

  it("l'émission attend aussi le passeport du bébé", () => {
    const two = assessTravelers({ flightData: { departureDate: "2026-12-20" }, passengerData: [{ travelers: 1, infants: 1, travelerDetails: [traveler("Aïcha Nkolo")] }], today: NOW });
    expect(two.complete).toBe(false);
    expect(two.messages[0]).toContain("1 voyageur(s) renseigné(s) sur 2");
  });

  it("l'alerte du comptoir signale le tarif bébé non inclus (texte et e-mail) ; rien sans bébé", () => {
    const data = extractDeskAlertData({ requestRef: "R1", flightData: { departureDate: "2026-12-20" }, passengerData: [{ fullName: "A B", travelers: 2, infants: 1 }], requesterEmail: "a@b.cd" });
    expect(data.infants).toBe(1);
    expect(buildDeskAlertText(data)).toContain("BÉBÉ(S) : 1");
    expect(buildDeskAlertText(data)).toContain("NON inclus");
    expect(buildDeskAlertEmail(data, { adminUrl: "https://x/admin", deskWhatsApp: "237698104832" }).html).toContain("Bébé(s)");
    const none = extractDeskAlertData({ requestRef: "R1", flightData: {}, passengerData: [{ fullName: "A B" }], requesterEmail: "a@b.cd" });
    expect(none.infants).toBe(0);
    expect(buildDeskAlertText(none)).not.toContain("BÉBÉ");
    expect(buildDeskAlertEmail(none, { adminUrl: "https://x/admin", deskWhatsApp: "237698104832" }).html).not.toContain("Bébé(s)");
  });

  it("le formulaire de réservation envoie adultes + enfants et bébés", () => {
    const page = read("client/src/pages/FlightBookingCheckout.tsx");
    expect(page).toContain("infants: selection?.searchParams.infants ?? 0");
    expect(page).toContain("(selection?.searchParams.adults ?? 1) + (selection?.searchParams.children ?? 0)");
  });
});

// ─── Option de réservation ──────────────────────────────────────────────────────────────────────────────────────

describe("échéance de l'option de réservation", () => {
  const row = (action: string, newValue: string | null, hours: number): HistoryRow => ({ requestId: 5, action, newValue, createdAt: hoursAgo(hours) });
  it("la ligne la plus récente fait foi ; vide = effacée ; date illisible = aucune", () => {
    expect(currentOptionDeadline([])).toBeNull();
    expect(currentOptionDeadline([row(HISTORY.optionDeadline, inHours(10).toISOString(), 5), row(HISTORY.optionDeadline, inHours(30).toISOString(), 1)])?.toISOString()).toBe(inHours(30).toISOString());
    expect(currentOptionDeadline([row(HISTORY.optionDeadline, inHours(10).toISOString(), 5), row(HISTORY.optionDeadline, null, 1)])).toBeNull();
    expect(currentOptionDeadline([row(HISTORY.optionDeadline, "n'importe quoi", 1)])).toBeNull();
    expect(currentOptionDeadline([row("status_changed", inHours(10).toISOString(), 1)])).toBeNull();
  });

  const request = (id: number, overrides: Partial<DeskRequest> = {}): DeskRequest => ({ id, requestRef: `R${id}`, status: "assigned", priority: "normal", clientValidated: false, assignedAgentEmail: "x@y.z", createdAt: hoursAgo(2), pnrReference: null, issuedPdfUrl: null, flightData: { departureDate: "2027-03-01" }, ...overrides });
  it("à traiter : option qui expire dans 6 h ou moins, ou déjà expirée ; pas avant, pas sur un billet émis", () => {
    const history: HistoryRow[] = [
      { id: 1, requestId: 1, action: "assigned", createdAt: hoursAgo(1) },
      { requestId: 1, action: HISTORY.optionDeadline, newValue: inHours(5).toISOString(), createdAt: hoursAgo(1) },
      { requestId: 2, action: HISTORY.optionDeadline, newValue: inHours(20).toISOString(), createdAt: hoursAgo(1) },
      { requestId: 3, action: HISTORY.optionDeadline, newValue: hoursAgo(3).toISOString(), createdAt: hoursAgo(9) },
      { requestId: 4, action: HISTORY.optionDeadline, newValue: inHours(2).toISOString(), createdAt: hoursAgo(1) },
    ];
    const stale = findStaleRequests([request(1), request(2), request(3), request(4, { status: "issued", issuedPdfUrl: "https://x/y.pdf" })], history, NOW);
    expect(stale.map((item) => `${item.requestId}:${item.reason}:${item.hours}`).sort()).toEqual(["1:option_expiring:5", "3:option_expired:3"]);
    expect(DESK_THRESHOLDS.optionWarningHours).toBe(6);
  });

  it("le comptoir enregistre, remplace et efface l'échéance ; passée, invalide ou billet émis : refusé", async () => {
    seed(flightRow({ status: "assigned" }));
    const first = await api().setOptionDeadline({ sessionToken: "t", requestId: 5, deadline: inHours(48).toISOString(), note: "Option Royal Air Maroc" });
    expect(first.deadline).toBe(inHours(48).toISOString());
    expect(state.rows.get(flightBookingRequestHistory)![0]).toMatchObject({ action: HISTORY.optionDeadline, newValue: inHours(48).toISOString(), changedBy: "agent@3mtravelagency.com" });
    expect(state.rows.get(flightBookingRequestHistory)![0].details).toContain("Option Royal Air Maroc");
    expect((await api().setOptionDeadline({ sessionToken: "t", requestId: 5, deadline: null })).deadline).toBeNull();
    await expect(api().setOptionDeadline({ sessionToken: "t", requestId: 5, deadline: hoursAgo(5).toISOString() })).rejects.toThrow(/déjà passée/);
    await expect(api().setOptionDeadline({ sessionToken: "t", requestId: 5, deadline: "pas une date" })).rejects.toThrow(/invalide/);
    state.rows = new Map();
    seed(flightRow({ status: "issued" }));
    await expect(api().setOptionDeadline({ sessionToken: "t", requestId: 5, deadline: inHours(5).toISOString() })).rejects.toThrow(/déjà émis/);
  });
});

// ─── Relances « informations requises » et alerte d'option ──────────────────────────────────────────────────────

describe("relance d'une demande « informations requises »", () => {
  const base = { status: "needs_info", since: hoursAgo(49), remindersSent: 0, lastReminderAt: null as Date | null, departureAt: inHours(24 * 30), optedOut: false, now: NOW };
  it("à 48 h puis à 5 jours, jamais une troisième fois", () => {
    expect(planNeedsInfoReminder({ ...base, since: hoursAgo(47) })).toMatchObject({ due: false, reason: "trop tôt" });
    expect(planNeedsInfoReminder(base)).toEqual({ due: true, stage: 1 });
    expect(planNeedsInfoReminder({ ...base, since: hoursAgo(100), remindersSent: 1, lastReminderAt: hoursAgo(50) })).toMatchObject({ due: false, reason: "trop tôt" });
    expect(planNeedsInfoReminder({ ...base, since: hoursAgo(121), remindersSent: 1, lastReminderAt: hoursAgo(70) })).toEqual({ due: true, stage: 2 });
    expect(planNeedsInfoReminder({ ...base, since: hoursAgo(300), remindersSent: 2, lastReminderAt: hoursAgo(100) })).toMatchObject({ due: false, reason: "maximum atteint" });
  });
  it("stop : autre statut, désinscrit, départ passé, date inconnue", () => {
    expect(planNeedsInfoReminder({ ...base, status: "assigned" }).due).toBe(false);
    expect(planNeedsInfoReminder({ ...base, optedOut: true }).due).toBe(false);
    expect(planNeedsInfoReminder({ ...base, departureAt: hoursAgo(1) }).due).toBe(false);
    expect(planNeedsInfoReminder({ ...base, since: null }).due).toBe(false);
  });
});

describe("tâche quotidienne : informations requises et options", () => {
  const needsInfo = (id: number, overrides: Record<string, unknown> = {}) => flightRow({ id, requestRef: `3M-FL-${id}`, candidateEmail: `client${id}@example.com`, status: "needs_info", ...overrides });
  const changed = (id: number, status: string, hours: number) => ({ id: 700 + id, requestId: id, action: "status_changed", newValue: status, createdAt: hoursAgo(hours) });

  it("relance 1 après 48 h : e-mail sans recopier les notes internes, avec désinscription ; inscrit dans l'historique", async () => {
    state.rows.set(flightBookingRequests, [needsInfo(1, { agentNotes: "NOTE INTERNE CONFIDENTIELLE" })]);
    state.rows.set(flightBookingRequestHistory, [changed(1, "needs_info", 50)]);
    const outcomes = await runFlightFollowUps(await db(), { now: NOW });
    expect(outcomes).toEqual([{ requestRef: "3M-FL-1", kind: "needs_info_reminder", stage: 1, sent: true }]);
    expect(state.emails[0].to).toBe("client1@example.com");
    expect(state.emails[0].html).not.toContain("NOTE INTERNE");
    expect(state.emails[0].html).toContain("/api/reminders/stop?e=client1%40example.com");
    expect(state.inserts.at(-1)!.values.action).toBe(HISTORY.needsInfoReminder);
  });

  it("trop tôt : rien ; une nouvelle demande d'information repart de zéro", async () => {
    state.rows.set(flightBookingRequests, [needsInfo(1)]);
    state.rows.set(flightBookingRequestHistory, [changed(1, "needs_info", 30)]);
    expect(await runFlightFollowUps(await db(), { now: NOW })).toEqual([]);
    state.rows.set(flightBookingRequestHistory, [{ id: 1, requestId: 1, action: HISTORY.needsInfoReminder, newValue: "1", createdAt: hoursAgo(100) }, changed(1, "needs_info", 60)]);
    expect((await runFlightFollowUps(await db(), { now: NOW, dryRun: true })).map((outcome) => outcome.stage)).toEqual([1]);
    expect(state.emails).toHaveLength(0);
  });

  it("option qui expire dans 24 h : UN e-mail groupé au comptoir, une seule fois par échéance ; échéance modifiée = nouvelle alerte", async () => {
    const deadline = inHours(10).toISOString();
    state.rows.set(flightBookingRequests, [flightRow({ id: 1, requestRef: "R1", status: "assigned" }), flightRow({ id: 2, requestRef: "R2", status: "assigned" }), flightRow({ id: 3, requestRef: "R3", status: "assigned" })]);
    state.rows.set(flightBookingRequestHistory, [
      { id: 1, requestId: 1, action: HISTORY.optionDeadline, newValue: deadline, createdAt: hoursAgo(2) },
      { id: 2, requestId: 2, action: HISTORY.optionDeadline, newValue: inHours(20).toISOString(), createdAt: hoursAgo(2) },
      { id: 3, requestId: 3, action: HISTORY.optionDeadline, newValue: inHours(60).toISOString(), createdAt: hoursAgo(2) },
    ]);
    const first = await runFlightFollowUps(await db(), { now: NOW });
    expect(first.filter((outcome) => outcome.kind === "option_alert").map((outcome) => outcome.requestRef).sort()).toEqual(["R1", "R2"]);
    expect(state.emails).toHaveLength(1);
    expect(state.emails[0].to).toBe("hello@3mtravelagency.com");
    expect(state.emails[0].subject).toContain("2 options de réservation expirent bientôt");
    expect(state.emails[0].html).toContain("R1");
    expect(state.emails[0].html).not.toContain("R3");
    expect(await runFlightFollowUps(await db(), { now: NOW })).toEqual([]);
    state.rows.set(flightBookingRequestHistory, [...state.rows.get(flightBookingRequestHistory)!, { id: 50, requestId: 1, action: HISTORY.optionDeadline, newValue: inHours(12).toISOString(), createdAt: hoursAgo(0.5) }]);
    expect((await runFlightFollowUps(await db(), { now: NOW })).map((outcome) => outcome.requestRef)).toEqual(["R1"]);
  });

  it("option déjà expirée, effacée ou billet émis : aucune alerte ; aperçu : rien n'est envoyé ni écrit", async () => {
    state.rows.set(flightBookingRequests, [flightRow({ id: 1, requestRef: "R1", status: "assigned" }), flightRow({ id: 2, requestRef: "R2", status: "assigned" })]);
    state.rows.set(flightBookingRequestHistory, [
      { id: 1, requestId: 1, action: HISTORY.optionDeadline, newValue: hoursAgo(2).toISOString(), createdAt: hoursAgo(9) },
      { id: 2, requestId: 2, action: HISTORY.optionDeadline, newValue: inHours(5).toISOString(), createdAt: hoursAgo(3) },
      { id: 3, requestId: 2, action: HISTORY.optionDeadline, newValue: null, createdAt: hoursAgo(1) },
    ]);
    expect(await runFlightFollowUps(await db(), { now: NOW })).toEqual([]);
    state.rows.set(flightBookingRequestHistory, [{ id: 4, requestId: 1, action: HISTORY.optionDeadline, newValue: inHours(5).toISOString(), createdAt: hoursAgo(1) }]);
    const preview = await runFlightFollowUps(await db(), { now: NOW, dryRun: true });
    expect(preview).toEqual([{ requestRef: "R1", kind: "option_alert", stage: 1, sent: false }]);
    expect(state.emails).toHaveLength(0);
    expect(state.inserts).toHaveLength(0);
  });
});

// ─── Suivi sans compte ──────────────────────────────────────────────────────────────────────────────────────────

describe("suivi d'une réservation sans compte", () => {
  const ask = (overrides: Record<string, unknown> = {}) => ({ requestRef: "3M-FL-TEST", email: "Client@Example.com", ...overrides });

  it("référence + e-mail (casse ignorée) : état, prochaine étape, lien de paiement, voyageurs — sans PNR ni données personnelles", async () => {
    seed(flightRow({ pnrReference: "SECRET1", passengerData: [{ fullName: "Aïcha Nkolo", passportNumber: "CE123456", travelers: 2 }] }));
    const result = await api().track(ask());
    expect(result).toMatchObject({ requestRef: "3M-FL-TEST", status: "revalidated", statusLabel: "Réservation revalidée", route: "Yaoundé → Paris", departureDate: "2026-12-20", travelers: { expected: 2, provided: 1, complete: false, editable: true }, lastTravelDate: "2026-12-20", ticketSent: false });
    expect(result.payUrl).toBe("https://www.3mtravelagency.com/paiement?ref=3M-FL-TEST&type=vol");
    expect(result.nextStep).toContain("réglez votre réservation");
    expect(result.nextStep).toContain("passeports");
    const serialized = JSON.stringify(result);
    for (const secret of ["SECRET1", "CE123456", "Nkolo", "client@example.com"]) expect(serialized).not.toContain(secret);
  });

  it("paiement déclaré : plus de lien de paiement ; billet émis : « billet envoyé » seulement avec un document, statut verrouillé", async () => {
    seed(flightRow({ status: "awaiting_payment", clientValidated: true }));
    const declared = await api().track(ask());
    expect(declared.payUrl).toBeNull();
    expect(declared.nextStep).toContain("paiement est déclaré");
    state.rows = new Map();
    seed(flightRow({ status: "issued", issuedPdfUrl: "https://x/y.pdf" }));
    const issued = await api().track(ask());
    expect(issued).toMatchObject({ ticketSent: true, travelers: { editable: false } });
    expect(JSON.stringify(issued)).not.toContain("https://x/y.pdf");
  });

  it("référence inconnue et e-mail différent : EXACTEMENT la même réponse (rien ne confirme qu'une référence existe)", async () => {
    seed();
    const wrongEmail = await api().track(ask({ email: "autre@example.com" })).catch((error) => error);
    state.rows = new Map();
    const unknownRef = await api().track(ask({ requestRef: "3M-FL-INCONNUE" })).catch((error) => error);
    expect(wrongEmail.code).toBe("NOT_FOUND");
    expect(unknownRef.code).toBe("NOT_FOUND");
    expect(wrongEmail.message).toBe(unknownRef.message);
  });

  it("l'invité renseigne les passeports avec les mêmes contrôles ; mauvais e-mail ou billet émis : refusé, rien n'est écrit", async () => {
    seed(flightRow({ status: "assigned" }));
    const saved = await api().trackSubmitTravelers({ ...ask(), travelers: [traveler("Aïcha Nkolo")] });
    expect(saved.success).toBe(true);
    expect(state.updates.find((entry) => entry.table === flightBookingRequests)!.values.passengerData[0].travelerDetails).toHaveLength(1);
    expect(state.notified).toHaveLength(1);
    state.updates = [];
    await expect(api().trackSubmitTravelers({ ...ask({ email: "autre@example.com" }), travelers: [traveler("Aïcha Nkolo")] })).rejects.toThrow(/Aucune réservation/);
    await expect(api().trackSubmitTravelers({ ...ask(), travelers: [traveler("Aïcha Nkolo", { passportExpiry: "2026-11-01" })] })).rejects.toThrow(/expire avant/);
    state.rows = new Map();
    seed(flightRow({ status: "issued" }));
    await expect(api().trackSubmitTravelers({ ...ask(), travelers: [traveler("Aïcha Nkolo")] })).rejects.toThrow(/terminée/);
    expect(state.updates).toHaveLength(0);
  });

  it("plafond de recherches par adresse e-mail : après 10 essais, l'API refuse (impossible de deviner des références)", async () => {
    seed();
    const headers = { "x-forwarded-for": "203.0.113.7" };
    let refused: any = null;
    for (let index = 0; index < 12 && !refused; index += 1) refused = await api(headers).track(ask({ email: "client@example.com" })).then(() => null, (error) => (error.code === "TOO_MANY_REQUESTS" ? error : null));
    expect(refused?.code).toBe("TOO_MANY_REQUESTS");
  });

  it("la recherche part en POST (e-mail jamais dans l'adresse) et la page est déclarée publique non indexée", () => {
    const router = read("server/routers/flightFollowUp.ts");
    expect(router).toContain("track: publicProcedure.input(trackInput).mutation(");
    expect(router).toContain("trackGuard.assertAllowed(ctx?.req as any, input.email);");
    expect(read("client/src/App.tsx")).toContain('<Route path={"/suivi-vol"} component={SuiviVol} />');
    expect(read("server/publicPrerender.ts")).toMatch(/"\/suivi-vol": \{[^\n]*noindex: true/);
    expect(read("client/src/pages/FlightBookingCheckout.tsx")).toContain("/suivi-vol?ref=");
  });

  it("l'e-mail de confirmation de la demande donne le lien de suivi avec la référence (sans e-mail dans l'adresse)", () => {
    const html = buildBookingConfirmationEmail({ requestRef: "3M-FL-ABC", fullName: "Aïcha", origin: "Yaoundé", destination: "Paris", airline: "AF", departure: "2026-12-20" }).html;
    expect(html).toContain("/suivi-vol?ref=3M-FL-ABC");
    expect(html).toContain("renseigner les passeports");
  });

  it("prochaine étape en clair, sans promesse de délai ni de tarif", () => {
    const step = (status: string, clientValidated = false, travelersComplete = true) => flightNextStep({ status, clientValidated, travelersComplete });
    expect(step("pending_review")).toContain("avant tout paiement");
    expect(step("needs_info")).toContain("attend une information");
    expect(step("awaiting_payment", true)).toContain("vérifie sa réception");
    expect(step("issued")).toContain("billet est émis");
    expect(step("cancelled")).toBe("Cette réservation est annulée.");
    expect(step("assigned", false, false)).toContain("passeports");
    expect(step("issued", false, false)).not.toContain("passeports");
    for (const status of ["pending_review", "assigned", "needs_info", "revalidated", "awaiting_payment", "issued", "cancelled"]) expect(step(status)).not.toMatch(/garanti|sous \d+ ?(h|heures|jours)/i);
  });
});

// ─── Entonnoir ──────────────────────────────────────────────────────────────────────────────────────────────────

describe("entonnoir des demandes", () => {
  const request = (id: number, status: string, createdAt: string): DeskRequest => ({ id, requestRef: `R${id}`, status, priority: "normal", clientValidated: false, assignedAgentEmail: null, createdAt: new Date(createdAt), pnrReference: null, issuedPdfUrl: null, flightData: {} });
  const row = (requestId: number, action: string, newValue: string | null = null): HistoryRow => ({ requestId, action, newValue, createdAt: hoursAgo(1) });

  it("compte chaque étape atteinte, y compris pour une demande annulée après devis ; le statut seul ne suffit pas", () => {
    const requests = [
      request(1, "pending_review", "2026-08-15T10:00:00Z"),
      request(2, "cancelled", "2026-08-20T10:00:00Z"),
      request(3, "awaiting_payment", "2026-09-02T10:00:00Z"),
      request(4, "revalidated", "2026-09-03T10:00:00Z"),
      request(5, "issued", "2026-09-04T10:00:00Z"),
      request(6, "assigned", "2026-09-05T10:00:00Z"),
    ];
    const history = [row(2, "status_changed", "revalidated"), row(4, "payment_approved"), row(6, "pnr_document_uploaded")];
    const funnel = computeFunnel(requests, history);
    expect(funnel.total).toEqual({ created: 6, quoted: 5, paid: 3, issued: 2, cancelled: 1 });
    expect(funnel.months.map((month) => month.month)).toEqual(["2026-09", "2026-08"]);
    expect(funnel.months[0]).toMatchObject({ created: 4, quoted: 4, paid: 3, issued: 2 });
    expect(funnel.months[1]).toMatchObject({ created: 2, quoted: 1, paid: 0, issued: 0, cancelled: 1 });
    expect(funnel.openByStatus).toEqual({ pending_review: 1, awaiting_payment: 1, revalidated: 1, assigned: 1 });
  });

  it("aucune demande : compteurs à zéro, pas de mois", () => {
    expect(computeFunnel([], [])).toEqual({ total: { created: 0, quoted: 0, paid: 0, issued: 0, cancelled: 0 }, months: [], openByStatus: {} });
  });

  it("le tableau du comptoir renvoie l'entonnoir et les options suivies, échéances les plus proches d'abord", async () => {
    state.rows.set(flightBookingRequests, [flightRow({ id: 1, requestRef: "R1", status: "assigned" }), flightRow({ id: 2, requestRef: "R2", status: "assigned" })]);
    state.rows.set(flightBookingRequestHistory, [
      { id: 1, requestId: 1, action: HISTORY.optionDeadline, newValue: inHours(40).toISOString(), createdAt: hoursAgo(1) },
      { id: 2, requestId: 2, action: HISTORY.optionDeadline, newValue: inHours(10).toISOString(), createdAt: hoursAgo(1) },
    ]);
    const overview = await api().deskOverview({ sessionToken: "t", days: 30 });
    expect(overview.funnel.total.created).toBe(2);
    expect(overview.options.map((option) => option.requestRef)).toEqual(["R2", "R1"]);
    expect(overview.optionAlertHours).toBe(6);
  });
});

// ─── Visa accordé → vol ─────────────────────────────────────────────────────────────────────────────────────────

describe("après le visa : aéroport de destination", () => {
  it("pays connu (accents, casse, texte libre) : aéroport principal et lien prérempli depuis Yaoundé ; inconnu : lien simple", () => {
    expect(airportForDestination("Canada")).toEqual({ iata: "YUL", city: "Montréal" });
    expect(airportForDestination("ÉTATS-UNIS")).toMatchObject({ iata: "JFK" });
    expect(airportForDestination("Allemagne")).toMatchObject({ iata: "FRA" });
    expect(airportForDestination("Paris, France")).toMatchObject({ iata: "CDG" });
    expect(airportForDestination("Émirats arabes unis")).toMatchObject({ iata: "DXB" });
    expect(airportForDestination("Atlantide")).toBeNull();
    expect(airportForDestination("")).toBeNull();
    expect(airportForDestination(null)).toBeNull();
    expect(flightsLinkForDestination("Belgique")).toBe("/flights?origin=NSI&destination=BRU");
    expect(flightsLinkForDestination("Atlantide")).toBe("/flights");
  });

  it("chaque aéroport proposé existe dans la liste d'aéroports de la recherche de vols", async () => {
    const source = read("server/routers/flights.ts");
    const codes = Array.from(read("shared/destinationAirports.ts").matchAll(/iata: "([A-Z]{3})"/g)).map((match) => match[1]);
    expect(codes.length).toBeGreaterThan(15);
    const known = new Set(Array.from(source.matchAll(/^\s{2}([A-Z]{3}): \{ iata:/gm)).map((match) => match[1]));
    const missing = codes.filter((code) => !known.has(code));
    // PEK, SIN, BKK figurent aussi dans la liste ; toute absence signalerait un code que la recherche ne saurait pas nommer.
    expect(missing).toEqual([]);
  });
});

// ─── Fiche de voyage ────────────────────────────────────────────────────────────────────────────────────────────

describe("fiche de voyage PDF", () => {
  const input = { requestRef: "3M-FL-TEST", pnrReference: "XYZ789", flightData: { ...flightRow().flightData, returnFlight: { originCity: "Paris", destinationCity: "Yaoundé", departureDate: "2027-01-10", departureTime: "09:00", arrivalTime: "18:00", flightNumber: "AT 281", airline: { name: "Royal Air Maroc" } } }, passengerData: [{ travelerDetails: [traveler("Aïcha Nkolo"), traveler("Paul Mbarga")] }], issuedAt: NOW };

  it("aller et retour lus dans la demande, sans rien inventer quand une donnée manque", () => {
    const legs = sheetLegs(input.flightData);
    expect(legs.map((leg) => leg.title)).toEqual(["Aller", "Retour"]);
    expect(legs[0]).toMatchObject({ route: "Yaoundé → Paris", flight: "Royal Air Maroc AT 280" });
    expect(legs[1].when).toContain("2027-01-10");
    expect(sheetLegs({})[0]).toMatchObject({ route: "Départ à confirmer → Arrivée à confirmer", when: "date à confirmer · --:-- → --:--" });
    expect(sheetLegs({})).toHaveLength(1);
  });

  it("produit un vrai PDF ; la pièce jointe porte la référence dans son nom ; jamais d'exception si les données sont vides", () => {
    const pdf = createTravelSheetPdf(input);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1500);
    const attachment = travelSheetAttachment(input)!;
    expect(attachment).toMatchObject({ filename: "Fiche-de-voyage-3M-FL-TEST.pdf", contentType: "application/pdf" });
    expect(() => createTravelSheetPdf({ requestRef: "R", pnrReference: null, flightData: null, passengerData: null, issuedAt: NOW })).not.toThrow();
  });

  it("l'émission envoie la fiche en pièce jointe avec l'e-mail de confirmation, et le téléversement de PDF fait de même", async () => {
    seed(flightRow({ status: "revalidated", issuanceChecklist: { identity_verified: true, passport_valid: true, fare_revalidated: true, payment_verified: true, pnr_document_ready: true }, passengerData: [{ travelers: 1, travelerDetails: [traveler("Aïcha Nkolo")] }] }));
    const admin = flightBookingRouter.createCaller({ req: { headers: {} } } as any);
    await admin.updatePnrAndIssuedPdf({ sessionToken: "t", requestId: 5, pnrReference: "ABC123", advisorInitials: "AD" });
    const sent = state.emails.find((message) => String(message.subject).includes("Confirmation de votre billet"))!;
    expect(sent.attachments).toHaveLength(1);
    expect(sent.attachments[0].filename).toBe("Fiche-de-voyage-3M-FL-TEST.pdf");
    expect(Buffer.isBuffer(sent.attachments[0].content)).toBe(true);
    const source = read("server/routers/flightBooking.ts");
    expect(source.match(/attachments: sheetAttachments\(existing, input\.pnrReference\)/g)).toHaveLength(2);
  });
});
