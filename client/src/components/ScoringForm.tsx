import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, AlertCircle, Loader, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

interface AdminInviteProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: (email: string) => void;
}

const adminTypeLabels: Record<string, string> = {
  evaluation: "Évaluation",
  accompagnement: "Accompagnement",
  procedures: "Procédures",
};

export default function AdminInvite({ isOpen, onClose, onInviteSent }: AdminInviteProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [adminType, setAdminType] = useState<"evaluation" | "accompagnement" | "procedures">("evaluation");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const inviteMutation = trpc.adminAuth.inviteAdmin.useMutation({
    onSuccess: () => {
      setSuccess(true);
      if (onInviteSent) onInviteSent(email);
    },
    onError: (err) => setError(err.message || "Erreur lors de l'envoi de l'invitation."),
  });

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendInvite = () => {
    setError("");

    if (!fullName.trim()) { setError("Veuillez entrer un nom complet"); return; }
    if (!email.trim() || !validateEmail(email)) { setError("Veuillez entrer une adresse email valide"); return; }

    const sessionToken = localStorage.getItem("adminSessionToken");
    if (!sessionToken) { setError("Session admin introuvable, reconnectez-vous."); return; }

    inviteMutation.mutate({ sessionToken, email, fullName, phone: phone || undefined, adminType });
  };

  const handleClose = () => {
    setEmail("");
    setFullName("");
    setPhone("");
    setAdminType("evaluation");
    setError("");
    setSuccess(false);
    onClose();
  };

  const isLoading = inviteMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inviter un nouvel administrateur</DialogTitle>
        </DialogHeader>

        {!success ? (
          <div className="space-y-6">
            <div>
              <Label htmlFor="inviteFullName" className="text-sm font-semibold">Nom complet</Label>
              <Input id="inviteFullName"
                placeholder="Nom et prénom"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(""); }}
                className="mt-2"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="inviteEmail" className="text-sm font-semibold">Adresse email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input id="inviteEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="invitePhone" className="text-sm font-semibold">Téléphone (optionnel)</Label>
              <Input id="invitePhone"
                placeholder="+237 6XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2"
                disabled={isLoading}
              />
            </div>

            {/* Admin Type Selection */}
            <div>
              <Label htmlFor="adminType" className="text-sm font-semibold">Rôle</Label>
              <select id="adminType"
                value={adminType}
                onChange={(e) => setAdminType(e.target.value as typeof adminType)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={isLoading}
              >
                <option value="evaluation">Évaluation</option>
                <option value="accompagnement">Accompagnement</option>
                <option value="procedures">Procédures</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Détermine quel tableau de bord administrateur cette personne utilisera.
              </p>
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
                Compte créé et invitation envoyée !
              </h3>
              <p className="text-gray-600">
                Un email a été envoyé à <strong>{email}</strong> — il peut se connecter dès maintenant sur /admin/login avec un code OTP.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Détails</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Nom :</span>
                  <span className="font-semibold text-blue-900">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Email :</span>
                  <span className="font-semibold text-blue-900">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Rôle :</span>
                  <span className="font-semibold text-blue-900">{adminTypeLabels[adminType]}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t pt-6">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleClose}>
                Fermer
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
