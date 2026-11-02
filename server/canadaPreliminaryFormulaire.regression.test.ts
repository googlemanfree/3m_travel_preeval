import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

describe("Formulaire évaluation Canada — enrichissement simulateur", () => {
  it("expose le module partagé d’évaluation préliminaire aligné sur les PDF 3M", () => {
    const shared = readFileSync(join(root, "shared/canadaPreliminaryEvaluation.ts"), "utf8");
    expect(shared).toContain("buildCanadaPreliminaryGaps");
    expect(shared).toContain("buildCanadaDocumentChecklist");
    expect(shared).toContain("DANIELE_STRUCTURE_FIXTURE");
    expect(shared).toContain("CAN-001");
    expect(shared).toContain("Évaluation des diplômes");
    expect(shared).toContain("clientDeclarationConfirmed");
  });

  it("branche le dossier préliminaire, lacunes et checklist dans CanadaScoreSimulator", () => {
    const simulator = readFileSync(join(root, "client/src/components/CanadaScoreSimulator.tsx"), "utf8");
    expect(simulator).toContain('data-testid="canada-preliminary-dossier"');
    expect(simulator).toContain('data-testid="canada-preliminary-gaps"');
    expect(simulator).toContain('data-testid="canada-document-checklist"');
    expect(simulator).toContain('data-testid="canada-job-history"');
    expect(simulator).toContain("3m-crs-simulator-draft-v4");
    expect(simulator).toContain("Évaluation préliminaire Canada — dossier 3M");
    expect(simulator).toContain("buildCanadaPreliminaryGaps");
    expect(simulator).toContain("childrenCount");
    expect(simulator).toContain("availableFunds");
    expect(simulator).toContain("clientDeclarationConfirmed");
    expect(simulator).toContain("estimateForeignExperienceYearsFromJobs");
  });
});
