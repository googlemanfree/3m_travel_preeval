import { useAuth } from "@/_core/hooks/useAuth";
import { skipToken } from "@tanstack/react-query";
import { useLocation, useRouter } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, FileText, Upload, MessageSquare, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CandidateDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  
  // Récupérer les dossiers du candidat
  const { data: applications, isLoading: applicationsLoading } = trpc.application.getMyApplications.useQuery(
    isAuthenticated && user?.id ? { candidateId: user.id } : skipToken,
    { enabled: isAuthenticated && !!user?.id }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login?redirect=1&from=/candidat-espace");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || applicationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mon Espace</h1>
          <p className="text-muted-foreground">
            Bienvenue {user?.name || "Candidat"}, gérez vos dossiers de visa ici.
          </p>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="dossiers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dossiers">Mes Dossiers</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="rappel">Demander un Rappel</TabsTrigger>
          </TabsList>

          {/* Onglet : Mes Dossiers */}
          <TabsContent value="dossiers" className="space-y-4">
            {applications && applications.length > 0 ? (
              <div className="grid gap-4">
                {applications.map((app) => (
                  <Card key={app.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{app.dossierNumber}</CardTitle>
                          <CardDescription>
                            {app.fullName} • {app.destination}
                          </CardDescription>
                        </div>
                        <StatusBadge status={app.dossierStatus} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progression */}
                      <ProgressBar applicationId={app.id} />

                      {/* Informations */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Type de visa</p>
                          <p className="font-medium">{app.visaType || "Non spécifié"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Formule</p>
                          <p className="font-medium">{app.formulaChosen || "Non spécifiée"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Paiement</p>
                          <p className="font-medium">{app.paymentStatus}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Créé le</p>
                          <p className="font-medium">{new Date(app.createdAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>

                      {/* Notes admin */}
                      {app.adminNote && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{app.adminNote}</AlertDescription>
                        </Alert>
                      )}

                      {/* Boutons d'action */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/candidat-dossier/${app.id}`)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Voir Détails
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/candidat-documents/${app.id}`)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Mes Documents
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground mb-4">
                    Vous n'avez pas encore créé de dossier.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => navigate("/nouvelle-demande")}
                  >
                    Créer un Nouveau Dossier
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet : Documents */}
          <TabsContent value="documents" className="space-y-4">
            {applications && applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <Card key={app.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{app.dossierNumber}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DocumentsList applicationId={app.id} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Aucun dossier pour afficher les documents.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet : Messages */}
          <TabsContent value="messages" className="space-y-4">
            {applications && applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <Card key={app.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{app.dossierNumber}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MessagesList applicationId={app.id} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Aucun dossier pour afficher les messages.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet : Demander un Rappel */}
          <TabsContent value="rappel" className="space-y-4">
            {applications && applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <Card key={app.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{app.dossierNumber}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CallbackRequestForm applicationId={app.id} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Aucun dossier pour demander un rappel.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Composants auxiliaires

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    nouveau: { color: "bg-blue-100 text-blue-800", icon: <Clock className="w-4 h-4" />, label: "Nouveau" },
    en_evaluation: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" />, label: "En Évaluation" },
    bilan_envoye: { color: "bg-purple-100 text-purple-800", icon: <FileText className="w-4 h-4" />, label: "Bilan Envoyé" },
    en_attente_paiement: { color: "bg-orange-100 text-orange-800", icon: <AlertCircle className="w-4 h-4" />, label: "En Attente de Paiement" },
    paye: { color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-4 h-4" />, label: "Payé" },
    en_attente_documents: { color: "bg-orange-100 text-orange-800", icon: <Upload className="w-4 h-4" />, label: "En Attente de Documents" },
    documents_recus: { color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-4 h-4" />, label: "Documents Reçus" },
    soumis_agences: { color: "bg-blue-100 text-blue-800", icon: <Clock className="w-4 h-4" />, label: "Soumis aux Agences" },
    en_cours_recrutement: { color: "bg-blue-100 text-blue-800", icon: <Clock className="w-4 h-4" />, label: "En Cours de Recrutement" },
    contrat_obtenu: { color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-4 h-4" />, label: "Contrat Obtenu" },
    visa_approuve: { color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-4 h-4" />, label: "Visa Approuvé" },
    refuse: { color: "bg-red-100 text-red-800", icon: <AlertCircle className="w-4 h-4" />, label: "Refusé" },
  };

  const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", icon: <Clock className="w-4 h-4" />, label: status };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </div>
  );
}

function ProgressBar({ applicationId }: { applicationId: number }) {
  const { data: progress } = trpc.application.getApplicationProgress?.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  ) || { data: undefined };

  const steps = [
    { key: "evaluation", label: "Évaluation" },
    { key: "bilan", label: "Bilan" },
    { key: "traduction", label: "Traduction" },
    { key: "documents", label: "Documents" },
    { key: "soumission", label: "Soumission" },
    { key: "visa", label: "Visa" },
  ];

  const currentStepIndex = progress ? steps.findIndex((s) => s.key === progress.step) : 0;
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Progression du Dossier</span>
        <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="grid grid-cols-6 gap-2 text-xs">
        {steps.map((step, index) => (
          <div key={step.key} className="text-center">
            <div
              className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-xs font-bold ${
                index <= currentStepIndex ? "bg-primary" : "bg-gray-300"
              }`}
            >
              {index + 1}
            </div>
            <p className={index <= currentStepIndex ? "font-medium" : "text-muted-foreground"}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentsList({ applicationId }: { applicationId: number }) {
  const { data: documents } = trpc.application.getApplicationDocuments?.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  ) || { data: undefined };

  return (
    <div className="space-y-2">
      {documents && documents.length > 0 ? (
        <ul className="space-y-2">
          {documents?.map((doc: any) => (
            <li key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{doc.fileName}</span>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                Télécharger
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun document uploadé.</p>
      )}
    </div>
  );
}

function MessagesList({ applicationId }: { applicationId: number }) {
  const { data: messages } = trpc.application.getApplicationMessages?.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  ) || { data: undefined };

  return (
    <div className="space-y-2">
      {messages && messages.length > 0 ? (
        <ul className="space-y-2">
          {messages?.map((msg: any) => (
            <li key={msg.id} className="p-2 bg-gray-50 rounded">
              <p className="text-sm font-medium">{msg.senderRole === "advisor" ? "Conseiller" : "Vous"}</p>
              <p className="text-sm text-muted-foreground">{msg.content}</p>
              <p className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString("fr-FR")}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun message.</p>
      )}
    </div>
  );
}

function CallbackRequestForm({ applicationId }: { applicationId: number }) {
  const [formData, setFormData] = useState({
    preferredDate: "",
    preferredTime: "",
    reason: "",
  });

  const createCallback = trpc.application.createCallbackRequest?.useMutation?.() || { mutateAsync: async () => {} };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCallback.mutateAsync({
      applicationId,
      ...formData,
    });
    setFormData({ preferredDate: "", preferredTime: "", reason: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Date préférée</label>
        <input
          type="date"
          value={formData.preferredDate}
          onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Heure préférée</label>
        <input
          type="time"
          value={formData.preferredTime}
          onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Raison</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Décrivez la raison de votre demande de rappel..."
        />
      </div>
      <Button type="submit" className="w-full" disabled={createCallback.isPending}>
        <Phone className="w-4 h-4 mr-2" />
        {createCallback.isPending ? "En cours..." : "Demander un Rappel"}
      </Button>
    </form>
  );
}
