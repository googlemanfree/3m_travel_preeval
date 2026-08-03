/**
 * Router pour la gestion des commentaires/questions sur les bilans d'évaluation
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { evaluationComments } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "../_core/email";

/**
 * Envoyer un email de notification aux admins
 */
async function notifyAdminNewComment(
  dossierNumber: string,
  candidateName: string,
  content: string,
  isQuestion: boolean
): Promise<void> {
  try {
    const subject = isQuestion
      ? `Nouvelle question sur le bilan - Dossier ${dossierNumber}`
      : `Nouveau commentaire sur le bilan - Dossier ${dossierNumber}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
        <h2 style="color: #0066cc;">3M Travel Agency - ${isQuestion ? "Nouvelle Question" : "Nouveau Commentaire"}</h2>
        <p><strong>Dossier :</strong> ${dossierNumber}</p>
        <p><strong>Candidat :</strong> ${candidateName}</p>
        <hr />
        <p><strong>${isQuestion ? "Question" : "Commentaire"} :</strong></p>
        <blockquote style="background-color: #f4f6f8; border-left: 4px solid #0066cc; padding: 12px; margin: 10px 0;">
          ${content.replace(/\n/g, "<br>")}
        </blockquote>
        <p style="text-align: center; margin: 20px 0;">
          <a href="https://3mtravelagency.click/admin/evaluations" 
             style="background-color: #0066cc; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Consulter le dossier
          </a>
        </p>
      </div>
    `;

    await sendEmail({
      to: "hello@3mtravelagency.click",
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification admin:", error);
  }
}

/**
 * Envoyer un email de notification au candidat quand un admin répond
 */
async function notifyCandidateReply(
  candidateEmail: string,
  candidateName: string,
  dossierNumber: string,
  adminName: string,
  replyContent: string
): Promise<void> {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
        <h2 style="color: #0066cc;">3M Travel Agency - Réponse à votre question</h2>
        <p>Bonjour <strong>${candidateName}</strong>,</p>
        <p>Un conseiller a répondu à votre question concernant votre dossier <strong>${dossierNumber}</strong>.</p>
        <div style="background-color: #f4f6f8; border-left: 4px solid #0066cc; padding: 12px; margin: 15px 0;">
          <p><strong>${adminName} a écrit :</strong></p>
          <p>${replyContent.replace(/\n/g, "<br>")}</p>
        </div>
        <p style="text-align: center; margin: 20px 0;">
          <a href="https://3mtravelagency.click/mon-espace?dossier=${dossierNumber}" 
             style="background-color: #0066cc; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Consulter ma réponse
          </a>
        </p>
        <hr />
        <p style="font-size: 12px; color: #888;">3M Travel Agency — Yaoundé, Biyem-Assi | www.3mtravelagency.click</p>
      </div>
    `;

    await sendEmail({
      to: candidateEmail,
      subject: `Réponse à votre question - Dossier ${dossierNumber}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification candidat:", error);
  }
}

export const evaluationCommentsRouter = router({
  /**
   * Poster un commentaire/question (public - basé sur dossierNumber + email)
   */
  postComment: publicProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        email: z.string().email(),
        fullName: z.string(),
        content: z.string().min(10, "Le commentaire doit faire au moins 10 caractères"),
        isQuestion: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Base de données non disponible");
        }

        // Insérer le commentaire
        const result = await db.insert(evaluationComments).values({
          dossierNumber: input.dossierNumber,
          authorType: "candidate",
          authorName: input.fullName,
          authorEmail: input.email,
          content: input.content,
          isQuestion: input.isQuestion,
          isRead: false,
        });

        // Notifier les admins
        await notifyAdminNewComment(
          input.dossierNumber,
          input.fullName,
          input.content,
          input.isQuestion
        );

        return {
          success: true,
          message: input.isQuestion
            ? "Votre question a été envoyée avec succès"
            : "Votre commentaire a été envoyé avec succès",
        };
      } catch (error) {
        console.error("Erreur lors de la création du commentaire:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'envoi du commentaire",
        });
      }
    }),

  /**
   * Récupérer les commentaires d'un dossier (public)
   */
  getComments: publicProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        email: z.string().email(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(5),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Base de données non disponible");
        }

        const comments = await db
          .select()
          .from(evaluationComments)
          .where(eq(evaluationComments.dossierNumber, input.dossierNumber))
          .orderBy(desc(evaluationComments.createdAt));

        // Grouper les commentaires et réponses
        const threaded = comments.map((comment) => ({
          ...comment,
          replies: comments.filter((c) => c.parentCommentId === comment.id),
        }));

        // Retourner uniquement les commentaires principaux
        const mainComments = threaded.filter((c) => !c.parentCommentId);

        // Calculer la pagination
        const total = mainComments.length;
        const totalPages = Math.ceil(total / input.limit);
        const skip = (input.page - 1) * input.limit;
        const paginatedComments = mainComments.slice(skip, skip + input.limit);

        return {
          success: true,
          comments: paginatedComments,
          total,
          page: input.page,
          limit: input.limit,
          totalPages,
          hasMore: input.page < totalPages,
        };
      } catch (error) {
        console.error("Erreur lors de la récupération des commentaires:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des commentaires",
        });
      }
    }),

  /**
   * Répondre à un commentaire (admin only)
   */
  replyToComment: protectedProcedure
    .input(
      z.object({
        parentCommentId: z.number(),
        content: z.string().min(10),
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

        // Récupérer le commentaire parent
        const [parentComment] = await db
          .select()
          .from(evaluationComments)
          .where(eq(evaluationComments.id, input.parentCommentId))
          .limit(1);

        if (!parentComment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Commentaire introuvable" });
        }

        // Insérer la réponse
        await db.insert(evaluationComments).values({
          dossierNumber: parentComment.dossierNumber,
          parentCommentId: input.parentCommentId,
          authorType: "admin",
          authorId: ctx.user.id,
          authorName: ctx.user.name || "Admin",
          authorEmail: ctx.user.email || "admin@3mtravelagency.click",
          content: input.content,
          isQuestion: false,
          isRead: false,
        });

        // Marquer le commentaire parent comme lu
        await db
          .update(evaluationComments)
          .set({ isRead: true, readAt: new Date() })
          .where(eq(evaluationComments.id, input.parentCommentId));

        // Notifier le candidat
        await notifyCandidateReply(
          parentComment.authorEmail,
          parentComment.authorName,
          parentComment.dossierNumber,
          ctx.user.name || "Un conseiller",
          input.content
        );

        return {
          success: true,
          message: "Réponse envoyée avec succès",
        };
      } catch (error) {
        console.error("Erreur lors de la création de la réponse:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'envoi de la réponse",
        });
      }
    }),

  /**
   * Marquer un commentaire comme résolu (admin only)
   */
  markAsResolved: protectedProcedure
    .input(z.object({ commentId: z.number() }))
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
          .update(evaluationComments)
          .set({ isResolved: true, updatedAt: new Date() })
          .where(eq(evaluationComments.id, input.commentId));

        return {
          success: true,
          message: "Commentaire marqué comme résolu",
        };
      } catch (error) {
        console.error("Erreur lors de la mise à jour du commentaire:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du commentaire",
        });
      }
    }),

  /**
   * Lister tous les commentaires non résolus (admin only)
   */
  getUnresolvedComments: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
    }

    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Base de données non disponible");
      }

      const unresolved = await db
        .select()
        .from(evaluationComments)
        .where(
          and(
            eq(evaluationComments.isResolved, false),
            eq(evaluationComments.isQuestion, true)
          )
        )
        .orderBy(desc(evaluationComments.createdAt));

      return {
        success: true,
        comments: unresolved,
        total: unresolved.length,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires non résolus:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la récupération des commentaires",
      });
    }
  }),
});
