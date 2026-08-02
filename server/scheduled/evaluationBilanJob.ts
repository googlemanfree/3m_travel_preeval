import { Request, Response } from "express";
import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import { generateEvaluationReportHTML } from "../evaluationService";
import { sendEvisaStatusUpdateEmail } from "../emailService";

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

    const apps = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.dossierStatus, "en_evaluation"),
          lt(applications.createdAt, fortyEightHoursAgo)
        )
      )
      .limit(100);

    console.log(`[Evaluation Bilan Job] Found ${apps.length} applications ready for bilan`);

    let successCount = 0;
    let errorCount = 0;

    for (const app of apps) {
      try {
        const reportHtml = generateEvaluationReportHTML(app);
        await sendEvisaStatusUpdateEmail(app.email, app.fullName, app.dossierNumber, app.destination, "processing", reportHtml);

        await db
          .update(applications)
          .set({
            dossierStatus: "en_attente_paiement",
            evaluationCompletedAt: new Date(),
            evaluationReportUrl: `${process.env.APP_BASE_URL || "https://3mtravelagency.click"}/api/dossier/${app.dossierNumber}/report`,
          })
          .where(eq(applications.id, app.id));

        console.log(`[Evaluation Bilan Job] OK Bilan report sent for ${app.dossierNumber}`);
        successCount++;
      } catch (err) {
        console.error(`[Evaluation Bilan Job] ERROR for ${app.dossierNumber}:`, err);
        errorCount++;
      }
    }

    console.log(
      `[Evaluation Bilan Job] Completed: ${successCount} sent, ${errorCount} errors, ${apps.length} total processed`
    );

    res.status(200).json({
      success: true,
      message: `Bilan job completed: ${successCount} reports sent, ${errorCount} errors`,
      successCount,
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
