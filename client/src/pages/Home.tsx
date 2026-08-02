import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Send,
  Copy,
  Check,
  AlertCircle,
  Loader,
  Eye,
  Edit2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

interface ResendInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail: string;
  adminName: string;
  inviteLink: string;
  onResendSuccess?: () => void;
}

const emailTemplates = {
  professional: {
    subject: "Invitation - Accès Administrateur 3M Travel",
    body: `Bonjour {name},

Vous êtes invité à rejoindre l'équipe administrative de 3M Travel & Services en tant qu'administrateur.

Cliquez sur le lien ci-dessous pour accepter cette invitation et créer votre compte :
{inviteLink}

Ce lien expire dans 7 jours.

Cordialement,
L'équipe 3M Travel & Services`,
  },
  friendly: {
    subject: "Bienvenue dans l'équipe 3M Travel ! 🎉",
    body: `Salut {name},

Super ! Vous avez été sélectionné pour rejoindre notre équipe administrative chez 3M Travel & Services.

Cliquez ici pour commencer : {inviteLink}

N'oubliez pas que ce lien est valide pendant 7 jours seulement.

À bientôt !
L'équipe 3M Travel`,
  },
  urgent: {
    subject: "Action requise : Activation du compte administrateur",
    body: `Bonjour {name},

Votre compte administrateur 3M Travel & Services a été créé et attend votre activation.

Veuillez cliquer sur le lien suivant pour finaliser votre inscription :
{inviteLink}

Délai d'activation : 7 jours

Merci,
Support 3M Travel & Services`,
  },
};

export default function ResendInviteDialog({
  isOpen,
  onClose,
  adminEmail,
  adminName,
  inviteLink,
  onResendSuccess,
}: ResendInviteDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof emailTemplates>(
    "professional"
  );
  const [customSubject, setCustomSubject] = useState(
    emailTemplates.professional.subject
  );
  const [customBody, setCustomBody] = useState(emailTemplates.professional.body);
  const [isSent, setIsSent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [sendError, setSendError] = useState("");

  const resendMutation = trpc.adminAuth.resendInvite.useMutation({
    onSuccess: () => {
      setIsSent(true);
      if (onResendSuccess) onResendSuccess();
      setTimeout(() => handleClose(), 3000);
    },
    onError: (err) => setSendError(err.message || "Erreur lors de l'envoi de l'email."),
  });

  const isLoading = resendMutation.isPending;

  const handleTemplateChange = (template: keyof typeof emailTemplates) => {
    setSelectedTemplate(template);
    setCustomSubject(emailTemplates[template].subject);
    setCustomBody(emailTemplates[template].body);
  };

  const getPreviewContent = () => {
    return {
      subject: customSubject,
      body: customBody
        .replace("{name}", adminName)
        .replace("{inviteLink}", inviteLink),
    };
  };

  const handleSendEmail = () => {
    setSendError("");
    const sessionToken = localStorage.getItem("adminSessionToken");
    if (!sessionToken) { setSendError("Session admin introuvable, reconnectez-vous."); return; }

    const preview = getPreviewContent();
    resendMutation.mutate({
      sessionToken,
      email: adminEmail,
      customSubject: preview.subject,
      customBody: preview.body,
    });
  };

  const handleCopyEmail = () => {
    const preview = getPreviewContent();
    const emailText = `Subject: ${preview.subject}\n\n${preview.body}`;
    navigator.clipboard.writeText(emailText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClose = () => {
    setCustomSubject(emailTemplates.professional.subject);
    setCustomBody(emailTemplates.professional.body);
    setSelectedTemplate("professional");
    setIsSent(false);
    setShowPreview(false);
    setSendError("");
    onClose();
  };

  const preview = getPreviewContent();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Renvoyer l'invitation</DialogTitle>
        </DialogHeader>

        {!isSent ? (
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Modèles</TabsTrigger>
              <TabsTrigger value="customize">Personnaliser</TabsTrigger>
              <TabsTrigger value="preview">Aperçu</TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>À :</strong> {adminEmail}
                </p>
              </div>

              <div className="space-y-3">
                {Object.entries(emailTemplates).map(([key, template]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleTemplateChange(key as keyof typeof emailTemplates)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedTemplate === key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {key === "professional"
                            ? "📋 Professionnel"
                            : key === "friendly"
                              ? "😊 Amical"
                              : "⚡ Urgent"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {template.subject}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {template.body.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="ml-4">
                        <input
                          type="radio"
                          checked={selectedTemplate === key}
                          onChange={() => {}}
                          className="w-5 h-5"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Customize Tab */}
            <TabsContent value="customize" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>À :</strong> {adminEmail}
                </p>
              </div>

              <div>
                <Label htmlFor="customSubject" className="text-sm font-semibold">Sujet</Label>
                <Input id="customSubject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="mt-2"
                  placeholder="Sujet de l'email"
                />
              </div>

              <div>
                <Label htmlFor="customBody" className="text-sm font-semibold">Message</Label>
                <textarea id="customBody"
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  rows={10}
                  placeholder="Contenu de l'email"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Utilisez {"{name}"} pour le nom et {"{inviteLink}"} pour le lien
                  d'invitation
                </p>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold">
                      À
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {adminEmail}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-600 uppercase font-semibold">
                      Sujet
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {preview.subject}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-3">
                      Message
                    </p>
                    <div className="bg-white border border-gray-300 rounded p-4 text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {preview.body}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyEmail}
                  className="flex-1"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copier l'email
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Success State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Check className="w-8 h-8 text-green-600" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Email envoyé avec succès !
            </h3>
            <p className="text-gray-600">
              L'invitation a été renvoyée à <strong>{adminEmail}</strong>
            </p>
          </motion.div>
        )}

        {/* Actions */}
        {!isSent && (
          <>
            {sendError && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{sendError}</p>
              </div>
            )}
          <div className="flex gap-3 justify-end border-t pt-6">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSendEmail}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer l'invitation
                </>
              )}
            </Button>
          </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
