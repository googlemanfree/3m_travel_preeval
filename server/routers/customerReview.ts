import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { customerReviews } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { requireValidAdminSession } from "./adminAuth";
import { invokeLLM } from "../_core/llm";

const displayNameChoiceSchema = z.enum(["full_name", "first_name_only", "initials"]);
type DisplayNameChoice = z.infer<typeof displayNameChoiceSchema>;

export function getDisplayName(fullName: string, choice: DisplayNameChoice): string {
  const normalized = fullName.trim();
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (choice === "full_name") return normalized;
  if (choice === "first_name_only") return parts[0] ?? normalized;
  return parts.map((part) => `${part.charAt(0).toUpperCase()}.`).join(" ");
}

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "La base de données est momentanément indisponible.",
    });
  }
  return db;
}

// ⚠️ NE JAMAIS utiliser protectedProcedure/ctx.user.role ici — ce routeur
// est administré depuis le vrai système de session admin (adminAuth.ts),
// pas depuis la session plateforme. Toujours publicProcedure + sessionToken
// + requireValidAdminSession(). Cette confusion a cassé ce fichier à
// plusieurs reprises — voir l'historique du projet si en doute.

const reviewInput = z.object({
  fullName: z.string().trim().min(3).max(255),
  email: z.string().email().max(320),
  destinationCountry: z.string().trim().max(100).optional(),
  serviceType: z.string().trim().max(100).optional(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().trim().min(10).max(1000),
  consentToPublish: z.boolean(),
  displayNameChoice: displayNameChoiceSchema.default("first_name_only"),
});

export const customerReviewRouter = router({
  submit: publicProcedure.input(reviewInput).mutation(async ({ input }) => {
    if (!input.consentToPublish) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Le consentement à la publication est requis pour soumettre un avis.",
      });
    }

    const db = await requireDb();
    await db.insert(customerReviews).values({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      destinationCountry: input.destinationCountry || null,
      serviceType: input.serviceType || null,
      rating: input.rating,
      reviewText: input.reviewText,
      consentToPublish: true,
      displayNameChoice: input.displayNameChoice,
      status: "pending_review",
    });

    return {
      success: true,
      message: "Votre avis a été reçu et sera publié après validation par notre équipe.",
    };
  }),

  listApproved: publicProcedure.query(async () => {
    const db = await requireDb();
    const rows = await db
      .select()
      .from(customerReviews)
      .where(and(eq(customerReviews.status, "approved"), eq(customerReviews.consentToPublish, true)))
      .orderBy(desc(customerReviews.createdAt), asc(customerReviews.id))
      .limit(30);

    return rows.map((review) => ({
      ...review,
      displayName: getDisplayName(review.fullName, review.displayNameChoice),
    }));
  }),

  translateApproved: publicProcedure
    .input(z.object({
      reviewId: z.number().int().positive(),
      targetLanguage: z.enum(["fr", "en"]),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [review] = await db
        .select()
        .from(customerReviews)
        .where(and(
          eq(customerReviews.id, input.reviewId),
          eq(customerReviews.status, "approved"),
          eq(customerReviews.consentToPublish, true),
        ))
        .limit(1);

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cet avis approuvé n’est pas disponible pour la traduction.",
        });
      }

      const targetLabel = input.targetLanguage === "fr" ? "français" : "anglais";
      const completion = await invokeLLM({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: "Vous êtes un traducteur professionnel. Traduisez uniquement le texte fourni, sans ajouter, supprimer, résumer, commenter, modifier le ton, inventer de faits ou inclure des guillemets. Conservez les noms propres et le sens exact du témoignage.",
          },
          {
            role: "user",
            content: `Traduisez le témoignage client suivant en ${targetLabel} :\n\n${review.reviewText}`,
          },
        ],
        maxTokens: 1300,
      });

      const translatedText = typeof completion.choices?.[0]?.message?.content === "string"
        ? completion.choices[0].message.content.trim()
        : "";

      if (!translatedText) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "La traduction de cet avis est momentanément indisponible.",
        });
      }

      return {
        reviewId: review.id,
        translatedText,
        targetLanguage: input.targetLanguage,
        originalText: review.reviewText,
      };
    }),

  getPendingReviews: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      return db
        .select()
        .from(customerReviews)
        .where(eq(customerReviews.status, "pending_review"))
        .orderBy(desc(customerReviews.createdAt), asc(customerReviews.id))
        .limit(100);
    }),

  approveReview: publicProcedure
    .input(z.object({ sessionToken: z.string(), reviewId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const result = await db
        .update(customerReviews)
        .set({
          status: "approved",
          reviewedByAdminEmail: admin.email ?? null,
          reviewedAt: new Date(),
        })
        .where(eq(customerReviews.id, input.reviewId));

      if (result[0].affectedRows === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avis non trouvé." });
      }
      return { success: true };
    }),

  rejectReview: publicProcedure
    .input(z.object({ sessionToken: z.string(), reviewId: z.number().int().positive(), adminNotes: z.string().max(2000).optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const result = await db
        .update(customerReviews)
        .set({
          status: "rejected",
          adminNotes: input.adminNotes?.trim() || null,
          reviewedByAdminEmail: admin.email ?? null,
          reviewedAt: new Date(),
        })
        .where(eq(customerReviews.id, input.reviewId));

      if (result[0].affectedRows === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avis non trouvé." });
      }
      return { success: true };
    }),

  getStats: publicProcedure.query(async () => {
    try {
      const db = await requireDb();
      const [totals, approved, pending, rejected, average] = await Promise.all([
        db.select({ value: count() }).from(customerReviews),
        db.select({ value: count() }).from(customerReviews).where(eq(customerReviews.status, "approved")),
        db.select({ value: count() }).from(customerReviews).where(eq(customerReviews.status, "pending_review")),
        db.select({ value: count() }).from(customerReviews).where(eq(customerReviews.status, "rejected")),
        db
          .select({ value: sql<string | null>`avg(${customerReviews.rating})` })
          .from(customerReviews)
          .where(eq(customerReviews.status, "approved")),
      ]);

      return {
        totalReviews: Number(totals[0]?.value ?? 0),
        approvedReviews: Number(approved[0]?.value ?? 0),
        pendingReviews: Number(pending[0]?.value ?? 0),
        rejectedReviews: Number(rejected[0]?.value ?? 0),
        averageRating: Number(Number(average[0]?.value ?? 0).toFixed(1)),
      };
    } catch {
      return {
        totalReviews: 0,
        approvedReviews: 0,
        pendingReviews: 0,
        rejectedReviews: 0,
        averageRating: 0,
      };
    }
  }),
});
