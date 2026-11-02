import { describe, expect, it } from "vitest";
import {
  multiProjectEvaluationGap,
  normalizePublicEvaluationProject,
} from "./evaluationFormRequirements";

describe("normalizePublicEvaluationProject", () => {
  it("mappe les alias publics et codes canada_/schengen_ vers travail / études / tourisme", () => {
    expect(normalizePublicEvaluationProject("travail")).toBe("travail");
    expect(normalizePublicEvaluationProject("work")).toBe("travail");
    expect(normalizePublicEvaluationProject("etudes")).toBe("etudes");
    expect(normalizePublicEvaluationProject("études")).toBe("etudes");
    expect(normalizePublicEvaluationProject("study")).toBe("etudes");
    expect(normalizePublicEvaluationProject("canada_etude")).toBe("etudes");
    expect(normalizePublicEvaluationProject("schengen_travail")).toBe("travail");
    expect(normalizePublicEvaluationProject("tourisme")).toBe("tourisme");
    expect(normalizePublicEvaluationProject("visiteur")).toBe("tourisme");
    expect(normalizePublicEvaluationProject("visitor")).toBe("tourisme");
    expect(normalizePublicEvaluationProject("court_sejour")).toBe("tourisme");
    expect(normalizePublicEvaluationProject("inconnu")).toBeNull();
  });
});

describe("multiProjectEvaluationGap — formulaires distincts par visa", () => {
  it("exige CV + profil pour visa travail", () => {
    expect(
      multiProjectEvaluationGap({
        projectType: "travail",
        sector: "Informatique",
        yearsOfExperience: 3,
        languages: "FR/EN",
      }),
    ).toMatch(/CV/i);

    expect(
      multiProjectEvaluationGap({
        projectType: "travail",
        sector: "Informatique",
        yearsOfExperience: 0,
        languages: "FR",
        hasCvDocument: true,
      }),
    ).toBeNull();

    expect(
      multiProjectEvaluationGap(
        { projectType: "travail", sector: "", yearsOfExperience: 2, languages: "FR" },
        "criteria",
      ),
    ).toMatch(/secteur/i);
  });

  it("exige historique scolaire, cycle, diplôme et relevés pour visa études", () => {
    expect(
      multiProjectEvaluationGap(
        { projectType: "etudes", educationLevel: "licence", studyCycle: "", sector: "informatique" },
        "criteria",
      ),
    ).toMatch(/cycle/i);

    expect(
      multiProjectEvaluationGap({
        projectType: "etudes",
        educationLevel: "licence",
        studyCycle: "master",
        sector: "informatique",
        diplomaLevel: "licence",
      }),
    ).toMatch(/diplôme/i);

    expect(
      multiProjectEvaluationGap({
        projectType: "etudes",
        educationLevel: "licence",
        studyCycle: "master",
        sector: "informatique",
        hasDiplomaDocument: true,
        transcriptAvailable: true,
      }),
    ).toBeNull();
  });

  it("exige un statut simple pour visa visiteurs, sans pièce obligatoire", () => {
    expect(
      multiProjectEvaluationGap(
        { projectType: "tourisme", visitReason: "Famille" },
        "criteria",
      ),
    ).toMatch(/statut/i);

    expect(
      multiProjectEvaluationGap({
        projectType: "tourisme",
        visitorStatus: "employe",
        visitReason: "Tourisme culturel",
      }),
    ).toBeNull();

    expect(
      multiProjectEvaluationGap(
        { projectType: "tourisme", visitorStatus: "particulier", visitReason: "Visite" },
        "documents",
      ),
    ).toBeNull();
  });
});
