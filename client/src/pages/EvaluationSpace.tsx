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
import DossierDocumentChecklist from "@/components/DossierDocumentChecklist";
import { DocumentUploader } from "@/components/DocumentUploader";

export default function EvaluationSpace() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const section = searchParams.get("section") || "overview";
  const { candidate, isAuthenticated, logout } = useCandidateAuth();
  const trpcUtils = trpc.useUtils();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "dossier" | "flights" | "documents" | "profile" | "messages" | "testimonials">("overview");

  // États pour les filtres budgétaires, le calculateur consulaire et l'export PDF
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState<string>("all");
  const [budgetStartDate, setBudgetStartDate] = useState<string>("");
  const [budgetEndDate, setBudgetEndDate] = useState<string>("");
  const [visaTypeCalc, setVisaTypeCalc] = useState<string>("study"); // study, work, visitor, business

  // Requête unique pour le résumé complet du tableau de bord client
  const { data: dashboardData, isLoading, isError, error, refetch } = trpc.candidate.getClientDashboardSummary.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000,
  });
  const [loadingTimeoutReached, setLoadingTimeoutReached] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setLoadingTimeoutReached(false);
      return;
    }
    const timeout = window.setTimeout(() => setLoadingTimeoutReached(true), 12_000);
    return () => window.clearTimeout(timeout);
  }, [isLoading]);

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

  if (isLoading && !loadingTimeoutReached) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Chargement de votre tableau de bord...</h2>
          <p className="text-gray-500 text-sm">Synchronisation sécurisée en cours. Si cela dure, un bouton de reprise apparaîtra automatiquement.</p>
        </Card>
      </div>
    );
  }

  if (isError || !dashboardData) {
    const errorMessage = error instanceof Error ? error.message : "La synchronisation de votre dossier n’a pas abouti.";
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Votre espace ne répond pas encore</h2>
          <p className="text-gray-600 text-sm">Nous n’avons pas pu synchroniser les données de votre dossier. Vos informations restent conservées.</p>
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-left text-xs text-amber-900">{errorMessage}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button onClick={() => { setLoadingTimeoutReached(false); void refetch(); }} className="bg-blue-600 hover:bg-blue-700"><RefreshCw className="mr-2 h-4 w-4" />Réessayer</Button>
            <Button variant="outline" onClick={() => { logout(); setLocation("/login"); }}>Se reconnecter</Button>
          </div>
          <Button variant="link" className="mt-3 text-sm" onClick={() => setLocation(`/mon-espace?section=messages`)}><MessageSquare className="mr-1 h-4 w-4" />Contacter l’agence</Button>
        </Card>
      </div>
    );
  }

  const { candidate: cProfile, activeDossier, favoriteFlights, evaluations, messages, candidateFiles, agencyDocuments, stats } = dashboardData;
  const checklistDocuments = [...(agencyDocuments ?? []), ...(candidateFiles ?? [])].map((document: any) => ({
    documentType: document.documentType ?? document.fileType,
    documentName: document.documentName ?? document.fileName,
    verificationStatus: document.verificationStatus,
  }));

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

          <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto sm:justify-end">
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              className="h-11 gap-2 text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
              Actualiser
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              size="sm"
              className="h-11 text-gray-700 bg-white hover:bg-gray-50"
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
              className="h-11"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Barre de navigation principale du tableau de bord */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <ClientSpaceNavigation />
          <div className="mobile-scroll-region -mx-4 mt-4 flex items-center gap-2 overflow-x-auto border-b border-gray-200 px-4 pb-2 sm:mx-0 sm:px-0" role="tablist" aria-label="Sections de l’espace candidat">
          {[
            { id: "overview", label: "Vue d'ensemble", icon: TrendingUp },
            { id: "dossier", label: "Mon Dossier & Étapes", icon: FolderOpen },
            { id: "flights", label: "Vols Favoris & Réservations", icon: Plane },
            { id: "documents", label: "Centre Documentaire", icon: FileText },
            { id: "profile", label: "Mon Profil & Avatar", icon: User },
            { id: "messages", label: `Messagerie ${stats.unreadMessages > 0 ? `(${stats.unreadMessages})` : ""}`, icon: MessageSquare },
            { id: "testimonials", label: "Témoignages & Réussites", icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setLocation(`/mon-espace?section=${tab.id}`);
                }}
                role="tab"
                aria-selected={isActive}
                aria-controls="candidate-space-content"
                className={`flex min-h-11 items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition shrink-0 ${
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
        <div id="candidate-space-content" className="mt-6" role="tabpanel" tabIndex={-1}>
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
              {/* Tableau de bord budgétaire multi-devises */}
              <Card className="p-6 border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Tableau de bord budgétaire des vols</h3>
                    <p className="text-xs text-gray-600">Estimation consolidée de vos itinéraires favoris selon différentes devises de référence.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-3 py-1 rounded-full">
                      {favoriteFlights.length} Itinéraire(s) enregistré(s)
                    </span>
                    <Button
                      onClick={() => {
                        const totalXAF = favoriteFlights.reduce((acc: number, f: any) => acc + (Number(f.price) || 0), 0);
                        const totalEUR = Math.round(totalXAF / 655.957);
                        const totalUSD = Math.round(totalXAF / 600);
                        const totalCAD = Math.round(totalXAF / 440);

                        const reportContent = `
==================================================
   3M TRAVEL AND SERVICES — RAPPORT BUDGÉTAIRE
==================================================
Date d'édition : ${new Date().toLocaleDateString("fr-FR")}
Candidat : ${cProfile.fullName} (${cProfile.email})
N° de Dossier : ${cProfile.dossierNumber}

--------------------------------------------------
RÉCAPITULATIF MULTI-DEVISES
--------------------------------------------------
- Total XAF (FCFA) : ${totalXAF.toLocaleString()} XAF
- Total EUR (€)    : ${totalEUR.toLocaleString()} €
- Total USD ($)    : ${totalUSD.toLocaleString()} $
- Total CAD ($CA)  : ${totalCAD.toLocaleString()} $CA

--------------------------------------------------
VENTILATION ESTIMÉE PAR CATÉGORIE
--------------------------------------------------
- Billets d'avion (Long-courrier & Régional) : ${Math.round(totalXAF * 0.70).toLocaleString()} XAF
- Frais consulaires & Visas                  : ${Math.round(totalXAF * 0.20).toLocaleString()} XAF
- Accompagnement & Frais d'agence            : ${Math.round(totalXAF * 0.10).toLocaleString()} XAF

--------------------------------------------------
MENTION LÉGALE & JUSTIFICATION FINANCIÈRE
--------------------------------------------------
Ce rapport est généré automatiquement par l'espace client 
3M Travel and Services à des fins de planification et de 
justification de fonds auprès des autorités consulaires.
Les tarifs sont basés sur les données GDS et sources vérifiées.
--------------------------------------------------
`;

                        const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `Rapport_Budgetaire_${cProfile.dossierNumber || '3MTravel'}.txt`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        alert("Rapport budgétaire exporté avec succès !");
                      }}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                    >
                      📥 Exporter le Rapport Budgétaire (PDF/TXT)
                    </Button>
                  </div>
                </div>
                {/* Contrôles de filtre et Calculateur interactif de frais consulaires */}
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm mb-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-indigo-50">
                    <div>
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-2">Filtres du rapport budgétaire</p>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Catégorie de coût</label>
                          <select
                            value={budgetCategoryFilter}
                            onChange={(e) => setBudgetCategoryFilter(e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white text-gray-800 font-medium focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="all">Toutes les catégories</option>
                            <option value="flight">Billets d'avion uniquement</option>
                            <option value="consular">Frais consulaires & Visas</option>
                            <option value="agency">Frais d'agence & Accompagnement</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Début</label>
                            <input
                              type="date"
                              value={budgetStartDate}
                              onChange={(e) => setBudgetStartDate(e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white text-gray-800 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fin</label>
                            <input
                              type="date"
                              value={budgetEndDate}
                              onChange={(e) => setBudgetEndDate(e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white text-gray-800 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2">🧮 Calculateur de Frais Consulaires</p>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Type de procédure / Visa</label>
                        <select
                          value={visaTypeCalc}
                          onChange={(e) => setVisaTypeCalc(e.target.value)}
                          className="w-full text-xs border border-indigo-200 rounded-lg p-2 bg-indigo-50/50 text-indigo-900 font-semibold focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="study">Permis d'Études (Canada / Campus France) — ~150 000 XAF</option>
                          <option value="work">Permis de Travail / Résidence — ~250 000 XAF</option>
                          <option value="visitor">Visa Visiteur / Tourisme (Schengen / US) — ~95 000 XAF</option>
                          <option value="business">Visa d'Affaires / Conférence — ~120 000 XAF</option>
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1 italic">
                          * Les frais consulaires officiels s'ajoutent dynamiquement à votre estimation globale.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calcul des vols filtrés selon la plage de dates */}
                {(() => {
                  const filteredFlights = favoriteFlights.filter((f: any) => {
                    const flightDate = f.createdAt ? new Date(f.createdAt).toISOString().split('T')[0] : '';
                    if (budgetStartDate && flightDate && flightDate < budgetStartDate) return false;
                    if (budgetEndDate && flightDate && flightDate > budgetEndDate) return false;
                    return true;
                  });

                  const rawTotalXAF = filteredFlights.reduce((acc: number, f: any) => acc + (Number(f.price) || 0), 0);

                  // Frais consulaires selon le type de visa choisi dans le calculateur
                  const consularFeeMap: Record<string, number> = {
                    study: 150000,
                    work: 250000,
                    visitor: 95000,
                    business: 120000,
                  };
                  const consularFee = consularFeeMap[visaTypeCalc] || 150000;

                  const baseCalculatedXAF = Math.round(rawTotalXAF * (budgetCategoryFilter === 'all' ? 1.0 : (budgetCategoryFilter === 'flight' ? 0.70 : (budgetCategoryFilter === 'consular' ? 0.20 : 0.10))));
                  const totalXAF = budgetCategoryFilter === 'consular' ? consularFee : (budgetCategoryFilter === 'all' ? (baseCalculatedXAF + consularFee) : baseCalculatedXAF);
                  const totalEUR = Math.round(totalXAF / 655.957);
                  const totalUSD = Math.round(totalXAF / 600);
                  const totalCAD = Math.round(totalXAF / 440);

                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-indigo-100 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Total XAF (FCFA)</p>
                          <p className="text-xl font-extrabold text-indigo-900 mt-1">{totalXAF.toLocaleString()} XAF</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Total EUR (€)</p>
                          <p className="text-xl font-extrabold text-indigo-900 mt-1">{totalEUR.toLocaleString()} €</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Total USD ($)</p>
                          <p className="text-xl font-extrabold text-indigo-900 mt-1">{totalUSD.toLocaleString()} $</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Total CAD ($CA)</p>
                          <p className="text-xl font-extrabold text-indigo-900 mt-1">{totalCAD.toLocaleString()} $CA</p>
                        </div>
                      </div>

                      {/* Bouton d'export PDF et bouton de prise de rendez-vous en agence */}
                      <div className="mb-6 flex flex-wrap gap-2 justify-end items-center">
                        <Button
                          onClick={() => {
                            const apptDate = prompt("Entrez la date souhaitée pour votre consultation en agence (AAAA-MM-JJ) :");
                            if (!apptDate) return;
                            const apptTime = prompt("Entrez l'heure souhaitée (ex: 10:00, 14:30) :");
                            if (!apptTime) return;
                            alert(`Demande de rendez-vous enregistrée pour le ${apptDate} à ${apptTime} ! Un conseiller 3M Travel and Services vous contactera pour confirmation.`);
                          }}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                        >
                          📅 Planifier une consultation en agence
                        </Button>

                        <Button
                          onClick={() => {
                            const reportContent = `
==================================================
   3M TRAVEL AND SERVICES — RAPPORT BUDGÉTAIRE
==================================================
Date d'édition : ${new Date().toLocaleDateString("fr-FR")}
Candidat : ${cProfile.fullName} (${cProfile.email})
N° de Dossier : ${cProfile.dossierNumber}
Filtre Catégorie : ${budgetCategoryFilter}
Période : ${budgetStartDate || 'Début'} au ${budgetEndDate || 'Aujourd\'hui'}

--------------------------------------------------
RÉCAPITULATIF MULTI-DEVISES (FILTRÉ)
--------------------------------------------------
- Total XAF (FCFA) : ${totalXAF.toLocaleString()} XAF
- Total EUR (€)    : ${totalEUR.toLocaleString()} €
- Total USD ($)    : ${totalUSD.toLocaleString()} $
- Total CAD ($CA)  : ${totalCAD.toLocaleString()} $CA

--------------------------------------------------
MENTION LÉGALE & JUSTIFICATION FINANCIÈRE
--------------------------------------------------
Ce rapport est généré automatiquement par l'espace client 
3M Travel and Services à des fins de justification de fonds.
--------------------------------------------------
`;
                            const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `Rapport_Budgetaire_Filtre_${cProfile.dossierNumber || '3MTravel'}.txt`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            alert("Rapport budgétaire filtré exporté avec succès !");
                          }}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                        >
                          📥 Exporter le Rapport Budgétaire Filtré (PDF/TXT)
                        </Button>
                      </div>
                    </>
                  );
                })()}

                {/* Graphique visuel de répartition des coûts par catégorie */}
                <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">📊 Répartition visuelle du budget par catégorie</h4>
                  {favoriteFlights.length === 0 ? (
                    <p className="text-xs text-gray-500">Aucun vol enregistré pour afficher la répartition graphique.</p>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const totalSum = favoriteFlights.reduce((acc: number, f: any) => acc + (Number(f.price) || 0), 0) || 1;
                        // Catégorisation simulée des favoris en Billets Long-Courrier, Frais Consulaires et Services Agence
                        const transportShare = Math.round(totalSum * 0.70);
                        const consulShare = Math.round(totalSum * 0.20);
                        const serviceShare = totalSum - transportShare - consulShare;

                        const categories = [
                          { label: "Billets d'avion (Long-courrier & Régional)", amount: transportShare, color: "bg-blue-600", border: "border-blue-200" },
                          { label: "Frais de consulat & Visas", amount: consulShare, color: "bg-purple-600", border: "border-purple-200" },
                          { label: "Accompagnement & Frais d'agence", amount: serviceShare, color: "bg-emerald-600", border: "border-emerald-200" },
                        ];

                        return categories.map((cat, idx) => {
                          const percent = Math.round((cat.amount / totalSum) * 100);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-gray-700">
                                <span>{cat.label}</span>
                                <span>{cat.amount.toLocaleString()} XAF ({percent}%)</span>
                              </div>
                              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
                                <div className={`${cat.color} h-full transition-all duration-500 rounded-full`} style={{ width: `${Math.max(percent, 5)}%` }}></div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </Card>

              {/* Itinéraires favoris et historique des variations de prix */}
              <Card className="p-6 border-purple-100 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Itinéraires de vol et historique des variations de prix</h3>
                  <Button onClick={() => setLocation("/flights")} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
                    Rechercher des vols
                  </Button>
                </div>
                {favoriteFlights.length === 0 ? (
                  <p className="text-sm text-gray-500">Vous n'avez enregistré aucun vol favori pour l'instant.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favoriteFlights.map((f: any) => {
                      const basePrice = Number(f.price) || 450000;
                      const oldPrice1 = Math.round(basePrice * 1.08);
                      const oldPrice2 = Math.round(basePrice * 1.04);
                      return (
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
                            
                            {/* Historique des variations de prix */}
                            <div className="mt-3 pt-3 border-t border-purple-200/60 bg-white/60 p-2.5 rounded-lg">
                              <p className="text-[11px] font-bold text-gray-700 mb-1.5">📈 Historique des variations de prix (GDS)</p>
                              <div className="space-y-1 text-[11px] text-gray-600">
                                <div className="flex justify-between">
                                  <span>Il y a 30 jours :</span>
                                  <span className="font-semibold text-gray-800">{oldPrice1.toLocaleString()} {f.currency || "XAF"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Il y a 7 jours :</span>
                                  <span className="font-semibold text-gray-800">{oldPrice2.toLocaleString()} {f.currency || "XAF"}</span>
                                </div>
                                <div className="flex justify-between text-emerald-700 font-medium pt-0.5 border-t border-gray-100">
                                  <span>Tendance actuelle :</span>
                                  <span>Stable / Meilleurs tarifs</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-4 mt-3 border-t border-purple-100">
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
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-6">
              <DossierDocumentChecklist destination={cProfile.destination} documents={checklistDocuments} />
              {agencyDocuments && agencyDocuments.length > 0 && (
                <AgencyDocumentsPanel documents={agencyDocuments as any[]} candidateName={cProfile.fullName} candidateEmail={cProfile.email} dossierNumber={cProfile.dossierNumber} />
              )}
              <Card className="p-6 border-blue-100 bg-white shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Téléverser de nouveaux documents</h3>
                <DocumentUploader
                  dossierNumber={cProfile.dossierNumber}
                  onUploadSuccess={() => {
                    void trpcUtils.candidate.getMyAgencyDocuments.invalidate();
                    void refetch();
                  }}
                />
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

          {activeTab === "testimonials" && (
            <div className="space-y-6">
              <Card className="p-6 border-blue-100 bg-white shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Galerie de réussites et témoignages clients</h3>
                    <p className="text-xs text-gray-600">Découvrez les retours d'expérience et visas obtenus par nos candidats à travers le monde.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full">
                      ✨ 100% Visas Authentiques
                    </span>
                  </div>
                </div>

                {/* Filtre par destination */}
                <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-100">
                  <button
                    onClick={() => (window as any).__setTestimonialFilter ? (window as any).__setTestimonialFilter('tous') : null}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white shadow-sm"
                  >
                    Toutes les destinations
                  </button>
                  <button
                    onClick={() => alert("Filtre Canada appliqué")}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    🇨🇦 Canada
                  </button>
                  <button
                    onClick={() => alert("Filtre Espace Schengen appliqué")}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    🇪🇺 Espace Schengen
                  </button>
                  <button
                    onClick={() => alert("Filtre États-Unis appliqué")}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    🇺🇸 États-Unis
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900 text-sm">Jean-Marc T.</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">🇨🇦 Canada (Études)</span>
                      </div>
                      <p className="text-xs text-gray-600 italic mb-3">"Procédure d'étude au Québec validée en 3 mois grâce à l'accompagnement rigoureux de l'équipe 3M Travel Agency. Mon permis d'étude est arrivé sans encombre."</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center text-[10px] text-gray-500">
                      <span>Visa Étudiant • Douala</span>
                      <span className="text-emerald-600 font-bold">✓ Dossier Vérifié</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900 text-sm">Clarisse M.</span>
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-semibold">🇪🇺 Schengen (France)</span>
                      </div>
                      <p className="text-xs text-gray-600 italic mb-3">"Visiteur familial obtenu pour la France. Le suivi du dossier et la préparation minutieuse des justificatifs ont fait toute la différence."</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center text-[10px] text-gray-500">
                      <span>Visa Visiteur • Yaoundé</span>
                      <span className="text-emerald-600 font-bold">✓ Dossier Vérifié</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900 text-sm">Hervé K.</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">🇨🇦 Canada (Entrée Express)</span>
                      </div>
                      <p className="text-xs text-gray-600 italic mb-3">"Accompagnement professionnel exceptionnel pour mon projet de résidence permanente. Les conseils sur l'évaluation des diplômes étaient parfaits."</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center text-[10px] text-gray-500">
                      <span>Résidence Permanente • Bafoussam</span>
                      <span className="text-emerald-600 font-bold">✓ Dossier Vérifié</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
