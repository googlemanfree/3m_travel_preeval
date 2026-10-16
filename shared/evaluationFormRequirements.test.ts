import { describe, expect, it } from "vitest";
import { multiProjectEvaluationGap } from "./evaluationFormRequirements";

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
