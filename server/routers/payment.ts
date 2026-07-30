/**
 * Routeur tRPC — Paiement des Frais d'Ouverture de Dossier (65 000 XAF)
 * Gère l'initiation, la confirmation et le suivi des paiements
 */

import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { applications, clientDocuments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const PAYMENT_AMOUNT = 65000; // XAF
const PAYMENT_CURRENCY = "XAF";

export const paymentRouter = router({
  /**
   * Initier un paiement pour un dossier (65 000 XAF)
   */
  initiateFolderPayment: publicProcedure
    .input(z.object({
      dossierNumber: z.string(),
      email: z.string().email(),
      fullName: z.string(),
      whatsappNumber: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Vérifier que le dossier existe
        const app = await db
          .select()
          .from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber))
          .limit(1);

        if (app.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
        }

        const application = app[0];

        // Vérifier que le dossier n'est pas déjà payé
        if (application.paymentStatus === "SUCCESS") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ce dossier a déjà été payé",
          });
        }

        // Générer un ID de transaction unique
        const transactionId = `TX-3M-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Mettre à jour le statut de paiement en attente
        await db
          .update(applications)
          .set({
            paymentStatus: "PENDING",
            paymentTransactionId: transactionId,
            paymentAmount: PAYMENT_AMOUNT,
            paymentCurrency: PAYMENT_CURRENCY,
            paymentMethod: null,
          })
          .where(eq(applications.id, application.id));

        // Générer l'URL de paiement (simulée pour le moment)
        const paymentUrl = `https://www.3mtravelagency.click/checkout?tx=${transactionId}&dossier=${encodeURIComponent(input.dossierNumber)}`;

        return {
          success: true,
          amount: PAYMENT_AMOUNT,
          currency: PAYMENT_CURRENCY,
          transactionId,
          paymentUrl,
          dossierNumber: input.dossierNumber,
          message: "Paiement initié avec succès",
        };
      } catch (err) {
        console.error("[Initiate Payment] Error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'initiation du paiement",
        });
      }
    }),

  /**
   * Confirmer un paiement (appelé par le webhook ou manuellement)
   */
  confirmPayment: publicProcedure
    .input(z.object({
      transactionId: z.string(),
      dossierNumber: z.string(),
      paymentMethod: z.enum(["ORANGE_MONEY", "MTN_MOMO", "CARD"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Vérifier que le dossier existe et que la transaction correspond
        const app = await db
          .select()
          .from(applications)
          .where(
            and(
              eq(applications.dossierNumber, input.dossierNumber),
              eq(applications.paymentTransactionId, input.transactionId)
            )
          )
          .limit(1);

        if (app.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Transaction introuvable" });
        }

        const application = app[0];

        // Mettre à jour le statut de paiement à SUCCESS
        await db
          .update(applications)
          .set({
            paymentStatus: "SUCCESS",
            paymentDate: new Date(),
            paymentMethod: input.paymentMethod || "CARD",
            dossierStatus: "documents_recus", // Débloquer le dossier
          })
          .where(eq(applications.id, application.id));

        return {
          success: true,
          message: "Paiement confirmé avec succès",
          dossierNumber: input.dossierNumber,
          amount: PAYMENT_AMOUNT,
          currency: PAYMENT_CURRENCY,
          transactionId: input.transactionId,
        };
      } catch (err) {
        console.error("[Confirm Payment] Error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la confirmation du paiement",
        });
      }
    }),

  /**
   * Récupérer le statut de paiement d'un dossier
   */
  getPaymentStatus: publicProcedure
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
          throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
        }

        const application = app[0];

        return {
          dossierNumber: application.dossierNumber,
          paymentStatus: application.paymentStatus,
          paymentAmount: application.paymentAmount,
          paymentCurrency: application.paymentCurrency,
          paymentDate: application.paymentDate,
          paymentMethod: application.paymentMethod,
          isPaid: application.paymentStatus === "SUCCESS",
          canSubmitDocuments: application.paymentStatus === "SUCCESS",
        };
      } catch (err) {
        console.error("[Get Payment Status] Error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération du statut de paiement",
        });
      }
    }),

  /**
   * Soumettre un document (après paiement)
   */
  submitDocument: publicProcedure
    .input(z.object({
      dossierNumber: z.string(),
      email: z.string().email(),
      documentType: z.enum([
        "passport",
        "diplomas",
        "birth_certificate",
        "cv",
        "employment_letter",
        "other",
      ]),
      documentName: z.string(),
      documentUrl: z.string().url(),
      fileSize: z.number().int().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Vérifier que le dossier existe et est payé
        const app = await db
          .select()
          .from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber))
          .limit(1);

        if (app.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
        }

        const application = app[0];

        // Vérifier que le paiement est effectué
        if (application.paymentStatus !== "SUCCESS") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Le dossier doit être payé avant de soumettre des documents",
          });
        }

        // Insérer le document
        await db.insert(clientDocuments).values({
          evaluationId: 0,
          candidateEmail: input.email,
          documentType: input.documentType as any,
          documentName: input.documentName,
          documentUrl: input.documentUrl,
          fileSize: input.fileSize,
          status: "pending",
          source: "online",
          receiptNumber: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          receiptGeneratedAt: new Date(),
        });

        return {
          success: true,
          message: "Document soumis avec succès",
          documentType: input.documentType,
        };
      } catch (err) {
        console.error("[Submit Document] Error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la soumission du document",
        });
      }
    }),

  /**
   * Récupérer les documents soumis pour un dossier
   */
  getSubmittedDocuments: publicProcedure
    .input(z.object({
      dossierNumber: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Récupérer l'application
        const app = await db
          .select()
          .from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber))
          .limit(1);

        if (app.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
        }

        const application = app[0];

        // Récupérer les documents du candidat
        const documents = await db
          .select()
          .from(clientDocuments)
          .where(eq(clientDocuments.candidateEmail, application.email));

        return {
          dossierNumber: input.dossierNumber,
          documents: documents.map((doc) => ({
            id: doc.id,
            documentType: doc.documentType,
            documentName: doc.documentName,
            documentUrl: doc.documentUrl,
            status: doc.status,
            submittedAt: doc.receiptGeneratedAt,
            verifiedAt: doc.verifiedAt,
          })),
        };
      } catch (err) {
        console.error("[Get Submitted Documents] Error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des documents",
        });
      }
    }),
});
