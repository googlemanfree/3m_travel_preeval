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
  clientDocuments,
  agencyDossiers,
} from "../../drizzle/schema";
import { eq, desc, count, sql } from "drizzle-orm";

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
      const [
        [appStats],
        [txStats],
        [candStats],
        [docStats],
        [dossierStats],
      ] = await Promise.all([
        db.select({
          total: count(),
          pending: count(sql`CASE WHEN status = 'PENDING_48H' THEN 1 END`),
          published: count(sql`CASE WHEN status = 'PUBLISHED' THEN 1 END`),
          submitted: count(sql`CASE WHEN status = 'SUBMITTED' THEN 1 END`),
          approved: count(sql`CASE WHEN status = 'APPROVED' THEN 1 END`),
        }).from(applications),
        db.select({
          total: count(),
          completed: count(sql`CASE WHEN status = 'success' THEN 1 END`),
          pending: count(sql`CASE WHEN status IN ('pending','processing') THEN 1 END`),
          failed: count(sql`CASE WHEN status IN ('failed','cancelled') THEN 1 END`),
          totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0)`,
        }).from(transactions),
        db.select({ total: count() }).from(candidates),
        db.select({
          total: count(),
          verified: count(sql`CASE WHEN verificationStatus = 'approved' THEN 1 END`),
        }).from(clientDocuments),
        db.select({ total: count() }).from(agencyDossiers),
      ]);

      return {
        success: true,
        applications: {
          total: appStats.total,
          pending: appStats.pending,
          published: appStats.published,
          submitted: appStats.submitted,
          approved: appStats.approved,
        },
        candidates: {
          total: candStats.total,
        },
        transactions: {
          total: txStats.total,
          completed: txStats.completed,
          pending: txStats.pending,
          failed: txStats.failed,
          totalRevenue: Number(txStats.totalRevenue),
        },
        documents: {
          total: docStats.total,
          verified: docStats.verified,
        },
        agencyDossiers: {
          total: dossierStats.total,
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
      const [stats] = await db.select({
        pending48h: count(sql`CASE WHEN status = 'PENDING_48H' THEN 1 END`),
        published: count(sql`CASE WHEN status = 'PUBLISHED' THEN 1 END`),
        documentsCheck: count(sql`CASE WHEN status = 'DOCUMENTS_CHECK' THEN 1 END`),
        submitted: count(sql`CASE WHEN status = 'SUBMITTED' THEN 1 END`),
        approved: count(sql`CASE WHEN status = 'APPROVED' THEN 1 END`),
      }).from(applications);

      return {
        success: true,
        data: [
          { name: "Évaluation 48h", value: stats.pending48h },
          { name: "Bilan Disponible", value: stats.published },
          { name: "Collecte Documents", value: stats.documentsCheck },
          { name: "Soumission Consulaire", value: stats.submitted },
          { name: "Approuvé", value: stats.approved },
        ],
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
        days: z.number().int().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - input.days);

        const rows = await db
          .select({
            dateStr: sql<string>`DATE(createdAt)`,
            revenue: sql<number>`COALESCE(SUM(amount), 0)`,
          })
          .from(transactions)
          .where(sql`status = 'success' AND createdAt >= ${cutoff.toISOString().split("T")[0]}`)
          .groupBy(sql`DATE(createdAt)`)
          .orderBy(sql`DATE(createdAt) ASC`);

        const revenueMap = new Map(rows.map(r => [r.dateStr, Number(r.revenue)]));

        const now = new Date();
        const data = Array.from({ length: input.days }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - (input.days - 1 - i));
          const dateStr = d.toISOString().split("T")[0];
          return {
            date: d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
            revenue: revenueMap.get(dateStr) ?? 0,
          };
        });

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
      const [stats] = await db.select({
        success: count(sql`CASE WHEN status = 'success' THEN 1 END`),
        pending: count(sql`CASE WHEN status IN ('pending','processing') THEN 1 END`),
        failed: count(sql`CASE WHEN status IN ('failed','cancelled') THEN 1 END`),
      }).from(transactions);

      return {
        success: true,
        data: [
          { name: "Réussies", value: stats.success },
          { name: "En Attente", value: stats.pending },
          { name: "Échouées", value: stats.failed },
        ],
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
      const rows = await db
        .select({
          destination: sql<string>`destinationCountry`,
          count: count(),
        })
        .from(applications)
        .where(sql`destinationCountry IS NOT NULL AND destinationCountry != ''`)
        .groupBy(sql`destinationCountry`)
        .orderBy(sql`count(*) DESC`)
        .limit(10);

      const data = rows.map(r => ({
        destination: r.destination,
        count: r.count,
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
        limit: z.number().int().min(1).max(200).default(10),
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
          .select({
            app: applications,
            candidateName: candidates.fullName,
            candidateEmail: candidates.email,
          })
          .from(applications)
          .leftJoin(candidates, eq(candidates.id, applications.candidateId as any))
          .orderBy(desc(applications.createdAt))
          .limit(input.limit);

        const enrichedApps = recentApps.map(row => ({
          ...row.app,
          candidateName: row.candidateName || "N/A",
          candidateEmail: row.candidateEmail || "N/A",
          candidatePhone: "N/A",
        }));

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
        limit: z.number().int().min(1).max(200).default(10),
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
      const [[appKpi], [txKpi], [candKpi]] = await Promise.all([
        db.select({
          total: count(),
          approved: count(sql`CASE WHEN status = 'APPROVED' THEN 1 END`),
        }).from(applications),
        db.select({
          total: count(),
          completed: count(sql`CASE WHEN status = 'success' THEN 1 END`),
          totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0)`,
        }).from(transactions),
        db.select({ total: count() }).from(candidates),
      ]);

      const totalRevenue = Number(txKpi.totalRevenue);
      const approvalRate = appKpi.total > 0 ? Math.round((appKpi.approved / appKpi.total) * 100) : 0;
      const conversionRate = candKpi.total > 0 ? Math.round((txKpi.completed / candKpi.total) * 100) : 0;
      const averageTransactionValue = txKpi.completed > 0 ? Math.round(totalRevenue / txKpi.completed) : 0;

      return {
        success: true,
        kpis: {
          approvalRate: `${approvalRate}%`,
          conversionRate: `${conversionRate}%`,
          totalRevenue: `${totalRevenue.toLocaleString("fr-FR")} XOF`,
          averageTransactionValue: `${averageTransactionValue.toLocaleString("fr-FR")} XOF`,
          totalApplications: appKpi.total,
          totalCandidates: candKpi.total,
          totalTransactions: txKpi.total,
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
