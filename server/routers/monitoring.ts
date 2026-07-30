/**
 * Router pour accéder aux métriques de performance du serveur
 * Accessible uniquement aux administrateurs
 */

import { adminProcedure, router } from "../_core/trpc";
import {
  getMetrics,
  getPerformanceSummary,
  exportMetrics,
  resetMetrics,
} from "../_core/monitoring";

export const monitoringRouter = router({
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
