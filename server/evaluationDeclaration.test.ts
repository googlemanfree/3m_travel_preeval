import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { isEvaluationDeclarationComplete, requiresEvaluationValidation, resolveEvaluationDeclaration } from "@shared/evaluationDeclaration";

const root = path.resolve(import.meta.dirname, "..");
const source = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("déclaration d’évaluation préalable", () => {
  it("place une évaluation externe déclarée en attente de validation humaine", () => {
    const timestamp = new Date("2026-08-22T10:00:00.000Z");
    expect(resolveEvaluationDeclaration(true, timestamp)).toEqual({
      evaluationDeclarationStatus: "pending_validation",
      evaluationDeclaredAt: timestamp,
    });
    expect(resolveEvaluationDeclaration(false, timestamp)).toEqual({
      evaluationDeclarationStatus: "not_declared",
      evaluationDeclaredAt: null,
    });
    expect(isEvaluationDeclarationComplete("pending_validation")).toBe(false);
    expect(isEvaluationDeclarationComplete("validated")).toBe(true);
    expect(requiresEvaluationValidation("pending_validation")).toBe(true);
    expect(requiresEvaluationValidation("refused")).toBe(true);
    expect(isEvaluationDeclarationComplete("not_declared")).toBe(false);
  });

  it("relie la déclaration à l’inscription, au tableau client et à la liste administrative", () => {
    const register = source("client/src/pages/Register.tsx");
    const candidateRouter = source("server/routers/candidate.ts");
    const adminRouter = source("server/routers/admin.ts");
    const clientTimeline = source("client/src/components/DossierProgressTimeline.tsx");

    expect(register).toContain('evaluationAlreadyCompleted: "no"');
    expect(register).toContain('evaluationAlreadyCompleted: form.evaluationAlreadyCompleted === "yes"');
    expect(candidateRouter).toContain("evaluationAlreadyCompleted: z.boolean().default(false)");
    expect(candidateRouter).toContain("resolveEvaluationDeclaration(input.evaluationAlreadyCompleted)");
    expect(adminRouter).toContain("evaluationDeclarationStatus: candidates.evaluationDeclarationStatus");
    expect(adminRouter).toContain("evaluationReviewedAt: account.evaluationReviewedAt");
    expect(adminRouter).toContain('source: "ACCOUNT_ONLY" as const');
    expect(clientTimeline).toContain("isEvaluationDeclarationComplete(evaluationDeclarationStatus)");
  });

  it("impose une décision humaine avant l’activation d’un dossier pré-inscription", () => {
    const adminManagement = source("server/routers/adminCandidateManagement.ts");
    const adminDashboard = source("client/src/pages/AdminDashboard.tsx");
    const evaluationPanel = source("client/src/components/AdminPreDossierEvaluationPanel.tsx");
    const register = source("client/src/pages/Register.tsx");

    expect(adminManagement).toContain("reviewEvaluationDeclaration");
    expect(adminManagement).toContain('decision: z.enum(["validate", "refuse", "request_correction"])');
    expect(adminManagement).toContain("L’évaluation déclarée doit être validée manuellement avant l’ouverture du dossier.");
    expect(adminManagement).toContain("evaluationReviewedBy: admin.email");
    expect(adminDashboard).toContain("evaluationBlocksActivation");
    expect(evaluationPanel).toContain("Valider l’évaluation");
    expect(register).toContain("vérifiée manuellement par notre équipe");
  });
});
