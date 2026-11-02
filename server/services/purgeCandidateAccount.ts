import { and, eq, isNull } from "drizzle-orm";
import {
  agencyDossiers,
  aiEvaluations,
  applications,
  candidateEmailChangeRequests,
  candidateFiles,
  candidateMessages,
  candidatePlacementConsents,
  candidates,
  clientDossiers,
  clientNotifications,
  cvthequeProfiles,
  documentClarificationEvents,
  documentClarificationRequests,
  documentTransmissions,
  flightLoyaltyAccounts,
  flightLoyaltyTransactions,
  partnerNotifications,
  passportScanRequests,
  paymentReceiptApprovals,
  placementCandidateProfiles,
  procedureChecklistProgress,
  savedDestinationComparisons,
} from "../../drizzle/schema";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Données personnelles rattachées au seul compte (par identifiant du compte). Les dossiers, évaluations et pièces comptables ne sont jamais touchés. */
const ACCOUNT_OWNED_TABLES: Array<{ name: string; table: { candidateId: unknown } }> = [
  { name: "candidate_email_change_requests", table: candidateEmailChangeRequests },
  { name: "candidate_files", table: candidateFiles },
  { name: "candidate_messages", table: candidateMessages },
  { name: "document_clarification_events", table: documentClarificationEvents },
  { name: "document_clarification_requests", table: documentClarificationRequests },
  { name: "ai_evaluations", table: aiEvaluations },
  { name: "client_dossiers", table: clientDossiers },
  { name: "passport_scan_requests", table: passportScanRequests },
  { name: "flight_loyalty_transactions", table: flightLoyaltyTransactions },
  { name: "flight_loyalty_accounts", table: flightLoyaltyAccounts },
  { name: "client_notifications", table: clientNotifications },
  { name: "procedure_checklist_progress", table: procedureChecklistProgress },
  { name: "saved_destination_comparisons", table: savedDestinationComparisons },
  { name: "candidate_placement_consents", table: candidatePlacementConsents },
  { name: "placement_candidate_profiles", table: placementCandidateProfiles },
  { name: "cvtheque_profiles", table: cvthequeProfiles },
  { name: "document_transmissions", table: documentTransmissions },
  { name: "partner_notifications", table: partnerNotifications },
];

export type PurgeAssessment =
  | { ok: true; candidateId: number; email: string; fullName: string }
  | { ok: false; code: "not_found" | "not_archived" | "email_mismatch" | "paid_records"; message: string };

/**
 * Un compte ne peut être supprimé définitivement que depuis la corbeille, avec son adresse e-mail saisie à l'identique, et jamais s'il
 * existe un paiement validé à son nom : ces pièces doivent être conservées (obligations comptables) ; il reste alors dans la corbeille.
 */
export async function assessAccountPurge(db: Db, candidateId: number, typedEmail: string): Promise<PurgeAssessment> {
  const [account] = await db.select({ id: candidates.id, email: candidates.email, fullName: candidates.fullName, deletedAt: candidates.deletedAt }).from(candidates).where(eq(candidates.id, candidateId)).limit(1);
  if (!account) return { ok: false, code: "not_found", message: "Compte introuvable (déjà supprimé ?)." };
  if (!account.deletedAt) return { ok: false, code: "not_archived", message: "Placez d'abord le compte dans la corbeille : la suppression définitive n'est possible que depuis la corbeille." };
  if (account.email.trim().toLowerCase() !== typedEmail.trim().toLowerCase()) {
    return { ok: false, code: "email_mismatch", message: "L'adresse e-mail saisie ne correspond pas à celle du compte." };
  }
  const [paidOnline] = await db.select({ id: applications.id }).from(applications).where(and(eq(applications.email, account.email), eq(applications.paymentStatus, "SUCCESS"))).limit(1);
  const [paidAgency] = await db.select({ id: agencyDossiers.id }).from(agencyDossiers).where(and(eq(agencyDossiers.email, account.email), eq(agencyDossiers.initialPaymentStatus, "paid"), isNull(agencyDossiers.deletedAt))).limit(1);
  const [receipt] = await db.select({ id: paymentReceiptApprovals.id }).from(paymentReceiptApprovals).where(eq(paymentReceiptApprovals.candidateEmail, account.email)).limit(1);
  if (paidOnline || paidAgency || receipt) {
    return { ok: false, code: "paid_records", message: "Ce compte a un paiement validé : les pièces comptables sont conservées, le compte reste dans la corbeille." };
  }
  return { ok: true, candidateId: account.id, email: account.email, fullName: account.fullName };
}

const isMissingTable = (error: unknown) => {
  const detail = error instanceof Error ? `${error.message} ${String((error as { cause?: unknown }).cause ?? "")}` : String(error);
  return /ER_NO_SUCH_TABLE|doesn't exist/i.test(detail);
};

/** Supprime les données personnelles du compte puis le compte lui-même (en dernier : en cas d'échec, il reste dans la corbeille et l'opération est rejouable). */
export async function purgeCandidateAccount(db: Db, candidateId: number): Promise<{ clearedTables: string[] }> {
  const clearedTables: string[] = [];
  for (const { name, table } of ACCOUNT_OWNED_TABLES) {
    try {
      await db.delete(table as never).where(eq((table as unknown as { candidateId: never }).candidateId, candidateId));
      clearedTables.push(name);
    } catch (error) {
      if (!isMissingTable(error)) throw error;
    }
  }
  await db.delete(candidates).where(eq(candidates.id, candidateId));
  return { clearedTables };
}
