/**
 * Routeur tRPC — Gestion des Applications (Dossiers d'Immigration)
 * Création, suivi et gestion des dossiers d'immigration
 */

import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { applications } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";

/**
 * Générer un numéro de dossier unique : 3M-YYYY-NNNN
 */
function generateDossierNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `3M-${year}-${random}`;
}

export const applicationRouter = router({
  /**
   * Créer une nouvelle application
   */
  create: publicProcedure
    .input(z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      whatsappNumber: z.string().min(5),
      destination: z.enum(["canada", "luxembourg", "pologne", "europe", "golfe", "oceanie", "caucase", "autre"]),
      formulaChosen: z.enum(["integral", "echelonne", "garanti"]).default("integral"),
      nationality: z.string().optional(),
      age: z.number().optional(),
      academicLevel: z.string().optional(),
      experienceYears: z.number().optional(),
      jobSector: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const dossierNumber = generateDossierNumber();

        const result = await db.insert(applications).values({
          dossierNumber,
          fullName: input.fullName,
          email: input.email,
          whatsappNumber: input.whatsappNumber,
          destination: input.destination,
          formulaChosen: input.formulaChosen,
          nationality: input.nationality,
          age: input.age,
          academicLevel: input.academicLevel,
          experienceYears: input.experienceYears,
          jobSector: input.jobSector,
          dossierStatus: "nouveau",
          paymentStatus: "PENDING",
          emailVerified: false,
          agreementSigned: false,
        });

        return {
          success: true,
          dossierNumber,
          message: "Application créée avec succès",
        };
      } catch (err) {
        console.error("[Application] Create error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création de l'application",
        });
      }
    }),

  /**
   * Récupérer une application par numéro de dossier
   */
  getByDossierNumber: publicProcedure
    .input(z.object({
      dossierNumber: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const app = await db
          .select()
          .from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber))
          .limit(1);

        if (app.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application non trouvée",
          });
        }

        return app[0];
      } catch (err) {
        console.error("[Application] Get by dossier number error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération de l'application",
        });
      }
    }),

  /**
   * Récupérer les applications d'un candidat
   */
  getByEmail: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const apps = await db
          .select()
          .from(applications)
          .where(eq(applications.email, input.email))
          .orderBy(desc(applications.createdAt));

        return apps;
      } catch (err) {
        console.error("[Application] Get by email error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des applications",
        });
      }
    }),

  /**
   * Mettre à jour le statut d'une application
   */
  updateStatus: protectedProcedure
    .input(z.object({
      dossierNumber: z.string(),
      dossierStatus: z.enum([
        "nouveau",
        "en_evaluation",
        "bilan_envoye",
        "en_attente_paiement",
        "paye",
        "en_attente_documents",
        "documents_recus",
        "soumis_agences",
        "en_cours_recrutement",
        "contrat_obtenu",
        "visa_approuve",
        "refuse",
      ]),
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
          .update(applications)
          .set({ dossierStatus: input.dossierStatus })
          .where(eq(applications.dossierNumber, input.dossierNumber));

        return {
          success: true,
          message: "Statut mis à jour avec succès",
        };
      } catch (err) {
        console.error("[Application] Update status error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du statut",
        });
      }
    }),

  /**
   * Mettre à jour le statut de paiement
   */
  updatePaymentStatus: protectedProcedure
    .input(z.object({
      dossierNumber: z.string(),
      paymentStatus: z.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED"]),
      paymentTransactionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent mettre à jour le paiement",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const updates: Record<string, any> = {
          paymentStatus: input.paymentStatus,
        };

        if (input.paymentTransactionId) {
          updates.paymentTransactionId = input.paymentTransactionId;
          updates.paymentDate = new Date();
        }

        await db
          .update(applications)
          .set(updates)
          .where(eq(applications.dossierNumber, input.dossierNumber));

        return {
          success: true,
          message: "Statut de paiement mis à jour avec succès",
        };
      } catch (err) {
        console.error("[Application] Update payment status error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du paiement",
        });
      }
    }),

  /**
   * Récupérer toutes les applications (admin)
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
          message: "Seuls les administrateurs peuvent voir toutes les applications",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const apps = input.status
          ? await db.select().from(applications)
              .where(eq(applications.dossierStatus, input.status as any))
              .orderBy(desc(applications.createdAt))
              .limit(input.limit)
              .offset(input.offset)
          : await db.select().from(applications)
              .orderBy(desc(applications.createdAt))
              .limit(input.limit)
              .offset(input.offset);

        return apps;
      } catch (err) {
        console.error("[Application] Get all error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des applications",
        });
      }
    }),

  /**
   * Ajouter une note admin
   */
  addAdminNote: protectedProcedure
    .input(z.object({
      dossierNumber: z.string(),
      note: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent ajouter des notes",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(applications)
          .set({ adminNote: input.note })
          .where(eq(applications.dossierNumber, input.dossierNumber));

        return {
          success: true,
          message: "Note ajoutée avec succès",
        };
      } catch (err) {
        console.error("[Application] Add admin note error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'ajout de la note",
        });
      }
    }),
});

export default applicationRouter;
