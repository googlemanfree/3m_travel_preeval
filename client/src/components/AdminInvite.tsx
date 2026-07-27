import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Copy, Check, AlertCircle, Loader } from "lucide-react";
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

interface AdminInviteProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: (email: string) => void;
}

export default function AdminInvite({ isOpen, onClose, onInviteSent }: AdminInviteProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [permissions, setPermissions] = useState<string[]>([
    "manage_applications",
    "view_analytics",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const availablePermissions = [
    { id: "manage_users", label: "Gérer les utilisateurs" },
    { id: "manage_admins", label: "Gérer les administrateurs" },
    { id: "manage_applications", label: "Gérer les candidatures" },
    { id: "manage_documents", label: "Gérer les documents" },
    { id: "manage_settings", label: "Gérer les paramètres" },
    { id: "view_analytics", label: "Voir les analytics" },
    { id: "moderate_content", label: "Modérer le contenu" },
  ];

  const togglePermission = (permId: string) => {
    setPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendInvite = async () => {
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Veuillez entrer une adresse email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    if (permissions.length === 0) {
      setError("Veuillez sélectionner au moins une permission");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call to send invite
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate secure invitation link
      const inviteToken = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/admin/accept-invite?token=${inviteToken}&email=${encodeURIComponent(
        email
      )}`;

      setInviteLink(link);
      setSuccess(true);

      // Call callback if provided
      if (onInviteSent) {
        onInviteSent(email);
      }

      // Reset form
      setTimeout(() => {
        setEmail("");
        setRole("admin");
        setPermissions(["manage_applications", "view_analytics"]);
      }, 3000);
    } catch (err) {
      setError("Erreur lors de l'envoi de l'invitation. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail("");
    setRole("admin");
    setPermissions(["manage_applications", "view_analytics"]);
    setInviteLink("");
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inviter un nouvel administrateur</DialogTitle>
        </DialogHeader>

        {!success ? (
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <Label htmlFor="email" className="text-sm font-semibold">Adresse email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <Label htmlFor="role" className="text-sm font-semibold">Rôle</Label>
              <select id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={isLoading}
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="moderator">Modérateur</option>
              </select>
            </div>

            {/* Permissions Selection */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Permissions</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePermissions.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      disabled={isLoading}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Selected Permissions Summary */}
            <div>
              <Label className="text-sm font-semibold">Permissions sélectionnées</Label>
              <div className="flex flex-wrap gap-2 mt-3">
                {permissions.length > 0 ? (
                  permissions.map((perm) => (
                    <Badge key={perm} variant="outline">
                      {availablePermissions.find((p) => p.id === perm)?.label}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucune permission sélectionnée</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end border-t pt-6">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Annuler
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSendInvite}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer l'invitation
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Success State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Success Message */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-8 h-8 text-green-600" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Invitation envoyée avec succès !
              </h3>
              <p className="text-gray-600">
                Un email d'invitation a été envoyé à <strong>{email}</strong>
              </p>
            </div>

            {/* Invitation Link */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <Label htmlFor="inviteLink" className="text-sm font-semibold text-gray-700 mb-2 block">
                Lien d'invitation sécurisé
              </Label>
              <div className="flex gap-2">
                <input id="inviteLink"
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-600"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ce lien expire dans 7 jours. Vous pouvez le partager directement avec
                l'administrateur.
              </p>
            </div>

            {/* Invitation Details */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Détails de l'invitation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Email :</span>
                  <span className="font-semibold text-blue-900">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Rôle :</span>
                  <span className="font-semibold text-blue-900">
                    {role === "super_admin"
                      ? "Super Admin"
                      : role === "admin"
                        ? "Admin"
                        : "Modérateur"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Permissions :</span>
                  <span className="font-semibold text-blue-900">{permissions.length}</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex gap-3 justify-end border-t pt-6">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleClose}
              >
                Fermer
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
