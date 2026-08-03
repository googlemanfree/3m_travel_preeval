import { useState, useEffect } from "react";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, FileText, MessageSquare, Download, LogOut, Languages, ExternalLink, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { QuickActionNotification, MissingDocumentsList } from "@/components/QuickActionNotification";
import { QuickUploadModal } from "@/components/QuickUploadModal";
import { BilanActionModal } from "@/components/BilanActionModal";
import { useMissingDocuments, useDocumentCompleteness } from "@/hooks/useMissingDocuments";
import { DossierLoadingAnimation } from "@/components/DossierLoadingAnimation";
import { DossierStatusPipeline, type StatusStep } from "@/components/DossierStatusPipeline";
import { DashboardStats } from "@/components/DashboardStats";
import { PaymentHistory } from "@/components/PaymentHistory";
import { DocumentsStatus } from "@/components/DocumentsStatus";
import { DossierOverview } from "@/components/DossierOverview";

// Composant onglet Paiements
function PaymentsTab({ dossierNumber }: { dossierNumber?: string }) {
  return (
    <div className="space-y-6">
      <PaymentHistory dossierNumber={dossierNumber} />
    </div>
  );
}

// Composant onglet Traductions
function TranslationsTab() {
  // Procédure getMyTranslations non disponible - afficher un message
  const translations: any[] = [];
  const isLoading = false;

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending_payment: "En attente de paiement",
      pending_translation: "En attente de traducteur",
      in_progress: "En cours",
      completed: "Terminée",
      rejected: "Rejetée",
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-green-500";
    if (status === "rejected") return "bg-red-500";
    if (status === "in_progress") return "bg-blue-500";
    return "bg-yellow-500";
  };

  if (isLoading) return <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-purple-500" />
          Mes Traductions Certifiées
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => window.location.href = '/traduction'}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Commander
        </Button>
      </CardHeader>
      <CardContent>
        {!translations || translations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Languages className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune traduction commandée</p>
            <Button className="mt-4" onClick={() => window.location.href = '/traduction'}>Commander une traduction</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {translations.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{t.documentType?.replace(/_/g, ' ')}</p>
                    <Badge className={statusColor(t.status)}>{statusLabel(t.status)}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{t.sourceLanguage} → {t.targetLanguage}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR') : '—'}</p>
                </div>
                {t.status === 'completed' && t.translatedFileUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={t.translatedFileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MySpace() {
  const { isAuthenticated, candidate, logout } = useCandidateAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [showNotification, setShowNotification] = useState(true);
  const [bilanActionModalOpen, setBilanActionModalOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDossierAnimation, setShowDossierAnimation] = useState(true);
  const [animationStatus, setAnimationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [pipelineSteps, setPipelineSteps] = useState<StatusStep[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

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

  // Gérer l'animation de chargement
  useEffect(() => {
    if (!isLoading && dossierData) {
      if (dossierData.success) {
        setAnimationStatus('success');
        setTimeout(() => setShowDossierAnimation(false), 2000);
      } else {
        setAnimationStatus('error');
        setTimeout(() => setShowDossierAnimation(false), 2000);
      }
    }
  }, [isLoading, dossierData]);

  // Afficher l'animation au chargement initial
  useEffect(() => {
    if (isAuthenticated && isLoading) {
      setShowDossierAnimation(true);
      setAnimationStatus('loading');
    }
  }, [isAuthenticated, isLoading]);

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

  // Fonction pour mapper les statuts du dossier aux étapes du pipeline
  const generatePipelineSteps = (app: any): StatusStep[] => {
    const statusMap: Record<string, number> = {
      "nouveau": 0,
      "en_evaluation": 1,
      "bilan_envoye": 2,
      "en_attente_paiement": 3,
      "paye": 4,
      "en_attente_documents": 5,
      "documents_recus": 6,
      "soumis_agences": 7,
      "en_cours_recrutement": 8,
      "contrat_obtenu": 9,
      "visa_approuve": 10,
      "refuse": 11,
    };

    const currentStatusIndex = statusMap[app?.dossierStatus] ?? 0;

    const steps: StatusStep[] = [
      {
        key: "nouveau",
        label: "Dossier Créé",
        description: "Votre dossier a été enregistré dans notre système",
        date: app?.createdAt ? new Date(app.createdAt) : undefined,
        completed: currentStatusIndex >= 0,
        current: currentStatusIndex === 0,
        failed: false,
      },
      {
        key: "en_evaluation",
        label: "Évaluation",
        description: "Nos experts analysent votre profil",
        date: undefined,
        completed: currentStatusIndex >= 1,
        current: currentStatusIndex === 1,
        failed: false,
      },
      {
        key: "bilan_envoye",
        label: "Bilan Envoyé",
        description: "Vous avez reçu votre bilan d'évaluation",
        date: undefined,
        completed: currentStatusIndex >= 2,
        current: currentStatusIndex === 2,
        failed: false,
      },
      {
        key: "paye",
        label: "Paiement Reçu",
        description: "Votre paiement a été confirmé",
        date: app?.paymentDate ? new Date(app.paymentDate) : undefined,
        completed: currentStatusIndex >= 4,
        current: currentStatusIndex === 4,
        failed: app?.paymentStatus === "FAILED",
      },
      {
        key: "en_attente_documents",
        label: "Documents en Attente",
        description: "Veuillez télécharger les documents requis",
        date: undefined,
        completed: currentStatusIndex >= 5,
        current: currentStatusIndex === 5,
        failed: false,
      },
      {
        key: "documents_recus",
        label: "Documents Reçus",
        description: "Vérification de vos documents",
        date: undefined,
        completed: currentStatusIndex >= 6,
        current: currentStatusIndex === 6,
        failed: false,
      },
      {
        key: "soumis_agences",
        label: "Soumis aux Agences",
        description: "Votre dossier est envoyé aux partenaires",
        date: undefined,
        completed: currentStatusIndex >= 7,
        current: currentStatusIndex === 7,
        failed: false,
      },
      {
        key: "visa_approuve",
        label: "Visa Approuvé",
        description: "Félicitations ! Votre visa est approuvé",
        date: undefined,
        completed: currentStatusIndex >= 10,
        current: currentStatusIndex === 10,
        failed: app?.dossierStatus === "refuse",
      },
    ];

    return steps;
  };

  // Mettre à jour le pipeline quand les données du dossier changent
  useEffect(() => {
    if (app) {
      const steps = generatePipelineSteps(app);
      setPipelineSteps(steps);
      const completedCount = steps.filter((s) => s.completed).length;
      setCompletionPercentage(Math.round((completedCount / steps.length) * 100));
    }
  }, [app]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Animation de chargement du dossier */}
      <DossierLoadingAnimation
        isLoading={showDossierAnimation && isLoading}
        status={animationStatus}
        message={animationStatus === 'loading' ? 'Vérification de votre dossier...' : animationStatus === 'success' ? 'Dossier trouvé avec succès!' : 'Erreur lors de la vérification'}
        dossierNumber={(app as any)?.dossierNumber || candidate?.id || ''}
      />

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

        {/* Statistiques du Dashboard */}
        {app && (
          <DashboardStats
            dossierNumber={app.dossierNumber || "—"}
            destination={app.destination || "—"}
            visaType={app.visaType || "—"}
            createdAt={app.createdAt ? new Date(app.createdAt) : new Date()}
            paymentStatus={app.paymentStatus || "PENDING"}
            dossierStatus={app.dossierStatus || "nouveau"}
            documentsCount={documents.length}
            completionPercentage={progress}
          />
        )}

        {/* Notification des documents manquants */}
        {shouldShowNotification && missingDocuments && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-semibold">Documents manquants</p>
              <p className="text-yellow-700 text-sm mt-1">{missingDocuments.join(", ")}</p>
            </div>
          )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="tracking">Suivi</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="translations">Traductions</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="agreement">Accord</TabsTrigger>
          </TabsList>

          {/* Aperçu */}
          <TabsContent value="overview" className="space-y-6">
            {/* Pipeline de statuts */}
            {pipelineSteps.length > 0 && (
              <DossierStatusPipeline
                steps={pipelineSteps}
                currentStatus={app?.dossierStatus || "nouveau"}
                completionPercentage={completionPercentage}
              />
            )}

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

          {/* Suivi */}
          <TabsContent value="tracking" className="space-y-6">
            {app && (
              <>
                <DossierOverview dossierNumber={app.dossierNumber || ""} />
                <PaymentHistory dossierNumber={app.dossierNumber || ""} />
                <DocumentsStatus dossierNumber={app.dossierNumber || ""} />
              </>
            )}
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

          {/* Traductions */}
          <TabsContent value="translations" className="space-y-6">
            <TranslationsTab />
          </TabsContent>

          {/* Paiements */}
          <TabsContent value="payments" className="space-y-6">
            <PaymentsTab dossierNumber={app?.dossierNumber} />
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
