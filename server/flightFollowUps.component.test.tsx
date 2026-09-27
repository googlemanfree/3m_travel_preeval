// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  overview: undefined as any,
  desk: { data: undefined as any, isLoading: false, error: null as any },
  calls: [] as Array<{ name: string; input: any }>,
  recheckData: undefined as any,
  toasts: [] as any[],
  mutation: (name: string) => ({ useMutation: () => ({ mutate: (input: any) => { state.calls.push({ name, input }); }, isPending: false }) }),
}));

vi.mock("sonner", () => ({ toast: { error: (message: string) => state.toasts.push({ error: message }), success: (message: string) => state.toasts.push({ success: message }) } }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: (toast: any) => state.toasts.push(toast) }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ flightFollowUp: { myOverview: { invalidate: () => undefined }, deskOverview: { invalidate: () => undefined } }, flightBooking: { getRequest: { invalidate: () => undefined } } }),
    flightFollowUp: {
      myOverview: { useQuery: () => ({ data: state.overview }) },
      submitTravelers: state.mutation("submitTravelers"),
      requestChange: state.mutation("requestChange"),
      adminSaveTravelers: state.mutation("adminSaveTravelers"),
      setOptionDeadline: state.mutation("setOptionDeadline"),
      recheckFare: { useMutation: () => ({ mutate: (input: any) => state.calls.push({ name: "recheckFare", input }), isPending: false, data: state.recheckData }) },
      resolveChange: state.mutation("resolveChange"),
      deskOverview: { useQuery: () => state.desk },
    },
  },
}));

import FlightDeskOverview from "@/components/FlightDeskOverview";
import FlightRequestChecks from "@/components/FlightRequestChecks";
import FlightRequestExtras from "@/components/FlightRequestExtras";
import FlightTravelersForm from "@/components/FlightTravelersForm";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const flightData = { departureDate: "2030-12-20", pricedPassengers: 2 };
const person = (name: string) => ({ fullName: name, passportNumber: "CE123456", passportExpiry: "2039-05-01", dateOfBirth: "1994-03-12" });
const type = (label: RegExp | string, value: string, index = 0) => fireEvent.change(screen.getAllByLabelText(label)[index], { target: { value } });

beforeEach(() => {
  state.overview = undefined;
  state.desk = { data: undefined, isLoading: false, error: null };
  state.calls = [];
  state.recheckData = undefined;
  state.toasts = [];
});
afterEach(cleanup);

describe("formulaire des voyageurs", () => {
  it("un bloc par voyageur ; tant qu'un champ est absent ou invalide, l'envoi est impossible", () => {
    render(<FlightTravelersForm expected={2} lastTravelDate="2030-12-20" onSubmit={(list) => state.calls.push({ name: "submit", input: list })} />);
    expect(screen.getAllByTestId("traveler-fieldset")).toHaveLength(2);
    const submit = screen.getByTestId("travelers-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.submit(screen.getByTestId("flight-travelers-form"));
    expect(state.calls).toHaveLength(0);
  });

  it("chaque champ est contrôlé pendant la saisie : erreur visible seulement sur un champ rempli ; correct → envoi actif et données transmises", () => {
    render(<FlightTravelersForm expected={1} lastTravelDate="2030-12-20" onSubmit={(list) => state.calls.push({ name: "submit", input: list })} />);
    expect(screen.queryByTestId("traveler-issues")).toBeNull();
    type(/Nom complet/, "Aicha 2");
    expect(screen.getByTestId("traveler-issues").textContent).toContain("que des lettres");
    type(/Nom complet/, "Aïcha Nkolo");
    type(/Numéro de passeport/, "ce123456");
    type(/Date d’expiration/, "2031-03-01");
    type(/Date de naissance/, "1994-03-12");
    expect(screen.getByTestId("traveler-issues").textContent).toContain("moins de 6 mois");
    const submit = screen.getByTestId("travelers-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    fireEvent.submit(screen.getByTestId("flight-travelers-form"));
    expect(state.calls[0].input).toEqual([{ fullName: "Aïcha Nkolo", passportNumber: "ce123456", passportExpiry: "2031-03-01", dateOfBirth: "1994-03-12", nationality: undefined }]);
  });

  it("un passeport qui expire avant la fin du voyage bloque l'envoi", () => {
    render(<FlightTravelersForm expected={1} lastTravelDate="2030-12-20" initial={[person("Aïcha Nkolo")]} onSubmit={() => undefined} />);
    expect((screen.getByTestId("travelers-submit") as HTMLButtonElement).disabled).toBe(false);
    type(/Date d’expiration/, "2030-01-01");
    expect(screen.getByTestId("traveler-issues").textContent).toContain("avant la fin du voyage");
    expect((screen.getByTestId("travelers-submit") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("espace client : passeports et demande de modification", () => {
  const overview = (overrides: Record<string, unknown> = {}) => ({
    requestId: 5,
    travelers: { expected: 2, provided: 0, complete: false, messages: [], details: [] },
    changeRequests: [] as any[],
    ...overrides,
  });
  const renderExtras = (props: Record<string, unknown> = {}) => render(<FlightRequestExtras requestId={5} status="revalidated" flightData={flightData} paymentExpected overview={overview()} {...props} />);

  it("passeports manquants : rappel visible avant le paiement, formulaire à un clic, envoi vers le serveur", () => {
    renderExtras();
    const box = screen.getByTestId("travelers-status");
    expect(box.textContent).toContain("Passeports à renseigner (0/2)");
    expect(box.textContent).toContain("Avant de payer");
    expect(box.textContent).toContain("identique à celui du passeport");
    fireEvent.click(screen.getByTestId("toggle-travelers"));
    expect(screen.getAllByTestId("traveler-fieldset")).toHaveLength(2);
    type(/Nom complet/, "Aïcha Nkolo", 0); type(/Numéro de passeport/, "CE123456", 0); type(/Date d’expiration/, "2039-05-01", 0); type(/Date de naissance/, "1994-03-12", 0);
    type(/Nom complet/, "Paul Mbarga", 1); type(/Numéro de passeport/, "PA987654", 1); type(/Date d’expiration/, "2039-05-01", 1); type(/Date de naissance/, "1990-01-02", 1);
    fireEvent.submit(screen.getByTestId("flight-travelers-form"));
    expect(state.calls).toHaveLength(1);
    expect(state.calls[0].name).toBe("submitTravelers");
    expect(state.calls[0].input.requestId).toBe(5);
    expect(state.calls[0].input.travelers.map((entry: any) => entry.fullName)).toEqual(["Aïcha Nkolo", "Paul Mbarga"]);
  });

  it("passeports complets : confirmation, numéro masqué, aucun rappel d'urgence", () => {
    renderExtras({ overview: overview({ travelers: { expected: 1, provided: 1, complete: true, messages: [], details: [person("Aïcha Nkolo")] } }) });
    const box = screen.getByTestId("travelers-status");
    expect(box.textContent).toContain("Passeports renseignés");
    expect(box.textContent).toContain("•••••456");
    expect(box.textContent).not.toContain("CE123456");
  });

  it("billet émis : plus de modification des passeports, mais la demande de modification reste possible ; annulée : rien", () => {
    const { unmount } = renderExtras({ status: "issued", paymentExpected: false });
    expect(screen.queryByTestId("travelers-status")).toBeNull();
    expect(screen.getByTestId("change-request")).toBeTruthy();
    unmount();
    const cancelled = renderExtras({ status: "cancelled" });
    expect(cancelled.container.textContent).toBe("");
  });

  it("demande de modification : message d'au moins 10 caractères, type choisi, envoi ; conditions de la compagnie rappelées", () => {
    renderExtras({ paymentExpected: false });
    fireEvent.click(screen.getByTestId("toggle-change"));
    const submit = screen.getByTestId("change-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Votre demande"), { target: { value: "cancel" } });
    fireEvent.change(screen.getByLabelText(/Précisez/), { target: { value: "Je dois annuler mon voyage." } });
    expect(submit.disabled).toBe(false);
    expect(screen.getByTestId("change-request").textContent).toContain("dépendent des conditions de votre billet");
    fireEvent.submit(submit.closest("form")!);
    expect(state.calls).toEqual([{ name: "requestChange", input: { requestId: 5, kind: "cancel", message: "Je dois annuler mon voyage." } }]);
  });

  it("demande en cours : statut affiché et pas de nouveau formulaire ; demande traitée : réponse de l'agence visible", () => {
    const open = renderExtras({ overview: overview({ changeRequests: [{ id: 1, kind: "change_date", message: "x", createdAt: hoursAgo(1), handled: false, handledNote: null }] }) });
    expect(screen.getByTestId("change-open").textContent).toContain("Changer la date");
    expect(screen.queryByTestId("toggle-change")).toBeNull();
    open.unmount();
    renderExtras({ overview: overview({ changeRequests: [{ id: 1, kind: "cancel", message: "x", createdAt: hoursAgo(9), handled: true, handledNote: "Annulation faite" }] }) });
    expect(screen.getByTestId("change-handled").textContent).toContain("Annulation faite");
    expect(screen.getByTestId("toggle-change")).toBeTruthy();
  });

  it("aucune donnée d'aperçu encore chargée : rien n'est affiché", () => {
    const view = renderExtras({ overview: undefined });
    expect(view.container.textContent).toBe("");
  });
});

describe("admin : contrôles avant paiement et émission", () => {
  const request = (overrides: Record<string, unknown> = {}) => ({ id: 5, status: "assigned", createdAt: hoursAgo(2), flightData, passengerData: [{ travelers: 2, travelerDetails: [person("Aïcha Nkolo"), person("Paul Mbarga")] }], ...overrides });

  it("tarif récent : ancienneté affichée sans alerte ; relancer le contrôle envoie la demande", () => {
    render(<FlightRequestChecks request={request()} history={[]} sessionToken="tok" />);
    expect(screen.getByTestId("fare-age").textContent).toContain("il y a 2 h");
    expect(screen.getByTestId("fare-age").textContent).toContain("création de la demande");
    expect(screen.getByTestId("fare-age").textContent).not.toContain("revérifiez");
    fireEvent.click(screen.getByTestId("recheck-fare"));
    expect(state.calls).toEqual([{ name: "recheckFare", input: { sessionToken: "tok", requestId: 5 } }]);
  });

  it("tarif de plus de 12 h : alerte demandant de revérifier ; un contrôle récent de l'historique remet le compteur à zéro", () => {
    const { unmount } = render(<FlightRequestChecks request={request({ createdAt: hoursAgo(30) })} history={[]} sessionToken="tok" />);
    expect(screen.getByTestId("fare-age").textContent).toContain("revérifiez avant de demander le paiement");
    unmount();
    render(<FlightRequestChecks request={request({ createdAt: hoursAgo(30) })} history={[{ action: "fare_rechecked", newValue: "same", createdAt: hoursAgo(1) }]} sessionToken="tok" />);
    expect(screen.getByTestId("fare-age").textContent).toContain("contrôle du conseiller");
    expect(screen.getByTestId("fare-age").textContent).not.toContain("revérifiez");
  });

  it("résultat du contrôle affiché avec la phrase du serveur", () => {
    state.recheckData = { comparison: { kind: "higher" }, description: "Tarif en hausse : 330 000 FCFA au lieu de 300 000 FCFA (+10 %). À annoncer au client avant tout paiement.", retrievedAt: hoursAgo(0) };
    render(<FlightRequestChecks request={request()} history={[]} sessionToken="tok" />);
    expect(screen.getByTestId("fare-result").textContent).toContain("Tarif en hausse");
  });

  it("passeports complets : liste des voyageurs, aucun blocage annoncé", () => {
    render(<FlightRequestChecks request={request()} history={[]} sessionToken="tok" />);
    const check = screen.getByTestId("traveler-check");
    expect(check.textContent).toContain("Passeports des voyageurs (2/2)");
    expect(screen.getAllByTestId("traveler-row")).toHaveLength(2);
    expect(check.textContent).not.toContain("refusée");
  });

  it("passeports absents ou invalides : messages précis et blocage de l'émission annoncé ; saisie par le comptoir", () => {
    render(<FlightRequestChecks request={request({ passengerData: [{ travelers: 2 }] })} history={[]} sessionToken="tok" />);
    expect(screen.getByTestId("traveler-check").textContent).toContain("Passeports des voyageurs (0/2)");
    expect(screen.getByTestId("traveler-messages").textContent).toContain("Aucun voyageur n’est renseigné");
    expect(screen.getByTestId("traveler-check").textContent).toContain("L’émission est refusée tant que ces données ne sont pas complètes");
    fireEvent.click(screen.getByTestId("toggle-admin-travelers"));
    expect(screen.getAllByTestId("traveler-fieldset")).toHaveLength(2);
  });

  it("billet émis : plus aucun bouton de contrôle ni de saisie", () => {
    render(<FlightRequestChecks request={request({ status: "issued" })} history={[]} sessionToken="tok" />);
    expect(screen.queryByTestId("recheck-fare")).toBeNull();
    expect(screen.queryByTestId("toggle-admin-travelers")).toBeNull();
  });
});

describe("admin : suivi du comptoir", () => {
  const data = (overrides: Record<string, unknown> = {}) => ({
    days: 90,
    stats: { requests: 12, firstResponseMedianHours: 3.5, firstResponseCount: 9, paymentApprovalMedianHours: 30, paymentApprovalCount: 3, issuanceMedianHours: null, issuanceCount: 0 },
    stale: [{ requestId: 5, requestRef: "3M-FL-AAA", reason: "no_response", label: "Aucune réponse du comptoir", hours: 30, priority: "normal", assignedAgentEmail: null }],
    openChanges: [{ historyId: 4, requestId: 6, requestRef: "3M-FL-BBB", kind: "cancel", message: "Je dois annuler.", createdAt: hoursAgo(3) }],
    options: [] as any[],
    optionAlertHours: 6,
    funnel: { total: { created: 12, quoted: 9, paid: 6, issued: 4, cancelled: 1 }, months: [] as any[], openByStatus: {} as Record<string, number> },
    ...overrides,
  });

  it("résumé replié : nombre d'éléments à traiter ; « tout est à jour » quand il n'y a rien", () => {
    state.desk = { data: data(), isLoading: false, error: null };
    const { unmount } = render(<FlightDeskOverview sessionToken="tok" />);
    expect(screen.getByTestId("desk-summary").textContent).toContain("2 éléments demandent une action");
    expect(screen.queryByTestId("desk-stats")).toBeNull();
    unmount();
    state.desk = { data: data({ stale: [], openChanges: [] }), isLoading: false, error: null };
    render(<FlightDeskOverview sessionToken="tok" />);
    expect(screen.getByTestId("desk-summary").textContent).toContain("tout est à jour");
  });

  it("ouvert : délais médians (tiret sans donnée, « indicatif » sous 5 cas), demandes à traiter, ouverture d'une demande au clic", () => {
    state.desk = { data: data(), isLoading: false, error: null };
    const opened: number[] = [];
    render(<FlightDeskOverview sessionToken="tok" onOpen={(id) => opened.push(id)} />);
    fireEvent.click(screen.getByRole("button", { name: /Suivi du comptoir/ }));
    const stats = screen.getByTestId("desk-stats").textContent ?? "";
    expect(stats).toContain("3,5 h");
    expect(stats).toContain("9 demandes");
    expect(stats).toContain("30 h");
    expect(stats).toContain("indicatif");
    expect(stats).toContain("—");
    const row = screen.getByTestId("stale-row");
    expect(row.textContent).toContain("Aucune réponse du comptoir");
    expect(row.textContent).toContain("30 h");
    expect(row.textContent).toContain("Non affectée");
    fireEvent.click(within(row).getByText("3M-FL-AAA"));
    expect(opened).toEqual([5]);
  });

  it("demande de modification : la réponse saisie part avec l'identifiant de la demande ; annuler la saisie n'envoie rien", () => {
    state.desk = { data: data(), isLoading: false, error: null };
    render(<FlightDeskOverview sessionToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: /Suivi du comptoir/ }));
    const row = screen.getByTestId("change-row");
    expect(row.textContent).toContain("Annuler la réservation");
    const prompt = vi.spyOn(window, "prompt").mockReturnValueOnce(null).mockReturnValueOnce("Annulation faite, remboursement selon la compagnie.");
    fireEvent.click(within(row).getByTestId("resolve-change"));
    expect(state.calls).toHaveLength(0);
    fireEvent.click(within(row).getByTestId("resolve-change"));
    expect(state.calls).toEqual([{ name: "resolveChange", input: { sessionToken: "tok", requestId: 6, historyId: 4, note: "Annulation faite, remboursement selon la compagnie." } }]);
    prompt.mockRestore();
  });

  it("erreur : message clair sans planter", () => {
    state.desk = { data: undefined, isLoading: false, error: new Error("boom") };
    render(<FlightDeskOverview sessionToken="tok" />);
    expect(screen.getByTestId("desk-summary").textContent).toContain("Suivi indisponible");
  });
});

describe("montage", () => {
  it("le tableau de bord admin affiche le suivi avant le calendrier et les contrôles sous l'aperçu de la demande ; dérogation motivée proposée sur refus de tarif", () => {
    const page = read("client/src/pages/FlightAgentDashboard.tsx");
    expect(page).toContain("<FlightDeskOverview sessionToken={sessionToken}");
    expect(page.indexOf("<FlightDeskOverview")).toBeLessThan(page.indexOf("<FlightDepartureCalendar"));
    expect(page.indexOf("<FlightRequestOverview")).toBeLessThan(page.indexOf("<FlightRequestChecks"));
    expect(page).toContain('error.message.includes("dérogation motivée")');
    expect(page).toContain("fareWaiverReason");
  });

  it("la carte « Mes réservations de vol » monte les passeports et la demande de modification sous chaque ligne", () => {
    const card = read("client/src/components/MyFlightRequestsCard.tsx");
    expect(card).toContain("<FlightRequestExtras requestId={request.id}");
    expect(card).toContain("trpc.flightFollowUp.myOverview.useQuery");
  });
});
