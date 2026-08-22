import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { isEvaluationDeclarationComplete, resolveEvaluationDeclaration } from "@shared/evaluationDeclaration";

const root = path.resolve(import.meta.dirname, "..");
const source = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("déclaration d’évaluation préalable", () => {
  it("marque uniquement une évaluation déclarée comme reçue", () => {
    const timestamp = new Date("2026-08-22T10:00:00.000Z");
    expect(resolveEvaluationDeclaration(true, timestamp)).toEqual({
      evaluationDeclarationStatus: "declared_complete",
      evaluationDeclaredAt: timestamp,
    });
    expect(resolveEvaluationDeclaration(false, timestamp)).toEqual({
      evaluationDeclarationStatus: "not_declared",
      evaluationDeclaredAt: null,
    });
    expect(isEvaluationDeclarationComplete("declared_complete")).toBe(true);
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
    expect(adminRouter).toContain('source: "ACCOUNT_ONLY" as const');
    expect(clientTimeline).toContain("isEvaluationDeclarationComplete(evaluationDeclarationStatus)");
  });
});
