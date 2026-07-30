import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Eye, Send, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const EMAIL_TEMPLATES = [
  {
    id: "verification",
    name: "Vérification d'Email",
    description: "Email envoyé lors de l'inscription pour confirmer l'adresse email",
    icon: "✓",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "otp",
    name: "Code OTP",
    description: "Email avec code de vérification à 6 chiffres",
    icon: "🔐",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "password-reset",
    name: "Réinitialisation Mot de Passe",
    description: "Email pour réinitialiser le mot de passe oublié",
    icon: "🔑",
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "welcome",
    name: "Bienvenue",
    description: "Email de bienvenue après vérification d'email",
    icon: "🎉",
    color: "from-green-500 to-green-600",
  },
  {
    id: "dossier-confirmation",
    name: "Confirmation de Dossier",
    description: "Email de confirmation d'ouverture de dossier",
    icon: "📋",
    color: "from-indigo-500 to-indigo-600",
  },
];

export default function AdminEmailTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("verification");
  const [previewEmail, setPreviewEmail] = useState("test@example.com");
  const [testName, setTestName] = useState("Jean Dupont");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const getTemplatePreview = trpc.admin.getEmailTemplatePreview.useQuery(
    { templateId: selectedTemplate as "verification" | "otp" | "password-reset" | "welcome" | "dossier-confirmation", testEmail: previewEmail, testName },
    { enabled: !!selectedTemplate }
  );

  const sendTestEmail = trpc.admin.sendTestEmail.useMutation({
    onSuccess: () => {
      toast.success(`Email de test envoyé à ${previewEmail} !`);
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de l'envoi du test");
    },
  });

  const handleSendTest = () => {
    if (!previewEmail) {
      toast.error("Veuillez renseigner une adresse email");
      return;
    }
    sendTestEmail.mutate({ templateId: selectedTemplate as "verification" | "otp" | "password-reset" | "welcome" | "dossier-confirmation", email: previewEmail, testName });
  };

  const handleCopyHtml = () => {
    if (getTemplatePreview.data?.html) {
      navigator.clipboard.writeText(getTemplatePreview.data.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("HTML copié dans le presse-papiers");
    }
  };

  const selectedTemplateData = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Modèles d'Email</h1>
          </div>
          <p className="text-gray-600">Prévisualisez et testez les modèles d'email 3M Travel</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Liste des templates */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                <h2 className="font-bold text-lg">Templates</h2>
              </div>
              <div className="divide-y">
                {EMAIL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`w-full text-left p-4 transition-all ${
                      selectedTemplate === template.id
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{template.name}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Template Info */}
            {selectedTemplateData && (
              <div
                className={`bg-gradient-to-r ${selectedTemplateData.color} rounded-xl p-6 text-white shadow-lg`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{selectedTemplateData.name}</h2>
                    <p className="text-white/90">{selectedTemplateData.description}</p>
                  </div>
                  <span className="text-5xl">{selectedTemplateData.icon}</span>
                </div>
              </div>
            )}

            {/* Test Parameters */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Paramètres de Test
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test-email" className="text-sm font-semibold text-gray-700">
                    Email de Test
                  </Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={previewEmail}
                    onChange={(e) => setPreviewEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="test-name" className="text-sm font-semibold text-gray-700">
                    Nom de Test
                  </Label>
                  <Input
                    id="test-name"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleSendTest}
                  disabled={sendTestEmail.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2 rounded-lg transition-all"
                >
                  {sendTestEmail.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" /> Envoyer un Email de Test
                    </span>
                  )}
                </Button>
                <Button
                  onClick={handleCopyHtml}
                  disabled={!getTemplatePreview.data?.html}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all"
                >
                  {copied ? (
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> Copié
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Copy className="w-4 h-4" /> Copier HTML
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Prévisualisation
              </h3>

              {getTemplatePreview.isLoading ? (
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Chargement du modèle...</p>
                  </div>
                </div>
              ) : getTemplatePreview.data?.html ? (
                <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    srcDoc={getTemplatePreview.data.html}
                    className="w-full h-96 border-none"
                    title="Email Preview"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-amber-800">Impossible de charger la prévisualisation</p>
                </div>
              )}

              {getTemplatePreview.data?.html && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <p>
                    <strong>Conseil :</strong> Vous pouvez copier le HTML brut et le tester dans
                    votre client email préféré.
                  </p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-2">💡 Informations</p>
              <ul className="space-y-1 text-xs">
                <li>• Les emails de test sont envoyés immédiatement à l'adresse spécifiée</li>
                <li>• Les modèles sont responsive et compatibles avec tous les clients email</li>
                <li>• Vous pouvez copier le HTML brut pour des modifications personnalisées</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
