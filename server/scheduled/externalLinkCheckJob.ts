import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { externalLinkChecks } from "../../drizzle/routeHealthSchema";
import { getDb } from "../db";
import { sdk } from "../_core/sdk";
import { performLinkCheck } from "../routers/routeHealthRouter";

/**
 * Heartbeat callback for the project-level external-link monitor.
 * It is deliberately idempotent: every run replaces the latest status for
 * each known URL and never creates duplicate link rows.
 */
export async function handleExternalLinkCheckJob(req: Request, res: Response) {
  const timestamp = new Date().toISOString();
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(200).json({ ok: true, skipped: "database-unavailable", taskUid: user.taskUid });
    }

    const links = await db.select().from(externalLinkChecks).limit(200);
    let checked = 0;
    let broken = 0;
    for (const link of links) {
      const result = await performLinkCheck(link.url);
      await db.update(externalLinkChecks)
        .set({ ...result, checkedAt: new Date(), updatedByAdminId: null })
        .where(eq(externalLinkChecks.id, link.id));
      checked += 1;
      if (result.status !== "ok") broken += 1;
    }

    return res.json({ ok: true, taskUid: user.taskUid, checked, broken, timestamp });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ExternalLinkCheckJob] failed", error);
    return res.status(500).json({
      error: message,
      timestamp,
      context: { url: req.originalUrl, taskUid: req.headers["x-manus-task-uid"] ?? null },
    });
  }
}
