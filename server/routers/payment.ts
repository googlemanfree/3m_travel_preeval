/**
 * Routeur tRPC — Paiement des Frais d'Ouverture de Dossier (65 000 XAF)
 * Gère l'initiation, la confirmation et le suivi des paiements
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { applications, clientDocuments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { storagePut } from "../storage";
import { notifyDocumentSubmission } from "../services/documentSubmissionNotification";

const PAYMENT_AMOUNT = 65000; // XAF
const PAYMENT_CURRENCY = "XAF";
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function matchesDocumentSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "application/pdf") return buffer.subarray(0, 4).toString("ascii") === "%PDF";
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer[0] === 0x89 && buffer.subarray(1, 4).toString("ascii") === "PNG";
  return false;
}

function safeDocumentName(fileName: string): string {
  const normalized = fileName.split(/[\\/]/).pop()?.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_") ?? "document";
  if (!normalized || normalized.length > 160) throw new TRPCError({ code: "BAD_REQUEST", message: "Nom de document non valide." });
  return normalized;
}

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

        if (application.email.toLowerCase() !== input.email.trim().toLowerCase()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Les informations de dossier ne correspondent pas." });
        }

        // Vérifier que le dossier n'est pas déjà payé
        if (application.paymentStatus === "SUCCESS") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ce dossier a déjà été payé",
          });
        }

        // Générer un ID de transaction unique
        const transactionId = `TX-3M-${Date.now()}-${randomBytes(16).toString("hex")}`;

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

        // URL interne du tunnel ; le statut final est exclusivement confirmé par CinetPay.
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
   * Vérifier le statut affiché au candidat. Cette procédure ne peut jamais
   * marquer un paiement comme réussi sans confirmation CinetPay côté serveur.
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

        const siteId = process.env.CINETPAY_SITE_ID;
        const apiKey = process.env.CINETPAY_API_KEY;
        if (!siteId || !apiKey) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le contrôle de paiement n’est pas encore configuré." });
        }

        const response = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: input.transactionId }),
        });
        const verification = await response.json() as { code?: string; data?: { status?: string; payment_method?: string; amount?: number | string } };
        const isAccepted = verification.code === "00" && verification.data?.status === "ACCEPTED";
        const expectedAmount = application.paymentAmount ?? PAYMENT_AMOUNT;
        const receivedAmount = verification.data?.amount === undefined ? expectedAmount : Number(verification.data.amount);
        if (!isAccepted || receivedAmount !== expectedAmount) {
          return {
            success: false,
            status: "PENDING" as const,
            message: "Le paiement est en attente de confirmation sécurisée.",
            dossierNumber: input.dossierNumber,
          };
        }

        // Transition atomique vers SUCCESS uniquement après vérification externe.
        await db
          .update(applications)
          .set({
            paymentStatus: "SUCCESS",
            paymentDate: new Date(),
            paymentMethod: verification.data?.payment_method || input.paymentMethod || "CARD",
            dossierStatus: application.agreementSigned && application.evaluationDeliveryStatus === "sent" ? "paye" : application.dossierStatus,
          })
          .where(and(eq(applications.id, application.id), eq(applications.paymentStatus, "PENDING")));

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

  /** Soumettre un document après paiement, pour le propriétaire du dossier uniquement. */
  submitDocument: protectedProcedure
    .input(z.object({
      dossierNumber: z.string(),
      documentType: z.enum(["passport", "diplomas", "birth_certificate", "cv", "employment_letter", "other"]),
      documentName: z.string(),
      fileBase64: z.string().min(1),
      mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const rows = await db.select().from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber)).limit(1);
        const application = rows[0];
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
        if (!ctx.user.email || application.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Vous ne pouvez déposer des documents que pour votre propre dossier." });
        }
        if (application.paymentStatus !== "SUCCESS") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Le dossier doit être payé avant de soumettre des documents" });
        }

        const encodedFile = input.fileBase64.includes(",") ? input.fileBase64.split(",").pop()! : input.fileBase64;
        const fileBuffer = Buffer.from(encodedFile, "base64");
        if (!ALLOWED_DOCUMENT_MIME_TYPES.has(input.mimeType) || fileBuffer.length === 0 || fileBuffer.length > MAX_DOCUMENT_SIZE || !matchesDocumentSignature(fileBuffer, input.mimeType)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Le document doit être un PDF, JPEG ou PNG valide de 5 Mo maximum." });
        }

        const documentType = input.documentType === "diplomas" ? "diploma" : input.documentType;
        const documentName = safeDocumentName(input.documentName);
        const fileKey = `applications/${application.id}/documents/${documentType}/${Date.now()}-${randomBytes(12).toString("hex")}-${documentName}`;
        const { url: documentUrl } = await storagePut(fileKey, fileBuffer, input.mimeType);
        const receiptNumber = `DOC-${Date.now()}-${randomBytes(6).toString("hex")}`;

        await db.insert(clientDocuments).values({
          evaluationId: 0,
          candidateEmail: ctx.user.email,
          documentType: documentType as any,
          documentName,
          documentUrl,
          fileSize: fileBuffer.length,
          status: "pending",
          source: "online",
          receiptNumber,
          receiptGeneratedAt: new Date(),
        });

        void notifyDocumentSubmission({
          candidateEmail: ctx.user.email,
          documentType,
          documentName,
          receiptNumber,
          dossierNumber: application.dossierNumber,
        }).catch(error => console.error("[DocumentAlert] Échec de notification :", error));

        return { success: true, message: "Document soumis avec succès", documentType };
      } catch (err) {
        console.error("[Submit Document] Error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la soumission du document" });
      }
    }),

  /** Récupérer les documents du propriétaire du dossier uniquement. */
  getSubmittedDocuments: protectedProcedure
    .input(z.object({ dossierNumber: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const rows = await db.select().from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber)).limit(1);
        const application = rows[0];
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
        if (!ctx.user.email || application.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Vous ne pouvez consulter que vos propres documents." });
        }

        const documents = await db.select().from(clientDocuments)
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
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la récupération des documents" });
      }
    }),
});
