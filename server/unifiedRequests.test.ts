import { describe, expect, it } from "vitest";
import { canDeliverEvaluation, getUnifiedSlaState, inferUnifiedWorkflow, selectEvaluationReviewsForAdvisorToday } from "./routers/unifiedRequests";

describe("boîte de réception unifiée", () => {
  it("normalise les statuts métier de sources différentes vers le cycle commun", () => {
    expect(inferUnifiedWorkflow("application", "en_attente_documents")).toBe("documents_review");
    expect(inferUnifiedWorkflow("flight", "awaiting_payment")).toBe("payment_review");
    expect(inferUnifiedWorkflow("application", "bilan_envoye")).toBe("processing");
    expect(inferUnifiedWorkflow("translation", "completed")).toBe("completed");
    expect(inferUnifiedWorkflow("contact", "new")).toBe("qualifying");
    expect(inferUnifiedWorkflow("consultation", "rejected")).toBe("rejected");
  });

  it("signale les délais SLA échus et ne signale plus les demandes clôturées", () => {
    const now = Date.now();
    expect(getUnifiedSlaState({ workflowStatus: "processing", createdAt: new Date(now - 25 * 3_600_000), lastActivityAt: new Date(now - 25 * 3_600_000), firstRespondedAt: null, dueAt: new Date(now - 60_000) })).toBe("overdue");
    expect(getUnifiedSlaState({ workflowStatus: "completed", createdAt: new Date(now - 48 * 3_600_000), lastActivityAt: new Date(now - 24 * 3_600_000), firstRespondedAt: new Date(now - 47 * 3_600_000), dueAt: new Date(now - 24 * 3_600_000) })).toBe("closed");
  });

  it("bloque tout bilan non relu puis respecte la seconde approbation des bilans sensibles", () => {
    expect(canDeliverEvaluation(true, "pending", false)).toBe(false);
    expect(canDeliverEvaluation(true, "approved", false)).toBe(false);
    expect(canDeliverEvaluation(true, "pending", true)).toBe(false);
    expect(canDeliverEvaluation(true, "approved", true)).toBe(true);
    expect(canDeliverEvaluation(false, "not_required", false)).toBe(false);
    expect(canDeliverEvaluation(false, "not_required", true)).toBe(true);
  });

  it("place uniquement les brouillons non validés du conseiller dans la file du jour", () => {
    const now = new Date("2026-08-17T10:00:00.000Z");
    const draft = JSON.stringify({ adminDraft: { verdict: "Profil à relire", advisorValidated: false } });
    const rows = selectEvaluationReviewsForAdvisorToday([
      { id: 1, adminAssignedTo: "conseiller@3m.test", evaluationScheduledAt: null, updatedAt: now, scoringDetails: draft, evaluationDeliveryStatus: "draft", dossierStatus: "en_evaluation" },
      { id: 2, adminAssignedTo: "conseiller@3m.test", evaluationScheduledAt: null, updatedAt: now, scoringDetails: JSON.stringify({ adminDraft: { verdict: "Déjà validé", advisorValidated: true } }), evaluationDeliveryStatus: "draft", dossierStatus: "en_evaluation" },
      { id: 3, adminAssignedTo: "autre@3m.test", evaluationScheduledAt: null, updatedAt: now, scoringDetails: draft, evaluationDeliveryStatus: "draft", dossierStatus: "en_evaluation" },
      { id: 4, adminAssignedTo: "conseiller@3m.test", evaluationScheduledAt: null, updatedAt: now, scoringDetails: draft, evaluationDeliveryStatus: "sent", dossierStatus: "bilan_envoye" },
    ], { email: "conseiller@3m.test", fullName: "Conseiller" }, now);
    expect(rows.map((row) => row.id)).toEqual([1]);
  });
});
