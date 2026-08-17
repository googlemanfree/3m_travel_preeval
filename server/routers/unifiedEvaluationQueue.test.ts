import { describe, expect, it } from "vitest";
import { selectEvaluationReviewsForAdvisorToday } from "./unifiedRequests";

describe("file de validation des bilans IA", () => {
  const advisor = { email: "conseiller@3mtravelagency.com", fullName: "Conseiller 3M" };
  const now = new Date("2026-08-17T12:00:00.000Z");
  const base = {
    id: 9,
    dossierNumber: "EVAL-DRAFT-2026-123456",
    fullName: "Candidate Démonstration",
    destination: "canada",
    scoringTotal: 72,
    adminAssignedTo: null,
    evaluationScheduledAt: null,
    createdAt: new Date("2026-08-17T03:00:00.000Z"),
    updatedAt: new Date("2026-08-17T03:30:00.000Z"),
    evaluationDeliveryStatus: "draft",
    dossierStatus: "en_evaluation",
    scoringDetails: JSON.stringify({ adminDraft: { verdict: "Brouillon à relire", advisorValidated: false } }),
  };

  it("fait remonter un brouillon non validé après huit heures sans le diffuser", () => {
    const rows = selectEvaluationReviewsForAdvisorToday([base], advisor, now);
    expect(rows).toHaveLength(1);
    expect(rows[0].reviewOverdue).toBe(true);
    expect(rows[0].reviewDeadline.toISOString()).toBe("2026-08-17T11:00:00.000Z");
    expect(rows[0].advisorValidated).toBe(false);
  });

  it("retire de la file un brouillon déjà validé par un conseiller", () => {
    const rows = selectEvaluationReviewsForAdvisorToday([
      { ...base, scoringDetails: JSON.stringify({ adminDraft: { verdict: "Bilan validé", advisorValidated: true } }) },
    ], advisor, now);
    expect(rows).toEqual([]);
  });
});
