import { and, eq, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminActivityLogs, evaluations } from "../../drizzle/schema";
import { computeBilanDelays, computeStageDelays, type StatusTransition } from "../../shared/delayStats";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";

const DAY = 86_400_000;

export const delayStatsRouter = router({
  /**
   * Délais réels sur la période (30 à 365 jours) : tenue de l'échéance des bilans et durée médiane entre changements de statut.
   * Lecture seule, chiffres calculés depuis les dates enregistrées ; un échantillon trop petit est signalé côté affichage.
   */
  get: publicProcedure.input(z.object({ sessionToken: z.string().min(1).max(512), days: z.number().int().min(30).max(365).default(180) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const now = new Date();
    const since = new Date(now.getTime() - input.days * DAY);
    const evaluationRows = await db.select({ createdAt: evaluations.createdAt, reviewDeadline: evaluations.reviewDeadline, finalResponseSentAt: evaluations.finalResponseSentAt }).from(evaluations).where(gte(evaluations.createdAt, since)).limit(5000);
    const logs = await db.select({ id: adminActivityLogs.evaluationId, oldStatus: adminActivityLogs.oldStatus, newStatus: adminActivityLogs.newStatus, at: adminActivityLogs.createdAt }).from(adminActivityLogs).where(and(eq(adminActivityLogs.action, "status_changed"), eq(adminActivityLogs.evaluationType, "candidate_workflow"), gte(adminActivityLogs.createdAt, since))).limit(20000);
    const transitions: StatusTransition[] = logs.filter((log) => log.id).map((log) => ({ id: String(log.id), oldStatus: log.oldStatus, newStatus: log.newStatus, at: log.at }));
    return { days: input.days, evaluationsCount: evaluationRows.length, bilans: computeBilanDelays(evaluationRows, now), stages: computeStageDelays(transitions).slice(0, 12) };
  }),
});
