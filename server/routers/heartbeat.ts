/**
 * Routeur tRPC — Gestion des jobs Heartbeat
 * Permet de créer, lister et gérer les jobs d'évaluation automatique
 */

import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createHeartbeatJob, listHeartbeatJobs, deleteHeartbeatJob } from "../_core/heartbeat";

export const heartbeatRouter = router({
  /** Créer un job Heartbeat pour l'évaluation automatique quotidienne */
  createEvaluationJob: protectedProcedure
    .input(z.object({
      cronExpression: z.string().default("0 0 8 * * *"), // Tous les jours à 8h UTC
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      try {
        const result = await createHeartbeatJob(
          {
            name: "evaluation-job-daily",
            cron: input.cronExpression,
            path: "/api/scheduled/evaluation-job",
            method: "POST",
            description: input.description || "Envoi automatique des rapports d'évaluation aux nouveaux dossiers",
          },
          ctx.user.openId || ""
        );

        return {
          success: true,
          taskUid: result.taskUid,
          nextExecutionAt: result.nextExecutionAt,
          message: "Job d'évaluation créé avec succès",
        };
      } catch (err) {
        console.error("[Heartbeat] Create job error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création du job d'évaluation",
        });
      }
    }),

  /** Lister tous les jobs Heartbeat */
  listJobs: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      try {
        const jobs = await listHeartbeatJobs(ctx.user.openId || "");
        return {
          success: true,
          jobs,
        };
      } catch (err) {
        console.error("[Heartbeat] List jobs error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des jobs",
        });
      }
    }),

  /** Supprimer un job Heartbeat */
  deleteJob: protectedProcedure
    .input(z.object({
      taskUid: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      try {
        await deleteHeartbeatJob(input.taskUid, ctx.user.openId || "");
        return {
          success: true,
          message: "Job supprimé avec succès",
        };
      } catch (err) {
        console.error("[Heartbeat] Delete job error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la suppression du job",
        });
      }
    }),
});
