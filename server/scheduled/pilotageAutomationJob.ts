/**
 * Automatisation quotidienne pilotage (Vague 2–3).
 * POST /api/scheduled/pilotage-automation — corps facultatif {"dryRun": true}
 * Cron conseillé : 10:30 UTC (après document-reminders à 10:00).
 */

import type { Request, Response } from "express";
import { getDb } from "../db";
import { runPilotageAutomation } from "../services/pilotageAutomation";

export async function handlePilotageAutomationJob(req: Request, res: Response): Promise<void> {
  const dryRun = Boolean((req.body as { dryRun?: boolean } | undefined)?.dryRun);
  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "DB unavailable", planned: 0, sent: 0, failed: 1 });
      return;
    }
    const summary = await runPilotageAutomation(db, { dryRun });
    const planned =
      summary.activation.planned
      + summary.relances.planned
      + summary.advance.planned;
    const sent =
      summary.activation.activated
      + summary.relances.sent
      + summary.advance.advanced;
    const failed = summary.activation.skipped.length + summary.relances.skipped;
    res.status(200).json({
      ok: true,
      dryRun,
      planned,
      sent,
      failed,
      summary,
    });
  } catch (error) {
    console.error("[pilotageAutomationJob]", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "pilotage automation failed",
      planned: 0,
      sent: 0,
      failed: 1,
    });
  }
}
