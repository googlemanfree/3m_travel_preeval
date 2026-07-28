import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle2,
  Download,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface DossierFilters {
  status: string;
  destination: string;
  origin: string;
  searchTerm: string;
}

const STATUS_COLORS: Record<string, string> = {
  "reçu": "bg-blue-100 text-blue-800",
  "en_verification": "bg-yellow-100 text-yellow-800",
  "complet": "bg-green-100 text-green-800",
  "a_corriger": "bg-orange-100 text-orange-800",
  "depose": "bg-purple-100 text-purple-800",
  "en_traitement": "bg-indigo-100 text-indigo-800",
  "decision": "bg-pink-100 text-pink-800",
  "visa_disponible": "bg-emerald-100 text-emerald-800",
};

const STATUS_LABELS: Record<string, string> = {
  "reçu": "Reçu",
  "en_verification": "En vérification",
  "complet": "Complet",
  "a_corriger": "À corriger",
  "depose": "Déposé",
  "en_traitement": "En traitement",
  "decision": "Décision",
  "visa_disponible": "Visa disponible",
};

export default function AdminDossiers() {
  const [filters, setFilters] = useState<DossierFilters>({
    status: "",
    destination: "",
    origin: "",
    searchTerm: "",
  });

  // Récupérer tous les dossiers
  const { data: dossiers = [], isLoading } = trpc.admin.getAllApplications.useQuery();

  // Filtrer les dossiers
  const filteredDossiers = useMemo(() => {
    return dossiers.filter((dossier: any) => {
      if (filters.status && dossier.dossierStatus !== filters.status) return false;
      if (filters.destination && dossier.destination !== filters.destination) return false;
      if (filters.origin && dossier.origin !== filters.origin) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          dossier.fullName.toLowerCase().includes(term) ||
          dossier.dossierNumber.toLowerCase().includes(term) ||
          dossier.email.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [dossiers, filters]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: dossiers.length,
      urgent: dossiers.filter((d: any) => d.dossierStatus === "a_corriger").length,
      enCours: dossiers.filter((d: any) => d.dossierStatus === "en_verification").length,
      enLigne: dossiers.filter((d: any) => d.origin === "en_ligne").length,
      agence: dossiers.filter((d: any) => d.origin?.includes("agence")).length,
    };
  }, [dossiers]);

  const handleExport = () => {
    const csv = [
      ["Numéro", "Nom", "Email", "Destination", "Statut", "Origine", "Date"],
      ...filteredDossiers.map((d: any) => [
        d.dossierNumber,
        d.fullName,
        d.email,
        d.destination,
        STATUS_LABELS[d.dossierStatus] || d.dossierStatus,
        d.origin || "Non spécifié",
        new Date(d.createdAt).toLocaleDateString("fr-FR"),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dossiers_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Export CSV réussi!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Dossiers</h1>
          <p className="text-gray-600">Tableau de bord centralisé pour tous les dossiers en ligne et en agence</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <p className="text-sm text-gray-600 mt-2">Total Dossiers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.urgent}</div>
                <p className="text-sm text-gray-600 mt-2">À Corriger</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.enCours}</div>
                <p className="text-sm text-gray-600 mt-2">En Vérification</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.enLigne}</div>
                <p className="text-sm text-gray-600 mt-2">En Ligne</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.agence}</div>
                <p className="text-sm text-gray-600 mt-2">Agence</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres et Recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nom, email, numéro..."
                  className="pl-10"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                />
              </div>

              {/* Statut */}
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Destination */}
              <Select value={filters.destination} onValueChange={(value) => setFilters({ ...filters, destination: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes destinations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes destinations</SelectItem>
                  <SelectItem value="canada">Canada</SelectItem>
                  <SelectItem value="usa">USA</SelectItem>
                  <SelectItem value="france">France</SelectItem>
                  <SelectItem value="uk">UK</SelectItem>
                  <SelectItem value="australia">Australie</SelectItem>
                </SelectContent>
              </Select>

              {/* Origine */}
              <Select value={filters.origin} onValueChange={(value) => setFilters({ ...filters, origin: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes origines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes origines</SelectItem>
                  <SelectItem value="en_ligne">En ligne</SelectItem>
                  <SelectItem value="agence_douala">Agence Douala</SelectItem>
                  <SelectItem value="agence_yaounde">Agence Yaoundé</SelectItem>
                </SelectContent>
              </Select>

              {/* Export */}
              <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des dossiers */}
        <Card>
          <CardHeader>
            <CardTitle>
              Dossiers ({filteredDossiers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : filteredDossiers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucun dossier trouvé</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Numéro</th>
                      <th className="text-left py-3 px-4 font-semibold">Nom</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Destination</th>
                      <th className="text-left py-3 px-4 font-semibold">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold">Origine</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDossiers.map((dossier: any) => (
                      <tr key={dossier.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-xs">{dossier.dossierNumber}</td>
                        <td className="py-3 px-4">{dossier.fullName}</td>
                        <td className="py-3 px-4 text-xs">{dossier.email}</td>
                        <td className="py-3 px-4 capitalize">{dossier.destination}</td>
                        <td className="py-3 px-4">
                          <Badge className={STATUS_COLORS[dossier.dossierStatus] || "bg-gray-100 text-gray-800"}>
                            {STATUS_LABELS[dossier.dossierStatus] || dossier.dossierStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {dossier.origin === "en_ligne" ? (
                            <Badge className="bg-blue-100 text-blue-800">En ligne</Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-800">{dossier.origin || "N/A"}</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {new Date(dossier.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline" className="text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            Voir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
