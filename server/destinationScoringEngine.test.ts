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

  it("évalue un projet études sans checklist CV / permis de travail", () => {
    const result = computeDestinationScore({
      destinationCategory: "canada",
      destinationCountry: "Canada",
      educationLevel: "licence",
      frenchLevel: "b2",
      englishLevel: "b2",
      projectType: "etudes",
      visaType: "canada_etude",
      studyCycle: "master",
      fundingDeclared: true,
    });

    expect(result.projectKind).toBe("etudes");
    expect(result.strategyType).toBe("etudes");
    expect(result.documentChecklist.join(" ")).toMatch(/Diplômes|relevés|financement|cycle/i);
    expect(result.documentChecklist.join(" ")).not.toMatch(/\bCV\b/);
    expect(result.recommendedPath).not.toMatch(/employeur|permis de travail/i);
    expect(result.breakdown.some((row) => /études|cycle|financement/i.test(row.label))).toBe(true);
  });

  it("évalue un projet visiteurs sur statut / motif / attaches", () => {
    const result = computeDestinationScore({
      destinationCategory: "schengen",
      destinationCountry: "France",
      projectType: "tourisme",
      visaType: "schengen_tourisme",
      visitorStatus: "employe",
      visitReason: "Visite familiale de deux semaines à Paris chez mon frère",
      fundingDeclared: true,
      frenchLevel: "b1",
    });

    expect(result.projectKind).toBe("tourisme");
    expect(result.strategyType).toBe("visite");
    expect(result.documentChecklist.join(" ")).toMatch(/statut|motif|attaches|fonds/i);
    expect(result.documentChecklist.join(" ")).not.toMatch(/CV à jour/i);
    expect(result.statusLabel).toMatch(/visite/i);
  });

  it("n’applique pas la passerelle Luxembourg à un dossier études", () => {
    const result = computeDestinationScore({
      destinationCategory: "schengen",
      destinationCountry: "Luxembourg",
      educationLevel: "master",
      projectType: "etudes",
      studyCycle: "master",
      fundingDeclared: true,
      frenchLevel: "c1_c2",
    });

    expect(result.strategyType).toBe("etudes");
    expect(result.scoreTotal).toBeGreaterThan(50);
    expect(result.legalContext).toMatch(/études|académique/i);
    expect(result.legalContext).not.toMatch(/ADEM|marché du travail/i);
  });
});
