import { describe, expect, it } from "vitest";
import { buildEvaluationDeliveryEmailHtml, buildEvaluationReminderEmailHtml, canAutoDeliverEvaluation, shouldSendEvaluationReminder } from "./evaluationBilanJob";
import { resolveCandidateReturnPath } from "../../client/src/lib/candidateRedirect";

describe("rappel de consultation du bilan", () => {
  const now = new Date("2026-08-16T12:00:00.000Z");
  const base = { evaluationDeliveryStatus: "sent", evaluationCompletedAt: new Date("2026-08-13T11:59:00.000Z"), evaluationReportViewedAt: null, evaluationReportReminderSentAt: null };

  it("relance une seule fois un bilan envoyé mais non consulté après 72 heures", () => {
    expect(shouldSendEvaluationReminder(base, now)).toBe(true);
    expect(shouldSendEvaluationReminder({ ...base, evaluationReportViewedAt: new Date("2026-08-14T12:00:00.000Z") }, now)).toBe(false);
    expect(shouldSendEvaluationReminder({ ...base, evaluationReportReminderSentAt: new Date("2026-08-16T11:00:00.000Z") }, now)).toBe(false);
  });

  it("insère dans les e-mails un lien canonique de connexion vers le bon dossier", () => {
    const dossierNumber = "DOS-2026-001";
    const html = buildEvaluationDeliveryEmailHtml("<p>Bilan</p>", dossierNumber);
    const reminderHtml = buildEvaluationReminderEmailHtml("Aline", dossierNumber);
    const expectedLink = "https://www.3mtravelagency.com/login?redirect=1&from=%2Fmon-espace%3Fdossier%3DDOS-2026-001";

    expect(html).toContain(`href=\"${expectedLink}\"`);
    expect(reminderHtml).toContain(`href=\"${expectedLink}\"`);
  });

  it("restaure le dossier du candidat après connexion depuis le lien e-mail", () => {
    const link = new URL("https://www.3mtravelagency.com/login?redirect=1&from=%2Fmon-espace%3Fdossier%3DDOS-2026-001");
    expect(resolveCandidateReturnPath(link.searchParams.get("from"))).toBe("/mon-espace?dossier=DOS-2026-001");
  });

  it("ne diffuse jamais automatiquement un bilan tant que le conseiller ne l’a pas validé", () => {
    const now = new Date("2026-08-17T12:00:00.000Z");
    const base = { dossierStatus: "en_evaluation", evaluationDeliveryStatus: "draft", evaluationScheduledAt: null, createdAt: new Date("2026-08-14T10:00:00.000Z"), evaluationRequiresSecondApproval: false, evaluationApprovalStatus: "not_required", scoringDetails: JSON.stringify({ adminDraft: { verdict: "Bilan à relire", advisorValidated: false } }) };
    expect(canAutoDeliverEvaluation(base, now)).toBe(false);
    expect(canAutoDeliverEvaluation({ ...base, scoringDetails: JSON.stringify({ adminDraft: { verdict: "Bilan validé", advisorValidated: true } }) }, now)).toBe(true);
    expect(canAutoDeliverEvaluation({ ...base, scoringDetails: JSON.stringify({ adminDraft: { verdict: "Bilan validé", advisorValidated: true } }), evaluationRequiresSecondApproval: true, evaluationApprovalStatus: "pending" }, now)).toBe(false);
  });
});
