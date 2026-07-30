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

// Composant onglet Traductions (utilise getTranslationRequests)
function TranslationsTab() {
  const { data: translations, isLoading } = trpc.translation.getTranslationRequests.useQuery({});

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
    if (status === "pending_translation") return "bg-purple-500";
    return "bg-yellow-500";
  };

  if (isLoading) {
    return <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-purple-500" />
          Mes Traductions
        </CardTitle>
        <CardDescription>Suivi de vos demandes de traduction</CardDescription>
      </CardHeader>
      <CardContent>
        {!translations || translations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Languages className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune traduction demandée</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <a href="/traductions">Demander une traduction</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {translations.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{t.documentType || "Traduction"}</p>
                    <Badge className={statusColor(t.status)}>{statusLabel(t.status)}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{t.sourceLanguage} → {t.targetLanguage}</p>
                  <p className="text-xs text-gray-400 mt-1">Demandée le {new Date(t.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-right">
                  {t.status === "completed" && t.translatedDocumentUrl && (
                    <Button size="sm" asChild>
                      <a href={t.translatedDocumentUrl} download>
                        <Download className="w-4 h-4 mr-1" /> Télécharger
                      </a>
                    </Button>
                  )}
                  {t.status === "pending_payment" && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/traductions?id=${t.id}`}>
                        Payer <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Composant onglet Dossier (utilise getMyDossierData)
function DossierTab() {
  const { data: dossier, isLoading } = trpc.candidate.getMyDossierData.useQuery();
  const { data: docsResponse } = trpc.candidate.getMyDocuments.useQuery();
  const documents = docsResponse?.documents || [];
  const completeness = Math.round((documents.length / 10) * 100);

  if (isLoading) {
    return <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>;
  }

  if (!dossier || !dossier.data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun dossier trouvé</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <a href="/evaluation">Créer un dossier</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const appData = dossier.data;
  
  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending_evaluation: "En attente d'évaluation",
      under_review: "En examen",
      approved: "Approuvé",
      rejected: "Rejeté",
      completed: "Complété",
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    if (status === "approved" || status === "completed") return "bg-green-500";
    if (status === "rejected") return "bg-red-500";
    if (status === "under_review") return "bg-blue-500";
    return "bg-yellow-500";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Statut du Dossier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Numéro de dossier</p>
              <p className="font-semibold">{appData?.application?.dossierNumber || appData?.application?.id}</p>
            </div>
            <Badge className={statusColor("pending_evaluation")}>En attente d'évaluation</Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completeness}%` }}></div>
          </div>
          <p className="text-sm text-gray-500">Complétude: {completeness}%</p>
        </CardContent>
      </Card>

      {documents.length < 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Documents Manquants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Veuillez télécharger les documents requis pour compléter votre dossier.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-500" />
            Documents ({documents.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun document téléchargé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">{doc.documentType}</p>
                      <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={doc.fileUrl} download>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Composant onglet Messages (utilise getMessages)
function MessagesTab() {
  const { data: messages, isLoading } = trpc.candidate.getMessages.useQuery();
  const { data: unreadCount } = trpc.candidate.unreadCount.useQuery();
  const sendMessageMutation = trpc.candidate.sendMessage.useMutation();
  const [messageText, setMessageText] = React.useState("");

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    try {
      await sendMessageMutation.mutateAsync({ content: messageText });
      setMessageText("");
      toast.success("Message envoyé");
    } catch (err) {
      toast.error("Erreur lors de l'envoi du message");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          Messagerie {unreadCount && unreadCount.count > 0 && <Badge variant="destructive">{unreadCount.count}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-3">
          {!messages || messages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun message</p>
          ) : (
            messages.map((msg: any) => (
              <div key={msg.id} className={`p-3 rounded-lg ${msg.senderRole === "candidate" ? "bg-blue-100 ml-8" : "bg-gray-200 mr-8"}`}>
                <p className="text-sm font-semibold">{msg.senderRole === "candidate" ? "Vous" : "Support"}</p>
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(msg.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Votre message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending}>
            Envoyer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant principal
export default function MySpace() {
  const { candidate, isAuthenticated } = useCandidateAuth();
  const [, navigate] = useLocation();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=1&from=/mon-espace");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !candidate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon Espace</h1>
          <p className="text-gray-600">Bienvenue, {candidate.fullName || candidate.email}</p>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="dossier" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dossier">
              <FileText className="w-4 h-4 mr-2" /> Dossier
            </TabsTrigger>
            <TabsTrigger value="traductions">
              <Languages className="w-4 h-4 mr-2" /> Traductions
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" /> Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dossier">
            <DossierTab />
          </TabsContent>

          <TabsContent value="traductions">
            <TranslationsTab />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modales */}
    </div>
  );
}

import * as React from "react";
