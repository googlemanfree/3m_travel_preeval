// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  desk: { data: undefined as any, isLoading: false, error: null as any },
  calls: [] as Array<{ name: string; input: any }>,
  trackData: undefined as any,
  trackError: null as any,
  toasts: [] as any[],
  mutation: (name: string, extra: () => Record<string, unknown> = () => ({})) => ({ useMutation: () => ({ mutate: (input: any) => { state.calls.push({ name, input }); }, isPending: false, ...extra() }) }),
}));

vi.mock("sonner", () => ({ toast: { error: (message: string) => state.toasts.push({ error: message }), success: (message: string) => state.toasts.push({ success: message }) } }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: (toast: any) => state.toasts.push(toast) }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ flightFollowUp: { myOverview: { invalidate: () => undefined }, deskOverview: { invalidate: () => undefined } }, flightBooking: { getRequest: { invalidate: () => undefined } } }),
    flightFollowUp: {
      recheckFare: state.mutation("recheckFare"),
      adminSaveTravelers: state.mutation("adminSaveTravelers"),
      setOptionDeadline: state.mutation("setOptionDeadline"),
      resolveChange: state.mutation("resolveChange"),
      submitTravelers: state.mutation("submitTravelers"),
      requestChange: state.mutation("requestChange"),
      track: state.mutation("track", () => ({ data: state.trackData, error: state.trackError })),
      trackSubmitTravelers: state.mutation("trackSubmitTravelers"),
      deskOverview: { useQuery: () => state.desk },
    },
  },
}));

import FlightAfterVisaCard from "@/components/FlightAfterVisaCard";
import FlightDeskOverview from "@/components/FlightDeskOverview";
import FlightRequestChecks from "@/components/FlightRequestChecks";
import SuiviVol from "@/pages/SuiviVol";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const inHours = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

beforeEach(() => {
  state.desk = { data: undefined, isLoading: false, error: null };
  state.calls = [];
  state.trackData = undefined;
  state.trackError = null;
  state.toasts = [];
  window.history.replaceState({}, "", "/");
});
afterEach(cleanup);

describe("admin : option de réservation", () => {
  const request = { id: 5, status: "assigned", createdAt: hoursAgo(2), flightData: { departureDate: "2030-12-20", pricedPassengers: 1 }, passengerData: [{ travelers: 1, travelerDetails: [{ fullName: "Aïcha Nkolo", passportNumber: "CE123456", passportExpiry: "2039-05-01", dateOfBirth: "1994-03-12" }] }] };

  it("sans échéance : invitation à la noter ; l'enregistrer envoie une date ISO", () => {
    render(<FlightRequestChecks request={request} history={[]} sessionToken="tok" />);
    expect(screen.getByTestId("option-status").textContent).toContain("Aucune échéance saisie");
    expect((screen.getByTestId("save-option") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByTestId("clear-option")).toBeNull();
    fireEvent.change(screen.getByLabelText("Date et heure limite de l’option"), { target: { value: "2030-01-10T14:30" } });
    fireEvent.click(screen.getByTestId("save-option"));
    expect(state.calls).toHaveLength(1);
    expect(state.calls[0]).toMatchObject({ name: "setOptionDeadline", input: { sessionToken: "tok", requestId: 5, deadline: new Date("2030-01-10T14:30").toISOString() } });
  });

  it("échéance proche : alerte visuelle et heures restantes ; expirée : dite expirée ; effacer envoie null", () => {
    const { unmount } = render(<FlightRequestChecks request={request} history={[{ action: "option_deadline_set", newValue: inHours(4), createdAt: hoursAgo(1) }]} sessionToken="tok" />);
    expect(screen.getByTestId("option-status").textContent).toContain("Option valable jusqu’au");
    expect(screen.getByTestId("option-deadline").className).toContain("bg-rose-50");
    fireEvent.click(screen.getByTestId("clear-option"));
    expect(state.calls[0].input).toMatchObject({ requestId: 5, deadline: null });
    unmount();
    render(<FlightRequestChecks request={request} history={[{ action: "option_deadline_set", newValue: hoursAgo(3), createdAt: hoursAgo(9) }]} sessionToken="tok" />);
    expect(screen.getByTestId("option-status").textContent).toContain("Option expirée depuis 3 h");
  });

  it("échéance lointaine : pas d'alerte ; échéance effacée dans l'historique : plus d'échéance ; billet émis : bloc absent", () => {
    const { unmount } = render(<FlightRequestChecks request={request} history={[{ action: "option_deadline_set", newValue: inHours(48), createdAt: hoursAgo(1) }]} sessionToken="tok" />);
    expect(screen.getByTestId("option-deadline").className).not.toContain("bg-rose-50");
    unmount();
    const cleared = render(<FlightRequestChecks request={request} history={[{ action: "option_deadline_set", newValue: inHours(48), createdAt: hoursAgo(5) }, { action: "option_deadline_set", newValue: null, createdAt: hoursAgo(1) }]} sessionToken="tok" />);
    expect(screen.getByTestId("option-status").textContent).toContain("Aucune échéance");
    cleared.unmount();
    render(<FlightRequestChecks request={{ ...request, status: "issued" }} history={[]} sessionToken="tok" />);
    expect(screen.queryByTestId("option-deadline")).toBeNull();
  });
});

describe("admin : entonnoir et options dans le suivi du comptoir", () => {
  const data = () => ({
    days: 90,
    stats: { requests: 8, firstResponseMedianHours: 3, firstResponseCount: 6, paymentApprovalMedianHours: null, paymentApprovalCount: 0, issuanceMedianHours: null, issuanceCount: 0 },
    stale: [],
    openChanges: [],
    optionAlertHours: 6,
    options: [{ requestId: 7, requestRef: "3M-FL-OPT", deadline: inHours(3) }, { requestId: 8, requestRef: "3M-FL-LATER", deadline: inHours(40) }],
    funnel: { total: { created: 8, quoted: 6, paid: 4, issued: 2, cancelled: 1 }, months: [{ month: "2026-09", created: 5, quoted: 4, paid: 3, issued: 2, cancelled: 0 }, { month: "2026-08", created: 3, quoted: 2, paid: 1, issued: 0, cancelled: 1 }], openByStatus: { assigned: 2, needs_info: 1 } },
  });
  const open = () => { render(<FlightDeskOverview sessionToken="tok" onOpen={(id) => state.calls.push({ name: "open", input: id })} />); fireEvent.click(screen.getByRole("button", { name: /Suivi du comptoir/ })); };

  it("entonnoir : chaque étape avec son nombre et sa part des demandes reçues ; en cours par statut ; détail par mois", () => {
    state.desk = { data: data(), isLoading: false, error: null };
    open();
    const rows = screen.getAllByTestId("funnel-row").map((row) => row.textContent);
    expect(rows[0]).toContain("Demandes reçues8");
    expect(rows[1]).toContain("6");
    expect(rows[1]).toContain("75 %");
    expect(rows[2]).toContain("50 %");
    expect(rows[3]).toContain("25 %");
    expect(screen.getByTestId("funnel-open").textContent).toContain("2 Affectée");
    expect(within(screen.getByTestId("funnel-months")).getAllByRole("row")).toHaveLength(3);
  });

  it("moins de 5 demandes : pourcentages signalés indicatifs ; aucune demande : tirets, pas de division par zéro", () => {
    const small = data();
    small.funnel.total = { created: 3, quoted: 2, paid: 1, issued: 0, cancelled: 0 };
    state.desk = { data: small, isLoading: false, error: null };
    const { unmount } = render(<FlightDeskOverview sessionToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: /Suivi du comptoir/ }));
    expect(screen.getByTestId("desk-funnel").textContent).toContain("Moins de 5 demandes");
    unmount();
    const empty = data();
    empty.funnel = { total: { created: 0, quoted: 0, paid: 0, issued: 0, cancelled: 0 }, months: [], openByStatus: {} } as any;
    state.desk = { data: empty, isLoading: false, error: null };
    render(<FlightDeskOverview sessionToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: /Suivi du comptoir/ }));
    expect(screen.getAllByTestId("funnel-row")[1].textContent).toContain("—");
  });

  it("options suivies : échéance proche en rouge, lointaine en gris ; un clic ouvre la demande", () => {
    state.desk = { data: data(), isLoading: false, error: null };
    open();
    const rows = screen.getAllByTestId("option-row");
    expect(rows).toHaveLength(2);
    expect(rows[0].innerHTML).toContain("bg-rose-100");
    expect(rows[1].innerHTML).not.toContain("bg-rose-100");
    fireEvent.click(within(rows[0]).getByText("3M-FL-OPT"));
    expect(state.calls).toEqual([{ name: "open", input: 7 }]);
  });
});

describe("page de suivi sans compte", () => {
  const result = (overrides: Record<string, unknown> = {}) => ({ requestRef: "3M-FL-ABC", status: "revalidated", statusLabel: "Réservation revalidée", route: "Yaoundé → Paris", departureDate: "2030-12-20", returnDate: "", lastTravelDate: "2030-12-20", nextStep: "Le tarif est revalidé : réglez votre réservation.", payUrl: "https://www.3mtravelagency.com/paiement?ref=3M-FL-ABC&type=vol", travelers: { expected: 1, provided: 0, complete: false, editable: true }, ticketSent: false, ...overrides });

  it("la référence de l'adresse préremplit le champ ; l'e-mail n'est jamais lu dans l'adresse ; l'envoi part avec les deux valeurs", () => {
    window.history.replaceState({}, "", "/suivi-vol?ref=3M-FL-ABC&email=piege@example.com");
    render(<SuiviVol />);
    expect((screen.getByLabelText("Référence de la demande") as HTMLInputElement).value).toBe("3M-FL-ABC");
    expect((screen.getByLabelText("Adresse e-mail de la demande") as HTMLInputElement).value).toBe("");
    expect((screen.getByTestId("track-submit") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Adresse e-mail de la demande"), { target: { value: "client@example.com" } });
    fireEvent.submit(screen.getByTestId("track-form"));
    expect(state.calls).toEqual([{ name: "track", input: { requestRef: "3M-FL-ABC", email: "client@example.com" } }]);
  });

  it("résultat : statut, trajet, prochaine étape, lien de paiement ; passeports à renseigner avec formulaire", () => {
    state.trackData = result();
    render(<SuiviVol />);
    expect(screen.getByTestId("track-status").textContent).toBe("Réservation revalidée");
    expect(screen.getByTestId("track-result").textContent).toContain("Yaoundé → Paris");
    expect(screen.getByTestId("track-next-step").textContent).toContain("réglez votre réservation");
    expect((screen.getByTestId("track-pay") as HTMLAnchorElement).href).toContain("/paiement?ref=3M-FL-ABC");
    expect(screen.getByTestId("track-travelers").textContent).toContain("Passeports à renseigner (0/1)");
    fireEvent.click(screen.getByTestId("track-toggle-travelers"));
    expect(screen.getAllByTestId("traveler-fieldset")).toHaveLength(1);
  });

  it("billet émis : plus de formulaire de passeports ni de lien de paiement ; erreur du serveur affichée telle quelle", () => {
    state.trackData = result({ status: "issued", payUrl: null, travelers: { expected: 1, provided: 1, complete: true, editable: false } });
    const { unmount } = render(<SuiviVol />);
    expect(screen.queryByTestId("track-pay")).toBeNull();
    expect(screen.queryByTestId("track-travelers")).toBeNull();
    unmount();
    state.trackData = undefined;
    state.trackError = new Error("Aucune réservation ne correspond à cette référence et à cette adresse e-mail.");
    render(<SuiviVol />);
    expect(screen.getByTestId("track-error").textContent).toContain("Aucune réservation ne correspond");
  });
});

describe("carte « Réservez votre vol » après le visa", () => {
  it("visa accordé : lien prérempli vers l'aéroport du pays ; sinon la carte n'existe pas", () => {
    const { container, unmount } = render(<FlightAfterVisaCard approved={false} destination="Canada" />);
    expect(container.textContent).toBe("");
    unmount();
    render(<FlightAfterVisaCard approved destination="Canada" />);
    expect((screen.getByTestId("flight-after-visa-link") as HTMLAnchorElement).getAttribute("href")).toBe("/flights?origin=NSI&destination=YUL");
    expect(screen.getByTestId("flight-after-visa").textContent).toContain("Montréal (YUL)");
    expect(screen.getByTestId("flight-after-visa").textContent).not.toMatch(/\d\s?FCFA|€/);
  });

  it("pays inconnu : lien simple vers la page des vols ; monté dans l'espace client avant les réservations", () => {
    render(<FlightAfterVisaCard approved destination="Atlantide" />);
    expect((screen.getByTestId("flight-after-visa-link") as HTMLAnchorElement).getAttribute("href")).toBe("/flights");
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space.indexOf("<FlightAfterVisaCard")).toBeGreaterThan(-1);
    expect(space.indexOf("<FlightAfterVisaCard")).toBeLessThan(space.indexOf("<MyFlightRequestsCard"));
  });
});
