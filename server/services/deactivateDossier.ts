/**
 * Désactivation d'un dossier : le compte repasse en pré-compte (COMPTE-…), sans rien supprimer, et peut être réactivé.
 *
 * Sert à trois cas : une activation faite sans preuve de paiement, une suppression du compte activé (le compte bascule alors en
 * pré-compte au lieu de disparaître) et l'annulation d'une activation par erreur. L'état précédent est conservé dans
 * agency_settings (clé dossier_deactivation:<id>) pour permettre « Annuler la désactivation ».
 */
import { isActivatedStatus, isPreDossierStatus } from "../../shared/candidateStatus";
import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { agencyDossierHistory, agencyDossiers, agencySettings, candidates } from "../../drizzle/schema";
import { clientNotifications } from "../../drizzle/caseTrackingSchema";
import { accountReference } from "../../shared/caseReference";
import type { getDb } from "../db";
import { getOpeningPaymentEvidence, type OpeningPaymentEvidence } from "./openingPaymentEvidence";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const DEACTIVATION_KEY_PREFIX = "dossier_deactivation:";
/** Statuts d'un compte qui n'est PAS un pré-compte : « evaluation » est une étape d'avant l'ouverture, pas une activation. */
export const ACTIVE_CANDIDATE_STATUSES = ["documents", "traitement", "soumis", "approuve", "refuse"] as const;
const AUTO_ACTIVATE_ACTOR = "system:auto-activate";

type Snapshot = {
  candidateId: number;
  previousStatus: string;
  activeDossierNumber: string | null;
  activeDossierSetAt: string | null;
  agencyDossiers: Array<{ id: number; status: string; initialPaymentStatus: string }>;
  deactivatedAt: string;
  deactivatedBy: string;
  reason: string;
};

export type DeactivationResult = { ok: true; reference: string; touchedDossiers: number } | { ok: false; reason: "introuvable" | "deja_pre_compte" };
export type ReactivationResult =
  | { ok: true; reference: string }
  | { ok: false; reason: "aucune_desactivation" | "deja_actif" | "preuve_manquante" | "compte_introuvable" };

async function saveSnapshot(db: Db, snapshot: Snapshot) {
  const key = `${DEACTIVATION_KEY_PREFIX}${snapshot.candidateId}`;
  const settingValue = JSON.stringify(snapshot);
  const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
  if (existing) await db.update(agencySettings).set({ settingValue, updatedAt: new Date() }).where(eq(agencySettings.id, existing.id));
  else await db.insert(agencySettings).values({ settingKey: key, settingValue });
}

async function readSnapshot(db: Db, candidateId: number): Promise<Snapshot | null> {
  const [row] = await db.select({ settingValue: agencySettings.settingValue }).from(agencySettings).where(eq(agencySettings.settingKey, `${DEACTIVATION_KEY_PREFIX}${candidateId}`)).limit(1);
  if (!row) return null;
  try {
    return JSON.parse(row.settingValue) as Snapshot;
  } catch {
    return null;
  }
}

export async function hasDeactivationSnapshot(db: Db, candidateId: number): Promise<boolean> {
  return (await readSnapshot(db, candidateId)) !== null;
}

/** Repasse le compte en pré-compte. Les dossiers agence liés restent en place mais ne sont plus marqués « payés » sans preuve. */
export async function deactivateCandidateDossier(
  db: Db,
  input: { candidateId: number; actorEmail: string; reason: string; notifyCandidate?: boolean },
): Promise<DeactivationResult> {
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
  if (!candidate) return { ok: false, reason: "introuvable" };
  if (isPreDossierStatus(candidate.dossierStatus)) return { ok: false, reason: "deja_pre_compte" };

  const linked = await db.select({ id: agencyDossiers.id, status: agencyDossiers.status, initialPaymentStatus: agencyDossiers.initialPaymentStatus })
    .from(agencyDossiers)
    .where(and(isNull(agencyDossiers.deletedAt), sql`LOWER(${agencyDossiers.email}) = LOWER(${candidate.email})`));

  await saveSnapshot(db, {
    candidateId: candidate.id,
    previousStatus: candidate.dossierStatus,
    activeDossierNumber: candidate.activeDossierNumber ?? null,
    activeDossierSetAt: candidate.activeDossierSetAt ? new Date(candidate.activeDossierSetAt).toISOString() : null,
    agencyDossiers: linked.map((row) => ({ id: row.id, status: row.status, initialPaymentStatus: row.initialPaymentStatus })),
    deactivatedAt: new Date().toISOString(),
    deactivatedBy: input.actorEmail,
    reason: input.reason.slice(0, 500),
  });

  await db.update(candidates).set({ dossierStatus: "nouveau", activeDossierNumber: null, activeDossierSetAt: null }).where(eq(candidates.id, candidate.id));

  const evidence = await getOpeningPaymentEvidence(db, { id: candidate.id, email: candidate.email });
  for (const dossier of linked) {
    // Sans preuve, le marquage « payé » n'est qu'une affirmation : il retombe en attente. Avec preuve, il reste.
    await db.update(agencyDossiers).set({
      status: "nouveau",
      ...(evidence.ok ? {} : { initialPaymentStatus: "pending" as const }),
    }).where(eq(agencyDossiers.id, dossier.id));
    await db.insert(agencyDossierHistory).values({
      dossierId: dossier.id,
      action: "dossier_deactivated",
      changedBy: input.actorEmail,
      oldValue: JSON.stringify({ status: dossier.status, initialPaymentStatus: dossier.initialPaymentStatus }),
      newValue: JSON.stringify({ candidateStatus: "nouveau" }),
      details: `Dossier désactivé : le compte repasse en pré-compte. Motif : ${input.reason.slice(0, 300)}`,
    });
  }

  if (input.notifyCandidate !== false) {
    try {
      await db.insert(clientNotifications).values({
        candidateId: candidate.id,
        type: "dossier_deactivated",
        title: "Votre dossier est repassé en pré-dossier",
        body: evidence.ok
          ? "Votre dossier a été remis en pré-dossier par votre conseiller. Il vous recontactera pour la suite."
          : "La preuve de paiement des frais d'ouverture n'a pas été retrouvée : votre dossier est repassé en pré-dossier. Envoyez la preuve depuis votre espace ou contactez votre conseiller.",
        actionUrl: "/mon-espace",
        isRead: false,
      });
    } catch {
      // Une notification manquée ne doit jamais empêcher la désactivation.
    }
  }
  return { ok: true, reference: accountReference(candidate.id), touchedDossiers: linked.length };
}

/**
 * Après la suppression (corbeille) d'un dossier : si le compte lié n'a plus aucun dossier agence, il bascule automatiquement en
 * pré-compte au lieu de rester « activé » sans dossier. Renvoie true si un compte a basculé.
 */
export async function revertToPreAccountAfterDossierRemoval(db: Db, input: { email: string; actorEmail: string; reason: string }): Promise<boolean> {
  const email = input.email.trim().toLowerCase();
  if (!email) return false;
  const [candidate] = await db.select({ id: candidates.id, dossierStatus: candidates.dossierStatus }).from(candidates)
    .where(and(isNull(candidates.deletedAt), sql`LOWER(TRIM(${candidates.email})) = ${email}`))
    .limit(1);
  if (!candidate || isPreDossierStatus(candidate.dossierStatus)) return false;
  const [remaining] = await db.select({ id: agencyDossiers.id }).from(agencyDossiers)
    .where(and(isNull(agencyDossiers.deletedAt), sql`LOWER(TRIM(${agencyDossiers.email})) = ${email}`))
    .limit(1);
  if (remaining) return false;
  const result = await deactivateCandidateDossier(db, { candidateId: candidate.id, actorEmail: input.actorEmail, reason: input.reason });
  return result.ok;
}

/** Annule une désactivation : impossible sans preuve de paiement, sinon on rouvrirait la faille. */
export async function reactivateCandidateDossier(db: Db, input: { candidateId: number; actorEmail: string }): Promise<ReactivationResult> {
  const snapshot = await readSnapshot(db, input.candidateId);
  if (!snapshot) return { ok: false, reason: "aucune_desactivation" };
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
  if (!candidate) return { ok: false, reason: "compte_introuvable" };
  if (isActivatedStatus(candidate.dossierStatus)) return { ok: false, reason: "deja_actif" };
  const evidence = await getOpeningPaymentEvidence(db, { id: candidate.id, email: candidate.email });
  if (!evidence.ok) return { ok: false, reason: "preuve_manquante" };

  await db.update(candidates).set({
    dossierStatus: snapshot.previousStatus as (typeof ACTIVE_CANDIDATE_STATUSES)[number],
    activeDossierNumber: snapshot.activeDossierNumber,
    activeDossierSetAt: snapshot.activeDossierSetAt ? new Date(snapshot.activeDossierSetAt) : null,
  }).where(eq(candidates.id, candidate.id));
  for (const dossier of snapshot.agencyDossiers) {
    await db.update(agencyDossiers).set({
      status: dossier.status as "nouveau",
      initialPaymentStatus: dossier.initialPaymentStatus as "paid",
    }).where(eq(agencyDossiers.id, dossier.id));
    await db.insert(agencyDossierHistory).values({
      dossierId: dossier.id,
      action: "dossier_reactivated",
      changedBy: input.actorEmail,
      oldValue: JSON.stringify({ candidateStatus: "nouveau" }),
      newValue: JSON.stringify({ status: dossier.status }),
      details: "Désactivation annulée : le dossier est de nouveau actif (preuve de paiement vérifiée).",
    });
  }
  await db.delete(agencySettings).where(eq(agencySettings.settingKey, `${DEACTIVATION_KEY_PREFIX}${candidate.id}`));
  return { ok: true, reference: snapshot.activeDossierNumber || accountReference(candidate.id) };
}

export type ActivationReviewRow = {
  candidateId: number;
  fullName: string;
  email: string;
  dossierStatus: string;
  activeDossierNumber: string | null;
  activatedAt: string | null;
  evidence: OpeningPaymentEvidence;
  /** Activé par l'automatisme sans paiement : à désactiver sans hésiter. */
  autoActivated: boolean;
  /** Proposé d'office à la désactivation (pas de preuve et statut de simple ouverture). */
  suggested: boolean;
};

async function readActiveCandidates(db: Db) {
  const query = () => db.select({
    id: candidates.id,
    fullName: candidates.fullName,
    email: candidates.email,
    dossierStatus: candidates.dossierStatus,
    activeDossierNumber: candidates.activeDossierNumber,
    activeDossierSetAt: candidates.activeDossierSetAt,
  }).from(candidates)
    .where(and(isNull(candidates.deletedAt), inArray(candidates.dossierStatus, [...ACTIVE_CANDIDATE_STATUSES]), ne(candidates.email, "")))
    .orderBy(desc(candidates.id))
    .limit(2000);

  try {
    return await query();
  } catch (firstError) {
    // Une connexion peut être coupée par l'infrastructure entre deux passages
    // du garde. Laisser le pool reprendre une connexion avant de déclarer le
    // contrôle indisponible ; une seconde erreur reste propagée au journal.
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      return await query();
    } catch {
      throw firstError;
    }
  }
}

/** Comptes activés dont la preuve de paiement est introuvable. Lecture seule : rien n'est modifié. */
export async function scanActivationsWithoutProof(db: Db, limit = 500): Promise<{ scanned: number; rows: ActivationReviewRow[] }> {
  const active = await readActiveCandidates(db);

  const rows: ActivationReviewRow[] = [];
  for (const candidate of active) {
    if (rows.length >= limit) break;
    const evidence = await getOpeningPaymentEvidence(db, { id: candidate.id, email: candidate.email });
    if (evidence.ok) continue;
    const [auto] = await db.select({ id: agencyDossiers.id }).from(agencyDossiers)
      .where(and(isNull(agencyDossiers.deletedAt), sql`LOWER(${agencyDossiers.email}) = LOWER(${candidate.email})`, eq(agencyDossiers.createdByAdmin, AUTO_ACTIVATE_ACTOR)))
      .limit(1);
    rows.push({
      candidateId: candidate.id,
      fullName: candidate.fullName,
      email: candidate.email,
      dossierStatus: candidate.dossierStatus,
      activeDossierNumber: candidate.activeDossierNumber ?? null,
      activatedAt: candidate.activeDossierSetAt ? new Date(candidate.activeDossierSetAt).toISOString() : null,
      evidence,
      autoActivated: Boolean(auto),
      suggested: !evidence.agencyPaidWithoutLog && (candidate.dossierStatus === "documents" || Boolean(auto)),
    });
  }
  return { scanned: active.length, rows };
}
