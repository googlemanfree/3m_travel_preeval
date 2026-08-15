import { describe, it, expect } from "vitest";
import { generateAllDestinationScores, generateEvaluationReportHTML } from "./evaluationService";
import { Application } from "../drizzle/schema";

describe("Moteur de Scoring Ajusté (IFP 3M)", () => {
  it("calcule les scores de manière dynamique en l'absence de scoringDetails explicite", () => {
    const mockApp: Partial<Application> = {
      id: 1,
      fullName: "Test Candidat",
      educationLevel: "Master / Bac+5",
      yearsOfExperience: "5 ans et plus",
      frenchLevel: "Courant / Avancé",
      dossierNumber: "3M-TEST-001",
    };

    const scores = generateAllDestinationScores(mockApp as Application);
    expect(scores.length).toBeGreaterThan(0);
    // Un profil Master + 5 ans d'exp + Français courant doit obtenir un score élevé
    const topScore = scores[0];
    expect(topScore.score).toBeGreaterThan(50);
  });

  it("génère un rapport HTML contenant l'intitulé Indice de Faisabilité Préliminaire (IFP 3M)", () => {
    const mockApp: Partial<Application> = {
      id: 1,
      fullName: "Test Candidat",
      educationLevel: "Licence / Bac+3",
      yearsOfExperience: "3 ans",
      frenchLevel: "Intermédiaire",
      dossierNumber: "3M-TEST-002",
    };

    const html = generateEvaluationReportHTML(mockApp as Application);
    expect(html).toContain("Indice de Faisabilité Préliminaire (IFP 3M)");
    expect(html).toContain("Évaluation indicative d’agence");
  });
});
