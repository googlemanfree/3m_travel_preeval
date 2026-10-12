/**
 * Signature du protocole pour dossiers agence (3M-AGN-*).
 * Stockée dans agency_settings — n’écrit jamais agency_dossiers.status.
 */

import { eq, like } from "drizzle-orm";
import { agencyDossierDocuments, agencySettings } from "../../drizzle/schema";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const AGENCY_AGREEMENT_SIGNED_KEY_PREFIX = "agency_agreement_signed:";

export type AgencyAgreementSignatureRecord = {
  dossierId: number;
  dossierNumber: string;
  signedAt: string;
  signatureName: string;
  ipAddress: string;
  empreinteSha: string;
  pdfUrl?: string | null;
  candidateEmail: string;
};

export function agencyAgreementSignedKey(dossierId: number): string {
  return `${AGENCY_AGREEMENT_SIGNED_KEY_PREFIX}${dossierId}`;
}

export function parseAgencyAgreementSignature(raw: string | null | undefined): AgencyAgreementSignatureRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AgencyAgreementSignatureRecord>;
    if (!parsed?.dossierId || !parsed.signedAt || !parsed.signatureName) return null;
    return {
      dossierId: Number(parsed.dossierId),
      dossierNumber: String(parsed.dossierNumber ?? ""),
      signedAt: String(parsed.signedAt),
      signatureName: String(parsed.signatureName),
      ipAddress: String(parsed.ipAddress ?? ""),
      empreinteSha: String(parsed.empreinteSha ?? ""),
      pdfUrl: parsed.pdfUrl ?? null,
      candidateEmail: String(parsed.candidateEmail ?? ""),
    };
  } catch {
    return null;
  }
}

export async function loadAgencyAgreementSignature(
  db: Db,
  dossierId: number,
): Promise<AgencyAgreementSignatureRecord | null> {
  const [row] = await db
    .select({ settingValue: agencySettings.settingValue })
    .from(agencySettings)
    .where(eq(agencySettings.settingKey, agencyAgreementSignedKey(dossierId)))
    .limit(1);
  return parseAgencyAgreementSignature(row?.settingValue);
}

export async function loadAgencyAgreementSignaturesByIds(
  db: Db,
  dossierIds: number[],
): Promise<Map<number, AgencyAgreementSignatureRecord>> {
  const map = new Map<number, AgencyAgreementSignatureRecord>();
  if (!dossierIds.length) return map;
  const rows = await db
    .select({ settingKey: agencySettings.settingKey, settingValue: agencySettings.settingValue })
    .from(agencySettings)
    .where(like(agencySettings.settingKey, `${AGENCY_AGREEMENT_SIGNED_KEY_PREFIX}%`))
    .limit(5000);
  const wanted = new Set(dossierIds);
  for (const row of rows) {
    const id = Number(String(row.settingKey).slice(AGENCY_AGREEMENT_SIGNED_KEY_PREFIX.length));
    if (!wanted.has(id)) continue;
    const record = parseAgencyAgreementSignature(row.settingValue);
    if (record) map.set(id, record);
  }
  return map;
}

export async function saveAgencyAgreementSignature(
  db: Db,
  record: AgencyAgreementSignatureRecord,
): Promise<void> {
  const key = agencyAgreementSignedKey(record.dossierId);
  const settingValue = JSON.stringify(record);
  const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
  if (existing) {
    await db.update(agencySettings).set({ settingValue, updatedAt: new Date() }).where(eq(agencySettings.id, existing.id));
  } else {
    await db.insert(agencySettings).values({ settingKey: key, settingValue });
  }
}

/** Fallback : PDF protocole nommé « signe » déjà déposé sur le dossier agence. */
export async function loadAgencyProtocolSignedDocIds(
  db: Db,
  dossierIds: number[],
): Promise<Set<number>> {
  const signed = new Set<number>();
  if (!dossierIds.length) return signed;
  const rows = await db
    .select({
      dossierId: agencyDossierDocuments.dossierId,
      documentName: agencyDossierDocuments.documentName,
      documentType: agencyDossierDocuments.documentType,
      uploadedBy: agencyDossierDocuments.uploadedBy,
    })
    .from(agencyDossierDocuments)
    .where(like(agencyDossierDocuments.documentType, "%protocole%"))
    .limit(5000);
  const wanted = new Set(dossierIds);
  for (const row of rows) {
    if (!wanted.has(row.dossierId)) continue;
    const blob = `${row.documentName} ${row.documentType} ${row.uploadedBy}`.toLowerCase();
    if (blob.includes("protocole") && (blob.includes("signe") || blob.includes("signé") || blob.includes("signature-espace-client"))) {
      signed.add(row.dossierId);
    }
  }
  return signed;
}
