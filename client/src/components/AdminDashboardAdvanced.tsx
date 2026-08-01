/**
 * Composant Admin Dashboard Avancé
 * Affiche les statistiques, graphiques et KPIs du système
 */

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCw,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function AdminDashboardAdvanced() {
  const [refreshing, setRefreshing] = useState(false);

  // Récupérer les données
  const { data: globalStats, refetch: refetchGlobalStats, isLoading: loadingGlobalStats } = trpc.adminDashboardStats.getGlobalStats.useQuery();
  const { data: kpis, refetch: refetchKPIs, isLoading: loadingKPIs } = trpc.adminDashboardStats.getKPIs.useQuery();
  const { data: applicationsChart, refetch: refetchApplicationsChart } = trpc.adminDashboardStats.getApplicationsStatusChart.useQuery();
  const { data: revenueChart, refetch: refetchRevenueChart } = trpc.adminDashboardStats.getRevenueChart.useQuery({ days: 30 });
  const { data: transactionsChart, refetch: refetchTransactionsChart } = trpc.adminDashboardStats.getTransactionsStatusChart.useQuery();
  const { data: destinationChart, refetch: refetchDestinationChart } = trpc.adminDashboardStats.getCandidatesByDestinationChart.useQuery();
  const { data: recentApps, refetch: refetchRecentApps } = trpc.adminDashboardStats.getRecentApplications.useQuery({ limit: 5 });
  const { data: recentTransactions, refetch: refetchRecentTransactions } = trpc.adminDashboardStats.getRecentTransactions.useQuery({ limit: 5 });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchGlobalStats(),
      refetchKPIs(),
      refetchApplicationsChart(),
      refetchRevenueChart(),
      refetchTransactionsChart(),
      refetchDestinationChart(),
      refetchRecentApps(),
      refetchRecentTransactions(),
    ]);
    setRefreshing(false);
  };

  const isLoading = loadingGlobalStats || loadingKPIs;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton d'actualisation */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tableau de Bord Admin</h1>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* KPIs Principaux */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux d'Approbation</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.kpis.approvalRate}</div>
              <p className="text-xs text-gray-500">des dossiers approuvés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.kpis.conversionRate}</div>
              <p className="text-xs text-gray-500">des candidats convertis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.kpis.totalRevenue}</div>
              <p className="text-xs text-gray-500">généré</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur Moyenne</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.kpis.averageTransactionValue}</div>
              <p className="text-xs text-gray-500">par transaction</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques Globales */}
      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dossiers</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.applications.total}</div>
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <div>📋 En attente: {globalStats.applications.pending}</div>
                <div>✅ Approuvés: {globalStats.applications.approved}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidats</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.candidates.total}</div>
              <p className="text-xs text-gray-500 mt-2">candidats inscrits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.transactions.total}</div>
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <div>✅ Complétées: {globalStats.transactions.completed}</div>
                <div>⏳ En attente: {globalStats.transactions.pending}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique Dossiers par Statut */}
        {applicationsChart && (
          <Card>
            <CardHeader>
              <CardTitle>Dossiers par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={applicationsChart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Graphique Transactions par Statut */}
        {transactionsChart && (
          <Card>
            <CardHeader>
              <CardTitle>Transactions par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={transactionsChart.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {transactionsChart.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Graphique Revenus */}
        {revenueChart && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenus (30 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    name="Revenu (XOF)"
                    dot={{ fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Graphique Destinations */}
        {destinationChart && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top 10 Destinations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={destinationChart.data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="destination" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dossiers Récents */}
      {recentApps && (
        <Card>
          <CardHeader>
            <CardTitle>Dossiers Récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApps.data.map((app: any) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{app.candidateName}</p>
                    <p className="text-sm text-gray-500">{app.dossierNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{app.destinationCountry}</Badge>
                    <Badge
                      variant={app.status === "APPROVED" ? "default" : "secondary"}
                    >
                      {app.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Récentes */}
      {recentTransactions && (
        <Card>
          <CardHeader>
            <CardTitle>Transactions Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.data.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{transaction.dossierNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {transaction.amount?.toLocaleString("fr-FR")} XOF
                    </span>
                    <Badge
                      variant={
                        transaction.status === "completed"
                          ? "default"
                          : transaction.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminDashboardAdvanced;
