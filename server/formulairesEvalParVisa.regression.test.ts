import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getEvaluationDocumentRequirements } from "../client/src/data/evaluationDocumentCatalogue";
import { multiProjectEvaluationGap } from "../shared/evaluationFormRequirements";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("formulaires d’évaluation distincts par type de visa", () => {
  it("branche le formulaire public sur studyCycle, visitorStatus et contrôles par phase", () => {
    const form = read("client/src/components/SimpleMultiProjectForm.tsx");
    expect(form).toContain("multiProjectEvaluationGap");
    expect(form).toContain("STUDY_CYCLE_OPTIONS");
    expect(form).toContain("VISITOR_STATUS_OPTIONS");
    expect(form).toContain('data-testid="eval-hint-travail"');
    expect(form).toContain('data-testid="eval-hint-etudes"');
    expect(form).toContain('data-testid="eval-hint-tourisme"');
    expect(form).toContain('data-testid="eval-etudes-cycle"');
    expect(form).toContain('data-testid="eval-visiteurs-statut"');
    expect(form).toContain("educational_transcript");
    expect(form).toContain("hasDiplomaDocument");
    expect(form).toContain("hasTranscriptDocument");
    expect(form).toContain('"criteria"');
    expect(form).toContain('"documents"');
  });

  it("persiste studyCycle et visitorStatus côté serveur", () => {
    const router = read("server/routers/evaluation.ts");
    expect(router).toContain("studyCycle:");
    expect(router).toContain("visitorStatus:");
    expect(router).toContain("hasCvDocument:");
    expect(router).toContain("hasDiplomaDocument:");
    expect(router).toContain("multiProjectEvaluationGap");
  });

  it("sépare les bilans documentaires études / travail / visiteurs", () => {
    const etudes = getEvaluationDocumentRequirements("Canada", "etudes").map((item) => item.label);
    expect(etudes).toContain("Diplômes obtenus");
    expect(etudes).toContain("Relevés de notes");
    expect(etudes).toContain("Cycle et filière envisagés");

    const travail = getEvaluationDocumentRequirements("Canada", "travail").map((item) => item.label);
    expect(travail).toContain("CV à jour");

    const tourisme = getEvaluationDocumentRequirements("France", "tourisme").map((item) => item.label);
    expect(tourisme.some((label) => /chef d’entreprise|employé|particulier/i.test(label))).toBe(true);
  });

  it("refuse une soumission études sans diplôme fichier", () => {
    expect(
      multiProjectEvaluationGap({
        projectType: "etudes",
        educationLevel: "licence",
        studyCycle: "master",
        sector: "santé",
        transcriptAvailable: true,
      }),
    ).toMatch(/diplôme/i);
  });

  it("différencie le bilan HTML selon le type de visa", () => {
    const service = read("server/evaluationService.ts");
    expect(service).toContain("Cadre études");
    expect(service).toContain("Cadre visiteurs");
    expect(service).toContain("Cadre travail");
    expect(service).toContain("STUDY_CYCLE_LABELS");
    expect(service).toContain("VISITOR_STATUS_LABELS");
    expect(service).toContain("cycle visé");
    expect(service).toContain("statut déclaré");
  });
});
