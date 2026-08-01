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
  transactions,
  bilans,
  clientDocuments,
  agencyDossiers,
} from "../../drizzle/schema";
import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";

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
      const pendingApplications = allApplications.filter(a => (a as any).status === "PENDING_48H").length;
      const publishedApplications = allApplications.filter(a => (a as any).status === "PUBLISHED").length;
      const submittedApplications = allApplications.filter(a => (a as any).status === "SUBMITTED").length;
      const approvedApplications = allApplications.filter(a => (a as any).status === "APPROVED").length;

      // Compter les candidats
      const allCandidates = await db.select().from(candidates);
      const totalCandidates = allCandidates.length;

      // Compter les transactions
      const allTransactions = await db.select().from(transactions);
      const totalTransactions = allTransactions.length;
      const completedTransactions = allTransactions.filter(t => t.status === "success").length;
      const pendingTransactions = allTransactions.filter(t => t.status === "pending" || t.status === "processing").length;
      const failedTransactions = allTransactions.filter(t => t.status === "failed" || t.status === "cancelled").length;

      // Calculer le revenu total
      const totalRevenue = allTransactions
        .filter(t => t.status === "success")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

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
          total: totalTransactions,
          completed: completedTransactions,
          pending: pendingTransactions,
          failed: failedTransactions,
          totalRevenue,
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
        "Évaluation 48h": allApplications.filter(a => (a as any).status === "PENDING_48H").length,
        "Bilan Disponible": allApplications.filter(a => (a as any).status === "PUBLISHED").length,
        "Collecte Documents": allApplications.filter(a => (a as any).status === "DOCUMENTS_CHECK").length,
        "Soumission Consulaire": allApplications.filter(a => (a as any).status === "SUBMITTED").length,
        "Approuvé": allApplications.filter(a => (a as any).status === "APPROVED").length,
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
        const allTransactions = await db.select().from(transactions);

        // Grouper par jour
        const revenueByDay: Record<string, number> = {};
        const now = new Date();

        for (let i = 0; i < input.days; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          revenueByDay[dateStr] = 0;
        }

        allTransactions
          .filter(t => t.status === "success")
          .forEach(t => {
            if (t.createdAt) {
              const dateStr = new Date(t.createdAt).toISOString().split("T")[0];
              if (revenueByDay[dateStr] !== undefined) {
                revenueByDay[dateStr] += t.amount || 0;
              }
            }
          });

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
   * Récupérer les données pour le graphique des transactions par statut
   */
  getTransactionsStatusChart: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    try {
      const allTransactions = await db.select().from(transactions);

      const statusCounts = {
        "Réussies": allTransactions.filter(t => t.status === "success").length,
        "En Attente": allTransactions.filter(t => t.status === "pending" || t.status === "processing").length,
        "Échouées": allTransactions.filter(t => t.status === "failed" || t.status === "cancelled").length,
      };

      return {
        success: true,
        data: Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value,
        })),
      };
    } catch (error) {
      console.error("[AdminDashboardStats] Error fetching transactions status chart:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la récupération des données des transactions",
      });
    }
  }),

  /**
   * Récupérer les données pour le graphique des candidats par destination
   */
  getCandidatesByDestinationChart: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    try {
      const allApplications = await db.select().from(applications);

      // Grouper par destination
      const destinationCounts: Record<string, number> = {};
      allApplications.forEach(app => {
        const dest = (app as any).destinationCountry;
        if (dest) {
          destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
        }
      });

      const data = Object.entries(destinationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([destination, count]) => ({
          destination,
          count,
        }));

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("[AdminDashboardStats] Error fetching candidates by destination:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la récupération des données des destinations",
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
              candidatePhone: candidate?.phone || "N/A",
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
   * Récupérer les transactions récentes
   */
  getRecentTransactions: protectedProcedure
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
        const recentTransactions = await db
          .select()
          .from(transactions)
          .orderBy(desc(transactions.createdAt))
          .limit(input.limit);

        return {
          success: true,
          data: recentTransactions,
        };
      } catch (error) {
        console.error("[AdminDashboardStats] Error fetching recent transactions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des transactions récentes",
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
      const allTransactions = await db.select().from(transactions);
      const allCandidates = await db.select().from(candidates);

      // Calculer les taux
      const approvalRate =
        allApplications.length > 0
          ? Math.round(
              (allApplications.filter(a => (a as any).status === "APPROVED").length / allApplications.length) * 100
            )
          : 0;

      const conversionRate =
        allCandidates.length > 0
          ? Math.round(
              (allTransactions.filter(t => t.status === "success").length / allCandidates.length) * 100
            )
          : 0;

      const totalRevenue = allTransactions
        .filter(t => t.status === "success")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const averageTransactionValue =
        allTransactions.filter(t => t.status === "success").length > 0
          ? Math.round(
              totalRevenue / allTransactions.filter(t => t.status === "success").length
            )
          : 0;

      return {
        success: true,
        kpis: {
          approvalRate: `${approvalRate}%`,
          conversionRate: `${conversionRate}%`,
          totalRevenue: `${totalRevenue.toLocaleString("fr-FR")} XOF`,
          averageTransactionValue: `${averageTransactionValue.toLocaleString("fr-FR")} XOF`,
          totalApplications: allApplications.length,
          totalCandidates: allCandidates.length,
          totalTransactions: allTransactions.length,
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
