/**
 * Routeur tRPC pour le Module de Traduction Certifiée
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import {
  calculateTranslationPrice,
  createTranslationRequest,
  validateTranslationPayment,
  uploadTranslatedDocument,
  getAvailableLanguages,
} from "../translationService";
import { translationRequests, translationDownloadLogs } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const translationRouter = router({
  getLanguages: publicProcedure.query(async () => {
    return await getAvailableLanguages();
  }),

  calculatePrice: publicProcedure
    .input(
      z.object({
        documentType: z.string(),
        sourceLanguageCode: z.string(),
        targetLanguageCode: z.string(),
        numberOfPages: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      const pricing = await calculateTranslationPrice(input);
      if (!pricing) {
        throw new Error("Tarification non disponible pour cette combinaison");
      }
      return pricing;
    }),

  createRequest: protectedProcedure
    .input(
      z.object({
        documentType: z.string(),
        sourceLanguageCode: z.string(),
        targetLanguageCode: z.string(),
        numberOfPages: z.number().int().positive(),
        sourceDocumentUrl: z.string().url(),
        sourceDocumentName: z.string(),
        sourceDocumentSize: z.number().optional(),
        evaluationId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await createTranslationRequest({
        candidateEmail: ctx.user.email || "",
        candidateName: ctx.user.name || "Client",
        candidatePhone: ctx.user.email?.split('@')[0] || undefined,  // Placeholder
        ...input,
      });

      if (!result) {
        throw new Error("Erreur lors de la création de la demande");
      }

      return result;
    }),

  validatePayment: protectedProcedure
    .input(
      z.object({
        translationRequestId: z.number(),
        paymentTransactionId: z.string(),
        paymentMethod: z.string(),
        invoiceNumber: z.string(),
        invoiceUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await validateTranslationPayment(input);
    }),

  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = getDb();
      const requests = await db.query.translationRequests.findMany({
        where: eq(translationRequests.candidateEmail, ctx.user.email || ""),
      });
      return requests;
    } catch (err) {
      console.error("[Translation Get Requests Error]", err);
      return [];
    }
  }),

  getRequest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = getDb();
        const request = await db.query.translationRequests.findFirst({
          where: and(
            eq(translationRequests.id, input.id),
            eq(translationRequests.candidateEmail, ctx.user.email || "")
          ),
        });
        return request || null;
      } catch (err) {
        console.error("[Translation Get Request Error]", err);
        return null;
      }
    }),

  uploadTranslated: protectedProcedure
    .input(
      z.object({
        translationRequestId: z.number(),
        translatedDocumentUrl: z.string().url(),
        translatedDocumentName: z.string(),
        translatedDocumentSize: z.number().optional(),
        translatorNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Vérifier que l'utilisateur est traducteur
      if (ctx.user.role !== "admin") {
        throw new Error("Accès réservé aux traducteurs");
      }

      return await uploadTranslatedDocument({
        ...input,
        translatorEmail: ctx.user.email || "",
      });
    }),

  downloadTranslated: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = getDb();
        // Vérifier que le client est propriétaire de la demande
        const request = await db.query.translationRequests.findFirst({
          where: and(
            eq(translationRequests.id, input.id),
            eq(translationRequests.candidateEmail, ctx.user.email || ""),
            eq(translationRequests.status, "completed")
          ),
        });

        if (!request || !request.translatedDocumentUrl) {
          throw new Error("Document non disponible");
        }

        // Enregistrer le téléchargement dans les logs
        await db.insert(translationDownloadLogs).values({
          translationRequestId: input.id,
          candidateEmail: ctx.user.email || "",
          ipAddress: ctx.req?.ip,
          userAgent: ctx.req?.headers["user-agent"],
        });

        return {
          url: request.translatedDocumentUrl,
          name: request.translatedDocumentName,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
        console.error("[Translation Download Error]", errorMsg);
        throw new Error(errorMsg);
      }
    }),

  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    // Vérifier que l'utilisateur est admin
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
    }

    try {
      const db = getDb();
      const requests = await db.query.translationRequests.findMany({
        where: eq(translationRequests.status, "pending_translation"),
      });
      return requests;
    } catch (err) {
      console.error("[Translation Pending Requests Error]", err);
      return [];
    }
  }),

  markInProgress: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      try {
        const db = getDb();
        await db
          .update(translationRequests)
          .set({
            status: "in_progress",
            assignedToTranslator: ctx.user.email,
          })
          .where(eq(translationRequests.id, input.id));

        return { success: true };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
        console.error("[Translation Mark In Progress Error]", errorMsg);
        return { success: false, error: errorMsg };
      }
    }),
});
