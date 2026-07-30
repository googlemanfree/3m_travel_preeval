/**
 * Dashboard Administrateur — 3M Travel & Services
 * Gestion unifiée des candidats (dossiers en ligne + dossiers agence)
 */
import { useState, useCallback } from "react";
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
  MapPin,
  Calendar,
  Star,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { useLocation } from "wouter";

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

  const { data, isLoading } = trpc.admin.getCandidateDetails.useQuery(
    { candidateId },
    { enabled: !!candidateId }
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
            {/* En-tête candidat */}
            <div className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div>
                <h3 className="text-lg font-bold text-blue-900">{candidate.fullName}</h3>
                <p className="text-sm text-blue-600 font-mono">{candidate.folderCode}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
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
    importMutation.mutate(form);
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { toast } = useToast();

  const adminName = typeof window !== "undefined" ? localStorage.getItem("adminName") || "Admin" : "Admin";
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || "" : "";

  const { data, isLoading, refetch } = trpc.admin.listCandidates.useQuery(
    { search: search || undefined, status: statusFilter !== "ALL" ? statusFilter : undefined },
    { enabled: true }
  );

  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("adminSessionToken");
      localStorage.removeItem("adminType");
      localStorage.removeItem("adminName");
      toast({ title: "Déconnexion réussie" });
      navigate("/admin/login");
    },
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold">Tableau de bord Admin</h1>
              <p className="text-blue-200 text-sm">Bienvenue, {adminName} — 3M Travel & Services</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="gap-1.5 border-white/30 text-white hover:bg-white/10"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
              <Button
                size="sm"
                onClick={() => setShowImportModal(true)}
                className="bg-white text-blue-900 hover:bg-blue-50 gap-1.5 font-semibold"
              >
                <Plus className="w-4 h-4" />
                Saisir dossier agence
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => logoutMutation.mutate({ sessionToken })}
                className="text-white hover:bg-white/10 gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
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
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
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
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
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
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
              {candidates.length} candidat{candidates.length > 1 ? "s" : ""} affiché{candidates.length > 1 ? "s" : ""}
              {total !== candidates.length && ` sur ${total} au total`}
            </div>
          )}
        </Card>
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
