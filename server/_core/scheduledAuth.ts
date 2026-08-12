import type { Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";

/**
 * Refuse les appels publics vers les endpoints internes planifiés.
 * Le planificateur doit fournir : Authorization: Bearer $CRON_SECRET.
 */
export function requireCronSecret(req: Request, res: Response): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    console.error("[ScheduledAuth] CRON_SECRET absent : endpoint planifié désactivé.");
    res.status(503).json({ error: "Planification non configurée" });
    return false;
  }

  const authorization = req.headers.authorization ?? "";
  const receivedSecret = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expectedBuffer = Buffer.from(configuredSecret);
  const receivedBuffer = Buffer.from(receivedSecret);

  const isValid = expectedBuffer.length === receivedBuffer.length
    && timingSafeEqual(expectedBuffer, receivedBuffer);
  if (!isValid) {
    res.status(401).json({ error: "Accès planifié non autorisé" });
    return false;
  }
  return true;
}
