/**
 * Auto-avance Kanban sûre : uniquement PUBLISHED → DOCUMENTS_CHECK
 * quand paiement + protocole + bilan confirmé sont déjà vrais.
 * Jamais SUBMITTED / APPROVED (employeur / checklist restent manuels).
 */

import { and, eq, inArray, isNull } from "drizzle-orm";
import { adminActivityLogs, agencyDossiers, applications } from "../../drizzle/schema";
import { evaluateAdminStageTransition } from "../../shared/transitionGuards";
import { detectAdminProcedureKind } from "../../shared/adminDynamicPilotage";
import { assertApplicationCanEnterStatus } from "../utils/applicationGates";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const SAFE_ADVANCE_ACTOR = "system:kanban-auto";

export type SafeAdvanceResult = {
  planned: number;
  advanced: number;
  skipped: Array<{ id: string; reason: string }>;
  advancedIds: string[];
};

export async function runSafeKanbanAdvance(
  db: Db,
  options?: { dryRun?: boolean; limit?: number; actorEmail?: string | null },
): Promise<SafeAdvanceResult> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 120);
  const actor = (options?.actorEmail || SAFE_ADVANCE_ACTOR).trim() || SAFE_ADVANCE_ACTOR;
  const skipped: SafeAdvanceResult["skipped"] = [];
  const advancedIds: string[] = [];
  let advanced = 0;
  let planned = 0;

  const onlinePool = await db
    .select()
    .from(applications)
    .where(
      and(
        isNull(applications.deletedAt),
        inArray(applications.dossierStatus, ["bilan_envoye", "en_attente_paiement"]),
        eq(applications.paymentStatus, "SUCCESS"),
        eq(applications.evaluationDeliveryStatus, "sent"),
      ),
    )
    .limit(limit);

  for (const app of onlinePool) {
    const id = `online_${app.id}`;
    if (!app.paymentValidatedAt || !app.paymentValidatedBy?.trim()) {
      skipped.push({ id, reason: "paiement_non_valide" });
      continue;
    }
    if (!app.agreementSigned) {
      skipped.push({ id, reason: "protocole_non_signe" });
      continue;
    }
    if (!app.evaluationClientConfirmedAt) {
      skipped.push({ id, reason: "bilan_non_confirme" });
      continue;
    }

    try {
      assertApplicationCanEnterStatus({
        ...app,
        hasCv: Boolean(app.cvUrl?.trim()),
      }, "en_attente_documents");
    } catch (error) {
      skipped.push({ id, reason: error instanceof Error ? error.message : "gate_refuse" });
      continue;
    }

    const procedureKind = detectAdminProcedureKind(app.visaType, app.visaType);
    const guard = evaluateAdminStageTransition({
      targetStage: "DOCUMENTS_CHECK",
      paymentConfirmed: true,
      protocolSigned: true,
      evaluationDelivered: true,
      evaluationClientConfirmed: true,
      checklistPercent: 0,
      pendingRequiredDocuments: 0,
      procedureKind,
    });
    if (guard.ok === false) {
      skipped.push({ id, reason: guard.message });
      continue;
    }

    planned += 1;
    if (options?.dryRun) continue;

    await db.update(applications).set({
      dossierStatus: "en_attente_documents",
      lastStatusUpdateAt: new Date(),
      lastStatusUpdatedBy: actor,
    }).where(eq(applications.id, app.id));

    try {
      await db.insert(adminActivityLogs).values({
        adminEmail: actor,
        action: "status_changed",
        evaluationType: "candidate_workflow",
        evaluationId: String(app.id),
        oldStatus: "PUBLISHED",
        newStatus: "DOCUMENTS_CHECK",
        details: JSON.stringify({ source: "online", dossierNumber: app.dossierNumber, autoAdvance: true }),
      });
    } catch {
      /* audit non bloquant */
    }

    advanced += 1;
    advancedIds.push(id);
  }

  const agencyPool = await db
    .select()
    .from(agencyDossiers)
    .where(
      and(
        isNull(agencyDossiers.deletedAt),
        eq(agencyDossiers.status, "en_cours"),
        eq(agencyDossiers.initialPaymentStatus, "paid"),
      ),
    )
    .limit(limit);

  for (const dossier of agencyPool) {
    const id = `agency_${dossier.id}`;
    if (!dossier.evaluationValidatedAt) {
      skipped.push({ id, reason: "evaluation_agence_non_validee" });
      continue;
    }

    const procedureKind = detectAdminProcedureKind(dossier.visaType, dossier.visaType);
    const guard = evaluateAdminStageTransition({
      targetStage: "DOCUMENTS_CHECK",
      paymentConfirmed: true,
      protocolSigned: true,
      evaluationDelivered: true,
      evaluationClientConfirmed: true,
      checklistPercent: 100,
      pendingRequiredDocuments: 0,
      procedureKind,
    });
    if (guard.ok === false) {
      skipped.push({ id, reason: guard.message });
      continue;
    }

    planned += 1;
    if (options?.dryRun) continue;

    await db.update(agencyDossiers).set({
      status: "documents_requis",
      lastStatusChangeAt: new Date(),
      lastStatusChangeBy: actor,
    }).where(eq(agencyDossiers.id, dossier.id));

    try {
      await db.insert(adminActivityLogs).values({
        adminEmail: actor,
        action: "status_changed",
        evaluationType: "candidate_workflow",
        evaluationId: String(dossier.id),
        oldStatus: "PUBLISHED",
        newStatus: "DOCUMENTS_CHECK",
        details: JSON.stringify({ source: "agency", dossierNumber: `3M-AGN-${String(dossier.id).padStart(4, "0")}`, autoAdvance: true }),
      });
    } catch {
      /* audit non bloquant */
    }

    advanced += 1;
    advancedIds.push(id);
  }

  return { planned, advanced: options?.dryRun ? 0 : advanced, skipped, advancedIds };
}
