import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Globe, TrendingUp, Users } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminProcedures() {
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Récupérer les statistiques par destination
  const { data: destData, isLoading: destLoading } = trpc.admin.getEvaluationsByDestination.useQuery();

  // Récupérer les évaluations par destination
  const { data: evalsData, isLoading: evalsLoading } = trpc.admin.getEvaluationsByDestinationName.useQuery(
    {
      destination: selectedDestination,
      status: selectedStatus as any,
    },
    { enabled: !!selectedDestination }
  );

  const destinations = destData?.destinations || [];
  const evals = evalsData?.evaluations || [];

  // Préparer les données pour le graphique
  const chartData = destinations.map(d => ({
    name: d.destination,
    total: d.total,
    pending: d.pending,
    reviewed: d.reviewed,
    contacted: d.contacted,
    closed: d.closed,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Procédures</h1>
          <p className="text-gray-600">Gestion des procédures par pays et destination</p>
        </div>

        {/* Statistiques par destination */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Graphique en barres */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Dossiers par Destination
              </CardTitle>
            </CardHeader>
            <CardContent>
              {destLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#3b82f6" name="Total" />
                    <Bar dataKey="pending" fill="#f59e0b" name="En Attente" />
                    <Bar dataKey="reviewed" fill="#8b5cf6" name="Révisées" />
                    <Bar dataKey="contacted" fill="#10b981" name="Contactées" />
                    <Bar dataKey="closed" fill="#ef4444" name="Fermées" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Destinations */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                Destinations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {destLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {destinations.map((dest: any) => (
                    <div
                      key={dest.destination}
                      onClick={() => setSelectedDestination(dest.destination)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selectedDestination === dest.destination}
                      aria-label={`Voir la destination ${dest.destination}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedDestination(dest.destination);
                        }
                      }}
                      className={`p-4 rounded-lg cursor-pointer transition ${
                        selectedDestination === dest.destination
                          ? 'bg-purple-100 border-2 border-purple-600'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{dest.destination}</h3>
                        <Badge className="bg-blue-600">{dest.total}</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-center">
                          <div className="font-bold">{dest.pending}</div>
                          <div>En Attente</div>
                        </div>
                        <div className="bg-blue-100 text-blue-800 p-2 rounded text-center">
                          <div className="font-bold">{dest.reviewed}</div>
                          <div>Révisées</div>
                        </div>
                        <div className="bg-green-100 text-green-800 p-2 rounded text-center">
                          <div className="font-bold">{dest.contacted}</div>
                          <div>Contactées</div>
                        </div>
                        <div className="bg-red-100 text-red-800 p-2 rounded text-center">
                          <div className="font-bold">{dest.closed}</div>
                          <div>Fermées</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtres et détails */}
        {selectedDestination && (
          <Card className="bg-white shadow-lg mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-600" />
                  Dossiers - {selectedDestination}
                </CardTitle>
                <Button
                  onClick={() => {
                    setSelectedDestination('');
                    setSelectedStatus('');
                  }}
                  variant="ghost"
                  size="sm"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtres par statut */}
              <div className="mb-6 flex gap-2 flex-wrap">
                <Button
                  onClick={() => setSelectedStatus('')}
                  variant={selectedStatus === '' ? 'default' : 'outline'}
                  size="sm"
                >
                  Tous
                </Button>
                <Button
                  onClick={() => setSelectedStatus('pending')}
                  variant={selectedStatus === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                >
                  En Attente
                </Button>
                <Button
                  onClick={() => setSelectedStatus('reviewed')}
                  variant={selectedStatus === 'reviewed' ? 'default' : 'outline'}
                  size="sm"
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  Révisées
                </Button>
                <Button
                  onClick={() => setSelectedStatus('contacted')}
                  variant={selectedStatus === 'contacted' ? 'default' : 'outline'}
                  size="sm"
                  className="bg-green-100 text-green-800 hover:bg-green-200"
                >
                  Contactées
                </Button>
                <Button
                  onClick={() => setSelectedStatus('closed')}
                  variant={selectedStatus === 'closed' ? 'default' : 'outline'}
                  size="sm"
                  className="bg-red-100 text-red-800 hover:bg-red-200"
                >
                  Fermées
                </Button>
              </div>

              {/* Liste des dossiers */}
              {evalsLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : evals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Aucun dossier trouvé</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {evals.map((eval_: any) => (
                    <div
                      key={eval_.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{eval_.fullName}</h3>
                          <p className="text-sm text-gray-600">{eval_.email}</p>
                          <p className="text-sm text-gray-600">{eval_.phone}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{eval_.destinationCountry}</Badge>
                            <Badge variant="outline">{eval_.visaType}</Badge>
                            <Badge variant="outline">{eval_.educationLevel}</Badge>
                          </div>
                        </div>
                        <div>
                          <Badge
                            className={
                              eval_.status === 'pending'
                                ? 'bg-yellow-600'
                                : eval_.status === 'reviewed'
                                ? 'bg-blue-600'
                                : eval_.status === 'contacted'
                                ? 'bg-green-600'
                                : 'bg-red-600'
                            }
                          >
                            {eval_.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
