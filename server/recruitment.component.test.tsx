// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  needCreate: vi.fn(),
  interviewRequest: vi.fn(),
  respond: vi.fn(),
  interviewRespond: vi.fn(),
  review: vi.fn(),
  update: vi.fn(),
  needList: { data: [] as any[], error: null as null | { message: string }, isLoading: false },
  opportunities: { data: undefined as any, error: null as null | { message: string } },
  inbox: { data: undefined as any, error: null as null | { message: string }, isLoading: false, refetch: vi.fn() },
  adminNeed: { data: undefined as any, error: null as null | { message: string }, refetch: vi.fn() },
  search: { data: undefined as any, error: null as null | { message: string }, isFetching: false },
}));

const invalidate = { invalidate: vi.fn() };
vi.mock("@/hooks/useCandidateAuth", () => ({ getCandidateToken: () => "t".repeat(30) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      recruitment: { needList: invalidate, notificationList: invalidate, interviewList: invalidate, needGet: invalidate, candidateOpportunities: invalidate },
      cvtheque: { search: invalidate, selectionList: invalidate, getProfile: invalidate },
    }),
    recruitment: {
      needCreate: { useMutation: () => ({ mutate: state.needCreate, isPending: false }) },
      needList: { useQuery: () => state.needList },
      needGet: { useQuery: () => ({ data: undefined, error: null }) },
      employerDecision: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      interviewRequest: { useMutation: () => ({ mutate: state.interviewRequest, isPending: false }) },
      interviewList: { useQuery: () => ({ data: [], error: null, isLoading: false }) },
      notificationList: { useQuery: () => ({ data: [], error: null, isLoading: false }) },
      notificationsMarkRead: { useMutation: () => ({ mutate: vi.fn() }) },
      candidateOpportunities: { useQuery: () => state.opportunities },
      candidateRespond: { useMutation: () => ({ mutate: state.respond, isPending: false }) },
      candidateInterviewRespond: { useMutation: () => ({ mutate: state.interviewRespond, isPending: false }) },
      adminInbox: { useQuery: () => state.inbox },
      adminNotifications: { useQuery: () => ({ data: [], error: null }) },
      adminNeedGet: { useQuery: () => state.adminNeed },
      adminNeedReview: { useMutation: () => ({ mutate: state.review, isPending: false }) },
      adminNeedCandidateUpdate: { useMutation: () => ({ mutate: state.update, isPending: false }) },
      adminAddCandidateToNeed: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminInterviewUpdate: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    cvtheque: {
      search: { useQuery: () => state.search },
      selectionList: { useQuery: () => ({ data: [], error: null, isLoading: false }) },
      getProfile: { useQuery: () => ({ data: undefined, error: null }) },
      selectionAdd: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      selectionRemove: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { InterviewForm, NeedForm, PartnerNeeds } from "@/components/PartnerRecruitment";
import { PartnerCvtheque } from "@/components/PartnerCvtheque";
import { CandidateOpportunitiesCard } from "@/components/CandidateOpportunitiesCard";
import { AdminRecruitmentInbox } from "@/components/AdminRecruitmentInbox";

const view = (overrides: Record<string, unknown> = {}) => ({ title: "Soudeur", country: "Canada", workLocation: "Québec", contractDuration: "24 mois", salary: "32 CAD brut par heure", employer: "Entreprise examinée par 3M", foreignApplications: "yes", noLocalWorkAuth: "tbc", intlSupport: "to_specify", ...overrides });

beforeEach(() => {
  for (const key of ["needCreate", "interviewRequest", "respond", "interviewRespond", "review", "update"] as const) state[key].mockReset();
  state.needList = { data: [], error: null, isLoading: false };
  state.opportunities = { data: { opportunities: [], interviews: [], notifications: [] }, error: null };
  state.inbox = { data: { needs: [], interviews: [] }, error: null, isLoading: false, refetch: vi.fn() };
  state.search = { data: undefined, error: null, isFetching: false };
});
afterEach(() => cleanup());

describe("formulaire de besoin (employeur)", () => {
  it("propose les trois champs internationaux avec le rappel qu'il s'agit de déclarations sans garantie", () => {
    render(<NeedForm sessionToken={"e".repeat(40)} onDone={vi.fn()} onCancel={vi.fn()} />);
    const fieldset = screen.getByTestId("need-international-fields");
    expect(fieldset.textContent).toMatch(/Candidatures depuis l’étranger acceptées/);
    expect(fieldset.textContent).toMatch(/sans autorisation de travail locale/);
    expect(fieldset.textContent).toMatch(/Accompagnement international/);
    expect(fieldset.textContent).toMatch(/ni une garantie de visa/);
  });

  it("transmet par défaut « À confirmer » : une réponse positive est un choix explicite de l'employeur", () => {
    render(<NeedForm sessionToken={"e".repeat(40)} profileCode="PRF-1234" onDone={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Intitulé du poste/), { target: { value: "Soudeur qualifié" } });
    fireEvent.change(screen.getByLabelText(/Missions/), { target: { value: "Souder des structures métalliques en atelier." } });
    fireEvent.change(screen.getByLabelText(/Pays du poste/), { target: { value: "Canada" } });
    fireEvent.submit(screen.getByTestId("need-form"));
    const payload = state.needCreate.mock.calls[0][0];
    expect(payload).toMatchObject({ profileCode: "PRF-1234", title: "Soudeur qualifié", foreignApplications: "tbc", noLocalWorkAuth: "tbc", intlSupport: "to_specify" });
  });

  it("la demande d'entretien rappelle que le candidat n'est pas contacté directement", () => {
    render(<InterviewForm sessionToken={"e".repeat(40)} profileCode="PRF-1234" onDone={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("interview-form").textContent).toMatch(/3M vérifie votre offre/);
    expect(screen.getByTestId("interview-form").textContent).toMatch(/jamais contacté directement/);
    fireEvent.submit(screen.getByTestId("interview-form"));
    expect(state.interviewRequest).toHaveBeenCalledWith(expect.objectContaining({ profileCode: "PRF-1234", mode: "undecided" }));
  });

  it("l'onglet des besoins invite à déposer un premier besoin", () => {
    render(<PartnerNeeds sessionToken={"e".repeat(40)} />);
    expect(screen.getByText(/Aucun besoin déposé/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Déposer un besoin/ }));
    expect(screen.getByTestId("need-form")).toBeTruthy();
  });
});

describe("boutons de la CVthèque", () => {
  const card = { cvthequeProfileId: 1, profileCode: "PRF-1234", jobTitle: "Soudeur", sector: null, skills: ["Soudure"], educationLevel: null, experienceYears: 4, languages: [], availability: null, destinations: [], residenceCountry: "Cameroun", workAuthorization: "none", verification: { skills: "declared", experience: "declared", education: "declared", languages: "declared" }, summary: "", inSelection: false };

  it("propose « Ajouter à ma sélection », « Proposer un poste » et « Demander un entretien » sur chaque fiche", () => {
    state.search = { data: { total: 1, page: 1, pageSize: 20, items: [card] }, error: null, isFetching: false };
    render(<PartnerCvtheque sessionToken={"e".repeat(40)} mode="search" />);
    fireEvent.submit(screen.getByTestId("cvtheque-q").closest("form")!);
    expect(screen.getByRole("button", { name: /Ajouter à ma sélection/ })).toBeTruthy();
    fireEvent.click(screen.getByTestId("cvtheque-propose"));
    expect(screen.getByTestId("need-form").getAttribute("aria-label")).toMatch(/PRF-1234/);
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    fireEvent.click(screen.getByTestId("cvtheque-interview"));
    expect(screen.getByTestId("interview-form").getAttribute("aria-label")).toMatch(/PRF-1234/);
  });
});

describe("opportunités du candidat", () => {
  it("n'affiche rien tant qu'aucune opportunité n'a été soumise", () => {
    const { container } = render(<CandidateOpportunitiesCard />);
    expect(container.innerHTML).toBe("");
  });

  it("présente une offre examinée, masque l'employeur confidentiel et laisse le choix de décliner", () => {
    state.opportunities = { data: { opportunities: [{ id: 7, status: "candidate_contacted", statusLabel: "Votre réponse est attendue", canRespond: true, view: view(), missions: "Souder des structures." }], interviews: [], notifications: [] }, error: null };
    render(<CandidateOpportunitiesCard />);
    const card = screen.getByTestId("candidate-opportunity");
    expect(card.textContent).toContain("Entreprise examinée par 3M");
    expect(card.textContent).toMatch(/ni une garantie de visa/);
    fireEvent.click(screen.getByRole("button", { name: /Cette offre m’intéresse/ }));
    expect(state.respond).toHaveBeenCalledWith({ candidateToken: "t".repeat(30), needCandidateId: 7, interested: true });
    fireEvent.click(screen.getByRole("button", { name: /Je décline/ }));
    expect(state.respond).toHaveBeenLastCalledWith({ candidateToken: "t".repeat(30), needCandidateId: 7, interested: false });
  });

  it("ne propose de répondre qu'aux demandes qui l'attendent", () => {
    state.opportunities = { data: { opportunities: [], interviews: [{ id: 3, status: "scheduled", mode: "video", scheduledAt: "2026-11-02T10:00:00Z", canRespond: false }, { id: 4, status: "accepted", mode: "phone", scheduledAt: null, canRespond: true }], notifications: [] }, error: null };
    render(<CandidateOpportunitiesCard />);
    expect(screen.getAllByRole("button", { name: /Je suis disponible/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Je suis disponible/ }));
    expect(state.interviewRespond).toHaveBeenCalledWith({ candidateToken: "t".repeat(30), interviewId: 4, available: true });
  });
});

describe("boîte de réception administrateur", () => {
  const need = { id: 5, title: "Soudeur", organization: "Acier Nord", country: "Canada", status: "received", createdAt: "2026-10-20T00:00:00Z", candidatesCount: 1, foreignApplications: "yes", noLocalWorkAuth: "tbc", intlSupport: "yes" };

  it("liste les besoins à examiner et rappelle qu'aucune promesse ne doit être communiquée", () => {
    state.inbox = { data: { needs: [need], interviews: [] }, error: null, isLoading: false, refetch: vi.fn() };
    render(<AdminRecruitmentInbox sessionToken={"a".repeat(30)} />);
    expect(screen.getByTestId("admin-recruitment-inbox").textContent).toMatch(/1 à examiner/);
    expect(screen.getByTestId("admin-recruitment-inbox").textContent).toMatch(/Ni « visa garanti »/);
    expect(screen.getByTestId("admin-need-row").textContent).toMatch(/Candidatures de l’étranger : Oui/);
  });

  it("exige un message pour demander des informations ou refuser, et expose les déclarations comme à confirmer", () => {
    state.inbox = { data: { needs: [need], interviews: [] }, error: null, isLoading: false, refetch: vi.fn() };
    state.adminNeed = {
      data: {
        need: { ...need, missions: "Souder.", beneficiaryConfidential: true, companyName: null, workLocation: null, contractDuration: null, salaryGross: null, salaryCurrency: null, requiredSkills: null, requiredQualifications: null, requiredExperience: null, requiredLanguages: null, intlSupportDetail: null, reviewResidenceCountries: "Cameroun" },
        organization: "Acier Nord", history: [],
        candidates: [{ id: 9, candidateName: "Awa Ndiaye", jobTitle: "Soudeur", profileCode: "PRF-1234", origin: "employer", status: "admin_review", employerDecision: "pending", employerComment: null }],
      }, error: null, refetch: vi.fn(),
    };
    render(<AdminRecruitmentInbox sessionToken={"a".repeat(30)} />);
    fireEvent.click(screen.getByRole("button", { name: "Examiner" }));
    expect(screen.getByTestId("admin-need-international").textContent).toMatch(/à confirmer, aucune garantie/);
    expect((screen.getByRole("button", { name: "Informations complémentaires demandées" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Message ou motif"), { target: { value: "Précisez le salaire." } });
    expect((screen.getByRole("button", { name: "Informations complémentaires demandées" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Soumettre au candidat" }));
    expect(state.update).toHaveBeenCalledWith(expect.objectContaining({ id: 9, status: "candidate_contacted" }));
  });
});
