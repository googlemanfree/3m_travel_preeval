import { useState, useEffect } from "react";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, FileText, MessageSquare, Download, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { QuickActionNotification, MissingDocumentsList } from "@/components/QuickActionNotification";
import { QuickUploadModal } from "@/components/QuickUploadModal";
import { BilanActionModal } from "@/components/BilanActionModal";
import { useMissingDocuments, useDocumentCompleteness } from "@/hooks/useMissingDocuments";

export default function MySpace() {
  const { isAuthenticated, candidate, logout } = useCandidateAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [showNotification, setShowNotification] = useState(true);
  const [bilanActionModalOpen, setBilanActionModalOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Récupérer les données du dossier
  const { data: dossierData, isLoading, error } = trpc.candidate.getMyDossierData.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Rediriger si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  // Gestionnaire de déconnexion
  const handleLogout = () => {
    logout();
    toast.success("Vous avez été déconnecté avec succès");
    setLocation("/login");
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (error || !dossierData?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">Erreur</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">
                {error?.message || dossierData?.message || "Impossible de charger vos données"}
              </p>
              <Button onClick={() => setLocation("/")} className="mt-4">
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const app = dossierData?.data?.application;
  const documents = dossierData?.data?.documents || [];
  const messages = dossierData?.data?.messages || [];
  const candidateName = candidate?.fullName || "Candidat";

  // Détecter les documents manquants
  const missingDocuments = useMissingDocuments(
    app ? { projectType: "", academicLevel: app.academicLevel || "" } : null,
    documents
  );
  const completeness = useDocumentCompleteness(
    app ? { projectType: "", academicLevel: app.academicLevel || "" } : null,
    documents
  );

  // Gestionnaire pour ouvrir le modal de téléversement
  const handleQuickUpload = (documentType: string) => {
    setSelectedDocumentType(documentType);
    setUploadModalOpen(true);
  };

  // Gestionnaire pour le téléversement
  const handleUploadFile = async (file: File, documentType: string) => {
    // TODO: Implémenter l'upload via tRPC
    console.log(`Uploading ${file.name} for ${documentType}`);
  };

  // Afficher la notification si des documents manquent
  const shouldShowNotification = missingDocuments && missingDocuments.length > 0 && app && (app as any)?.dossierStatus === "en_evaluation";

  // Calculer le pourcentage d'avancement global du dossier
  const calculateProgress = (): number => {
    if (!app) return 0;
    
    let progress = 0;
    if (documents.length > 0) progress += 25;
    if (app.fullName && app.email) progress += 20;
    if (app.academicLevel) progress += 20;
    if (app.agreementSigned) progress += 15;
    if (app.paymentStatus === "SUCCESS") progress += 20;
    
    return Math.min(progress, 100);
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mon Espace</h1>
            <p className="text-blue-100 mt-1">Bienvenue, {candidateName} !</p>
          </div>
          <Button
            onClick={() => setShowLogoutDialog(true)}
            variant="outline"
            className="bg-white/20 border-white text-white hover:bg-white/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Deconnexion
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Barre de progression */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Avancement de votre dossier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Progression globale</span>
                <span className="text-2xl font-bold text-blue-600">{progress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification des documents manquants */}
        {shouldShowNotification && missingDocuments && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-semibold">Documents manquants</p>
              <p className="text-yellow-700 text-sm mt-1">{missingDocuments.join(", ")}</p>
            </div>
          )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="agreement">Accord</TabsTrigger>
          </TabsList>

          {/* Aperçu */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nom complet</p>
                    <p className="font-semibold">{app?.fullName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{app?.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-semibold">{app?.destination || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nationalité</p>
                    <p className="font-semibold">{app?.nationality || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statut du dossier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge className={
                    app?.dossierStatus === "visa_approuve" ? "bg-green-500" :
                    app?.dossierStatus === "refuse" ? "bg-red-500" :
                    app?.dossierStatus === "en_evaluation" ? "bg-yellow-500" :
                    "bg-blue-500"
                  }>
                    {app?.dossierStatus === "visa_approuve" ? "Visa Approuvé" :
                     app?.dossierStatus === "refuse" ? "Rejeté" :
                     app?.dossierStatus === "en_evaluation" ? "En évaluation" :
                     app?.dossierStatus === "contrat_obtenu" ? "Contrat Obtenu" :
                     app?.dossierStatus === "en_cours_recrutement" ? "En cours" :
                     app?.dossierStatus === "soumis_agences" ? "Soumis" :
                     app?.dossierStatus === "documents_recus" ? "Documents reçus" :
                     app?.dossierStatus === "en_attente_documents" ? "En attente docs" :
                     app?.dossierStatus === "paye" ? "Payé" :
                     app?.dossierStatus === "en_attente_paiement" ? "En attente paiement" :
                     app?.dossierStatus === "bilan_envoye" ? "Bilan envoyé" :
                     app?.dossierStatus === "nouveau" ? "Nouveau" :
                     "En attente"}
                  </Badge>
                  <span className="text-gray-600">
                    Dernière mise à jour : {app?.updatedAt ? new Date(app.updatedAt).toLocaleDateString('fr-FR') : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Mes documents</CardTitle>
                <Button onClick={() => handleQuickUpload("")}>
                  <FileText className="w-4 h-4 mr-2" />
                  Ajouter un document
                </Button>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun document uploadé</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-semibold">{doc.filename}</p>
                            <p className="text-sm text-gray-600">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('fr-FR') : '—'}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mes messages</CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun message</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-indigo-500 mt-1" />
                          <div className="flex-1">
                            <p className="font-semibold">{msg.subject}</p>
                            <p className="text-sm text-gray-600 mt-1">{msg.content}</p>
                            <p className="text-xs text-gray-400 mt-2">{msg.sentAt ? new Date(msg.sentAt).toLocaleDateString('fr-FR') : '—'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accord */}
          <TabsContent value="agreement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accord de service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Vous devez accepter nos conditions d'utilisation pour continuer.
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    {app?.agreementSigned ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-green-700">Accord signé le {app.agreementSignedAt ? new Date(app.agreementSignedAt).toLocaleDateString('fr-FR') : '—'}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <span className="text-amber-700">Accord non signé</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <QuickUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        documentType={selectedDocumentType}
        onUpload={handleUploadFile}
      />

      {/* Boîte de dialogue de déconnexion */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la déconnexion</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre espace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Deconnexion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bilan Action Modal - à implémenter */}
    </div>
  );
}
