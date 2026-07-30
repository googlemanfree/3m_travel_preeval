import React, { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Download, RotateCcw } from "lucide-react";

interface PerformanceSummary {
  uptime: number;
  totalRequests: number;
  totalErrors: number;
  totalTimeouts: number;
  errorRate: string;
  timeoutRate: string;
  averageResponseTime: string;
  peakMemoryUsage: string;
  slowRequests: number;
  slowestProcedures: Array<{
    name: string;
    avgDuration: number;
    count: number;
  }>;
}

export function PerformanceDashboard() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const metricsQuery = trpc.monitoring.getSummary.useQuery(undefined, {
    enabled: false,
  });

  const exportMutation = trpc.monitoring.exportMetrics.useMutation();
  const resetMutation = trpc.monitoring.resetMetrics.useMutation();

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const result = await metricsQuery.refetch();
      if (result.data) {
        setSummary(result.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync();
      alert("Métriques exportées avec succès");
    } catch (error) {
      console.error("Failed to export metrics:", error);
      alert("Erreur lors de l'export des métriques");
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir réinitialiser les métriques ?"
      )
    ) {
      try {
        await resetMutation.mutateAsync();
        setSummary(null);
        setLastUpdated(null);
        alert("Métriques réinitialisées");
      } catch (error) {
        console.error("Failed to reset metrics:", error);
        alert("Erreur lors de la réinitialisation");
      }
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Surveillance des Performances
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitoring en temps réel du serveur tRPC
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4" />
            {isLoading ? "Chargement..." : "Actualiser"}
          </Button>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="gap-2 text-red-600 hover:text-red-700"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Message de mise à jour */}
      {lastUpdated && (
        <p className="text-xs text-gray-500">
          Dernière mise à jour : {lastUpdated.toLocaleTimeString("fr-FR")}
        </p>
      )}

      {/* Grille de métriques */}
      {summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Uptime */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatUptime(summary.uptime)}
                </div>
              </CardContent>
            </Card>

            {/* Total des requêtes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Requêtes Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.totalRequests.toLocaleString("fr-FR")}
                </div>
              </CardContent>
            </Card>

            {/* Taux d'erreur */}
            <Card
              className={
                parseFloat(summary.errorRate) > 5
                  ? "border-red-200 bg-red-50"
                  : ""
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  {parseFloat(summary.errorRate) > 5 && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  Taux d'Erreur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    parseFloat(summary.errorRate) > 5
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {summary.errorRate}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.totalErrors} erreurs
                </p>
              </CardContent>
            </Card>

            {/* Taux de timeout */}
            <Card
              className={
                parseFloat(summary.timeoutRate) > 1
                  ? "border-orange-200 bg-orange-50"
                  : ""
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  {parseFloat(summary.timeoutRate) > 1 && (
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  )}
                  Taux de Timeout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    parseFloat(summary.timeoutRate) > 1
                      ? "text-orange-600"
                      : "text-gray-900"
                  }`}
                >
                  {summary.timeoutRate}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.totalTimeouts} timeouts
                </p>
              </CardContent>
            </Card>

            {/* Temps de réponse moyen */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Temps Moyen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.averageResponseTime}
                </div>
              </CardContent>
            </Card>

            {/* Requêtes lentes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Requêtes Lentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.slowRequests}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  &gt; 5 secondes
                </p>
              </CardContent>
            </Card>

            {/* Utilisation mémoire */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Mémoire (pic)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.peakMemoryUsage}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Procédures les plus lentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Top 5 Procédures les Plus Lentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.slowestProcedures.length > 0 ? (
                  summary.slowestProcedures.map((proc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {proc.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Appelée {proc.count} fois
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {proc.avgDuration}ms
                        </p>
                        <p className="text-xs text-gray-500">moyenne</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    Aucune donnée disponible
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Cliquez sur "Actualiser" pour charger les métriques
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
