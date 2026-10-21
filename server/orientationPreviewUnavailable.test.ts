import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ fail: true }));

vi.mock("./geminiEvaluationDraftService", async (importOriginal) => {
  const original = await importOriginal<typeof import("./geminiEvaluationDraftService")>();
  return { ...original, generateGeminiEvaluationDraft: vi.fn(async () => { if (state.fail) throw new Error("OPENAI_API_KEY is not configured"); return { summary: "ok", strengths: [], gapsToClarify: [], documentPriorities: [], advisorQuestions: ["Question ?"], alternatives: [], humanReviewRequired: true as const, disclaimer: "d" }; }) };
});

import { evaluationRouter } from "./routers/evaluation";

const input = { destinationCountry: "Canada", projectType: "travail" as const, countryDetails: {}, consent: true as const };

describe("questions personnalisées — service d'IA indisponible", () => {
  it("renvoie un message clair (et non « erreur interne ») quand l'IA n'est pas configurée ou en panne", async () => {
    state.fail = true;
    await expect(evaluationRouter.createCaller({} as never).geminiOrientationPreview(input)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", message: expect.stringMatching(/momentanément indisponibles.*questionnaire standard/) });
  });

  it("ne cache pas la clé ni le détail technique au candidat", async () => {
    state.fail = true;
    const error = await evaluationRouter.createCaller({} as never).geminiOrientationPreview(input).catch((caught) => caught as Error);
    expect(String(error.message)).not.toMatch(/OPENAI|API_KEY|configured/i);
  });

  it("fonctionne normalement quand l'IA répond", async () => {
    state.fail = false;
    const draft = await evaluationRouter.createCaller({} as never).geminiOrientationPreview(input);
    expect(draft.advisorQuestions).toEqual(["Question ?"]);
  });
});
