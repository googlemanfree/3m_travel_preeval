import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Users, TrendingUp, LogOut, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  // Récupérer les infos de l'admin depuis localStorage
  const adminName = localStorage.getItem('adminName') || 'Admin';
  const adminEmail = localStorage.getItem('adminType') || '';
  const sessionToken = localStorage.getItem('adminSessionToken') || '';

  // Mutations
  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem('adminSessionToken');
      localStorage.removeItem('adminType');
      localStorage.removeItem('adminName');
      toast.success('Déconnexion réussie');
      navigate('/admin/login');
    },
    onError: () => {
      toast.error('Erreur lors de la déconnexion');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate({ sessionToken });
  };

  // Données de démonstration
  const evaluationStats = {
    pending: 12,
    reviewed: 28,
    contacted: 45,
    closed: 156,
  };

  const statusData = [
    { name: 'Nouveau', value: 12 },
    { name: 'Révisé', value: 28 },
    { name: 'Contacté', value: 45 },
    { name: 'Fermé', value: 156 },
  ];

  const destinationData = [
    { name: 'Canada', value: 45 },
    { name: 'Schengen', value: 78 },
    { name: 'Autre', value: 18 },
  ];

  const monthlyData = [
    { month: 'Jan', dossiers: 24, paiements: 18 },
    { month: 'Fév', dossiers: 32, paiements: 28 },
    { month: 'Mar', dossiers: 28, paiements: 25 },
    { month: 'Avr', dossiers: 41, paiements: 38 },
    { month: 'Mai', dossiers: 35, paiements: 32 },
    { month: 'Juin', dossiers: 48, paiements: 45 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🛠️ Dashboard Admin</h1>
            <p className="text-blue-100 mt-1">Bienvenue, {adminName}</p>
          </div>
          <Button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            variant="outline"
            className="text-white border-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Dossiers en attente</p>
                  <p className="text-3xl font-bold text-white">{evaluationStats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Dossiers révisés</p>
                  <p className="text-3xl font-bold text-white">{evaluationStats.reviewed}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Candidats contactés</p>
                  <p className="text-3xl font-bold text-white">{evaluationStats.contacted}</p>
                </div>
                <Users className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Dossiers fermés</p>
                  <p className="text-3xl font-bold text-white">{evaluationStats.closed}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="overview" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              📊 Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              📋 Évaluation
            </TabsTrigger>
            <TabsTrigger value="accompagnement" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              🚀 Accompagnement
            </TabsTrigger>
            <TabsTrigger value="procedures" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              🌍 Procédures
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique statut */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Répartition par statut</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Graphique destination */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Dossiers par destination</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={destinationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Graphique mensuel */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Tendance mensuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                    <Line type="monotone" dataKey="dossiers" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="paiements" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Évaluation */}
          <TabsContent value="evaluation" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Gestion des Évaluations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  ✅ Gérer les CV et rapports IA<br/>
                  ✅ Consulter l'historique des rapports<br/>
                  ✅ Retenter l'envoi des rapports échoués<br/>
                  ✅ Voir les statistiques d'évaluation
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Accéder aux évaluations →
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accompagnement */}
          <TabsContent value="accompagnement" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestion de l'Accompagnement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  ✅ Avancer rapidement les statuts des dossiers<br/>
                  ✅ Contacter les candidats<br/>
                  ✅ Ajouter des notes et commentaires<br/>
                  ✅ Gérer les dossiers en attente de contact
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Gérer l'accompagnement →
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Procédures */}
          <TabsContent value="procedures" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Gestion des Procédures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  ✅ Voir les procédures par destination<br/>
                  ✅ Consulter les statistiques par pays<br/>
                  ✅ Analyser les tendances de dossiers<br/>
                  ✅ Générer des rapports par destination
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Gérer les procédures →
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Alerte info */}
        <Card className="bg-blue-900/20 border-blue-700 mt-8">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-300 font-semibold">Vous avez accès à toutes les fonctionnalités</p>
              <p className="text-blue-200 text-sm mt-1">
                En tant qu'administrateur, vous pouvez gérer les évaluations, l'accompagnement des candidats et les procédures par destination. Utilisez les onglets ci-dessus pour naviguer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
