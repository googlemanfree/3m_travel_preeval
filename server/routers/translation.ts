/**
 * Routeur tRPC — Gestion des Documents et Paiements Clients
 * Permet aux clients de soumettre des documents et des paiements
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { evaluations, clientDocuments } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const clientDocumentsRouter = router({
  /**
   * Soumettre un document (côté client)
   */
  submitDocument: publicProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email(),
      documentType: z.enum([
        "passport",
        "cv",
        "diploma",
        "birth_certificate",
        "marriage_certificate",
        "bank_statement",
        "employment_letter",
        "language_test",
        "medical_exam",
        "police_clearance",
        "other"
      ]),
      documentName: z.string(),
      documentUrl: z.string().url(),
      fileSize: z.number().int().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Vérifier que l'évaluation existe
        const evals = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.id, input.evaluationId))
          .limit(1);

        if (evals.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation non trouvée" });
        }

        const receiptNumber = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await db.insert(clientDocuments).values({
          evaluationId: input.evaluationId,
          candidateEmail: input.candidateEmail,
          documentType: input.documentType as any,
          documentName: input.documentName,
          documentUrl: input.documentUrl,
          fileSize: input.fileSize,
          status: "pending",
          receiptNumber,
          receiptGeneratedAt: new Date(),
        });

        return {
          success: true,
          message: "Document soumis avec succès",
          receiptNumber,
        };
      } catch (err) {
        console.error("[Submit Document] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la soumission du document",
        });
      }
    }),

  /**
   * Récupérer les documents d'une évaluation
   */
  getDocuments: publicProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const docs = await db
          .select()
          .from(clientDocuments)
          .where(
            and(
              eq(clientDocuments.evaluationId, input.evaluationId),
              eq(clientDocuments.candidateEmail, input.candidateEmail)
            )
          )
          .orderBy(desc(clientDocuments.createdAt));

        return docs;
      } catch (err) {
        console.error("[Get Documents] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des documents",
        });
      }
    }),

  /**
   * Admin : Enregistrer manuellement un document reçu en agence
   */
  adminAddDocument: protectedProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email(),
      documentType: z.string(),
      documentName: z.string(),
      documentUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const receiptNumber = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await db.insert(clientDocuments).values({
          evaluationId: input.evaluationId,
          candidateEmail: input.candidateEmail,
          documentType: input.documentType as any,
          documentName: input.documentName,
          documentUrl: input.documentUrl,
          status: "received",
          receiptNumber,
          receiptGeneratedAt: new Date(),
        });

        return {
          success: true,
          message: "Document enregistré avec succès",
          receiptNumber,
        };
      } catch (err) {
        console.error("[Admin Add Document] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'enregistrement du document",
        });
      }
    }),
});

export default clientDocumentsRouter;
