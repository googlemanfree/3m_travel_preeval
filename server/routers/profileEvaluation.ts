/**
 * Routeur tRPC — Gestion des Dossiers en Agence
 * Permet aux administrateurs d'ajouter et gérer des dossiers manuellement
 */

import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { agencyDossiers } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const agencyDossierRouter = router({
  /**
   * Créer un nouveau dossier en agence
   */
  createDossier: protectedProcedure
    .input(z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(5),
      destination: z.string().min(2),
      visaType: z.string().min(2),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent créer des dossiers en agence",
        });
      }

      try {
        const result = await db.insert(agencyDossiers).values({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          destination: input.destination,
          visaType: input.visaType,
          status: "nouveau",
        });

        return {
          success: true,
          message: "Dossier créé avec succès",
        };
      } catch (err) {
        console.error("[Agency Dossier] Create error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création du dossier",
        });
      }
    }),

  /**
   * Récupérer tous les dossiers en agence
   */
  getDossiers: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent accéder aux dossiers en agence",
        });
      }

      try {
        const dossiers = await db
          .select()
          .from(agencyDossiers)
          .orderBy(desc(agencyDossiers.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          dossiers,
          total: dossiers.length,
        };
      } catch (err) {
        console.error("[Agency Dossier] Get dossiers error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des dossiers",
        });
      }
    }),

  /**
   * Récupérer un dossier spécifique
   */
  getDossierById: protectedProcedure
    .input(z.object({
      dossierId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent accéder aux dossiers en agence",
        });
      }

      try {
        const dossier = await db
          .select()
          .from(agencyDossiers)
          .where(eq(agencyDossiers.id, input.dossierId))
          .limit(1);

        if (dossier.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dossier non trouvé",
          });
        }

        return {
          success: true,
          dossier: dossier[0],
        };
      } catch (err) {
        console.error("[Agency Dossier] Get dossier error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération du dossier",
        });
      }
    }),

  /**
   * Mettre à jour le statut d'un dossier
   */
  updateStatus: protectedProcedure
    .input(z.object({
      dossierId: z.number(),
      newStatus: z.enum(["nouveau", "en_cours", "documents_requis", "soumis", "approuve", "refuse"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent modifier les dossiers",
        });
      }

      try {
        const dossier = await db
          .select()
          .from(agencyDossiers)
          .where(eq(agencyDossiers.id, input.dossierId))
          .limit(1);

        if (dossier.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dossier non trouvé",
          });
        }

        await db
          .update(agencyDossiers)
          .set({
            status: input.newStatus,
          })
          .where(eq(agencyDossiers.id, input.dossierId));

        return {
          success: true,
          message: "Statut mis à jour avec succès",
        };
      } catch (err) {
        console.error("[Agency Dossier] Update status error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du statut",
        });
      }
    }),

  /**
   * Supprimer un dossier
   */
  deleteDossier: protectedProcedure
    .input(z.object({
      dossierId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent supprimer des dossiers",
        });
      }

      try {
        const dossier = await db
          .select()
          .from(agencyDossiers)
          .where(eq(agencyDossiers.id, input.dossierId))
          .limit(1);

        if (dossier.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dossier non trouvé",
          });
        }

        await db
          .delete(agencyDossiers)
          .where(eq(agencyDossiers.id, input.dossierId));

        return {
          success: true,
          message: "Dossier supprimé avec succès",
        };
      } catch (err) {
        console.error("[Agency Dossier] Delete error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la suppression du dossier",
        });
      }
    }),
});

export default agencyDossierRouter;
