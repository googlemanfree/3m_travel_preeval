// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  programs: { data: [] as any[], isLoading: false },
  mine: { data: [] as any[] },
  adminPrograms: { data: [] as any[], error: null as null | { message: string } },
  adminRequests: { data: [] as any[], error: null as null | { message: string } },
  request: vi.fn(),
  cancel: vi.fn(),
  save: vi.fn(),
  setStatus: vi.fn(),
}));

vi.mock("@/lib/trpc", () => {
  const mutation = (fn: ReturnType<typeof vi.fn>) => ({ useMutation: () => ({ mutate: fn, isPending: false }) });
  return {
    trpc: {
      useUtils: () => ({ stayPrograms: { myRequests: { invalidate: vi.fn() }, adminPrograms: { invalidate: vi.fn() }, adminRequests: { invalidate: vi.fn() } } }),
      stayPrograms: {
        programs: { useQuery: () => state.programs },
        myRequests: { useQuery: () => state.mine },
        requestStay: mutation(state.request),
        cancelRequest: mutation(state.cancel),
        adminPrograms: { useQuery: () => state.adminPrograms },
        adminRequests: { useQuery: () => state.adminRequests },
        adminSaveProgram: mutation(state.save),
        adminDeleteProgram: mutation(vi.fn()),
        adminSetRequestStatus: mutation(state.setStatus),
      },
    },
  };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { StayOpportunities } from "@/components/StayOpportunities";
import { AdminStayPrograms } from "@/components/AdminStayPrograms";

const program = (id: number, over: Record<string, unknown> = {}) => ({
  id, city: "Lisbonne", title: `Séjour ${id}`, category: "discovery", summary: "Quatre jours accompagnés.", description: "Visites guidées et temps libre.",
  durationDaysMin: 4, durationDaysMax: 6, seasonNote: "Printemps", includedNote: "Hébergement", visaNote: "Visa Schengen selon nationalité.", priceLabel: "À partir de 450 EUR par personne · indicatif, confirmé par devis", ...over,
});
const request = (id: number, status = "requested") => ({ id, programId: id, title: `Séjour ${id}`, status, statusLabel: "Demande reçue", next: "Votre conseiller étudie votre demande.", preferredStart: null, travelers: 1, submittedAt: null, lastStatusAt: null, canCancel: true });

afterEach(() => {
  cleanup();
  state.programs = { data: [], isLoading: false }; state.mine = { data: [] };
  state.adminPrograms = { data: [], error: null }; state.adminRequests = { data: [], error: null };
  for (const fn of [state.request, state.cancel, state.save, state.setStatus]) fn.mockReset();
});

describe("séjours côté candidat", () => {
  it("dit honnêtement qu'aucun séjour n'est publié", () => {
    render(<StayOpportunities countryCode="PT" countryName="Portugal" />);
    expect(screen.getByTestId("stay-opportunities-empty").textContent).toMatch(/Aucun séjour/);
  });

  it("montre le prix seulement s'il est publié, sinon renvoie au devis, et n'affiche aucun lien sortant", () => {
    state.programs = { data: [program(1), program(2, { priceLabel: null })], isLoading: false };
    render(<StayOpportunities countryCode="PT" countryName="Portugal" />);
    expect(screen.getByTestId("stay-price-1").textContent).toMatch(/À partir de 450 EUR/);
    expect(screen.getByTestId("stay-price-2").textContent).toMatch(/Tarif communiqué par votre conseiller/);
    expect(screen.getByTestId("stay-program-1").querySelectorAll('a[href^="http"]').length).toBe(0);
  });

  it("n'envoie la demande qu'avec l'accord du candidat", () => {
    state.programs = { data: [program(1)], isLoading: false };
    render(<StayOpportunities countryCode="PT" countryName="Portugal" />);
    fireEvent.click(screen.getByTestId("stay-request-1"));
    const confirm = screen.getByTestId("stay-request-confirm") as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/J'autorise 3M TRAVEL AGENCY à utiliser/));
    fireEvent.click(confirm);
    expect(state.request).toHaveBeenCalledWith({ programId: 1, consent: true, travelers: 1, preferredStart: null, note: null });
  });

  it("bloque au-delà de trois demandes en cours et permet d'annuler", () => {
    state.programs = { data: [program(9)], isLoading: false };
    state.mine = { data: [1, 2, 3].map((id) => request(id)) };
    render(<StayOpportunities countryCode="PT" countryName="Portugal" />);
    expect((screen.getByTestId("stay-request-9") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("stay-my-requests").textContent).toMatch(/3\/3 en cours/);
    fireEvent.click(within(screen.getByTestId("stay-my-requests")).getAllByText("Annuler cette demande")[0]);
    expect(state.cancel).toHaveBeenCalledWith({ requestId: 1 });
  });
});

describe("séjours côté administration", () => {
  const adminProgram = (over: Record<string, unknown> = {}) => ({
    id: 5, countryCode: "PT", city: "Lisbonne", title: "Découverte de Lisbonne", category: "discovery", summary: "Quatre jours accompagnés pour découvrir la ville.", description: "x".repeat(100),
    durationDaysMin: 4, durationDaysMax: 6, seasonNote: null, includedNote: null, visaNote: "Visa Schengen.", priceFrom: "450.00", priceCurrency: "EUR", priceBasis: "par personne", priceSourceNote: "Devis", providerNote: "Prestataire",
    status: "needs_review", checkedAt: null, priceCheckedAt: null, createdAt: null, updatedAt: null, requestsCount: 2, ...over,
  });

  it("signale un prix non relu comme non affiché et prévient quand le texte contient une coordonnée", () => {
    state.adminPrograms = { data: [adminProgram()], error: null };
    render(<AdminStayPrograms sessionToken={"t".repeat(30)} />);
    expect(screen.getByTestId("admin-stay-5").textContent).toMatch(/prix à relire \(non affiché\)/);
    fireEvent.click(within(screen.getByTestId("admin-stay-5")).getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText(/Description détaillée/), { target: { value: "Écrivez à voyages@exemple.org pour réserver." } });
    expect(screen.getByTestId("stay-flags").textContent).toMatch(/voyages@exemple\.org/);
  });

  it("envoie la relecture du séjour et du prix avec l'enregistrement", () => {
    state.adminPrograms = { data: [adminProgram()], error: null };
    render(<AdminStayPrograms sessionToken={"t".repeat(30)} />);
    fireEvent.click(within(screen.getByTestId("admin-stay-5")).getByRole("button", { name: "Modifier" }));
    fireEvent.click(screen.getByLabelText("Séjour relu aujourd'hui"));
    fireEvent.click(screen.getByLabelText("Prix relu aujourd'hui"));
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/ }));
    expect(state.save).toHaveBeenCalledWith(expect.objectContaining({ id: 5, reviewedToday: true, priceReviewedToday: true, priceFrom: "450.00", priceCurrency: "EUR" }));
  });

  it("traite une demande : étape et prévenir le candidat", () => {
    state.adminRequests = { data: [{ id: 3, candidateId: 1, candidateName: "Awa Exemple", candidateEmail: "awa@exemple.org", candidatePhone: null, programTitle: "Découverte de Lisbonne", countryCode: "PT", status: "requested", preferredStart: null, travelers: 2, candidateNote: null, adminNote: null, submittedAt: null, lastStatusAt: null }], error: null };
    render(<AdminStayPrograms sessionToken={"t".repeat(30)} />);
    fireEvent.click(screen.getByRole("tab", { name: /Demandes/ }));
    const row = screen.getByTestId("admin-stay-request-3");
    fireEvent.change(within(row).getByRole("combobox"), { target: { value: "quote_prepared" } });
    fireEvent.click(within(row).getByRole("button", { name: "Enregistrer" }));
    expect(state.setStatus).toHaveBeenCalledWith(expect.objectContaining({ requestId: 3, status: "quote_prepared", notifyCandidate: true }));
  });

  it("relaie le message du serveur quand la migration 0090 n'est pas appliquée", () => {
    state.adminPrograms = { data: [], error: { message: "Les séjours ne sont pas encore activés : la migration 0090 doit être appliquée." } };
    render(<AdminStayPrograms sessionToken={"t".repeat(30)} />);
    expect(screen.getByRole("alert").textContent).toMatch(/migration 0090/);
  });
});
