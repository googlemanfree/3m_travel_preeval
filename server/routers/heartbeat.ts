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
        // Utiliser la session utilisateur du contexte tRPC
        // ctx.user.openId est déjà la session valide
        const userSession = ctx.user.openId || process.env.OWNER_OPEN_ID || "";
        
        if (!userSession) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Impossible de créer le job : identifiant utilisateur manquant",
          });
        }

        const result = await createHeartbeatJob(
          {
            name: "evaluation-job-daily",
            cron: input.cronExpression,
            path: "/api/scheduled/evaluation-job",
            method: "POST",
            description: input.description || "Envoi automatique des rapports d'évaluation aux nouveaux dossiers",
          },
          userSession
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
        // Utiliser la session utilisateur du contexte tRPC
        const userSession = ctx.user.openId || process.env.OWNER_OPEN_ID || "";
        
        if (!userSession) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Impossible de récupérer les jobs : identifiant utilisateur manquant",
          });
        }

        const jobs = await listHeartbeatJobs(userSession);
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

  /** Créer un job Heartbeat pour l'envoi des bilans après 48h */
  createBilanJob: protectedProcedure
    .input(z.object({
      cronExpression: z.string().default("0 0 * * * *"), // Toutes les heures
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      try {
        const userSession = ctx.user.openId || process.env.OWNER_OPEN_ID || "";
        
        if (!userSession) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Impossible de créer le job : identifiant utilisateur manquant",
          });
        }

        const result = await createHeartbeatJob(
          {
            name: "evaluation-bilan-48h",
            cron: input.cronExpression,
            path: "/api/scheduled/evaluation-bilan-job",
            method: "POST",
            description: input.description || "Envoi automatique des bilans d'admissibilité après 48h",
          },
          userSession
        );

        return {
          success: true,
          taskUid: result.taskUid,
          nextExecutionAt: result.nextExecutionAt,
          message: "Job de bilan 48h créé avec succès",
        };
      } catch (err) {
        console.error("[Heartbeat] Create bilan job error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création du job de bilan",
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
        // Utiliser la session utilisateur du contexte tRPC
        const userSession = ctx.user.openId || process.env.OWNER_OPEN_ID || "";
        
        if (!userSession) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Impossible de supprimer le job : identifiant utilisateur manquant",
          });
        }

        await deleteHeartbeatJob(input.taskUid, userSession);
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
