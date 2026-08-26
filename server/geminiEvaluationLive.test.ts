import { describe, expect, it } from "vitest";
import { generateGeminiEvaluationDraft } from "./geminiEvaluationDraftService";

describe("Gemini — brouillon d’orientation contrôlé", () => {
  it("retourne une structure soumise à validation humaine pour un profil fictif", async () => {
    const draft = await generateGeminiEvaluationDraft({ destinationCountry: "France", projectType: "etudes", nationality: "Camerounaise", age: 24, educationLevel: "licence", languages: "Français courant", countryDetails: { franceProjectStatus: "Candidature universitaire en préparation" } });
    expect(draft.humanReviewRequired).toBe(true);
    expect(draft.disclaimer).toContain("validation humaine");
    expect(draft.summary.length).toBeGreaterThan(0);
  }, 30_000);
});
