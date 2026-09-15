import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Check, AlertCircle, Loader } from "lucide-react";
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

const getAdminSessionToken = () =>
  sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || "";

export default function AdminInvite({ isOpen, onClose, onInviteSent }: AdminInviteProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [adminType, setAdminType] = useState<"evaluation" | "accompagnement" | "procedures">("evaluation");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");

  const inviteMutation = trpc.adminAuth.inviteAdmin.useMutation({
    onSuccess: (data) => {
      setSuccess(true);
      if (!data.emailSent && data.tempPassword) {
        setWarningMsg(`Email non envoyé. Mot de passe temporaire : ${data.tempPassword}`);
      }
      if (onInviteSent) onInviteSent(email);
    },
    onError: (err) => {
      setError(err.message || "Erreur lors de l'envoi de l'invitation.");
    },
  });

  const handleSendInvite = () => {
    setError("");
    if (!email.trim() || !fullName.trim()) {
      setError("Email et nom complet sont obligatoires.");
      return;
    }
    const sessionToken = getAdminSessionToken();
    if (!sessionToken) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }
    inviteMutation.mutate({ sessionToken, email: email.trim(), fullName: fullName.trim(), adminType });
  };

  const handleClose = () => {
    setEmail("");
    setFullName("");
    setAdminType("evaluation");
    setError("");
    setSuccess(false);
    setWarningMsg("");
    inviteMutation.reset();
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
            <div>
              <Label className="text-sm font-semibold">Nom complet</Label>
              <Input
                type="text"
                placeholder="Marie Dupont"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(""); }}
                className="mt-2"
                disabled={inviteMutation.isPending}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Adresse email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="pl-10"
                  disabled={inviteMutation.isPending}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Rôle</Label>
              <select
                value={adminType}
                onChange={(e) => setAdminType(e.target.value as typeof adminType)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={inviteMutation.isPending}
              >
                <option value="evaluation">Évaluation</option>
                <option value="accompagnement">Accompagnement</option>
                <option value="procedures">Procédures</option>
              </select>
            </div>

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

            <div className="flex gap-3 justify-end border-t pt-6">
              <Button variant="outline" onClick={handleClose} disabled={inviteMutation.isPending}>
                Annuler
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSendInvite}
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <><Loader className="w-4 h-4 mr-2 animate-spin" />Envoi en cours...</>
                ) : (
                  <><Mail className="w-4 h-4 mr-2" />Envoyer l'invitation</>
                )}
              </Button>
            </div>
          </div>
        ) : (
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compte créé avec succès !</h3>
              <p className="text-gray-600">
                Les identifiants ont été envoyés à <strong>{email}</strong>
              </p>
              {warningMsg && (
                <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">{warningMsg}</p>
              )}
            </div>
            <div className="flex justify-end border-t pt-6">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleClose}>Fermer</Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
