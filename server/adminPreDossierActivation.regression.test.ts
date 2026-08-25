import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("activation et rattachement pré-dossier", () => {
  it("conserve la validation humaine de l’évaluation avant l’activation", () => {
    const panel = read("client/src/components/AdminPreDossierAccountsPanel.tsx");
    expect(panel).toContain("Valider l’évaluation avant activation");
    expect(panel).toContain("reviewEvaluationDeclaration");
    expect(panel).toContain("evaluationValidated");
  });

  it("rattache un dossier agence existant au lieu de bloquer le candidat", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(router).toContain("linkedExistingDossier");
    expect(router).toContain("if (linkedExistingDossier)");
    expect(router).toContain("await db.update(agencyDossiers)");
    expect(router).not.toContain('throw new TRPCError({ code: "CONFLICT", message: "Un dossier agence existe déjà pour ce candidat." });');
  });
});
