import { and, eq, isNull, like, or, sql } from "drizzle-orm";
import { agencyDossiers, applications, bilans, candidateAccessRecoveryRequests, candidateFiles, candidates, evaluationComments, paymentReceiptApprovals, transactions } from "../../drizzle/schema";
import { cases } from "../../drizzle/caseTrackingSchema";
import { planReferenceNormalization, type NormalizationPlanItem } from "../../shared/accountKeys";
import { parseEvalAgencyShellId } from "../../shared/evalAgencyShell";
import { proofKey } from "../../shared/paymentProof";
import { purgeEvalAgencyShell } from "./canonicalizeActiveDossier";

type Db = NonNullable<Awaited<ReturnType<typeof import("../db").getDb>>>;

export type NormalizationReport = {
  applied: boolean;
  scanned: number;
  toAccount: number;
  toActive: number;
  items: Array<NormalizationPlanItem & { fullName: string }>;
  /** Dossiers en ligne affichés « 3M- » alors que les frais d'ouverture ne sont pas payés et validés : signalés, jamais modifiés ici. */
  unpaidWithActiveNumber: Array<{ applicationId: number; dossierNumber: string; fullName: string }>;
  /** Lignes hors « applications » (comptes, dossiers opérationnels) nettoyées par le balayage final. */
  sweep: { candidatesCleared: number; casesRenamed: number };
  /** Nombre de lignes encore en « EVAL » après l'opération (0 attendu après application). */
  remainingEval: number;
};

const LEGACY_PATTERNS = ["EVAL-%", "3M-EVAL-%"] as const;

/**
 * Remet toutes les références « EVAL-… » dans la règle de l'agence :
 *  - frais d'ouverture NON payés (ou non validés) : le dossier reste un COMPTE (« COMPTE-00012 ») ;
 *  - frais payés ET validés : numéro « 3M-AAAA-NNNNN ».
 * Sans `apply`, rien n'est écrit : c'est l'aperçu. Avec `apply`, chaque renommage met à jour la demande ET toutes les lignes qui la
 * citent par son numéro (bilans, commentaires, transactions, approbations de reçu, preuves de paiement, compte actif).
 */
export async function normalizeAccountReferences(db: Db, input: { apply: boolean; adminEmail?: string | null; limit?: number }): Promise<NormalizationReport> {
  const limit = Math.min(Math.max(input.limit ?? 1000, 1), 5000);
  const actor = (input.adminEmail || "system").slice(0, 320);

  const legacy = await db
    .select({ id: applications.id, dossierNumber: applications.dossierNumber, candidateId: applications.candidateId, email: applications.email, fullName: applications.fullName, paymentStatus: applications.paymentStatus, paymentValidatedAt: applications.paymentValidatedAt })
    .from(applications)
    .where(or(...LEGACY_PATTERNS.map((pattern) => like(applications.dossierNumber, pattern))))
    .limit(limit);

  // Un miroir de dossier agence PAYÉ est d'abord absorbé (mis en corbeille, dossier actif 3M-AGN) ; le renommage qui suit ne fait que
  // retirer « EVAL » de sa clé.
  if (input.apply) {
    for (const row of legacy) {
      const agencyId = parseEvalAgencyShellId(row.dossierNumber);
      if (agencyId == null) continue;
      const [agency] = await db.select({ initialPaymentStatus: agencyDossiers.initialPaymentStatus }).from(agencyDossiers).where(and(eq(agencyDossiers.id, agencyId), isNull(agencyDossiers.deletedAt))).limit(1);
      if (agency?.initialPaymentStatus === "paid") await purgeEvalAgencyShell(db, { agencyDossierId: agencyId, adminEmail: actor, candidateEmail: row.email });
    }
  }

  const takenRows = await db.select({ value: applications.dossierNumber }).from(applications).where(or(like(applications.dossierNumber, "COMPTE-%"), like(applications.dossierNumber, "3M-%")));
  const year = new Date().getFullYear();
  const plan = planReferenceNormalization(
    legacy.map((row) => ({
      applicationId: row.id,
      dossierNumber: row.dossierNumber,
      candidateId: row.candidateId,
      paidAndValidated: row.paymentStatus === "SUCCESS" && Boolean(row.paymentValidatedAt),
      agencyMirrorOf: parseEvalAgencyShellId(row.dossierNumber),
    })),
    { takenKeys: takenRows.map((row) => row.value), existingActiveNumbers: takenRows.map((row) => row.value).filter((value) => value.toUpperCase().startsWith("3M-")), year },
  );
  const nameOf = new Map(legacy.map((row) => [row.id, row.fullName] as const));

  let sweep = { candidatesCleared: 0, casesRenamed: 0 };
  if (input.apply) {
    for (const item of plan) {
      await db.transaction(async (tx) => {
        await tx.update(applications).set({ dossierNumber: item.to, updatedAt: new Date() }).where(eq(applications.id, item.applicationId));
        await tx.update(bilans).set({ dossierNumber: item.to }).where(eq(bilans.dossierNumber, item.from));
        await tx.update(evaluationComments).set({ dossierNumber: item.to }).where(eq(evaluationComments.dossierNumber, item.from));
        await tx.update(transactions).set({ dossierNumber: item.to }).where(eq(transactions.dossierNumber, item.from));
        await tx.update(paymentReceiptApprovals).set({ dossierNumber: item.to }).where(eq(paymentReceiptApprovals.dossierNumber, item.from));
        await tx.update(candidateAccessRecoveryRequests).set({ dossierNumber: item.to }).where(eq(candidateAccessRecoveryRequests.dossierNumber, item.from));
        // Compte : « 3M- » seulement après paiement ; avant, aucun numéro actif (la référence de compte s'affiche d'elle-même).
        await tx.update(candidates).set({ activeDossierNumber: item.outcome === "active" ? item.to : null }).where(eq(candidates.activeDossierNumber, item.from));
        // Le nom du fichier de preuve de paiement porte la référence : on le suit pour que la preuve reste retrouvée à côté du dossier.
        const oldProof = `${proofKey(item.from)}--`;
        await tx.update(candidateFiles).set({ fileName: sql`CONCAT(${`${proofKey(item.to)}--`}, SUBSTRING(${candidateFiles.fileName}, ${oldProof.length + 1}))` }).where(like(candidateFiles.fileName, `${oldProof.replace(/[%_\\]/g, "\\$&")}%`));
        if (item.outcome === "active") await tx.update(cases).set({ caseNumber: item.to, updatedAt: new Date() }).where(eq(cases.legacyApplicationId, item.applicationId));
      });
    }

    // Balayage final : comptes restés sur un numéro « EVAL » sans demande correspondante, et dossiers opérationnels numérotés « EVAL ».
    for (const pattern of LEGACY_PATTERNS) {
      const cleared = await db.update(candidates).set({ activeDossierNumber: null }).where(like(candidates.activeDossierNumber, pattern));
      sweep.candidatesCleared += Number((cleared as unknown as Array<{ affectedRows?: number }>)[0]?.affectedRows ?? 0);
    }
    const caseRows = await db.select({ id: cases.id }).from(cases).where(or(...LEGACY_PATTERNS.map((pattern) => like(cases.caseNumber, pattern))));
    for (const row of caseRows) {
      await db.update(cases).set({ caseNumber: `COMPTE-C${row.id}`, updatedAt: new Date() }).where(eq(cases.id, row.id));
      sweep.casesRenamed += 1;
    }
  }

  const [remaining] = await db.select({ total: sql<number>`count(*)` }).from(applications).where(or(...LEGACY_PATTERNS.map((pattern) => like(applications.dossierNumber, pattern))));

  const unpaidActive = await db
    .select({ id: applications.id, dossierNumber: applications.dossierNumber, fullName: applications.fullName })
    .from(applications)
    .where(and(like(applications.dossierNumber, "3M-%"), sql`${applications.dossierNumber} NOT LIKE '3M-AGN-%'`, isNull(applications.deletedAt), sql`NOT (${applications.paymentStatus} = 'SUCCESS' AND ${applications.paymentValidatedAt} IS NOT NULL)`))
    .limit(100);

  return {
    applied: input.apply,
    scanned: legacy.length,
    toAccount: plan.filter((item) => item.outcome === "account").length,
    toActive: plan.filter((item) => item.outcome === "active").length,
    items: plan.map((item) => ({ ...item, fullName: nameOf.get(item.applicationId) ?? "" })),
    unpaidWithActiveNumber: unpaidActive.map((row) => ({ applicationId: row.id, dossierNumber: row.dossierNumber, fullName: row.fullName })),
    sweep,
    remainingEval: Number(remaining?.total ?? 0),
  };
}
