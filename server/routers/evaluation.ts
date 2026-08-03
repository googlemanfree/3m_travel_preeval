/**
 * Routeur tRPC pour les statistiques du Dashboard Admin Avancé
 * Fournit les données pour les graphiques et KPIs
 */

import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import {
  applications,
  candidates,
  clientDocuments,
  agencyDossiers,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const adminDashboardStatsRouter = router({
  /**
   * Récupérer les statistiques globales du dashboard
   */
  getGlobalStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    try {
      // Compter les dossiers par statut
      const allApplications = await db.select().from(applications);
      const totalApplications = allApplications.length;
      const pendingApplications = allApplications.filter(a => (a as any).dossierStatus === "nouveau").length;
      const publishedApplications = allApplications.filter(a => (a as any).dossierStatus === "en_evaluation").length;
      const submittedApplications = allApplications.filter(a => (a as any).dossierStatus === "soumis_agences").length;
      const approvedApplications = allApplications.filter(a => (a as any).dossierStatus === "visa_approuve").length;

      // Compter les candidats
      const allCandidates = await db.select().from(candidates);
      const totalCandidates = allCandidates.length;

      // Compter les documents
      const allDocuments = await db.select().from(clientDocuments);
      const totalDocuments = allDocuments.length;
      const verifiedDocuments = allDocuments.filter(d => (d as any).verificationStatus === "approved").length;

      // Compter les dossiers agence
      const allAgencyDossiers = await db.select().from(agencyDossiers);
      const totalAgencyDossiers = allAgencyDossiers.length;

      return {
        success: true,
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          published: publishedApplications,
          submitted: submittedApplications,
          approved: approvedApplications,
        },
        candidates: {
          total: totalCandidates,
        },
        transactions: {
          total: 0,
          completed: 0,
          pending: 0,
          failed: 0,
          totalRevenue: 0,
        },
        documents: {
          total: totalDocuments,
          verified: verifiedDocuments,
        },
        agencyDossiers: {
          total: totalAgencyDossiers,
        },
      };
    } catch (error) {
      console.error("[AdminDashboardStats] Error fetching global stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la récupération des statistiques",
      });
    }
  }),

  /**
   * Récupérer les données pour le graphique des dossiers par statut
   */
  getApplicationsStatusChart: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    try {
      const allApplications = await db.select().from(applications);

      const statusCounts = {
        "Nouveau": allApplications.filter(a => (a as any).dossierStatus === "nouveau").length,
        "En Évaluation": allApplications.filter(a => (a as any).dossierStatus === "en_evaluation").length,
        "Bilan Envoyé": allApplications.filter(a => (a as any).dossierStatus === "bilan_envoye").length,
        "Soumis Agences": allApplications.filter(a => (a as any).dossierStatus === "soumis_agences").length,
        "Approuvé": allApplications.filter(a => (a as any).dossierStatus === "visa_approuve").length,
      };

      return {
        success: true,
        data: Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value,
        })),
      };
    } catch (error) {
      console.error("[AdminDashboardStats] Error fetching applications status chart:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la récupération des données du graphique",
      });
    }
  }),

  /**
   * Récupérer les données pour le graphique des revenus par jour
   */
  getRevenueChart: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Placeholder - pas de table transactions
        const revenueByDay: Record<string, number> = {};
        const now = new Date();

        for (let i = 0; i < input.days; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          revenueByDay[dateStr] = 0;
        }

        const data = Object.entries(revenueByDay)
          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
          .map(([date, revenue]) => ({
            date: new Date(date).toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
            revenue,
          }));

        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error("[AdminDashboardStats] Error fetching revenue chart:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des données de revenus",
        });
      }
    }),

  /**
   * Récupérer les dossiers récents avec détails
   */
  getRecentApplications: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const recentApps = await db
          .select()
          .from(applications)
          .orderBy(desc(applications.createdAt))
          .limit(input.limit);

        // Enrichir avec les données candidat
        const enrichedApps = await Promise.all(
          recentApps.map(async app => {
            const candidate = await db
              .select()
              .from(candidates)
              .where(eq(candidates.id, app.candidateId as any))
              .then(result => result[0]);

            return {
              ...app,
              candidateName: candidate?.fullName || "N/A",
              candidateEmail: candidate?.email || "N/A",
            };
          })
        );

        return {
          success: true,
          data: enrichedApps,
        };
      } catch (error) {
        console.error("[AdminDashboardStats] Error fetching recent applications:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des dossiers récents",
        });
      }
    }),

  /**
   * Récupérer les KPIs principaux
   */
  getKPIs: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    try {
      const allApplications = await db.select().from(applications);
      const allCandidates = await db.select().from(candidates);

      // Calculer les taux
      const approvalRate =
        allApplications.length > 0
          ? Math.round(
              (allApplications.filter(a => (a as any).dossierStatus === "visa_approuve").length / allApplications.length) * 100
            )
          : 0;

      return {
        success: true,
        kpis: {
          approvalRate: `${approvalRate}%`,
          conversionRate: "0%",
          totalRevenue: "0 XOF",
          averageTransactionValue: "0 XOF",
          totalApplications: allApplications.length,
          totalCandidates: allCandidates.length,
          totalTransactions: 0,
        },
      };
    } catch (error) {
      console.error("[AdminDashboardStats] Error fetching KPIs:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la récupération des KPIs",
      });
    }
  }),
});

export default adminDashboardStatsRouter;
