import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and, SQL } from "drizzle-orm";
import * as drizzleSchema from "../../drizzle/schema";
import { getDb } from "../db";
import { sendEmail } from "../_core/email";

export const translationRouter = router({
  createTranslationRequest: publicProcedure
    .input(z.object({
      documentType: z.enum([
        "birth_certificate",
        "diploma",
        "transcript",
        "criminal_record",
        "marriage_certificate",
        "divorce_decree",
        "employment_letter",
        "bank_statement",
        "passport",
        "driver_license",
        "medical_report",
        "other"
      ]),
      sourceLanguage: z.string().max(10),
      targetLanguage: z.string().max(10),
      fileUrl: z.string().url(),
      fileName: z.string().max(255),
      fileSize: z.number(),
      numberOfPages: z.number(),
      pricePerPage: z.number(),
      totalPrice: z.string().max(50),
      currency: z.string().max(10),
      candidateName: z.string().max(255),
      email: z.string().email().max(320),
      whatsapp: z.string().max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const newRequest = await db.insert(drizzleSchema.translationRequests).values({
        documentType: input.documentType,
        sourceLanguageCode: input.sourceLanguage,
        targetLanguageCode: input.targetLanguage,
        sourceDocumentUrl: input.fileUrl,
        sourceDocumentName: input.fileName,
        sourceDocumentSize: input.fileSize,
        numberOfPages: input.numberOfPages,
        pricePerPage: input.pricePerPage.toString(),
        totalPrice: input.totalPrice.toString(),
        currency: input.currency,
        candidateName: input.candidateName,
        candidateEmail: input.email,
        candidatePhone: input.whatsapp,
        status: "pending_payment",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return newRequest[0];
    }),

  getTranslationRequests: protectedProcedure
    .input(z.object({
      status: z.enum(["pending_payment", "pending_translation", "in_progress", "completed", "rejected"]).optional(),
      email: z.string().email().max(320).optional(),
      assignedToTranslator: z.string().email().max(320).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx;
      if (!db) throw new Error("Database not available");
  
      if (!user || (user.role !== "admin" && user.role !== "translator")) {
        throw new Error("Unauthorized");
      }
  
      const conditions = [
        user.role === "translator" && user.email ? eq(drizzleSchema.translationRequests.assignedToTranslator, user.email) : undefined,
        input.status ? eq(drizzleSchema.translationRequests.status, input.status) : undefined,
        input.email ? eq(drizzleSchema.translationRequests.candidateEmail, input.email) : undefined,
        input.assignedToTranslator ? eq(drizzleSchema.translationRequests.assignedToTranslator, input.assignedToTranslator) : undefined,
      ].filter(Boolean) as SQL[];
  
      if (conditions.length > 0) {
        return db.select().from(drizzleSchema.translationRequests).where(and(...conditions));
      } else {
        return db.select().from(drizzleSchema.translationRequests);
      }
    }),

  getTranslationPricing: publicProcedure
    .input(z.object({
      documentType: z.enum([
        "birth_certificate",
        "diploma",
        "transcript",
        "criminal_record",
        "marriage_certificate",
        "divorce_decree",
        "employment_letter",
        "bank_statement",
        "passport",
        "driver_license",
        "medical_report",
        "other"
      ]),
      sourceLanguage: z.string().max(10),
      targetLanguage: z.string().max(10),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const pricing = await db.select().from(drizzleSchema.translationPricing).where(
        and(
          eq(drizzleSchema.translationPricing.documentType, input.documentType),
          eq(drizzleSchema.translationPricing.sourceLanguageCode, input.sourceLanguage),
          eq(drizzleSchema.translationPricing.targetLanguageCode, input.targetLanguage)
        )
      ).limit(1);
      return pricing.length > 0 ? pricing[0] : null;
    }),

  validateTranslationPayment: publicProcedure
    .input(z.object({
      requestId: z.number(),
      transactionId: z.string().max(64),
      paymentMethod: z.string().max(50),
      amount: z.string().max(50),
      currency: z.string().max(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
  
      const request = await db.select().from(drizzleSchema.translationRequests).where(
        eq(drizzleSchema.translationRequests.id, input.requestId)
      ).limit(1);
  
      if (!request || request.length === 0) {
        throw new Error("Translation request not found");
      }
  
      await db.update(drizzleSchema.translationRequests).set({
        paymentStatus: "completed",
        paymentTransactionId: input.transactionId,
        paymentMethod: input.paymentMethod,
        paymentDate: new Date(),
        totalPrice: input.amount,
        currency: input.currency,
        status: "pending_translation", // Move to next stage after payment
        updatedAt: new Date(),
      }).where(eq(drizzleSchema.translationRequests.id, input.requestId));
  
      // Send payment confirmation to client
      const req = request[0];
      if (req.candidateEmail) {
        try {
          await sendEmail({
            to: req.candidateEmail,
            subject: "Paiement reçu — Traduction de document 3M Travel",
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:32px;text-align:center;color:#fff"><h1 style="margin:0;font-size:20px">Paiement confirmé ✅</h1></div><div style="padding:32px;background:#f9fafb"><p>Bonjour <strong>${req.candidateName || req.candidateEmail}</strong>,</p><p>Nous avons bien reçu votre paiement de <strong>${req.totalPrice} ${req.currency}</strong> pour la traduction de votre document.</p><p>Notre équipe prend en charge votre demande et vous transmettra le document traduit dans les meilleurs délais.</p><p>Pour toute question : <strong>+237 698 104 832</strong> (WhatsApp)</p></div><div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px">3M Travel &amp; Services SARL — <a href="https://www.3mtravelagency.com">www.3mtravelagency.com</a></div></div>`,
          });
        } catch (emailErr) {
          console.warn("[translation] Payment confirmation email failed:", emailErr);
        }
      }

      return { success: true };
    }),

  uploadTranslatedDocument: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      translatedDocumentUrl: z.string().url(),
      translatedDocumentName: z.string(),
      translatedDocumentSize: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      if (!db) throw new Error("Database not available");
  
      if (!user || user.role !== "admin" && user.role !== "translator") {
        throw new Error("Unauthorized");
      }
  
      const request = await db.select().from(drizzleSchema.translationRequests).where(
        eq(drizzleSchema.translationRequests.id, input.requestId)
      ).limit(1);
  
      if (!request || request.length === 0) {
        throw new Error("Translation request not found");
      }
  
      await db.update(drizzleSchema.translationRequests).set({
        translatedDocumentUrl: input.translatedDocumentUrl,
        translatedDocumentName: input.translatedDocumentName,
        translatedDocumentSize: input.translatedDocumentSize,
        status: "completed",
        completionDate: new Date(),
        updatedAt: new Date(),
      }).where(eq(drizzleSchema.translationRequests.id, input.requestId));
  
      // Notify client that their translation is ready
      const completedReq = request[0];
      if (completedReq.candidateEmail) {
        try {
          await sendEmail({
            to: completedReq.candidateEmail,
            subject: "Votre traduction est prête — 3M Travel",
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:32px;text-align:center;color:#fff"><h1 style="margin:0;font-size:20px">Votre document traduit est disponible</h1></div><div style="padding:32px;background:#f9fafb"><p>Bonjour <strong>${completedReq.candidateName || completedReq.candidateEmail}</strong>,</p><p>La traduction de votre document <strong>${completedReq.sourceDocumentName || "document"}</strong> est terminée et disponible au téléchargement.</p><p style="text-align:center;margin:24px 0"><a href="${input.translatedDocumentUrl}" style="background:linear-gradient(135deg,#1E3A8A,#2563EB);color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;display:inline-block">Télécharger le document traduit</a></p><p>Pour toute question : <strong>+237 698 104 832</strong> (WhatsApp)</p></div><div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px">3M Travel &amp; Services SARL — <a href="https://www.3mtravelagency.com">www.3mtravelagency.com</a></div></div>`,
          });
        } catch (emailErr) {
          console.warn("[translation] Completion notification email failed:", emailErr);
        }
      }

      return { success: true };
    }),

  downloadTranslatedDocument: publicProcedure
    .input(z.object({
      requestId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
  
      const request = await db.select().from(drizzleSchema.translationRequests).where(
        eq(drizzleSchema.translationRequests.id, input.requestId)
      ).limit(1);
  
      if (!request || request.length === 0) {
        throw new Error("Translation request not found");
      }
  
      const translation = request[0];
  
      if (translation.status !== "completed" || !translation.translatedDocumentUrl) {
        throw new Error("Translated document not available for download");
      }
  
      // TODO: Implement secure, temporary URL generation for download
      // For now, returning the direct URL (which should be S3 pre-signed URL)
      return { url: translation.translatedDocumentUrl };
    }),

  getTranslationLanguages: publicProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(drizzleSchema.translationLanguages).where(eq(drizzleSchema.translationLanguages.isActive, true));
    }),

  getTranslationDocumentTypes: publicProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const documentTypes = await db.selectDistinct({ documentType: drizzleSchema.translationPricing.documentType }).from(drizzleSchema.translationPricing);
      return documentTypes.map(dt => dt.documentType);
    }),
});
