/**
 * Rappels auto protocole N°01/N°02 + confirmation bilan.
 * POST /api/scheduled/signature-confirmation-reminders — {"dryRun": true} optionnel
 * Cron : 11:00 UTC (après document-reminders 10:00).
 */

import type { Request, Response } from "express";
import { getDb } from "../db";
import { runSignatureAndConfirmationReminders } from "../services/signatureAndConfirmationReminders";

export async function handleSignatureAndConfirmationRemindersJob(req: Request, res: Response): Promise<void> {
  const dryRun = Boolean((req.body as { dryRun?: boolean } | undefined)?.dryRun);
  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "DB unavailable", planned: 0, sent: 0, failed: 1 });
      return;
    }
    const outcomes = await runSignatureAndConfirmationReminders(db, { dryRun });
    const planned = outcomes.filter((row) => row.planned).length;
    const sent = outcomes.filter((row) => row.emailSent || row.whatsappSent).length;
    const failed = outcomes.filter((row) => row.planned && !row.emailSent && !row.whatsappSent && !dryRun).length;
    res.status(200).json({
      ok: true,
      dryRun,
      planned,
      sent: dryRun ? 0 : sent,
      failed,
      byKind: {
        protocol_one: outcomes.filter((row) => row.kind === "protocol_one" && row.planned).length,
        protocol_two: outcomes.filter((row) => row.kind === "protocol_two" && row.planned).length,
        bilan_confirmation: outcomes.filter((row) => row.kind === "bilan_confirmation" && row.planned).length,
      },
      outcomes: outcomes.filter((row) => row.planned || row.skipped === "deja_relance").slice(0, 80),
    });
  } catch (error) {
    console.error("[signatureAndConfirmationRemindersJob]", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "reminder job failed",
      planned: 0,
      sent: 0,
      failed: 1,
    });
  }
}
