/**
 * Router pour l'administration des évaluations
 * Permet aux admins de consulter, modifier et valider les dossiers
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { TRPCError } from "@trpc/server";
import { generateEvaluationReportHTML } from "../evaluationService";
import { assertApplicationCanEnterStatus } from "../utils/applicationGates";

const draftInput = z.object({
  dossierNumber: z.string().min(1),
  finalScore: z.number().int().min(0).max(100),
  verdict: z.string().trim().min(2).max(500),
  strengths: z.array(z.string().trim().min(2).max(500)).max(6),
  weaknesses: z.array(z.string().trim().min(2).max(500)).max(6),
  recommendations: z.array(z.string().trim().min(2).max(800)).min(1).max(8),
  message: z.string().trim().max(3000).optional(),
  subject: z.string().trim().min(4).max(255).optional(),
});

/**
 * Envoyer le bilan validé par l’administration, immédiatement ou via le job planifié.
 */
async function sendBilanEmail(
  application: typeof applications.$inferSelect,
  subject?: string | null,
  introMessage?: string | null,
): Promise<void> {
  await sendEmail({
    to: application.email,
    subject: subject || `Votre Bilan d'Évaluation - Dossier N° ${application.dossierNumber}`,
    html: generateEvaluationReportHTML(application, { introMessage }),
  });
}

export const evaluationAdminRouter = router({
  /**
   * Lister tous les dossiers (admin only)
   */
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
    }

    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Base de données non disponible");
      }

      const allApplications = await db.select().from(applications);

      return {
        success: true,
        count: allApplications.length,
        applications: allApplications.map((app) => ({
          id: app.id,
          dossierNumber: app.dossierNumber,
          fullName: app.fullName,
          email: app.email,
          destination: app.destination,
          visaType: app.visaType,
          dossierStatus: app.dossierStatus,
          scoringTotal: app.scoringTotal,
          paymentStatus: app.paymentStatus,
          createdAt: app.createdAt,
        })),
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des dossiers:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la récupération des dossiers",
      });
    }
  }),

  /**
   * Récupérer les détails d'un dossier (admin only)
   */
  getDetails: protectedProcedure
    .input(z.object({ dossierNumber: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Base de données non disponible");
        }

        const [application] = await db
          .select()
          .from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber))
          .limit(1);

        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
        }

        const report = JSON.parse(application.scoringDetails || "{}");

        return {
          success: true,
          application: {
            ...application,
            report,
          },
        };
      } catch (error) {
        console.error("Erreur lors de la récupération du dossier:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération du dossier",
        });
      }
    }),

  /**
   * Mettre à jour le score d'un dossier (admin only)
   */
  updateScore: protectedProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        newScore: z.number().int().min(0).max(100),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Base de données non disponible");
        }

        // Récupérer le dossier actuel
        const [application] = await db
          .select()
          .from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber))
          .limit(1);

        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
        }

        // Mettre à jour le score
        const report = JSON.parse(application.scoringDetails || "{}");
        report.score = input.newScore;
        report.adminNotes = input.notes;

        const newBadge =
          input.newScore >= 80 ? "eligible" : input.newScore >= 60 ? "admissible" : "faible";

        await db
          .update(applications)
          .set({
            scoringTotal: input.newScore,
            scoringDetails: JSON.stringify(report),
            scoringBadge: newBadge,
            updatedAt: new Date(),
          })
          .where(eq(applications.dossierNumber, input.dossierNumber));

        return {
          success: true,
          message: "Score mis à jour avec succès",
        };
      } catch (error) {
        console.error("Erreur lors de la mise à jour du score:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du score",
        });
      }
    }),

  /** Enregistrer un brouillon modifiable et produire l’aperçu du bilan. */
  saveBilanDraft: protectedProcedure
    .input(draftInput)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données non disponible" });
      const [application] = await db.select().from(applications).where(eq(applications.dossierNumber, input.dossierNumber)).limit(1);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
      if (application.evaluationDeliveryStatus === "sent") throw new TRPCError({ code: "BAD_REQUEST", message: "Le bilan a déjà été envoyé et ne peut plus être modifié." });
      let details: Record<string, unknown> = {};
      try { details = JSON.parse(application.scoringDetails || "{}"); } catch { details = {}; }
      const nextDetails = { ...details, adminDraft: { finalScore: input.finalScore, verdict: input.verdict, strengths: input.strengths, weaknesses: input.weaknesses, recommendations: input.recommendations } };
      const nextApplication = { ...application, scoringDetails: JSON.stringify(nextDetails), scoringTotal: input.finalScore, evaluationDeliveryMessage: input.message || null, evaluationDeliverySubject: input.subject || null };
      await db.update(applications).set({ scoringDetails: nextApplication.scoringDetails, scoringTotal: input.finalScore, evaluationDeliveryMessage: input.message || null, evaluationDeliverySubject: input.subject || null, evaluationDeliveryStatus: "draft", evaluationScheduledAt: null, updatedAt: new Date() }).where(eq(applications.id, application.id));
      return { success: true, reportHtml: generateEvaluationReportHTML(nextApplication), message: "Brouillon enregistré. Vérifiez l’aperçu avant l’envoi." };
    }),

  /** Programmer la diffusion d’un brouillon de bilan à une date et heure précises. */
  scheduleBilan: protectedProcedure
    .input(z.object({ dossierNumber: z.string().min(1), scheduledAt: z.date() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      const now = new Date();
      if (input.scheduledAt.getTime() <= now.getTime() + 60_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Choisissez une date et heure au moins une minute dans le futur." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données non disponible" });
      const [application] = await db.select().from(applications).where(eq(applications.dossierNumber, input.dossierNumber)).limit(1);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
      if (application.evaluationDeliveryStatus === "sent") throw new TRPCError({ code: "BAD_REQUEST", message: "Le bilan a déjà été envoyé." });
      await db.update(applications).set({ evaluationScheduledAt: input.scheduledAt, evaluationDeliveryStatus: "scheduled", updatedAt: now }).where(eq(applications.id, application.id));
      return { success: true, message: `Bilan programmé pour le ${input.scheduledAt.toLocaleString("fr-FR")}.` };
    }),

  /**
   * Publier immédiatement le bilan d'un dossier (admin only).
   * Le job à 48 h reste un filet de sécurité pour les dossiers non traités.
   */
  publishBilan: protectedProcedure
    .input(z.object({ dossierNumber: z.string(), adminNote: z.string().trim().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Base de données non disponible");
        }

        // Récupérer le dossier
        const [application] = await db
          .select()
          .from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber))
          .limit(1);

        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
        }

        if (application.evaluationDeliveryStatus === "sent" || !["nouveau", "en_evaluation"].includes(application.dossierStatus)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ce bilan a déjà été publié ou le dossier a progressé vers une étape ultérieure.",
          });
        }

        await sendBilanEmail(application, application.evaluationDeliverySubject, application.evaluationDeliveryMessage);
        // Marquer le bilan comme traité après succès d’envoi : aucun job automatique ne le renverra.
        await db.update(applications).set({
          dossierStatus: "bilan_envoye",
          evaluationCompletedAt: new Date(),
          evaluationDeliveryStatus: "sent",
          evaluationScheduledAt: null,
          ...(input.adminNote ? { adminNote: input.adminNote } : {}),
          updatedAt: new Date(),
        }).where(eq(applications.dossierNumber, input.dossierNumber));

        return {
          success: true,
          message: "Bilan validé et envoyé immédiatement. L’échéance automatique de 48 h est annulée pour ce dossier.",
        };
      } catch (error) {
        console.error("Erreur lors de la publication du bilan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la publication du bilan",
        });
      }
    }),

  /**
   * Mettre à jour le statut d'un dossier (admin only)
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        newStatus: z.enum([
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Base de données non disponible");
        }

        const [application] = await db
          .select({ agreementSigned: applications.agreementSigned, paymentStatus: applications.paymentStatus, cvUrl: applications.cvUrl })
          .from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber))
          .limit(1);
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
        assertApplicationCanEnterStatus(application, input.newStatus);

        await db
          .update(applications)
          .set({
            dossierStatus: input.newStatus,
            updatedAt: new Date(),
          })
          .where(eq(applications.dossierNumber, input.dossierNumber));

        return {
          success: true,
          message: "Statut mis à jour avec succès",
        };
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du statut",
        });
      }
    }),

  /**
   * Ajouter une note interne (admin only)
   */
  addNote: protectedProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        note: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Base de données non disponible");
        }

        // Récupérer le dossier
        const [application] = await db
          .select()
          .from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber))
          .limit(1);

        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
        }

        // Ajouter la note
        const report = JSON.parse(application.scoringDetails || "{}");
        if (!report.adminNotes) {
          report.adminNotes = [];
        }
        if (!Array.isArray(report.adminNotes)) {
          report.adminNotes = [report.adminNotes];
        }
        report.adminNotes.push({
          date: new Date().toISOString(),
          author: ctx.user?.name || "Admin",
          text: input.note,
        });

        await db
          .update(applications)
          .set({
            scoringDetails: JSON.stringify(report),
            updatedAt: new Date(),
          })
          .where(eq(applications.dossierNumber, input.dossierNumber));

        return {
          success: true,
          message: "Note ajoutée avec succès",
        };
      } catch (error) {
        console.error("Erreur lors de l'ajout de la note:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'ajout de la note",
        });
      }
    }),
});
