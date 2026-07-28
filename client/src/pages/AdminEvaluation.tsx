import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

export default function AdminEvaluation() {
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Récupérer les rapports en attente
  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = trpc.admin.getEvaluationPendingReports.useQuery();

  // Récupérer les statistiques
  const { data: statsData, isLoading: statsLoading } = trpc.admin.getEvaluationStats.useQuery();

  // Retenter l'envoi d'un rapport
  const retryReportMutation = trpc.application.retryAIReportSend.useMutation({
    onSuccess: () => {
      refetchReports();
    },
  });

  const stats = statsData?.stats;
  const reports = reportsData?.reports || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Évaluation</h1>
          <p className="text-gray-600">Gestion des CV et rapports IA</p>
        </div>

        {/* Statistiques */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Rapports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Envoyés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.sent}</div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  En Attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Échoués
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Taux de succès */}
        {!statsLoading && stats && (
          <Card className="mb-8 bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Taux de Succès</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${stats.successRate}%` }}
                    />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.successRate}%</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rapports en attente */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Rapports en Attente</CardTitle>
              <Button
                onClick={() => refetchReports()}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucun rapport en attente</div>
            ) : (
              <div className="space-y-4">
                {reports.map((report: any) => (
                  <div
                    key={report.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => setSelectedReport(report)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Voir le rapport de ${report.candidateName}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedReport(report);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{report.candidateName}</h3>
                        <p className="text-sm text-gray-600">{report.candidateEmail}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          ID: {report.reportId}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(report.generatedAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={report.sendStatus === 'sent' ? 'default' : 'secondary'}>
                          {report.sendStatus}
                        </Badge>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            retryReportMutation.mutate({ reportId: report.reportId });
                          }}
                          size="sm"
                          variant="outline"
                          disabled={retryReportMutation.isPending}
                        >
                          Retenter
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Détails du rapport sélectionné */}
        {selectedReport && (
          <Card className="mt-8 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Détails du Rapport</CardTitle>
                <Button
                  onClick={() => setSelectedReport(null)}
                  variant="ghost"
                  size="sm"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Candidat</h3>
                  <p className="text-gray-600">{selectedReport.candidateName}</p>
                  <p className="text-gray-600">{selectedReport.candidateEmail}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rapport</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                    {selectedReport.reportContent}
                  </pre>
                </div>

                {selectedReport.lastSendError && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">Erreur d'envoi</h3>
                    <p className="text-red-700">{selectedReport.lastSendError}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      retryReportMutation.mutate({ reportId: selectedReport.reportId });
                      setSelectedReport(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Retenter l'envoi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
