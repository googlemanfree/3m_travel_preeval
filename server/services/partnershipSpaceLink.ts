import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { partnershipSpaceLinks } from "../../drizzle/schema";
import type { getDb } from "../db";
import { hashToken } from "../routers/placementPortal";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const SPACE_LINK_VALIDITY_DAYS = 365;
const SITE_URL = (process.env.SITE_URL || "https://www.3mtravelagency.com").replace(/\/$/, "");
export const SPACE_ROUTE = "/partenariat/espace";

export const spaceLinkUrl = (token: string) => `${SITE_URL}${SPACE_ROUTE}?token=${encodeURIComponent(token)}`;

/** Crée le lien privé de l'espace partenaire et révoque les précédents : un seul lien actif à la fois. */
export async function issueSpaceLink(db: Db, applicationId: number, now: Date = new Date()): Promise<{ token: string; link: string; expiresAt: Date }> {
  await db.update(partnershipSpaceLinks).set({ revokedAt: now }).where(and(eq(partnershipSpaceLinks.applicationId, applicationId), isNull(partnershipSpaceLinks.revokedAt)));
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + SPACE_LINK_VALIDITY_DAYS * 24 * 3600 * 1000);
  await db.insert(partnershipSpaceLinks).values({ applicationId, tokenHash: hashToken(token), expiresAt });
  return { token, link: spaceLinkUrl(token), expiresAt };
}

export type SpaceLinkResolution = { applicationId: number; linkId: number } | { error: "invalid" | "revoked" | "expired" };

export async function resolveSpaceLink(db: Db, token: string, now: Date = new Date()): Promise<SpaceLinkResolution> {
  const [link] = await db.select().from(partnershipSpaceLinks).where(eq(partnershipSpaceLinks.tokenHash, hashToken(token))).limit(1);
  if (!link) return { error: "invalid" };
  if (link.revokedAt) return { error: "revoked" };
  if (link.expiresAt.getTime() <= now.getTime()) return { error: "expired" };
  return { applicationId: link.applicationId, linkId: link.id };
}
