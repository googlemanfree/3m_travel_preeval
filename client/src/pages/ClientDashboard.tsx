import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileUp,
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Download,
  Trash2,
  Eye,
  Upload,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DossierStatus {
  id: string;
  numero: string;
  destination: string;
  projectType: string;
  status: "draft" | "submitted" | "in_review" | "documents_needed" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  progress: number;
  totalDocuments: number;
  uploadedDocuments: number;
  missingDocuments: string[];
}

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  status: "pending" | "verified" | "rejected";
  notes?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800", icon: Clock },
  submitted: { label: "Soumis", color: "bg-blue-100 text-blue-800", icon: FileUp },
  in_review: { label: "En Révision", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  documents_needed: { label: "Documents Manquants", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  approved: { label: "Approuvé", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  rejected: { label: "Rejeté", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

const PROGRESS_STEPS = [
  { step: 1, label: "Évaluation", icon: "📋" },
  { step: 2, label: "Bilan", icon: "📊" },
  { step: 3, label: "Traduction", icon: "🌐" },
  { step: 4, label: "Soumission", icon: "📤" },
  { step: 5, label: "Visa", icon: "✅" },
];

export default function ClientDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [dossier, setDossier] = useState<DossierStatus | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Récupérer les données du dossier
  const { data: dossierData, isLoading: dossierLoading } = trpc.candidate.getMyDossierData.useQuery(
    undefined,
    { enabled: isAuthenticated && !authLoading }
  );

  // Récupérer les documents
  const { data: documentsData } = trpc.candidate.getMyDocuments.useQuery(
    undefined,
    { enabled: isAuthenticated && !authLoading }
  );

  // Mutation pour uploader les documents (placeholder)
  // const uploadMutation = trpc.candidate.uploadDocuments.useMutation({
  //   onSuccess: () => {
  //     toast.success("Documents téléversés avec succès!");
  //     setUploadedFiles([]);
  //   },
  //   onError: (error: any) => {
  //     toast.error("Erreur lors du téléversement: " + error.message);
  //   },
  // });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (dossierData && dossierData.data) {
      const app = dossierData.data.application;
      setDossier({
        id: app.id.toString(),
        numero: app.dossierNumber || `DOSS-${app.id}`,
        destination: app.destination || "Non spécifiée",
        projectType: "Non spécifié",
        status: "draft",
        createdAt: new Date(app.createdAt),
        updatedAt: new Date(app.updatedAt),
        progress: Math.floor((dossierData.data.documents.length / 8) * 100),
        totalDocuments: 8,
        uploadedDocuments: dossierData.data.documents.length,
        missingDocuments: [],
      });
    }
  }, [dossierData]);

  useEffect(() => {
    if (documentsData && documentsData.documents) {
      setDocuments(
        documentsData.documents.map((doc: any) => ({
          id: doc.id.toString(),
          name: doc.fileName,
          type: doc.fileType,
          size: 0,
          uploadedAt: new Date(doc.uploadedAt),
          status: doc.status || "pending",
          notes: "",
        }))
      );
    }
  }, [documentsData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Veuillez sélectionner au moins un fichier");
      return;
    }

    setUploading(true);
    try {
      // Simuler l'upload pour le moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Documents téléversés avec succès!");
      setUploadedFiles([]);
    } catch (error) {
      toast.error("Erreur lors du téléversement");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || dossierLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Aucun Dossier Trouvé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Vous n'avez pas encore créé de dossier. Commencez par remplir l'évaluation d'éligibilité.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Retour à l'Accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = STATUS_LABELS[dossier.status]?.icon || Clock;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Mon Espace Client</h1>
              <p className="text-gray-600 mt-2">Dossier: <span className="font-semibold">{dossier.numero}</span></p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Statut Principal */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon className="w-6 h-6" />
                  {STATUS_LABELS[dossier.status]?.label}
                </CardTitle>
                <CardDescription>
                  Destination: {dossier.destination} | Type: {dossier.projectType}
                </CardDescription>
              </div>
              <Badge className={STATUS_LABELS[dossier.status]?.color}>
                {STATUS_LABELS[dossier.status]?.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Barre de Progression */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Progression du Dossier</span>
                <span className="text-sm text-gray-600">{dossier.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${dossier.progress}%` }}
                />
              </div>
            </div>

            {/* Étapes */}
            <div className="grid grid-cols-5 gap-2">
              {PROGRESS_STEPS.map((step, idx) => (
                <div
                  key={step.step}
                  className={`p-3 rounded-lg text-center transition-all ${
                    step.step <= Math.ceil(dossier.progress / 20)
                      ? "bg-blue-100 border-2 border-blue-600"
                      : "bg-gray-100 border-2 border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-1">{step.icon}</div>
                  <p className="text-xs font-semibold">{step.label}</p>
                </div>
              ))}
            </div>

            {/* Documents Manquants */}
            {dossier.missingDocuments.length > 0 && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <p className="font-semibold text-orange-900 mb-2">Documents Manquants:</p>
                <ul className="space-y-1">
                  {dossier.missingDocuments.map((doc, idx) => (
                    <li key={idx} className="text-sm text-orange-800">
                      • {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          {/* Aperçu */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations du Dossier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Numéro de Dossier</p>
                    <p className="font-semibold text-lg">{dossier.numero}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-semibold text-lg">{dossier.destination}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type de Projet</p>
                    <p className="font-semibold text-lg">{dossier.projectType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <Badge className={STATUS_LABELS[dossier.status]?.color}>
                      {STATUS_LABELS[dossier.status]?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Documents Téléversés</p>
                    <p className="font-semibold text-lg">
                      {dossier.uploadedDocuments} / {dossier.totalDocuments}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Créé le</p>
                    <p className="font-semibold text-lg">{dossier.createdAt.toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-4">
            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Téléverser des Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:bg-blue-50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label htmlFor="file-input" className="cursor-pointer block">
                    <FileUp className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">Cliquez pour téléverser</p>
                    <p className="text-sm text-gray-600">ou glissez-déposez vos fichiers</p>
                    <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG, DOC (max 10 Mo par fichier)</p>
                  </label>
                </div>

                {/* Fichiers Sélectionnés */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold">Fichiers à Téléverser:</p>
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-sm">{file.name}</p>
                            <p className="text-xs text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(idx)}
                          type="button"
                          aria-label={`Supprimer le fichier ${file.name}`}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {uploading ? "Téléversement..." : "Confirmer le Téléversement"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents Téléversés */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Documents Téléversés
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">Aucun document téléversé pour le moment</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3 flex-1">
                          <FileCheck className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-semibold">{doc.name}</p>
                            <p className="text-xs text-gray-600">
                              Téléversé le {doc.uploadedAt.toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Badge
                            className={
                              doc.status === "verified"
                                ? "bg-green-100 text-green-800"
                                : doc.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {doc.status === "verified" ? "Vérifié" : doc.status === "rejected" ? "Rejeté" : "En attente"}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messagerie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center py-8">Aucun message pour le moment</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Paramètres du Compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{user?.email}</p>
                </div>
                <Button variant="outline" className="w-full">
                  Modifier le Mot de Passe
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
