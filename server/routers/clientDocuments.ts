/**
 * Routeur tRPC — Gestion des Documents et Paiements Clients
 * Permet aux clients de soumettre des documents et des paiements
 * Permet aux admins de valider et générer des décharges/factures
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { clientDocuments, clientPayments, evaluations } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const clientDocumentsRouter = router({
  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENTS CLIENTS
  // ─────────────────────────────────────────────────────────────────────────

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
        const eval_ = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.id, input.evaluationId))
          .limit(1);

        if (eval_.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation non trouvée" });
        }

        // Créer le document
        await db.insert(clientDocuments).values({
          evaluationId: input.evaluationId,
          candidateEmail: input.candidateEmail,
          documentType: input.documentType,
          documentName: input.documentName,
          documentUrl: input.documentUrl,
          fileSize: input.fileSize,
          status: "pending",
        });

        return {
          success: true,
          message: "Document soumis avec succès. L'admin le validera bientôt.",
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
   * Récupérer les documents d'une évaluation (côté client)
   */
  getDocumentsByEvaluation: publicProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const documents = await db
          .select()
          .from(clientDocuments)
          .where(
            and(
              eq(clientDocuments.evaluationId, input.evaluationId),
              eq(clientDocuments.candidateEmail, input.candidateEmail)
            )
          )
          .orderBy(desc(clientDocuments.createdAt));

        return {
          success: true,
          documents,
          count: documents.length,
        };
      } catch (err) {
        console.error("[Get Documents] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des documents",
        });
      }
    }),

  /**
   * Récupérer les documents en attente de validation (côté admin)
   */
  getPendingDocuments: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const documents = await db
          .select()
          .from(clientDocuments)
          .where(eq(clientDocuments.status, "pending"))
          .orderBy(desc(clientDocuments.createdAt))
          .limit(100);

        return {
          success: true,
          documents,
          count: documents.length,
        };
      } catch (err) {
        console.error("[Get Pending Documents] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des documents",
        });
      }
    }),

  /**
   * Valider un document et générer une décharge (côté admin)
   */
  validateDocument: protectedProcedure
    .input(z.object({
      documentId: z.number().int(),
      status: z.enum(["received", "verified", "rejected"]),
      adminNotes: z.string().optional(),
      receiptNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Générer un numéro de décharge unique si reçu
        const receiptNumber = input.receiptNumber || `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await db
          .update(clientDocuments)
          .set({
            status: input.status,
            adminNotes: input.adminNotes,
            receivedByAdmin: input.status === "received" || input.status === "verified",
            receiptNumber: input.status === "received" ? receiptNumber : undefined,
            receiptGeneratedAt: input.status === "received" ? new Date() : undefined,
          })
          .where(eq(clientDocuments.id, input.documentId));

        return {
          success: true,
          message: `Document ${input.status === "received" ? "reçu" : input.status === "verified" ? "vérifié" : "rejeté"} avec succès`,
          receiptNumber: input.status === "received" ? receiptNumber : undefined,
        };
      } catch (err) {
        console.error("[Validate Document] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la validation du document",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // PAIEMENTS CLIENTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Enregistrer un paiement (côté client ou admin)
   */
  submitPayment: publicProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email(),
      amount: z.number().positive(),
      currency: z.string().default("EUR"),
      paymentMethod: z.enum(["cash", "bank_transfer", "card", "mobile_money", "check", "other"]),
      paymentDescription: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Vérifier que l'évaluation existe
        const eval_ = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.id, input.evaluationId))
          .limit(1);

        if (eval_.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation non trouvée" });
        }

        // Créer le paiement
        await db.insert(clientPayments).values({
          evaluationId: input.evaluationId,
          candidateEmail: input.candidateEmail,
          amount: input.amount.toString(),
          currency: input.currency,
          paymentMethod: input.paymentMethod,
          paymentDescription: input.paymentDescription,
          status: "pending",
        });

        return {
          success: true,
          message: "Paiement enregistré. L'admin le confirmera bientôt.",
        };
      } catch (err) {
        console.error("[Submit Payment] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'enregistrement du paiement",
        });
      }
    }),

  /**
   * Récupérer les paiements d'une évaluation (côté client)
   */
  getPaymentsByEvaluation: publicProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const payments = await db
          .select()
          .from(clientPayments)
          .where(
            and(
              eq(clientPayments.evaluationId, input.evaluationId),
              eq(clientPayments.candidateEmail, input.candidateEmail)
            )
          )
          .orderBy(desc(clientPayments.createdAt));

        return {
          success: true,
          payments,
          count: payments.length,
          totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount as any), 0),
        };
      } catch (err) {
        console.error("[Get Payments] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des paiements",
        });
      }
    }),

  /**
   * Récupérer les paiements en attente de confirmation (côté admin)
   */
  getPendingPayments: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const payments = await db
          .select()
          .from(clientPayments)
          .where(eq(clientPayments.status, "pending"))
          .orderBy(desc(clientPayments.createdAt))
          .limit(100);

        const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount as any), 0);

        return {
          success: true,
          payments,
          count: payments.length,
          totalAmount,
        };
      } catch (err) {
        console.error("[Get Pending Payments] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des paiements",
        });
      }
    }),

  /**
   * Confirmer un paiement et générer une facture (côté admin)
   */
  confirmPayment: protectedProcedure
    .input(z.object({
      paymentId: z.number().int(),
      status: z.enum(["confirmed", "verified", "cancelled"]),
      adminNotes: z.string().optional(),
      invoiceNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Générer un numéro de facture unique si confirmé
        const invoiceNumber = input.invoiceNumber || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await db
          .update(clientPayments)
          .set({
            status: input.status,
            adminNotes: input.adminNotes,
            confirmedByAdmin: input.status === "confirmed" || input.status === "verified",
            invoiceNumber: input.status === "confirmed" ? invoiceNumber : undefined,
            invoiceGeneratedAt: input.status === "confirmed" ? new Date() : undefined,
          })
          .where(eq(clientPayments.id, input.paymentId));

        return {
          success: true,
          message: `Paiement ${input.status === "confirmed" ? "confirmé" : input.status === "verified" ? "vérifié" : "annulé"} avec succès`,
          invoiceNumber: input.status === "confirmed" ? invoiceNumber : undefined,
        };
      } catch (err) {
        console.error("[Confirm Payment] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la confirmation du paiement",
        });
      }
    }),
});
