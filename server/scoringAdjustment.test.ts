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

  it("génère un rapport HTML contenant l'intitulé Indice de Faisabilité Préliminaire (IFP 3M) et les recommandations personnalisées", () => {
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
    expect(html).toContain("Recommandations personnalisées pour optimiser votre score");
  });

  it("intègre le brouillon administratif et le message personnalisé dans la prévisualisation", () => {
    const mockApp: Partial<Application> = {
      id: 3,
      fullName: "Candidat Prévisualisation",
      dossierNumber: "3M-TEST-003",
      scoringDetails: JSON.stringify({
        education: 18,
        experience: 16,
        language: 12,
        sector: 14,
        age: 8,
        adminDraft: {
          finalScore: 72,
          verdict: "Profil prometteur après vérification humaine",
          strengths: ["Expérience structurée"],
          weaknesses: ["Test linguistique à confirmer"],
          recommendations: ["Passer le TCF Canada"],
        },
      }),
    };

    const html = generateEvaluationReportHTML(mockApp as Application, {
      introMessage: "Bonjour, voici votre bilan personnalisé.",
    });

    expect(html).toContain("Profil prometteur après vérification humaine");
    expect(html).toContain("Passer le TCF Canada");
    expect(html).toContain("Bonjour, voici votre bilan personnalisé.");
  });
});
