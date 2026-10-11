// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

type Handlers = { onSuccess?: (result: any) => unknown; onError?: (error: any) => unknown };

const { state } = vi.hoisted(() => ({
  state: {
    data: undefined as any,
    reviewCalls: [] as any[],
    previewCalls: [] as any[],
    cvCalls: [] as any[],
    cvResult: undefined as any,
    toast: { success: vi.fn(), error: vi.fn() },
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    placementPortal: {
      adminGetCandidateSummary: { useQuery: () => ({ data: state.data, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) },
      adminReviewCandidateSummary: { useMutation: (_handlers: Handlers) => ({ isPending: false, mutate: (variables: any) => state.reviewCalls.push(variables) }) },
      adminPreviewCandidateSummary: { useMutation: (handlers: Handlers) => ({ isPending: false, mutate: (variables: any) => { state.previewCalls.push(variables); handlers.onSuccess?.({ previewPdfDataUrl: "data:application/pdf;base64,APERCU", portraitIncluded: true }); } }) },
      adminGenerateSummaryFromCv: { useMutation: (handlers: Handlers) => ({ isPending: false, mutate: (variables: any) => { state.cvCalls.push(variables); handlers.onSuccess?.(state.cvResult); } }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: state.toast }));

import AdminCandidateSummaryCard from "@/components/AdminCandidateSummaryCard";

const baseData = (overrides: Record<string, unknown> = {}) => ({
  profileId: 3,
  status: "draft",
  draft: { identity: "Aïcha N.", firstName: "Aïcha", destination: "Canada", procedure: "Travail", sector: "Logistique", experience: "6 ans", languages: "Français", profileSummary: "Profil logistique solide.", documents: [] },
  previewPdfDataUrl: "data:application/pdf;base64,INITIAL",
  pdfShareConsent: true,
  photoShareConsent: true,
  portraitAvailable: true,
  portraitIncluded: true,
  profileCode: "PRF-AB12CD34",
  submissionCount: 0,
  ...overrides,
});
const mount = () => render(<AdminCandidateSummaryCard sessionToken="tok-admin" candidateId={5} />);
const field = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement;

beforeEach(() => {
  state.data = baseData();
  state.reviewCalls.length = 0;
  state.previewCalls.length = 0;
  state.cvCalls.length = 0;
  state.cvResult = undefined;
  state.toast.success.mockClear();
  state.toast.error.mockClear();
});
afterEach(() => cleanup());

describe("fiche synthèse (administrateur) : relecture avant diffusion", () => {
  it("affiche l'aperçu PDF, l'état du portrait et des champs relisibles (plus de JSON à éditer à la main)", () => {
    mount();
    expect((screen.getByTitle(/Prévisualisation de la fiche synthèse PDF/) as HTMLIFrameElement).src).toContain("INITIAL");
    expect(screen.getByTestId("summary-portrait-status").textContent).toContain("inclus");
    expect(field(/Résumé du profil/).value).toBe("Profil logistique solide.");
    expect(field(/Destination/).value).toBe("Canada");
    expect(screen.queryByText(/Brouillon JSON/)).toBeNull();
  });

  it("explique pourquoi il n'y a pas de portrait : accord absent, photo absente ou photo illisible", () => {
    state.data = baseData({ photoShareConsent: false, portraitAvailable: false, portraitIncluded: false });
    const { unmount } = mount();
    expect(screen.getByTestId("summary-portrait-status").textContent).toContain("non autorisé");
    unmount();
    state.data = baseData({ portraitAvailable: false, portraitIncluded: false });
    const second = mount();
    expect(screen.getByTestId("summary-portrait-status").textContent).toContain("aucune photo exploitable");
    second.unmount();
    state.data = baseData({ portraitAvailable: true, portraitIncluded: false });
    mount();
    expect(screen.getByTestId("summary-portrait-status").textContent).toContain("illisible");
  });

  it("« Proposer le résumé depuis le CV » remplit les champs et signale ce qui n'est pas dans le CV, sans rien enregistrer", () => {
    state.cvResult = {
      ok: true,
      fields: { headline: "Gestionnaire logistique", profileSummary: "Gestionnaire logistique avec six années d’expérience.", highlights: ["Gestionnaire — TRANSCAM SA (2019 – 2024)", "Compétences : Excel"], languages: "Français (natif), Anglais (B2)" },
      unverified: ["Employeur « TRANSCAM SA » non retrouvé dans le CV"],
      missing: ["Niveau d’espagnol non précisé"],
    };
    mount();
    fireEvent.click(screen.getByTestId("summary-from-cv"));
    expect(state.cvCalls).toEqual([{ sessionToken: "tok-admin", candidateId: 5 }]);
    expect(field(/Intitulé du profil/).value).toBe("Gestionnaire logistique");
    expect(field(/Résumé du profil/).value).toContain("six années");
    expect(field(/Points clés/).value).toBe("Gestionnaire — TRANSCAM SA (2019 – 2024)\nCompétences : Excel");
    expect(field(/Langues/).value).toBe("Français (natif), Anglais (B2)");
    const warnings = screen.getByTestId("summary-cv-warnings").textContent ?? "";
    expect(warnings).toContain("non retrouvé dans le CV");
    expect(warnings).toContain("Niveau d’espagnol non précisé");
    expect(state.reviewCalls).toEqual([]);
  });

  it("sans accord du candidat à la lecture de son CV : l'alerte s'affiche et les champs restent inchangés", () => {
    state.cvResult = { ok: false, reason: "no_cv_consent", error: "Le candidat n’a pas donné son accord distinct à la lecture de son CV par l’IA." };
    mount();
    fireEvent.click(screen.getByTestId("summary-from-cv"));
    expect(screen.getByRole("alert").textContent).toContain("accord distinct à la lecture de son CV");
    expect(field(/Résumé du profil/).value).toBe("Profil logistique solide.");
  });

  it("« Mettre à jour l'aperçu » envoie les corrections en cours (sans identité) et affiche le nouvel aperçu", () => {
    mount();
    fireEvent.change(field(/Résumé du profil/), { target: { value: "Résumé corrigé par l’administrateur." } });
    fireEvent.change(field(/Points clés/), { target: { value: "Premier point\n\nDeuxième point  " } });
    fireEvent.click(screen.getByTestId("summary-refresh-preview"));
    const sent = JSON.parse(state.previewCalls[0].draft);
    expect(state.previewCalls[0]).toMatchObject({ sessionToken: "tok-admin", candidateId: 5 });
    expect(sent.profileSummary).toBe("Résumé corrigé par l’administrateur.");
    expect(sent.highlights).toEqual(["Premier point", "Deuxième point"]);
    expect(sent).not.toHaveProperty("identity");
    expect(sent).not.toHaveProperty("documents");
    expect((screen.getByTitle(/Prévisualisation de la fiche synthèse PDF/) as HTMLIFrameElement).src).toContain("APERCU");
  });

  it("valider envoie le brouillon relu et la note ; au plus 5 points clés partent au serveur", () => {
    mount();
    fireEvent.change(field(/Points clés/), { target: { value: "1\n2\n3\n4\n5\n6\n7" } });
    expect(screen.getByRole("alert").textContent).toContain("5 premières lignes");
    fireEvent.change(screen.getByLabelText(/Note de revue/), { target: { value: "Relue avec le candidat" } });
    fireEvent.click(screen.getByTestId("summary-approve"));
    expect(state.reviewCalls).toHaveLength(1);
    expect(state.reviewCalls[0]).toMatchObject({ sessionToken: "tok-admin", profileId: 3, action: "approve", note: "Relue avec le candidat" });
    expect(JSON.parse(state.reviewCalls[0].draft).highlights).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("sans accord de partage du PDF : la validation est bloquée et l'administrateur est prévenu", () => {
    state.data = baseData({ pdfShareConsent: false });
    mount();
    expect((screen.getByTestId("summary-approve") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("accord au partage");
  });

  it("résumé trop court : validation et aperçu désactivés", () => {
    mount();
    fireEvent.change(field(/Résumé du profil/), { target: { value: "court" } });
    expect((screen.getByTestId("summary-approve") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("summary-refresh-preview") as HTMLButtonElement).disabled).toBe(true);
  });

  it("fiche « à revalider » : l'administrateur voit pourquoi elle n'est plus diffusée", () => {
    state.data = baseData({ status: "needs_revalidation" });
    mount();
    expect(screen.getByText("À revalider")).toBeTruthy();
    expect(screen.getAllByRole("status").some((node) => /n’est plus diffusée/.test(node.textContent ?? ""))).toBe(true);
  });
});
