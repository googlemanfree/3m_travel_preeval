import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("workflow de revue humaine des évaluations", () => {
  it("persiste la référence et l’échéance avant l’accusé de réception", () => {
    const source = read("server/routers/evaluation.ts");
    expect(source).toContain("referenceCode: dossierCode");
    expect(source).toContain("reviewDeadline");
    expect(source).toContain("sendEvaluationReceptionEmail");
    expect(source).toContain("receiptSentAt");
  });

  it("réserve la diffusion finale à une validation administrateur auditée", () => {
    const source = read("server/routers/aiEvaluationManagement.ts");
    expect(source).toContain("requireValidAdminSession");
    expect(source).toContain("saveEvaluationReviewDraft");
    expect(source).toContain("validateAndSendEvaluationResponse");
    expect(source).toContain('action: "validated"');
    expect(source).toContain('action: "response_sent"');
    expect(source).toContain("sendValidatedEvaluationResponseEmail");
  });

  it("n’affiche au candidat qu’une réponse déjà validée", () => {
    const source = read("client/src/pages/EvaluationSpace.tsx");
    const candidateRouter = read("server/routers/candidate.ts");
    expect(source).toContain("latestEvaluation?.finalResponseSentAt && latestEvaluation?.reviewDraft");
    expect(source).toContain("Réponse validée par l’agence.");
    expect(candidateRouter).toContain("reviewDraft: evaluation.finalResponseSentAt ? evaluation.reviewDraft : null");
  });
});
