import { describe, expect, it } from "vitest";
import { getCandidateJourney, journeyStepIndex } from "../shared/candidateJourneyCatalog";
import { procedures107Complete } from "../client/src/data/procedures107Complete";

describe("catalogue de parcours candidat pays-visa", () => {
  it("réutilise le catalogue complet des fiches pays disponibles", () => {
    expect(procedures107Complete.length).toBeGreaterThanOrEqual(90);
    expect(procedures107Complete.some((item) => item.name === "Canada" && item.visaType === "travail")).toBe(true);
  });

  it("sélectionne le parcours Canada visiteur", () => {
    const journey = getCandidateJourney("Canada", "Visiteur");
    expect(journey.title).toContain("Visiteur");
    expect(journey.steps.map((item) => item.id)).toEqual(["evaluation", "identity", "funds", "biometrics", "decision"]);
    expect(journey.officialSources[0]).toContain("canada.ca");
  });

  it("sélectionne Arrima pour le parcours Québec", () => {
    const journey = getCandidateJourney("Canada", "Québec · Arrima");
    expect(journey.steps.some((item) => item.id === "arrima")).toBe(true);
    expect(journey.steps.find((item) => item.id === "arrima")?.sourceUrl).toContain("quebec.ca");
  });

  it("impose l’évaluation comme première étape", () => {
    const journey = getCandidateJourney("Luxembourg", "Travailleur");
    expect(journeyStepIndex(journey, "documents", "pending")).toBe(0);
    expect(journeyStepIndex(journey, "documents", "validated")).toBeGreaterThan(0);
  });

  it("ne fabrique pas de portail pour un pays non référencé", () => {
    const journey = getCandidateJourney("Destination à vérifier", "Visiteur");
    expect(journey.officialSources).toEqual([]);
    expect(journey.steps.every((item) => item.sourceUrl === "")).toBe(true);
  });
});
