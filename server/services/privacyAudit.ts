import { createHash } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { privacyAuditEvents } from "../../drizzle/schema";
import { logger } from "../_core/logger";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type PrivacyEventInput = {
  actorType: "admin" | "employer" | "candidate" | "system";
  actorId?: number | null;
  actorLabel?: string | null;
  organizationId?: number | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | number | null;
  outcome?: "success" | "denied" | "failure";
  details?: string | null;
  ip?: string | null;
};

const hashIp = (ip: string) => createHash("sha256").update(`3m-privacy:${ip}`).digest("hex").slice(0, 32);

/**
 * Enregistre une consultation ou une action sensible : qui, quoi, quand. Les détails ne contiennent jamais de donnée
 * sensible. L'échec d'écriture ne bloque jamais l'action mais est journalisé (le journal est une preuve, pas un verrou).
 */
export async function recordPrivacyEvent(db: Db, input: PrivacyEventInput): Promise<void> {
  try {
    await db.insert(privacyAuditEvents).values({
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      actorLabel: input.actorLabel?.slice(0, 160) ?? null,
      organizationId: input.organizationId ?? null,
      action: input.action.slice(0, 80),
      resourceType: input.resourceType?.slice(0, 60) ?? null,
      resourceId: input.resourceId === undefined || input.resourceId === null ? null : String(input.resourceId).slice(0, 120),
      outcome: input.outcome ?? "success",
      details: input.details?.slice(0, 500) ?? null,
      ipHash: input.ip ? hashIp(input.ip) : null,
    });
  } catch (error) {
    logger.error("privacy_audit.write_failed", { action: input.action }, error);
  }
}

/** Nombre d'événements d'un acteur pour une action depuis une date : base de la limitation anti-aspiration. */
export async function countRecentEvents(db: Db, actorType: PrivacyEventInput["actorType"], actorId: number, action: string, sinceMs: number): Promise<number> {
  const since = new Date(Date.now() - sinceMs);
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(privacyAuditEvents)
    .where(and(eq(privacyAuditEvents.actorType, actorType), eq(privacyAuditEvents.actorId, actorId), eq(privacyAuditEvents.action, action), gt(privacyAuditEvents.createdAt, since)));
  return Number(row?.n ?? 0);
}
