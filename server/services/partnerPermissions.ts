import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { partnerUserPermissions } from "../../drizzle/schema";
import { resolvePartnerPermissions, type PartnerPermissionKey } from "../../shared/partnerModule";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Vérifie côté serveur qu'un utilisateur partenaire détient une permission précise (jamais déduite de l'interface). */
export async function requirePartnerPermission(db: Db, account: { id: number; collaborationRole: "reader" | "manager" }, key: PartnerPermissionKey): Promise<void> {
  const stored = (await db.select().from(partnerUserPermissions).where(eq(partnerUserPermissions.accountId, account.id)).limit(1))[0];
  const permissions = resolvePartnerPermissions(account.collaborationRole, stored?.permissions);
  if (!permissions[key]) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Votre compte n’a pas cette permission. Demandez-la au gestionnaire de votre organisation." });
  }
}
