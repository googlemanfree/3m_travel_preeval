import { describe, expect, it } from "vitest";
import { generateGeminiEvaluationDraft } from "./geminiEvaluationDraftService";

describe("Gemini — brouillon d’orientation contrôlé", () => {
  it("retourne une structure soumise à validation humaine pour un profil fictif", async () => {
    const alternatives = ["Belgique", "Allemagne", "Canada"];
    const draft = await generateGeminiEvaluationDraft({ destinationCountry: "France", projectType: "etudes", nationality: "Camerounaise", age: 24, educationLevel: "licence", languages: "Français courant", countryDetails: { franceProjectStatus: "Candidature universitaire en préparation" }, alternativeCountries: alternatives });
    expect(draft.humanReviewRequired).toBe(true);
    expect(draft.disclaimer).toContain("validation humaine");
    expect(draft.summary.length).toBeGreaterThan(0);
    expect(draft.alternatives.every((alternative) => alternatives.includes(alternative.country))).toBe(true);
  }, 30_000);
});
