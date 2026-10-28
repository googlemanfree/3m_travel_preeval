// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  offers: { data: [] as any[], isLoading: false },
  mine: { data: [] as any[] },
  adminOffers: { data: [] as any[], error: null as null | { message: string } },
  adminApplications: { data: [] as any[], error: null as null | { message: string } },
  adminReports: { data: [] as any[], error: null as null | { message: string } },
  apply: vi.fn(),
  withdraw: vi.fn(),
  report: vi.fn(),
  setOfferStatus: vi.fn(),
  setApplicationStatus: vi.fn(),
  handleReport: vi.fn(),
}));

vi.mock("@/lib/trpc", () => {
  const mutation = (fn: ReturnType<typeof vi.fn>) => ({ useMutation: () => ({ mutate: fn, isPending: false }) });
  return {
  trpc: {
    useUtils: () => ({ jobOffers: { myApplications: { invalidate: vi.fn() }, list: { invalidate: vi.fn() }, adminOffers: { invalidate: vi.fn() }, adminApplications: { invalidate: vi.fn() }, adminReports: { invalidate: vi.fn() } } }),
    jobOffers: {
      list: { useQuery: () => state.offers },
      myApplications: { useQuery: () => state.mine },
      applyToOffer: mutation(state.apply),
      withdrawApplication: mutation(state.withdraw),
      reportOffer: mutation(state.report),
      adminOffers: { useQuery: () => state.adminOffers },
      adminApplications: { useQuery: () => state.adminApplications },
      adminReports: { useQuery: () => state.adminReports },
      adminSaveOffer: mutation(vi.fn()),
      adminSetOfferStatus: mutation(state.setOfferStatus),
      adminSetApplicationStatus: mutation(state.setApplicationStatus),
      adminHandleReport: mutation(state.handleReport),
    },
  },
  };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { JobOpportunities } from "@/components/JobOpportunities";
import { AdminJobOffers } from "@/components/AdminJobOffers";

const offer = {
  id: 1, reference: "OFF-2026-0001", title: "Soudeur industriel", employer: "Employeur vérifié par l'agence", countryCode: "CA", city: "Ville exemple", contractType: "cdi", contractMonths: null,
  visaSponsorship: "employer_sponsors", salary: { min: "25.00", max: "32.00", currency: "CAD", period: "hour" }, benefits: "Logement la première année", languages: [], diplomas: [], experienceMinYears: 3,
  startDate: "2027-03-01", startFlexible: true, positionsCount: 2, applicationDeadline: "2027-01-15", description: "Poste de soudeur dans un atelier de fabrication métallique.", requirements: "Lecture de plans",
  precheck: [{ key: "experience", label: "Expérience : 3 an(s)", state: "partial", detail: "2 an(s) déclaré(s)" }, { key: "diploma", label: "Diplôme : BTS", state: "unknown", detail: "Non renseigné" }], applied: false,
};
const application = (id: number, status = "submitted") => ({ id, status, statusLabel: "Reçue par l'agence", next: "Votre conseiller examine votre candidature.", reference: `OFF-${id}`, title: `Offre ${id}`, employer: "Employeur vérifié par l'agence", canWithdraw: true });

afterEach(() => {
  cleanup();
  state.offers = { data: [], isLoading: false }; state.mine = { data: [] };
  state.adminOffers = { data: [], error: null }; state.adminApplications = { data: [], error: null }; state.adminReports = { data: [], error: null };
  for (const fn of [state.apply, state.withdraw, state.report, state.setOfferStatus, state.setApplicationStatus, state.handleReport]) fn.mockReset();
});

describe("emploi côté candidat", () => {
  it("dit honnêtement qu'aucune offre n'est ouverte", () => {
    render(<JobOpportunities countryCode="CA" countryName="Canada" />);
    expect(screen.getByTestId("job-opportunities-empty").textContent).toMatch(/Aucune offre vérifiée/);
  });

  it("montre l'offre, le salaire seulement s'il est publié, le pré-contrôle qui informe et aucun lien sortant", () => {
    state.offers = { data: [offer, { ...offer, id: 2, title: "Offre sans salaire", salary: null, precheck: [] }], isLoading: false };
    render(<JobOpportunities countryCode="CA" countryName="Canada" />);
    const card = screen.getByTestId("job-offer-1");
    expect(card.textContent).toMatch(/Salaire : 25 – 32 CAD par heure/);
    expect(card.textContent).toMatch(/Partiel/);
    expect(card.textContent).toMatch(/À préciser/);
    expect(card.textContent).toMatch(/n'empêche jamais de postuler/);
    expect(card.querySelectorAll('a[href^="http"]').length).toBe(0);
    expect(screen.getByTestId("job-offer-2").textContent).toMatch(/Salaire communiqué par votre conseiller/);
  });

  it("n'envoie la candidature qu'avec l'accord du candidat", () => {
    state.offers = { data: [offer], isLoading: false };
    render(<JobOpportunities countryCode="CA" countryName="Canada" />);
    fireEvent.click(screen.getByTestId("job-apply-1"));
    const confirm = screen.getByTestId("job-apply-confirm") as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/J'autorise 3M TRAVEL AGENCY à présenter un profil minimal/));
    fireEvent.click(confirm);
    expect(state.apply).toHaveBeenCalledWith({ offerId: 1, consent: true, note: null });
  });

  it("permet de signaler une offre et bloque au-delà de cinq candidatures en cours", () => {
    state.offers = { data: [offer], isLoading: false };
    state.mine = { data: [1, 2, 3, 4, 5].map((id) => application(id)) };
    render(<JobOpportunities countryCode="CA" countryName="Canada" />);
    expect((screen.getByTestId("job-apply-1") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("job-my-applications").textContent).toMatch(/5\/5 en cours/);
    fireEvent.click(screen.getByTestId("job-report-1"));
    fireEvent.click(screen.getByTestId("job-report-confirm"));
    expect(state.report).toHaveBeenCalledWith({ offerId: 1, reason: "fees_requested", details: null });
    fireEvent.click(within(screen.getByTestId("job-my-applications")).getAllByText("Retirer cette candidature")[0]);
    expect(state.withdraw).toHaveBeenCalledWith({ applicationId: 1 });
  });
});

describe("emploi côté administration", () => {
  const adminOffer = (over: Record<string, unknown> = {}) => ({ id: 9, reference: "OFF-2026-0009", organizationId: null, employerName: "Entreprise exemple", hideEmployerName: false, title: "Soudeur industriel", countryCode: "CA", city: "Ville exemple", contractType: "cdi", visaSponsorship: "employer_sponsors", description: "Atelier de fabrication métallique, travail en équipe, lecture de plans, consignes de sécurité, formation interne à l'arrivée.", requirements: null, languagesJson: [], diplomasJson: [], status: "in_moderation", moderationNote: null, applicationsCount: 2, ...over });

  it("analyse le texte d'une offre : coordonnées et demande d'argent sont signalées avant toute publication", () => {
    state.adminOffers = { data: [adminOffer({ description: "Écrivez à rh@exemple.org. Versez des frais de dossier avant le départ du candidat pour confirmer." })], error: null };
    render(<AdminJobOffers sessionToken={"t".repeat(30)} />);
    fireEvent.click(screen.getByRole("tab", { name: /Offres/ }));
    const flags = screen.getByTestId("offer-flags");
    expect(flags.textContent).toMatch(/rh@exemple\.org/);
    expect(flags.textContent).toMatch(/Demande d'argent possible/);
  });

  it("envoie les quatre contrôles avec la demande de publication", () => {
    state.adminOffers = { data: [adminOffer()], error: null };
    render(<AdminJobOffers sessionToken={"t".repeat(30)} />);
    fireEvent.click(screen.getByRole("tab", { name: /Offres/ }));
    const row = screen.getByTestId("admin-job-offer-9");
    for (const checkbox of within(row).getAllByRole("checkbox")) fireEvent.click(checkbox);
    fireEvent.click(within(row).getByRole("button", { name: "Publier" }));
    expect(state.setOfferStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 9, status: "published", checks: { noFees: true, noDiscrimination: true, noContact: true, visaCoherent: true } }));
  });

  it("traite une candidature : étape, motif de refus codé, prévenir le candidat", () => {
    state.adminApplications = { data: [{ id: 4, candidateId: 3, candidateName: "Awa Exemple", candidateEmail: "awa@exemple.org", candidatePhone: null, offerId: 9, offerReference: "OFF-2026-0009", offerTitle: "Soudeur industriel", status: "submitted", disclosureLevel: 1, precheck: [{ label: "Expérience : 3 an(s)", state: "partial" }], profile: { jobTitle: "Soudeur", yearsOfExperience: "2 ans", educationLevel: null }, coverNote: "Disponible dès mars", rejectionCode: null, adminNote: null, submittedAt: null, lastStatusAt: null }], error: null };
    render(<AdminJobOffers sessionToken={"t".repeat(30)} />);
    const queue = screen.getByTestId("admin-job-applications");
    expect(queue.textContent).toMatch(/Profil minimal présenté : jobTitle : Soudeur/);
    expect(queue.textContent).not.toMatch(/educationLevel/);
    fireEvent.change(within(queue).getAllByRole("combobox")[1], { target: { value: "rejected" } });
    fireEvent.change(within(queue).getAllByRole("combobox")[2], { target: { value: "position_filled" } });
    fireEvent.click(within(queue).getByRole("button", { name: /Enregistrer et prévenir le candidat/ }));
    expect(state.setApplicationStatus).toHaveBeenCalledWith(expect.objectContaining({ applicationId: 4, status: "rejected", rejectionCode: "position_filled", notifyCandidate: true }));
  });

  it("instruit un signalement : décision obligatoire, retrait de l'offre si fondé", () => {
    state.adminReports = { data: [{ id: 2, offerId: 9, offerReference: "OFF-2026-0009", offerTitle: "Soudeur industriel", offerStatus: "in_moderation", reason: "fees_requested", details: "On m'a demandé de payer", status: "open", decisionNote: null, createdAt: null }], error: null };
    render(<AdminJobOffers sessionToken={"t".repeat(30)} />);
    fireEvent.click(screen.getByRole("tab", { name: /Signalements/ }));
    const list = screen.getByTestId("admin-job-reports");
    expect(list.textContent).toMatch(/On me demande de l'argent/);
    fireEvent.change(within(list).getByLabelText("Décision prise"), { target: { value: "Offre retirée" } });
    fireEvent.click(within(list).getByRole("button", { name: /Fondé : retirer l'offre/ }));
    expect(state.handleReport).toHaveBeenCalledWith({ sessionToken: "t".repeat(30), id: 2, status: "upheld", decisionNote: "Offre retirée" });
  });

  it("relaie le message du serveur quand la migration 0089 n'est pas appliquée", () => {
    state.adminOffers = { data: [], error: { message: "Les offres d'emploi ne sont pas encore activées : la migration 0089 doit être appliquée." } };
    render(<AdminJobOffers sessionToken={"t".repeat(30)} />);
    expect(screen.getByRole("alert").textContent).toMatch(/migration 0089/);
  });
});
