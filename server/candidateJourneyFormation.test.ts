import { describe, expect, it } from "vitest";
import { getCandidateJourney, getEnrichedCandidateJourney } from "../shared/candidateJourneyCatalog";

describe("parcours dépendant de la procédure", () => {
  it("utilise une séquence dédiée et sourcée pour l’Ausbildung allemande", () => {
    const journey = getCandidateJourney("Allemagne", "Formation professionnelle / Ausbildung");
    expect(journey.title).toContain("Ausbildung");
    expect(journey.steps.slice(13).map((step) => step.id)).toEqual([
      "training_path", "training_place", "qualification", "funds_and_insurance",
      "national_visa", "decision", "arrival_registration",
    ]);
    expect(journey.steps.length).toBe(20);
    expect(journey.officialSources).toContain("https://www.make-it-in-germany.com/");
  });

  it("conserve les 13 étapes internes avant les étapes officielles enrichies", () => {
    const journey = getEnrichedCandidateJourney("Allemagne", "Ausbildung");
    expect(journey.steps.length).toBeGreaterThanOrEqual(13);
    expect(journey.steps.slice(0, 13).map((step) => step.id)).toEqual(
      expect.arrayContaining(["cv_submission", "opening_payment", "consular_submission"]),
    );
  });
});
