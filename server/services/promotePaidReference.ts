/**
 * Après paiement des frais d'ouverture, la référence « COMPTE-… » est REMPLACÉE de façon définitive par le numéro de dossier actif
 * « 3M-AAAA-NNNNN » (code généré) : sur la demande, sur toutes les lignes qui la citent (bilans, transactions, reçus, preuves de
 * paiement…) et sur le compte (`activeDossierNumber`). Plus aucun écran, e-mail ni document ne montre ensuite « COMPTE ».
 *
 * L'opération est idempotente : une demande déjà numérotée « 3M- » n'est pas touchée. Elle ne s'applique qu'à une demande dont le
 * paiement est confirmé (statut SUCCESS) ; jamais à un compte non payé. Elle doit s'exécuter AVANT l'envoi du reçu et du protocole,
 * pour que ces documents portent le numéro 3M-….
 */

import { and, eq, isNotNull, isNull, like, or } from "drizzle-orm";
import { applications, candidates, paymentAuditLogs } from "../../drizzle/schema";
import { nextOnlineDossierNumber, isProvisionalReference } from "../../shared/accountKeys";
import { isActiveDossierReference } from "../../shared/caseReference";
import { parseEvalAgencyShellId } from "../../shared/evalAgencyShell";
import type { getDb } from "../db";
import { renameApplicationReferenceRows } from "./normalizeAccountReferences";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type PromoteResult =
  | { promoted: true; from: string; to: string }
  | { promoted: false; reason: "not_found" | "not_paid" | "already_active" | "agency_mirror" | "no_free_number"; reference?: string };

/** Prochain numéro libre « 3M-AAAA-NNNNN » (numéro de la demande, ou suite libre si déjà pris). */
export function pickActiveNumber(input: { year: number; applicationId: number; taken: Iterable<string> }): string {
  const taken = new Set(Array.from(input.taken, (value) => String(value).toUpperCase()));
  const byId = `3M-${input.year}-${String(Math.trunc(input.applicationId)).padStart(5, "0")}`;
  return taken.has(byId.toUpperCase()) ? nextOnlineDossierNumber(input.year, taken) : byId;
}

export async function promoteOnlineApplicationToActiveNumber(db: Db, applicationId: number, actor: string): Promise<PromoteResult> {
  const [app] = await db
    .select({ id: applications.id, dossierNumber: applications.dossierNumber, candidateId: applications.candidateId, email: applications.email, paymentStatus: applications.paymentStatus, paymentValidatedAt: applications.paymentValidatedAt })
    .from(applications)
    .where(and(eq(applications.id, applicationId), isNull(applications.deletedAt)))
    .limit(1);
  if (!app) return { promoted: false, reason: "not_found" };
  // Payé ET validé (même règle que l'affichage) : un paiement non validé reste un compte.
  if (app.paymentStatus !== "SUCCESS" || !app.paymentValidatedAt) return { promoted: false, reason: "not_paid", reference: app.dossierNumber };

  // Miroir d'un dossier agence (« EVAL-AG-… ») : c'est le numéro 3M-AGN du dossier agence qui s'applique (traité ailleurs).
  if (parseEvalAgencyShellId(app.dossierNumber) != null) return { promoted: false, reason: "agency_mirror", reference: app.dossierNumber };

  if (!isProvisionalReference(app.dossierNumber)) {
    // Déjà numérotée « 3M- » : on s'assure seulement que le compte porte ce numéro.
    if (app.candidateId && isActiveDossierReference(app.dossierNumber)) {
      await db.update(candidates).set({ activeDossierNumber: app.dossierNumber }).where(and(eq(candidates.id, app.candidateId), isNull(candidates.deletedAt))).catch(() => undefined);
    }
    return { promoted: false, reason: "already_active", reference: app.dossierNumber };
  }

  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = await db.select({ value: applications.dossierNumber }).from(applications).where(or(like(applications.dossierNumber, `3M-${year}-%`), like(applications.dossierNumber, "COMPTE-%")));
    const to = pickActiveNumber({ year, applicationId: app.id, taken: taken.map((row) => row.value) });
    try {
      await db.transaction(async (tx) => {
        await renameApplicationReferenceRows(tx, { applicationId: app.id, from: app.dossierNumber, to, outcome: "active" });
        if (app.candidateId) await tx.update(candidates).set({ activeDossierNumber: to, activeDossierSetAt: new Date() }).where(and(eq(candidates.id, app.candidateId), isNull(candidates.deletedAt)));
      });
      await db.insert(paymentAuditLogs).values({
        adminName: actor.slice(0, 255),
        adminEmail: actor.slice(0, 255),
        action: "reference_promoted",
        paymentId: app.id,
        candidateEmail: app.email,
        amount: "0",
        details: `Référence ${app.dossierNumber} remplacée par ${to} après paiement des frais d'ouverture.`,
      }).catch(() => undefined);
      return { promoted: true, from: app.dossierNumber, to };
    } catch (error) {
      // Numéro pris entre-temps (clé unique) : on recalcule ; toute autre erreur remonte.
      if (!/duplicate|unique|ER_DUP_ENTRY/i.test(error instanceof Error ? error.message : String(error))) throw error;
    }
  }
  return { promoted: false, reason: "no_free_number", reference: app.dossierNumber };
}

/** Rattrapage : demandes DÉJÀ payées restées sur « COMPTE-… ». Sans `apply`, liste seulement (aperçu). */
export async function promotePaidAccountKeys(db: Db, input: { apply: boolean; actor: string; limit?: number }): Promise<{ found: number; promoted: number; items: Array<{ applicationId: number; from: string; to?: string }> }> {
  const rows = await db
    .select({ id: applications.id, dossierNumber: applications.dossierNumber })
    .from(applications)
    .where(and(eq(applications.paymentStatus, "SUCCESS"), isNotNull(applications.paymentValidatedAt), isNull(applications.deletedAt), like(applications.dossierNumber, "COMPTE-%")))
    .limit(Math.min(Math.max(input.limit ?? 200, 1), 1000));
  const items: Array<{ applicationId: number; from: string; to?: string }> = [];
  let promoted = 0;
  for (const row of rows) {
    if (!input.apply) { items.push({ applicationId: row.id, from: row.dossierNumber }); continue; }
    const result = await promoteOnlineApplicationToActiveNumber(db, row.id, input.actor);
    if (result.promoted) { promoted += 1; items.push({ applicationId: row.id, from: result.from, to: result.to }); }
    else items.push({ applicationId: row.id, from: row.dossierNumber });
  }
  return { found: rows.length, promoted, items };
}
