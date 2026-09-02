import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildEvaluationDeliveryEmailHtml, buildEvaluationReminderEmailHtml, canAutoDeliverEvaluation, shouldSendEvaluationReminder } from "./evaluationBilanJob";
import { resolveCandidateReturnPath } from "../../client/src/lib/candidateRedirect";

const root = resolve(import.meta.dirname, "../..");

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

  it("trace la relance et ajoute un pixel d’ouverture avant de la marquer envoyée", () => {
    const source = readFileSync(resolve(root, "server/scheduled/evaluationBilanJob.ts"), "utf8");
    expect(source).toContain('emailType: "reminder"');
    expect(source).toContain("appendEvaluationOpenTrackingPixel(reminderBaseHtml, reminderTrackingEmailId)");
    expect(source).toContain('set({ status: "sent", sentAt, reportContent: reminderHtml })');
    expect(source).toContain("evaluationReportReminderSentAt: sentAt");
    expect(source).toContain("const claimed = Number((claim as any)[0]?.affectedRows ?? 0) > 0");
    expect(source).toContain("if (!reminderDispatched) await db.update(applications).set({ evaluationReportReminderSentAt: null");
  });

  it("restaure le dossier du candidat après connexion depuis le lien e-mail", () => {
    const link = new URL("https://www.3mtravelagency.com/login?redirect=1&from=%2Fmon-espace%3Fdossier%3DDOS-2026-001");
    expect(resolveCandidateReturnPath(link.searchParams.get("from"))).toBe("/mon-espace?dossier=DOS-2026-001");
  });

  it("ne diffuse jamais automatiquement un bilan, même validé, sans planification humaine", () => {
    const now = new Date("2026-08-17T12:00:00.000Z");
    const base = { dossierStatus: "en_evaluation", evaluationDeliveryStatus: "draft", evaluationScheduledAt: null, createdAt: new Date("2026-08-14T10:00:00.000Z"), evaluationRequiresSecondApproval: false, evaluationApprovalStatus: "not_required", scoringDetails: JSON.stringify({ adminDraft: { verdict: "Bilan à relire", advisorValidated: false } }) };
    expect(canAutoDeliverEvaluation(base, now)).toBe(false);
    expect(canAutoDeliverEvaluation({ ...base, scoringDetails: JSON.stringify({ adminDraft: { verdict: "Bilan validé", advisorValidated: true } }) }, now)).toBe(false);
    expect(canAutoDeliverEvaluation({ ...base, evaluationDeliveryStatus: "scheduled", evaluationScheduledAt: new Date("2026-08-17T11:59:00.000Z"), scoringDetails: JSON.stringify({ adminDraft: { verdict: "Bilan validé", advisorValidated: true } }) }, now)).toBe(true);
    expect(canAutoDeliverEvaluation({ ...base, scoringDetails: JSON.stringify({ adminDraft: { verdict: "Bilan validé", advisorValidated: true } }), evaluationRequiresSecondApproval: true, evaluationApprovalStatus: "pending" }, now)).toBe(false);
  });
});
