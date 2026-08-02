import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, FileText, MessageCircle, Upload, LogOut, CheckCircle,
  Clock, AlertCircle, XCircle, ChevronRight, Send, Paperclip,
  Home, Globe, Award, Trash2, Eye,
  FolderOpen, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PendingActionsCards } from "@/components/PendingActionsCards";
import { ProfileCompletionBar } from "@/components/ProfileCompletionBar";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth, getCandidateToken } from "@/hooks/useCandidateAuth";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg";

// ─── Statuts du dossier ───────────────────────────────────────────────────────
const STEP_TOOLTIPS: Record<string, { description: string; actions: string }> = {
  nouveau: { description: "Votre dossier a été créé avec succès", actions: "Attendez notre première évaluation" },
  evaluation: { description: "Notre équipe analyse votre profil", actions: "Consultez votre rapport d'évaluation" },
  documents: { description: "Documents supplémentaires requis", actions: "Téléversez les documents demandés" },
  traitement: { description: "Votre dossier est en cours de traitement", actions: "Notre équipe prépare votre dossier" },
  soumis: { description: "Votre dossier a été soumis", actions: "Attendez la décision des autorités" },
  approuve: { description: "Votre visa a été approuvé ✓", actions: "Félicitations ! Consultez les détails" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; step: number }> = {
  nouveau:     { label: "Nouveau dossier",       color: "text-gray-600",   bg: "bg-gray-100",   icon: Star,         step: 0 },
  evaluation:  { label: "Évaluation en cours",   color: "text-blue-600",   bg: "bg-blue-100",   icon: Clock,        step: 1 },
  documents:   { label: "Documents requis",      color: "text-amber-600",  bg: "bg-amber-100",  icon: AlertCircle,  step: 2 },
  traitement:  { label: "Traitement du dossier", color: "text-indigo-600", bg: "bg-indigo-100", icon: FileText,     step: 3 },
  soumis:      { label: "Dossier soumis",        color: "text-purple-600", bg: "bg-purple-100", icon: CheckCircle,  step: 4 },
  approuve:    { label: "Visa approuvé ✓",       color: "text-green-600",  bg: "bg-green-100",  icon: CheckCircle,  step: 5 },
  refuse:      { label: "Dossier refusé",        color: "text-red-600",    bg: "bg-red-100",    icon: XCircle,      step: -1 },
};

const DOSSIER_STEPS = [
  { 
    key: "nouveau", 
    label: "Dossier créé",
    description: "Votre dossier a été créé avec succès",
    actions: "Attendez notre première évaluation"
  },
  { 
    key: "evaluation", 
    label: "Evaluation",
    description: "Notre équipe analyse votre profil",
    actions: "Consultez votre rapport d'évaluation dans vos messages"
  },
  { 
    key: "documents", 
    label: "Documents",
    description: "Documents supplémentaires requis",
    actions: "Téléversez les documents demandés dans l'onglet Documents"
  },
  { 
    key: "traitement", 
    label: "Traitement",
    description: "Votre dossier est en cours de traitement",
    actions: "Notre équipe prépare votre dossier pour la soumission"
  },
  { 
    key: "soumis", 
    label: "Soumis",
    description: "Votre dossier a été soumis aux autorités",
    actions: "Attendez la décision des autorités d'immigration"
  },
  { 
    key: "approuve", 
    label: "Approuvé",
    description: "Votre visa a été approuvé ✓",
    actions: "Félicitations ! Consultez les détails dans vos messages"
  },
];

const FILE_TYPES: { value: string; label: string }[] = [
  { value: "cv",                    label: "CV / Curriculum Vitae" },
  { value: "passeport",             label: "Passeport" },
  { value: "diplome",               label: "Diplôme" },
  { value: "releve_notes",          label: "Relevé de notes" },
  { value: "photo",                 label: "Photo d'identité" },
  { value: "justificatif_domicile", label: "Justificatif de domicile" },
  { value: "extrait_naissance",     label: "Extrait de naissance" },
  { value: "casier_judiciaire",     label: "Casier judiciaire" },
  { value: "autre",                 label: "Autre document" },
];

type Tab = "overview" | "documents" | "messages" | "profile";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { candidate, logout, isAuthenticated } = useCandidateAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [messageText, setMessageText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("cv");
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Afficher la notification de bienvenue une seule fois après l'inscription
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome && candidate?.id) {
      setShowWelcomeNotification(true);
      sessionStorage.setItem("hasSeenWelcome", "true");
      // Masquer automatiquement après 8 secondes
      const timer = setTimeout(() => setShowWelcomeNotification(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [candidate?.id]);

  // Fonction pour actualiser manuellement
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === "overview") {
        await profileQuery.refetch();
      } else if (activeTab === "documents") {
        await documentsQuery.refetch();
      } else if (activeTab === "messages") {
        await messagesQuery.refetch();
      }
      toast.success("Donnees actualisees");
    } catch (err) {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Rediriger si non connecté
  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  const utils = trpc.useUtils();

  // Queries — le token est automatiquement injecté via main.tsx headers()
  const profileQuery = trpc.oauthUserDashboard.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const documentsQuery = trpc.oauthUserDashboard.listDocuments.useQuery(undefined, {
    enabled: isAuthenticated && activeTab === "documents",
    retry: false,
  });

  const messagesQuery = trpc.oauthUserDashboard.getMessages.useQuery(undefined, {
    enabled: isAuthenticated && activeTab === "messages",
    refetchInterval: false, // Desactiver le refetch automatique
    retry: false,
  });

  const pendingActionsQuery = trpc.oauthUserDashboard.getPendingActions.useQuery(undefined, {
    enabled: isAuthenticated && activeTab === "overview",
    retry: false,
  });

  const sendMessageMutation = trpc.oauthUserDashboard.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      utils.oauthUserDashboard.getMessages.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteDocMutation = trpc.oauthUserDashboard.deleteDocument.useMutation({
    onSuccess: () => {
      utils.oauthUserDashboard.listDocuments.invalidate();
      toast.success("Document supprimé.");
    },
  });

  const saveDocMutation = trpc.oauthUserDashboard.saveDocument.useMutation({
    onSuccess: () => {
      utils.oauthUserDashboard.listDocuments.invalidate();
      utils.oauthUserDashboard.getProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Scroll vers le bas dans les messages
  useEffect(() => {
    if (activeTab === "messages") {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messagesQuery.data, activeTab]);

  async function handleUpload() {
    if (!uploadFile) { toast.error("Sélectionnez un fichier."); return; }
    if (uploadFile.size > 10 * 1024 * 1024) { toast.error("Fichier trop volumineux (max 10 Mo)."); return; }

    setIsUploading(true);
    try {
      const token = getCandidateToken();
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("fileType", uploadType);

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
        fileType: uploadType as any,
        fileName: fileName || uploadFile.name,
        fileUrl,
        fileKey,
        fileSizeBytes: fileSizeBytes || uploadFile.size,
        mimeType: mimeType || uploadFile.type,
      });

      toast.success("Document uploadé avec succès !");
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  }

  function handleLogout() {
    logout();
    toast.success("Déconnexion réussie.");
    navigate("/");
  }

  const profile = profileQuery.data;
  const statusConfig = STATUS_CONFIG.nouveau; // dossierStatus removed
  const StatusIcon = statusConfig.icon;
  const currentStep = statusConfig.step;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="3M Travel" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <div className="font-black text-[#1E3A8A] text-sm leading-tight">3M Travel & Services</div>
              <div className="text-xs text-gray-400">Espace Candidat</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-600 font-medium">
              {candidate?.fullName ?? profile?.fullName}
            </span>
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
              title="Actualiser les donnees"
            >
              <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <Home className="w-5 h-5" />
            </Link>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Se deconnecter">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {[
                { id: "overview" as Tab,   icon: Globe,         label: "Mon dossier" },
                { id: "documents" as Tab,  icon: FolderOpen,    label: "Mes documents" },
                { id: "messages" as Tab,   icon: MessageCircle, label: "Messagerie" },
                { id: "profile" as Tab,    icon: User,          label: "Mon profil" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? "bg-[#1E3A8A] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                  {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </nav>

            {/* Carte contact conseiller */}
            <div className="mt-4 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-2xl p-4 text-white">
              <div className="text-xs font-bold uppercase tracking-wide text-blue-200 mb-2">Votre conseiller</div>
              <div className="font-bold text-sm">Équipe 3M Travel</div>
              <div className="text-blue-200 text-xs mt-1">Disponible 8h–18h (GMT+1)</div>
              <a
                href="https://wa.me/237698104832?text=Bonjour%2C%20je%20suis%20candidat%203M%20Travel%20et%20j%27ai%20une%20question%20sur%20mon%20dossier."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp direct
              </a>
            </div>
          </aside>

          {/* ── Contenu principal ────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* ── Onglet : Mon dossier ─────────────────────────────────────── */}
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  {/* Message d'accueil personnalisé */}
                  {(() => {
                    const hour = new Date().getHours();
                    const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
                    const name = candidate?.fullName ?? profile?.fullName ?? "";
                    const firstName = name.split(" ")[0];
                    return (
                      <>
                        {/* Notification de bienvenue personnalisée */}
                        <AnimatePresence>
                          {showWelcomeNotification && (
                            <motion.div
                              initial={{ opacity: 0, y: -20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -20, scale: 0.95 }}
                              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                              className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 shadow-lg"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                  <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"
                                  >
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                  </motion.div>
                                  <div className="flex-1 pt-0.5">
                                    <h3 className="text-lg font-black text-green-900">Bienvenue {firstName} ! 🎉</h3>
                                    <p className="text-green-700 text-sm mt-1">
                                      Votre compte a été créé avec succès. Vous êtes maintenant connecté à votre espace candidat 3M Travel & Services.
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <div className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-lg font-semibold">✓ Email vérifié</div>
                                      <div className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-lg font-semibold">✓ Profil actif</div>
                                      <div className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-lg font-semibold">✓ Prêt à commencer</div>
                                    </div>
                                    <p className="text-green-600 text-xs mt-3 font-medium">
                                      💡 Conseil : Commencez par compléter votre profil et télécharger vos documents pour accélérer le traitement de votre dossier.
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setShowWelcomeNotification(false)}
                                  className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] rounded-2xl p-5 mb-6 text-white">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                              <h1 className="text-xl font-black">{greeting}, {firstName} ! 👋</h1>
                              <p className="text-blue-200 text-sm mt-0.5">
                                Bienvenue dans votre espace candidat 3M Travel & Services
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Link href="/flights" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
                                <Globe className="w-3.5 h-3.5" /> Vols
                              </Link>
                              <Link href="/procedures" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
                                <FileText className="w-3.5 h-3.5" /> Procédures
                              </Link>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <h2 className="text-xl font-black text-gray-900 mb-6">Mon Dossier d'Immigration</h2>

                  {/* Barre de progression du profil */}
                  {profileQuery.data && (
                    <ProfileCompletionBar 
                      profile={profileQuery.data}
                      onEditClick={() => setActiveTab("profile")}
                    />
                  )}

                  {/* Actions en attente */}
                  {pendingActionsQuery.data && pendingActionsQuery.data.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions en attente</h3>
                      <PendingActionsCards 
                        actions={pendingActionsQuery.data} 
                        isLoading={pendingActionsQuery.isLoading}
                      />
                    </div>
                  )}

                  {profileQuery.isLoading ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Chargement de votre dossier...</div>
                  ) : profileQuery.error ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 rounded-2xl p-6 border-l-4 border-red-500"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-900 mb-1">Erreur de chargement</h3>
                          <p className="text-red-700 text-sm mb-3">Impossible de charger votre dossier. Veuillez actualiser la page ou vous reconnecter.</p>
                          <div className="flex gap-2">
                            <button onClick={handleRefresh} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded font-medium transition">
                              Actualiser
                            </button>
                            <button onClick={handleLogout} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium transition">
                              Se reconnecter
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {/* Barre de progression des étapes */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Progression de votre dossier</h3>
                          <span className="text-xs font-medium text-gray-500">Etape {statusConfig.step + 1}/6</span>
                        </div>
                        <div className="flex gap-2 mb-4">
                          {DOSSIER_STEPS.map((step, idx) => {
                            const isActive = false; // dossierStatus removed
                            const isCompleted = false; // dossierStatus removed
                            const tooltip = STEP_TOOLTIPS[step.key];
                            return (
                              <div key={step.key} className="flex-1 group relative">
                                <motion.div
                                  className={`flex-1 h-2 rounded-full transition-all cursor-help ${
                                    isCompleted ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-gray-200"
                                  }`}
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ delay: idx * 0.1 }}
                                />
                                {/* Infobulle */}
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  whileHover={{ opacity: 1, y: 0 }}
                                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50"
                                >
                                  <div className="bg-gray-900 text-white text-xs rounded-lg p-3 w-48 shadow-lg">
                                    <div className="font-semibold mb-1">{step.label}</div>
                                    <div className="text-gray-200 mb-2">{tooltip.description}</div>
                                    <div className="text-blue-300 text-xs italic">📍 {tooltip.actions}</div>
                                    {/* Flèche de l'infobulle */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                  </div>
                                </motion.div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          {DOSSIER_STEPS.map((step) => (
                            <span key={step.key} className="text-center flex-1">{step.label}</span>
                          ))}
                        </div>
                      </div>

                      {/* Statut actuel */}
                      <div className={`rounded-2xl p-5 mb-6 ${statusConfig.bg}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-xl ${statusConfig.bg} flex items-center justify-center border-2 border-current`}>
                            <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                          </div>
                          <div>
                            <div className={`font-black text-lg ${statusConfig.color}`}>{statusConfig.label}</div>
                            <div className="text-sm text-gray-600">
                              Votre dossier est en cours de traitement par notre équipe.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline des étapes */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h2 className="font-bold text-gray-800 mb-5">Progression de votre dossier</h2>
                        <div className="relative">
                          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 z-0" />
                          <div
                            className="absolute top-5 left-5 h-0.5 bg-[#1E3A8A] z-0 transition-all duration-1000"
                            style={{ width: `${Math.max(0, (currentStep / (DOSSIER_STEPS.length - 1)) * 100)}%` }}
                          />
                          <div className="relative z-10 flex justify-between">
                            {DOSSIER_STEPS.map((step, i) => {
                              const done = i < currentStep;
                              const active = i === currentStep;
                              return (
                                <div key={step.key} className="flex flex-col items-center gap-2">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                    done ? "bg-[#1E3A8A] border-[#1E3A8A]" :
                                    active ? "bg-white border-[#1E3A8A] shadow-lg shadow-blue-200" :
                                    "bg-white border-gray-200"
                                  }`}>
                                    {done ? (
                                      <CheckCircle className="w-5 h-5 text-white" />
                                    ) : (
                                      <span className={`text-xs font-bold ${active ? "text-[#1E3A8A]" : "text-gray-400"}`}>{i + 1}</span>
                                    )}
                                  </div>
                                  <span className={`text-xs font-medium text-center max-w-[60px] leading-tight ${active ? "text-[#1E3A8A] font-bold" : done ? "text-gray-600" : "text-gray-400"}`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Infos du dossier */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          { label: "Membre depuis", value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("fr-FR") : "—", icon: Clock },
                          { label: "Membre depuis", value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("fr-FR") : "—", icon: Clock },
                        ].map((item) => (
                          <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                              <item.icon className="w-5 h-5 text-[#1E3A8A]" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">{item.label}</div>
                              <div className="font-bold text-gray-800 text-sm">{item.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* CTA si nouveau */}
                      {false && (
                        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-amber-800">Action requise</div>
                              <div className="text-sm text-amber-700 mt-1">
                                Pour accélérer le traitement de votre dossier, uploadez vos documents (CV, passeport, diplômes) dans l'onglet <strong>Mes documents</strong>.
                              </div>
                              <button
                                onClick={() => setActiveTab("documents")}
                                className="mt-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                              >
                                <Upload className="w-4 h-4" /> Uploader mes documents
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* ── Onglet : Documents ───────────────────────────────────────── */}
              {activeTab === "documents" && (
                <motion.div key="documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  <h1 className="text-2xl font-black text-gray-900 mb-6">Mes Documents</h1>

                  {/* Zone d'upload */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-[#1E3A8A]" /> Ajouter un document
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Type de document</Label>
                        <Select value={uploadType} onValueChange={setUploadType}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FILE_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Fichier (PDF, JPG, PNG — max 10 Mo)</Label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#1E3A8A] file:text-white file:font-semibold file:cursor-pointer hover:file:bg-[#2563EB] transition-colors"
                        />
                      </div>
                    </div>
                    {uploadFile && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                        <Paperclip className="w-4 h-4 text-[#1E3A8A]" />
                        <span className="font-medium">{uploadFile.name}</span>
                        <span className="text-gray-400">({(uploadFile.size / 1024 / 1024).toFixed(2)} Mo)</span>
                      </div>
                    )}
                    <Button
                      onClick={handleUpload}
                      disabled={!uploadFile || isUploading}
                      className="mt-4 bg-[#1E3A8A] hover:bg-[#2563EB] text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
                    >
                      {isUploading ? (
                        <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Upload en cours...</span>
                      ) : (
                        <span className="flex items-center gap-2"><Upload className="w-4 h-4" />Envoyer le document</span>
                      )}
                    </Button>
                  </div>

                  {/* Liste des documents */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h2 className="font-bold text-gray-800">Documents envoyés</h2>
                    </div>
                    {documentsQuery.isLoading ? (
                      <div className="p-8 text-center text-gray-400">Chargement...</div>
                    ) : !documentsQuery.data?.length ? (
                      <div className="p-8 text-center">
                        <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">Aucun document envoyé pour l'instant.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {documentsQuery.data.map((doc) => {
                          const typeLabel = FILE_TYPES.find(t => t.value === doc.fileType)?.label ?? doc.fileType;
                          const statusColors: Record<string, string> = {
                            uploaded: "bg-blue-100 text-blue-700",
                            verified: "bg-green-100 text-green-700",
                            rejected: "bg-red-100 text-red-700",
                          };
                          return (
                            <div key={doc.id} className="px-6 py-4 flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-[#1E3A8A]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-800 text-sm truncate">{doc.fileName}</div>
                                <div className="text-xs text-gray-400">{typeLabel} · {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}</div>
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[doc.status] ?? "bg-gray-100 text-gray-600"}`}>
                                {doc.status === "uploaded" ? "Envoyé" : doc.status === "verified" ? "Vérifié" : "Refusé"}
                              </span>
                              <div className="flex items-center gap-1">
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="Voir">
                                  <Eye className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => deleteDocMutation.mutate({ fileId: doc.id })}
                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Onglet : Messagerie ──────────────────────────────────────── */}
              {activeTab === "messages" && (
                <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
                  <h1 className="text-2xl font-black text-gray-900 mb-4">Messagerie</h1>
                  <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messagesQuery.isLoading ? (
                        <div className="text-center text-gray-400 py-8">Chargement...</div>
                      ) : !messagesQuery.data?.length ? (
                        <div className="text-center py-12">
                          <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm">Aucun message pour l'instant.</p>
                        </div>
                      ) : (
                        messagesQuery.data.map((msg) => {
                          const isCandidate = msg.senderRole === "candidate";
                          return (
                            <div key={msg.id} className={`flex ${isCandidate ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                isCandidate
                                  ? "bg-[#1E3A8A] text-white rounded-br-sm"
                                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
                              }`}>
                                {!isCandidate && (
                                  <div className="text-xs font-bold text-[#1E3A8A] mb-1">Conseiller 3M Travel</div>
                                )}
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <div className={`text-xs mt-1.5 ${isCandidate ? "text-blue-200" : "text-gray-400"}`}>
                                  {new Date(msg.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Zone de saisie */}
                    <div className="border-t border-gray-100 p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Écrivez votre message..."
                          value={messageText}
                          onChange={e => setMessageText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey && messageText.trim()) {
                              e.preventDefault();
                              sendMessageMutation.mutate({ content: messageText.trim() });
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => {
                            if (messageText.trim()) sendMessageMutation.mutate({ content: messageText.trim() });
                          }}
                          disabled={!messageText.trim() || sendMessageMutation.isPending}
                          className="bg-[#1E3A8A] hover:bg-[#2563EB] text-white px-4 rounded-xl"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Appuyez sur Entrée pour envoyer · Notre équipe répond sous 24h</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Onglet : Profil ──────────────────────────────────────────── */}
              {activeTab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  <h1 className="text-2xl font-black text-gray-900 mb-6">Mon Profil</h1>
                  <ProfileEditor profile={profileQuery.data} onSaved={() => utils.candidate.getProfile.invalidate()} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Sous-composant : éditeur de profil ──────────────────────────────────────
function ProfileEditor({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    nationality: "",
    dateOfBirth: "",
    educationLevel: "",
    employmentStatus: "",
    languageLevel: "",
    destination: "autre",
    visaType: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName ?? "",
        phone: profile.phone ?? "",
        nationality: profile.nationality ?? "",
        dateOfBirth: profile.dateOfBirth ?? "",
        educationLevel: profile.educationLevel ?? "",
        employmentStatus: profile.employmentStatus ?? "",
        languageLevel: profile.languageLevel ?? "",
        destination: profile.destination ?? "autre",
        visaType: profile.visaType ?? "",
      });
    }
  }, [profile]);

  const updateMutation = trpc.oauthUserDashboard.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil mis à jour !");
      onSaved();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate(form as any);
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="grid sm:grid-cols-2 gap-5">
        {[
          { id: "fullName", label: "Nom complet", type: "text", placeholder: "Jean Dupont" },
          { id: "phone", label: "Téléphone", type: "tel", placeholder: "+237 6XX XXX XXX" },
          { id: "nationality", label: "Nationalité", type: "text", placeholder: "Camerounaise" },
          { id: "dateOfBirth", label: "Date de naissance", type: "date", placeholder: "" },
          { id: "educationLevel", label: "Niveau d'études", type: "text", placeholder: "Master, Licence..." },
          { id: "employmentStatus", label: "Situation professionnelle", type: "text", placeholder: "Salarié, Étudiant..." },
          { id: "languageLevel", label: "Niveau de langue", type: "text", placeholder: "IELTS 7.0, DELF B2..." },
          { id: "visaType", label: "Type de visa souhaité", type: "text", placeholder: "Résidence permanente..." },
        ].map((field) => (
          <div key={field.id}>
            <Label htmlFor={field.id} className="text-sm font-semibold text-gray-700">{field.label}</Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={(form as any)[field.id]}
              onChange={e => setForm(f => ({ ...f, [field.id]: e.target.value }))}
              className="mt-1"
            />
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Label className="text-sm font-semibold text-gray-700">Destination souhaitée</Label>
        <Select value={form.destination} onValueChange={v => setForm(f => ({ ...f, destination: v }))}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              { value: "canada",     label: "🇨🇦 Canada" },
              { value: "luxembourg", label: "🇱🇺 Luxembourg" },
              { value: "pologne",    label: "🇵🇱 Pologne" },
              { value: "europe",     label: "🇪🇺 Europe Schengen" },
              { value: "golfe",      label: "🇦🇪 Golfe & Moyen-Orient" },
              { value: "autre",      label: "Autre" },
            ].map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="bg-[#1E3A8A] hover:bg-[#2563EB] text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
        >
          {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder les modifications"}
        </Button>
        <span className="text-xs text-gray-400">Email : {profile?.email}</span>
      </div>
    </form>
  );
}
