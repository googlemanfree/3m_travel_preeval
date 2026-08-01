import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

export default function AdminEvisaDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");

  // Vérifier que l'utilisateur est admin
  if (!loading && user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-foreground/70">
            Seuls les administrateurs peuvent accéder à cette page.
          </p>
          <Button onClick={() => setLocation("/")} className="mt-6 w-full">
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  const { data: requestsData, isLoading } = trpc.evisaAdmin.getAllRequests.useQuery(
    {
      page,
      limit: 20,
      status: status || undefined,
      search: search || undefined,
    },
    { enabled: !!user }
  );

  const { data: statsData } = trpc.evisaAdmin.getStatistics.useQuery(undefined, {
    enabled: !!user,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "processing":
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "En attente",
      processing: "En traitement",
      approved: "Approuvée",
      rejected: "Rejetée",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Tableau de Bord Admin - E-Visas</h1>

        {/* Statistiques */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="p-6">
              <p className="text-sm text-foreground/70">Total</p>
              <p className="text-3xl font-bold">{statsData.total || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-foreground/70">En attente</p>
              <p className="text-3xl font-bold text-yellow-500">{statsData.pending || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-foreground/70">En traitement</p>
              <p className="text-3xl font-bold text-blue-500">{statsData.processing || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-foreground/70">Approuvées</p>
              <p className="text-3xl font-bold text-green-500">{statsData.approved || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-foreground/70">Revenu Total</p>
              <p className="text-2xl font-bold">{(statsData.totalRevenue || 0).toLocaleString()} XOF</p>
            </Card>
          </div>
        )}

        {/* Filtres */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                placeholder="Nom ou email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={status} onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="processing">En traitement</SelectItem>
                  <SelectItem value="approved">Approuvée</SelectItem>
                  <SelectItem value="rejected">Rejetée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Liste des demandes */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Dossier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Candidat</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Pays</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Coût</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-foreground/70">
                      Chargement...
                    </td>
                  </tr>
                ) : requestsData?.requests && (requestsData.requests as any[]).length > 0 ? (
                  (requestsData.requests as any[]).map((request: any) => (
                    <tr key={request.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-mono">
                        {request.dossierNumber || `#${request.id}`}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>{request.fullName}</div>
                        <div className="text-xs text-foreground/70">{request.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">{request.countryName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <span className="text-sm">{getStatusLabel(request.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {(request.totalCost || 0).toLocaleString()} XOF
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/admin/evisa/${request.id}`)}
                        >
                          Détails
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-foreground/70">
                      Aucune demande trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {requestsData && requestsData.total > 0 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-foreground/70">
                Affichage {(page - 1) * 20 + 1} à{" "}
                {Math.min(page * 20, requestsData.total)} sur {requestsData.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage(
                      Math.min(
                        Math.ceil(requestsData.total / 20),
                        page + 1
                      )
                    )
                  }
                  disabled={page >= Math.ceil(requestsData.total / 20)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
