import { useState, useEffect } from "react";
import { getCandidateToken, useCandidateAuth } from "@/hooks/useCandidateAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, FileText, MessageSquare, Download, LogOut, Languages, ExternalLink, CreditCard, Settings, Gauge, ZapOff } from "lucide-react";
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
import { useAnimationPreferences } from "@/contexts/AnimationPreferencesContext";
import { type AnimationPreference } from "@shared/animationPreferences";
import { DossierOverview } from "@/components/DossierOverview";
import SignatureCanvas from "@/components/SignatureCanvas";
import { jsPDF } from "jspdf";

const escapeAgreementHtml = (value: unknown) => String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#039;" })[character] ?? character);

function downloadSignedAgreementPdf(application: { dossierNumber?: string | null; agreementSignatureName?: string | null; agreementSignedAt?: number | null }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 20;
  const contentWidth = 170;
  const signedDate = application.agreementSignedAt ? new Date(Number(application.agreementSignedAt) * 1000).toLocaleString("fr-FR") : "—";
  const writeParagraph = (text: string, y: number, size = 11) => {
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, contentWidth);
    pdf.text(lines, margin, y);
    return y + lines.length * (size * 0.48) + 7;
  };
  pdf.setTextColor(15, 36, 96);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("3M Travel & Services SARL", margin, 25);
  pdf.setDrawColor(201, 151, 43);
  pdf.setLineWidth(1);
  pdf.line(margin, 31, 190, 31);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.text("Protocole d’accord de service — copie signée", margin, 42);
  pdf.setFillColor(243, 246, 251);
  pdf.roundedRect(margin, 50, contentWidth, 31, 3, 3, "F");
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(10);
  pdf.text(`Dossier : ${application.dossierNumber || "—"}`, margin + 6, 60);
  pdf.text(`Signataire : ${application.agreementSignatureName || "Candidat"}`, margin + 6, 68);
  pdf.text(`Date de signature : ${signedDate}`, margin + 6, 76);
  pdf.setTextColor(30, 41, 59);
  let y = 98;
  y = writeParagraph("Le présent protocole formalise la demande d’accompagnement administratif et de mobilité internationale du candidat. 3M Travel & Services fournit une assistance documentaire, une orientation et un suivi humain ; les décisions de visa, de permis ou de recrutement appartiennent exclusivement aux autorités et employeurs compétents.", y);
  y = writeParagraph("Obligations du candidat : transmettre des informations exactes, complètes et à jour, fournir les pièces demandées dans les délais indiqués et signaler toute modification de situation. Toute information inexacte ou pièce falsifiée peut entraîner la suspension du traitement.", y);
  y = writeParagraph("Délais et communication : les délais communiqués sont des estimations administratives et dépendent de la complétude du dossier, des réponses du candidat, des partenaires et des autorités. Le candidat doit consulter son espace et répondre aux demandes dans le délai indiqué.", y);
  y = writeParagraph("Frais et limites de responsabilité : les frais d’accompagnement sont distincts des frais officiels et frais de tiers. 3M Travel & Services ne contrôle pas les décisions, délais ou exigences externes et ne garantit ni visa, ni permis, ni emploi, ni résultat.", y);
  y = writeParagraph("La signature confirme la lecture et l’acceptation du protocole. Elle est disponible uniquement après confirmation du paiement, ne vaut aucune promesse de résultat et les étapes du parcours sont traitées dans leur ordre.", y);
  pdf.setFont("helvetica", "bold");
  pdf.text("Statut : protocole signé et enregistré dans le dossier.", margin, y + 5);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text("Document généré depuis l’espace client sécurisé — 3M Travel & Services", margin, 282);
  pdf.save(`protocole-signe-${application.dossierNumber || "dossier"}.pdf`);
}

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
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementSignatureName, setAgreementSignatureName] = useState("");
  const [agreementSignatureDataUrl, setAgreementSignatureDataUrl] = useState<string | null>(null);
  const { preference: animationPreference, setPreference: setAnimationPreference } = useAnimationPreferences();

  // Récupérer les données du dossier
  const { data: dossierData, isLoading, error } = trpc.candidate.getMyDossierData.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const trpcUtils = trpc.useUtils();
  const saveDocumentMutation = trpc.candidate.saveDocument.useMutation();
  const signAgreementMutation = trpc.candidate.signAgreementProtocol.useMutation({
    onSuccess: async () => {
      toast.success("Protocole d’accord signé et enregistré.");
      setAgreementAccepted(false);
      setAgreementSignatureName("");
      setAgreementSignatureDataUrl(null);
      await trpcUtils.candidate.getMyDossierData.invalidate();
    },
    onError: (mutationError) => toast.error(mutationError.message || "La signature n’a pas pu être enregistrée."),
  });

  useEffect(() => {
    const application = dossierData?.data?.application;
    if (dossierData?.success && application && !application.agreementSigned) {
      setActiveTab("agreement");
    }
  }, [dossierData]);

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
                {error?.message || "Impossible de charger vos données"}
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

  // Gestionnaire pour le téléversement — stockage réel, puis enregistrement lié au candidat.
  const handleUploadFile = async (file: File, documentType: string) => {
    const token = getCandidateToken();
    if (!token) {
      throw new Error("Votre session candidat a expiré. Veuillez vous reconnecter.");
    }

    const typeAliases: Record<string, "cv" | "passeport" | "diplome" | "releve_notes" | "photo" | "justificatif_domicile" | "extrait_naissance" | "casier_judiciaire" | "autre"> = {
      cv: "cv",
      passeport: "passeport",
      passport: "passeport",
      diplome: "diplome",
      diplôme: "diplome",
      releve: "releve_notes",
      "relevé": "releve_notes",
      photo: "photo",
      domicile: "justificatif_domicile",
      naissance: "extrait_naissance",
      casier: "casier_judiciaire",
    };
    const fileType = typeAliases[documentType.trim().toLowerCase()] || "autre";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);

    const response = await fetch("/api/candidate/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Erreur lors du téléversement");

    await saveDocumentMutation.mutateAsync({
      fileType,
      fileName: payload.fileName || file.name,
      fileUrl: payload.fileUrl,
      fileKey: payload.fileKey,
      fileSizeBytes: payload.fileSizeBytes ?? file.size,
      mimeType: payload.mimeType || file.type,
    });
    await Promise.all([
      trpcUtils.candidate.getMyDossierData.invalidate(),
      trpcUtils.candidate.getMyDocuments.invalidate(),
    ]);
    toast.success("Document téléversé et enregistré.");
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
          <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="tracking">Suivi</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="translations">Traductions</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="settings">Préférences</TabsTrigger>
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
                <Button onClick={() => handleQuickUpload("autre")}>
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
                        {doc.fileUrl ? (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Télécharger ${doc.fileName || "le document"}`}
                            >
                              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                              Télécharger
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled aria-label="Document indisponible">
                            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                            Indisponible
                          </Button>
                        )}
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

          {/* Préférences */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600" /> Préférences d’animation</CardTitle>
                <CardDescription>Choisissez la vitesse des animations de l’interface ou désactivez-les complètement. Votre choix est enregistré sur cet appareil.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Vitesse des animations">
                  {([
                    { value: "normal", label: "Standard", description: "Transitions équilibrées", icon: Gauge },
                    { value: "fast", label: "Rapide", description: "Réponses plus immédiates", icon: ZapOff },
                    { value: "off", label: "Désactivées", description: "Réduit les mouvements", icon: ZapOff },
                  ] as const).map(({ value, label, description, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={animationPreference === value}
                      onClick={() => setAnimationPreference(value as AnimationPreference)}
                      className={`rounded-2xl border p-4 text-left transition-all ${animationPreference === value ? "border-blue-500 bg-blue-50/80 shadow-md dark:bg-blue-950/40" : "border-slate-200/80 bg-white/50 hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900/30"}`}
                    >
                      <Icon className={`mb-3 h-5 w-5 ${animationPreference === value ? "text-blue-600" : "text-slate-500"}`} aria-hidden="true" />
                      <span className="block font-semibold text-slate-800 dark:text-slate-100">{label}</span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{description}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Le mode « Désactivées » conserve les retours essentiels et respecte la préférence de réduction des mouvements de votre système.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accord */}
          <TabsContent value="agreement" className="space-y-6">
            <Card className="border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-700" /> Protocole d’accord de service</CardTitle>
                <CardDescription>Ce document doit être consulté et signé avant tout passage du dossier en traitement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {app?.agreementSigned ? (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <div className="min-w-0 flex-1"><p className="font-semibold text-emerald-900">Protocole signé et enregistré</p><p className="text-sm text-emerald-800">Signature enregistrée le {app.agreementSignedAt ? new Date(Number(app.agreementSignedAt) * 1000).toLocaleDateString("fr-FR") : "—"} par {app.agreementSignatureName || "le candidat"}. Le dossier peut progresser selon les autres validations requises.</p><div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="outline" className="border-emerald-300 text-emerald-800 hover:bg-emerald-100" onClick={() => { const popup = window.open("", "_blank", "noopener,noreferrer,width=800,height=900"); if (!popup) { toast.error("Autorisez les fenêtres contextuelles pour visualiser le protocole."); return; } const signedDate = app.agreementSignedAt ? new Date(Number(app.agreementSignedAt) * 1000).toLocaleString("fr-FR") : "—"; popup.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Protocole signé — ${escapeAgreementHtml(app.dossierNumber)}</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 24px;color:#10234f;line-height:1.6}h1{color:#0f2460}header{border-bottom:3px solid #c9972b;padding-bottom:16px;margin-bottom:28px}.meta{background:#f3f6fb;padding:16px;margin:20px 0}button{background:#0f2460;color:white;border:0;padding:12px 18px;border-radius:6px}@media print{button{display:none}}</style></head><body><header><h1>3M Travel &amp; Services SARL</h1><p>Protocole d’accord de service — copie signée</p></header><div class="meta"><strong>Dossier :</strong> ${escapeAgreementHtml(app.dossierNumber)}<br><strong>Signataire :</strong> ${escapeAgreementHtml(app.agreementSignatureName || "Candidat")}<br><strong>Date de signature :</strong> ${escapeAgreementHtml(signedDate)}</div><p>Le présent protocole formalise la demande d’accompagnement administratif et de mobilité internationale. 3M Travel &amp; Services fournit une assistance documentaire, une orientation et un suivi humain ; les décisions de visa, de permis ou de recrutement appartiennent exclusivement aux autorités et employeurs compétents.</p><p>Le candidat s’engage à transmettre des informations exactes et les pièces demandées. Les frais officiels de tiers et les décisions des autorités ne constituent pas une garantie de résultat de l’agence.</p><p>La signature confirme la lecture et l’acceptation du protocole pour le dossier référencé. Elle ne vaut ni promesse d’emploi, ni promesse de visa, ni validation automatique de l’éligibilité.</p><p><strong>Statut :</strong> protocole signé et enregistré dans le dossier.</p><button onclick="window.print()">Imprimer / enregistrer en PDF</button></body></html>`); popup.document.close(); popup.focus(); }}><Download className="mr-2 h-4 w-4" /> Visualiser le protocole signé</Button><Button type="button" variant="outline" className="border-blue-300 text-blue-800 hover:bg-blue-50" onClick={() => downloadSignedAgreementPdf(app)}><Download className="mr-2 h-4 w-4" /> Télécharger le PDF signé</Button><Button type="button" className="bg-blue-800 text-white hover:bg-blue-900" onClick={() => setActiveTab(app.paymentStatus === "SUCCESS" ? "documents" : "payments")}>{app.paymentStatus === "SUCCESS" ? "Passer aux documents" : "Passer au paiement"}</Button></div></div>
                  </div>
                ) : app?.paymentStatus !== "SUCCESS" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950" role="status"><p className="font-semibold">Signature disponible après confirmation du paiement</p><p className="mt-2 text-sm leading-6">Le protocole peut être consulté, mais sa signature et la poursuite du traitement restent verrouillées tant que le paiement n’est pas confirmé par 3M Travel &amp; Services.</p><Button type="button" variant="outline" className="mt-4 border-amber-300 bg-white text-amber-900 hover:bg-amber-100" onClick={() => setActiveTab("payments")}>Consulter le paiement</Button></div>
                ) : (
                  <>
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700" tabIndex={0} aria-label="Texte du protocole d’accord">
                      <p className="font-bold text-slate-950">Protocole d’accord — 3M Travel & Services SARL</p>
                      <p className="mt-3">Le présent protocole formalise la demande d’accompagnement administratif et de mobilité internationale du candidat. 3M Travel & Services fournit une assistance documentaire, une orientation et un suivi humain ; les décisions de visa, de permis ou de recrutement appartiennent exclusivement aux autorités et employeurs compétents.</p>
                      <p className="mt-3"><strong>Obligations du candidat :</strong> transmettre des informations exactes, complètes et à jour, fournir les pièces demandées dans les délais indiqués, signaler toute modification de situation et coopérer aux vérifications nécessaires. Toute information inexacte ou pièce falsifiée peut entraîner la suspension du traitement.</p>
                      <p className="mt-3"><strong>Délais et communication :</strong> les délais communiqués sont des estimations administratives. Ils dépendent de la complétude du dossier, des réponses du candidat, des partenaires et des autorités. Le candidat doit consulter les notifications de son espace et répondre aux demandes dans le délai indiqué.</p>
                      <p className="mt-3"><strong>Frais et limites de responsabilité :</strong> les frais d’accompagnement sont distincts des frais officiels, traductions, examens, évaluations, dépôts et autres frais de tiers. 3M Travel & Services ne contrôle pas les décisions, délais ou exigences des autorités, employeurs et organismes externes et ne garantit ni visa, ni permis, ni emploi, ni résultat.</p>
                      <p className="mt-3"><strong>Signature et ordre des étapes :</strong> la signature confirme la lecture et l’acceptation du protocole pour le dossier référencé. Elle est disponible uniquement après confirmation du paiement et ne vaut ni promesse de résultat ni validation automatique de l’éligibilité. Les étapes du parcours sont traitées dans leur ordre ; une étape non validée bloque la suivante.</p>
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                      <input type="checkbox" className="mt-1 h-4 w-4" checked={agreementAccepted} onChange={(event) => setAgreementAccepted(event.target.checked)} disabled={signAgreementMutation.isPending} />
                      <span>Je confirme avoir lu le protocole, compris ses limites et autorise 3M Travel & Services à poursuivre l’instruction humaine de mon dossier.</span>
                    </label>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div><label htmlFor="myspace-agreement-signature" className="text-sm font-semibold text-slate-800">Nom complet du signataire</label><Input id="myspace-agreement-signature" value={agreementSignatureName} onChange={(event) => setAgreementSignatureName(event.target.value)} placeholder="Votre nom complet" className="mt-1" disabled={signAgreementMutation.isPending} /></div>
                      <div><p className="text-sm font-semibold text-slate-800">Signature manuscrite</p><SignatureCanvas onSignatureChange={setAgreementSignatureDataUrl} /></div>
                    </div>
                    <Button type="button" className="w-full bg-blue-800 text-white hover:bg-blue-900" disabled={!agreementAccepted || !agreementSignatureName.trim() || !agreementSignatureDataUrl || !app?.dossierNumber || signAgreementMutation.isPending} onClick={() => app?.dossierNumber && signAgreementMutation.mutate({ dossierNumber: app.dossierNumber, signatureName: agreementSignatureName.trim(), signatureDataUrl: agreementSignatureDataUrl ?? undefined })}>
                      {signAgreementMutation.isPending ? "Enregistrement de la signature…" : "Signer le protocole d’accord"}
                    </Button>
                    <p className="text-xs text-slate-500">Tant que cette étape n’est pas signée, le dossier reste bloqué avant traitement, même si un paiement a déjà été reçu.</p>
                  </>
                )}
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
