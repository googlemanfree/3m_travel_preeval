import React, { useState, useEffect } from "react";
import { useCandidateAuth, getCandidateToken } from "@/hooks/useCandidateAuth";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, FileText, MessageSquare, Download } from "lucide-react";
import { QuickActionNotification, MissingDocumentsList } from "@/components/QuickActionNotification";
import { QuickUploadModal } from "@/components/QuickUploadModal";
import { BilanActionModal } from "@/components/BilanActionModal";
import { useMissingDocuments, useDocumentCompleteness } from "@/hooks/useMissingDocuments";

export default function MySpace() {
  const { candidate, isAuthenticated } = useCandidateAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [showNotification, setShowNotification] = useState(true);
  const [bilanActionModalOpen, setBilanActionModalOpen] = useState(false);

  // Récupérer les données du dossier
  const utils = trpc.useUtils();
  const { data: dossierData, isLoading, error } = trpc.candidate.getMyDossierData.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const saveDocMutation = trpc.candidate.saveDocument.useMutation({
    onSuccess: () => {
      utils.candidate.getMyDossierData.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Rediriger si non authentifié (filet de sécurité : AuthGuard gère déjà ce cas normalement)
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

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

  const app = dossierData.data?.application;
  const documents = dossierData.data?.documents || [];
  const messages = dossierData.data?.messages || [];

  // Détecter les documents manquants
  const missingDocuments = useMissingDocuments(
    app ? { projectType: (app as any).projectType || "", academicLevel: app.academicLevel || "" } : null,
    documents
  );
  const completeness = useDocumentCompleteness(
    app ? { projectType: (app as any).projectType || "", academicLevel: app.academicLevel || "" } : null,
    documents
  );

  // Gestionnaire pour ouvrir le modal de téléversement
  const handleQuickUpload = (documentType: string) => {
    setSelectedDocumentType(documentType);
    setUploadModalOpen(true);
  };

  // Gestionnaire pour le téléversement
  const handleUploadFile = async (file: File, documentType: string) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 Mo).");
      return;
    }

    try {
      const token = getCandidateToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", documentType);

      const res = await fetch("/api/candidate/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur upload" }));
        throw new Error(err.error || "Erreur lors de l'upload");
      }

      const { fileUrl, fileKey, fileName, fileSizeBytes, mimeType } = await res.json();

      await saveDocMutation.mutateAsync({
        fileType: documentType as any,
        fileName: fileName || file.name,
        fileUrl,
        fileKey,
        fileSizeBytes: fileSizeBytes || file.size,
        mimeType: mimeType || file.type,
      });

      toast.success("Document envoyé avec succès !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'upload");
    }
  };

  // Afficher la notification si des documents manquent
  const shouldShowNotification = missingDocuments && missingDocuments.length > 0 && (app as any)?.dossierStatus === "en_evaluation";

  // Déterminer le badge de statut
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
      nouveau: { label: "Nouveau dossier", variant: "secondary", icon: <Clock className="w-4 h-4" /> },
      en_evaluation: { label: "Évaluation en cours", variant: "default", icon: <Clock className="w-4 h-4" /> },
      documents_recus: { label: "Documents reçus", variant: "default", icon: <FileText className="w-4 h-4" /> },
      bilan_envoye: { label: "Bilan envoyé", variant: "default", icon: <CheckCircle2 className="w-4 h-4" /> },
      paye: { label: "Payé", variant: "default", icon: <CheckCircle2 className="w-4 h-4" /> },
      visa_approuve: { label: "Visa approuvé", variant: "default", icon: <CheckCircle2 className="w-4 h-4" /> },
      refuse: { label: "Refusé", variant: "destructive", icon: <AlertCircle className="w-4 h-4" /> },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary", icon: <Clock className="w-4 h-4" /> };
    return (
      <Badge variant={statusInfo.variant as any} className="gap-2">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  // Déterminer le badge de paiement
  const getPaymentBadge = (status: string) => {
    const paymentMap: Record<string, { label: string; variant: string }> = {
      PENDING: { label: "En attente", variant: "secondary" },
      SUCCESS: { label: "Payé", variant: "default" },
      FAILED: { label: "Échoué", variant: "destructive" },
      CANCELLED: { label: "Annulé", variant: "destructive" },
    };

    const paymentInfo = paymentMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={paymentInfo.variant as any}>{paymentInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mon Espace Candidat</h1>
              <p className="text-blue-100">Bienvenue, {candidate?.fullName || "candidat"}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-sm text-blue-100">Numéro de dossier</p>
                <p className="text-2xl font-bold">{app?.dossierNumber}</p>
              </div>
              <a href={`/mon-dossier?dossier=${app?.dossierNumber}`}>
                <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                  📋 Suivre mon dossier
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Statut</CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(app?.dossierStatus || "nouveau")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Destination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold capitalize">{app?.destination}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{app?.scoringTotal || app?.evaluationScore || "-"}/100</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">{documents.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="agreement">Accord</TabsTrigger>
          </TabsList>

          {/* Aperçu */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statut du Dossier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">État actuel :</span>
                  {getStatusBadge(app?.dossierStatus || "nouveau")}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Paiement :</span>
                  {getPaymentBadge(app?.paymentStatus || "PENDING")}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Protocole d'accord :</span>
                  {app?.agreementSigned ? (
                    <Badge variant="default" className="gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Signé
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Non signé
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nom complet</p>
                  <p className="font-medium">{app?.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{app?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléphone WhatsApp</p>
                  <p className="font-medium">{app?.whatsappNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nationalité</p>
                  <p className="font-medium">{app?.nationality || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de naissance</p>
                  <p className="font-medium">{app?.dateOfBirth || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Formule choisie</p>
                  <p className="font-medium capitalize">{app?.formulaChosen || "-"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profil Académique & Professionnel</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Niveau d'études</p>
                  <p className="font-medium">{app?.academicLevel || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Années d'expérience</p>
                  <p className="font-medium">{app?.experienceYears || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Compétences linguistiques</p>
                  <p className="font-medium">{app?.languageSkills || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Secteur d'activité</p>
                  <p className="font-medium">{app?.jobSector || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employeur actuel</p>
                  <p className="font-medium">{app?.currentEmployer || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Poste actuel</p>
                  <p className="font-medium">{app?.currentJobTitle || "-"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vos Documents</CardTitle>
                <CardDescription>
                  {documents.length} document(s) uploadé(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun document uploadé</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{doc.fileName}</p>
                            <p className="text-sm text-gray-500">{doc.fileType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={doc.status === "verified" ? "default" : "secondary"}>
                            {doc.status}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`Télécharger ${doc.fileName}`}>
                              <Download className="w-4 h-4" />
                            </a>
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
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Messagerie</CardTitle>
                <CardDescription>
                  {messages.length} message(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun message</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={msg.senderRole === "advisor" ? "default" : "secondary"}>
                            {msg.senderRole === "advisor" ? "Conseiller" : "Vous"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accord */}
          <TabsContent value="agreement" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Protocole d'Accord</CardTitle>
                <CardDescription>
                  Signature électronique de l'accord de service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {app?.agreementSigned ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <p className="font-medium text-green-900">Protocole signé</p>
                    </div>
                    <p className="text-sm text-green-800">
                      Signé par : {app.agreementSignatureName}
                    </p>
                    <p className="text-sm text-green-800">
                      Date : {app.agreementSignedAt ? new Date(app.agreementSignedAt * 1000).toLocaleDateString("fr-FR") : "-"}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <p className="font-medium text-yellow-900">Protocole non signé</p>
                    </div>
                    <p className="text-sm text-yellow-800 mb-4">
                      Vous devez signer le protocole d'accord avant de pouvoir soumettre vos documents.
                    </p>
                    <Button className="bg-yellow-600 hover:bg-yellow-700">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Signer le protocole
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
