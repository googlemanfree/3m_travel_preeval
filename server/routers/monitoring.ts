/**
 * Router pour accéder aux métriques de performance du serveur
 * Accessible uniquement aux administrateurs
 */

import { and, desc, eq, gte, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb } from "../db";
import { applications, evaluationEmails } from "../../drizzle/schema";
import { evaluationBilanVersions } from "../../drizzle/caseTrackingSchema";
import { getSmtpHealth } from "../_core/email";
import { adminProcedure, router } from "../_core/trpc";
import {
  getMetrics,
  getPerformanceSummary,
  exportMetrics,
  resetMetrics,
} from "../_core/monitoring";

export const SMTP_ALERT_COOLDOWN_MS = 15 * 60 * 1000;
let lastSmtpFailureAlertAt = 0;

/** Évite de répéter les alertes SMTP lors d’un même incident. */
export async function notifySmtpFailureIfNeeded(reason: string, now = Date.now()) {
  if (now - lastSmtpFailureAlertAt < SMTP_ALERT_COOLDOWN_MS) return false;
  lastSmtpFailureAlertAt = now;
  // notifyOwner : l’intégration propriétaire peut relayer ce signal sans y joindre de données client.
  console.error("[SMTP] notifyOwner", { reason, at: new Date(now).toISOString() });
  return true;
}

export const monitoringRouter = router({
  getSmtpHealth: adminProcedure.query(() => getSmtpHealth()),

  /** Supervision agrégée des remises d’évaluation et des PDF, sans données personnelles. */
  getEvaluationDeliveryHealth: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Base de données indisponible");
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [emailRows, pdfRows, missingPdfRows] = await Promise.all([
      db.select({ status: evaluationEmails.status, createdAt: evaluationEmails.createdAt, sentAt: evaluationEmails.sentAt }).from(evaluationEmails).where(gte(evaluationEmails.createdAt, since)).orderBy(desc(evaluationEmails.createdAt)).limit(500),
      db.select({ generatedAt: evaluationBilanVersions.sentAt }).from(evaluationBilanVersions).where(isNotNull(evaluationBilanVersions.pdfKey)).orderBy(desc(evaluationBilanVersions.sentAt)).limit(200),
      db.select({ id: applications.id }).from(applications).where(and(eq(applications.evaluationDeliveryStatus, "sent"), isNull(applications.evaluationReportPdfKey))).limit(100),
    ]);
    const sentLast24h = emailRows.filter((row) => row.status === "sent").length;
    const failedLast24h = emailRows.filter((row) => row.status === "failed" || row.status === "bounced").length;
    const lastFailure = emailRows.find((row) => row.status === "failed" || row.status === "bounced");
    const lastSuccess = emailRows.find((row) => row.status === "sent");
    const smtp = getSmtpHealth();
    return {
      checkedAt: new Date(),
      smtp: {
        ...smtp,
        status: !smtp.configured ? "unavailable" as const : failedLast24h > 0 ? "degraded" as const : "operational" as const,
        sentLast24h,
        failedLast24h,
        lastFailureAt: lastFailure?.createdAt ?? null,
        lastSuccessAt: lastSuccess?.sentAt ?? lastSuccess?.createdAt ?? null,
      },
      pdf: {
        status: missingPdfRows.length > 0 ? "degraded" as const : pdfRows.length > 0 ? "operational" as const : "waiting" as const,
        generatedCount: pdfRows.length,
        missingForSentCount: missingPdfRows.length,
        lastGeneratedAt: pdfRows[0]?.generatedAt ?? null,
      },
    };
  }),

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

    const summary = getPerformanceSummary();
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
    const db = await getDb();
    if (!db) {
      await notifySmtpFailureIfNeeded("Base de données indisponible lors du diagnostic SMTP");
      return {
        ok: false,
        checkedAt: new Date(),
        durationMs: Date.now() - startedAt,
        findings: ["La base de données n’est pas disponible."],
      };
    }

    try {
      await db.execute(sql`SELECT 1`);
      return {
        ok: true,
        checkedAt: new Date(),
        durationMs: Date.now() - startedAt,
        findings: ["API tRPC accessible.", "Base de données accessible.", "Les métriques serveur sont disponibles."],
      };
    } catch {
      await notifySmtpFailureIfNeeded("Échec de diagnostic de connectivité SMTP");
      return {
        ok: false,
        checkedAt: new Date(),
        durationMs: Date.now() - startedAt,
        findings: ["API tRPC accessible.", "Le test de connexion à la base de données a échoué."],
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
