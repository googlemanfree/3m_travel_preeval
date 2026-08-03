/**
 * Routeur tRPC — Gestion des Évaluations
 * Création, suivi et gestion des demandes de pré-évaluation
 */

import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { evaluations } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";

export const evaluationRouter = router({
  /**
   * Créer une nouvelle demande d'évaluation
   */
  create: publicProcedure
    .input(z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(5),
      nationality: z.string().optional(),
      dateOfBirth: z.string().optional(),
      destinationCategory: z.enum(["schengen", "canada", "autre"]),
      destinationCountry: z.string().optional(),
      visaType: z.enum([
        "schengen_etude",
        "schengen_tourisme",
        "schengen_travail",
        "canada_rp",
        "canada_etude",
        "canada_tourisme",
        "autre",
      ]),
      educationLevel: z.string().optional(),
      employmentStatus: z.string().optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db.insert(evaluations).values({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          nationality: input.nationality,
          dateOfBirth: input.dateOfBirth,
          destinationCategory: input.destinationCategory,
          destinationCountry: input.destinationCountry,
          visaType: input.visaType,
          educationLevel: input.educationLevel,
          employmentStatus: input.employmentStatus,
          message: input.message,
          status: "pending",
        });

        return {
          success: true,
          message: "Demande d'évaluation créée avec succès",
        };
      } catch (err) {
        console.error("[Evaluation] Create error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création de la demande d'évaluation",
        });
      }
    }),

  /**
   * Récupérer une évaluation par ID
   */
  getById: publicProcedure
    .input(z.object({
      evaluationId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const eval_data = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.id, input.evaluationId))
          .limit(1);

        if (eval_data.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Évaluation non trouvée",
          });
        }

        return eval_data[0];
      } catch (err) {
        console.error("[Evaluation] Get by ID error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération de l'évaluation",
        });
      }
    }),

  /**
   * Récupérer les évaluations d'un email
   */
  getByEmail: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const evals = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.email, input.email))
          .orderBy(desc(evaluations.createdAt));

        return evals;
      } catch (err) {
        console.error("[Evaluation] Get by email error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des évaluations",
        });
      }
    }),

  /**
   * Mettre à jour le statut d'une évaluation
   */
  updateStatus: protectedProcedure
    .input(z.object({
      evaluationId: z.number(),
      status: z.enum(["pending", "reviewed", "contacted", "closed"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent mettre à jour le statut",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(evaluations)
          .set({ status: input.status })
          .where(eq(evaluations.id, input.evaluationId));

        return {
          success: true,
          message: "Statut mis à jour avec succès",
        };
      } catch (err) {
        console.error("[Evaluation] Update status error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du statut",
        });
      }
    }),

  /**
   * Récupérer toutes les évaluations (admin)
   */
  getAll: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent voir toutes les évaluations",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        let query = db.select().from(evaluations);

        if (input.status) {
          query = query.where(eq(evaluations.status, input.status as any));
        }

        const evals = await query
          .orderBy(desc(evaluations.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return evals;
      } catch (err) {
        console.error("[Evaluation] Get all error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des évaluations",
        });
      }
    }),
});

export default evaluationRouter;
