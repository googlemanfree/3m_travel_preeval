/**
 * Routeur tRPC — Avis clients réels
 *
 * Flux : un client soumet son avis avec un consentement explicite à la
 * publication → un admin relit et valide → seuls les avis validés ET
 * consentis sont visibles publiquement. Rien n'est jamais publié
 * automatiquement, et aucune donnée fictive n'est utilisée — tout passe
 * par la vraie base de données.
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { customerReviews } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { logger } from "../_core/logger";
import { requireValidAdminSession } from "./adminAuth";

function displayName(fullName: string, choice: "full_name" | "first_name_only" | "initials"): string {
  const parts = fullName.trim().split(/\s+/);
  if (choice === "full_name") return fullName;
  if (choice === "first_name_only") return parts[0] || fullName;
  return parts.map((p) => p[0]?.toUpperCase() + ".").join(" ");
}

export const customerReviewRouter = router({
  /**
   * Soumission d'un avis par un client (public, pas besoin d'être connecté —
   * un client satisfait doit pouvoir laisser un avis facilement).
   */
  submit: publicProcedure
    .input(z.object({
      fullName: z.string().min(3),
      email: z.string().email(),
      destinationCountry: z.string().optional(),
      serviceType: z.string().optional(),
      rating: z.number().min(1).max(5),
      reviewText: z.string().min(10).max(1000),
      consentToPublish: z.boolean(),
      displayNameChoice: z.enum(["full_name", "first_name_only", "initials"]).default("first_name_only"),
    }))
    .mutation(async ({ input }) => {
      if (!input.consentToPublish) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le consentement à la publication est requis pour soumettre un avis." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      await db.insert(customerReviews).values({
        fullName: input.fullName,
        email: input.email,
        destinationCountry: input.destinationCountry,
        serviceType: input.serviceType,
        rating: input.rating,
        reviewText: input.reviewText,
        consentToPublish: input.consentToPublish,
        displayNameChoice: input.displayNameChoice,
        status: "pending_review",
      });

      try {
        await sendEmail({
          to: "hello@3mtravelagency.com",
          subject: `⭐ Nouvel avis client — ${input.rating}/5 (${input.fullName})`,
          html: `<p><strong>${input.fullName}</strong> (${input.email}) a laissé un avis ${input.rating}/5.</p><p>${input.reviewText}</p><p>À valider dans le tableau de bord admin avant publication.</p>`,
        });
      } catch (err) {
        logger.error("customer_review.team_notification_failed", {}, err);
      }

      logger.info("customer_review.submitted", { email: input.email, rating: input.rating });

      return { success: true };
    }),

  /** Avis publics approuvés et consentis — c'est tout ce qu'un visiteur peut voir. */
  listApproved: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db.select().from(customerReviews)
      .where(and(eq(customerReviews.status, "approved"), eq(customerReviews.consentToPublish, true)))
      .orderBy(desc(customerReviews.createdAt))
      .limit(30);

    return rows.map((r) => ({
      id: r.id,
      displayName: displayName(r.fullName, r.displayNameChoice),
      destinationCountry: r.destinationCountry,
      serviceType: r.serviceType,
      rating: r.rating,
      reviewText: r.reviewText,
      createdAt: r.createdAt,
    }));
  }),

  /** Liste complète pour modération admin. */
  listForAdmin: publicProcedure
    .input(z.object({ sessionToken: z.string(), status: z.enum(["pending_review", "approved", "rejected"]).optional() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db.select().from(customerReviews).orderBy(desc(customerReviews.createdAt));
      return input.status ? rows.filter((r) => r.status === input.status) : rows;
    }),

  /** Un admin approuve un avis pour publication. */
  approve: publicProcedure
    .input(z.object({ sessionToken: z.string(), reviewId: z.number(), adminNotes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(customerReviews).set({
        status: "approved",
        adminNotes: input.adminNotes,
        reviewedByAdminEmail: admin.email,
        reviewedAt: new Date(),
      }).where(eq(customerReviews.id, input.reviewId));

      return { success: true };
    }),

  /** Un admin rejette un avis (jamais publié). */
  reject: publicProcedure
    .input(z.object({ sessionToken: z.string(), reviewId: z.number(), adminNotes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(customerReviews).set({
        status: "rejected",
        adminNotes: input.adminNotes,
        reviewedByAdminEmail: admin.email,
        reviewedAt: new Date(),
      }).where(eq(customerReviews.id, input.reviewId));

      return { success: true };
    }),
});
