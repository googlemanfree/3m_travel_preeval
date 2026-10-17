import { describe, expect, it } from "vitest";
import {
  buildCanadaDocumentChecklist,
  buildCanadaPreliminaryGaps,
  DANIELE_STRUCTURE_FIXTURE,
  emptyCanadaPreliminaryProfile,
  estimateForeignExperienceYearsFromJobs,
  EMPTY_CANADA_JOB,
  type CanadaPreliminaryProfile,
} from "../shared/canadaPreliminaryEvaluation";

function withDanieleDefaults(overrides: Partial<CanadaPreliminaryProfile> = {}): CanadaPreliminaryProfile {
  return {
    ...emptyCanadaPreliminaryProfile(),
    ...DANIELE_STRUCTURE_FIXTURE,
    jobs: [
      {
        ...EMPTY_CANADA_JOB(),
        title: "Aide-soignante",
        employer: "Clinique Saint-Joseph",
        country: "Cameroun",
        startDate: "2018-01",
        endDate: "présent",
        hoursPerWeek: "40",
        paid: "yes",
        employmentType: "employee",
        tasks: "Soins aux patients, hygiène, assistance infirmière",
      },
      EMPTY_CANADA_JOB(),
      EMPTY_CANADA_JOB(),
    ],
    ...overrides,
  };
}

describe("canadaPreliminaryEvaluation — formulaire PDF 3M + dossier type Danièle", () => {
  it("signale les lacunes prioritaires du dossier Danièle (enfants, EDE détail, tests, fonds, déclaration)", () => {
    const gaps = buildCanadaPreliminaryGaps(withDanieleDefaults());
    const ids = gaps.map((gap) => gap.id);
    expect(ids).toContain("children_accompany");
    expect(ids).toContain("ede_detail");
    expect(ids).toContain("lang_tests");
    expect(ids).toContain("funds");
    expect(ids).toContain("refusals");
    expect(ids).toContain("declaration");
    expect(ids).not.toContain("name");
    expect(ids).not.toContain("diploma");
    expect(ids).not.toContain("job1");
    expect(ids).not.toContain("objective");
    expect(gaps.some((gap) => gap.priority === "high" && gap.id === "children_accompany")).toBe(true);
  });

  it("retire les lacunes une fois le dossier complété comme un CAN-001 validé", () => {
    const complete = withDanieleDefaults({
      dependentsWillAccompany: "Oui, les deux enfants",
      educationAssessmentBody: "WES",
      educationAssessmentResult: "Équivalent diplôme canadien d’un an",
      ecaForExpressEntryConfirmed: true,
      frenchTest: {
        testName: "TEF Canada",
        testDate: "2025-06-01",
        reportNumber: "TEF-123",
        listening: "249",
        reading: "233",
        speaking: "310",
        writing: "349",
      },
      targetProvince: "Québec",
      availableFunds: "12000",
      fundsCurrency: "CAD",
      fundsOrigin: "Épargne familiale",
      visaRefusals: "Aucun",
      clientDeclarationConfirmed: true,
    });
    const gaps = buildCanadaPreliminaryGaps(complete);
    expect(gaps.map((gap) => gap.id)).toEqual([]);
  });

  it("ajoute les actes de naissance des enfants à la checklist documentaire", () => {
    const checklist = buildCanadaDocumentChecklist(withDanieleDefaults());
    expect(checklist.some((item) => /naissance des enfants/i.test(item))).toBe(true);
    expect(checklist.some((item) => /EDE|WES|évaluation comparative/i.test(item))).toBe(true);
    expect(checklist.some((item) => /fonds financiers/i.test(item))).toBe(true);
  });

  it("estime les années d’expérience étrangère à partir des emplois déclarés", () => {
    const years = estimateForeignExperienceYearsFromJobs([
      {
        ...EMPTY_CANADA_JOB(),
        title: "Aide-soignante",
        employer: "Clinique",
        country: "Cameroun",
        startDate: "2018-01",
        endDate: "présent",
      },
      {
        ...EMPTY_CANADA_JOB(),
        title: "Stage",
        employer: "Hôpital",
        country: "Canada",
        startDate: "2020-01",
        endDate: "2021-01",
      },
    ]);
    expect(years).toBeGreaterThanOrEqual(5);
  });

  it("expose la fixture structurelle CAN-001 pour non-régression UI / PDF", () => {
    expect(DANIELE_STRUCTURE_FIXTURE.referenceOrInitials).toBe("CAN-001");
    expect(DANIELE_STRUCTURE_FIXTURE.childrenCount).toBe(2);
    expect(DANIELE_STRUCTURE_FIXTURE.objective).toBe("permanent_residence");
    expect(DANIELE_STRUCTURE_FIXTURE.educationAssessmentDone).toBe(true);
    expect(DANIELE_STRUCTURE_FIXTURE.ecaForExpressEntryConfirmed).toBe(false);
  });
});
