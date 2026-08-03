import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Search, FileText, CheckCircle2, Clock, AlertCircle, 
  Download, Mail, Eye, Edit2, Trash2, Send 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

export default function AdminEvaluations() {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || "" : "";
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Vérifier qu'une session admin existe
  useEffect(() => {
    if (!sessionToken) {
      setLocation("/admin/login");
    }
  }, [sessionToken, setLocation]);

  // Récupérer les bilans en attente
  const { data: bilansData, isLoading } = trpc.admin.getPendingBilans.useQuery(
    { sessionToken },
    { enabled: !!sessionToken }
  );

  // Récupérer toutes les applications
  const { data: applicationsData } = trpc.admin.getAllApplications.useQuery(
    { sessionToken },
    { enabled: !!sessionToken }
  );

  // Mutation pour publier le bilan
  const publishBilanMutation = trpc.admin.publishBilanToClient.useMutation({
    onSuccess: () => {
      toast.success("Bilan publié avec succès!");
      // Rafraîchir la liste
      window.location.reload();
    },
    onError: (err) => {
      toast.error("Erreur lors de la publication du bilan");
    },
  });

  const handlePublishBilan = (bilanId: number) => {
    if (confirm("Êtes-vous sûr de vouloir publier ce bilan?")) {
      publishBilanMutation.mutate({ sessionToken, bilanId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des évaluations...</p>
        </div>
      </div>
    );
  }

  if (!sessionToken) {
    return null;
  }

  const bilans = bilansData || [];
  const applications = applicationsData || [];

  // Filtrer les bilans
  const filteredBilans = (bilans as any[]).filter((bilan: any) => {
    const matchesSearch = 
      bilan.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bilan.candidateEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" || bilan.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
      draft: { label: "Brouillon", variant: "secondary", icon: <Clock className="w-4 h-4" /> },
      pending_validation: { label: "En attente", variant: "default", icon: <Clock className="w-4 h-4" /> },
      validated: { label: "Validé", variant: "default", icon: <CheckCircle2 className="w-4 h-4" /> },
      sent: { label: "Envoyé", variant: "default", icon: <Mail className="w-4 h-4" /> },
      rejected: { label: "Rejeté", variant: "destructive", icon: <AlertCircle className="w-4 h-4" /> },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary", icon: <Clock className="w-4 h-4" /> };
    return (
      <Badge variant={statusInfo.variant as any} className="gap-2">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Accéder aux Évaluations</h1>
          <p className="text-blue-100">Gérez et validez les bilans d'évaluation des candidats</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Bilans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{bilans.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En Attente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {bilans.filter((b: any) => b.status === "pending_validation").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Validés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {bilans.filter((b: any) => b.status === "validated").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Envoyés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {bilans.filter((b: any) => b.status === "sent").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recherche et Filtres */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rechercher et Filtrer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="pending_validation">En attente</option>
                <option value="validated">Validés</option>
                <option value="sent">Envoyés</option>
                <option value="rejected">Rejetés</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des Bilans */}
        <Card>
          <CardHeader>
            <CardTitle>Bilans d'Évaluation ({filteredBilans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Candidat</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Score</th>
                    <th className="text-left py-3 px-4 font-semibold">Statut</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBilans.map((bilan: any) => (
                    <tr key={bilan.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{bilan.candidateName}</td>
                      <td className="py-3 px-4">{bilan.candidateEmail}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-green-600">{bilan.score}/100</span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(bilan.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => setLocation(`/admin/evaluations/${bilan.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => setLocation(`/admin/evaluations/${bilan.id}/edit`)}
                          >
                            <Edit2 className="w-4 h-4" />
                            Éditer
                          </Button>
                          {bilan.status === 'validated' && (
                            <Button
                              size="sm"
                              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handlePublishBilan(bilan.id)}
                              disabled={publishBilanMutation.isPending}
                            >
                              <Send className="w-4 h-4" />
                              {publishBilanMutation.isPending ? "Publication..." : "Publier"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredBilans.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun bilan trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
