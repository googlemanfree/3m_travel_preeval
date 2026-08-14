/**
 * Dashboard Administrateur — 3M Travel & Services
 * Gestion unifiée des candidats (dossiers en ligne + dossiers agence)
 */
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  Users,
  Clock,
  FileCheck,
  Send,
  CheckCircle,
  Globe,
  Building2,
  Mail,
  Phone,
  Plane,
  MapPin,
  Calendar,
  Star,
  AlertCircle,
  LogOut,
  Download,
  BarChart3,
  Sparkles,
  FileText,
  Upload,
  ExternalLink,
  ImagePlus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocation } from "wouter";
import { AdminPaymentManagement } from "@/components/AdminPaymentManagement";
import { AdminDocumentsManagement } from "@/components/AdminDocumentsManagement";
import AdminEmailDeliveryManagement from "@/components/AdminEmailDeliveryManagement";
import AdminNotificationBell from "@/components/AdminNotificationBell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAdminSyncTime } from "@shared/adminSync";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminStatus = "PENDING_48H" | "PUBLISHED" | "DOCUMENTS_CHECK" | "SUBMITTED" | "APPROVED";
type CandidateSource = "WEB" | "AGENCY_PHYSICAL";

interface Candidate {
  id: string;
  internalId: number;
  folderCode: string;
  fullName: string;
  email: string;
  whatsapp: string;
  city: string;
  destinationCountry: string;
  projectType: string;
  status: string;
  internalStatus: string;
  source: CandidateSource;
  scoringTotal: number | null;
  scoringBadge: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AdminStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  PENDING_48H: {
    label: "Évaluation 48h",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  PUBLISHED: {
    label: "Bilan Disponible",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: <FileCheck className="w-3 h-3" />,
  },
  DOCUMENTS_CHECK: {
    label: "Collecte Documents",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
    icon: <Send className="w-3 h-3" />,
  },
  SUBMITTED: {
    label: "Soumission Consulaire",
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
    icon: <Globe className="w-3 h-3" />,
  },
  APPROVED: {
    label: "Visa Accordé",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: <CheckCircle className="w-3 h-3" />,
  },
};

const SOURCE_CONFIG: Record<CandidateSource, { label: string; color: string; icon: React.ReactNode }> = {
  WEB: {
    label: "En ligne",
    color: "text-sky-700 bg-sky-50 border-sky-200",
    icon: <Globe className="w-3 h-3" />,
  },
  AGENCY_PHYSICAL: {
    label: "Agence",
    color: "text-orange-700 bg-orange-50 border-orange-200",
    icon: <Building2 className="w-3 h-3" />,
  },
};

const SCORING_BADGE_CONFIG: Record<string, { label: string; color: string }> = {
  eligible: { label: "Éligible", color: "text-green-700 bg-green-50 border-green-200" },
  admissible: { label: "Admissible", color: "text-blue-700 bg-blue-50 border-blue-200" },
  faible: { label: "Faible", color: "text-red-700 bg-red-50 border-red-200" },
};

const DESTINATION_OPTIONS = [
  "Canada", "France", "Belgique", "Suisse", "Allemagne", "Royaume-Uni",
  "États-Unis", "Portugal", "Espagne", "Italie", "Pays-Bas", "Maroc",
  "Sénégal", "Côte d'Ivoire", "Autre",
];

const PROJECT_TYPE_OPTIONS = [
  "Visa Étudiant", "Visa Travail", "Visa Tourisme", "Visa Famille",
  "Résidence Permanente", "Visa Affaires", "Autre",
];

// ─── Composant Badge Statut ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as AdminStatus];
  if (!config) return <Badge variant="outline">{status}</Badge>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const config = SOURCE_CONFIG[source as CandidateSource];
  if (!config) return <Badge variant="outline">{source}</Badge>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Modale : Fiche Candidat ──────────────────────────────────────────────────

function CandidateDetailModal({
  candidateId,
  onClose,
  onStatusUpdated,
}: {
  candidateId: string;
  onClose: () => void;
  onStatusUpdated: () => void;
}) {
  const { toast } = useToast();
  const [notifyClient, setNotifyClient] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<AdminStatus | "">("");
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || "" : "";

  const { data, isLoading } = trpc.admin.getCandidateDetails.useQuery(
    { sessionToken, candidateId },
    { enabled: !!candidateId && !!sessionToken }
  );

  const updateStatusMutation = trpc.admin.updateCandidateStatus.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Statut mis à jour",
        description: result.message + (result.notificationSent ? " — Client notifié par email." : ""),
      });
      onStatusUpdated();
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedStatus) return;
    updateStatusMutation.mutate({
      sessionToken,
      candidateId,
      newStatus: selectedStatus as AdminStatus,
      notifyClient,
    });
  };

  const candidate = data?.candidate;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <Users className="w-5 h-5" />
            Fiche Candidat
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : candidate ? (
          <div className="space-y-5">
            {/* En-tête candidat avec avatar et actions */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-4">
                {candidate.avatarUrl ? (
                  <img
                    src={candidate.avatarUrl}
                    alt={candidate.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    {candidate.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-blue-900">{candidate.fullName}</h3>
                  <p className="text-sm text-blue-600 font-mono font-semibold">{candidate.folderCode}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {candidate.whatsapp && (
                      <a
                        href={`https://wa.me/${candidate.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-green-600 text-white text-xs px-2.5 py-1 rounded-md hover:bg-green-700 transition"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    <a
                      href={`mailto:${candidate.email}`}
                      className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs px-2.5 py-1 rounded-md hover:bg-blue-700 transition"
                    >
                      ✉️ Email
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge status={candidate.status} />
                <SourceBadge source={candidate.source} />
              </div>
            </div>

            {/* Informations de contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800 break-all">{candidate.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">WhatsApp</p>
                  <p className="text-sm font-medium text-gray-800">{candidate.whatsapp || "Non renseigné"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Ville</p>
                  <p className="text-sm font-medium text-gray-800">{candidate.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Globe className="w-4 h-4 text-gray-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Destination</p>
                  <p className="text-sm font-medium text-gray-800">{candidate.destinationCountry}</p>
                </div>
              </div>
            </div>

            {/* Projet */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Type de projet</p>
              <p className="text-sm font-medium text-gray-800">{candidate.projectType}</p>
            </div>

            {/* Score (si disponible) */}
            {candidate.scoringTotal !== null && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">Score d'éligibilité</span>
                  </div>
                  <span className="text-2xl font-bold text-green-700">{candidate.scoringTotal}/100</span>
                </div>
                {candidate.scoringBadge && SCORING_BADGE_CONFIG[candidate.scoringBadge] && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SCORING_BADGE_CONFIG[candidate.scoringBadge].color}`}>
                    {SCORING_BADGE_CONFIG[candidate.scoringBadge].label}
                  </span>
                )}
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, candidate.scoringTotal)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Date de création */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Créé le {new Date(candidate.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>

            {/* Mise à jour du statut */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Mettre à jour le statut</h4>
              <div className="space-y-3">
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as AdminStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un nouveau statut..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyClient}
                    onChange={(e) => setNotifyClient(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Notifier le client par email</span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            Candidat introuvable
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          {selectedStatus && (
            <Button
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {updateStatusMutation.isPending ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Mise à jour...</>
              ) : (
                "Confirmer le statut"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modale : Saisir un dossier agence ────────────────────────────────────────

function ImportAgencyModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    city: "Yaoundé",
    destinationCountry: "",
    projectType: "",
    initialStatus: "DOCUMENTS_CHECK" as AdminStatus,
  });

  const importMutation = trpc.admin.importAgencyDossier.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Dossier créé",
        description: `${result.message} — Un email de bienvenue a été envoyé.`,
      });
      onImported();
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.whatsapp || !form.destinationCountry || !form.projectType) {
      toast({ title: "Champs requis", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }
    importMutation.mutate({ sessionToken: typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || "" : "", ...form });
  };

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <Building2 className="w-5 h-5" />
            Saisir un dossier agence
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                placeholder="Ex: Jean-Pierre Mbarga"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="candidat@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp / Téléphone *</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => setField("whatsapp", e.target.value)}
                placeholder="+237 6XX XXX XXX"
                required
              />
            </div>

            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="Yaoundé"
              />
            </div>

            <div>
              <Label htmlFor="destination">Pays de destination *</Label>
              <Select value={form.destinationCountry} onValueChange={(v) => setField("destinationCountry", v)}>
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Choisir un pays..." />
                </SelectTrigger>
                <SelectContent>
                  {DESTINATION_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="projectType">Type de projet *</Label>
              <Select value={form.projectType} onValueChange={(v) => setField("projectType", v)}>
                <SelectTrigger id="projectType">
                  <SelectValue placeholder="Choisir un type..." />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="initialStatus">Statut initial</Label>
              <Select value={form.initialStatus} onValueChange={(v) => setField("initialStatus", v)}>
                <SelectTrigger id="initialStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button
              type="submit"
              disabled={importMutation.isPending}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {importMutation.isPending ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Création...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />Créer le dossier</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const adminName = typeof window !== "undefined" ? localStorage.getItem("adminName") || "Admin" : "Admin";
  const sessionToken = typeof window !== "undefined"
    ? sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || ""
    : "";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const { toast } = useToast();
  const trpcUtils = trpc.useUtils();

  const addRagDocMutation = trpc.admin.addDestinationDocumentAdmin.useMutation({
    onSuccess: () => {
      toast({ title: "Guide PDF ajouté", description: "Le guide a été indexé et ajouté avec succès dans la base RAG d'Aureol." });
      trpcUtils.admin.listDestinationDocumentsAdmin.invalidate();
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message || "Impossible d'ajouter le guide.", variant: "destructive" });
    }
  });

  const { data: destinationDocs, refetch: refetchRagDocs } = trpc.admin.listDestinationDocumentsAdmin.useQuery(
    { sessionToken },
    { enabled: !!sessionToken }
  );

  // Admin auth géré en haut du composant

  // Générer les initiales pour l'avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const { data, isLoading, refetch } = trpc.admin.listCandidates.useQuery(
    { sessionToken, search: search || undefined, status: statusFilter !== "ALL" ? statusFilter : undefined },
    { enabled: !!sessionToken }
  );

  const { data: countryDistribution, isLoading: isLoadingCountryDistribution, refetch: refetchCountryDistribution } = trpc.admin.getCandidateCountryDistribution.useQuery(
    { sessionToken, limit: 12 },
    { enabled: !!sessionToken }
  );

  const { data: faqSatisfaction, isLoading: isLoadingFaqSatisfaction, refetch: refetchFaqSatisfaction } = trpc.admin.getFaqSatisfactionStats.useQuery(
    { sessionToken },
    { enabled: !!sessionToken }
  );

  useEffect(() => {
    if (!isLoading && !isLoadingCountryDistribution && !isLoadingFaqSatisfaction && (data || countryDistribution || faqSatisfaction) && !lastSyncedAt) {
      setLastSyncedAt(new Date());
    }
  }, [data, countryDistribution, faqSatisfaction, isLoading, isLoadingCountryDistribution, isLoadingFaqSatisfaction, lastSyncedAt]);

  const exportActivityMutation = trpc.admin.exportActivityReportCsv.useMutation({
    onSuccess: (result) => {
      const blob = new Blob([result.content], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Rapport exporté", description: `${result.rowCount} activité(s) exportée(s) en CSV.` });
    },
    onError: (error) => {
      toast({ title: "Export impossible", description: error.message, variant: "destructive" });
    },
  });

  const [aiSuggestions, setAiSuggestions] = useState<Array<{ question: string; frequency: number; suggestedAnswer: string }>>([]);
  const generateAiSuggestionsMutation = trpc.aiCopilot.generateAiFrequentAnswers.useMutation({
    onSuccess: (res) => {
      setAiSuggestions(res.suggestions || []);
      toast({
        title: "Suggestions IA générées",
        description: `${res.suggestions?.length || 0} suggestion(s) prête(s) pour vos questions fréquentes.`,
      });
    },
    onError: (err) => {
      toast({
        title: "Génération IA impossible",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resetAllPasswordsMutation = trpc.adminAuth.resetAllPasswords.useMutation({
    onSuccess: (result) => {
      toast({ title: "Réinitialisation envoyée", description: result.message });
      sessionStorage.removeItem("adminSessionToken");
      localStorage.removeItem("adminSessionToken");
      navigate("/admin/login");
    },
    onError: (error) => {
      toast({ title: "Réinitialisation impossible", description: error.message, variant: "destructive" });
    },
  });

  const handleResetAllPasswords = () => {
    if (!sessionToken) {
      toast({ title: "Session administrateur absente", description: "Reconnectez-vous avant de lancer la réinitialisation.", variant: "destructive" });
      return;
    }
    if (!window.confirm("Réinitialiser les mots de passe de tous les administrateurs ? Chaque compte recevra un mot de passe temporaire par e-mail et devra le changer à la prochaine connexion.")) return;
    resetAllPasswordsMutation.mutate({ sessionToken });
  };

  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => {
      sessionStorage.removeItem("adminSessionToken");
      localStorage.removeItem("adminSessionToken");
      localStorage.removeItem("adminType");
      localStorage.removeItem("adminName");
      toast({ title: "Déconnexion réussie" });
      navigate("/admin/login");
    },
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), refetchCountryDistribution(), refetchFaqSatisfaction()]);
      const syncedAt = new Date();
      setLastSyncedAt(syncedAt);
      toast({
        title: "Synchronisation terminée",
        description: `Données mises à jour à ${syncedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`,
      });
    } catch (error) {
      toast({
        title: "Synchronisation impossible",
        description: error instanceof Error ? error.message : "Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, refetchCountryDistribution, refetchFaqSatisfaction, toast]);

  const candidates = data?.candidates || [];
  const total = data?.total || 0;

  // Statistiques rapides
  const stats = {
    total,
    pending: candidates.filter((c) => c.status === "PENDING_48H").length,
    published: candidates.filter((c) => c.status === "PUBLISHED").length,
    documents: candidates.filter((c) => c.status === "DOCUMENTS_CHECK").length,
    submitted: candidates.filter((c) => c.status === "SUBMITTED").length,
    approved: candidates.filter((c) => c.status === "APPROVED").length,
    web: candidates.filter((c) => c.source === "WEB").length,
    agency: candidates.filter((c) => c.source === "AGENCY_PHYSICAL").length,
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 transition-colors duration-300 dark:bg-[#071426] dark:text-slate-100">
      {/* En-tête fixe */}
      <div className="glass-admin-header bg-gradient-to-r from-blue-900/95 to-blue-950/95 text-white fixed top-0 left-0 right-0 z-50 shadow-lg backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold">Tableau de bord Admin</h1>
              <p className="text-blue-200 text-sm">Bienvenue, {adminName} — 3M Travel & Services</p>
            </div>
            
            {/* Barre de recherche rapide */}
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Chercher un dossier ou utilisateur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-300 rounded-lg focus:bg-white/15 focus:border-white/40 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading || isLoadingCountryDistribution}
                className="gap-1.5 border-white/30 text-white hover:bg-white/10"
                aria-label="Actualiser manuellement les données du dashboard"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading || isLoadingCountryDistribution ? "animate-spin" : ""}`} />
                {isRefreshing ? "Synchronisation..." : "Actualiser"}
              </Button>
              <span className="text-xs text-blue-100/90" aria-live="polite">
                {lastSyncedAt
                  ? `Dernière synchronisation : ${formatAdminSyncTime(lastSyncedAt)}`
                  : formatAdminSyncTime(null)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/destination-media")}
                className="gap-1.5 border-white/30 text-white hover:bg-white/10"
              >
                <ImagePlus className="w-4 h-4" /> Visuels destinations
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportActivityMutation.mutate({ sessionToken })}
              disabled={exportActivityMutation.isPending || !sessionToken}
              className="gap-1.5 border-white/30 text-white hover:bg-white/10"
              title="Télécharger le rapport d’activité admin au format CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Rapport CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAllPasswords}
              disabled={resetAllPasswordsMutation.isPending || !sessionToken}
              className="gap-1.5 border-amber-300/70 text-amber-100 hover:bg-amber-400/20"
              title="Envoyer un mot de passe temporaire par e-mail à chaque administrateur"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden md:inline">Réinitialiser par e-mail</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setShowImportModal(true)}
              className="bg-white text-blue-900 hover:bg-blue-50 gap-1.5 font-semibold"
            >
              <Plus className="w-4 h-4" />
              Saisir dossier agence
            </Button>
            
            {/* Notifications */}
            <AdminNotificationBell />
            
            {/* Profil Admin */}
            <div className="flex items-center gap-2 pl-3 border-l border-white/20">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold rounded-full flex items-center justify-center shadow-md shadow-orange-900/30 text-sm">
                {getInitials(adminName)}
              </div>
              <div className="hidden sm:flex flex-col">
                <p className="text-sm font-semibold text-white leading-tight">{adminName}</p>
                <p className="text-xs text-blue-200">Admin</p>
              </div>
            </div>
            
            <Button
              size="sm"
              onClick={() => logoutMutation.mutate({ sessionToken })}
              disabled={logoutMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-[0.97] text-white gap-1.5 font-semibold shadow-lg shadow-red-900/40 transition-all duration-150 border-0 flex items-center"
              title="Déconnecter votre session admin"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{logoutMutation.isPending ? "Déconnexion..." : "Déconnexion"}</span>
              <span className="sm:hidden">{logoutMutation.isPending ? "..." : "Sortir"}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 mt-32">
        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: stats.total, icon: <Users className="w-4 h-4" />, color: "text-gray-700 bg-gray-100" },
            { label: "Éval. 48h", value: stats.pending, icon: <Clock className="w-4 h-4" />, color: "text-amber-700 bg-amber-100" },
            { label: "Bilan dispo", value: stats.published, icon: <FileCheck className="w-4 h-4" />, color: "text-blue-700 bg-blue-100" },
            { label: "Documents", value: stats.documents, icon: <Send className="w-4 h-4" />, color: "text-purple-700 bg-purple-100" },
            { label: "Soumis", value: stats.submitted, icon: <Globe className="w-4 h-4" />, color: "text-indigo-700 bg-indigo-100" },
            { label: "Visa accordé", value: stats.approved, icon: <CheckCircle className="w-4 h-4" />, color: "text-green-700 bg-green-100" },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sources */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <strong>{stats.web}</strong> dossiers en ligne
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-orange-500" />
            <strong>{stats.agency}</strong> dossiers agence
          </span>
        </div>

        {/* Widget : répartition des candidats par pays */}
        <Card className="border-0 shadow-sm overflow-hidden hover:-translate-y-0.5">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-600" />
                  <h2 className="font-semibold text-gray-900">Répartition des candidats par pays</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Vue consolidée des candidats issus des dossiers, évaluations et demandes agence.
                </p>
              </div>
              {countryDistribution && (
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-violet-700">{countryDistribution.totalCandidates}</p>
                  <p className="text-xs text-gray-500">candidats suivis</p>
                </div>
              )}
            </div>
            {isLoadingCountryDistribution ? (
              <div className="h-56 flex items-center justify-center text-sm text-gray-500">
                <RefreshCw className="w-5 h-5 mr-2 animate-spin text-violet-600" />
                Chargement des statistiques...
              </div>
            ) : countryDistribution?.data?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={countryDistribution.data} layout="vertical" margin={{ top: 4, right: 20, left: 12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="country" type="category" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [`${value} candidat(s)`, "Répartition"]} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[0, 5, 5, 0]} name="Candidats" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-gray-500 border border-dashed rounded-lg">
                Aucune destination renseignée pour le moment.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Onglets : Dossiers, Paiements, Documents, Paramètres Vols */}
        <Tabs defaultValue="candidates" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="candidates">Dossiers</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="emails">E-mails</TabsTrigger>
            <TabsTrigger value="flights">Paramètres Vols</TabsTrigger>
            <TabsTrigger value="faq">Satisfaction FAQ</TabsTrigger>
            <TabsTrigger value="rag">Guides & RAG (107 PDF)</TabsTrigger>
          </TabsList>

          <TabsContent value="rag" className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Gestion Documentaire RAG (107 Destinations)
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Téléchargez et mettez à jour les guides PDF officiels de chaque pays pour enrichir instantanément les connaissances d’Aureol.
                  </p>
                </div>
              </div>

              {/* Formulaire d'ajout rapide de guide */}
              <div className="p-4 bg-slate-50 rounded-xl border mb-6 space-y-4">
                <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" /> Ajouter / Mettre à jour un guide PDF pays
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Titre (ex: Guide Visa Canada 2026)"
                    id="rag-doc-title"
                    className="px-3 py-2 text-sm rounded-lg border bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Pays (ex: Canada)"
                    id="rag-doc-country"
                    className="px-3 py-2 text-sm rounded-lg border bg-white"
                  />
                  <select id="rag-doc-category" className="px-3 py-2 text-sm rounded-lg border bg-white">
                    <option value="Travail">Travail / Emploi</option>
                    <option value="Études">Études / Campus</option>
                    <option value="Visiteur">Visiteur / Tourisme</option>
                    <option value="Immigration">Immigration permanente</option>
                  </select>
                  <input
                    type="url"
                    placeholder="URL publique du PDF (Stockage ou S3)"
                    id="rag-doc-url"
                    className="px-3 py-2 text-sm rounded-lg border bg-white"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      const title = (document.getElementById("rag-doc-title") as HTMLInputElement)?.value;
                      const country = (document.getElementById("rag-doc-country") as HTMLInputElement)?.value;
                      const category = (document.getElementById("rag-doc-category") as HTMLSelectElement)?.value;
                      const fileUrl = (document.getElementById("rag-doc-url") as HTMLInputElement)?.value;
                      if (!title || !country || !fileUrl) {
                        alert("Veuillez renseigner le titre, le pays et l'URL du fichier PDF.");
                        return;
                      }
                      addRagDocMutation.mutate({
                        sessionToken,
                        title,
                        country,
                        category,
                        fileUrl,
                        fileKey: fileUrl,
                      });
                    }}
                    disabled={addRagDocMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2"
                  >
                    <Upload className={`w-3.5 h-3.5 ${addRagDocMutation.isPending ? "animate-spin" : ""}`} />
                    {addRagDocMutation.isPending ? "Indexation en cours..." : "Enregistrer et indexer pour Aureol"}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-sm text-gray-800">Guides PDF actuellement indexés dans le RAG</h4>
                {destinationDocs && destinationDocs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                    {destinationDocs.map((doc) => (
                      <div key={doc.id} className="p-3 bg-white border rounded-xl shadow-sm flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {doc.country} • {doc.category}
                          </span>
                          <p className="text-sm font-semibold text-gray-900 truncate mt-1">{doc.title}</p>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                            <ExternalLink className="w-3 h-3" /> Voir le PDF officiel
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm border border-dashed rounded-xl bg-white">
                    📚 107 guides pays indexés par défaut dans le moteur RAG d’Aureol.
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Statistiques de Satisfaction de la FAQ
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Analyse des votes « Utile / Non utile » exprimés par les visiteurs sur les réponses de la FAQ d'accueil.
                  </p>
                </div>
                {faqSatisfaction?.stats && (
                  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border">
                    <div className="text-center px-3 border-r">
                      <p className="text-2xl font-black text-blue-600">{faqSatisfaction.stats.satisfactionRate}%</p>
                      <p className="text-xs text-gray-500">Taux de satisfaction</p>
                    </div>
                    <div className="text-center px-3 border-r">
                      <p className="text-xl font-bold text-emerald-600">{faqSatisfaction.stats.totalHelpful}</p>
                      <p className="text-xs text-gray-500">Utiles</p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-xl font-bold text-rose-600">{faqSatisfaction.stats.totalNotHelpful}</p>
                      <p className="text-xs text-gray-500">Non utiles</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-blue-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                    Assistant IA — Suggestions de réponses officielles
                  </h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Générez automatiquement par IA des réponses optimisées pour les questions les plus fréquentes posées par vos candidats.
                  </p>
                </div>
                <Button
                  onClick={() => generateAiSuggestionsMutation.mutate({ sessionToken })}
                  disabled={generateAiSuggestionsMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm shrink-0"
                >
                  <Sparkles className={`w-4 h-4 ${generateAiSuggestionsMutation.isPending ? "animate-spin" : ""}`} />
                  {generateAiSuggestionsMutation.isPending ? "Génération en cours..." : "Générer les suggestions IA"}
                </Button>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="mb-8 p-5 bg-white rounded-xl border shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Suggestions générées par l’IA pour vos questions fréquentes
                    </h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAiSuggestions([])}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Masquer
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiSuggestions.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                              Posée {item.frequency} fois
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">« {item.question} »</p>
                          <p className="text-xs text-gray-600 mt-2 bg-white p-3 rounded-lg border border-slate-200/80 italic">
                            {item.suggestedAnswer}
                          </p>
                        </div>
                        <div className="pt-2 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1.5"
                            onClick={() => {
                              navigator.clipboard.writeText(item.suggestedAnswer);
                              toast({ title: "Copié !", description: "La suggestion a été copiée dans le presse-papier." });
                            }}
                          >
                            <Download className="w-3 h-3" />
                            Copier la réponse
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isLoadingFaqSatisfaction ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-500">
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                  Chargement des statistiques FAQ...
                </div>
              ) : faqSatisfaction?.stats?.questionsBreakdown && faqSatisfaction.stats.questionsBreakdown.length > 0 ? (
                <div className="space-y-8">
                  <div className="h-72">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Répartition des votes par question</p>
                    <ResponsiveContainer width="100%\" height="100%">
                      <BarChart data={faqSatisfaction.stats.questionsBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="questionKey" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" interval={0} />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(val: number, name: string) => [val, name === "helpful" ? "Utile" : "Non utile"]} />
                        <Bar dataKey="helpful" fill="#10b981" name="Utile" stackId="a" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="notHelpful" fill="#f43f5e" name="Non utile" stackId="a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Détail par sujet de FAQ</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase">
                            <th className="text-left px-4 py-2.5">Sujet / Clé FAQ</th>
                            <th className="text-center px-4 py-2.5">Votes Utiles</th>
                            <th className="text-center px-4 py-2.5">Votes Non utiles</th>
                            <th className="text-center px-4 py-2.5">Total votes</th>
                            <th className="text-right px-4 py-2.5">Satisfaction</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {faqSatisfaction.stats.questionsBreakdown.map((item) => (
                            <tr key={item.questionKey} className="hover:bg-gray-50/60">
                              <td className="px-4 py-3 font-medium text-gray-900">{item.questionKey}</td>
                              <td className="px-4 py-3 text-center text-emerald-600 font-semibold">{item.helpful}</td>
                              <td className="px-4 py-3 text-center text-rose-600 font-semibold">{item.notHelpful}</td>
                              <td className="px-4 py-3 text-center text-gray-700">{item.total}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${item.satisfactionRate >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {item.satisfactionRate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-sm text-gray-500 border border-dashed rounded-xl">
                  <Star className="w-8 h-8 text-gray-300 mb-2" />
                  <p>Aucun vote FAQ enregistré pour le moment.</p>
                  <p className="text-xs text-gray-400 mt-1">Les votes exprimés par les visiteurs sur l'accueil s'afficheront ici en temps réel.</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="flights" className="space-y-6">
            <SearchApiMonitoring />
            <Card className="border-0 shadow-sm hover:-translate-y-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" />
                Configuration de la Commission Agence sur les Vols
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Définissez le pourcentage de commission appliqué automatiquement sur les prix des billets d'avion affichés aux clients.
              </p>
              <FlightCommissionSettings />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <a href="/admin/flight-requests" className="flex h-12 items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Ouvrir la file des demandes de vols
                </a>
                <a href="/admin/super-dashboard" className="flex h-12 items-center justify-center rounded-xl bg-violet-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
                  Pilotage global administrateur
                </a>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            {/* Filtres & Recherche */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, n° dossier, destination..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tableau */}
        <Card className="admin-glass-table border-0 overflow-hidden hover:-translate-y-0.5" aria-busy={isLoading}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200/70">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">N° Dossier</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Candidat</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">Destination</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden lg:table-cell">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden xl:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/70">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="admin-table-skeleton h-4 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>Aucun candidat trouvé</p>
                      {(search || statusFilter !== "ALL") && (
                        <p className="text-xs mt-1">Essayez de modifier vos filtres</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  candidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedCandidateId(candidate.id)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {candidate.folderCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800 truncate max-w-[160px]">{candidate.fullName}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[160px]">{candidate.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-700 text-xs">{candidate.destinationCountry}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <SourceBadge source={candidate.source} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={candidate.status} />
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {candidate.scoringTotal !== null ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  (candidate.scoringTotal ?? 0) >= 80 ? "bg-green-500" :
                                  (candidate.scoringTotal ?? 0) >= 60 ? "bg-blue-500" : "bg-red-400"
                                }`}
                                style={{ width: `${Math.min(100, candidate.scoringTotal ?? 0)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{candidate.scoringTotal}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs text-gray-500">
                          {new Date(candidate.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-blue-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidateId(candidate.id);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {candidates.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200/70 bg-white/30 text-xs text-gray-500 dark:bg-slate-900/20">
              {candidates.length} candidat{candidates.length > 1 ? "s" : ""} affiché{candidates.length > 1 ? "s" : ""}
              {total !== candidates.length && ` sur ${total} au total`}
            </div>
          )}
        </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <AdminPaymentManagement />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <AdminDocumentsManagement />
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <AdminEmailDeliveryManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modales */}
      {selectedCandidateId && (
        <CandidateDetailModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
          onStatusUpdated={handleRefresh}
        />
      )}

      {showImportModal && (
        <ImportAgencyModal
          onClose={() => setShowImportModal(false)}
          onImported={handleRefresh}
        />
      )}
    </div>
  );
}

function FlightCommissionSettings() {
  const { data, refetch } = trpc.flights.getCommission.useQuery();
  const [commission, setCommission] = useState<number>(8);
  const { toast } = useToast();

  useEffect(() => {
    if (data?.commissionPercent !== undefined) {
      setCommission(data.commissionPercent);
    }
  }, [data]);

  const updateMutation = trpc.flights.updateCommission.useMutation({
    onSuccess: () => {
      toast({ title: "Commission mise à jour", description: `Le taux de commission est désormais de ${commission}%` });
      refetch();
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const sessionToken = localStorage.getItem("adminSessionToken");
    if (!sessionToken) {
      toast({ title: "Session administrateur requise", description: "Reconnectez-vous avant de modifier la commission.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      sessionToken,
      commissionPercent: Number(commission),
    });
  };

  return (
    <form onSubmit={handleSave} className="max-w-md space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Taux de commission agence (%)</label>
        <div className="flex gap-3">
          <Input
            type="number"
            min="0"
            max="50"
            step="0.5"
            value={commission}
            onChange={(e) => setCommission(Number(e.target.value))}
            className="font-bold text-lg"
          />
          <Button type="submit" disabled={updateMutation.isPending} className="bg-[#1E3A8A] text-white font-bold px-6">
            {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Cette commission est automatiquement incluse dans les grilles tarifaires de vols présentées aux candidats et sur les récapitulatifs e-mail.
      </p>
    </form>
  );
}

function SearchApiMonitoring() {
  const { toast } = useToast();
  const sessionToken = localStorage.getItem("adminSessionToken");
  const { data: status, isLoading, refetch } = trpc.flights.getSearchApiStatus.useQuery(
    { sessionToken: sessionToken || "missing" },
    { enabled: Boolean(sessionToken), refetchOnWindowFocus: false }
  );
  const clearCacheMutation = trpc.flights.clearSearchApiCache.useMutation({
    onSuccess: () => {
      toast({ title: "Cache vidé", description: "La prochaine recherche sollicitera SearchAPI si le quota le permet." });
      refetch();
    },
    onError: (err) => toast({ title: "Action non effectuée", description: err.message, variant: "destructive" }),
  });

  const statusPresentation = {
    live: { label: "Connecté — données en direct", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    live_no_results: { label: "Connecté — aucun résultat", className: "bg-sky-50 text-sky-700 border-sky-200" },
    quota_limited: { label: "Quota quotidien atteint", className: "bg-amber-50 text-amber-700 border-amber-200" },
    not_configured: { label: "Clé non configurée", className: "bg-rose-50 text-rose-700 border-rose-200" },
    error: { label: "Incident API à vérifier", className: "bg-rose-50 text-rose-700 border-rose-200" },
    simulation: { label: "Mode simulation", className: "bg-amber-50 text-amber-700 border-amber-200" },
  } as const;
  const state = status ? statusPresentation[status.apiStatus] ?? statusPresentation.error : null;

  const copySecretName = async () => {
    try {
      await navigator.clipboard.writeText("SEARCHAPI_KEY");
      toast({ title: "Nom de variable copié", description: "Ouvrez Paramètres > Secrets dans l’interface de gestion et remplacez la valeur de SEARCHAPI_KEY." });
    } catch {
      toast({ title: "Mise à jour sécurisée", description: "Ouvrez Paramètres > Secrets dans l’interface de gestion puis remplacez SEARCHAPI_KEY." });
    }
  };

  return (
    <Card className="border border-blue-100 bg-gradient-to-br from-white via-blue-50/60 to-slate-50 shadow-sm p-5 md:p-6 glass-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Plane className="w-5 h-5 text-[#1E3A8A]" /> Supervision SearchAPI / Google Flights
          </h3>
          <p className="mt-1 text-sm text-slate-600">Suivez la disponibilité de la source tarifaire sans exposer la clé secrète.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading || !sessionToken} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> Actualiser
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => clearCacheMutation.mutate({ sessionToken: sessionToken || "missing" })} disabled={clearCacheMutation.isPending || !sessionToken} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Vider le cache
          </Button>
        </div>
      </div>

      {!sessionToken ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> Votre session admin est absente ou expirée. Reconnectez-vous pour consulter l’état de l’API.
        </div>
      ) : isLoading ? (
        <div className="mt-5 h-24 rounded-xl bg-slate-100 animate-pulse" />
      ) : status && state ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">État fournisseur</p>
            <Badge className={`mt-2 border ${state.className}`}>{state.label}</Badge>
            <p className="mt-2 text-xs text-slate-500">Clé serveur : {status.keyConfigured ? "configurée" : "absente"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cache recherches</p>
            <p className="mt-1 text-2xl font-black text-[#1E3A8A]">{status.hitRate}%</p>
            <p className="text-xs text-slate-500">{status.hits} hits · {status.misses} requêtes API · {status.entries} entrées</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conservation</p>
            <p className="mt-1 text-2xl font-black text-[#1E3A8A]">{Math.round(status.ttlSeconds / 60)} min</p>
            <p className="text-xs text-slate-500">Dernier résultat live : {status.lastLiveResultAt ? new Date(status.lastLiveResultAt).toLocaleString("fr-FR") : "aucun"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dernier incident</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{status.lastError || "Aucun incident"}</p>
            <p className="text-xs text-slate-500">{status.lastErrorAt ? new Date(status.lastErrorAt).toLocaleString("fr-FR") : ""}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 md:flex-row md:items-center md:justify-between">
        <p><strong>Mettre à jour la clé :</strong> utilisez les <strong>Paramètres &gt; Secrets</strong> du projet. La valeur n’est jamais affichée ni enregistrée dans le navigateur.</p>
        <Button type="button" size="sm" variant="outline" onClick={copySecretName} className="shrink-0 border-blue-200 text-[#1E3A8A]">
          Copier SEARCHAPI_KEY
        </Button>
      </div>
    </Card>
  );
}
