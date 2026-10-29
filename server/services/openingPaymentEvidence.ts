/**
 * Preuve du paiement des frais d'ouverture : seule base d'une activation de dossier.
 *
 * Sont acceptés, et seulement eux :
 *  - une preuve (photo ou vidéo de la facture) déposée pour ce compte et jointe à la confirmation de l'administrateur ;
 *  - un paiement en ligne réussi ET validé par un administrateur (ou par la vérification CinetPay) ;
 *  - un paiement du pré-dossier agence confirmé dans le journal d'audit des paiements.
 *
 * Une simple référence saisie à la main, ou un dossier agence marqué « payé » sans journal, ne suffit pas.
 */
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { agencyDossiers, agencySettings, applications, paymentAuditLogs } from "../../drizzle/schema";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Même clé que la confirmation du paiement d'un compte qui n'a pas encore de dossier (agency_settings). */
export const OPENING_PAYMENT_KEY_PREFIX = "opening_payment:";

export type OpeningPaymentEvidenceSource = "proof_file" | "online_validated" | "agency_confirmed";

export type OpeningPaymentEvidence = {
  ok: boolean;
  source: OpeningPaymentEvidenceSource | null;
  /** Dossier agence marqué « payé » mais sans confirmation tracée : à contrôler par un humain, jamais une preuve. */
  agencyPaidWithoutLog: boolean;
};

export const NO_EVIDENCE: OpeningPaymentEvidence = { ok: false, source: null, agencyPaidWithoutLog: false };

export async function getOpeningPaymentEvidence(db: Db, candidate: { id: number; email: string }): Promise<OpeningPaymentEvidence> {
  const [setting] = await db.select({ settingValue: agencySettings.settingValue }).from(agencySettings)
    .where(eq(agencySettings.settingKey, `${OPENING_PAYMENT_KEY_PREFIX}${candidate.id}`))
    .limit(1);
  if (setting) {
    try {
      const record = JSON.parse(setting.settingValue) as { proofFileUrl?: string | null };
      if (typeof record.proofFileUrl === "string" && record.proofFileUrl.trim()) return { ok: true, source: "proof_file", agencyPaidWithoutLog: false };
    } catch {
      // Enregistrement illisible : pas une preuve.
    }
  }

  const [application] = await db.select({
    paymentStatus: applications.paymentStatus,
    paymentValidatedAt: applications.paymentValidatedAt,
    paymentValidatedBy: applications.paymentValidatedBy,
  }).from(applications)
    .where(and(eq(applications.candidateId, candidate.id), isNull(applications.deletedAt)))
    .orderBy(desc(applications.createdAt))
    .limit(1);
  if (application?.paymentStatus === "SUCCESS" && Boolean(application.paymentValidatedAt) && Boolean(application.paymentValidatedBy?.trim())) {
    return { ok: true, source: "online_validated", agencyPaidWithoutLog: false };
  }

  const [paidAgencyDossier] = await db.select({ id: agencyDossiers.id, email: agencyDossiers.email }).from(agencyDossiers)
    .where(and(isNull(agencyDossiers.deletedAt), sql`LOWER(${agencyDossiers.email}) = LOWER(${candidate.email})`, eq(agencyDossiers.initialPaymentStatus, "paid")))
    .orderBy(desc(agencyDossiers.createdAt))
    .limit(1);
  if (!paidAgencyDossier) return NO_EVIDENCE;
  const [confirmedAudit] = await db.select({ id: paymentAuditLogs.id }).from(paymentAuditLogs)
    .where(and(eq(paymentAuditLogs.paymentId, paidAgencyDossier.id), eq(paymentAuditLogs.candidateEmail, paidAgencyDossier.email), eq(paymentAuditLogs.action, "confirmed")))
    .orderBy(desc(paymentAuditLogs.createdAt))
    .limit(1);
  if (confirmedAudit) return { ok: true, source: "agency_confirmed", agencyPaidWithoutLog: false };
  return { ok: false, source: null, agencyPaidWithoutLog: true };
}

export const PAYMENT_PROOF_REQUIRED_MESSAGE = "Aucune preuve de paiement n'est enregistrée pour ce compte : joignez la photo ou la vidéo de la facture avant d'ouvrir le dossier.";
