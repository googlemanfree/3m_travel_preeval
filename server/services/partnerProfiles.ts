import { eq } from "drizzle-orm";
import { partnerInteractions, partnerProfiles, partnerRegistrationExtras } from "../../drizzle/schema";
import type { getDb } from "../db";
import { defaultCategoryForOrganizationType, type PartnerCategory, type PartnerRelationshipStatus } from "../../shared/partnerModule";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type PartnerRequestSnapshot = {
  id: number;
  organizationType: "employer" | "placement_partner";
  contactFullName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
  sectors: string | null;
  targetMarkets: string | null;
};

export function adminLabel(admin: { id: number; email?: string | null }): string {
  return (admin.email ?? `admin #${admin.id}`).slice(0, 160);
}

export async function logPartnerInteraction(
  db: Db,
  data: { organizationId: number; kind: "note" | "call" | "email" | "meeting" | "status_change" | "invitation" | "document"; summary: string; followUpAt?: Date | null; admin?: { id: number; email?: string | null } | null },
) {
  await db.insert(partnerInteractions).values({
    organizationId: data.organizationId,
    kind: data.kind,
    summary: data.summary.slice(0, 4000),
    followUpAt: data.followUpAt ?? null,
    createdByAdminId: data.admin?.id ?? null,
    createdByLabel: data.admin ? adminLabel(data.admin) : "Système",
  });
}

/**
 * Crée (ou complète) la fiche de suivi d'un partenaire quand sa demande d'accès est approuvée.
 * Une simple demande n'est jamais présentée comme « partenaire officiel » : le statut reste « en vérification »
 * tant que l'organisation n'est pas vérifiée, puis « validé » — jamais « actif » automatiquement.
 */
export async function ensurePartnerProfileFromRequest(
  db: Db,
  request: PartnerRequestSnapshot,
  organizationId: number,
  verified: boolean,
  admin: { id: number; email?: string | null },
) {
  const extras = (await db.select().from(partnerRegistrationExtras).where(eq(partnerRegistrationExtras.requestId, request.id)).limit(1))[0];
  const category: PartnerCategory = extras?.category ?? defaultCategoryForOrganizationType(request.organizationType);
  const status: PartnerRelationshipStatus = verified ? "validated" : "in_verification";
  const existing = (await db.select().from(partnerProfiles).where(eq(partnerProfiles.organizationId, organizationId)).limit(1))[0];
  if (existing) {
    const upgradable = ["prospect", "contacted", "in_verification"].includes(existing.relationshipStatus);
    if (verified && upgradable) {
      await db.update(partnerProfiles).set({ relationshipStatus: "validated" }).where(eq(partnerProfiles.id, existing.id));
      await logPartnerInteraction(db, { organizationId, kind: "status_change", summary: `Statut : ${existing.relationshipStatus} → validated (organisation vérifiée).`, admin });
    }
    return;
  }
  await db.insert(partnerProfiles).values({
    organizationId,
    category,
    relationshipStatus: status,
    primaryContactName: request.contactFullName,
    primaryContactEmail: request.contactEmail,
    primaryContactPhone: request.contactPhone,
    primaryContactRole: request.contactRole,
    specialties: request.sectors,
    operatingCountries: request.targetMarkets,
    ownerAdminId: admin.id,
    ownerAdminLabel: adminLabel(admin),
    mandateCompany: extras?.mandateCompany ?? null,
    mandateConfidential: Boolean(extras?.mandateConfidential),
  });
  await logPartnerInteraction(db, { organizationId, kind: "status_change", summary: `Fiche partenaire créée à l’approbation de la demande d’accès (${status}).`, admin });
}
