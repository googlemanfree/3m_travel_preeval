import { describe, expect, it } from "vitest";
import { computeDestinationScore } from "./destinationScoringEngine";

describe("computeDestinationScore", () => {
  it("plafonne les destinations européennes verrouillées et recommande une passerelle", () => {
    const result = computeDestinationScore({
      destinationCategory: "schengen",
      destinationCountry: "Luxembourg",
      educationLevel: "master",
      yearsOfExperience: "10+",
      frenchLevel: "c1_c2",
      englishLevel: "b2",
      currentJobTitle: "Développeur logiciel",
      industrySector: "IT",
      priorVisaRefusal: false,
      criminalRecord: false,
      familyAbroad: false,
    });

    expect(result.strategyType).toBe("passerelle_europeenne");
    expect(result.scoreTotal).toBeLessThanOrEqual(50);
    expect(result.recommendedPath).toContain("Pologne");
  });

  it("calcule un profil direct favorable pour une destination non verrouillée", () => {
    const result = computeDestinationScore({
      destinationCategory: "canada",
      destinationCountry: "Canada",
      educationLevel: "doctorat",
      yearsOfExperience: "10+",
      frenchLevel: "c1_c2",
      englishLevel: "c1_c2",
      currentJobTitle: "Ingénieur logiciel",
      industrySector: "IT",
      priorVisaRefusal: false,
      criminalRecord: false,
      familyAbroad: true,
    });

    expect(result.strategyType).toBe("direct");
    expect(result.scoreTotal).toBeGreaterThanOrEqual(80);
    expect(result.statusLabel).toContain("très favorable");
  });

  it("applique les pénalités prévues sans produire de score négatif", () => {
    const result = computeDestinationScore({
      destinationCategory: "autre",
      destinationCountry: "Émirats Arabes Unis",
      educationLevel: "bac",
      yearsOfExperience: "0-1",
      frenchLevel: "debutant",
      englishLevel: "debutant",
      priorVisaRefusal: true,
      criminalRecord: true,
      familyAbroad: false,
    });

    expect(result.scoreTotal).toBeGreaterThanOrEqual(0);
    expect(result.scoreTotal).toBeLessThanOrEqual(100);
    expect(result.breakdown).toHaveLength(4);
  });
});
