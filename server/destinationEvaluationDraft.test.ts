import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [{ message: { content: JSON.stringify({
      verdict: "Profil à approfondir avant orientation.",
      strengths: ["Expérience déclarée cohérente"],
      weaknesses: ["Niveau linguistique à documenter"],
      recommendations: ["Réunir les attestations d’emploi.", "Fournir un résultat linguistique si requis."],
      criteria: { education: 18, experience: 16, languages: 10, market: 24, profile: 11 },
    }) } }],
  })),
}));

import { generateDestinationEvaluationDraft } from "./services/destinationEvaluationDraft";
import { canDeliverEvaluation } from "./routers/unifiedRequests";

describe("brouillon IA par destination", () => {
  it("recalcule exactement le score sur 100 et retourne les garde-fous Canada", async () => {
    const draft = await generateDestinationEvaluationDraft({
      fullName: "Candidate Démonstration",
      destination: "Canada",
      academicLevel: "master",
      diplomaTitle: "Master en logistique",
      fieldOfStudy: "Logistique",
      experienceYears: 5,
      currentJobTitle: "Coordinatrice logistique",
      jobSector: "Logistique",
      languageSkills: "Français courant, anglais intermédiaire",
      nationality: "Camerounaise",
      age: 31,
    }, "canada");

    expect(draft.finalScore).toBe(79);
    expect(draft.modelLabel).toContain("Canada");
    expect(draft.checklist).toContain("Résultat linguistique officiel si requis");
    expect(draft.humanReviewRequired).toBe(true);
  });

  it("interdit toute diffusion tant que le conseiller n’a pas validé le brouillon", () => {
    expect(canDeliverEvaluation(false, "not_required", false)).toBe(false);
    expect(canDeliverEvaluation(true, "pending", true)).toBe(false);
    expect(canDeliverEvaluation(false, "not_required", true)).toBe(true);
    expect(canDeliverEvaluation(true, "approved", true)).toBe(true);
  });
});
