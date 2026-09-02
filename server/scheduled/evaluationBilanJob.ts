import { Request, Response } from "express";
import { getDb } from "../db";
import { applications, evaluationEmails } from "../../drizzle/schema";
import { clientNotifications, evaluationBilanVersions } from "../../drizzle/caseTrackingSchema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { generateEvaluationReportHTML } from "../evaluationService";
import { sendEmail } from "../_core/email";
import { createFinalEvaluationPdf } from "../evaluationBilanPdfService";
import { buildCandidateSpaceAccessUrl, buildEvaluationReportUrl } from "../services/candidateAccessLink";
import { appendEvaluationOpenTrackingPixel, buildAdvisorSignatureHtml } from "../services/evaluationEmailCommunication";
import { buildEvaluationReminderEmailHtml as buildSharedEvaluationReminderEmailHtml } from "../services/evaluationReminderCommunication";

export function buildEvaluationDeliveryEmailHtml(reportHtml: string, dossierNumber: string, advisorName?: string | null): string {
  const candidateSpaceUrl = buildCandidateSpaceAccessUrl(dossierNumber);
  return `${reportHtml}<p style="margin-top:24px">Votre bilan finalisé est aussi disponible au format PDF dans votre <a href="${candidateSpaceUrl}">Espace client sécurisé</a>.</p><p style="font-size:13px;color:#64748b">Connectez-vous avec l’adresse e-mail associée à votre dossier. Après connexion, vous serez redirigé vers votre espace en toute sécurité.</p>${buildAdvisorSignatureHtml(advisorName)}`;
}

export function buildEvaluationReminderEmailHtml(fullName: string, dossierNumber: string): string {
  return buildSharedEvaluationReminderEmailHtml(fullName, dossierNumber, "fr");
}

export function shouldSendEvaluationReminder(application: { evaluationDeliveryStatus: string; evaluationCompletedAt: Date | null; evaluationReportViewedAt: Date | null; evaluationReportReminderSentAt: Date | null }, now = new Date()): boolean {
  const threshold = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  return application.evaluationDeliveryStatus === "sent" && Boolean(application.evaluationCompletedAt) && application.evaluationCompletedAt! <= threshold && !application.evaluationReportViewedAt && !application.evaluationReportReminderSentAt;
}

export function canAutoDeliverEvaluation(application: { dossierStatus: string; evaluationDeliveryStatus: string; evaluationScheduledAt: Date | null; createdAt: Date; evaluationRequiresSecondApproval: boolean; evaluationApprovalStatus: string; scoringDetails: string | null }, now = new Date()): boolean {
  if (application.dossierStatus !== "en_evaluation") return false;
  const isManualScheduleDue = application.evaluationDeliveryStatus === "scheduled" && Boolean(application.evaluationScheduledAt && application.evaluationScheduledAt <= now);
  let details: Record<string, unknown> = {};
  try { details = JSON.parse(application.scoringDetails || "{}"); } catch { details = {}; }
  const draft = details.adminDraft && typeof details.adminDraft === "object" ? details.adminDraft as Record<string, unknown> : {};
  const isApprovedForDelivery = draft.advisorValidated === true && (!application.evaluationRequiresSecondApproval || application.evaluationApprovalStatus === "approved");
  // Un bilan n’est jamais diffusé automatiquement sans planification humaine explicite.
  return isApprovedForDelivery && isManualScheduleDue;
}

export async function handleEvaluationBilanJob(req: Request, res: Response): Promise<void> {
  try {
    console.log("[Evaluation Bilan Job] Starting automated bilan job...");

    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database unavailable" });
      return;
    }

    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    console.log(`[Evaluation Bilan Job] Looking for applications created before ${fortyEightHoursAgo.toISOString()}`);

    const candidates = await db.select().from(applications).where(eq(applications.dossierStatus, "en_evaluation")).limit(200);
    const apps = candidates.filter((app) => canAutoDeliverEvaluation(app, now));

    console.log(`[Evaluation Bilan Job] Found ${apps.length} applications ready for bilan`);

    let successCount = 0;
    let errorCount = 0;
    let reminderCount = 0;

    for (const app of apps) {
      let trackingEmailId = 0;
      let emailDispatched = false;
      try {
        const reportHtml = generateEvaluationReportHTML(app);
        const versionAuditTrail = await db.select({ id: evaluationBilanVersions.id, versionNumber: evaluationBilanVersions.versionNumber, createdAt: evaluationBilanVersions.createdAt, createdByAdminAccountId: evaluationBilanVersions.createdByAdminAccountId, approvalStatus: evaluationBilanVersions.approvalStatus, approvedAt: evaluationBilanVersions.approvedAt, approvedByAdminId: evaluationBilanVersions.approvedByAdminAccountId, approvalComment: evaluationBilanVersions.approvalComment, sentAt: evaluationBilanVersions.sentAt }).from(evaluationBilanVersions).where(eq(evaluationBilanVersions.applicationId, app.id)).orderBy(desc(evaluationBilanVersions.versionNumber)).limit(30);
        const latestVersion = versionAuditTrail[0];
        const versionNumber = latestVersion?.versionNumber ?? 1;
        const finalPdf = await createFinalEvaluationPdf(app, versionNumber, versionAuditTrail);
        const emailBaseHtml = buildEvaluationDeliveryEmailHtml(reportHtml, app.dossierNumber, app.adminAssignedTo);
        const trackingInsert = await db.insert(evaluationEmails).values({ evaluationId: app.id, candidateEmail: app.email, candidateName: app.fullName, destinationCountry: app.destination || "Mobilité internationale", visaType: app.visaType || "Évaluation de profil", emailType: "admissibility_report", scheduledAt: now, status: "pending", reportContent: emailBaseHtml, secureLink: buildCandidateSpaceAccessUrl(app.dossierNumber) });
        trackingEmailId = Number((trackingInsert as any)[0]?.insertId ?? 0);
        const emailHtml = trackingEmailId > 0 ? appendEvaluationOpenTrackingPixel(emailBaseHtml, trackingEmailId) : emailBaseHtml;
        await sendEmail({
          to: app.email,
          subject: app.evaluationDeliverySubject || `Votre Bilan d'Évaluation - Dossier N° ${app.dossierNumber}`,
          html: emailHtml,
        });
        emailDispatched = true;

        if (trackingEmailId > 0) await db.update(evaluationEmails).set({ status: "sent", sentAt: new Date(), reportContent: emailHtml }).where(eq(evaluationEmails.id, trackingEmailId));

        const sentAt = new Date();
        await db.update(applications).set({ dossierStatus: "en_attente_paiement", evaluationCompletedAt: sentAt, evaluationDeliveryStatus: "sent", evaluationScheduledAt: null, evaluationReportPdfKey: finalPdf.key, evaluationReportPdfUrl: finalPdf.url, evaluationReportUrl: buildEvaluationReportUrl(app.dossierNumber) }).where(eq(applications.id, app.id));
        if (latestVersion) {
          await db.update(evaluationBilanVersions).set({ approvalStatus: "sent", pdfKey: finalPdf.key, pdfUrl: finalPdf.url, sentAt }).where(eq(evaluationBilanVersions.id, latestVersion.id));
        } else {
          await db.insert(evaluationBilanVersions).values({ applicationId: app.id, versionNumber, contentJson: JSON.stringify({ systemGenerated: true }), reportHtml, createdByAdminAccountId: 0, requiresSecondApproval: false, approvalStatus: "sent", pdfKey: finalPdf.key, pdfUrl: finalPdf.url, sentAt });
        }
        if (app.candidateId) {
          await db.insert(clientNotifications).values({ candidateId: app.candidateId, type: "evaluation_available", title: "Votre bilan d’évaluation est disponible", body: `Votre bilan finalisé pour le dossier ${app.dossierNumber} est prêt. Consultez-le et téléchargez votre PDF depuis votre espace client.`, actionUrl: "/mon-espace", isRead: false, emailSentAt: sentAt });
        }

        console.log(`[Evaluation Bilan Job] OK Bilan report sent for ${app.dossierNumber}`);
        successCount++;
      } catch (err) {
        if (!emailDispatched && trackingEmailId > 0) {
          await db.update(evaluationEmails).set({ status: "failed", failureReason: err instanceof Error ? err.message : String(err) }).where(eq(evaluationEmails.id, trackingEmailId));
        }
        console.error(`[Evaluation Bilan Job] ERROR for ${app.dossierNumber}:`, err);
        errorCount++;
      }
    }

    const deliveredApplications = await db.select().from(applications).where(eq(applications.evaluationDeliveryStatus, "sent")).limit(500);
    const reminders = deliveredApplications.filter((app) => shouldSendEvaluationReminder(app, now));
    for (const app of reminders) {
      const claimAt = new Date();
      const claim = await db.update(applications).set({ evaluationReportReminderSentAt: claimAt, updatedAt: claimAt }).where(and(
        eq(applications.id, app.id),
        eq(applications.evaluationDeliveryStatus, "sent"),
        isNull(applications.evaluationReportViewedAt),
        isNull(applications.evaluationReportReminderSentAt),
      ));
      const claimed = Number((claim as any)[0]?.affectedRows ?? 0) > 0;
      if (!claimed) continue;

      let reminderTrackingEmailId = 0;
      let reminderDispatched = false;
      try {
        const reminderBaseHtml = buildEvaluationReminderEmailHtml(app.fullName, app.dossierNumber);
        const trackingInsert = await db.insert(evaluationEmails).values({
          evaluationId: app.id,
          candidateEmail: app.email,
          candidateName: app.fullName,
          destinationCountry: app.destination || "Mobilité internationale",
          visaType: app.visaType || "Évaluation de profil",
          emailType: "reminder",
          language: "fr",
          scheduledAt: now,
          status: "pending",
          reportContent: reminderBaseHtml,
          secureLink: buildCandidateSpaceAccessUrl(app.dossierNumber),
        });
        reminderTrackingEmailId = Number((trackingInsert as any)[0]?.insertId ?? 0);
        const reminderHtml = reminderTrackingEmailId > 0 ? appendEvaluationOpenTrackingPixel(reminderBaseHtml, reminderTrackingEmailId) : reminderBaseHtml;
        await sendEmail({
          to: app.email,
          subject: `Rappel : votre bilan d’évaluation est disponible — Dossier ${app.dossierNumber}`,
          html: reminderHtml,
        });
        reminderDispatched = true;
        const sentAt = new Date();
        if (reminderTrackingEmailId > 0) await db.update(evaluationEmails).set({ status: "sent", sentAt, reportContent: reminderHtml }).where(eq(evaluationEmails.id, reminderTrackingEmailId));
        await db.update(applications).set({ evaluationReportReminderSentAt: sentAt, updatedAt: sentAt }).where(eq(applications.id, app.id));
        if (app.candidateId) {
          await db.insert(clientNotifications).values({ candidateId: app.candidateId, type: "evaluation_reminder", title: "Rappel : votre bilan vous attend", body: `Votre bilan finalisé pour le dossier ${app.dossierNumber} n’a pas encore été consulté. Il reste disponible dans votre espace client.`, actionUrl: "/mon-espace", isRead: false, emailSentAt: sentAt });
        }
        reminderCount++;
      } catch (err) {
        if (reminderTrackingEmailId > 0 && !reminderDispatched) await db.update(evaluationEmails).set({ status: "failed", failureReason: err instanceof Error ? err.message : String(err) }).where(eq(evaluationEmails.id, reminderTrackingEmailId));
        if (!reminderDispatched) await db.update(applications).set({ evaluationReportReminderSentAt: null, updatedAt: new Date() }).where(and(eq(applications.id, app.id), isNull(applications.evaluationReportViewedAt)));
        console.error(`[Evaluation Bilan Job] ERROR reminder for ${app.dossierNumber}:`, err);
        errorCount++;
      }
    }

    console.log(
      `[Evaluation Bilan Job] Completed: ${successCount} sent, ${errorCount} errors, ${apps.length} total processed`
    );

    res.status(200).json({
      success: true,
      message: `Bilan job completed: ${successCount} reports sent, ${reminderCount} reminders sent, ${errorCount} errors`,
      successCount,
      reminderCount,
      errorCount,
      totalProcessed: apps.length,
    });
  } catch (err) {
    console.error("[Evaluation Bilan Job] Fatal error:", err);
    res.status(500).json({
      error: "Bilan job failed",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
