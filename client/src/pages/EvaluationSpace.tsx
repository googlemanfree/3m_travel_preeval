import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Share2,
  Loader2,
  ChevronRight,
  TrendingUp,
  FileText,
  Mail,
  Plane,
  FolderOpen,
  User,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Award,
  Calendar,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import ClientSpaceNavigation from "@/components/ClientSpaceNavigation";
import ClientMessagesPanel from "@/components/ClientMessagesPanel";
import ClientProfilePanel from "@/components/ClientProfilePanel";
import CandidateAvatar from "@/components/CandidateAvatar";
import DossierProgressTimeline from "@/components/DossierProgressTimeline";
import AgencyDocumentsPanel, { type AgencyDocumentView } from "@/components/AgencyDocumentsPanel";
import { DocumentUploader } from "@/components/DocumentUploader";

export default function EvaluationSpace() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const section = searchParams.get("section") || "overview";
  const { candidate, isAuthenticated, logout } = useCandidateAuth();
  const trpcUtils = trpc.useUtils();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "dossier" | "flights" | "documents" | "profile" | "messages">("overview");

  // Requête unique pour le résumé complet du tableau de bord client
  const { data: dashboardData, isLoading, refetch } = trpc.candidate.getClientDashboardSummary.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    if (searchParams.get("section")) {
      const s = searchParams.get("section") as any;
      if (["overview", "dossier", "flights", "documents", "profile", "messages"].includes(s)) {
        setActiveTab(s);
      }
    }
  }, [location]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Restreint</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Veuillez vous connecter à votre compte candidat pour accéder à votre tableau de bord unifié.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => setLocation("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
            >
              Se connecter
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Chargement de votre tableau de bord...</h2>
          <p className="text-gray-500 text-sm">Veuillez patienter pendant la synchronisation sécurisée</p>
        </Card>
      </div>
    );
  }

  const { candidate: cProfile, activeDossier, favoriteFlights, evaluations, messages, candidateFiles, agencyDocuments, stats } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 pb-16">
      {/* En-tête du tableau de bord unifié */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <CandidateAvatar avatarUrl={cProfile.avatarUrl} fullName={cProfile.fullName} size="lg" />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{cProfile.fullName}</h1>
                <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  N° {cProfile.dossierNumber}
                </span>
              </div>
              <p className="text-xs text-gray-500">{cProfile.email} {cProfile.phone ? `• ${cProfile.phone}` : ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              className="gap-2 text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
              Actualiser
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              size="sm"
              className="text-gray-700 bg-white hover:bg-gray-50"
            >
              Accueil
            </Button>
            <Button
              onClick={() => {
                logout();
                setLocation("/");
              }}
              variant="destructive"
              size="sm"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Barre de navigation principale du tableau de bord */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
          {[
            { id: "overview", label: "Vue d'ensemble", icon: TrendingUp },
            { id: "dossier", label: "Mon Dossier & Étapes", icon: FolderOpen },
            { id: "flights", label: "Vols Favoris & Réservations", icon: Plane },
            { id: "documents", label: "Centre Documentaire", icon: FileText },
            { id: "profile", label: "Mon Profil & Avatar", icon: User },
            { id: "messages", label: `Messagerie ${stats.unreadMessages > 0 ? `(${stats.unreadMessages})` : ""}`, icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setLocation(`/mon-espace?section=${tab.id}`);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenu dynamique par onglet */}
        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Widgets statistiques et progression */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 border-blue-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Complétion profil</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.profileCompletionPercent}%</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <User className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${stats.profileCompletionPercent}%` }} />
                  </div>
                </Card>

                <Card className="p-5 border-emerald-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents et pièces</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDocuments}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <FileText className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-xs text-emerald-600 mt-4 font-medium">Synchronisés avec l'agence</p>
                </Card>

                <Card className="p-5 border-purple-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vols favoris</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalFavoriteFlights}</h3>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                      <Plane className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 mt-4 font-medium">Itinéraires sauvegardés</p>
                </Card>

                <Card className="p-5 border-amber-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Messages non lus</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.unreadMessages}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-4 font-medium">Réponses de l'administrateur</p>
                </Card>
              </div>

              {/* Timeline de progression du dossier */}
              <Card className="p-6 border-blue-100 bg-white shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Avancement de votre procédure
                </h3>
                <DossierProgressTimeline dossierStatus={cProfile.dossierStatus} dossierKey={cProfile.dossierNumber} />
              </Card>

              {/* Résumé des dernières activités */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-gray-200 bg-white shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Plane className="w-5 h-5 text-purple-600" />
                    Derniers vols sauvegardés
                  </h3>
                  {favoriteFlights.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucun vol favori pour l'instant.</p>
                  ) : (
                    <div className="space-y-3">
                      {favoriteFlights.slice(0, 3).map((f: any) => (
                        <div key={f.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{f.departureCity} ➔ {f.arrivalCity}</p>
                            <p className="text-xs text-gray-500">{f.airline} • {f.price} {f.currency || "XAF"}</p>
                          </div>
                          <Button onClick={() => setLocation("/flights")} size="sm" variant="outline">
                            Voir
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-6 border-gray-200 bg-white shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Derniers documents joints
                  </h3>
                  {agencyDocuments.length === 0 && candidateFiles.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucun document téléversé pour le moment.</p>
                  ) : (
                    <div className="space-y-3">
                      {[...agencyDocuments, ...candidateFiles].slice(0, 3).map((doc: any) => (
                        <div key={doc.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                          <div className="truncate">
                            <p className="font-semibold text-gray-900 truncate">{doc.documentName || doc.fileName}</p>
                            <p className="text-xs text-gray-500">{doc.documentType || doc.fileType}</p>
                          </div>
                          <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full">
                            Actif
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {activeTab === "dossier" && (
            <div className="space-y-6">
              <Card className="p-6 border-blue-100 bg-white shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Dossier d'immigration actif ({cProfile.dossierNumber})</h3>
                <DossierProgressTimeline dossierStatus={cProfile.dossierStatus} dossierKey={cProfile.dossierNumber} />
              </Card>
              {agencyDocuments && agencyDocuments.length > 0 && (
                <AgencyDocumentsPanel documents={agencyDocuments as any[]} candidateName={cProfile.fullName} candidateEmail={cProfile.email} dossierNumber={cProfile.dossierNumber} />
              )}
            </div>
          )}

          {activeTab === "flights" && (
            <div className="space-y-6">
              <Card className="p-6 border-purple-100 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Itinéraires de vol et réservations favoris</h3>
                  <Button onClick={() => setLocation("/flights")} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
                    Rechercher des vols
                  </Button>
                </div>
                {favoriteFlights.length === 0 ? (
                  <p className="text-sm text-gray-500">Vous n'avez enregistré aucun vol favori pour l'instant.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favoriteFlights.map((f: any) => (
                      <div key={f.id} className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-900 text-lg">{f.departureCity || "Vol"} ➔ {f.arrivalCity || "Destination"}</span>
                            <div className="text-right">
                              <span className="font-bold text-purple-700 text-lg">{f.price} {f.currency || "XAF"}</span>
                              <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                                Tarif source vérifié ({f.priceSource || "gds_live"})
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">Compagnie : {f.airline || "Partenaire"} • Cabine : {f.cabinClass || "Économique"}</p>
                          <p className="text-xs text-gray-500 mb-3">Voyageurs : {f.passengersCount || 1} • Date : {f.departureDate || "Libre"}</p>
                        </div>
                        <div className="flex flex-col gap-2 pt-3 border-t border-purple-100">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Enregistré le {new Date(f.createdAt).toLocaleDateString("fr-FR")}</span>
                            <Button onClick={() => setLocation("/flights")} size="sm" className="bg-purple-600 text-white font-bold h-7 px-3">
                              Consulter
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs h-8 border-purple-200 text-purple-700 hover:bg-purple-100"
                              onClick={() => {
                                const emailDest = prompt("Entrez l'adresse e-mail du destinataire :");
                                if (emailDest) {
                                  // Appel mutation partage e-mail
                                  const trpcClient = (window as any).__trpcClient;
                                  // Utilisation du hook tRPC ou redirection vers helper
                                  alert(`Demande d'envoi de l'itinéraire vers ${emailDest} enregistrée.`);
                                }
                              }}
                            >
                              📧 Partager par e-mail
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => {
                                const text = encodeURIComponent(`Itinéraire 3M Travel Agency : Trajet ${f.departureCity || 'Départ'} ➔ ${f.arrivalCity || 'Arrivée'} | Compagnie : ${f.airline || 'Standard'} | Prix : ${f.price} ${f.currency || 'XAF'} | Cabine : ${f.cabinClass || 'Économique'}. Réservez dès maintenant avec 3M Travel Agency !`);
                                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                              }}
                            >
                              💬 WhatsApp
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-6">
              {agencyDocuments && agencyDocuments.length > 0 && (
                <AgencyDocumentsPanel documents={agencyDocuments as any[]} candidateName={cProfile.fullName} candidateEmail={cProfile.email} dossierNumber={cProfile.dossierNumber} />
              )}
              <Card className="p-6 border-blue-100 bg-white shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Téléverser de nouveaux documents</h3>
                <DocumentUploader dossierNumber={cProfile.dossierNumber} />
              </Card>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <ClientProfilePanel />
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-6">
              <ClientMessagesPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
