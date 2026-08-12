/**
 * Routeur tRPC — Gestion des Documents et Paiements Clients
 * Permet aux clients de soumettre des documents et des paiements
 * Permet aux admins de valider et générer des décharges/factures
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { evaluations, clientDocuments, clientPayments, paymentAuditLogs } from "../../drizzle/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { analyzePassportDocument } from "../services/passportAnalyzer";
import { notifyDocumentSubmission } from "../services/documentSubmissionNotification";
import { randomBytes } from "node:crypto";
import { candidateProcedure } from "./candidate";

async function assertOwnedEvaluation(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, evaluationId: number, candidateId: number, candidateEmail: string) {
  const owned = await db.select({ id: evaluations.id }).from(evaluations).where(and(eq(evaluations.id, evaluationId), or(eq(evaluations.candidateId, candidateId), eq(evaluations.email, candidateEmail)))).limit(1);
  if (!owned.length) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable ou non autorisée" });
}

export const clientDocumentsRouter = router({
  /**
   * Analyser automatiquement un scan de passeport
   */
  analyzePassport: publicProcedure
    .input(z.object({
      fileName: z.string().optional(),
      fileUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await analyzePassportDocument(undefined, input.fileName);
      return result;
    }),
  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENTS CLIENTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Soumettre un document (côté client)
   */
  submitDocument: candidateProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email().optional(),
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
      readabilityScore: z.number().int().optional(),
      readabilityIssues: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      await assertOwnedEvaluation(db, input.evaluationId, ctx.candidate.id, ctx.candidate.email);

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

	      const receiptNumber = `REC-${Date.now()}-${randomBytes(6).toString("hex")}`;
	      // ⚠️ La prévalidation automatique reste désactivée tant que
	      // l'analyse de lisibilité n'examine pas réellement le contenu du fichier
	      // (vérification humaine obligatoire pour tous les documents).
	      const isPassportPrevalidated = false;
	      const analysisPayload = input.readabilityIssues && typeof input.readabilityIssues === "object"
	        ? {
	          ...input.readabilityIssues,
	          prevalidated: {
	            eligible: false,
	            reason: "Prévalidation automatique désactivée — vérification humaine requise pour tous les documents.",
	            at: new Date().toISOString(),
	          },
	        }
	        : input.readabilityIssues ?? null;

	      await db.insert(clientDocuments).values({
          evaluationId: input.evaluationId,
          candidateEmail: ctx.candidate.email,
          documentType: input.documentType as any,
          documentName: input.documentName,
	        documentUrl: input.documentUrl,
	        fileSize: input.fileSize,
	        readabilityScore: input.readabilityScore,
	        readabilityIssues: analysisPayload,
	        status: isPassportPrevalidated ? "verified" : "pending",
	        verificationStatus: isPassportPrevalidated ? "approved" : "pending",
	        verificationComment: isPassportPrevalidated
	          ? `Prévalidation automatique du contrôle de lisibilité (${input.readabilityScore} %). Une révision humaine reste possible.`
	          : null,
	        verifiedByAdmin: isPassportPrevalidated ? "Système — contrôle de lisibilité" : null,
	        verifiedAt: isPassportPrevalidated ? new Date() : null,
	        receiptNumber,
	        receiptGeneratedAt: new Date(),
	      });

	      void notifyDocumentSubmission({
        candidateEmail: ctx.candidate.email,
	        documentType: input.documentType,
	        documentName: input.documentName,
	        receiptNumber,
	      }).catch(error => console.error("[DocumentAlert] Échec de notification :", error));

        return {
	        success: true,
	        message: "Document soumis avec succès",
	        receiptNumber,
	        prevalidated: isPassportPrevalidated,
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
  getDocuments: candidateProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await assertOwnedEvaluation(db, input.evaluationId, ctx.candidate.id, ctx.candidate.email);
        const docs = await db
          .select()
          .from(clientDocuments)
          .where(
            and(
              eq(clientDocuments.evaluationId, input.evaluationId),
              eq(clientDocuments.candidateEmail, ctx.candidate.email)
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

  // ─────────────────────────────────────────────────────────────────────────
  // PAIEMENTS CLIENTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Soumettre un paiement (côté client)
   */
  submitPayment: publicProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email(),
      amount: z.number().positive(),
      currency: z.string().default("EUR"),
      paymentMethod: z.enum(["bank_transfer", "card", "mobile_money", "other"]),
      paymentDescription: z.string(),
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

        await db.insert(clientPayments).values({
          evaluationId: input.evaluationId,
          candidateEmail: input.candidateEmail,
          amount: parseFloat(input.amount.toString()),
          currency: input.currency,
          paymentMethod: input.paymentMethod as any,
          paymentDescription: input.paymentDescription,
          status: "pending" as any,
        });

        return {
          success: true,
          message: "Paiement soumis avec succès. En attente de confirmation.",
        };
      } catch (err) {
        console.error("[Submit Payment] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la soumission du paiement",
        });
      }
    }),

  /**
   * Récupérer les paiements d'une évaluation
   */
  getPayments: candidateProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await assertOwnedEvaluation(db, input.evaluationId, ctx.candidate.id, ctx.candidate.email);
        const payments = await db
          .select()
          .from(clientPayments)
          .where(
            and(
              eq(clientPayments.evaluationId, input.evaluationId),
              eq(clientPayments.candidateEmail, ctx.candidate.email)
            )
          )
          .orderBy(desc(clientPayments.createdAt));

        return payments;
      } catch (err) {
        console.error("[Get Payments] Error:", err);
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
        const paymentRows = await db
          .select()
          .from(clientPayments)
          .where(eq(clientPayments.id, input.paymentId))
          .limit(1);
        const payment = paymentRows[0];
        if (!payment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Paiement introuvable" });
        }

        // Générer un numéro de facture unique si confirmé
        const invoiceNumber = input.invoiceNumber || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await db
          .update(clientPayments)
          .set({
            status: input.status as any,
            adminNotes: input.adminNotes,
            confirmedByAdmin: input.status === "confirmed" || input.status === "verified",
            invoiceNumber: input.status === "confirmed" ? invoiceNumber : undefined,
            invoiceGeneratedAt: input.status === "confirmed" ? new Date() : undefined,
          })
          .where(eq(clientPayments.id, input.paymentId));

        await db.insert(paymentAuditLogs).values({
          adminName: ctx.user.name || "Administrateur",
          adminEmail: ctx.user.email || "",
          action: input.status,
          paymentId: payment.id,
          candidateEmail: payment.candidateEmail,
          amount: `${payment.amount} ${payment.currency}`,
          details: input.adminNotes || `Validation du paiement avec le statut ${input.status}`,
        });

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

  getPaymentAuditLogs: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(200) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      return db.select().from(paymentAuditLogs).orderBy(desc(paymentAuditLogs.createdAt)).limit(input.limit);
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // GESTION HYBRIDE — ENREGISTREMENT MANUEL PAR L'ADMIN (AGENCE PHYSIQUE)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Admin : Enregistrer manuellement un document reçu en agence (papier numérisé)
   */
  adminAddDocument: protectedProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email(),
      documentType: z.string(),
      documentName: z.string(),
      documentUrl: z.string().url().optional(),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
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
          receivedByAdmin: true,
          adminNotes: input.adminNotes || "Enregistré manuellement par l'admin en agence",
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

  /**
   * Admin : Enregistrer manuellement un paiement reçu en agence (cash, chèque, etc.)
   */
  adminAddPayment: protectedProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      candidateEmail: z.string().email(),
      amount: z.number().positive(),
      currency: z.string().default("EUR"),
      paymentMethod: z.enum(["cash", "bank_transfer", "card", "mobile_money", "check", "other"]),
      paymentDescription: z.string(),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await db.insert(clientPayments).values({
          evaluationId: input.evaluationId,
          candidateEmail: input.candidateEmail,
          amount: parseFloat(input.amount.toString()),
          currency: input.currency,
          paymentMethod: input.paymentMethod as any,
          paymentDescription: input.paymentDescription,
          status: "confirmed" as any,
          confirmedByAdmin: true,
          adminNotes: input.adminNotes || `Paiement en ${input.paymentMethod} enregistré en agence`,
          invoiceNumber,
          invoiceGeneratedAt: new Date(),
        });

        const createdPayment = await db
          .select({ id: clientPayments.id })
          .from(clientPayments)
          .where(
            and(
              eq(clientPayments.candidateEmail, input.candidateEmail),
              eq(clientPayments.invoiceNumber, invoiceNumber)
            )
          )
          .orderBy(desc(clientPayments.createdAt))
          .limit(1);

        if (createdPayment[0]) {
          await db.insert(paymentAuditLogs).values({
            adminName: ctx.user.name || "Administrateur",
            adminEmail: ctx.user.email || "",
            action: "confirmed",
            paymentId: createdPayment[0].id,
            candidateEmail: input.candidateEmail,
            amount: `${input.amount} ${input.currency}`,
            details: input.adminNotes || `Paiement en ${input.paymentMethod} enregistré en agence`,
          });
        }

        return {
          success: true,
          message: "Paiement enregistré avec succès",
          invoiceNumber,
        };
      } catch (err) {
        console.error("[Admin Add Payment] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'enregistrement du paiement",
        });
      }
    }),
});
