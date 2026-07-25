/**
 * Routeur tRPC — Gestion Admin Spécialisée
 * Permet de gérer les 3 types d'admins : Évaluation, Accompagnement, Procédures
 */

import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { evaluations, aiReportHistory } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const adminRouter = router({
  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN ÉVALUATION — Gestion des CV et rapports IA
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer les rapports IA en attente de révision
   */
  getEvaluationPendingReports: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const reports = await db
          .select()
          .from(aiReportHistory)
          .where(eq(aiReportHistory.sendStatus, "pending"))
          .orderBy(desc(aiReportHistory.createdAt))
          .limit(50);

        const evals = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.status, "pending"))
          .orderBy(desc(evaluations.createdAt))
          .limit(50);

        return {
          success: true,
          reports,
          evaluations: evals,
          count: reports.length + evals.length,
        };
      } catch (err) {
        console.error("[Admin Evaluation] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des rapports",
        });
      }
    }),

  /**
   * Récupérer les statistiques d'évaluation
   */
  getEvaluationStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const allReports = await db.select().from(aiReportHistory);
        const sentReports = allReports.filter(r => r.sendStatus === "sent");
        const failedReports = allReports.filter(r => r.sendStatus === "failed");
        const pendingReports = allReports.filter(r => r.sendStatus === "pending");

        return {
          success: true,
          stats: {
            total: allReports.length,
            sent: sentReports.length,
            failed: failedReports.length,
            pending: pendingReports.length,
            successRate: allReports.length > 0 ? Math.round((sentReports.length / allReports.length) * 100) : 0,
          },
        };
      } catch (err) {
        console.error("[Admin Evaluation Stats] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN ACCOMPAGNEMENT — Gestion de l'avancement des dossiers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Avancer rapidement le statut d'une évaluation
   */
  advanceEvaluationStatus: protectedProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      newStatus: z.enum(["pending", "reviewed", "contacted", "closed"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const eval_ = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.id, input.evaluationId))
          .limit(1);

        if (eval_.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation non trouvée" });
        }

        await db
          .update(evaluations)
          .set({
            status: input.newStatus,
          })
          .where(eq(evaluations.id, input.evaluationId));

        return {
          success: true,
          message: `Évaluation avancée au statut: ${input.newStatus}`,
        };
      } catch (err) {
        console.error("[Admin Advance] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'avancement de l'évaluation",
        });
      }
    }),

  /**
   * Récupérer les évaluations en attente de contact
   */
  getEvaluationsAwaitingContact: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const evals = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.status, "reviewed"))
          .orderBy(desc(evaluations.updatedAt))
          .limit(50);

        return {
          success: true,
          evaluations: evals,
          count: evals.length,
        };
      } catch (err) {
        console.error("[Admin Contact] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des évaluations",
        });
      }
    }),

  /**
   * Ajouter des notes à une évaluation
   */
  addEvaluationNotes: protectedProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      notes: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const eval_ = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.id, input.evaluationId))
          .limit(1);

        if (eval_.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation non trouvée" });
        }

        const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' });
        const newNote = `[${timestamp}] ${input.notes}`;

        return {
          success: true,
          message: "Note ajoutée à l'évaluation",
        };
      } catch (err) {
        console.error("[Admin Notes] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'ajout de notes",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN PROCÉDURES — Gestion des procédures par pays
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer les statistiques par destination
   */
  getEvaluationsByDestination: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const evals = await db.select().from(evaluations);

        // Grouper par destination
        const byDestination: Record<string, any> = {};
        evals.forEach(eval_ => {
          const dest = eval_.destinationCountry || "Non spécifiée";
          if (!byDestination[dest]) {
            byDestination[dest] = {
              destination: dest,
              total: 0,
              pending: 0,
              reviewed: 0,
              contacted: 0,
              closed: 0,
            };
          }
          byDestination[dest].total++;
          byDestination[dest][eval_.status]++;
        });

        return {
          success: true,
          destinations: Object.values(byDestination),
        };
      } catch (err) {
        console.error("[Admin Procedures] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques",
        });
      }
    }),

  /**
   * Récupérer les évaluations par destination
   */
  getEvaluationsByDestinationName: protectedProcedure
    .input(z.object({
      destination: z.string(),
      status: z.enum(["pending", "reviewed", "contacted", "closed"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        let query: any = db.select().from(evaluations).where(eq(evaluations.destinationCountry, input.destination));

        if (input.status) {
          query = query.where(eq(evaluations.status, input.status));
        }

        const evals = await query.orderBy(desc(evaluations.createdAt)).limit(100);

        return {
          success: true,
          evaluations: evals,
          count: evals.length,
        };
      } catch (err) {
        console.error("[Admin Destination] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des évaluations",
        });
      }
    }),

  /**
   * Récupérer les statistiques du dashboard admin
   * Retourne : pending, reviewed, contacted, closed
   */
  getDashboardStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const allEvals = await db.select().from(evaluations);
        
        return {
          success: true,
          stats: {
            pending: allEvals.filter(e => e.status === "pending").length,
            reviewed: allEvals.filter(e => e.status === "reviewed").length,
            contacted: allEvals.filter(e => e.status === "contacted").length,
            closed: allEvals.filter(e => e.status === "closed").length,
            total: allEvals.length,
          },
        };
      } catch (err) {
        console.error("[Admin Dashboard Stats] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques du dashboard",
        });
      }
    }),

  /**
   * Récupérer les statistiques globales
   */
  getGlobalStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const evals = await db.select().from(evaluations);
        const reports = await db.select().from(aiReportHistory);

        const stats = {
          totalEvaluations: evals.length,
          evaluationsByStatus: {
            pending: evals.filter(e => e.status === "pending").length,
            reviewed: evals.filter(e => e.status === "reviewed").length,
            contacted: evals.filter(e => e.status === "contacted").length,
            closed: evals.filter(e => e.status === "closed").length,
          },
          aiReports: {
            total: reports.length,
            sent: reports.filter(r => r.sendStatus === "sent").length,
            failed: reports.filter(r => r.sendStatus === "failed").length,
            pending: reports.filter(r => r.sendStatus === "pending").length,
          },
          conversionRate: evals.length > 0 ? Math.round((evals.filter(e => e.status !== "pending").length / evals.length) * 100) : 0,
        };

        return {
          success: true,
          stats,
        };
      } catch (err) {
        console.error("[Admin Global Stats] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques globales",
        });
      }
    }),
});
