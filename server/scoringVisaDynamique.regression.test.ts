import { describe, expect, it } from "vitest";
import { generateAllDestinationScores, generateEvaluationReportHTML, generateEvaluationReportText } from "./evaluationService";
import type { Application } from "../drizzle/schema";

describe("scoring IFP dynamique par type de visa", () => {
  it("produit des descriptions études sans vocabulaire marché du travail / H1B", () => {
    const app = {
      id: 10,
      fullName: "Awa Études",
      dossierNumber: "3M-TEST-ETU",
      visaType: "canada_etude",
      destination: "canada",
      academicLevel: "Licence",
      projectDetailsJson: JSON.stringify({
        studyCycle: "master",
        sector: "Informatique",
        fundingDeclared: true,
      }),
    } as unknown as Application;

    const scores = generateAllDestinationScores(app);
    expect(scores.length).toBeGreaterThan(0);
    expect(scores.every((row) => !/H1B|marché du travail|employeur/i.test(row.description))).toBe(true);
    expect(scores.some((row) => /études|académique|financement|cycle/i.test(row.description))).toBe(true);

    const html = generateEvaluationReportHTML(app);
    expect(html).toMatch(/Visa études/i);
    expect(html).toMatch(/Cadre études/i);
    expect(html).not.toMatch(/CV actualisé/);
  });

  it("produit un texte visiteurs avec critères statut / motif", () => {
    const app = {
      id: 11,
      fullName: "Paul Visite",
      dossierNumber: "3M-TEST-VIS",
      visaType: "schengen_tourisme",
      destination: "europe",
      projectDetailsJson: JSON.stringify({
        visitorStatus: "employe",
        visitReason: "Tourisme culturel deux semaines",
        fundingDeclared: true,
      }),
    } as unknown as Application;

    const text = generateEvaluationReportText(app);
    expect(text).toMatch(/visiteurs|visite/i);
    expect(text).toMatch(/Statut déclaré|Motif/i);
    expect(text).not.toMatch(/Expérience professionnelle \(\/25\)/);
  });

  it("conserve le biais marché du travail pour un projet travail Luxembourg", () => {
    const app = {
      id: 12,
      fullName: "Jean Travail",
      dossierNumber: "3M-TEST-TRA",
      visaType: "schengen_travail",
      destination: "luxembourg",
      educationLevel: "Master / Bac+5",
      yearsOfExperience: "5 ans et plus",
      frenchLevel: "Courant / Avancé",
    } as unknown as Application;

    const scores = generateAllDestinationScores(app);
    const lux = scores.find((row) => row.destination === "luxembourg");
    expect(lux).toBeTruthy();
    expect(lux!.score).toBeLessThan(scores[0]!.score);
  });
});
