import { describe, expect, it } from "vitest";
import { normalizeGeminiEvaluationDraft } from "./geminiEvaluationDraftService";

describe("Gemini — brouillon d’orientation contrôlé", () => {
  it("normalise une structure soumise à vérification humaine pour un profil fictif", () => {
    const alternatives = ["Belgique", "Allemagne", "Canada"];
    const draft = normalizeGeminiEvaluationDraft({
      summary: "Profil déclaré à clarifier avec un conseiller.",
      strengths: ["Niveau d’études déclaré"],
      gapsToClarify: ["Confirmer la situation d’admission"],
      documentPriorities: ["Diplôme à vérifier séparément"],
      advisorQuestions: ["Quel établissement avez-vous identifié ?"],
      alternatives: [{ country: "Belgique", rationale: "Piste à vérifier.", checks: ["Consulter une source officielle"] }],
      humanReviewRequired: true,
      disclaimer: "Texte du modèle remplacé par le service.",
    }, alternatives);
    expect(draft.humanReviewRequired).toBe(true);
    expect(draft.disclaimer).toContain("vérification humaine");
    expect(draft.summary.length).toBeGreaterThan(0);
    expect(draft.alternatives.every((alternative) => alternatives.includes(alternative.country))).toBe(true);
  });
});
