import { Request, Response } from "express";
import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import { clientNotifications, evaluationBilanVersions } from "../../drizzle/caseTrackingSchema";
import { desc, eq } from "drizzle-orm";
import { generateEvaluationReportHTML } from "../evaluationService";
import { sendEmail } from "../_core/email";
import { createFinalEvaluationPdf } from "../evaluationBilanPdfService";

export function shouldSendEvaluationReminder(application: { evaluationDeliveryStatus: string; evaluationCompletedAt: Date | null; evaluationReportViewedAt: Date | null; evaluationReportReminderSentAt: Date | null }, now = new Date()): boolean {
  const threshold = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  return application.evaluationDeliveryStatus === "sent" && Boolean(application.evaluationCompletedAt) && application.evaluationCompletedAt! <= threshold && !application.evaluationReportViewedAt && !application.evaluationReportReminderSentAt;
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
    const apps = candidates.filter((app) => {
      const isManualScheduleDue = app.evaluationDeliveryStatus === "scheduled" && app.evaluationScheduledAt && app.evaluationScheduledAt <= now;
      const isAutomaticFallbackDue = app.evaluationDeliveryStatus !== "scheduled" && app.createdAt < fortyEightHoursAgo;
      const isApprovedForDelivery = !app.evaluationRequiresSecondApproval || app.evaluationApprovalStatus === "approved";
      return isApprovedForDelivery && (isManualScheduleDue || isAutomaticFallbackDue);
    });

    console.log(`[Evaluation Bilan Job] Found ${apps.length} applications ready for bilan`);

    let successCount = 0;
    let errorCount = 0;
    let reminderCount = 0;

    for (const app of apps) {
      try {
        const reportHtml = generateEvaluationReportHTML(app);
        const latestVersion = (await db.select().from(evaluationBilanVersions).where(eq(evaluationBilanVersions.applicationId, app.id)).orderBy(desc(evaluationBilanVersions.versionNumber)).limit(1))[0];
        const versionNumber = latestVersion?.versionNumber ?? 1;
        const finalPdf = await createFinalEvaluationPdf(app, versionNumber);
        await sendEmail({
          to: app.email,
          subject: app.evaluationDeliverySubject || `Votre Bilan d'Évaluation - Dossier N° ${app.dossierNumber}`,
          html: `${reportHtml}<p style="margin-top:24px">Votre bilan finalisé est aussi disponible au format PDF dans votre <a href="https://www.3mtravelagency.com/mon-espace">Espace client sécurisé</a>.</p>`,
        });

        const sentAt = new Date();
        await db.update(applications).set({ dossierStatus: "en_attente_paiement", evaluationCompletedAt: sentAt, evaluationDeliveryStatus: "sent", evaluationScheduledAt: null, evaluationReportPdfKey: finalPdf.key, evaluationReportPdfUrl: finalPdf.url, evaluationReportUrl: `${process.env.APP_BASE_URL || "https://3mtravelagency.click"}/api/dossier/${app.dossierNumber}/report` }).where(eq(applications.id, app.id));
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
        console.error(`[Evaluation Bilan Job] ERROR for ${app.dossierNumber}:`, err);
        errorCount++;
      }
    }

    const deliveredApplications = await db.select().from(applications).where(eq(applications.evaluationDeliveryStatus, "sent")).limit(500);
    const reminders = deliveredApplications.filter((app) => shouldSendEvaluationReminder(app, now));
    for (const app of reminders) {
      try {
        await sendEmail({
          to: app.email,
          subject: `Rappel : votre bilan d’évaluation est disponible — Dossier ${app.dossierNumber}`,
          html: `<p>Bonjour ${app.fullName},</p><p>Votre bilan d’évaluation est disponible depuis plus de 72 heures et n’a pas encore été consulté.</p><p>Connectez-vous à votre <a href="https://www.3mtravelagency.com/mon-espace">Espace client sécurisé</a> pour le lire et télécharger votre PDF.</p><p>L’équipe 3M Travel & Services reste disponible pour vous accompagner.</p>`,
        });
        const sentAt = new Date();
        await db.update(applications).set({ evaluationReportReminderSentAt: sentAt, updatedAt: sentAt }).where(eq(applications.id, app.id));
        if (app.candidateId) {
          await db.insert(clientNotifications).values({ candidateId: app.candidateId, type: "evaluation_reminder", title: "Rappel : votre bilan vous attend", body: `Votre bilan finalisé pour le dossier ${app.dossierNumber} n’a pas encore été consulté. Il reste disponible dans votre espace client.`, actionUrl: "/mon-espace", isRead: false, emailSentAt: sentAt });
        }
        reminderCount++;
      } catch (err) {
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
