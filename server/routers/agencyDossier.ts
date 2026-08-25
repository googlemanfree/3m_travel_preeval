/**
 * Routeur tRPC — Gestion des Dossiers en Agence
 * Permet aux administrateurs d'ajouter et gérer des dossiers manuellement
 */

import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { agencyDossiers, agencyDossierHistory } from "../../drizzle/schema";
import { eq, and, like, desc } from "drizzle-orm";
import { sendEmail as sendGenericEmail, SendEmailOptions } from "../_core/email";
import { AGENCY_DOSSIER_STATUS_VALUES, isLuxembourgEmploymentProcedure, isLuxembourgEmploymentStatus } from "../../shared/agencyDossierStatus";

export const agencyDossierRouter = router({
  /**
   * Créer un nouveau dossier en agence
   */
  createDossier: protectedProcedure
    .input(z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(5),
      dateOfBirth: z.string().optional(),
      nationality: z.string().optional(),
      destination: z.string().min(2),
      visaType: z.string().min(2),
      educationLevel: z.string().optional(),
      employmentStatus: z.string().optional(),
      monthlyIncome: z.number().optional(),
      bankBalance: z.number().optional(),
      adminNotes: z.string().optional(),
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
          dateOfBirth: input.dateOfBirth,
          nationality: input.nationality,
          destination: input.destination,
          visaType: input.visaType,
          educationLevel: input.educationLevel,
          employmentStatus: input.employmentStatus,
          monthlyIncome: input.monthlyIncome,
          bankBalance: input.bankBalance,
          adminNotes: input.adminNotes,
          createdByAdmin: ctx.user.email || "unknown",
          source: "manual_admin" as any,
        });

        const dossierId = (result as any)[0].insertId;

        await db.insert(agencyDossierHistory).values({
          dossierId: dossierId,
          action: "created",
          changedBy: ctx.user.email || "unknown",
          oldValue: null,
          newValue: JSON.stringify(input),
          details: "Dossier créé manuellement par l'administrateur",
        });

        try {
          const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Bienvenue chez 3M Travel & Services</h2>
            <p>Bonjour ${input.fullName},</p>
            <p>Votre dossier a été créé avec succès dans notre système.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Détails de votre dossier:</h3>
              <p><strong>Destination:</strong> ${input.destination}</p>
              <p><strong>Type de Visa:</strong> ${input.visaType}</p>
              <p><strong>Statut:</strong> Nouveau</p>
            </div>
            <p>Notre équipe examinera votre dossier et vous contactera sous peu avec les prochaines étapes.</p>
            <p style="color: #666;">Cordialement,<br/>L'équipe 3M Travel & Services</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">3M Travel & Services - Pré-évaluation Visa & Immigration</p>
          </div>`;

          await sendGenericEmail({
            to: input.email,
            subject: "📋 Votre dossier a été créé - 3M Travel & Services",
            html: htmlContent
          });
        } catch (emailErr) {
          console.error("[Agency Dossier] Welcome email failed:", emailErr);
        }

        return {
          success: true,
          dossierId,
          message: "Dossier créé avec succès",
        };
      } catch (err) {
        console.error("[Agency Dossier] Create error:", err);
        if (err instanceof TRPCError) throw err;
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
      status: z.string().optional(),
      destination: z.string().optional(),
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

        const countResult = await db.select().from(agencyDossiers);
        const total = countResult.length;

        return {
          dossiers,
          total,
          limit: input.limit,
          offset: input.offset,
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

        const history = await db
          .select()
          .from(agencyDossierHistory)
          .where(eq(agencyDossierHistory.dossierId, input.dossierId))
          .orderBy(desc(agencyDossierHistory.createdAt));

        return {
          dossier: dossier[0],
          history,
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
      newStatus: z.enum(AGENCY_DOSSIER_STATUS_VALUES),
      notes: z.string().optional(),
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

        if (
          isLuxembourgEmploymentStatus(input.newStatus) &&
          !isLuxembourgEmploymentProcedure(dossier[0].destination, dossier[0].visaType)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cette étape est réservée aux procédures de travail au Luxembourg.",
          });
        }

        const oldStatus = dossier[0].status;

        await db
          .update(agencyDossiers)
          .set({
            status: input.newStatus as any,
            lastStatusChangeAt: new Date(),
            lastStatusChangeBy: ctx.user.email || "unknown",
          })
          .where(eq(agencyDossiers.id, input.dossierId));

        await db.insert(agencyDossierHistory).values({
          dossierId: input.dossierId,
          action: "status_changed",
          changedBy: ctx.user.email || "unknown",
          oldValue: oldStatus || "",
          newValue: input.newStatus,
          details: input.notes || "Statut mis à jour",
        });

        try {
          const statusMessages: Record<string, string> = {
            nouveau: "Votre dossier a été créé",
            en_cours: "Votre dossier est en cours de traitement",
            documents_requis: "Des documents supplémentaires sont requis",
            recherche_employeur: "Votre dossier est à l’étape de recherche d’employeur",
            validation_adem: "Votre dossier est à l’étape de validation de l’ADEM",
            soumis: "Votre dossier a été soumis",
            approuve: "Félicitations! Votre dossier a été approuvé",
            refuse: "Votre dossier a été refusé",
          };

          const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Mise à jour de votre dossier</h2>
            <p>Bonjour ${dossier[0].fullName},</p>
            <p>${statusMessages[input.newStatus]}</p>
            ${input.notes ? `<p><strong>Message:</strong> ${input.notes}</p>` : ""}
            <p>Cordialement,<br/>L'équipe 3M Travel & Services</p>
          </div>`;

          await sendGenericEmail({
            to: dossier[0].email,
            subject: "📋 Mise à jour de votre dossier - 3M Travel & Services",
            html: htmlContent
          });
        } catch (emailErr) {
          console.error("[Agency Dossier] Status update email failed:", emailErr);
        }

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
   * Ajouter des notes au dossier
   */
  addNotes: protectedProcedure
    .input(z.object({
      dossierId: z.number(),
      notes: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent ajouter des notes",
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

        const oldNotes = dossier[0].adminNotes;

        await db
          .update(agencyDossiers)
          .set({
            adminNotes: input.notes,
          })
          .where(eq(agencyDossiers.id, input.dossierId));

        await db.insert(agencyDossierHistory).values({
          dossierId: input.dossierId,
          action: "notes_added",
          changedBy: ctx.user.email || "unknown",
          oldValue: oldNotes || "",
          newValue: input.notes,
          details: "Notes administrateur mises à jour",
        });

        return {
          success: true,
          message: "Notes ajoutées avec succès",
        };
      } catch (err) {
        console.error("[Agency Dossier] Add notes error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'ajout des notes",
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

        await db.insert(agencyDossierHistory).values({
          dossierId: input.dossierId,
          action: "deleted",
          changedBy: ctx.user.email || "unknown",
          oldValue: null,
          newValue: null,
          details: "Dossier supprimé par l'administrateur",
        });

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
