/**
 * Router pour accéder aux métriques de performance du serveur
 * Accessible uniquement aux administrateurs
 */

import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { adminProcedure, router } from "../_core/trpc";
import {
  getMetrics,
  getPerformanceSummary,
  exportMetrics,
  resetMetrics,
} from "../_core/monitoring";
import { getSmtpHealth } from "../_core/email";

export const monitoringRouter = router({
  /** État synthétique, réservé aux administrateurs connectés. */
  getConnectivityStatus: adminProcedure.query(async () => {
    const startedAt = Date.now();
    let databaseStatus: "operational" | "unavailable" = "unavailable";
    let databaseLatencyMs: number | null = null;
    let databaseMessage = "Base de données indisponible";

    try {
      const db = await getDb();
      if (db) {
        const databaseStartedAt = Date.now();
        await db.execute(sql`SELECT 1`);
        databaseLatencyMs = Date.now() - databaseStartedAt;
        databaseStatus = "operational";
        databaseMessage = "Connexion base de données confirmée";
      }
    } catch {
      databaseMessage = "Le test de connexion à la base a échoué";
    }

    const [smtp, summary] = await Promise.all([getSmtpHealth(), Promise.resolve(getPerformanceSummary())]);
    const apiLatencyMs = Date.now() - startedAt;
    const serverStatus = databaseStatus === "operational" ? "operational" : "degraded";

    return {
      checkedAt: new Date(),
      server: {
        status: serverStatus,
        latencyMs: apiLatencyMs,
        uptimeMs: summary.uptime,
        averageResponseTime: summary.averageResponseTime,
      },
      database: {
        status: databaseStatus,
        latencyMs: databaseLatencyMs,
        message: databaseMessage,
      },
      smtp,
      traffic: {
        totalRequests: summary.totalRequests,
        errorRate: summary.errorRate,
        timeoutRate: summary.timeoutRate,
      },
    };
  }),

  /** Lance un diagnostic ponctuel et recontrôle immédiatement les dépendances internes. */
  runConnectivityDiagnostic: adminProcedure.mutation(async () => {
    const startedAt = Date.now();
    const [db, smtp] = await Promise.all([getDb(), getSmtpHealth()]);
    if (!db) {
      return {
        ok: false,
        checkedAt: new Date(),
        durationMs: Date.now() - startedAt,
        findings: ["La base de données n’est pas disponible.", `Messagerie : ${smtp.message}`],
      };
    }

    try {
      await db.execute(sql`SELECT 1`);
      return {
        ok: true,
        checkedAt: new Date(),
        durationMs: Date.now() - startedAt,
        findings: ["API tRPC accessible.", "Base de données accessible.", `Messagerie : ${smtp.message}`, "Les métriques serveur sont disponibles."],
      };
    } catch {
      return {
        ok: false,
        checkedAt: new Date(),
        durationMs: Date.now() - startedAt,
        findings: ["API tRPC accessible.", "Le test de connexion à la base de données a échoué.", `Messagerie : ${smtp.message}`],
      };
    }
  }),

  /**
   * Obtenir les métriques actuelles
   */
  getMetrics: adminProcedure.query(() => {
    return getMetrics();
  }),

  /**
   * Obtenir un résumé des performances
   */
  getSummary: adminProcedure.query(() => {
    return getPerformanceSummary();
  }),

  /**
   * Exporter les métriques pour analyse
   */
  exportMetrics: adminProcedure.mutation(async () => {
    const reportPath = exportMetrics();
    return {
      success: true,
      message: "Métriques exportées avec succès",
      reportPath,
    };
  }),

  /**
   * Réinitialiser les métriques
   */
  resetMetrics: adminProcedure.mutation(async () => {
    resetMetrics();
    return {
      success: true,
      message: "Métriques réinitialisées",
    };
  }),
});
