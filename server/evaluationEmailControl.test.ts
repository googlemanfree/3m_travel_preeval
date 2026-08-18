import { describe, expect, it } from "vitest";
import { appendEvaluationOpenTrackingPixel, buildAdvisorSignatureHtml, createEvaluationEmailTrackingToken, verifyEvaluationEmailTrackingToken } from "./services/evaluationEmailCommunication";
import { canAutoDeliverEvaluation } from "./scheduled/evaluationBilanJob";

describe("communication contrôlée des bilans", () => {
  it("signe un pixel de suivi et refuse toute modification du jeton", () => {
    const token = createEvaluationEmailTrackingToken(42);
    expect(verifyEvaluationEmailTrackingToken(token)).toBe(42);
    expect(verifyEvaluationEmailTrackingToken(`${token}x`)).toBeNull();
    expect(appendEvaluationOpenTrackingPixel("<p>Bilan</p>", 42)).toContain("/api/evaluation-email/open/");
  });

  it("insère une signature sûre du conseiller", () => {
    const signature = buildAdvisorSignatureHtml("Conseiller <3M>");
    expect(signature).toContain("Conseiller &lt;3M&gt;");
    expect(signature).toContain("3M Travel");
  });

  it("ne livre jamais un bilan sans validation humaine et planification explicite", () => {
    const base = { dossierStatus: "en_evaluation", evaluationDeliveryStatus: "scheduled", evaluationScheduledAt: new Date(Date.now() - 1000), createdAt: new Date(), evaluationRequiresSecondApproval: false, evaluationApprovalStatus: "not_required", scoringDetails: JSON.stringify({ adminDraft: { advisorValidated: true } }) };
    expect(canAutoDeliverEvaluation(base)).toBe(true);
    expect(canAutoDeliverEvaluation({ ...base, scoringDetails: JSON.stringify({ adminDraft: { advisorValidated: false } }) })).toBe(false);
    expect(canAutoDeliverEvaluation({ ...base, evaluationDeliveryStatus: "draft" })).toBe(false);
  });
});
