// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  myState: { data: undefined as any, error: null as null | { message: string } },
  search: { data: undefined as any, error: null as null | { message: string }, isFetching: false },
  selection: { data: [] as any[], error: null as null | { message: string }, isLoading: false },
  queue: { data: [] as any[], error: null as null | { message: string }, isLoading: false, refetch: vi.fn() },
  request: vi.fn(),
  withdraw: vi.fn(),
  save: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  review: vi.fn(),
}));

vi.mock("@/hooks/useCandidateAuth", () => ({ getCandidateToken: () => "t".repeat(30) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ cvtheque: { myState: { invalidate: vi.fn() }, search: { invalidate: vi.fn() }, selectionList: { invalidate: vi.fn() }, getProfile: { invalidate: vi.fn() } } }),
    cvtheque: {
      myState: { useQuery: () => state.myState },
      saveDeclared: { useMutation: () => ({ mutate: state.save, isPending: false }) },
      requestPublication: { useMutation: () => ({ mutate: state.request, isPending: false }) },
      withdraw: { useMutation: () => ({ mutate: state.withdraw, isPending: false }) },
      search: { useQuery: () => state.search },
      selectionList: { useQuery: () => state.selection },
      getProfile: { useQuery: () => ({ data: undefined, error: null }) },
      selectionAdd: { useMutation: () => ({ mutate: state.add, isPending: false }) },
      selectionRemove: { useMutation: () => ({ mutate: state.remove, isPending: false }) },
      adminQueue: { useQuery: () => state.queue },
      adminReview: { useMutation: () => ({ mutate: state.review, isPending: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { CvthequePresenceCard } from "@/components/CvthequePresenceCard";
import { PartnerCvtheque } from "@/components/PartnerCvtheque";
import { AdminCvthequeReview } from "@/components/AdminCvthequeReview";
import { PrivacyNotice } from "@/components/PrivacyNotice";

const entry = (overrides: Record<string, unknown> = {}) => ({ visibilityState: "draft", jobTitle: "Soudeur", skills: "Soudure, lecture de plans", educationLevel: "", experienceYears: 5, languages: "Français", availability: "immediate", destinations: "Canada", residenceCountry: "Cameroun", workAuthorization: "none", reviewNote: null, publishedAt: null, nextReviewAt: null, ...overrides });

beforeEach(() => {
  state.request.mockReset(); state.withdraw.mockReset(); state.save.mockReset(); state.add.mockReset(); state.remove.mockReset(); state.review.mockReset();
  state.myState = { data: { consentVersion: "v-test", eligibility: { hasProfile: true, placementConsentGranted: true, summaryApproved: true }, entry: entry() }, error: null };
  state.search = { data: undefined, error: null, isFetching: false };
  state.selection = { data: [], error: null, isLoading: false };
  state.queue = { data: [], error: null, isLoading: false, refetch: vi.fn() };
});
afterEach(() => cleanup());

describe("fiche du candidat dans la CVthèque", () => {
  it("demande un consentement distinct, explicite, avant toute demande de publication", () => {
    render(<CvthequePresenceCard />);
    const button = screen.getByRole("button", { name: /Demander la publication/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(screen.getByTestId("cvtheque-consent"));
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(state.request).toHaveBeenCalledWith({ candidateToken: "t".repeat(30), consent: true, consentVersion: "v-test" });
  });

  it("précise que le diplôme est facultatif et que l'autorisation de travail est une déclaration sans lien avec un visa", () => {
    render(<CvthequePresenceCard />);
    expect(screen.getByText(/Le diplôme n’est pas obligatoire/)).toBeTruthy();
    expect(screen.getByText(/n’indique aucune admissibilité à un visa/)).toBeTruthy();
    expect(screen.getByTestId("privacy-notice-cvtheque_candidate").textContent).toMatch(/jamais affichés dans la CVthèque/);
  });

  it("permet de retirer une fiche publiée sans supprimer le compte", () => {
    state.myState.data.entry = entry({ visibilityState: "published", nextReviewAt: "2027-10-20T00:00:00Z" });
    render(<CvthequePresenceCard />);
    expect(screen.getByTestId("cvtheque-state").textContent).toContain("Visible des employeurs vérifiés");
    fireEvent.click(screen.getByTestId("cvtheque-withdraw"));
    expect(state.withdraw).toHaveBeenCalledWith({ candidateToken: "t".repeat(30) });
    expect(screen.getByText(/ne supprime pas votre compte/)).toBeTruthy();
  });

  it("n'ouvre rien tant que la fiche professionnelle ou le partage anonymisé manquent", () => {
    state.myState.data = { consentVersion: "v-test", eligibility: { hasProfile: true, placementConsentGranted: false, summaryApproved: false }, entry: null };
    render(<CvthequePresenceCard />);
    expect(screen.getByText(/Activez d’abord/)).toBeTruthy();
    expect(screen.queryByTestId("cvtheque-consent")).toBeNull();
    cleanup();
    state.myState.data = { consentVersion: "v-test", eligibility: { hasProfile: false, placementConsentGranted: false, summaryApproved: false }, entry: null };
    render(<CvthequePresenceCard />);
    expect(screen.getByText(/préparée par 3M/)).toBeTruthy();
  });
});

const card = (overrides: Record<string, unknown> = {}) => ({ cvthequeProfileId: 1, profileCode: "PRF-AB12CD34", jobTitle: "Soudeur", sector: "BTP", skills: ["Soudure", "Lecture de plans"], educationLevel: null, experienceYears: 6, languages: ["Français"], availability: "immediate", destinations: ["Canada"], residenceCountry: "Cameroun", workAuthorization: "none", verification: { skills: "document_examined", experience: "declared", education: "declared", languages: "declared" }, summary: "Profil anonymisé.", publishedAt: null, inSelection: false, ...overrides });

describe("CVthèque côté partenaire", () => {
  it("n'affiche aucune identité, distingue déclaré / examiné et présente l'autorisation de travail comme déclarée", () => {
    state.search.data = { total: 1, page: 1, pageSize: 12, items: [card()] };
    render(<PartnerCvtheque sessionToken={"s".repeat(40)} mode="search" />);
    fireEvent.submit(screen.getByTestId("cvtheque-q").closest("form") as HTMLFormElement);
    const element = screen.getByTestId("cvtheque-card");
    expect(element.textContent).toContain("PRF-AB12CD34");
    expect(element.textContent).toContain("Cameroun");
    expect(element.textContent).toMatch(/déclarée par le candidat, non vérifiée/);
    expect(screen.getByTestId("cvtheque-verification").textContent).toMatch(/Compétences : Pièce examinée par 3M/);
    expect(screen.getByTestId("cvtheque-verification").textContent).toMatch(/Expérience : Déclaré par le candidat/);
    expect(element.textContent).not.toMatch(/nationalit|passeport|@|\+\d/i);
    expect(screen.getByTestId("partner-cvtheque").textContent).toMatch(/n’indique ni admissibilité à un visa, ni emploi garanti/);
    expect(screen.getByTestId("partner-cvtheque").textContent).not.toMatch(/visa garanti/i);
  });

  it("le filtre de formation est facultatif et clairement présenté comme tel", () => {
    render(<PartnerCvtheque sessionToken={"s".repeat(40)} mode="search" />);
    expect(screen.getByText(/le diplôme n’est jamais obligatoire/)).toBeTruthy();
  });

  it("ajoute puis retire un profil de la sélection", () => {
    state.search.data = { total: 1, page: 1, pageSize: 12, items: [card()] };
    const { rerender } = render(<PartnerCvtheque sessionToken={"s".repeat(40)} mode="search" />);
    fireEvent.submit(screen.getByTestId("cvtheque-q").closest("form") as HTMLFormElement);
    fireEvent.click(screen.getByRole("button", { name: /Ajouter à ma sélection/ }));
    expect(state.add).toHaveBeenCalledWith({ sessionToken: "s".repeat(40), profileCode: "PRF-AB12CD34" });
    state.search.data = { total: 1, page: 1, pageSize: 12, items: [card({ inSelection: true })] };
    rerender(<PartnerCvtheque sessionToken={"s".repeat(40)} mode="search" />);
    fireEvent.click(screen.getByRole("button", { name: /Dans ma sélection/ }));
    expect(state.remove).toHaveBeenCalledWith({ sessionToken: "s".repeat(40), profileCode: "PRF-AB12CD34" });
  });

  it("explique clairement un refus de permission ou une limite atteinte", () => {
    state.search.error = { message: "Votre compte n’a pas cette permission. Demandez-la au gestionnaire de votre organisation." };
    render(<PartnerCvtheque sessionToken={"s".repeat(40)} mode="search" />);
    fireEvent.submit(screen.getByTestId("cvtheque-q").closest("form") as HTMLFormElement);
    expect(screen.getByRole("status").textContent).toMatch(/permission/);
  });

  it("affiche la sélection personnelle et une sélection vide", () => {
    state.selection.data = [card({ inSelection: true, note: "À rappeler" })];
    render(<PartnerCvtheque sessionToken={"s".repeat(40)} mode="selection" />);
    expect(screen.getByText(/Ma note : À rappeler/)).toBeTruthy();
    cleanup();
    state.selection.data = [];
    render(<PartnerCvtheque sessionToken={"s".repeat(40)} mode="selection" />);
    expect(screen.getByText(/Votre sélection est vide/)).toBeTruthy();
  });
});

describe("examen administrateur des fiches", () => {
  const row = (overrides: Record<string, unknown> = {}) => ({ id: 3, candidateId: 12, candidateName: "Awa Test", profileCode: "PRF-ZZ99", visibilityState: "pending_review", jobTitle: "Aide-soignante", skills: ["Soins"], educationLevel: null, experienceYears: 4, languages: ["Français"], availability: null, destinations: ["Canada"], residenceCountry: "Cameroun", workAuthorization: "not_specified", verification: { skills: "declared", experience: "declared", education: "declared", languages: "declared" }, reviewNote: null, publishedAt: null, nextReviewAt: null, placementConsentGranted: true, summaryApproved: true, updatedAt: "2026-10-20T00:00:00Z", ...overrides });

  it("ne permet de publier que si le partage est autorisé et le résumé approuvé", () => {
    state.queue.data = [row({ summaryApproved: false })];
    render(<AdminCvthequeReview sessionToken={"s".repeat(40)} />);
    expect((screen.getByTestId("cvtheque-publish") as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    state.queue.data = [row()];
    render(<AdminCvthequeReview sessionToken={"s".repeat(40)} />);
    expect((screen.getByTestId("cvtheque-publish") as HTMLButtonElement).disabled).toBe(false);
  });

  it("transmet les niveaux de vérification choisis et exige un motif pour refuser", () => {
    state.queue.data = [row()];
    render(<AdminCvthequeReview sessionToken={"s".repeat(40)} />);
    const refuse = screen.getByRole("button", { name: "Refuser" }) as HTMLButtonElement;
    expect(refuse.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Compétences"), { target: { value: "verified" } });
    fireEvent.click(screen.getByTestId("cvtheque-publish"));
    expect(state.review).toHaveBeenCalledTimes(1);
    expect(state.review.mock.calls[0][0]).toMatchObject({ id: 3, decision: "publish", verification: { skills: "verified", experience: "declared", education: "declared", languages: "declared" } });
    fireEvent.change(screen.getByLabelText("Motif de la décision"), { target: { value: "Pièces illisibles" } });
    expect(refuse.disabled).toBe(false);
  });
});

describe("information de confidentialité", () => {
  it("indique honnêtement qu'une durée est en cours de validation et ne revendique aucune conformité", () => {
    render(<PrivacyNotice notice="partner_registration" />);
    const text = screen.getByTestId("privacy-notice-partner_registration").textContent ?? "";
    expect(text).toMatch(/en cours de validation/);
    expect(text).toMatch(/Qui peut y accéder/);
    expect(text).toMatch(/Destinataires possibles/);
    expect(text).not.toMatch(/conforme/i);
  });
});
