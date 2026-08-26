import { describe, expect, it } from "vitest";
import { buildGeminiEvaluationPrompt } from "./geminiEvaluationDraftService";

describe("brouillon Gemini d’évaluation", () => {
  it("demande une orientation interne sans décision automatique", () => {
    const prompt = buildGeminiEvaluationPrompt({ destinationCountry: "Allemagne", projectType: "travail", nationality: "Camerounaise", yearsOfExperience: 4, countryDetails: { germanyLanguageLevel: "B1" }, alternativeCountries: ["France", "Belgique", "Canada"] });
    expect(prompt).toContain("N’invente aucune règle");
    expect(prompt).toContain("Ne conclus jamais à l’éligibilité");
    expect(prompt).toContain("humanReviewRequired");
    expect(prompt).toContain("France, Belgique, Canada");
    expect(prompt).toContain("jamais une redirection automatique");
    expect(prompt).toContain("Ne donne ni durée, ni coût, ni salaire");
  });
});
