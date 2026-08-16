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

/**
 * Envoyer l'email avec le bilan après 48h
 */
async function sendBilanEmail(
  email: string,
  fullName: string,
  dossierNumber: string,
  aiReport: any
): Promise<void> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
      <h2 style="color: #0066cc;">3M Travel Agency - Bilan Consulaire</h2>
      <p>Bonjour <strong>${fullName}</strong>,</p>
      <p>L'étude de votre CV pour votre projet est terminée.</p>

      <div style="background-color: #f4f6f8; border-left: 5px solid #0066cc; padding: 15px; margin: 20px 0;">
        <p><strong>Score d'admissibilité :</strong> <span style="font-size: 18px; color: #0066cc; font-weight: bold;">${aiReport.score} / 100</span></p>
        <p><strong>Verdict Consulaire :</strong> ${aiReport.verdict}</p>
      </div>

      <h3 style="color: #0066cc;">Points Forts</h3>
      <ul>
        ${aiReport.strengths.map((s: string) => `<li>${s}</li>`).join("")}
      </ul>

      <h3 style="color: #0066cc;">Points à Améliorer</h3>
      <ul>
        ${aiReport.weaknesses.map((w: string) => `<li>${w}</li>`).join("")}
      </ul>

      <h3 style="color: #0066cc;">Recommandations</h3>
      <ul>
        ${aiReport.recommendations.map((r: string) => `<li>${r}</li>`).join("")}
      </ul>

      <p style="text-align: center; margin: 25px 0;">
        <a href="https://3mtravelagency.click/mon-espace?dossier=${dossierNumber}" 
           style="background-color: #0066cc; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Consulter mon Bilan Complet
        </a>
      </p>
      <hr />
      <p style="font-size: 12px; color: #888;">3M Travel Agency — Yaoundé, Biyem-Assi | www.3mtravelagency.click</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Votre Bilan d'Admissibilité Officiel - Dossier N° ${dossierNumber}`,
    html: htmlContent,
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

        if (!["nouveau", "en_evaluation"].includes(application.dossierStatus)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ce bilan a déjà été publié ou le dossier a progressé vers une étape ultérieure.",
          });
        }

        // Marquer le bilan comme traité avant l'envoi : le job à 48 h ne pourra plus le renvoyer.
        await db
          .update(applications)
          .set({
            dossierStatus: "bilan_envoye",
            evaluationCompletedAt: new Date(),
            ...(input.adminNote ? { adminNote: input.adminNote } : {}),
            updatedAt: new Date(),
          })
          .where(eq(applications.dossierNumber, input.dossierNumber));

        // Envoyer l'email
        const report = JSON.parse(application.scoringDetails || "{}");
        await sendBilanEmail(
          application.email,
          application.fullName,
          application.dossierNumber,
          report
        );

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
