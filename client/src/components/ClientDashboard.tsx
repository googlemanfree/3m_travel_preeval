import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Phone,
  Mail,
  MessageCircle,
  Settings,
  LogOut,
  ChevronRight,
  Calendar,
  DollarSign,
  User,
  Shield,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DossierStep {
  id: string;
  name: string;
  status: "completed" | "current" | "pending";
  date?: string;
  description: string;
}

interface Document {
  id: string;
  type: string;
  name: string;
  status: "uploaded" | "verified" | "rejected";
  uploadedAt: string;
  url?: string;
}

interface Message {
  id: string;
  sender: "candidate" | "advisor";
  content: string;
  timestamp: string;
  isRead: boolean;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "messages" | "settings">("overview");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  // Mock data
  const dossierNumber = "3M-2026-0042";
  const clientName = "Alain Fouda";
  const destination = "Canada";
  const visaType = "Résidence Permanente";

  const dossierSteps: DossierStep[] = [
    {
      id: "1",
      name: "Évaluation",
      status: "completed",
      date: "2026-07-01",
      description: "Évaluation d'éligibilité complétée",
    },
    {
      id: "2",
      name: "Bilan",
      status: "completed",
      date: "2026-07-08",
      description: "Bilan personnalisé reçu",
    },
    {
      id: "3",
      name: "Documents",
      status: "current",
      description: "Préparation des documents",
    },
    {
      id: "4",
      name: "Soumission",
      status: "pending",
      description: "Soumission au consulat",
    },
    {
      id: "5",
      name: "Visa",
      status: "pending",
      description: "Décision visa",
    },
  ];

  const documents: Document[] = [
    {
      id: "1",
      type: "Passeport",
      name: "Passeport_AlainFouda.pdf",
      status: "verified",
      uploadedAt: "2026-07-05",
      url: "#",
    },
    {
      id: "2",
      type: "CV",
      name: "CV_AlainFouda_2026.pdf",
      status: "verified",
      uploadedAt: "2026-07-05",
      url: "#",
    },
    {
      id: "3",
      type: "Diplôme",
      name: "Diplome_Master_2023.pdf",
      status: "uploaded",
      uploadedAt: "2026-07-10",
    },
    {
      id: "4",
      type: "Relevé de notes",
      name: "Releve_Notes_Master.pdf",
      status: "rejected",
      uploadedAt: "2026-07-10",
    },
  ];

  const messages: Message[] = [
    {
      id: "1",
      sender: "advisor",
      content: "Bonjour Alain, votre bilan est prêt. Pouvez-vous confirmer réception?",
      timestamp: "2026-07-08 10:30",
      isRead: true,
    },
    {
      id: "2",
      sender: "candidate",
      content: "Oui, j'ai reçu. Merci beaucoup!",
      timestamp: "2026-07-08 11:15",
      isRead: true,
    },
    {
      id: "3",
      sender: "advisor",
      content: "Parfait! Veuillez uploader vos documents avant le 15 juillet.",
      timestamp: "2026-07-08 11:20",
      isRead: true,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "current":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "uploaded":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon Dossier</h1>
              <p className="text-sm text-gray-600 mt-1">Dossier {dossierNumber}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2">
                <Phone className="w-4 h-4" />
                Support 24/7
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={0}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nom</p>
                <p className="text-lg font-semibold text-gray-900">{clientName}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={1}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Destination</p>
                <p className="text-lg font-semibold text-gray-900">{destination}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={2}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Type Visa</p>
                <p className="text-lg font-semibold text-gray-900">{visaType}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={3}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Montant</p>
                <p className="text-lg font-semibold text-gray-900">65 000 XAF</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200">
            {[
              { id: "overview", label: "Vue d'ensemble", icon: FileText },
              { id: "documents", label: "Documents", icon: Upload },
              { id: "messages", label: "Messages", icon: MessageSquare },
              { id: "settings", label: "Paramètres", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Progression de Votre Dossier</h2>
                  <div className="space-y-4">
                    {dossierSteps.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${getStatusColor(
                              step.status
                            )}`}
                          >
                            {step.status === "completed" ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          {index < dossierSteps.length - 1 && (
                            <div className="w-1 h-12 bg-gray-200 my-2" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <h3 className="font-semibold text-gray-900">{step.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                          {step.date && (
                            <p className="text-xs text-gray-500 mt-2">Complété le {step.date}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900">Prochaine étape</h3>
                      <p className="text-sm text-blue-800 mt-1">
                        Veuillez uploader vos documents avant le 15 juillet 2026. Délai estimé de traitement: 2-3 semaines.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Mes Documents</h2>
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Ajouter un Document
                  </Button>
                </div>

                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">
                            {doc.type} • Uploadé le {doc.uploadedAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getDocumentStatusIcon(doc.status)}
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Document rejeté :</strong> "Relevé de notes" - Format invalide. Veuillez uploader un PDF.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Messages Tab */}
            {activeTab === "messages" && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Messagerie</h2>
                  <Button
                    onClick={() => setShowMessageDialog(true)}
                    className="gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Nouveau Message
                  </Button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.sender === "advisor"
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-gray-900">
                          {msg.sender === "advisor" ? "Conseiller 3M" : "Vous"}
                        </p>
                        <span className="text-xs text-gray-500">{msg.timestamp}</span>
                      </div>
                      <p className="text-gray-700 mt-2">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Paramètres</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Notifications Email</p>
                        <p className="text-sm text-gray-600">Recevoir les mises à jour par email</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Notifications WhatsApp</p>
                        <p className="text-sm text-gray-600">Recevoir les mises à jour par WhatsApp</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Notifications SMS</p>
                        <p className="text-sm text-gray-600">Recevoir les mises à jour par SMS</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Button variant="destructive" className="w-full">
                    Supprimer mon compte
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Cliquez pour sélectionner un fichier</p>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 10MB)</p>
            </div>
            <Button className="w-full">Uploader</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer un Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              placeholder="Votre message..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <Button className="w-full">Envoyer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
