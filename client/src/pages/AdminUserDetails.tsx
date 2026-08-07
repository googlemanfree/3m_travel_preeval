import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  FileText,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Briefcase,
} from "lucide-react";
import { useState } from "react";

export default function AdminUserDetails() {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || "" : "";
  const [, params] = useRoute<{ userId: string }>("/admin/users/:userId");
  const userId = params?.userId ? parseInt(params.userId) : null;
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const { data: userDetails, isLoading } = trpc.admin.getUserDetailsWithDocuments.useQuery(
    { sessionToken, userId: userId || 0 },
    { enabled: !!userId && !!sessionToken }
  );

  if (!userId) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">ID utilisateur invalide</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Chargement des détails utilisateur...</p>
      </div>
    );
  }

  if (!userDetails?.user) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <p className="text-orange-600">Utilisateur non trouvé</p>
      </div>
    );
  }

  const user = userDetails.user;
  const applications = userDetails.applications || [];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>

          <Card className="bg-white p-8 rounded-lg shadow-sm border-0">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user.name || "Utilisateur"}</h1>
                  <p className="text-gray-600 mt-1">ID: {user.id}</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2">
                {applications.length} dossier{applications.length > 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Informations de contact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{user.email || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Inscription</p>
                  <p className="font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Rôle</p>
                  <p className="font-medium text-gray-900">{user.role || "Utilisateur"}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Dossiers et documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Briefcase className="w-6 h-6" />
            Dossiers et Documents
          </h2>

          {applications.length === 0 ? (
            <Card className="bg-white p-12 rounded-lg shadow-sm border-0 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun dossier trouvé</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {applications.map((app, idx) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-white rounded-lg shadow-sm border-0 overflow-hidden">
                    {/* En-tête du dossier */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Dossier: {app.dossierNumber}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            Destination: <span className="font-medium">{app.destination}</span>
                          </p>
                        </div>
                        <Badge className={getStatusColor((app as any).dossierStatus || "nouveau")}>
                          {(app as any).dossierStatus || "nouveau"}
                        </Badge>
                      </div>
                    </div>

                    {/* Informations du dossier */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Nom Complet</p>
                          <p className="font-medium text-gray-900">{app.fullName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-900">{app.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Téléphone</p>
                          <p className="font-medium text-gray-900">{app.whatsappNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Nationalité</p>
                          <p className="font-medium text-gray-900">{app.nationality || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="p-6">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Documents Soumis ({app.documents?.length || 0})
                      </h4>

                      {!app.documents || app.documents.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">Aucun document soumis</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {app.documents.map((doc: any) => (
                            <motion.div
                              key={doc.id}
                              whileHover={{ scale: 1.02 }}
                              className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 truncate">
                                    {doc.documentType || "Document"}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                                  </p>
                                </div>
                                {doc.verificationStatus === "verified" && (
                                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                )}
                              </div>

                              {doc.verificationStatus && (
                                <Badge
                                  className={
                                    doc.verificationStatus === "verified"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {doc.verificationStatus === "verified" ? "Vérifié" : "En attente"}
                                </Badge>
                              )}

                              {doc.readabilityScore && (
                                <div className="mt-3">
                                  <p className="text-xs text-gray-600 mb-1">Lisibilité</p>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${doc.readabilityScore}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {doc.readabilityScore}%
                                  </p>
                                </div>
                              )}

                              {doc.fileUrl && (
                                <div className="mt-4 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 flex items-center justify-center gap-1"
                                    onClick={() => setSelectedDoc(doc)}
                                  >
                                    <Eye className="w-4 h-4" />
                                    Voir
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 flex items-center justify-center gap-1"
                                  >
                                    <Download className="w-4 h-4" />
                                    Télécharger
                                  </Button>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Modal de prévisualisation */}
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedDoc(null)}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-auto"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{selectedDoc.documentType}</h3>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                {selectedDoc.fileUrl ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Fichier: {selectedDoc.fileName}</p>
                    <a
                      href={selectedDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Ouvrir le fichier
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-600">Aucun fichier disponible</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
