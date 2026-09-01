import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("workflow dynamique Gemini des évaluations", () => {
  it("exige le consentement, persiste son horodatage et ne bloque pas la réception", () => {
    const source = read("server/routers/evaluation.ts");
    expect(source).toContain("geminiAnalysisConsent: z.boolean().default(false)");
    expect(source).toContain("preparatoryAnalysisConsentRecordedAt");
    expect(source).toContain("void (async () =>");
    expect(source).toContain("Brouillon préparatoire indisponible ; revue manuelle requise.");
  });

  it("retire le scoring OpenAI historique et ne transmet pas le CV au brouillon", () => {
    const source = read("server/routers/evaluation.ts");
    expect(source).not.toContain("generateAIEvaluationReport");
    expect(source).not.toContain("computeDestinationScore");
    expect(source).not.toContain("cvBase64: input.cvBase64");
  });

  it("réserve le brouillon préparatoire à l’administration et la réponse validée au candidat", () => {
    const candidateRouter = read("server/routers/candidate.ts");
    const evaluationRouter = read("server/routers/evaluation.ts");
    const adminRouter = read("server/routers/aiEvaluationManagement.ts");
    expect(candidateRouter).toContain("reviewDraft: evaluation.finalResponseSentAt ? evaluation.reviewDraft : null");
    expect(candidateRouter).not.toContain("evaluations: evalRows");
    expect(evaluationRouter).toContain("finalReviewedAt: evaluation.secondReviewRequired ? evaluation.secondReviewedAt : evaluation.reviewedAt");
    expect(evaluationRouter).toContain("reviewDraft: evaluation.finalResponseSentAt && (!evaluation.secondReviewRequired || evaluation.secondReviewedAt) ? evaluation.reviewDraft : null");
    expect(adminRouter).toContain("parsePreparationDraft");
    expect(adminRouter).toContain("requireValidAdminSession");
    expect(adminRouter).toContain("sendValidatedEvaluationResponseEmail");
  });
});
