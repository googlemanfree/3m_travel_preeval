import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull, like, or } from "drizzle-orm";
import { z } from "zod";
import { adminNotifications, candidates } from "../../drizzle/schema";
import { sensitiveActionRequests } from "../../drizzle/remoteSupportSchema";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { deactivateCandidateDossier, hasDeactivationSnapshot, reactivateCandidateDossier, scanActivationsWithoutProof, ACTIVE_CANDIDATE_STATUSES } from "../services/deactivateDossier";
import { getActivationGuardStatus } from "../services/activationGuard";
import { getOpeningPaymentEvidence } from "../services/openingPaymentEvidence";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { adminLabel } from "../services/partnerProfiles";
import { isSuperAdminEmail, requireSuperAdminSession, requireValidAdminSession } from "./adminAuth";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return db;
}

const session = z.string().min(1).max(512);
const reason = z.string().trim().min(5, "Indiquez le motif (5 caractères au moins).").max(500);

const REACTIVATION_MESSAGES = {
  aucune_desactivation: "Aucune désactivation à annuler pour ce compte.",
  deja_actif: "Ce dossier est déjà actif.",
  preuve_manquante: "Impossible de réactiver : aucune preuve de paiement n'est enregistrée. Confirmez d'abord le paiement avec la preuve jointe.",
  compte_introuvable: "Compte candidat introuvable.",
} as const;

/**
 * Activations et retours en arrière : repérer les dossiers activés sans preuve de paiement, les désactiver (le compte repasse en
 * pré-compte, rien n'est supprimé) et annuler une désactivation si la preuve existe.
 */
export const activationSafetyRouter = router({
  /** État agrégé du contrôle permanent, sans exposer SQL, secrets ou données candidat. */
  status: publicProcedure.input(z.object({ sessionToken: session })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    return getActivationGuardStatus();
  }),

  /** Lecture seule. */
  scan: publicProcedure.input(z.object({ sessionToken: session })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const { scanned, rows } = await scanActivationsWithoutProof(db);
    return { scanned, rows };
  }),

  /** Cherche un compte activé à désactiver à la main (nom ou e-mail). */
  searchActive: publicProcedure.input(z.object({ sessionToken: session, search: z.string().trim().min(2).max(120) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const needle = `%${input.search.replace(/[%_]/g, "")}%`;
    const rows = await db.select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email, dossierStatus: candidates.dossierStatus, activeDossierNumber: candidates.activeDossierNumber })
      .from(candidates)
      .where(and(isNull(candidates.deletedAt), inArray(candidates.dossierStatus, [...ACTIVE_CANDIDATE_STATUSES]), or(like(candidates.fullName, needle), like(candidates.email, needle))))
      .orderBy(desc(candidates.id))
      .limit(20);
    const result = [];
    for (const row of rows) {
      const evidence = await getOpeningPaymentEvidence(db, { id: row.id, email: row.email });
      result.push({ ...row, evidenceOk: evidence.ok, evidenceSource: evidence.source, canUndo: await hasDeactivationSnapshot(db, row.id) });
    }
    return result;
  }),

  deactivate: publicProcedure.input(z.object({ sessionToken: session, candidateId: z.number().int().positive(), reason })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    // Double validation : seul le super administrateur désactive directement ; un autre administrateur dépose une demande qu'il approuve.
    if (!isSuperAdminEmail(admin.email)) {
      const [target] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
      const [open] = await db.select({ id: sensitiveActionRequests.id }).from(sensitiveActionRequests).where(and(eq(sensitiveActionRequests.candidateId, target.id), eq(sensitiveActionRequests.status, "pending"))).limit(1);
      if (!open) {
        await db.insert(sensitiveActionRequests).values({ action: "deactivate", candidateId: target.id, reason: input.reason, requestedByAdminId: admin.id, requestedByLabel: adminLabel(admin) });
        try {
          await db.insert(adminNotifications).values({ type: "new_contact_message", title: "Désactivation de dossier à valider", message: `${adminLabel(admin)} — COMPTE-${String(target.id).padStart(5, "0")} : ${input.reason}`.slice(0, 1000), relatedId: `sensitive_request:${target.id}`, targetAdminType: "accompagnement" });
        } catch {
          // Notification manquée : la demande reste visible dans l'onglet.
        }
      }
      await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: "dossier.deactivation_requested", resourceType: "candidate", resourceId: input.candidateId, details: input.reason.slice(0, 300) });
      return { ok: true as const, pending: true as const, reference: `COMPTE-${String(target.id).padStart(5, "0")}` };
    }
    const result = await deactivateCandidateDossier(db, { candidateId: input.candidateId, actorEmail: admin.email ?? `admin #${admin.id}`, reason: input.reason });
    if (result.ok === false) {
      throw new TRPCError({ code: result.reason === "introuvable" ? "NOT_FOUND" : "CONFLICT", message: result.reason === "introuvable" ? "Compte candidat introuvable." : "Ce compte est déjà un pré-compte." });
    }
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: admin.email ?? `admin #${admin.id}`, action: "dossier.deactivated", resourceType: "candidate", resourceId: input.candidateId, details: input.reason.slice(0, 300) });
    return { ok: true as const, pending: false as const, reference: result.reference };
  }),

  /** Demandes de désactivation en attente (et les dernières décisions) ; `isSuper` indique si l'administrateur peut les décider. */
  requests: publicProcedure.input(z.object({ sessionToken: session })).query(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(sensitiveActionRequests).orderBy(desc(sensitiveActionRequests.createdAt)).limit(40);
    const ids = Array.from(new Set(rows.map((row) => row.candidateId)));
    const people = ids.length ? await db.select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email }).from(candidates).where(inArray(candidates.id, ids)) : [];
    return {
      isSuper: isSuperAdminEmail(admin.email),
      items: rows.map((row) => ({
        id: row.id, candidateId: row.candidateId, candidateName: people.find((item) => item.id === row.candidateId)?.fullName ?? "Candidat", reason: row.reason, requestedBy: row.requestedByLabel,
        status: row.status, decidedBy: row.decidedByLabel, decisionNote: row.decisionNote, createdAt: new Date(row.createdAt).toISOString(),
      })),
    };
  }),

  /** Le super administrateur approuve (la désactivation est alors exécutée) ou refuse une demande. */
  decideRequest: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive(), decision: z.enum(["approve", "reject"]), note: z.string().trim().max(300).nullish().transform((value) => value || null) })).mutation(async ({ input }) => {
    const admin = await requireSuperAdminSession(input.sessionToken);
    const db = await requireDb();
    const [request] = await db.select().from(sensitiveActionRequests).where(eq(sensitiveActionRequests.id, input.id)).limit(1);
    if (!request || request.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "Cette demande a déjà été traitée." });
    const actor = admin.email ?? `admin #${admin.id}`;
    if (input.decision === "approve") {
      const result = await deactivateCandidateDossier(db, { candidateId: request.candidateId, actorEmail: actor, reason: `${request.reason} (demandé par ${request.requestedByLabel}, approuvé par ${actor})` });
      if (result.ok === false && result.reason === "introuvable") throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
    }
    await db.update(sensitiveActionRequests).set({ status: input.decision === "approve" ? "approved" : "rejected", decidedByLabel: actor, decisionNote: input.note, decidedAt: new Date() }).where(eq(sensitiveActionRequests.id, request.id));
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: actor, action: `dossier.deactivation_${input.decision === "approve" ? "approved" : "rejected"}`, resourceType: "candidate", resourceId: request.candidateId, details: `Demande de ${request.requestedByLabel}` });
    return { ok: true as const };
  }),

  /**
   * Désactive en une fois les comptes activés sans preuve. Super administrateur, phrase de confirmation, motif ; chaque compte
   * est revérifié côté serveur (un compte qui a une preuve n'est jamais touché) et reste réactivable.
   */
  deactivateMany: publicProcedure.input(z.object({
    sessionToken: session,
    candidateIds: z.array(z.number().int().positive()).min(1).max(300),
    reason,
    confirmation: z.literal("DESACTIVER"),
  })).mutation(async ({ input }) => {
    const admin = await requireSuperAdminSession(input.sessionToken);
    const db = await requireDb();
    const actor = admin.email ?? `admin #${admin.id}`;
    const { rows } = await scanActivationsWithoutProof(db, 1000);
    const allowed = new Set(rows.map((row) => row.candidateId));
    const done: number[] = [];
    const skipped: Array<{ candidateId: number; why: string }> = [];
    for (const candidateId of Array.from(new Set(input.candidateIds))) {
      if (!allowed.has(candidateId)) {
        skipped.push({ candidateId, why: "preuve de paiement trouvée ou compte non activé" });
        continue;
      }
      const result = await deactivateCandidateDossier(db, { candidateId, actorEmail: actor, reason: input.reason });
      if (result.ok === false) skipped.push({ candidateId, why: result.reason });
      else done.push(candidateId);
    }
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: actor, action: "dossier.deactivated_bulk", resourceType: "candidate", resourceId: "bulk", details: `${done.length} dossier(s) désactivé(s) faute de preuve de paiement. Motif : ${input.reason.slice(0, 200)}` });
    return { deactivated: done.length, skipped };
  }),

  reactivate: publicProcedure.input(z.object({ sessionToken: session, candidateId: z.number().int().positive() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const actor = admin.email ?? `admin #${admin.id}`;
    const result = await reactivateCandidateDossier(db, { candidateId: input.candidateId, actorEmail: actor });
    if (result.ok === false) throw new TRPCError({ code: "PRECONDITION_FAILED", message: REACTIVATION_MESSAGES[result.reason] });
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: actor, action: "dossier.reactivated", resourceType: "candidate", resourceId: input.candidateId, details: "Désactivation annulée après vérification de la preuve de paiement." });
    return { ok: true as const, reference: result.reference };
  }),
});
