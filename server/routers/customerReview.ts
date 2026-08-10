import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

// Mock data for customer reviews - en production, utiliser une vraie table DB
const mockReviews: any[] = [
  {
    id: "1",
    fullName: "Marie Dupont",
    email: "marie@example.com",
    destinationCountry: "Canada",
    serviceType: "Travail",
    rating: 5,
    reviewText: "Excellent service! L'équipe 3M m'a guidée tout au long du processus. Mon visa a été approuvé en 3 semaines.",
    consentToPublish: true,
    displayNameChoice: "first_name_only",
    status: "approved",
    createdAt: new Date("2026-08-01"),
  },
  {
    id: "2",
    fullName: "Jean Martin",
    email: "jean@example.com",
    destinationCountry: "France",
    serviceType: "Études",
    rating: 5,
    reviewText: "Très professionnel et réactif. Ils ont répondu à toutes mes questions rapidement.",
    consentToPublish: true,
    displayNameChoice: "first_name_only",
    status: "approved",
    createdAt: new Date("2026-08-02"),
  },
  {
    id: "3",
    fullName: "Sophie Bernard",
    email: "sophie@example.com",
    destinationCountry: "Allemagne",
    serviceType: "Travail",
    rating: 4,
    reviewText: "Bonne expérience globale. Le processus était clair et bien structuré.",
    consentToPublish: true,
    displayNameChoice: "first_name_only",
    status: "approved",
    createdAt: new Date("2026-08-03"),
  },
];

function displayName(fullName: string, choice: "full_name" | "first_name_only" | "initials"): string {
  const parts = fullName.trim().split(/\s+/);
  if (choice === "full_name") return fullName;
  if (choice === "first_name_only") return parts[0] || fullName;
  return parts.map((p) => p[0]?.toUpperCase() + ".").join(" ");
}

export const customerReviewRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(3),
        email: z.string().email(),
        destinationCountry: z.string().optional(),
        serviceType: z.string().optional(),
        rating: z.number().min(1).max(5),
        reviewText: z.string().min(10).max(1000),
        consentToPublish: z.boolean(),
        displayNameChoice: z.enum(["full_name", "first_name_only", "initials"]).default("first_name_only"),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.consentToPublish) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Le consentement à la publication est requis pour soumettre un avis.",
        });
      }

      // Mock: ajouter à la liste des avis
      const newReview = {
        id: String(mockReviews.length + 1),
        fullName: input.fullName,
        email: input.email,
        destinationCountry: input.destinationCountry,
        serviceType: input.serviceType,
        rating: input.rating,
        reviewText: input.reviewText,
        consentToPublish: input.consentToPublish,
        displayNameChoice: input.displayNameChoice,
        status: "pending_review",
        createdAt: new Date(),
      };

      mockReviews.push(newReview);

      return { success: true };
    }),

  listApproved: publicProcedure.query(async () => {
    // Retourner les avis approuvés avec le nom d'affichage
    return mockReviews
      .filter((r) => r.status === "approved" && r.consentToPublish)
      .map((r) => ({
        ...r,
        displayName: displayName(r.fullName, r.displayNameChoice),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30);
  }),

  getPendingReviews: protectedProcedure.query(async ({ ctx }) => {
    // Retourner les avis en attente de modération (admin uniquement)
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
    }

    return mockReviews.filter((r) => r.status === "pending_review");
  }),

  approveReview: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      const review = mockReviews.find((r) => r.id === input.reviewId);
      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avis non trouvé" });
      }

      review.status = "approved";
      review.reviewedByAdminEmail = ctx.user.email;
      review.reviewedAt = new Date();

      return { success: true };
    }),

  rejectReview: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      const review = mockReviews.find((r) => r.id === input.reviewId);
      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avis non trouvé" });
      }

      review.status = "rejected";
      review.reviewedByAdminEmail = ctx.user.email;
      review.reviewedAt = new Date();

      return { success: true };
    }),

  getStats: publicProcedure.query(async () => {
    const approved = mockReviews.filter((r) => r.status === "approved").length;
    const pending = mockReviews.filter((r) => r.status === "pending_review").length;
    const rejected = mockReviews.filter((r) => r.status === "rejected").length;
    const avgRating =
      mockReviews.length > 0
        ? (mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length).toFixed(1)
        : 0;

    return {
      totalReviews: mockReviews.length,
      approvedReviews: approved,
      pendingReviews: pending,
      rejectedReviews: rejected,
      averageRating: parseFloat(String(avgRating)),
    };
  }),
});
