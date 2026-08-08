/**
 * Routeur tRPC — Avis clients réels (Mock version - pas de DB table)
 * 
 * Stocke les avis en mémoire avec données mockées pour la démonstration.
 * En production, intégrer une vraie table customerReviews dans le schéma Drizzle.
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

// Mock data - en production, utiliser une vraie table Drizzle
const mockReviews = [
  {
    id: 1,
    fullName: "Marie Dupont",
    email: "marie@example.com",
    destinationCountry: "Canada",
    serviceType: "Travail",
    rating: 5,
    reviewText: "Excellent service ! L'équipe m'a guidée tout au long du processus. Visa obtenu en 2 mois.",
    consentToPublish: true,
    displayNameChoice: "first_name_only" as const,
    status: "approved" as const,
    createdAt: new Date("2026-07-15"),
  },
  {
    id: 2,
    fullName: "Jean Martin",
    email: "jean@example.com",
    destinationCountry: "Luxembourg",
    serviceType: "Travail",
    rating: 5,
    reviewText: "Service professionnel et rapide. Très satisfait du résultat.",
    consentToPublish: true,
    displayNameChoice: "initials" as const,
    status: "approved" as const,
    createdAt: new Date("2026-07-10"),
  },
  {
    id: 3,
    fullName: "Sophie Bernard",
    email: "sophie@example.com",
    destinationCountry: "Australie",
    serviceType: "Études",
    rating: 4,
    reviewText: "Bonne expérience globale. Quelques délais mais finalement tout s'est bien passé.",
    consentToPublish: true,
    displayNameChoice: "first_name_only" as const,
    status: "approved" as const,
    createdAt: new Date("2026-07-05"),
  },
];

function displayName(fullName: string, choice: "full_name" | "first_name_only" | "initials"): string {
  const parts = fullName.trim().split(/\s+/);
  if (choice === "full_name") return fullName;
  if (choice === "first_name_only") return parts[0] || fullName;
  return parts.map((p) => p[0]?.toUpperCase() + ".").join(" ");
}

export const customerReviewRouter = router({
  /**
   * Soumission d'un avis par un client (public)
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
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le consentement à la publication est requis." });
      }

      // En production : insérer dans la vraie table Drizzle
      const newReview = {
        id: mockReviews.length + 1,
        ...input,
        status: "pending_review" as const,
        createdAt: new Date(),
      };

      mockReviews.push(newReview);

      return { success: true, reviewId: newReview.id };
    }),

  /**
   * Avis publics approuvés - visibles pour tous
   */
  listApproved: publicProcedure.query(async () => {
    return mockReviews
      .filter((r) => r.status === "approved" && r.consentToPublish)
      .map((r) => ({
        id: r.id,
        displayName: displayName(r.fullName, r.displayNameChoice),
        destinationCountry: r.destinationCountry,
        serviceType: r.serviceType,
        rating: r.rating,
        reviewText: r.reviewText,
        createdAt: r.createdAt,
      }));
  }),

  /**
   * Statistiques des avis
   */
  getStats: publicProcedure.query(async () => {
    const approved = mockReviews.filter((r) => r.status === "approved");
    const avgRating = approved.length > 0
      ? (approved.reduce((sum, r) => sum + r.rating, 0) / approved.length).toFixed(1)
      : 0;

    return {
      totalApproved: approved.length,
      averageRating: parseFloat(avgRating as string),
      totalSubmitted: mockReviews.length,
    };
  }),

  /**
   * Liste pour modération admin (mock - pas de vraie auth)
   */
  listForAdmin: publicProcedure.query(async () => {
    return mockReviews;
  }),

  /**
   * Approuver un avis (mock)
   */
  approve: publicProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      const review = mockReviews.find((r) => r.id === input.reviewId);
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });

      review.status = "approved";
      return { success: true };
    }),

  /**
   * Rejeter un avis (mock)
   */
  reject: publicProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      const review = mockReviews.find((r) => r.id === input.reviewId);
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });

      review.status = "rejected";
      return { success: true };
    }),
});
