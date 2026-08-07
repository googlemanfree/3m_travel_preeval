import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, MessageSquare, Zap } from 'lucide-react';

export default function AdminAccompagnement() {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || "" : "";
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Récupérer les évaluations en attente de contact
  const { data: evalsData, isLoading: evalsLoading, refetch: refetchEvals } = trpc.admin.getEvaluationsAwaitingContact.useQuery({ sessionToken }, { enabled: !!sessionToken });

  // Récupérer les statistiques globales
  const { data: statsData, isLoading: statsLoading } = trpc.admin.getGlobalStats.useQuery({ sessionToken }, { enabled: !!sessionToken });

  // Mutation pour avancer le statut
  const advanceStatusMutation = trpc.admin.advanceEvaluationStatus.useMutation({
    onSuccess: () => {
      refetchEvals();
      setSelectedEval(null);
      setNewStatus('');
      setNotes('');
    },
  });

  const stats = statsData?.stats;
  const evals = evalsData?.evaluations || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Accompagnement</h1>
          <p className="text-gray-600">Gestion de l'avancement rapide des dossiers</p>
        </div>

        {/* Statistiques globales */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Évaluations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalEvaluations}</div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">En Attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats.evaluationsByStatus.pending}</div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">Révisées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.evaluationsByStatus.reviewed}</div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-600">Contactées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats.evaluationsByStatus.contacted}</div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Fermées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.evaluationsByStatus.closed}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Taux de conversion */}
        {!statsLoading && stats && (
          <Card className="mb-8 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                Taux de Conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${stats.conversionRate}%` }}
                    />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Évaluations en attente de contact */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              Dossiers à Contacter
            </CardTitle>
          </CardHeader>
          <CardContent>
            {evalsLoading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : evals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucun dossier à contacter</div>
            ) : (
              <div className="space-y-4">
                {evals.map((eval_: any) => (
                  <div
                    key={eval_.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => setSelectedEval(eval_)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{eval_.fullName}</h3>
                        <p className="text-sm text-gray-600">{eval_.email}</p>
                        <p className="text-sm text-gray-600">{eval_.phone}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{eval_.destinationCountry}</Badge>
                          <Badge variant="outline">{eval_.visaType}</Badge>
                        </div>
                      </div>
                      <div>
                        <Badge className="bg-blue-600">{eval_.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulaire d'avancement rapide */}
        {selectedEval && (
          <Card className="mt-8 bg-white shadow-lg border-2 border-teal-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Avancer le Dossier
                </CardTitle>
                <Button
                  onClick={() => setSelectedEval(null)}
                  variant="ghost"
                  size="sm"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Informations candidat */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Candidat</h3>
                  <p className="text-gray-600">{selectedEval.fullName}</p>
                  <p className="text-gray-600">{selectedEval.email}</p>
                  <p className="text-gray-600">{selectedEval.phone}</p>
                </div>

                {/* Sélection du nouveau statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau Statut
                  </label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reviewed">Révisée</SelectItem>
                      <SelectItem value="contacted">Contactée</SelectItem>
                      <SelectItem value="closed">Fermée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes optionnelles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <Textarea
                    placeholder="Ajouter des notes sur l'avancement..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-24"
                  />
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (newStatus) {
                        advanceStatusMutation.mutate({
                          sessionToken,
                          evaluationId: selectedEval.id,
                          newStatus: newStatus as any,
                          notes: notes || undefined,
                        });
                      }
                    }}
                    disabled={!newStatus || advanceStatusMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700 flex-1"
                  >
                    {advanceStatusMutation.isPending ? 'Avancement...' : 'Avancer le Dossier'}
                  </Button>
                  <Button
                    onClick={() => setSelectedEval(null)}
                    variant="outline"
                  >
                    Annuler
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
