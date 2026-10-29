/**
 * Activation automatique COMPTE → 3M-AGN quand évaluation + paiement sont OK
 * et que destination / visa sont déjà connus sur le compte.
 */

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import {
  agencyDossierHistory,
  agencyDossiers,
  candidates,
} from "../../drizzle/schema";
import { clientNotifications } from "../../drizzle/caseTrackingSchema";
import { accountReference, agencyDossierReference, referenceChangeSentence } from "../../shared/caseReference";
import { resolveDossierProcedureSelection } from "../../shared/dossierProcedureSelection";
import { sendDossierConfirmationEmail } from "../emailService";
import type { getDb } from "../db";
import { ensureAgencyActiveReference } from "./canonicalizeActiveDossier";
import { seedCountryProcedureChecklist } from "./seedCountryProcedureCase";
import { loadPilotageQueue } from "./pilotageQueueStore";
import { getOpeningPaymentEvidence } from "./openingPaymentEvidence";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const AUTO_ACTIVATE_ACTOR = "system:auto-activate";

export type AutoActivateResult = {
  planned: number;
  activated: number;
  skipped: Array<{ candidateId: number; reason: string }>;
  activatedRefs: string[];
};

function parsePreferredDestination(raw: string | null | undefined): string {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed) && typeof parsed[0] === "string" && parsed[0].trim()) return parsed[0].trim();
  } catch {
    /* ignore */
  }
  return "";
}

/** Active un compte prêt : destination/visa déjà renseignés et reconnus. */
export async function activateReadyPreDossier(
  db: Db,
  candidateId: number,
  options?: { actorEmail?: string | null; dryRun?: boolean },
): Promise<{ ok: boolean; reason?: string; dossierReference?: string; dryRun?: boolean }> {
  const actor = (options?.actorEmail || AUTO_ACTIVATE_ACTOR).trim() || AUTO_ACTIVATE_ACTOR;
  const [candidate] = await db.select().from(candidates).where(and(eq(candidates.id, candidateId), isNull(candidates.deletedAt))).limit(1);
  if (!candidate) return { ok: false, reason: "compte_introuvable" };
  if (candidate.dossierStatus !== "nouveau") return { ok: false, reason: "deja_actif" };
  if (candidate.evaluationDeclarationStatus !== "validated" || !candidate.evaluationReviewedAt) {
    return { ok: false, reason: "evaluation_incomplete" };
  }
  // Jamais d'activation sans preuve de paiement : ni l'automatisme du pilotage, ni une évaluation validée ne suffisent.
  const paymentEvidence = await getOpeningPaymentEvidence(db, { id: candidate.id, email: candidate.email });
  if (!paymentEvidence.ok) return { ok: false, reason: "paiement_non_justifie" };

  const destinationHint = parsePreferredDestination(candidate.preferredDestinations) || String(candidate.destination || "").trim();
  const visaType = String(candidate.visaType || "").trim();
  if (!destinationHint || !visaType) return { ok: false, reason: "destination_ou_visa_manquant" };

  const primaryProcedure = resolveDossierProcedureSelection({ destination: destinationHint, visaType });
  if (!primaryProcedure.recognized || !primaryProcedure.destination) {
    return { ok: false, reason: "destination_non_reconnue" };
  }

  if (options?.dryRun) {
    return { ok: true, dryRun: true, dossierReference: accountReference(candidate.id) };
  }

  const existing = await db
    .select({ id: agencyDossiers.id })
    .from(agencyDossiers)
    .where(and(isNull(agencyDossiers.deletedAt), sql`LOWER(${agencyDossiers.email}) = LOWER(${candidate.email})`))
    .orderBy(desc(agencyDossiers.createdAt))
    .limit(1);

  let agencyDossierId: number;
  const linkedExistingDossier = existing.length > 0;
  if (linkedExistingDossier) {
    agencyDossierId = existing[0].id;
    await db.update(agencyDossiers).set({
      destination: primaryProcedure.destination,
      visaType: primaryProcedure.visaType,
      status: "en_cours",
      initialPaymentStatus: "paid",
      assignedToAdmin: actor,
    }).where(eq(agencyDossiers.id, agencyDossierId));
  } else {
    const inserted = await db.insert(agencyDossiers).values({
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone ?? "Non renseigné",
      dateOfBirth: candidate.dateOfBirth,
      nationality: candidate.nationality,
      destination: primaryProcedure.destination,
      visaType: primaryProcedure.visaType,
      status: "nouveau",
      initialPaymentStatus: "paid",
      createdByAdmin: actor,
      assignedToAdmin: actor,
      adminNotes: "Activation automatique (Vague 2) — évaluation + paiement confirmés.",
      source: "manual_admin",
    });
    agencyDossierId = Number((inserted as any)[0]?.insertId || 0);
    if (!agencyDossierId) return { ok: false, reason: "creation_agence_echouee" };
  }

  await db.update(candidates).set({
    dossierStatus: "documents",
    destination: primaryProcedure.coarseCategory,
    visaType: primaryProcedure.visaType,
    preferredDestinations: JSON.stringify(primaryProcedure.preferredDestinations),
  }).where(eq(candidates.id, candidate.id));

  const previousAccountReference = accountReference(candidate.id);
  const dossierReference = agencyDossierReference(agencyDossierId);

  await db.insert(agencyDossierHistory).values({
    dossierId: agencyDossierId,
    action: "account_linked",
    changedBy: actor,
    oldValue: linkedExistingDossier ? "pré-dossier sans compte" : null,
    newValue: JSON.stringify({ candidateId: candidate.id, email: candidate.email, auto: true }),
    details: "Activation automatique COMPTE → dossier actif après paiement + évaluation",
  });
  await db.insert(agencyDossierHistory).values({
    dossierId: agencyDossierId,
    action: "reference_changed",
    changedBy: actor,
    oldValue: previousAccountReference,
    newValue: dossierReference,
    details: "Référence COMPTE remplacée par 3M-AGN (automatisation Vague 2)",
  });

  try {
    await seedCountryProcedureChecklist(db, {
      source: "agency",
      id: agencyDossierId,
      destination: primaryProcedure.destination,
      visaType: primaryProcedure.visaType,
      actorAdminId: null,
    });
  } catch (error) {
    console.warn("[autoActivatePreDossier] checklist skip", error);
  }

  try {
    await ensureAgencyActiveReference(db, {
      agencyDossierId,
      email: candidate.email,
      adminEmail: actor,
    });
  } catch (error) {
    console.warn("[autoActivatePreDossier] canonicalize skip", error);
  }

  try {
    await db.insert(clientNotifications).values({
      candidateId: candidate.id,
      type: "admin_status_update",
      title: "Votre dossier est activé",
      body: referenceChangeSentence(previousAccountReference, dossierReference),
      actionUrl: "/mon-espace",
      isRead: false,
    });
  } catch (error) {
    console.warn("[autoActivatePreDossier] notification skip", error);
  }

  try {
    await sendDossierConfirmationEmail(
      candidate.email,
      candidate.fullName,
      dossierReference,
      primaryProcedure.destination,
      0,
      previousAccountReference,
    );
  } catch (error) {
    console.warn("[autoActivatePreDossier] email skip", error);
  }

  return { ok: true, dossierReference };
}

export async function runAutoActivateReadyAccounts(
  db: Db,
  options?: { dryRun?: boolean; limit?: number; actorEmail?: string | null },
): Promise<AutoActivateResult> {
  const limit = Math.min(Math.max(options?.limit ?? 40, 1), 100);
  const queue = await loadPilotageQueue(db);
  const ready = queue.items.filter((item) => item.category === "ready_to_activate").slice(0, limit);
  const skipped: AutoActivateResult["skipped"] = [];
  const activatedRefs: string[] = [];
  let activated = 0;

  for (const item of ready) {
    const match = /^account_(\d+)$/.exec(item.openId || "");
    const candidateId = match ? Number(match[1]) : 0;
    if (!Number.isFinite(candidateId) || candidateId <= 0) {
      skipped.push({ candidateId: 0, reason: "id_invalide" });
      continue;
    }
    const result = await activateReadyPreDossier(db, candidateId, {
      dryRun: options?.dryRun,
      actorEmail: options?.actorEmail,
    });
    if (result.ok) {
      if (!options?.dryRun) {
        activated += 1;
        if (result.dossierReference) activatedRefs.push(result.dossierReference);
      } else if (result.dossierReference) {
        activatedRefs.push(`dry-run:${result.dossierReference}`);
      }
    } else {
      skipped.push({ candidateId, reason: result.reason || "refuse" });
    }
  }

  return { planned: ready.length, activated, skipped, activatedRefs };
}
