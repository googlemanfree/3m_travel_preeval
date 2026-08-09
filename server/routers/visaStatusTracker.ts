import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

// Mock data for visa status - en production, récupérer depuis la BD
const mockDossiers: Record<string, any> = {
  "3M-2026-0001": {
    dossierNumber: "3M-2026-0001",
    candidateName: "Jean Dupont",
    destination: "Canada",
    visaType: "Travail",
    overallStatus: "in_progress",
    progressPercentage: 65,
    lastUpdated: new Date("2026-08-08T10:30:00"),
    estimatedCompletion: new Date("2026-08-20"),
    notes: "Votre dossier est actuellement en cours de vérification auprès des autorités canadiennes. Pas d'action requise de votre part.",
    steps: [
      {
        id: "step-1",
        name: "Réception du Dossier",
        description: "Votre dossier a été reçu et enregistré",
        status: "completed",
        completedAt: new Date("2026-07-25T14:00:00"),
      },
      {
        id: "step-2",
        name: "Vérification des Documents",
        description: "Vérification de la complétude et de la validité des documents",
        status: "completed",
        completedAt: new Date("2026-08-01T09:30:00"),
      },
      {
        id: "step-3",
        name: "Évaluation Préliminaire",
        description: "Évaluation initiale de votre admissibilité",
        status: "in_progress",
        completedAt: undefined,
      },
      {
        id: "step-4",
        name: "Transmission aux Autorités",
        description: "Transmission du dossier aux autorités compétentes",
        status: "pending",
        completedAt: undefined,
      },
      {
        id: "step-5",
        name: "Entrevue (si requise)",
        description: "Entrevue avec les autorités d'immigration",
        status: "pending",
        completedAt: undefined,
      },
      {
        id: "step-6",
        name: "Décision Finale",
        description: "Réception de la décision finale",
        status: "pending",
        completedAt: undefined,
      },
    ],
  },
};

export const visaStatusTrackerRouter = router({
  /**
   * Récupérer le statut du dossier visa
   */
  getDossierStatus: protectedProcedure
    .input(z.object({ dossierNumber: z.string() }))
    .query(async ({ input, ctx }) => {
      // En production : vérifier que l'utilisateur est propriétaire du dossier
      const dossier = mockDossiers[input.dossierNumber];
      
      if (!dossier) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dossier non trouvé",
        });
      }

      return dossier;
    }),

  /**
   * Récupérer tous les dossiers de l'utilisateur connecté
   */
  getUserDossiers: protectedProcedure.query(async ({ ctx }) => {
    // En production : récupérer depuis la BD les dossiers de l'utilisateur
    return Object.values(mockDossiers).map((dossier) => ({
      dossierNumber: dossier.dossierNumber,
      destination: dossier.destination,
      visaType: dossier.visaType,
      overallStatus: dossier.overallStatus,
      progressPercentage: dossier.progressPercentage,
      lastUpdated: dossier.lastUpdated,
    }));
  }),

  /**
   * Mettre à jour le statut d'une étape (admin uniquement)
   */
  updateStepStatus: protectedProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        stepId: z.string(),
        status: z.enum(["completed", "in_progress", "pending", "failed"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // En production : vérifier que l'utilisateur est admin
      const dossier = mockDossiers[input.dossierNumber];
      
      if (!dossier) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dossier non trouvé",
        });
      }

      const step = dossier.steps.find((s: any) => s.id === input.stepId);
      if (!step) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Étape non trouvée",
        });
      }

      // Mettre à jour l'étape
      step.status = input.status;
      if (input.status === "completed") {
        step.completedAt = new Date();
      }

      // Recalculer la progression
      const completedSteps = dossier.steps.filter((s: any) => s.status === "completed").length;
      dossier.progressPercentage = Math.round((completedSteps / dossier.steps.length) * 100);

      // Mettre à jour le statut global
      if (completedSteps === dossier.steps.length) {
        dossier.overallStatus = "completed";
      } else if (dossier.steps.some((s: any) => s.status === "in_progress")) {
        dossier.overallStatus = "in_progress";
      }

      dossier.lastUpdated = new Date();
      if (input.notes) {
        dossier.notes = input.notes;
      }

      return { success: true, dossier };
    }),

  /**
   * Obtenir les statistiques de suivi
   */
  getTrackingStats: protectedProcedure.query(async ({ ctx }) => {
    const dossiers = Object.values(mockDossiers);
    
    return {
      totalDossiers: dossiers.length,
      completedDossiers: dossiers.filter((d: any) => d.overallStatus === "completed").length,
      inProgressDossiers: dossiers.filter((d: any) => d.overallStatus === "in_progress").length,
      averageProgress: Math.round(
        dossiers.reduce((sum: number, d: any) => sum + d.progressPercentage, 0) / dossiers.length
      ),
    };
  }),
});
