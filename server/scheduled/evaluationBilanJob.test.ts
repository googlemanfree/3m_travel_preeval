import { describe, expect, it } from "vitest";
import { shouldSendEvaluationReminder } from "./evaluationBilanJob";

describe("rappel de consultation du bilan", () => {
  const now = new Date("2026-08-16T12:00:00.000Z");
  const base = { evaluationDeliveryStatus: "sent", evaluationCompletedAt: new Date("2026-08-13T11:59:00.000Z"), evaluationReportViewedAt: null, evaluationReportReminderSentAt: null };

  it("relance une seule fois un bilan envoyé mais non consulté après 72 heures", () => {
    expect(shouldSendEvaluationReminder(base, now)).toBe(true);
    expect(shouldSendEvaluationReminder({ ...base, evaluationReportViewedAt: new Date("2026-08-14T12:00:00.000Z") }, now)).toBe(false);
    expect(shouldSendEvaluationReminder({ ...base, evaluationReportReminderSentAt: new Date("2026-08-16T11:00:00.000Z") }, now)).toBe(false);
  });
});
