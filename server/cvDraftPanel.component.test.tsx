// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CvDraft } from "../shared/cvDraft";

type Handlers = { onSuccess?: (result: any) => unknown; onError?: (error: any) => unknown };

const { state } = vi.hoisted(() => ({
  state: {
    generateCalls: [] as any[],
    exportLogs: [] as any[],
    saveCalls: [] as any[],
    next: undefined as undefined | ((handlers: Handlers, variables: any) => unknown),
    download: vi.fn(async (_input: unknown) => "CV_Aicha_Nkolo.pdf"),
    downloadLetter: vi.fn(async (_input: unknown) => "Lettre_Aicha_Nkolo.pdf"),
    toast: { success: vi.fn(), error: vi.fn() },
    packData: null as null | Record<string, unknown>,
    invalidatePack: vi.fn(async () => {}),
    invalidateDashboard: vi.fn(async () => {}),
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      cvDraft: { getApplicationPack: { invalidate: () => state.invalidatePack() } },
      aiEvaluationManagement: { getUnifiedDashboard: { invalidate: () => state.invalidateDashboard() } },
    }),
    cvDraft: {
      getApplicationPack: {
        useQuery: () => ({ data: state.packData, isLoading: false }),
      },
      generate: {
        useMutation: (handlers: Handlers) => ({
          isPending: false,
          mutate: (variables: any) => {
            state.generateCalls.push(variables);
            state.next?.(handlers, variables);
          },
        }),
      },
      generateMotivation: {
        useMutation: () => ({ isPending: false, mutate: vi.fn() }),
      },
      saveApplicationPack: {
        useMutation: (handlers: Handlers) => ({
          isPending: false,
          mutate: (variables: any) => {
            state.saveCalls.push(variables);
            handlers.onSuccess?.({ ok: true, savedAt: "2026-10-12T12:00:00.000Z" });
          },
        }),
      },
      clearApplicationPack: {
        useMutation: () => ({ isPending: false, mutate: vi.fn() }),
      },
      logExport: { useMutation: () => ({ mutate: (variables: any) => state.exportLogs.push(variables) }) },
    },
  },
}));
vi.mock("@/lib/cvPdf", () => ({
  downloadCvPdf: (input: unknown) => state.download(input),
  downloadMotivationLetterPdf: (input: unknown) => state.downloadLetter(input),
}));
vi.mock("sonner", () => ({ toast: state.toast }));

import CvDraftPanel from "@/components/CvDraftPanel";

const identity = { fullName: "Aïcha Nkolo", email: "aicha@example.com", phone: "+237600000000", city: "Yaoundé", nationality: "Camerounaise" };
const draft: CvDraft = {
  headline: "Gestionnaire logistique",
  summary: "Profil logistique.",
  experiences: [{ role: "Gestionnaire logistique", employer: "GOOGLE", location: null, start: "2018", end: "2022", bullets: ["Suivi des expéditions"] }],
  education: [{ degree: "Licence en logistique", institution: "Université de Douala", year: "2017", details: null }],
  skills: ["Logistique"],
  languages: [{ language: "Anglais", level: "B2" }],
  certifications: [],
  missing: ["Niveau de français non précisé"],
};
const success = (handlers: Handlers) =>
  handlers.onSuccess?.({
    style: "canada",
    language: "fr",
    identity,
    supportingFacts: ["Diplôme — Licence"],
    outcome: { ok: true, draft, unverified: ["Employeur « GOOGLE » non retrouvé dans le CV"], model: "test", excerpt: { chars: 300, truncated: false, masked: 1 } },
  });

const mount = (country: string | null = "Canada") => render(<CvDraftPanel evaluationId={7} sessionToken="tok" defaultCountry={country} />);
const generateButton = () => screen.getByRole("button", { name: /Générer le CV|Régénérer/ });

beforeEach(() => {
  state.generateCalls.length = 0;
  state.exportLogs.length = 0;
  state.saveCalls.length = 0;
  state.next = undefined;
  state.packData = null;
  state.download.mockClear();
  state.downloadLetter.mockClear();
  state.toast.success.mockClear();
  state.toast.error.mockClear();
  state.invalidatePack.mockClear();
  state.invalidateDashboard.mockClear();
});
afterEach(() => cleanup());

describe("panneau pack candidature admin", () => {
  it("propose le format canadien et le français pour une destination Canada, et demande la génération avec ces valeurs", () => {
    mount("Canada");
    expect((screen.getByLabelText("Format du CV") as HTMLSelectElement).value).toBe("canada");
    expect((screen.getByLabelText("Langue du CV") as HTMLSelectElement).value).toBe("fr");
    fireEvent.click(generateButton());
    expect(state.generateCalls).toEqual([{ sessionToken: "tok", evaluationId: 7, style: "canada", language: "fr", targetRole: undefined }]);
  });

  it("changer de format reprend la langue habituelle de ce format (international → anglais)", () => {
    mount("Canada");
    fireEvent.change(screen.getByLabelText("Format du CV"), { target: { value: "international" } });
    expect((screen.getByLabelText("Langue du CV") as HTMLSelectElement).value).toBe("en");
  });

  it("sans pack enregistré : pré-sélectionne le format recommandé par la préparation", async () => {
    state.packData = {
      pack: null,
      readiness: {
        score: 25,
        readyToApply: false,
        recommendedStyle: "international",
        recommendedLanguage: "en",
        checks: [],
      },
      identity,
      supportingFacts: [],
    };
    mount("Canada");
    await waitFor(() => {
      expect((screen.getByLabelText("Format du CV") as HTMLSelectElement).value).toBe("international");
      expect((screen.getByLabelText("Langue du CV") as HTMLSelectElement).value).toBe("en");
    });
  });

  it("recharge le pack enregistré et affiche le tableau de préparation", async () => {
    state.packData = {
      pack: {
        savedAt: "2026-10-12T12:00:00.000Z",
        savedBy: "agent@3mtravelagency.com",
        style: "canada",
        language: "fr",
        includeContact: true,
        targetRole: "Logisticien",
        draft,
        motivationLetter: "Madame, Monsieur…",
      },
      readiness: {
        score: 85,
        readyToApply: true,
        recommendedStyle: "canada",
        recommendedLanguage: "fr",
        checks: [
          { key: "cv_pack", label: "CV international enregistré (admin)", done: true, detail: "Format canada · FR prêt pour candidature." },
          { key: "letter", label: "Lettre de motivation", done: true, detail: "Lettre jointe au pack admin." },
        ],
      },
      identity,
      supportingFacts: ["Diplôme — Licence"],
    };
    mount();
    expect(await screen.findByTestId("cv-application-readiness")).toBeTruthy();
    expect(screen.getByTestId("cv-application-readiness").textContent).toContain("85%");
    expect(screen.getByTestId("cv-application-readiness").textContent).toContain("Prêt à postuler");
    expect(await screen.findByDisplayValue("GOOGLE")).toBeTruthy();
    expect(screen.getByDisplayValue("Madame, Monsieur…")).toBeTruthy();
  });

  it("sans accord du candidat : le message de refus s'affiche et aucun brouillon ni export n'est proposé", async () => {
    state.next = (handlers) => handlers.onSuccess?.({ style: "canada", language: "fr", identity, outcome: { ok: false, reason: "no_cv_consent", error: "Le candidat n’a pas donné son accord distinct à la lecture de son CV par l’IA." } });
    mount();
    fireEvent.click(generateButton());
    expect((await screen.findByRole("alert")).textContent).toContain("accord distinct à la lecture de son CV");
    expect(screen.queryByRole("button", { name: /PDF admin/ })).toBeNull();
  });

  it("une erreur de session (non administrateur) est affichée telle quelle", async () => {
    state.next = (handlers) => handlers.onError?.(new Error("Session administrateur invalide."));
    mount();
    fireEvent.click(generateButton());
    expect((await screen.findByRole("alert")).textContent).toContain("Session administrateur invalide.");
  });

  it("affiche les éléments non retrouvés dans le CV et les champs à compléter, et laisse corriger avant l'export", async () => {
    state.next = success;
    mount();
    fireEvent.click(generateButton());
    const warnings = await screen.findByTestId("cv-draft-warnings");
    expect(warnings.textContent).toContain("Employeur « GOOGLE » non retrouvé dans le CV");
    expect(warnings.textContent).toContain("Niveau de français non précisé");
    expect(screen.getByRole("button", { name: /Régénérer/ })).toBeTruthy();
  });

  it("exporte le PDF avec les valeurs CORRIGÉES par l'administrateur, avec coordonnées par défaut, puis trace l'export", async () => {
    state.next = success;
    mount();
    fireEvent.click(generateButton());
    const employer = await screen.findByDisplayValue("GOOGLE");
    fireEvent.change(employer, { target: { value: "TRANSCAM SA" } });
    fireEvent.click(screen.getByRole("button", { name: /PDF admin/ }));
    await waitFor(() => expect(state.download).toHaveBeenCalledTimes(1));
    const sent = state.download.mock.calls[0][0] as { identity: unknown; draft: CvDraft; language: string; includeContact: boolean };
    expect(sent.draft.experiences[0].employer).toBe("TRANSCAM SA");
    expect(sent.language).toBe("fr");
    expect(sent.includeContact).toBe(true);
    expect(sent.identity).toEqual(identity);
    await waitFor(() => expect(state.exportLogs).toEqual([{ sessionToken: "tok", evaluationId: 7, style: "canada" }]));
    expect(state.toast.success).toHaveBeenCalled();
  });

  it("exporte la lettre en PDF quand un texte est présent", async () => {
    state.next = success;
    mount();
    fireEvent.click(generateButton());
    await screen.findByDisplayValue("GOOGLE");
    fireEvent.change(screen.getByPlaceholderText(/Générez une proposition/), { target: { value: "Madame, Monsieur,\n\nJe postule." } });
    fireEvent.click(screen.getByTestId("cv-download-letter-pdf"));
    await waitFor(() => expect(state.downloadLetter).toHaveBeenCalledTimes(1));
    expect(state.downloadLetter.mock.calls[0][0]).toMatchObject({ letter: "Madame, Monsieur,\n\nJe postule.", language: "fr" });
  });

  it("enregistre le pack admin et invalide le cache", async () => {
    state.next = success;
    mount();
    fireEvent.click(generateButton());
    await screen.findByDisplayValue("GOOGLE");
    fireEvent.click(screen.getByTestId("cv-save-application-pack"));
    await waitFor(() => expect(state.saveCalls).toHaveLength(1));
    expect(state.saveCalls[0]).toMatchObject({ sessionToken: "tok", evaluationId: 7, style: "canada" });
    expect(state.invalidatePack).toHaveBeenCalled();
    expect(state.invalidateDashboard).toHaveBeenCalled();
  });

  it("peut ajouter et supprimer une expérience", async () => {
    state.next = success;
    mount();
    fireEvent.click(generateButton());
    await screen.findByDisplayValue("GOOGLE");
    fireEvent.click(screen.getByRole("button", { name: /Ajouter une expérience/ }));
    expect(screen.getAllByRole("button", { name: /Supprimer cette expérience/ })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: /Supprimer cette expérience/ })[0]);
    expect(screen.queryByDisplayValue("GOOGLE")).toBeNull();
  });
});
