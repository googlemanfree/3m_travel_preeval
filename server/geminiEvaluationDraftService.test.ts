import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeLLMMock } = vi.hoisted(() => ({ invokeLLMMock: vi.fn() }));

vi.mock("./_core/llm", () => ({
  invokeLLM: invokeLLMMock,
}));

import {
  GEMINI_EVALUATION_MODEL,
  buildGeminiEvaluationPrompt,
  generateGeminiEvaluationDraft,
  normalizeGeminiEvaluationDraft,
} from "./geminiEvaluationDraftService";

const input = {
  destinationCountry: "Canada",
  projectType: "travail" as const,
  nationality: "Camerounaise",
  age: 31,
  sector: "Logistique",
  yearsOfExperience: 5,
  educationLevel: "Licence",
  languages: "Français, anglais",
  financialGuarantee: "Épargne à confirmer",
  countryDetails: {
    canadaLanguageTest: "Test à planifier",
    question_complementaire_1: "Précisez votre expérience récente.",
    reponse_complementaire_1: "Responsable logistique depuis 2022.",
  },
  alternativeCountries: ["France", "Belgique"],
};

describe("brouillon Gemini d’évaluation", () => {
  beforeEach(() => {
    invokeLLMMock.mockReset();
  });

  it("utilise Gemini avec un schéma JSON strict et sans transmettre de fichier", async () => {
    invokeLLMMock.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            summary: "Profil déclaré à examiner avec le conseiller.",
            strengths: ["Expérience déclarée en logistique"],
            gapsToClarify: ["Confirmer le niveau de langue"],
            documentPriorities: ["CV actualisé à vérifier séparément"],
            advisorQuestions: ["Quel est votre niveau de langue attesté ?"],
            alternatives: [{ country: "France", rationale: "Piste à vérifier selon le projet déclaré.", checks: ["Consulter le portail officiel"] }],
            humanReviewRequired: false,
            disclaimer: "Texte du modèle ignoré par le serveur.",
          }),
        },
      }],
    });

    const draft = await generateGeminiEvaluationDraft(input);

    expect(invokeLLMMock).toHaveBeenCalledWith(expect.objectContaining({
      model: GEMINI_EVALUATION_MODEL,
      maxTokens: 1400,
      outputSchema: expect.objectContaining({ strict: true }),
    }));
    const request = invokeLLMMock.mock.calls[0][0];
    expect(JSON.stringify(request)).not.toContain("cvFileUrl");
    expect(JSON.stringify(request)).not.toContain("file_url");
    expect(draft.humanReviewRequired).toBe(true);
    expect(draft.alternatives).toEqual([{ country: "France", rationale: "Piste à vérifier selon le projet déclaré.", checks: ["Consulter le portail officiel"] }]);
  });

  it("écarte les pistes non autorisées et les clauses produites par le modèle", () => {
    const draft = normalizeGeminiEvaluationDraft({
      summary: "Synthèse déclarative.",
      strengths: ["Formation déclarée"],
      gapsToClarify: [],
      documentPriorities: [],
      advisorQuestions: [],
      alternatives: [
        { country: "États-Unis", rationale: "Non autorisée", checks: [] },
        { country: "Belgique", rationale: "À vérifier", checks: ["Source institutionnelle"] },
      ],
      humanReviewRequired: false,
      disclaimer: "Ignoré",
    }, ["France", "Belgique"]);

    expect(draft.alternatives).toEqual([{ country: "Belgique", rationale: "À vérifier", checks: ["Source institutionnelle"] }]);
    expect(draft.humanReviewRequired).toBe(true);
    expect(draft.disclaimer).toContain("vérification humaine");
  });

  it("retire les questions qui demanderaient une donnée sensible", () => {
    const draft = normalizeGeminiEvaluationDraft({
      summary: "Synthèse déclarative.",
      strengths: [],
      gapsToClarify: [],
      documentPriorities: [],
      advisorQuestions: ["Quel est votre numéro de passeport ?", "Quel niveau de langue pouvez-vous confirmer ?"],
      alternatives: [],
      humanReviewRequired: true,
      disclaimer: "Ignoré",
    });

    expect(draft.advisorQuestions).toEqual(["Quel niveau de langue pouvez-vous confirmer ?"]);
  });

  it("délimite les déclarations et interdit explicitement la collecte de données sensibles", () => {
    const prompt = buildGeminiEvaluationPrompt(input);
    expect(prompt).toContain("<declared_profile>");
    expect(prompt).toContain("numéro de passeport");
    expect(prompt).toContain("données bancaires");
    expect(prompt).toContain("France, Belgique");
  });
});
