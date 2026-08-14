import { eq } from "drizzle-orm";
import { adminAccounts, adminAuditLogs } from "../../drizzle/schema";
import { getDb } from "../db";
import type { TrpcContext } from "../_core/context";

type AuditCategory = "auth" | "mutation" | "access" | "security";
type AuditOutcome = "success" | "failure";

export type AdminAuditEvent = {
  adminAccountId?: number | null;
  adminEmail: string;
  action: string;
  category: AuditCategory;
  resourceType?: string;
  resourceId?: string;
  outcome?: AuditOutcome;
  details?: Record<string, unknown> | string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const SECRET_KEY = /(password|token|secret|authorization|cookie|fileurl|filekey|signedurl|html|body|content)/i;

export function sanitizeAuditDetails(details: AdminAuditEvent["details"]): string | null {
  if (details == null) return null;
  if (typeof details === "string") return details.slice(0, 4000);

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (!SECRET_KEY.test(key)) safe[key] = value;
  }
  try {
    return JSON.stringify(safe).slice(0, 4000);
  } catch {
    return null;
  }
}

export function getRequestIp(ctx: Pick<TrpcContext, "req">): string | null {
  const forwarded = ctx.req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  const ip = raw?.trim() || ctx.req.socket.remoteAddress || null;
  return ip ? ip.slice(0, 64) : null;
}

export function getRequestUserAgent(ctx: Pick<TrpcContext, "req">): string | null {
  const value = ctx.req.headers["user-agent"];
  return typeof value === "string" ? value.slice(0, 512) : null;
}

export async function findAdminBySessionToken(sessionToken: string) {
  if (!sessionToken) return null;
  const db = await getDb();
  if (!db) return null;
  const [admin] = await db
    .select({ id: adminAccounts.id, email: adminAccounts.email })
    .from(adminAccounts)
    .where(eq(adminAccounts.sessionToken, sessionToken))
    .limit(1);
  return admin ?? null;
}

export async function findAdminByEmail(email: string) {
  if (!email) return null;
  const db = await getDb();
  if (!db) return null;
  const [admin] = await db
    .select({ id: adminAccounts.id, email: adminAccounts.email })
    .from(adminAccounts)
    .where(eq(adminAccounts.email, email.toLowerCase().trim()))
    .limit(1);
  return admin ?? null;
}

export async function recordAdminAudit(event: AdminAuditEvent): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(adminAuditLogs).values({
      adminAccountId: event.adminAccountId ?? null,
      adminEmail: event.adminEmail.slice(0, 320),
      action: event.action.slice(0, 120),
      category: event.category,
      resourceType: event.resourceType?.slice(0, 80),
      resourceId: event.resourceId?.slice(0, 120),
      outcome: event.outcome ?? "success",
      details: sanitizeAuditDetails(event.details),
      ipAddress: event.ipAddress?.slice(0, 64),
      userAgent: event.userAgent?.slice(0, 512),
    });
  } catch (error) {
    // L’audit ne doit jamais faire échouer l’action métier, mais son échec reste visible côté serveur.
    console.error("[Admin Audit] Écriture impossible", error);
  }
}

export async function recordAdminAuditFromContext(
  ctx: Pick<TrpcContext, "req">,
  event: Omit<AdminAuditEvent, "ipAddress" | "userAgent">,
): Promise<void> {
  return recordAdminAudit({
    ...event,
    ipAddress: getRequestIp(ctx),
    userAgent: getRequestUserAgent(ctx),
  });
}
