import { describe, expect, it } from "vitest";
import { sanitizeEvisaCatalogueSuggestion } from "./evisaCatalogueAssistant";

describe("suggestions IA du catalogue e‑Visa", () => {
  it("conserve le statut de vérification humaine et borne les tableaux", () => {
    const suggestion = sanitizeEvisaCatalogueSuggestion({
      requirements: ["Passeport", "Photo"], feeSuggestion: "50 USD — à confirmer", delaySuggestion: "72 h — à confirmer",
      procedureSteps: ["Contrôler"], precautions: ["Vérifier le portail officiel"], adminReviewNote: "Relecture obligatoire",
    });
    expect(suggestion.requiresOfficialVerification).toBe(true);
    expect(suggestion.requirements).toEqual(["Passeport", "Photo"]);
    expect(suggestion.adminReviewNote).toBe("Relecture obligatoire");
  });

  it("applique des libellés prudents aux données IA absentes", () => {
    const suggestion = sanitizeEvisaCatalogueSuggestion({});
    expect(suggestion.feeSuggestion).toContain("confirmer sur le portail officiel");
    expect(suggestion.delaySuggestion).toContain("confirmer sur le portail officiel");
  });
});
