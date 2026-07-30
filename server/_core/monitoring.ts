/**
 * Système de monitoring des performances du serveur
 * Détecte les timeouts, ralentissements et problèmes de performance
 */

import fs from "fs";
import path from "path";

// Configuration des seuils d'alerte
const THRESHOLDS = {
  SLOW_REQUEST_MS: 5000, // Requête lente si > 5s
  TIMEOUT_MS: 30000, // Timeout si > 30s
  ERROR_RATE_THRESHOLD: 0.1, // Alerte si > 10% d'erreurs
  MEMORY_THRESHOLD_MB: 500, // Alerte si > 500MB
};

// Métriques en mémoire
interface RequestMetric {
  procedure: string;
  duration: number;
  timestamp: number;
  status: "success" | "error" | "timeout";
  error?: string;
}

interface PerformanceMetrics {
  requests: RequestMetric[];
  startTime: number;
  totalRequests: number;
  totalErrors: number;
  totalTimeouts: number;
  averageResponseTime: number;
  peakMemoryUsage: number;
}

const metrics: PerformanceMetrics = {
  requests: [],
  startTime: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
  totalTimeouts: 0,
  averageResponseTime: 0,
  peakMemoryUsage: 0,
};

// Fichier de log des performances
const logsDir = path.join(process.cwd(), ".manus-logs");
const performanceLogPath = path.join(logsDir, "performance.log");

// Créer le répertoire de logs s'il n'existe pas
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Enregistrer une requête tRPC
 */
export function recordRequest(
  procedure: string,
  duration: number,
  status: "success" | "error" | "timeout",
  error?: string
) {
  const metric: RequestMetric = {
    procedure,
    duration,
    timestamp: Date.now(),
    status,
    error,
  };

  metrics.requests.push(metric);
  metrics.totalRequests++;

  if (status === "error") metrics.totalErrors++;
  if (status === "timeout") metrics.totalTimeouts++;

  // Garder seulement les 1000 dernières requêtes en mémoire
  if (metrics.requests.length > 1000) {
    metrics.requests.shift();
  }

  // Mettre à jour le temps de réponse moyen
  const totalDuration = metrics.requests.reduce((sum, r) => sum + r.duration, 0);
  metrics.averageResponseTime = totalDuration / metrics.requests.length;

  // Vérifier les seuils d'alerte
  checkThresholds(metric);

  // Enregistrer dans le fichier de log
  logPerformanceMetric(metric);
}

/**
 * Vérifier les seuils d'alerte
 */
function checkThresholds(metric: RequestMetric) {
  const alerts: string[] = [];

  // Alerte pour requête lente
  if (metric.duration > THRESHOLDS.SLOW_REQUEST_MS) {
    alerts.push(
      `⚠️ SLOW REQUEST: ${metric.procedure} took ${metric.duration}ms`
    );
  }

  // Alerte pour timeout
  if (metric.status === "timeout") {
    alerts.push(
      `🔴 TIMEOUT: ${metric.procedure} exceeded ${THRESHOLDS.TIMEOUT_MS}ms`
    );
  }

  // Alerte pour erreur
  if (metric.status === "error") {
    alerts.push(`❌ ERROR: ${metric.procedure} - ${metric.error}`);
  }

  // Taux d'erreur élevé
  const errorRate = metrics.totalErrors / metrics.totalRequests;
  if (errorRate > THRESHOLDS.ERROR_RATE_THRESHOLD) {
    alerts.push(
      `⚠️ HIGH ERROR RATE: ${(errorRate * 100).toFixed(2)}% errors`
    );
  }

  // Afficher les alertes dans la console
  alerts.forEach((alert) => {
    console.warn(`[PERFORMANCE] ${alert}`);
  });
}

/**
 * Enregistrer une métrique de performance dans le fichier de log
 */
function logPerformanceMetric(metric: RequestMetric) {
  const logEntry = {
    timestamp: new Date(metric.timestamp).toISOString(),
    procedure: metric.procedure,
    duration: metric.duration,
    status: metric.status,
    error: metric.error || null,
  };

  const logLine = JSON.stringify(logEntry) + "\n";

  fs.appendFile(performanceLogPath, logLine, (err) => {
    if (err) {
      console.error("[PERFORMANCE] Failed to write log:", err);
    }
  });
}

/**
 * Obtenir les métriques actuelles
 */
export function getMetrics(): PerformanceMetrics {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

  // Mettre à jour le pic d'utilisation mémoire
  if (heapUsedMB > metrics.peakMemoryUsage) {
    metrics.peakMemoryUsage = heapUsedMB;
  }

  // Alerte pour utilisation mémoire élevée
  if (heapUsedMB > THRESHOLDS.MEMORY_THRESHOLD_MB) {
    console.warn(
      `[PERFORMANCE] ⚠️ HIGH MEMORY USAGE: ${heapUsedMB}MB (threshold: ${THRESHOLDS.MEMORY_THRESHOLD_MB}MB)`
    );
  }

  return {
    ...metrics,
    peakMemoryUsage: metrics.peakMemoryUsage,
  };
}

/**
 * Obtenir un résumé des performances
 */
export function getPerformanceSummary() {
  const uptime = Date.now() - metrics.startTime;
  const errorRate = metrics.totalRequests > 0 
    ? (metrics.totalErrors / metrics.totalRequests) * 100 
    : 0;
  const timeoutRate = metrics.totalRequests > 0
    ? (metrics.totalTimeouts / metrics.totalRequests) * 100
    : 0;

  // Requêtes lentes (> 5s)
  const slowRequests = metrics.requests.filter(
    (r) => r.duration > THRESHOLDS.SLOW_REQUEST_MS
  );

  // Top 5 des procédures les plus lentes
  const procedureStats = new Map<string, { count: number; totalDuration: number; avgDuration: number }>();
  metrics.requests.forEach((r) => {
    if (!procedureStats.has(r.procedure)) {
      procedureStats.set(r.procedure, { count: 0, totalDuration: 0, avgDuration: 0 });
    }
    const stat = procedureStats.get(r.procedure)!;
    stat.count++;
    stat.totalDuration += r.duration;
    stat.avgDuration = stat.totalDuration / stat.count;
  });

  const slowestProcedures = Array.from(procedureStats.entries())
    .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
    .slice(0, 5)
    .map(([name, stat]) => ({
      name,
      avgDuration: Math.round(stat.avgDuration),
      count: stat.count,
    }));

  return {
    uptime,
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    totalTimeouts: metrics.totalTimeouts,
    errorRate: errorRate.toFixed(2) + "%",
    timeoutRate: timeoutRate.toFixed(2) + "%",
    averageResponseTime: Math.round(metrics.averageResponseTime) + "ms",
    peakMemoryUsage: metrics.peakMemoryUsage + "MB",
    slowRequests: slowRequests.length,
    slowestProcedures,
  };
}

/**
 * Réinitialiser les métriques
 */
export function resetMetrics() {
  metrics.requests = [];
  metrics.totalRequests = 0;
  metrics.totalErrors = 0;
  metrics.totalTimeouts = 0;
  metrics.averageResponseTime = 0;
  metrics.startTime = Date.now();
}

/**
 * Exporter les métriques pour analyse
 */
export function exportMetrics() {
  const summary = getPerformanceSummary();
  const timestamp = new Date().toISOString();

  const report = {
    timestamp,
    summary,
    recentRequests: metrics.requests.slice(-50), // Dernières 50 requêtes
  };

  const reportPath = path.join(logsDir, `performance-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return reportPath;
}
