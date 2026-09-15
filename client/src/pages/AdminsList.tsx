import React, { useState } from "react";
import AdminInvite from "@/components/AdminInvite";
import ResendInviteDialog from "@/components/ResendInviteDialog";
import { motion } from "framer-motion";
import {
  Users,
  Shield,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

function getAdminSessionToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || "";
}

interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string;
  adminType: "evaluation" | "accompagnement" | "procedures";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  lastLogin?: string | null;
}

const roleLabels: Record<Admin["adminType"], string> = {
  evaluation: "Évaluation",
  accompagnement: "Accompagnement",
  procedures: "Procédures",
};

const roleColors: Record<Admin["adminType"], string> = {
  evaluation: "bg-blue-100 text-blue-800",
  accompagnement: "bg-emerald-100 text-emerald-800",
  procedures: "bg-purple-100 text-purple-800",
};

export default function AdminsList() {
  const sessionToken = getAdminSessionToken();
  const { data: listAdminsResult, isLoading, isError, refetch: refetchAdmins } = trpc.adminAuth.listAdmins.useQuery(
    { sessionToken },
    { enabled: Boolean(sessionToken) },
  );
  const admins: Admin[] = (listAdminsResult?.admins ?? []).map((a) => ({
    id: a.id,
    name: a.fullName,
    email: a.email,
    phone: a.phone ?? "",
    adminType: a.adminType as Admin["adminType"],
    status: a.status as Admin["status"],
    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : "",
    lastLogin: a.lastLoginAt ? new Date(a.lastLoginAt).toISOString() : null,
  }));
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("tous");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isResendOpen, setIsResendOpen] = useState(false);
  const resetAllPasswords = trpc.adminAuth.resetAllPasswords.useMutation({
    onSuccess: (result) => {
      window.alert(result.message);
      sessionStorage.removeItem("adminSessionToken");
      localStorage.removeItem("adminSessionToken");
      window.location.assign("/admin/login");
    },
    onError: (error) => window.alert(error.message),
  });

  const handleResetAllPasswords = () => {
    const confirmed = window.confirm(
      "Réinitialiser les mots de passe de tous les administrateurs ? Chaque compte recevra un mot de passe temporaire par e-mail et devra le changer à la prochaine connexion.",
    );
    if (!confirmed) return;
    const sessionToken = getAdminSessionToken();
    if (!sessionToken) {
      window.alert("Session administrateur introuvable. Veuillez vous reconnecter.");
      return;
    }
    resetAllPasswords.mutate({ sessionToken });
  };

  // Apply filters
  React.useEffect(() => {
    let filtered = admins;

    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== "tous") {
      filtered = filtered.filter((a) => a.adminType === roleFilter);
    }

    if (statusFilter !== "tous") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    setFilteredAdmins(filtered);
  }, [admins, searchQuery, roleFilter, statusFilter]);

  const handleViewDetails = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Gestion des Administrateurs
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez les administrateurs par type d'accès (évaluation, accompagnement, procédures)
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              onClick={handleResetAllPasswords}
              disabled={resetAllPasswords.isPending}
            >
              <Shield className="w-4 h-4 mr-2" />
              {resetAllPasswords.isPending ? "Réinitialisation…" : "Réinitialiser tous les mots de passe"}
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsInviteOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Admin
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
          >
            <p className="text-gray-600 text-sm">Total Admins</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{admins.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
          >
            <p className="text-gray-600 text-sm">Actifs</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {admins.filter((a) => a.status === "active").length}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500"
          >
              <p className="text-gray-600 text-sm">Suspendus</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {admins.filter((a) => a.status === "suspended").length}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500"
          >
            <p className="text-gray-600 text-sm">Inactifs</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{admins.filter((a) => a.status === "inactive").length}</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-semibold">Rechercher</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Rôle</Label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="tous">Tous les rôles</option>
                <option value="evaluation">Évaluation</option>
                <option value="accompagnement">Accompagnement</option>
                <option value="procedures">Procédures</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-semibold">Statut</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="tous">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          </div>
        </div>

        {/* Admins Table */}
        {!sessionToken ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
            Session administrateur introuvable. Veuillez vous reconnecter pour voir la liste réelle des comptes.
          </div>
        ) : isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Chargement des administrateurs…</div>
        ) : isError ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-red-600">La liste des administrateurs n'a pas pu être chargée. Réessayez dans un instant.</div>
        ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Créé
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAdmins.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">Aucun administrateur ne correspond aux filtres.</td></tr>
                )}
                {filteredAdmins.map((admin, index) => (
                  <motion.tr
                    key={admin.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{admin.name}</p>
                          <p className="text-xs text-gray-500">{admin.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{admin.email}</td>
                    <td className="px-6 py-4">
                      <Badge className={roleColors[admin.adminType]}>
                        {roleLabels[admin.adminType]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={
                          admin.status === "active"
                            ? "bg-green-100 text-green-800"
                            : admin.status === "suspended"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {admin.status === "active" ? "✓ Actif" : admin.status === "suspended" ? "⚠ Suspendu" : "✗ Inactif"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(admin)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Admin Invite Dialog */}
        <AdminInvite
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          onInviteSent={() => { void refetchAdmins(); }}
        />

        {/* Resend Invite Dialog */}
        {selectedAdmin && (
          <ResendInviteDialog
            isOpen={isResendOpen}
            onClose={() => setIsResendOpen(false)}
            adminEmail={selectedAdmin.email}
            adminName={selectedAdmin.name}
            inviteLink={`${window.location.origin}/admin/accept-invite?email=${encodeURIComponent(
              selectedAdmin.email
            )}`}
            onResendSuccess={() => { void refetchAdmins(); }}
          />
        )}

        {/* Admin Detail Modal */}
        {selectedAdmin && (
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Détails de l'administrateur</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">Nom</Label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {selectedAdmin.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Email</Label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {selectedAdmin.email}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Téléphone</Label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {selectedAdmin.phone}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Rôle</Label>
                      <Badge className={`${roleColors[selectedAdmin.adminType]} mt-1`}>
                        {roleLabels[selectedAdmin.adminType]}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Status & Dates */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Statut</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">Statut actuel</Label>
                      <Badge
                        className={`${
                          selectedAdmin.status === "active"
                            ? "bg-green-100 text-green-800"
                            : selectedAdmin.status === "suspended"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        } mt-1`}
                      >
                        {selectedAdmin.status === "active" ? "✓ Actif" : selectedAdmin.status === "suspended" ? "⚠ Suspendu" : "✗ Inactif"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Créé le</Label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {selectedAdmin.createdAt ? new Date(selectedAdmin.createdAt).toLocaleDateString("fr-FR") : "—"}
                      </p>
                    </div>
                    {selectedAdmin.lastLogin && (
                      <div>
                        <Label className="text-xs text-gray-600">Dernière connexion</Label>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {new Date(selectedAdmin.lastLogin).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end border-t pt-6">
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    Fermer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsResendOpen(true)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Renvoyer invitation
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Modifier
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
