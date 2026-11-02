// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  schools: { data: [] as any[], isLoading: false },
  mine: { data: [] as any[] },
  tree: { data: undefined as any, error: null as null | { message: string } },
  queue: { data: [] as any[], error: null as null | { message: string } },
  apply: vi.fn(),
  withdraw: vi.fn(),
  setStatus: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ studyCatalog: { myApplications: { invalidate: vi.fn() }, adminTree: { invalidate: vi.fn() }, adminApplications: { invalidate: vi.fn() } } }),
    studyCatalog: {
      schools: { useQuery: () => state.schools },
      myApplications: { useQuery: () => state.mine },
      applyToIntake: { useMutation: () => ({ mutate: state.apply, isPending: false }) },
      withdraw: { useMutation: () => ({ mutate: state.withdraw, isPending: false }) },
      adminTree: { useQuery: () => state.tree },
      adminApplications: { useQuery: () => state.queue },
      adminDelete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminSetApplicationStatus: { useMutation: () => ({ mutate: state.setStatus, isPending: false }) },
      adminSaveInstitution: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminSaveProgram: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminSaveIntake: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminSaveFee: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { StudyOpportunities } from "@/components/StudyOpportunities";
import { AdminStudyCatalog } from "@/components/AdminStudyCatalog";

const school = {
  id: 1, name: "Université exemple", city: "Ville exemple", institutionType: "university", publicPrivate: "public", agencyRelation: "partner", accreditationNote: "Établissement reconnu",
  programs: [{
    id: 10, name: "Master en informatique", level: "master", field: "Informatique", teachingLanguage: "anglais", durationMonths: 24, mode: "on_site", admissionNote: "Licence requise", languageNote: "Anglais B2",
    intakes: [{ id: 100, label: "Automne 2027", startDate: "2027-09-01", applicationsOpenAt: null, applicationDeadline: "2027-03-01", availability: "open", canApply: true }, { id: 101, label: "Hiver 2026", startDate: "2026-12-01", applicationsOpenAt: null, applicationDeadline: "2026-09-01", availability: "closed", canApply: false }],
    fees: [{ id: 5, studentCategory: "international", label: "12 500 EUR par an · année 2026-2027 · indicatif", applicationFee: "100.00", extraNote: null, stale: false }],
  }],
};

afterEach(() => {
  cleanup();
  state.schools = { data: [], isLoading: false };
  state.mine = { data: [] };
  state.tree = { data: undefined, error: null };
  state.queue = { data: [], error: null };
  state.apply.mockReset(); state.withdraw.mockReset(); state.setStatus.mockReset();
});

describe("études côté candidat : écoles, rentrées, scolarités et candidature", () => {
  it("dit honnêtement qu'aucune école n'est publiée", () => {
    render(<StudyOpportunities countryCode="CA" countryName="Canada" />);
    expect(screen.getByTestId("study-opportunities-empty").textContent).toMatch(/Aucune école n'est encore publiée/);
  });

  it("montre rentrées, dates limites et scolarité avec année, devise et « indicatif », et aucun lien sortant", () => {
    state.schools = { data: [school], isLoading: false };
    render(<StudyOpportunities countryCode="CA" countryName="Canada" />);
    const card = screen.getByTestId("study-school-1");
    expect(within(card).getByText("Master en informatique")).toBeTruthy();
    expect(card.textContent).toMatch(/12 500 EUR par an · année 2026-2027 · indicatif/);
    expect(card.textContent).toMatch(/Candidatures jusqu'au 1 mars 2027/);
    expect(card.querySelectorAll('a[href^="http"]').length).toBe(0);
    expect((screen.getByTestId("study-apply-101") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("study-apply-100") as HTMLButtonElement).disabled).toBe(false);
  });

  it("n'envoie la candidature qu'après l'accord du candidat", () => {
    state.schools = { data: [school], isLoading: false };
    render(<StudyOpportunities countryCode="CA" countryName="Canada" />);
    fireEvent.click(screen.getByTestId("study-apply-100"));
    const confirm = screen.getByTestId("study-apply-confirm") as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/J'autorise 3M TRAVEL AGENCY/));
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);
    expect(state.apply).toHaveBeenCalledWith({ intakeId: 100, consent: true, note: null });
  });

  it("affiche mes candidatures avec leur étape, bloque au-delà de trois vœux et permet de retirer", () => {
    state.schools = { data: [school], isLoading: false };
    const app = (id: number, rank: number, status = "submitted_to_agency") => ({ id, rank, status, statusLabel: "Reçue par l'agence", next: "Votre conseiller examine votre demande.", institutionName: id === 1 ? "Université exemple" : `École ${id}`, programName: id === 1 ? "Master en informatique" : "Programme", intakeLabel: id === 1 ? "Automne 2027" : "Hiver", canWithdraw: true });
    state.mine = { data: [app(1, 1), app(2, 2), app(3, 3)] };
    render(<StudyOpportunities countryCode="CA" countryName="Canada" />);
    expect(screen.getByTestId("study-my-applications").textContent).toMatch(/3\/3 en cours/);
    expect((screen.getByTestId("study-apply-100") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(screen.getByTestId("study-my-applications")).getAllByText("Retirer cette candidature")[0]);
    expect(state.withdraw).toHaveBeenCalledWith({ applicationId: 1 });
  });
});

describe("études côté administration : file des candidatures et catalogue", () => {
  const institution = { id: 1, countryCode: "CA", city: "Ville exemple", name: "Université exemple", institutionType: "university", publicPrivate: "public", accreditationNote: "Reconnue", adminWebsite: "https://www.exemple.org", agencyRelation: "partner", status: "published", checkedAt: new Date().toISOString() };

  it("liste les candidatures à traiter et enregistre une nouvelle étape en prévenant le candidat", () => {
    state.queue = { data: [{ id: 7, candidateId: 3, candidateName: "Awa Exemple", candidateEmail: "awa@exemple.org", candidatePhone: null, rank: 1, status: "submitted_to_agency", institutionName: "Université exemple", countryCode: "CA", programName: "Master en informatique", intakeLabel: "Automne 2027", applicationDeadline: "2027-03-01", candidateNote: "Je souhaite l'option IA", adminNote: null, institutionReference: null, submittedAt: null, lastStatusAt: null }], error: null };
    render(<AdminStudyCatalog sessionToken={"t".repeat(30)} />);
    const queue = screen.getByTestId("admin-study-applications");
    expect(queue.textContent).toMatch(/Awa Exemple/);
    expect(queue.textContent).toMatch(/Je souhaite l'option IA/);
    fireEvent.change(within(queue).getAllByRole("combobox")[1], { target: { value: "agency_review" } });
    fireEvent.click(within(queue).getByRole("button", { name: /Enregistrer et prévenir le candidat/ }));
    expect(state.setStatus).toHaveBeenCalledWith(expect.objectContaining({ applicationId: 7, status: "agency_review", notifyCandidate: true }));
  });

  it("affiche le catalogue du pays, le site de l'établissement et la provenance des montants côté administration", () => {
    state.tree = { data: { institutions: [institution], programs: [{ id: 10, institutionId: 1, name: "Master en informatique", level: "master", field: "Informatique", teachingLanguage: "anglais", durationMonths: 24, mode: "on_site", admissionNote: null, languageNote: null, status: "published", checkedAt: null }], intakes: [{ id: 100, programId: 10, label: "Automne 2027", startDate: "2027-09-01", applicationsOpenAt: null, applicationDeadline: "2027-03-01", documentsDeadline: null, availability: "open", status: "published", checkedAt: null }], fees: [{ id: 5, programId: 10, academicYear: "2026-2027", studentCategory: "international", amount: "12500.00", currency: "EUR", period: "year", applicationFee: null, extraNote: null, sourceNote: "Grille tarifaire de l'établissement", status: "published", checkedAt: new Date().toISOString() }] }, error: null };
    render(<AdminStudyCatalog sessionToken={"t".repeat(30)} />);
    const block = screen.getByTestId("admin-study-institution-1");
    expect(within(block).getByRole("link", { name: "https://www.exemple.org" })).toBeTruthy();
    expect(block.textContent).toMatch(/Automne 2027/);
    expect(block.textContent).toMatch(/source : Grille tarifaire de l'établissement/);
    expect(block.textContent).toMatch(/12\s500 EUR/);
  });

  it("relaie le message du serveur quand la migration 0088 n'est pas appliquée", () => {
    state.tree = { data: undefined, error: { message: "Le catalogue études n'est pas encore activé : la migration 0088 doit être appliquée." } };
    render(<AdminStudyCatalog sessionToken={"t".repeat(30)} />);
    expect(screen.getByRole("alert").textContent).toMatch(/migration 0088/);
  });
});
