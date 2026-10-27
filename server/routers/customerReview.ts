import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { customerReviews } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { requireValidAdminSession } from "./adminAuth";
import { invokeLLM } from "../_core/llm";
import { createSubmissionGuard } from "../_core/publicRateLimit";
import { notifyAdmins } from "./adminNotifications";
import { randomBytes } from "node:crypto";
import { CONSENT_CHANNELS, appendAdminNote, buildAdminEntryNotes, consentDateError, isAdminEntered, placeholderEmail } from "../services/adminTestimonials";
import { createCvDraftLimiter } from "./cvDraft";
import { logger } from "../_core/logger";

/** Saisie par l'administration : plafond horaire par administrateur (protège contre les saisies en rafale). */
const allowAdminEntry = createCvDraftLimiter(30);

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

/**
 * Contrat public volontairement JSON-only : ne jamais exposer directement une
 * ligne Drizzle, car son type peut varier selon le driver SQL (Date, bigint,
 * ou valeurs nullables) et provoquer une erreur de transformation tRPC.
 */
function toPublicApprovedReview(review: typeof customerReviews.$inferSelect) {
  return {
    id: Number(review.id),
    displayName: getDisplayName(review.fullName, review.displayNameChoice),
    destinationCountry: review.destinationCountry ?? undefined,
    serviceType: review.serviceType ?? undefined,
    rating: Number(review.rating),
    reviewText: review.reviewText,
    createdAt: review.createdAt instanceof Date
      ? review.createdAt.toISOString()
      : String(review.createdAt),
  };
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

// Formulaire public sans compte : plafonné pour ne pas noyer la file de modération (aucun avis n'est publié sans validation).
const reviewSubmissionGuard = createSubmissionGuard({
  perClient: { limit: 5, windowMs: 60 * 60_000 },
  perEmail: { limit: 3, windowMs: 60 * 60_000 },
  global: { limit: 100, windowMs: 60 * 60_000 },
});

export const customerReviewRouter = router({
  submit: publicProcedure.input(reviewInput).mutation(async ({ ctx, input }) => {
    reviewSubmissionGuard.assertAllowed(ctx?.req as any, input.email);
    if (!input.consentToPublish) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Le consentement à la publication est requis pour soumettre un avis.",
      });
    }

    const db = await requireDb();
    const email = input.email.toLowerCase();
    // Même avis renvoyé (double clic, rechargement) : on ne crée pas de doublon à modérer.
    const duplicate = await db
      .select({ id: customerReviews.id })
      .from(customerReviews)
      .where(and(eq(customerReviews.email, email), eq(customerReviews.reviewText, input.reviewText)))
      .limit(1);
    if (duplicate.length > 0) {
      return { success: true, message: "Votre avis a été reçu et sera publié après validation par notre équipe." };
    }
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

    // La cloche de l'administration signale l'avis à modérer (jamais publié automatiquement).
    await notifyAdmins({
      type: "new_contact_message",
      title: "Nouvel avis client à modérer",
      message: `${input.fullName} — ${input.rating}/5${input.destinationCountry ? ` — ${input.destinationCountry}` : ""}`,
      relatedId: `avis-${email}`,
      targetAdminType: "accompagnement",
    });

    return {
      success: true,
      message: "Votre avis a été reçu et sera publié après validation par notre équipe.",
    };
  }),

  /**
   * Saisie par l'administration d'un témoignage réellement donné par un client.
   * Obligatoires : l'accord de publication du client (canal, date, preuve conservée) et l'attestation que le retour est
   * authentique. Par défaut l'avis arrive « à valider » ; l'administrateur peut aussi le publier à la saisie.
   */
  createByAdmin: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1).max(512),
      fullName: z.string().trim().min(3).max(255),
      email: z.union([z.string().email().max(320), z.literal("")]).optional(),
      destinationCountry: z.string().trim().max(100).optional(),
      serviceType: z.string().trim().max(100).optional(),
      rating: z.number().int().min(1).max(5),
      reviewText: z.string().trim().min(10).max(1000),
      consentToPublish: z.literal(true),
      attestation: z.literal(true),
      consentChannel: z.enum(CONSENT_CHANNELS),
      consentDate: z.string().trim(),
      consentProof: z.string().trim().min(10).max(500),
      dossierReference: z.string().trim().max(60).optional(),
      displayNameChoice: displayNameChoiceSchema.default("first_name_only"),
      publishNow: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      if (!allowAdminEntry(String(admin.email ?? "admin").toLowerCase(), Date.now())) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Trop de témoignages saisis en peu de temps : réessayez plus tard." });
      }
      const dateError = consentDateError(input.consentDate);
      if (dateError) throw new TRPCError({ code: "BAD_REQUEST", message: dateError });
      const db = await requireDb();
      const duplicate = await db.select({ id: customerReviews.id }).from(customerReviews).where(eq(customerReviews.reviewText, input.reviewText)).limit(1);
      if (duplicate.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Ce témoignage est déjà enregistré." });
      }
      const result = await db.insert(customerReviews).values({
        fullName: input.fullName,
        email: input.email ? input.email.toLowerCase() : placeholderEmail(randomBytes(6).toString("hex")),
        destinationCountry: input.destinationCountry || null,
        serviceType: input.serviceType || null,
        rating: input.rating,
        reviewText: input.reviewText,
        consentToPublish: true,
        displayNameChoice: input.displayNameChoice,
        status: input.publishNow ? "approved" : "pending_review",
        adminNotes: buildAdminEntryNotes({
          channel: input.consentChannel,
          consentDate: input.consentDate,
          proof: input.consentProof,
          dossierReference: input.dossierReference,
          adminEmail: String(admin.email ?? "administrateur"),
          publishNow: input.publishNow,
        }),
        ...(input.publishNow ? { reviewedByAdminEmail: admin.email ?? null, reviewedAt: new Date() } : {}),
      });
      logger.info("customer_review.admin_entry", { admin: admin.email, publishNow: input.publishNow, channel: input.consentChannel, id: (result as any)?.[0]?.insertId });
      return {
        success: true,
        published: input.publishNow,
        message: input.publishNow ? "Témoignage publié." : "Avis enregistré en attente de validation.",
      };
    }),

  listApproved: publicProcedure.query(async () => {
    try {
      const db = await requireDb();
      const rows = await db
        .select()
        .from(customerReviews)
        .where(and(eq(customerReviews.status, "approved"), eq(customerReviews.consentToPublish, true)))
        .orderBy(desc(customerReviews.createdAt), asc(customerReviews.id))
        .limit(40);

      return rows.map(toPublicApprovedReview);
    } catch (error) {
      // Les avis sont une preuve sociale facultative : une indisponibilité DB
      // ne doit jamais faire tomber l’accueil ni produire une réponse tRPC
      // impossible à transformer côté navigateur.
      logger.error("customer_review.list_approved_failed", {}, error);
      return [];
    }
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
    .input(z.object({ sessionToken: z.string().min(1).max(512) }))
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

  listForAdmin: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).max(512) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const rows = await db.select().from(customerReviews).orderBy(desc(customerReviews.createdAt), asc(customerReviews.id)).limit(200);
      return rows.map((review) => ({
        ...review,
        adminEntered: isAdminEntered(review.adminNotes),
        displayName: getDisplayName(review.fullName, review.displayNameChoice),
        createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : String(review.createdAt),
        reviewedAt: review.reviewedAt instanceof Date ? review.reviewedAt.toISOString() : review.reviewedAt ? String(review.reviewedAt) : null,
      }));
    }),

  approveReview: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).max(512), reviewId: z.number().int().positive() }))
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
    .input(z.object({ sessionToken: z.string().min(1).max(512), reviewId: z.number().int().positive(), adminNotes: z.string().max(2000).optional() }))
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

  /**
   * Correction d'un témoignage (coquille, pays, service, nom affiché). Motif obligatoire, conservé dans l'historique de l'avis.
   * Le sens du témoignage ne doit pas être modifié : en cas de doute, retirer l'avis et en demander un nouveau au client.
   */
  updateByAdmin: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1).max(512),
      reviewId: z.number().int().positive(),
      reviewText: z.string().trim().min(10).max(1000).optional(),
      destinationCountry: z.string().trim().max(100).optional(),
      serviceType: z.string().trim().max(100).optional(),
      rating: z.number().int().min(1).max(5).optional(),
      displayNameChoice: displayNameChoiceSchema.optional(),
      reason: z.string().trim().min(5).max(300),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const [current] = await db.select().from(customerReviews).where(eq(customerReviews.id, input.reviewId)).limit(1);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Avis non trouvé." });
      const changes: Record<string, unknown> = {};
      if (input.reviewText !== undefined && input.reviewText !== current.reviewText) changes.reviewText = input.reviewText;
      if (input.destinationCountry !== undefined && (input.destinationCountry || null) !== current.destinationCountry) changes.destinationCountry = input.destinationCountry || null;
      if (input.serviceType !== undefined && (input.serviceType || null) !== current.serviceType) changes.serviceType = input.serviceType || null;
      if (input.rating !== undefined && input.rating !== current.rating) changes.rating = input.rating;
      if (input.displayNameChoice !== undefined && input.displayNameChoice !== current.displayNameChoice) changes.displayNameChoice = input.displayNameChoice;
      if (Object.keys(changes).length === 0) return { success: true, changed: false as const };
      const line = `Modifié par ${admin.email ?? "administrateur"} le ${new Date().toISOString().slice(0, 10)} (${Object.keys(changes).join(", ")}) : ${input.reason}`;
      await db.update(customerReviews).set({ ...changes, adminNotes: appendAdminNote(current.adminNotes, line) }).where(eq(customerReviews.id, input.reviewId));
      logger.info("customer_review.admin_update", { admin: admin.email, id: input.reviewId, fields: Object.keys(changes) });
      return { success: true, changed: true as const };
    }),

  /**
   * Retire un témoignage de la publication (le client retire son accord, ou l'avis est contesté).
   * L'accord de publication est retiré : l'avis ne s'affiche plus nulle part ; la preuve et l'historique restent dans les notes.
   */
  withdrawReview: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).max(512), reviewId: z.number().int().positive(), reason: z.string().trim().min(3).max(300) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const [current] = await db.select().from(customerReviews).where(eq(customerReviews.id, input.reviewId)).limit(1);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Avis non trouvé." });
      const line = `Retiré de la publication par ${admin.email ?? "administrateur"} le ${new Date().toISOString().slice(0, 10)} : ${input.reason}`;
      await db.update(customerReviews).set({
        status: "rejected",
        consentToPublish: false,
        adminNotes: appendAdminNote(current.adminNotes, line),
        reviewedByAdminEmail: admin.email ?? null,
        reviewedAt: new Date(),
      }).where(eq(customerReviews.id, input.reviewId));
      logger.info("customer_review.admin_withdraw", { admin: admin.email, id: input.reviewId });
      return { success: true };
    }),

  getStats: publicProcedure.query(async () => {
    try {
      const db = await requireDb();
      const [agg] = await db.select({
        total: count(),
        approved: count(sql`CASE WHEN status = 'approved' THEN 1 END`),
        pending: count(sql`CASE WHEN status = 'pending_review' THEN 1 END`),
        rejected: count(sql`CASE WHEN status = 'rejected' THEN 1 END`),
        avgRating: sql<number>`COALESCE(AVG(CASE WHEN status = 'approved' THEN rating END), 0)`,
      }).from(customerReviews);

      return {
        // MySQL peut renvoyer COUNT() sous forme de bigint selon la
        // configuration du driver. Le contrat public attend des nombres JSON
        // ordinaires : normaliser ici évite une transformation tRPC fragile.
        totalReviews: Number(agg?.total ?? 0),
        approvedReviews: Number(agg?.approved ?? 0),
        pendingReviews: Number(agg?.pending ?? 0),
        rejectedReviews: Number(agg?.rejected ?? 0),
        averageRating: Number(Number(agg?.avgRating ?? 0).toFixed(1)),
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

  getRatingBreakdown: publicProcedure.query(async () => {
    const emptyBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    try {
      const db = await requireDb();
      const rows = await db
        .select({ rating: customerReviews.rating, value: count() })
        .from(customerReviews)
        .where(eq(customerReviews.status, "approved"))
        .groupBy(customerReviews.rating);

      const breakdown = { ...emptyBreakdown };
      for (const row of rows) {
        if (row.rating >= 1 && row.rating <= 5) {
          breakdown[row.rating as 1 | 2 | 3 | 4 | 5] = Number(row.value);
        }
      }
      return breakdown;
    } catch {
      return emptyBreakdown;
    }
  }),
});
