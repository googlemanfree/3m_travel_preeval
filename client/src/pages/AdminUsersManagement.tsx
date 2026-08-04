import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Download,
  Eye,
  Mail,
  Phone,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface UserWithApplications {
  id?: number;
  email?: string | null;
  name?: string | null;
  role?: string;
  createdAt?: string;
  applications?: any[];
  applicationCount?: number;
  lastApplication?: any;
}

function ViewUserButton({ userId }: { userId: number }) {
  const [, navigate] = useLocation();
  return (
    <Button
      onClick={() => navigate(`/admin/users/${userId}`)}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Eye className="w-4 h-4" />
      Voir
    </Button>
  );
}

export default function AdminUsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  // Récupérer les utilisateurs
  const { data: usersData, isLoading } = trpc.admin.getAllUsersWithApplications.useQuery({
    search: searchTerm,
    limit: itemsPerPage,
    offset: currentPage * itemsPerPage,
  });

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  // Calculer les statistiques
  const stats = useMemo(() => {
    if (!users.length) return { total: 0, withApplications: 0, noApplications: 0 };
    return {
      total: users.length,
      withApplications: users.filter(u => u.applicationCount > 0).length,
      noApplications: users.filter(u => u.applicationCount === 0).length,
    };
  }, [users]);

  // Obtenir le statut du dernier dossier
  const getLastApplicationStatus = (user: UserWithApplications) => {
    if (!user.lastApplication) return "Aucun dossier";
    return user.lastApplication.status || "Inconnu";
  };

  // Obtenir la couleur du badge de statut
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      nouveau: "bg-blue-100 text-blue-800",
      en_evaluation: "bg-yellow-100 text-yellow-800",
      bilan_envoye: "bg-purple-100 text-purple-800",
      en_attente_paiement: "bg-orange-100 text-orange-800",
      paye: "bg-green-100 text-green-800",
      en_attente_documents: "bg-cyan-100 text-cyan-800",
      documents_recus: "bg-teal-100 text-teal-800",
      soumis_agences: "bg-indigo-100 text-indigo-800",
      en_cours_recrutement: "bg-pink-100 text-pink-800",
      contrat_obtenu: "bg-lime-100 text-lime-800",
      visa_approuve: "bg-emerald-100 text-emerald-800",
      refuse: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  // Obtenir l'icône du statut
  const getStatusIcon = (status: string) => {
    const statusIcons: Record<string, React.ReactNode> = {
      paye: <CheckCircle className="w-4 h-4" />,
      en_attente_paiement: <Clock className="w-4 h-4" />,
      refuse: <AlertCircle className="w-4 h-4" />,
    };
    return statusIcons[status];
  };

  // Exporter les données
  const handleExport = () => {
    const csv = [
      ["Email", "Nom", "Dossiers", "Dernier Dossier", "Statut", "Date Inscription"].join(","),
      ...users.map(u =>
        [
          u.email,
          u.name || "N/A",
          u.applicationCount,
          u.lastApplication?.dossierNumber || "N/A",
          getLastApplicationStatus(u),
          new Date(u.createdAt).toLocaleDateString("fr-FR"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utilisateurs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
                <p className="text-gray-600">Suivi des candidats et de leurs dossiers</p>
              </div>
            </div>
            <Button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </Button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white p-6 rounded-lg shadow-sm border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Utilisateurs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</p>
                </div>
                <Users className="w-12 h-12 text-blue-100" />
              </div>
            </Card>

            <Card className="bg-white p-6 rounded-lg shadow-sm border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Avec Dossiers</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.withApplications}</p>
                </div>
                <FileText className="w-12 h-12 text-green-100" />
              </div>
            </Card>

            <Card className="bg-white p-6 rounded-lg shadow-sm border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Sans Dossiers</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.noApplications}</p>
                </div>
                <AlertCircle className="w-12 h-12 text-orange-100" />
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Recherche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par email ou nom..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-12 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Tableau des utilisateurs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white rounded-lg shadow-sm border-0 overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nom</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dossiers</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dernier Dossier</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Inscription</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{user.name || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-blue-100 text-blue-800 font-semibold">
                            {user.applicationCount}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {user.lastApplication?.dossierNumber || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(getLastApplicationStatus(user))}
                            <Badge className={getStatusColor(getLastApplicationStatus(user))}>
                              {getLastApplicationStatus(user)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <ViewUserButton userId={user.id} />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex items-center justify-center gap-2"
          >
            <Button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              variant="outline"
            >
              Précédent
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                onClick={() => setCurrentPage(i)}
                variant={currentPage === i ? "default" : "outline"}
                className={currentPage === i ? "bg-blue-600" : ""}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              variant="outline"
            >
              Suivant
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
