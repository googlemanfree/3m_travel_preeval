import React, { useState } from "react";
import AdminInvite from "@/components/AdminInvite";
import ResendInviteDialog from "@/components/ResendInviteDialog";
import { motion } from "framer-motion";
import {
  Shield,
  Search,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface Admin {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  adminType: "evaluation" | "accompagnement" | "procedures";
  status: "active" | "inactive" | "suspended";
  createdAt: string | Date;
  lastLoginAt: string | Date | null;
}

const adminTypeLabels: Record<Admin["adminType"], string> = {
  evaluation: "Évaluation",
  accompagnement: "Accompagnement",
  procedures: "Procédures",
};

const adminTypeColors: Record<Admin["adminType"], string> = {
  evaluation: "bg-blue-100 text-blue-800",
  accompagnement: "bg-purple-100 text-purple-800",
  procedures: "bg-amber-100 text-amber-800",
};

const statusLabels: Record<Admin["status"], string> = {
  active: "✓ Actif",
  inactive: "✗ Inactif",
  suspended: "⛔ Suspendu",
};

const statusColors: Record<Admin["status"], string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800",
};

export default function AdminsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("tous");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isResendOpen, setIsResendOpen] = useState(false);

  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") : null;

  const { data, isLoading, error, refetch } = trpc.adminAuth.listAdmins.useQuery(
    { sessionToken: sessionToken || "" },
    { enabled: !!sessionToken }
  );

  const admins: Admin[] = (data?.admins as Admin[]) || [];

  const filteredAdmins = admins.filter((a) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.fullName.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "tous" && a.adminType !== typeFilter) return false;
    if (statusFilter !== "tous" && a.status !== statusFilter) return false;
    return true;
  });

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
              Gérez les comptes administrateurs de 3M Travel
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsInviteOpen(true)}
          >
            <Shield className="w-4 h-4 mr-2" />
            Ajouter Admin
          </Button>
        </motion.div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">
            {error.message}
          </div>
        )}

        {!sessionToken && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-amber-800 text-sm">
            Session admin introuvable — reconnectez-vous sur /admin/login.
          </div>
        )}

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
            className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500"
          >
            <p className="text-gray-600 text-sm">Accompagnement</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {admins.filter((a) => a.adminType === "accompagnement").length}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500"
          >
            <p className="text-gray-600 text-sm">Procédures</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">
              {admins.filter((a) => a.adminType === "procedures").length}
            </p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="searchQuery" className="text-sm font-semibold">Rechercher</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input id="searchQuery"
                  placeholder="Nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="typeFilter" className="text-sm font-semibold">Rôle</Label>
              <select id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="tous">Tous les rôles</option>
                <option value="evaluation">Évaluation</option>
                <option value="accompagnement">Accompagnement</option>
                <option value="procedures">Procédures</option>
              </select>
            </div>
            <div>
              <Label htmlFor="statusFilter" className="text-sm font-semibold">Statut</Label>
              <select id="statusFilter"
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader className="w-5 h-5 mr-2 animate-spin" /> Chargement des administrateurs...
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-center py-16 text-gray-500">Aucun administrateur trouvé.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nom</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rôle</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Créé</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
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
                            {admin.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{admin.fullName}</p>
                            <p className="text-xs text-gray-500">{admin.phone || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{admin.email}</td>
                      <td className="px-6 py-4">
                        <Badge className={adminTypeColors[admin.adminType]}>
                          {adminTypeLabels[admin.adminType]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[admin.status]}>
                          {statusLabels[admin.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(admin.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(admin)}
                        >
                          Détails
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin Invite Dialog */}
        <AdminInvite
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          onInviteSent={() => {
            refetch();
          }}
        />

        {/* Resend Invite Dialog */}
        {selectedAdmin && (
          <ResendInviteDialog
            isOpen={isResendOpen}
            onClose={() => setIsResendOpen(false)}
            adminEmail={selectedAdmin.email}
            adminName={selectedAdmin.fullName}
            inviteLink={`${window.location.origin}/admin/login`}
            onResendSuccess={() => {}}
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
                        {selectedAdmin.fullName}
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
                        {selectedAdmin.phone || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Rôle</Label>
                      <Badge className={`${adminTypeColors[selectedAdmin.adminType]} mt-1`}>
                        {adminTypeLabels[selectedAdmin.adminType]}
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
                      <Badge className={`${statusColors[selectedAdmin.status]} mt-1`}>
                        {statusLabels[selectedAdmin.status]}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Créé le</Label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {new Date(selectedAdmin.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    {selectedAdmin.lastLoginAt && (
                      <div>
                        <Label className="text-xs text-gray-600">Dernière connexion</Label>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {new Date(selectedAdmin.lastLoginAt).toLocaleDateString("fr-FR")}
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
                    Renvoyer l'accès par email
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
