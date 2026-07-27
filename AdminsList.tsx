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

interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "super_admin" | "admin" | "moderator";
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string;
  permissions: string[];
}

// Mock data - Replace with real API calls
const mockAdmins: Admin[] = [
  {
    id: 1,
    name: "Aureol Donfack",
    email: "aureol@3mtravel.com",
    phone: "+237698104832",
    role: "super_admin",
    status: "active",
    createdAt: "2026-01-15",
    lastLogin: "2026-07-25",
    permissions: ["manage_users", "manage_admins", "manage_settings", "view_analytics"],
  },
  {
    id: 2,
    name: "Marie Dupont",
    email: "marie@3mtravel.com",
    phone: "+237698104833",
    role: "admin",
    status: "active",
    createdAt: "2026-02-20",
    lastLogin: "2026-07-24",
    permissions: ["manage_users", "manage_applications", "view_analytics"],
  },
  {
    id: 3,
    name: "Jean Martin",
    email: "jean@3mtravel.com",
    phone: "+237698104834",
    role: "admin",
    status: "active",
    createdAt: "2026-03-10",
    lastLogin: "2026-07-23",
    permissions: ["manage_applications", "manage_documents"],
  },
  {
    id: 4,
    name: "Sophie Bernard",
    email: "sophie@3mtravel.com",
    phone: "+237698104835",
    role: "moderator",
    status: "inactive",
    createdAt: "2026-04-05",
    permissions: ["view_applications", "moderate_content"],
  },
];

const roleLabels = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Modérateur",
};

const roleColors = {
  super_admin: "bg-red-100 text-red-800",
  admin: "bg-blue-100 text-blue-800",
  moderator: "bg-yellow-100 text-yellow-800",
};

export default function AdminsList() {
  const [admins, setAdmins] = useState<Admin[]>(mockAdmins);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>(mockAdmins);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("tous");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isResendOpen, setIsResendOpen] = useState(false);

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
      filtered = filtered.filter((a) => a.role === roleFilter);
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
              Gérez les administrateurs et leurs permissions
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsInviteOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Admin
          </Button>
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
            <p className="text-gray-600 text-sm">Super Admins</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {admins.filter((a) => a.role === "super_admin").length}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500"
          >
            <p className="text-gray-600 text-sm">Modérateurs</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {admins.filter((a) => a.role === "moderator").length}
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
              <Label htmlFor="roleFilter" className="text-sm font-semibold">Rôle</Label>
              <select id="roleFilter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="tous">Tous les rôles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="moderator">Modérateur</option>
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
              </select>
            </div>
          </div>
        </div>

        {/* Admins Table */}
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
                      <Badge className={roleColors[admin.role]}>
                        {roleLabels[admin.role]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={
                          admin.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {admin.status === "active" ? "✓ Actif" : "✗ Inactif"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(admin.createdAt).toLocaleDateString("fr-FR")}
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

        {/* Admin Invite Dialog */}
        <AdminInvite
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          onInviteSent={(email) => {
            // Optionally add the invited admin to the list
            console.log("Admin invited:", email);
          }}
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
            onResendSuccess={() => {
              console.log("Invitation resent to:", selectedAdmin.email);
            }}
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
                      <Badge className={`${roleColors[selectedAdmin.role]} mt-1`}>
                        {roleLabels[selectedAdmin.role]}
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
                            : "bg-gray-100 text-gray-800"
                        } mt-1`}
                      >
                        {selectedAdmin.status === "active" ? "✓ Actif" : "✗ Inactif"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Créé le</Label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {new Date(selectedAdmin.createdAt).toLocaleDateString("fr-FR")}
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

                {/* Permissions */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Permissions</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAdmin.permissions.map((perm) => (
                      <Badge key={perm} variant="outline">
                        {perm}
                      </Badge>
                    ))}
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
