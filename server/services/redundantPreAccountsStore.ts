import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { adminActivityLogs, agencyDossiers, applications, candidates } from "../../drizzle/schema";
import { agencyDossierReference } from "../../shared/caseReference";
import { findRedundantPreAccounts, type ActiveDossierRow, type RedundantPreAccount } from "./redundantPreAccounts";

type Db = NonNullable<Awaited<ReturnType<typeof import("../db").getDb>>>;

const ROW_LIMIT = 5000;
/** Un dossier en ligne est « actif » une fois son paiement confirmé et tant qu'il n'est ni au stade d'évaluation ni refusé. */
const ACTIVE_ONLINE_STATUSES = ["paye", "en_attente_documents", "documents_recus", "soumis_agences", "en_cours_recrutement", "contrat_obtenu", "visa_approuve"] as const;

/** Charge les lignes utiles et applique les règles pures : aucune écriture. */
export async function loadRedundantPreAccounts(db: Db): Promise<RedundantPreAccount[]> {
  const [accounts, agencyPre, activeAgency, activeOnline, allAgencyEmails, allOnlineEmails] = await Promise.all([
    db.select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email, phone: candidates.phone, createdAt: candidates.createdAt }).from(candidates).where(and(isNull(candidates.deletedAt), eq(candidates.dossierStatus, "nouveau"))).limit(ROW_LIMIT),
    db.select({ id: agencyDossiers.id, fullName: agencyDossiers.fullName, email: agencyDossiers.email, phone: agencyDossiers.phone, createdAt: agencyDossiers.createdAt }).from(agencyDossiers).where(and(isNull(agencyDossiers.deletedAt), eq(agencyDossiers.status, "nouveau"))).limit(ROW_LIMIT),
    db.select({ id: agencyDossiers.id, fullName: agencyDossiers.fullName, email: agencyDossiers.email, phone: agencyDossiers.phone, status: agencyDossiers.status }).from(agencyDossiers).where(and(isNull(agencyDossiers.deletedAt), ne(agencyDossiers.status, "nouveau"))).limit(ROW_LIMIT),
    db.select({ id: applications.id, dossierNumber: applications.dossierNumber, fullName: applications.fullName, email: applications.email, phone: applications.whatsappNumber, status: applications.dossierStatus }).from(applications).where(and(isNull(applications.deletedAt), eq(applications.paymentStatus, "SUCCESS"), inArray(applications.dossierStatus, [...ACTIVE_ONLINE_STATUSES]))).limit(ROW_LIMIT),
    db.select({ email: agencyDossiers.email }).from(agencyDossiers).where(isNull(agencyDossiers.deletedAt)).limit(ROW_LIMIT * 2),
    db.select({ email: applications.email }).from(applications).where(isNull(applications.deletedAt)).limit(ROW_LIMIT * 2),
  ]);
  const activeDossiers: ActiveDossierRow[] = [
    ...activeAgency.map((row) => ({ source: "agency" as const, id: row.id, reference: agencyDossierReference(row.id), fullName: row.fullName, email: row.email, phone: row.phone, status: row.status })),
    ...activeOnline.map((row) => ({ source: "online" as const, id: row.id, reference: row.dossierNumber, fullName: row.fullName, email: row.email, phone: row.phone, status: row.status })),
  ];
  return findRedundantPreAccounts({
    accounts,
    agencyPreDossiers: agencyPre,
    activeDossiers,
    accountEmailsWithOwnDossier: [...allAgencyEmails.map((row) => row.email), ...allOnlineEmails.map((row) => row.email)],
  });
}

export type ArchiveRequestItem = { kind: "agency_pre_dossier" | "account"; id: number };

/**
 * Met en corbeille RÉVERSIBLE les pré-comptes demandés. Les éléments sont revérifiés côté serveur : un identifiant qui n'est pas
 * (ou plus) un pré-compte redondant est ignoré et signalé, jamais archivé.
 */
export async function archiveRedundantPreAccounts(db: Db, input: { items: ArchiveRequestItem[]; adminEmail: string }) {
  const current = await loadRedundantPreAccounts(db);
  const byKey = new Map(current.map((item) => [`${item.kind}:${item.id}`, item]));
  const archived: RedundantPreAccount[] = [];
  const skipped: ArchiveRequestItem[] = [];
  for (const requested of input.items) {
    const found = byKey.get(`${requested.kind}:${requested.id}`);
    if (!found) {
      skipped.push(requested);
      continue;
    }
    const reason = `Pré-compte redondant : ${found.reason}`.slice(0, 500);
    const now = new Date();
    if (found.kind === "agency_pre_dossier") {
      await db.update(agencyDossiers).set({ deletedAt: now, deletedBy: input.adminEmail, deletionReason: reason }).where(and(eq(agencyDossiers.id, found.id), isNull(agencyDossiers.deletedAt)));
    } else {
      await db.update(candidates).set({ deletedAt: now, deletedBy: input.adminEmail, deletionReason: reason }).where(and(eq(candidates.id, found.id), isNull(candidates.deletedAt)));
    }
    await db.insert(adminActivityLogs).values({
      adminEmail: input.adminEmail,
      action: "status_changed",
      // L'énumération des actions du journal est fermée (pas de migration) : le type d'événement est porté par evaluationType.
      evaluationType: `redundant_pre_account_archived:${found.kind}`,
      evaluationId: String(found.id),
      oldStatus: "nouveau",
      newStatus: "corbeille",
      details: JSON.stringify({ reference: found.reference, activeDossierReference: found.activeDossierReference, confidence: found.confidence, reason: found.reason }),
    });
    archived.push(found);
  }
  return { archived, skipped };
}
