import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and, SQL } from "drizzle-orm";
import * as drizzleSchema from "../../drizzle/schema";
import { getDb } from "../db";
import { sendEmail } from "../_core/email";

function esc(v: string): string { return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

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
      fileUrl: z.string().url().max(500),
      fileName: z.string().max(255),
      fileSize: z.number().positive(),
      numberOfPages: z.number().int().positive(),
      pricePerPage: z.number().positive(),
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
        return db.select().from(drizzleSchema.translationRequests).where(and(...conditions)).limit(500);
      } else {
        return db.select().from(drizzleSchema.translationRequests).limit(500);
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

  // `validateTranslationPayment` et `downloadTranslatedDocument` ont été RETIRÉES (aucun appelant) : elles étaient
  // publiques et ne demandaient que l'`id` séquentiel de la demande — la première marquait n'importe quelle demande
  // comme payée avec un montant et une transaction fournis par l'appelant, la seconde livrait l'URL du document
  // traduit d'un autre client.

  uploadTranslatedDocument: protectedProcedure
    .input(z.object({
      requestId: z.number().int().positive(),
      translatedDocumentUrl: z.string().url().max(500),
      translatedDocumentName: z.string().max(255),
      translatedDocumentSize: z.number().positive(),
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
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:32px;text-align:center;color:#fff"><h1 style="margin:0;font-size:20px">Votre document traduit est disponible</h1></div><div style="padding:32px;background:#f9fafb"><p>Bonjour <strong>${esc(completedReq.candidateName || completedReq.candidateEmail)}</strong>,</p><p>La traduction de votre document <strong>${esc(completedReq.sourceDocumentName || "document")}</strong> est terminée et disponible au téléchargement.</p><p style="text-align:center;margin:24px 0"><a href="${/^https?:\/\//i.test(input.translatedDocumentUrl) ? esc(input.translatedDocumentUrl) : "#"}" style="background:linear-gradient(135deg,#1E3A8A,#2563EB);color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;display:inline-block">Télécharger le document traduit</a></p><p>Pour toute question : <strong>+237 698 104 832</strong> (WhatsApp)</p></div><div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px">3M Travel &amp; Services SARL — <a href="https://www.3mtravelagency.com">www.3mtravelagency.com</a></div></div>`,
          });
        } catch (emailErr) {
          console.warn("[translation] Completion notification email failed:", emailErr);
        }
      }

      return { success: true };
    }),

  getTranslationLanguages: publicProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(drizzleSchema.translationLanguages).where(eq(drizzleSchema.translationLanguages.isActive, true)).limit(200);
    }),

  getTranslationDocumentTypes: publicProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const documentTypes = await db.selectDistinct({ documentType: drizzleSchema.translationPricing.documentType }).from(drizzleSchema.translationPricing).limit(200);
      return documentTypes.map(dt => dt.documentType);
    }),
});
