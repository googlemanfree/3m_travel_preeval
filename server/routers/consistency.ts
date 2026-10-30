import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { agencyDossiers, applications, candidates } from "../../drizzle/schema";
import { FIXABLE_CODES, findConsistencyIssues, type ConsistencyApplication } from "../../shared/dossierConsistency";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { enforceActivationInvariant } from "../services/activationGuard";
import { adminLabel } from "../services/partnerProfiles";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { requireSuperAdminSession, requireValidAdminSession } from "./adminAuth";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
const session = z.string().min(1).max(512);

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return db;
}

async function load(db: Db) {
  const apps = await db.select({ id: applications.id, candidateId: applications.candidateId, fullName: applications.fullName, dossierNumber: applications.dossierNumber, dossierStatus: applications.dossierStatus, evaluationDeliveryStatus: applications.evaluationDeliveryStatus, activationRequestedAt: applications.activationRequestedAt, paymentStatus: applications.paymentStatus }).from(applications).orderBy(desc(applications.createdAt)).limit(3000);
  const candidateIds = Array.from(new Set(apps.map((app) => app.candidateId).filter((id): id is number => typeof id === "number" && id > 0)));
  const statuses = candidateIds.length ? await db.select({ id: candidates.id, dossierStatus: candidates.dossierStatus }).from(candidates).where(and(inArray(candidates.id, candidateIds.slice(0, 3000)), isNull(candidates.deletedAt))) : [];
  const statusById = new Map(statuses.map((row) => [row.id, row.dossierStatus]));
  const agencies = await db.select({ id: agencyDossiers.id, fullName: agencyDossiers.fullName, status: agencyDossiers.status, initialPaymentStatus: agencyDossiers.initialPaymentStatus }).from(agencyDossiers).where(isNull(agencyDossiers.deletedAt)).orderBy(desc(agencyDossiers.id)).limit(3000);
  const rows: ConsistencyApplication[] = apps.map((app) => ({ ...app, evaluationDeliveryStatus: app.evaluationDeliveryStatus ?? null, paymentStatus: app.paymentStatus ?? null, candidateStatus: app.candidateId ? statusById.get(app.candidateId) ?? null : null }));
  return { checked: apps.length + agencies.length, issues: findConsistencyIssues({ applications: rows, agencyDossiers: agencies.map((row) => ({ ...row, initialPaymentStatus: row.initialPaymentStatus ?? null })) }) };
}

/** Passage en revue de tous les dossiers : incohérences repérées, et correction des seules qui se corrigent sans risque. */
export const consistencyRouter = router({
  scan: publicProcedure.input(z.object({ sessionToken: session })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const result = await load(db);
    return { ...result, activationGuard: "Le retrait des activations sans paiement s'exécute aussi automatiquement toutes les 30 minutes." };
  }),

  /** Corrige une catégorie corrigeable (statut du dossier après envoi du bilan) ou lance le retrait des activations sans paiement. */
  fix: publicProcedure.input(z.object({ sessionToken: session, target: z.enum(["bilan_sent_status_mismatch", "activations_without_payment"]) })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    let fixed = 0;
    if (input.target === "activations_without_payment") {
      await requireSuperAdminSession(input.sessionToken);
      const report = await enforceActivationInvariant(db);
      fixed = report.removed;
    } else {
      if (!FIXABLE_CODES.includes(input.target)) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette catégorie ne se corrige pas automatiquement." });
      const { issues } = await load(db);
      const ids = (issues.find((issue) => issue.code === "bilan_sent_status_mismatch")?.rows ?? []).map((row) => row.id);
      if (ids.length) {
        await db.update(applications).set({ dossierStatus: "bilan_envoye", updatedAt: new Date() }).where(and(inArray(applications.id, ids), eq(applications.evaluationDeliveryStatus, "sent"), inArray(applications.dossierStatus, ["nouveau", "en_evaluation"])));
        fixed = ids.length;
      }
    }
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: `consistency.fix.${input.target}`, resourceType: "dossiers", resourceId: "batch", details: `${fixed} dossier(s) corrigé(s)` });
    return { ok: true as const, fixed };
  }),
});
