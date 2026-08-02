/**
 * Job Heartbeat — Évaluation automatique des nouveaux dossiers
 * Endpoint: POST /api/scheduled/evaluation-job
 * Cron: "0 0 8 * * *" (tous les jours à 8h UTC)
 */

import { Request, Response } from "express";
import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateEvaluationReportHTML } from "../evaluationService";
import { sendEvaluationReportEmail } from "../emailService";

export async function handleEvaluationJob(req: Request, res: Response): Promise<void> {
  try {
    console.log("[Evaluation Job] Starting automated evaluation job...");

    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database unavailable" });
      return;
    }

    // Récupérer les dossiers non évalués (status = "nouveau")
    const apps = await db
      .select()
      .from(applications)
      .where(eq(applications.dossierStatus, "nouveau"))
      .limit(100);

    console.log(`[Evaluation Job] Found ${apps.length} new applications to evaluate`);

    let successCount = 0;
    let errorCount = 0;

    for (const app of apps) {
      try {
        // Générer le rapport HTML
        const reportHtml = generateEvaluationReportHTML(app);

        // Envoyer par email
        await sendEvaluationReportEmail(app.email, app.fullName, app.dossierNumber, reportHtml);

        // Marquer comme "en_evaluation" apres envoi
        await db
          .update(applications)
          .set({ dossierStatus: "en_evaluation" })
          .where(eq(applications.id, app.id));

        console.log(`[Evaluation Job] ✓ Evaluation report sent for ${app.dossierNumber}`);
        successCount++;
      } catch (err) {
        console.error(`[Evaluation Job] ✗ Error for ${app.dossierNumber}:`, err);
        errorCount++;
      }
    }

    console.log(
      `[Evaluation Job] Completed: ${successCount} sent, ${errorCount} errors, ${apps.length} total processed`
    );

    res.status(200).json({
      success: true,
      message: `Evaluation job completed: ${successCount} reports sent, ${errorCount} errors`,
      successCount,
      errorCount,
      totalProcessed: apps.length,
    });
  } catch (err) {
    console.error("[Evaluation Job] Fatal error:", err);
    res.status(500).json({
      error: "Evaluation job failed",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
