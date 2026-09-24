import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ existing: [] as Array<{ id: number }>, dbAvailable: true, reads: 0 }));

vi.mock("./db", () => ({
  getDb: async () =>
    state.dbAvailable
      ? {
          select: () => ({
            from: () => ({
              where: () => ({
                limit: async () => {
                  state.reads += 1;
                  return state.existing;
                },
              }),
            }),
          }),
        }
      : null,
}));

import { EVALUATION_FIRST_MESSAGE, assertEvaluationCompleted, evaluationFirstGateActive } from "./services/evaluationFirstGate";

beforeEach(() => {
  state.existing = [];
  state.dbAvailable = true;
  state.reads = 0;
});

describe("règle « évaluation d'abord » (même condition que l'espace candidat)", () => {
  it("ne bloque que sans évaluation et avec une déclaration absente ou refusée", () => {
    expect(evaluationFirstGateActive({ declarationStatus: "not_declared", hasEvaluation: false })).toBe(true);
    expect(evaluationFirstGateActive({ declarationStatus: "refused", hasEvaluation: false })).toBe(true);
    expect(evaluationFirstGateActive({ declarationStatus: "validated", hasEvaluation: false })).toBe(false);
    expect(evaluationFirstGateActive({ declarationStatus: "pending_validation", hasEvaluation: false })).toBe(false);
    expect(evaluationFirstGateActive({ declarationStatus: "not_declared", hasEvaluation: true })).toBe(false);
    expect(evaluationFirstGateActive({ declarationStatus: "refused", hasEvaluation: true })).toBe(false);
  });
});

describe("assertEvaluationCompleted", () => {
  it("refuse un candidat sans évaluation ni déclaration, avec un message qui dit quoi faire", async () => {
    await expect(assertEvaluationCompleted({ email: "a@example.com", evaluationDeclarationStatus: "not_declared" })).rejects.toMatchObject({ code: "FORBIDDEN", message: EVALUATION_FIRST_MESSAGE });
    expect(EVALUATION_FIRST_MESSAGE).toMatch(/évaluation/i);
  });

  it("laisse passer dès qu'une évaluation existe pour son e-mail", async () => {
    state.existing = [{ id: 12 }];
    await expect(assertEvaluationCompleted({ email: "a@example.com", evaluationDeclarationStatus: "not_declared" })).resolves.toBeUndefined();
    await expect(assertEvaluationCompleted({ email: "a@example.com", evaluationDeclarationStatus: "refused" })).resolves.toBeUndefined();
  });

  it("laisse passer une déclaration validée ou en attente de validation, sans lire la base", async () => {
    await expect(assertEvaluationCompleted({ email: "a@example.com", evaluationDeclarationStatus: "validated" })).resolves.toBeUndefined();
    await expect(assertEvaluationCompleted({ email: "a@example.com", evaluationDeclarationStatus: "pending_validation" })).resolves.toBeUndefined();
    expect(state.reads).toBe(0);
  });

  it("échoue proprement (et ne laisse pas passer) si la base est indisponible", async () => {
    state.dbAvailable = false;
    await expect(assertEvaluationCompleted({ email: "a@example.com", evaluationDeclarationStatus: "not_declared" })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

describe("actions d'écriture du candidat protégées côté serveur", () => {
  const read = (path: string) => readFileSync(resolve(import.meta.dirname, path), "utf8");
  const bodyOf = (source: string, header: string, length = 900) => {
    const start = source.indexOf(header);
    expect(start, header).toBeGreaterThan(-1);
    return source.slice(start, start + length);
  };

  it("chaque procédure appelle le contrôle avant tout accès à la base", () => {
    const candidate = read("routers/candidate.ts");
    const submission = read("routers/documentSubmission.ts");
    const cases: Array<[string, string, string]> = [
      ["saveDocument", candidate, "  saveDocument: candidateProcedure"],
      ["requestDocumentClarification", candidate, "  requestDocumentClarification: candidateProcedure"],
      ["submitDocuments (espace candidat)", candidate, "  submitDocuments: candidateProcedure"],
      ["requestDossierActivation", candidate, "  requestDossierActivation: candidateProcedure"],
      ["submitDocuments (soumission)", submission, "  submitDocuments: candidateProcedure"],
    ];
    for (const [name, source, header] of cases) {
      const body = bodyOf(source, header, 1500);
      const gate = body.indexOf("await assertEvaluationCompleted(ctx.candidate)");
      expect(gate, name).toBeGreaterThan(-1);
      expect(gate, name).toBeLessThan(body.indexOf("await getDb()"));
    }
  });
});
