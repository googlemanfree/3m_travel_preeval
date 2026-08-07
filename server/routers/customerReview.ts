/**
 * Routeur tRPC — Avis clients réels (version simplifiée)
 *
 * Flux : un client soumet son avis avec un consentement explicite à la
 * publication → un admin relit et valide → seuls les avis validés ET
 * consentis sont visibles publiquement.
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

// Mock data - À remplacer par une vraie base de données
const approvedReviews = [
  {
    id: "1",
    fullName: "Aurèol Donfack",
    displayName: "Aurèol D.",
    email: "aureoldonfack@gmail.com",
    destinationCountry: "Luxembourg",
    serviceType: "Visa Travail",
    rating: 5,
    reviewText: "Excellent service ! L'équipe 3M Travel m'a guidé tout au long du processus. Mon visa a été approuvé en 3 semaines. Très professionnel et courtois.",
    status: "approved",
    createdAt: new Date("2026-07-15"),
  },
  {
    id: "2",
    fullName: "Fatima Traore",
    displayName: "Fatima T.",
    email: "fatima@email.com",
    destinationCountry: "Canada",
    serviceType: "Visa Études",
    rating: 5,
    reviewText: "Je recommande vivement 3M Travel. Ils m'ont aidée à préparer tous mes documents pour ma demande de visa étudiant. Très efficace !",
    status: "approved",
    createdAt: new Date("2026-07-10"),
  },
  {
    id: "3",
    fullName: "Jean Claude Mbarga",
    displayName: "Jean C.",
    email: "jean@email.com",
    destinationCountry: "France",
    serviceType: "Visa Visiteur",
    rating: 4,
    reviewText: "Bon service. L'équipe a répondu rapidement à mes questions. Mon visa a été approuvé. Merci !",
    status: "approved",
    createdAt: new Date("2026-07-05"),
  },
];

const pendingReviews: typeof approvedReviews = [];

function displayName(fullName: string, choice: "full_name" | "first_name_only" | "initials"): string {
  const parts = fullName.trim().split(/\s+/);
  if (choice === "full_name") return fullName;
  if (choice === "first_name_only") return parts[0] || fullName;
  return parts.map((p) => p[0]?.toUpperCase() + ".").join(" ");
}

export const customerReviewRouter = router({
  /**
   * Soumission d'un avis par un client (public, pas besoin d'être connecté)
   */
  submit: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
        email: z.string().email("Email invalide"),
        destinationCountry: z.string().optional(),
        serviceType: z.string().optional(),
        rating: z.number().min(1).max(5, "La note doit être entre 1 et 5"),
        reviewText: z
          .string()
          .min(10, "L'avis doit contenir au moins 10 caractères")
          .max(1000, "L'avis ne doit pas dépasser 1000 caractères"),
        consentToPublish: z.boolean(),
        displayNameChoice: z
          .enum(["full_name", "first_name_only", "initials"])
          .default("first_name_only"),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.consentToPublish) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Le consentement à la publication est requis pour soumettre un avis.",
        });
      }

      // Créer l'avis en attente de validation
      const newReview = {
        id: `pending_${Date.now()}`,
        fullName: input.fullName,
        displayName: displayName(input.fullName, input.displayNameChoice),
        email: input.email,
        destinationCountry: input.destinationCountry,
        serviceType: input.serviceType,
        rating: input.rating,
        reviewText: input.reviewText,
        status: "pending_review" as const,
        createdAt: new Date(),
      };

      pendingReviews.push(newReview);

      // Envoyer une notification à l'équipe (à implémenter avec Resend)
      console.log(
        `[REVIEW] Nouvel avis en attente de validation: ${input.fullName} (${input.rating}/5)`
      );

      return {
        success: true,
        message: "Votre avis a été reçu et sera publié après validation par notre équipe.",
      };
    }),

  /**
   * Récupérer les avis publics approuvés
   */
  listApproved: publicProcedure.query(async () => {
    return approvedReviews.map((review) => ({
      id: review.id,
      displayName: review.displayName,
      destinationCountry: review.destinationCountry,
      serviceType: review.serviceType,
      rating: review.rating,
      reviewText: review.reviewText,
      createdAt: review.createdAt,
    }));
  }),

  /**
   * Récupérer les avis en attente (Admin uniquement)
   */
  getPendingReviews: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Accès réservé aux administrateurs",
      });
    }

    return pendingReviews;
  }),

  /**
   * Approuver un avis (Admin uniquement)
   */
  approveReview: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Accès réservé aux administrateurs",
        });
      }

      const index = pendingReviews.findIndex((r) => r.id === input.reviewId);
      if (index === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avis non trouvé",
        });
      }

      const review = pendingReviews[index];
      approvedReviews.push({
        ...review,
        status: "approved" as const,
      });

      pendingReviews.splice(index, 1);

      console.log(`[REVIEW] Avis approuvé: ${review.fullName}`);

      return {
        success: true,
        message: "Avis approuvé et publié",
      };
    }),

  /**
   * Rejeter un avis (Admin uniquement)
   */
  rejectReview: protectedProcedure
    .input(z.object({ reviewId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Accès réservé aux administrateurs",
        });
      }

      const index = pendingReviews.findIndex((r) => r.id === input.reviewId);
      if (index === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avis non trouvé",
        });
      }

      const review = pendingReviews[index];
      pendingReviews.splice(index, 1);

      console.log(
        `[REVIEW] Avis rejeté: ${review.fullName} - Raison: ${input.reason || "Non spécifiée"}`
      );

      return {
        success: true,
        message: "Avis rejeté",
      };
    }),

  /**
   * Obtenir les statistiques des avis
   */
  getStats: publicProcedure.query(async () => {
    const totalReviews = approvedReviews.length;
    const averageRating =
      totalReviews > 0
        ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 0;

    const ratingDistribution = {
      5: approvedReviews.filter((r) => r.rating === 5).length,
      4: approvedReviews.filter((r) => r.rating === 4).length,
      3: approvedReviews.filter((r) => r.rating === 3).length,
      2: approvedReviews.filter((r) => r.rating === 2).length,
      1: approvedReviews.filter((r) => r.rating === 1).length,
    };

    return {
      totalReviews,
      averageRating: parseFloat(averageRating as string),
      ratingDistribution,
    };
  }),
});
