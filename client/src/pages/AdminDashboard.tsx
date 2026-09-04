/**
 * Dashboard Administrateur — 3M Travel & Services
 * Gestion unifiée des candidats (dossiers en ligne + dossiers agence)
 */
import React, { lazy, Suspense, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";

function AdminNavGroup({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/90 p-2.5 shadow-[0_10px_28px_-24px_rgba(7,27,61,0.65)]"><p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{title}</p><TabsList className="flex h-auto w-full flex-wrap gap-1 bg-slate-100/90 p-1">{children}</TabsList></section>;
}
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
  UserPlus,
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
  ShieldAlert,
  MessageSquare,
  Filter,
  ArrowDownUp,
  Timer,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocation } from "wouter";
import { AdminPaymentManagement } from "@/components/AdminPaymentManagement";
import { AdminReservationPayments } from "@/components/AdminReservationPayments";
import { AdminDocumentsManagement } from "@/components/AdminDocumentsManagement";
import AdminEmailDeliveryManagement from "@/components/AdminEmailDeliveryManagement";
import AdminNotificationBell from "@/components/AdminNotificationBell";
import AdminAuditLogPanel from "@/components/AdminAuditLogPanel";
import AdminCandidateActivationPanel from "@/components/AdminCandidateActivationPanel";
import AdminPreDossierAccountsPanel from "@/components/AdminPreDossierAccountsPanel";
import { AdminTourismRequests } from "@/components/AdminTourismRequests";
import { AdminConsularRegistry } from "@/components/AdminConsularRegistry";
import { AdminDestinationAnalytics } from "@/components/AdminDestinationAnalytics";
import { AdminCurrencyRates } from "@/components/AdminCurrencyRates";
import { AdminPassportCorrectionHistory } from "@/components/AdminPassportCorrectionHistory";
import { AdminEvisaCatalogueManager } from "@/components/AdminEvisaCatalogueManager";
import { AdminRouteHealthManager } from "@/components/AdminRouteHealthManager";
import { AdminSystemStatus } from "@/components/AdminSystemStatus";
import { AdminSimulatorHealth } from "@/components/AdminSimulatorHealth";
import { AdminFooterEngagement } from "@/components/AdminFooterEngagement";
import { AdminPlacementPipeline } from "@/components/AdminPlacementPipeline";
import { AdminOperationsControlCenter } from "@/components/AdminOperationsControlCenter";
import { AdminCandidateKanban, type KanbanCandidate } from "@/components/AdminCandidateKanban";
import { AdminCalendarView } from "@/components/AdminCalendarView";
import { UnifiedRequestInbox } from "@/components/UnifiedRequestInbox";
import { Candidate360Workspace } from "@/components/Candidate360Workspace";
import FlightAgentDashboard from "@/pages/FlightAgentDashboard";
import { AdvisorEvaluationReviewQueue } from "@/components/AdvisorEvaluationReviewQueue";
import { BilanReminderDashboard } from "@/components/BilanReminderDashboard";
import { EvaluationDeclarationBadge } from "@/components/EvaluationDeclarationBadge";
import { AdminPreDossierEvaluationPanel } from "@/components/AdminPreDossierEvaluationPanel";
import type { EvaluationDeclarationStatus } from "@shared/evaluationDeclaration";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAdminSyncTime } from "@shared/adminSync";

const EvaluationDeliveryEditor = lazy(() => import("@/components/EvaluationDeliveryEditor").then(({ EvaluationDeliveryEditor: Editor }) => ({ default: Editor })));

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminStatus = "PENDING_48H" | "PUBLISHED" | "DOCUMENTS_CHECK" | "SUBMITTED" | "APPROVED";
type CandidateSource = "WEB" | "AGENCY_PHYSICAL" | "ACCOUNT_ONLY";
type CandidateActivationStatus = "active" | "pending" | "expired" | "failed" | "not_registered";

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
  activationStatus: CandidateActivationStatus;
  evaluationDeclarationStatus?: EvaluationDeclarationStatus;
  evaluationDeclaredAt?: Date | string | null;
  evaluationReviewedAt?: Date | string | null;
  evaluationReviewedBy?: string | null;
  evaluationReviewNote?: string | null;
  adminAssignedTo?: string | null;
  lastStatusUpdateAt?: Date | string | null;
  evaluationScheduledAt?: Date | string | null;
  dueAt?: Date | string | null;
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

const ADMIN_STATUS_SEQUENCE: AdminStatus[] = ["PENDING_48H", "PUBLISHED", "DOCUMENTS_CHECK", "SUBMITTED", "APPROVED"];

function getNextAdminStatus(status?: string): AdminStatus | null {
  const currentIndex = ADMIN_STATUS_SEQUENCE.indexOf(status as AdminStatus);
  if (currentIndex < 0) return "PENDING_48H";
  return ADMIN_STATUS_SEQUENCE[currentIndex + 1] ?? null;
}

function getPreviousAdminStatus(status?: string): AdminStatus | null {
  const currentIndex = ADMIN_STATUS_SEQUENCE.indexOf(status as AdminStatus);
  if (currentIndex <= 0) return null;
  return ADMIN_STATUS_SEQUENCE[currentIndex - 1];
}

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
  ACCOUNT_ONLY: {
    label: "Compte créé",
    color: "text-violet-700 bg-violet-50 border-violet-200",
    icon: <UserPlus className="w-3 h-3" />,
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

const ADMIN_GLOBAL_SEARCH_ITEMS = [
  { label: "Dossiers candidats", hint: "Rechercher et traiter les dossiers", tab: "candidates" },
  { label: "Pré-dossiers", hint: "Activer les comptes et valider les évaluations", tab: "pre-dossiers" },
  { label: "Demandes unifiées", hint: "Centraliser les demandes entrantes", tab: "inbox" },
  { label: "Bilans à valider", hint: "Revoir les évaluations déclarées", tab: "evaluation-review" },
  { label: "Documents", hint: "Vérifier les pièces déposées", tab: "documents" },
  { label: "Paiements", hint: "Contrôler les paiements en attente", tab: "payments" },
  { label: "Réservations vols", hint: "Traiter la file des demandes de vol", tab: "flights" },
  { label: "E-mails", hint: "Suivre les remises et relances", tab: "emails" },
  { label: "Journal d’audit", hint: "Consulter les actions tracées", tab: "audit" },
  { label: "État système", hint: "Vérifier les services et connexions", tab: "system-status" },
  { label: "Liens et routes", hint: "Contrôler les liens publics", tab: "route-health" },
  { label: "Visuels destinations", hint: "Gérer les médias des destinations", path: "/admin/destination-media" },
] as const;

type ManualPriorityDeadline = {
  label: string;
  detail: string;
  tone: "rose" | "amber" | "emerald" | "slate";
};

function getManualPriorityDeadline(
  items: Array<{ createdAt?: Date | string | null }>,
  targetHours: number,
): ManualPriorityDeadline {
  const oldestCreatedAt = items
    .map((item) => item.createdAt ? new Date(item.createdAt).getTime() : Number.NaN)
    .filter(Number.isFinite)
    .sort((a, b) => a - b)[0];

  if (!oldestCreatedAt) {
    return { label: "Aucun élément", detail: "Aucune échéance à suivre.", tone: "slate" };
  }

  const remainingMs = oldestCreatedAt + targetHours * 60 * 60 * 1000 - Date.now();
  const dueAt = new Date(oldestCreatedAt + targetHours * 60 * 60 * 1000);
  const dueLabel = dueAt.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  if (remainingMs <= 0) {
    return { label: "Échéance dépassée", detail: `Cible de revue : ${targetHours} h · depuis le ${dueLabel}.`, tone: "rose" };
  }
  if (remainingMs <= 12 * 60 * 60 * 1000) {
    return { label: "À traiter bientôt", detail: `Cible de revue : ${targetHours} h · avant le ${dueLabel}.`, tone: "amber" };
  }
  return { label: "Dans le délai cible", detail: `Cible de revue : ${targetHours} h · avant le ${dueLabel}.`, tone: "emerald" };
}

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

const ACTIVATION_STATUS_CONFIG: Record<CandidateActivationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: "Activé", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle className="w-3 h-3" /> },
  pending: { label: "En attente", color: "text-amber-700 bg-amber-50 border-amber-200", icon: <Clock className="w-3 h-3" /> },
  expired: { label: "Lien expiré", color: "text-orange-700 bg-orange-50 border-orange-200", icon: <AlertCircle className="w-3 h-3" /> },
  failed: { label: "Échec d’envoi", color: "text-red-700 bg-red-50 border-red-200", icon: <ShieldAlert className="w-3 h-3" /> },
  not_registered: { label: "Non inscrit", color: "text-slate-600 bg-slate-50 border-slate-200", icon: <Mail className="w-3 h-3" /> },
};

function ActivationBadge({ status }: { status?: string }) {
  const config = ACTIVATION_STATUS_CONFIG[status as CandidateActivationStatus] ?? ACTIVATION_STATUS_CONFIG.not_registered;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Modale : Fiche Candidat ──────────────────────────────────────────────────

export function CandidateDetailModal({
  candidateId,
  onClose,
  onStatusUpdated,
  onOpenOperations,
  openEvaluationEditor = false,
}: {
  candidateId: string;
  onClose: () => void;
  onStatusUpdated: () => void;
  onOpenOperations: (area: "payments" | "documents" | "emails", folderCode: string) => void;
  openEvaluationEditor?: boolean;
}) {
  const { toast } = useToast();
  const [notifyClient, setNotifyClient] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<AdminStatus | "">("");
  const [preDossierDestination, setPreDossierDestination] = useState("");
  const [preDossierVisaType, setPreDossierVisaType] = useState("");
  const [preDossierNotes, setPreDossierNotes] = useState("");
  const [preDossierConfirmationOpen, setPreDossierConfirmationOpen] = useState(false);
  const [evaluationEditorOpen, setEvaluationEditorOpen] = useState(false);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [rollbackReason, setRollbackReason] = useState("");
  const sessionToken = typeof window !== "undefined"
    ? localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken") || ""
    : "";

  const { data, isLoading, error, refetch } = trpc.admin.getCandidateDetails.useQuery(
    { sessionToken, candidateId },
    { enabled: !!candidateId && !!sessionToken }
  );
  const candidate = data?.candidate;
  const nextAdminStatus = getNextAdminStatus(candidate?.status);
  const previousAdminStatus = getPreviousAdminStatus(candidate?.status);
  const isPreDossierAccount = candidate?.source === "ACCOUNT_ONLY";
  const evaluationBlocksActivation = isPreDossierAccount
    && candidate?.evaluationDeclarationStatus !== "not_declared"
    && candidate?.evaluationDeclarationStatus !== "validated";
  const evaluationEditorSourceType = candidate?.source === "ACCOUNT_ONLY" ? "candidate" : candidate?.folderCode?.startsWith("EVAL-AG-") || candidate?.source === "AGENCY_PHYSICAL" ? "agency" : "application";

  useEffect(() => {
    if (candidate && openEvaluationEditor) setEvaluationEditorOpen(true);
  }, [candidate, openEvaluationEditor]);

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

  const revertStatusMutation = trpc.admin.revertCandidateStatus.useMutation({
    onSuccess: (result) => {
      setRollbackDialogOpen(false);
      setRollbackReason("");
      toast({ title: "Dernière validation annulée", description: `Le dossier revient à l’étape « ${result.previousStatusLabel} »${result.notificationSent ? " et le client a été notifié." : "."}` });
      void refetch();
      onStatusUpdated();
    },
    onError: (err) => toast({ title: "Annulation impossible", description: err.message, variant: "destructive" }),
  });

  const activatePreDossierMutation = trpc.adminCandidateManagement.activatePreDossierAccount.useMutation({
    onSuccess: (result) => {
      setPreDossierConfirmationOpen(false);
      toast({ title: "Dossier activé", description: result.emailSent ? "Le dossier est actif dans l’espace client et la confirmation a été envoyée." : "Le dossier est actif dans l’espace client ; la confirmation e-mail devra être relancée." });
      onStatusUpdated();
      onClose();
    },
    onError: (err) => toast({ title: "Activation impossible", description: err.message, variant: "destructive" }),
  });
  const isPreDossierActivationDisabled = !preDossierDestination.trim()
    || !preDossierVisaType.trim()
    || evaluationBlocksActivation
    || activatePreDossierMutation.isPending;
  const preDossierActivationGuidance = activatePreDossierMutation.isPending
    ? "Activation en cours : veuillez patienter."
    : evaluationBlocksActivation
      ? "Validez l’évaluation déclarée ou demandez un complément avant d’ouvrir le dossier."
      : !preDossierDestination.trim() || !preDossierVisaType.trim()
        ? "Renseignez la destination confirmée et la procédure pour activer ce bouton."
        : "Les informations requises sont complètes. Une confirmation sera demandée avant l’activation.";

  const reviewEvaluationMutation = trpc.adminCandidateManagement.reviewEvaluationDeclaration.useMutation({
    onSuccess: (result) => {
      toast({ title: result.status === "validated" ? "Évaluation validée" : "Décision enregistrée", description: "La décision est tracée et le suivi candidat a été synchronisé." });
      void refetch();
      onStatusUpdated();
    },
    onError: (err) => toast({ title: "Décision impossible", description: err.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!isPreDossierAccount || !candidate) return;
    setPreDossierDestination(candidate.destinationCountry === "Non spécifiée" ? "" : candidate.destinationCountry);
    setPreDossierVisaType(candidate.projectType === "À qualifier" ? "" : candidate.projectType);
    setPreDossierNotes("");
  }, [candidate?.id, candidate?.destinationCountry, candidate?.projectType, isPreDossierAccount]);

  const handleStatusUpdate = () => {
    if (!selectedStatus) return;
    updateStatusMutation.mutate({
      sessionToken,
      candidateId,
      newStatus: selectedStatus as AdminStatus,
      notifyClient,
    });
  };

  const handleAdvanceToNextStep = () => {
    if (!nextAdminStatus) return;
    updateStatusMutation.mutate({ sessionToken, candidateId, newStatus: nextAdminStatus, notifyClient });
  };

  return (
    <>
      <Dialog open={!evaluationEditorOpen} onOpenChange={onClose}>
      <DialogContent className="h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] !max-w-none overflow-y-auto rounded-2xl border-0 bg-slate-50 p-0 shadow-2xl sm:h-[calc(100vh-2rem)] sm:w-[calc(100vw-2rem)] sm:!max-w-none">
        <DialogHeader className="sticky top-0 z-20 border-b border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-7">
          <DialogTitle className="flex items-center gap-2 text-lg text-blue-950 sm:text-xl">
            <Users className="h-5 w-5" />
            Poste de pilotage dossier 360°
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-500">Gérez l’intégralité du dossier : procédure, évaluation, documents, paiements, échanges et historique.</p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : candidate ? (
          <div className="mx-auto grid max-w-[1920px] gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:p-7">
            <div className="min-w-0 space-y-5">
            {/* En-tête candidat avec avatar et actions */}
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
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

            {isPreDossierAccount ? (
              <>
                <AdminPreDossierEvaluationPanel
                  status={candidate.evaluationDeclarationStatus}
                  declaredAt={candidate.evaluationDeclaredAt}
                  reviewedAt={candidate.evaluationReviewedAt}
                  reviewedBy={candidate.evaluationReviewedBy}
                  reviewNote={candidate.evaluationReviewNote}
                  isReviewing={reviewEvaluationMutation.isPending}
                  onReview={(decision, note) => reviewEvaluationMutation.mutate({ sessionToken, candidateId: candidate.internalId, decision, note })}
                  onOpenEditor={() => setEvaluationEditorOpen(true)}
                />
                <section className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm" aria-label="Actions de traitement du compte pré-dossier">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Action de traitement requise</p>
                      <h4 className="mt-1 text-lg font-bold text-slate-950">Ouvrir et activer le dossier client</h4>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Ce compte est encore pré-dossier : choisissez la destination et la procédure confirmées en agence. L’ouverture crée un dossier traçable, active le suivi client et conserve la note interne.</p>
                      {evaluationBlocksActivation && <p className="mt-2 text-sm font-medium text-amber-800">Validez d’abord l’évaluation déclarée ou demandez un complément avant d’ouvrir le dossier.</p>}
                    </div>
                    <Badge className="w-fit bg-amber-100 text-amber-800">Pré-dossier</Badge>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div><Label htmlFor="predossier-destination-modal">Destination confirmée</Label><Input id="predossier-destination-modal" className="mt-2" value={preDossierDestination} onChange={(event) => setPreDossierDestination(event.target.value)} placeholder="Ex. Canada" /></div>
                    <div><Label htmlFor="predossier-procedure-modal">Procédure</Label><Input id="predossier-procedure-modal" className="mt-2" value={preDossierVisaType} onChange={(event) => setPreDossierVisaType(event.target.value)} placeholder="Ex. Études, travail, tourisme" /></div>
                  </div>
                  <div className="mt-4"><Label htmlFor="predossier-notes-modal">Note interne</Label><textarea id="predossier-notes-modal" value={preDossierNotes} onChange={(event) => setPreDossierNotes(event.target.value)} placeholder="Pièces déposées, suite attendue, décision de l’agence…" className="mt-2 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" /></div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"><Button onClick={() => setPreDossierConfirmationOpen(true)} disabled={isPreDossierActivationDisabled} aria-describedby="predossier-activation-guidance" className="bg-blue-700 hover:bg-blue-800"><FileCheck className="mr-2 h-4 w-4" />Ouvrir le dossier et activer le suivi</Button><p id="predossier-activation-guidance" role="status" aria-live="polite" className="text-xs text-slate-500">{preDossierActivationGuidance}</p></div>
                </section>
              </>
            ) : (
              <Candidate360Workspace
                sessionToken={sessionToken}
                candidate={candidate as any}
                onRefresh={() => {
                  void refetch();
                  onStatusUpdated();
                }}
              />
            )}

            </div>

            <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Coordonnées & dossier</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-700"><Mail className="h-4 w-4 text-blue-700" /><span className="break-all">{candidate.email}</span></div>
                  <div className="flex items-center gap-2 text-sm text-slate-700"><Phone className="h-4 w-4 text-blue-700" /><span>{candidate.whatsapp || "Téléphone non renseigné"}</span></div>
                  <div className="flex items-center gap-2 text-sm text-slate-700"><MapPin className="h-4 w-4 text-blue-700" /><span>{candidate.city || "Ville non renseignée"}</span></div>
                  <div className="flex items-center gap-2 text-sm text-slate-700"><Globe className="h-4 w-4 text-blue-700" /><span>{candidate.destinationCountry || "Destination à préciser"}</span></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {candidate.whatsapp && <a href={`https://wa.me/${candidate.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"><MessageSquare className="h-4 w-4" />WhatsApp</a>}
                  <a href={`mailto:${candidate.email}`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800"><Mail className="h-4 w-4" />E-mail</a>
                </div>
              </section>

              {!isPreDossierAccount && <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Décision de procédure</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{candidate.projectType || "Procédure à qualifier"}</p>
                <div className="mt-4 space-y-3 border-t border-blue-100 pt-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Validation manuelle guidée</p>
                    {nextAdminStatus ? (
                      <Button type="button" onClick={handleAdvanceToNextStep} disabled={updateStatusMutation.isPending} className="mt-2 w-full bg-emerald-700 hover:bg-emerald-800">
                        <CheckCircle className="mr-2 h-4 w-4" />Valider l’étape suivante : {STATUS_CONFIG[nextAdminStatus].label}
                      </Button>
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-emerald-900">Toutes les étapes prévues sont validées.</p>
                    )}
                    {previousAdminStatus && (
                      <Button type="button" variant="outline" onClick={() => setRollbackDialogOpen(true)} disabled={revertStatusMutation.isPending} className="mt-2 w-full border-red-300 text-red-700 hover:bg-red-50">
                        <X className="mr-2 h-4 w-4" />Annuler la dernière validation
                      </Button>
                    )}
                    <p className="mt-2 text-xs leading-5 text-emerald-900">Le serveur vérifie l’évaluation, le protocole, le paiement et l’ordre des étapes avant toute progression.</p>
                  </div>
                  <Label htmlFor="candidate-status">Statut général</Label>
                  <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as AdminStatus)}>
                    <SelectTrigger id="candidate-status" className="bg-white"><SelectValue placeholder="Choisir un statut…" /></SelectTrigger>
                    <SelectContent>{Object.entries(STATUS_CONFIG).map(([key, cfg]) => <SelectItem key={key} value={key}>{cfg.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={notifyClient} onChange={(e) => setNotifyClient(e.target.checked)} className="mt-0.5 rounded border-slate-300 text-blue-700" />
                    <span>Notifier le candidat par e-mail après la mise à jour.</span>
                  </label>
                  <p id="candidate-status-guidance" role="status" aria-live="polite" className="text-xs text-slate-500">{updateStatusMutation.isPending ? "Mise à jour du statut en cours." : selectedStatus ? "Le statut est prêt à être enregistré." : "Choisissez un statut pour activer l’enregistrement."}</p>
                  <Button onClick={handleStatusUpdate} disabled={!selectedStatus || updateStatusMutation.isPending} aria-describedby="candidate-status-guidance" className="w-full bg-blue-700 hover:bg-blue-800">
                    {updateStatusMutation.isPending ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Mise à jour…</> : "Enregistrer la décision"}
                  </Button>
                </div>
              </section>}

              {!isPreDossierAccount && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Centres de traitement</p>
                <p className="mt-2 text-sm text-slate-600">Ouvrez le module spécialisé pour traiter les éléments liés à ce dossier.</p>
                <div className="mt-4 grid gap-2">
                  <Button variant="outline" className="justify-start" onClick={() => onOpenOperations("documents", candidate.folderCode)}><FileCheck className="mr-2 h-4 w-4 text-violet-700" />Contrôler les documents</Button>
                  <Button className="justify-start bg-amber-600 text-white hover:bg-amber-700" onClick={() => onOpenOperations("payments", candidate.folderCode)}><BarChart3 className="mr-2 h-4 w-4" />Valider le paiement en agence</Button>
                  <Button variant="outline" className="justify-start" onClick={() => onOpenOperations("emails", candidate.folderCode)}><Mail className="mr-2 h-4 w-4 text-blue-700" />Suivre les envois e-mail</Button>
                </div>
              </section>}

              {candidate.scoringTotal !== null && <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Score d’évaluation</p><p className="mt-1 text-3xl font-black text-emerald-800">{candidate.scoringTotal}<span className="text-base font-semibold">/100</span></p><div className="mt-3 h-2 rounded-full bg-emerald-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, candidate.scoringTotal)}%` }} /></div></section>}
            </aside>

          </div>
        ) : (
          <div className="py-12 text-center text-gray-600">
            <AlertCircle className="mx-auto mb-3 h-6 w-6 text-amber-600" />
            <p className="font-medium">Impossible de charger cette fiche candidat</p>
            <p className="mt-1 text-sm text-gray-500">{error?.message || "La fiche est peut-être en cours de synchronisation. Actualisez puis réessayez."}</p>
            <Button className="mt-4" variant="outline" onClick={() => void refetch()}>Réessayer</Button>
          </div>
        )}

        <DialogFooter className="sticky bottom-0 z-20 border-t border-slate-200 bg-white px-5 py-3 sm:px-7">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <p className="hidden text-xs text-slate-500 md:block">Toutes les actions sont journalisées dans l’historique du dossier.</p>
        </DialogFooter>
        <AlertDialog open={preDossierConfirmationOpen} onOpenChange={setPreDossierConfirmationOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer l’ouverture du dossier ?</AlertDialogTitle>
              <AlertDialogDescription>Le compte de {candidate?.fullName} deviendra un dossier actif pour {preDossierDestination || "la destination choisie"}. Le client pourra suivre son dossier et recevra une confirmation lorsque l’envoi e-mail est disponible.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={activatePreDossierMutation.isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction disabled={activatePreDossierMutation.isPending || !candidate?.internalId} onClick={(event) => { event.preventDefault(); if (candidate?.internalId) activatePreDossierMutation.mutate({ sessionToken, candidateId: candidate.internalId, destination: preDossierDestination.trim(), visaType: preDossierVisaType.trim(), adminNotes: preDossierNotes.trim() || undefined }); }}>{activatePreDossierMutation.isPending ? "Activation…" : "Confirmer l’activation"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler la dernière validation ?</AlertDialogTitle>
              <AlertDialogDescription>Le dossier reviendra uniquement à l’étape précédente. L’historique, le paiement et les documents ne seront pas supprimés.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="rollback-reason">Motif obligatoire</Label>
              <textarea id="rollback-reason" value={rollbackReason} onChange={(event) => setRollbackReason(event.target.value)} minLength={5} maxLength={1000} className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500" placeholder="Expliquez l’erreur à corriger…" />
              <p className="text-xs text-slate-500">Le motif sera enregistré dans le journal d’audit et pourra être communiqué au candidat.</p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={revertStatusMutation.isPending}>Conserver la validation</AlertDialogCancel>
              <AlertDialogAction className="bg-red-700 hover:bg-red-800" disabled={rollbackReason.trim().length < 5 || revertStatusMutation.isPending} onClick={(event) => { event.preventDefault(); revertStatusMutation.mutate({ sessionToken, candidateId, reason: rollbackReason.trim(), notifyClient }); }}>{revertStatusMutation.isPending ? "Annulation…" : "Confirmer l’annulation"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
      </Dialog>
      {candidate && (isPreDossierAccount || openEvaluationEditor) && (
        <Suspense fallback={<div role="status" className="fixed inset-x-4 bottom-4 z-[100] rounded-xl border border-blue-200 bg-white p-4 text-sm text-blue-950 shadow-xl sm:inset-x-auto sm:right-6 sm:w-[360px]">Chargement de l’espace de préparation du bilan…</div>}>
          <EvaluationDeliveryEditor
            sessionToken={sessionToken}
            sourceRecordId={candidate.internalId}
            sourceType={evaluationEditorSourceType}
            open={evaluationEditorOpen}
            onOpenChange={setEvaluationEditorOpen}
            onCompleted={() => { void refetch(); onStatusUpdated(); }}
          />
        </Suspense>
      )}
    </>
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
    dateOfBirth: "",
    nationality: "",
    destinationCountry: "",
    projectType: "",
    documentsReceived: "",
    initialPaymentStatus: "unknown" as "unknown" | "pending" | "paid",
    assignedToAdmin: "",
    depositDate: new Date().toISOString().slice(0, 10),
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
    importMutation.mutate({ sessionToken: typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken") || "" : "", ...form });
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
              <Input id="city" value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="Yaoundé" />
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date de naissance</Label>
              <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => setField("dateOfBirth", e.target.value)} />
            </div>

            <div>
              <Label htmlFor="nationality">Nationalité</Label>
              <Input id="nationality" value={form.nationality} onChange={(e) => setField("nationality", e.target.value)} placeholder="Camerounaise" />
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
              <Label htmlFor="documentsReceived">Documents déjà remis</Label>
              <textarea id="documentsReceived" value={form.documentsReceived} onChange={(e) => setField("documentsReceived", e.target.value)} placeholder="Ex. CV, passeport, diplôme" className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
            </div>

            <div>
              <Label htmlFor="initialPaymentStatus">Statut de paiement initial</Label>
              <Select value={form.initialPaymentStatus} onValueChange={(v) => setField("initialPaymentStatus", v)}>
                <SelectTrigger id="initialPaymentStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Non renseigné</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payé en agence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedToAdmin">Conseiller référent (email)</Label>
              <Input id="assignedToAdmin" type="email" value={form.assignedToAdmin} onChange={(e) => setField("assignedToAdmin", e.target.value)} placeholder="conseiller@3mtravelagency.com" />
            </div>

            <div>
              <Label htmlFor="depositDate">Date de dépôt</Label>
              <Input id="depositDate" type="date" value={form.depositDate} onChange={(e) => setField("depositDate", e.target.value)} required />
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
    ? localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken") || ""
    : "";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activationFilter, setActivationFilter] = useState<CandidateActivationStatus | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<CandidateSource | "ALL">("ALL");
  const [destinationFilter, setDestinationFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"priority" | "recent" | "oldest" | "name" | "score_desc">("priority");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [openEvaluationEditor, setOpenEvaluationEditor] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState("candidates");
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [advisorDeadlinePriorityFilter, setAdvisorDeadlinePriorityFilter] = useState<"all" | "low" | "normal" | "high" | "urgent">("all");
  const { toast } = useToast();
  const trpcUtils = trpc.useUtils();
  const updateKanbanStatusMutation = trpc.admin.updateCandidateStatus.useMutation({
    onSuccess: (result) => {
      toast({ title: "Dossier déplacé", description: result.message + (result.notificationSent ? " — Client notifié par e-mail." : "") });
      void refetch();
    },
    onError: (error) => toast({ title: "Déplacement impossible", description: error.message, variant: "destructive" }),
  });

  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalShortcut);
    return () => window.removeEventListener("keydown", handleGlobalShortcut);
  }, []);

  const filteredGlobalSearchItems = ADMIN_GLOBAL_SEARCH_ITEMS.filter((item) => {
    const query = globalSearch.trim().toLocaleLowerCase("fr-FR");
    return !query || `${item.label} ${item.hint}`.toLocaleLowerCase("fr-FR").includes(query);
  });

  const openGlobalSearchItem = (item: (typeof ADMIN_GLOBAL_SEARCH_ITEMS)[number]) => {
    setIsGlobalSearchOpen(false);
    setGlobalSearch("");
    if ("tab" in item) setActiveAdminTab(item.tab);
    else navigate(item.path);
  };

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

  const candidateListInput = useMemo(() => ({
    sessionToken,
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    activationStatus: activationFilter !== "ALL" ? activationFilter : undefined,
    source: sourceFilter !== "ALL" ? sourceFilter : undefined,
    destination: destinationFilter !== "ALL" ? destinationFilter : undefined,
    sortBy,
  }), [sessionToken, search, statusFilter, activationFilter, sourceFilter, destinationFilter, sortBy]);
  const { data, isLoading, refetch } = trpc.admin.listCandidates.useQuery(
    candidateListInput,
    { enabled: !!sessionToken }
  );
  useEffect(() => {
    if (!sessionToken) return;
    void trpcUtils.admin.listCandidates.reset();
  }, [sessionToken, trpcUtils]);
  const { data: pendingPaymentApplications = [] } = trpc.application.listApplications.useQuery({
    paymentStatus: "PENDING",
    limit: 100,
    offset: 0,
  });
  const { data: advisorDeadlineGroups = [], isLoading: isLoadingAdvisorDeadlines, refetch: refetchAdvisorDeadlines } = trpc.admin.listAdvisorTreatmentDeadlines.useQuery(
    { sessionToken },
    { enabled: !!sessionToken },
  );
  const { data: smtpDeliveryOverview, isFetching: isFetchingSmtpDelivery, refetch: refetchSmtpDelivery } = trpc.admin.getEmailDeliveryLogs.useQuery(
    { sessionToken, limit: 30, status: "all", errorType: "all" },
    { enabled: !!sessionToken },
  );
  const { data: smtpDeliveryTrend = [], isFetching: isFetchingSmtpTrend, refetch: refetchSmtpTrend } = trpc.admin.getEmailDeliveryTrend30Days.useQuery(
    { sessionToken },
    { enabled: !!sessionToken },
  );

  const { data: countryDistribution, isLoading: isLoadingCountryDistribution, refetch: refetchCountryDistribution } = trpc.admin.getCandidateCountryDistribution.useQuery(
    { sessionToken, limit: 12 },
    { enabled: !!sessionToken }
  );

  const { data: faqSatisfaction, isLoading: isLoadingFaqSatisfaction, refetch: refetchFaqSatisfaction } = trpc.admin.getFaqSatisfactionStats.useQuery(
    { sessionToken },
    { enabled: !!sessionToken }
  );
  const { data: flightQueueSummary, refetch: refetchFlightQueueSummary } = trpc.flightBooking.getQueueSummary.useQuery(
    { sessionToken },
    { enabled: !!sessionToken, retry: false, refetchInterval: 30_000 },
  );

  useEffect(() => {
    if (!isLoading && data !== undefined && !lastSyncedAt) {
      setLastSyncedAt(new Date());
    }
  }, [data, isLoading, lastSyncedAt]);

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

  const [resetModalData, setResetModalData] = useState<{ count: number; credentials: { email: string; tempPassword: string }[] } | null>(null);

  const resetAllPasswordsMutation = trpc.adminAuth.resetAllPasswords.useMutation({
    onSuccess: (result) => {
      if (result.fallbackCredentials && result.fallbackCredentials.length > 0) {
        setResetModalData({ count: result.resetCount, credentials: result.fallbackCredentials });
      } else {
        toast({ title: "Réinitialisation envoyée", description: result.message });
        sessionStorage.removeItem("adminSessionToken");
        localStorage.removeItem("adminSessionToken");
        navigate("/admin/login");
      }
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
      await Promise.all([refetch(), refetchCountryDistribution(), refetchFaqSatisfaction(), refetchFlightQueueSummary(), refetchAdvisorDeadlines(), refetchSmtpDelivery(), refetchSmtpTrend()]);
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
  }, [refetch, refetchCountryDistribution, refetchFaqSatisfaction, refetchFlightQueueSummary, refetchAdvisorDeadlines, refetchSmtpDelivery, refetchSmtpTrend, toast]);

  const candidates = data?.candidates || [];
  const total = data?.total || 0;
  const kanbanCandidates: KanbanCandidate[] = candidates.filter((candidate) => Boolean(candidate.id)).map((candidate) => {
    const status = (candidate.status ?? "PENDING_48H") as AdminStatus;
    const referenceDate = candidate.evaluationScheduledAt ?? candidate.lastStatusUpdateAt ?? candidate.updatedAt ?? candidate.createdAt;
    const slaHours = status === "PENDING_48H" ? 48 : status === "PUBLISHED" ? 72 : 120;
    const dueAt = candidate.dueAt ?? (referenceDate ? new Date(new Date(referenceDate).getTime() + slaHours * 60 * 60 * 1000) : null);
    const history = [{ status, label: STATUS_CONFIG[status]?.label ?? status, at: candidate.lastStatusUpdateAt ?? candidate.updatedAt }, ...(candidate.createdAt ? [{ status: "created", label: "Dossier créé", at: candidate.createdAt }] : [])];
    return { id: candidate.id!, fullName: candidate.fullName ?? "Candidat sans nom", folderCode: candidate.folderCode ?? "Dossier non référencé", destinationCountry: candidate.destinationCountry ?? "", projectType: candidate.projectType ?? "", status, source: candidate.source ?? "WEB", advisorName: candidate.adminAssignedTo ?? null, dueAt, history };
  });
  const handleKanbanMove = (candidate: KanbanCandidate, newStatus: AdminStatus) => {
    if (!sessionToken || candidate.status === newStatus || updateKanbanStatusMutation.isPending) return;
    const statusLabel = STATUS_CONFIG[newStatus].label;
    if (!window.confirm(`Confirmer le déplacement de ${candidate.fullName} vers « ${statusLabel} » ? Le changement sera tracé et pourra déclencher une notification client.`)) return;
    updateKanbanStatusMutation.mutate({ sessionToken, candidateId: candidate.id, newStatus, notifyClient: true });
  };
  const availableDestinations = data?.availableDestinations || [];
  const hasCandidateFilters = Boolean(search || statusFilter !== "ALL" || activationFilter !== "ALL" || sourceFilter !== "ALL" || destinationFilter !== "ALL" || sortBy !== "priority");
  const resetCandidateFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setActivationFilter("ALL");
    setSourceFilter("ALL");
    setDestinationFilter("ALL");
    setSortBy("priority");
  };

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
  const externalEvaluationCandidates = candidates.filter((candidate) => candidate.source === "ACCOUNT_ONLY" && candidate.evaluationDeclarationStatus === "pending_validation");
  const pendingEvaluationCandidates = candidates.filter((candidate) => candidate.status === "PENDING_48H");
  const visibleAdvisorDeadlineGroups = advisorDeadlineGroups
    .map((group) => ({
      ...group,
      items: advisorDeadlinePriorityFilter === "all"
        ? group.items
        : group.items.filter((item) => item.priority === advisorDeadlinePriorityFilter),
    }))
    .filter((group) => group.items.length > 0);
  const smtpSummary = smtpDeliveryOverview?.summary ?? { total: 0, sent: 0, failed: 0, pending: 0 };
  const smtpSuccessRate = smtpSummary.total ? Math.round((smtpSummary.sent / smtpSummary.total) * 100) : null;
  const recentSmtpFailures = (smtpDeliveryOverview?.logs ?? []).filter((log) => log.status === "failed").slice(0, 3);
  const hasSmtpTrend = smtpDeliveryTrend.some((point) => point.successRate !== null);
  const exportAdvisorDeadlinesCsv = () => {
    const rows = visibleAdvisorDeadlineGroups.flatMap((group) => group.items.map((item) => [
      group.advisorName,
      group.advisorEmail ?? "Non attribué",
      item.caseNumber,
      item.candidateName ?? "",
      item.label,
      item.priority,
      item.deadline.label,
      new Date(item.dueAt).toLocaleString("fr-FR"),
    ]));
    if (rows.length === 0) {
      toast({ title: "Aucune échéance à exporter", description: "Aucune ligne ne correspond au filtre de priorité actuel.", variant: "destructive" });
      return;
    }
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [["Conseiller", "E-mail conseiller", "Dossier", "Candidat", "Échéance", "Priorité", "État", "Date limite"], ...rows]
      .map((row) => row.map(quote).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `echeances-conseillers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Échéances exportées", description: `${rows.length} échéance(s) exportée(s) selon le filtre actif.` });
  };
  const manualPriorities = [
    {
      id: "external-evaluations",
      label: "Évaluations externes à confirmer",
      detail: "Aucune activation de dossier avant décision humaine.",
      count: externalEvaluationCandidates.length,
      tab: "pre-dossiers",
      tone: "amber",
      deadline: getManualPriorityDeadline(externalEvaluationCandidates, 24),
    },
    {
      id: "evaluation-48h",
      label: "Bilans à relire",
      detail: "Vérifier le bilan avant sa décision de procédure.",
      count: pendingEvaluationCandidates.length,
      tab: "evaluation-review",
      tone: "blue",
      deadline: getManualPriorityDeadline(pendingEvaluationCandidates, 48),
    },
    {
      id: "payments",
      label: "Paiements à contrôler",
      detail: "Valider manuellement avant toute confirmation client.",
      count: pendingPaymentApplications.length,
      tab: "payments",
      tone: "orange",
      deadline: getManualPriorityDeadline(pendingPaymentApplications, 24),
    },
    {
      id: "flight-requests",
      label: "Réservations vol à traiter",
      detail: "Contrôler la demande avant émission ou notification.",
      count: flightQueueSummary?.pending_review ?? 0,
      tab: "flights",
      tone: "sky",
      deadline: { label: "Revue manuelle", detail: "Cible opérationnelle : vérifier avant émission ou notification.", tone: "slate" },
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(135,185,255,0.2),_transparent_34rem),linear-gradient(180deg,_#f8fbff_0%,_#f1f6ff_100%)] text-slate-900 transition-colors duration-300 dark:bg-[#071426] dark:text-slate-100">
      {/* En-tête fixe */}
      <div className="glass-admin-header bg-gradient-to-r from-[#071b3d]/95 via-[#0b2f6f]/95 to-[#123c86]/95 text-white sticky top-0 z-50 shadow-lg backdrop-blur-xl transition-colors duration-300">
        <div className="mx-auto w-full max-w-[1920px] px-4 py-4 sm:px-6 xl:px-8 2xl:px-10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold">Tableau de bord Admin</h1>
              <p className="text-blue-200 text-sm">Bienvenue, {adminName} — 3M Travel & Services</p>
            </div>
            
            {/* Recherche globale + filtre dossiers */}
            <div className="flex flex-1 max-w-xl items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setIsGlobalSearchOpen(true)} className="shrink-0 gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20" aria-label="Ouvrir la recherche globale admin">
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline">Recherche globale</span>
                <kbd className="hidden rounded border border-white/30 px-1.5 py-0.5 text-[10px] font-semibold text-blue-100 lg:inline">Ctrl K</kbd>
              </Button>
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Filtrer les dossiers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Filtrer les dossiers candidats"
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/25 text-white placeholder-slate-200 rounded-lg shadow-inner shadow-black/10 focus:bg-white/15 focus:border-white/60 transition-all"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/recuperation-acces")}
                className="gap-1.5 border-white/30 text-white hover:bg-white/10"
              >
                <ShieldAlert className="w-4 h-4" /> Récupération accès
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/verifier-dossier")}
                className="gap-1.5 border-white/30 text-white hover:bg-white/10"
              >
                <Search className="w-4 h-4" /> Vérifier un dossier
              </Button>
            </div>
            <nav aria-label="Fil d’Ariane du pilotage admin" className="flex w-full items-center gap-2 border-t border-white/15 pt-3 text-sm text-blue-100">
              <button type="button" onClick={() => setActiveAdminTab("pilotage")} className="rounded px-1 font-semibold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Administration</button>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="font-bold text-white">{({ pilotage: "Pilotage", candidates: "Dossiers", "pre-dossiers": "Pré-dossiers", payments: "Paiements", documents: "Documents", flights: "Vols", emails: "E-mails" } as Record<string, string>)[activeAdminTab] || "Pilotage"}</span>
            </nav>
            <nav aria-label="Raccourcis de pilotage admin" className="flex w-full flex-wrap gap-2">
              {[['pilotage', 'Pilotage'], ['candidates', 'Dossiers'], ['pre-dossiers', 'Pré-dossiers'], ['payments', 'Paiements'], ['documents', 'Documents'], ['flights', 'Vols'], ['emails', 'E-mails']].map(([tab, label]) => (
                <Button key={tab} type="button" variant="outline" size="sm" onClick={() => setActiveAdminTab(tab)} aria-current={activeAdminTab === tab ? 'page' : undefined} aria-label={`Afficher ${label}`} className={`border-white/25 text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2f6f] ${activeAdminTab === tab ? 'bg-white/20 ring-1 ring-white/50' : 'bg-white/5'}`}>
                  {label}
                </Button>
              ))}
            </nav>
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
              className="premium-action text-white hover:text-white gap-1.5 font-semibold"
            >
              <Plus className="w-4 h-4" />
              Saisir dossier agence
            </Button>
            
            {/* Notifications */}
            <AdminNotificationBell />
            
            {/* Profil Admin */}
            <div className="flex items-center gap-2 pl-3 border-l border-white/20">
              <div className="w-10 h-10 bg-gradient-to-br from-[#f4b942] to-[#d99b22] text-[#071b3d] font-bold rounded-full flex items-center justify-center shadow-md shadow-black/20 text-sm">
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
              className="border border-rose-300/60 bg-rose-600 hover:bg-rose-700 active:scale-[0.97] text-white gap-1.5 font-semibold shadow-lg shadow-rose-950/25 transition-all duration-150 flex items-center"
              title="Déconnecter votre session admin"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{logoutMutation.isPending ? "Déconnexion..." : "Déconnexion"}</span>
              <span className="sm:hidden">{logoutMutation.isPending ? "..." : "Sortir"}</span>
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isGlobalSearchOpen} onOpenChange={(open) => { setIsGlobalSearchOpen(open); if (!open) setGlobalSearch(""); }}>
        <DialogContent className="max-w-xl overflow-hidden border-slate-200 p-0 shadow-2xl">
          <DialogHeader className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-slate-950"><Search className="h-5 w-5 text-blue-700" />Recherche globale admin</DialogTitle>
            <p className="text-sm text-slate-600">Accédez rapidement aux espaces autorisés. Raccourci : <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-semibold">Ctrl/Cmd + K</kbd></p>
          </DialogHeader>
          <div className="p-4">
            <Input autoFocus value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Rechercher un espace ou un outil..." aria-label="Recherche globale administrateur" className="h-11" />
            <div className="mt-3 max-h-80 space-y-1 overflow-y-auto" role="listbox" aria-label="Résultats de recherche admin">
              {filteredGlobalSearchItems.length === 0 ? <p className="px-3 py-8 text-center text-sm text-slate-500">Aucun espace ne correspond à votre recherche.</p> : filteredGlobalSearchItems.map((item) => <button key={item.label} type="button" role="option" onClick={() => openGlobalSearchItem(item)} className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><Search className="h-4 w-4" /></span><span className="min-w-0"><strong className="block text-sm font-bold text-slate-950">{item.label}</strong><span className="block text-xs text-slate-600">{item.hint}</span></span></button>)}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto w-full max-w-[1920px] px-4 py-6 space-y-6 sm:px-6 xl:px-8 2xl:px-10">
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
            <Card key={s.label} className="border border-white/90 bg-white/90 shadow-[0_12px_30px_-24px_rgba(7,27,61,0.55)]">
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

        <section className="premium-surface rounded-2xl p-4" aria-label="Supervision des remises SMTP">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-black text-slate-950"><Mail className="h-5 w-5 text-blue-700" />Remises SMTP</h2>
              <p className="mt-1 text-sm text-slate-600">Synthèse des 30 dernières remises enregistrées. Les détails sensibles ne sont pas affichés ici.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void Promise.all([refetchSmtpDelivery(), refetchSmtpTrend()])} disabled={isFetchingSmtpDelivery || isFetchingSmtpTrend || !sessionToken} className="gap-2"><RefreshCw className={`h-4 w-4 ${isFetchingSmtpDelivery || isFetchingSmtpTrend ? "animate-spin" : ""}`} />Actualiser</Button><Button variant="outline" size="sm" onClick={() => setActiveAdminTab("emails")}>Ouvrir les e-mails</Button></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3"><p className="text-xs font-semibold text-blue-800">Taux de réussite</p><p className="mt-1 text-2xl font-black text-blue-950">{smtpSuccessRate === null ? "—" : `${smtpSuccessRate}%`}</p><p className="text-xs text-blue-700">Sur les remises chargées</p></div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs font-semibold text-emerald-800">Envoyés</p><p className="mt-1 text-2xl font-black text-emerald-950">{smtpSummary.sent}</p><p className="text-xs text-emerald-700">Remises confirmées</p></div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3"><p className="text-xs font-semibold text-rose-800">Échecs</p><p className="mt-1 text-2xl font-black text-rose-950">{smtpSummary.failed}</p><p className="text-xs text-rose-700">À examiner manuellement</p></div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-800">En attente</p><p className="mt-1 text-2xl font-black text-amber-950">{smtpSummary.pending}</p><p className="text-xs text-amber-700">Suivi requis</p></div>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3" aria-label="Évolution du taux de réussite SMTP sur 30 jours">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Taux de réussite SMTP · 30 jours</p><span className="text-xs text-slate-500">Remises finalisées uniquement</span></div>
            {isFetchingSmtpTrend ? <p className="py-8 text-sm text-slate-500">Chargement de la tendance…</p> : !hasSmtpTrend ? <p className="py-8 text-sm text-slate-600">Aucune remise finalisée sur les 30 derniers jours : aucune tendance n’est tracée.</p> : <div className="mt-2 h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={smtpDeliveryTrend} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" /><YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 11 }} /><Tooltip formatter={(value: number | null) => value === null ? "Aucune remise finalisée" : `${value}%`} labelFormatter={(label) => `Jour : ${label}`} /><Line type="monotone" dataKey="successRate" name="Taux de réussite" stroke="#1d4ed8" strokeWidth={2.5} dot={false} connectNulls={false} /></LineChart></ResponsiveContainer></div>}
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Dernières erreurs de remise</p>{recentSmtpFailures.length === 0 ? <p className="mt-2 text-sm text-slate-600">Aucun échec dans les remises chargées.</p> : <ul className="mt-2 space-y-1 text-sm text-slate-700">{recentSmtpFailures.map((failure) => <li key={failure.id} className="flex flex-wrap items-center justify-between gap-2"><span>Échec de remise à examiner</span><span className="text-xs text-slate-500">{new Date(failure.createdAt).toLocaleString("fr-FR")}</span></li>)}</ul>}</div>
        </section>

        <section className="premium-surface rounded-2xl p-4" aria-label="File de priorités manuelle">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-black text-slate-950"><AlertCircle className="h-5 w-5 text-amber-600" />File de priorités</h2>
              <p className="mt-1 text-sm text-slate-600">Indicateurs de travail à ouvrir manuellement par un conseiller. Aucune décision ni notification n’est déclenchée automatiquement.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Actualisation manuelle requise</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {manualPriorities.map((priority) => {
              const tone = priority.tone === "amber" ? "border-amber-200 bg-amber-50" : priority.tone === "orange" ? "border-orange-200 bg-orange-50" : priority.tone === "sky" ? "border-sky-200 bg-sky-50" : "border-blue-200 bg-blue-50";
              const deadlineTone = priority.deadline.tone === "rose" ? "border-rose-200 bg-rose-100 text-rose-800" : priority.deadline.tone === "amber" ? "border-amber-200 bg-amber-100 text-amber-800" : priority.deadline.tone === "emerald" ? "border-emerald-200 bg-emerald-100 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-700";
              return (
                <button
                  key={priority.id}
                  type="button"
                  onClick={() => setActiveAdminTab(priority.tab)}
                  className={`min-h-28 rounded-xl border p-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${tone}`}
                  aria-label={`Ouvrir ${priority.label} : ${priority.count} élément(s)`}
                >
                  <div className="flex items-start justify-between gap-3"><span className="text-sm font-bold text-slate-900">{priority.label}</span><span className="rounded-full bg-white px-2 py-0.5 text-lg font-black text-slate-950">{priority.count}</span></div>
                  <p className="mt-3 text-xs leading-5 text-slate-600">{priority.detail}</p>
                  <span className={`mt-3 flex w-fit items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-bold ${deadlineTone}`}><Timer className="h-3 w-3" />{priority.deadline.label}</span>
                  <p className="mt-2 text-[11px] leading-4 text-slate-600">{priority.deadline.detail}</p>
                  <span className="mt-3 inline-block text-xs font-bold text-blue-800">Ouvrir le module →</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="premium-surface rounded-2xl p-4" aria-label="Échéances de traitement par conseiller">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-black text-slate-950"><Users className="h-5 w-5 text-blue-700" />Échéances par conseiller</h2>
              <p className="mt-1 text-sm text-slate-600">Vue de travail fondée sur les échéances enregistrées. Aucun rappel, changement de statut ou notification n’est déclenché automatiquement.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Button variant="outline" size="sm" onClick={exportAdvisorDeadlinesCsv} className="gap-2"><Download className="h-4 w-4" />Exporter CSV</Button><Select value={advisorDeadlinePriorityFilter} onValueChange={(value) => setAdvisorDeadlinePriorityFilter(value as typeof advisorDeadlinePriorityFilter)}><SelectTrigger aria-label="Filtrer les échéances par priorité" className="w-full bg-white sm:w-48"><SelectValue placeholder="Toutes priorités" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes priorités</SelectItem><SelectItem value="urgent">Urgente</SelectItem><SelectItem value="high">Haute</SelectItem><SelectItem value="normal">Normale</SelectItem><SelectItem value="low">Basse</SelectItem></SelectContent></Select></div>
          </div>
          {isLoadingAdvisorDeadlines ? (
            <p className="py-6 text-sm text-slate-500">Chargement des échéances…</p>
          ) : visibleAdvisorDeadlineGroups.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Aucune échéance ne correspond à cette priorité.</p>
          ) : (
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {visibleAdvisorDeadlineGroups.map((group) => (
                <article key={group.advisorId ?? "unassigned"} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><h3 className="font-bold text-slate-950">{group.advisorName}</h3><p className="text-xs text-slate-500">{group.advisorEmail ?? "À attribuer à un conseiller"}</p></div>
                    <Badge className="bg-blue-100 text-blue-800">{group.items.length} échéance{group.items.length > 1 ? "s" : ""}</Badge>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {group.items.slice(0, 6).map((item) => {
                      const deadlineClass = item.deadline.key === "overdue" ? "border-rose-200 bg-rose-50 text-rose-800" : item.deadline.key === "today" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";
                      const priorityMeta = item.priority === "urgent" ? { label: "Priorité urgente", className: "border-rose-300 bg-rose-600 text-white" } : item.priority === "high" ? { label: "Priorité haute", className: "border-orange-300 bg-orange-100 text-orange-900" } : item.priority === "low" ? { label: "Priorité basse", className: "border-slate-300 bg-slate-100 text-slate-700" } : { label: "Priorité normale", className: "border-blue-300 bg-blue-100 text-blue-900" };
                      return <li key={item.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{item.caseNumber}{item.candidateName ? ` · ${item.candidateName}` : ""}</p><p className="mt-0.5 truncate text-xs text-slate-600">{item.label}</p></div><div className="flex flex-wrap items-center gap-2"><Badge className={priorityMeta.className}>{priorityMeta.label}</Badge><Badge className={deadlineClass}>{item.deadline.label}</Badge><span className="whitespace-nowrap text-xs font-medium text-slate-600">{new Date(item.dueAt).toLocaleString("fr-FR")}</span></div></li>;
                    })}
                  </ul>
                  {group.items.length > 6 && <p className="mt-3 text-xs font-medium text-slate-500">+ {group.items.length - 6} autre(s) échéance(s) dans ce groupe.</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        <div id="admin-placement-pipeline"><AdminPlacementPipeline sessionToken={sessionToken} /></div>

        {/* Modal de secours si les e-mails de réinitialisation ont échoué */}
        {resetModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-lg text-red-600 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Réinitialisation effectuée (Alerte e-mail)
                </h3>
                <button onClick={() => { setResetModalData(null); navigate("/admin/login"); }} className="text-gray-400 hover:text-gray-600 text-sm font-bold">✕</button>
              </div>
              <p className="text-sm text-gray-600">
                Les mots de passe des {resetModalData.count} comptes administrateurs ont été réinitialisés avec succès, mais les e-mails n’ont pas pu être envoyés automatiquement en raison de la configuration du domaine d’expédition.
              </p>
              <p className="text-xs font-semibold text-gray-800 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                ⚠️ Notez précieusement ces mots de passe temporaires avant de fermer cette fenêtre. Ils ne seront plus affichés.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-xl p-3 bg-gray-50">
                {resetModalData.credentials.map((cred, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border shadow-sm text-sm">
                    <span className="font-medium text-gray-800">{cred.email}</span>
                    <code className="bg-gray-100 text-blue-700 font-mono px-2.5 py-1 rounded text-xs select-all font-bold">
                      {cred.tempPassword}
                    </code>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => {
                    setResetModalData(null);
                    sessionStorage.removeItem("adminSessionToken");
                    localStorage.removeItem("adminSessionToken");
                    navigate("/admin/login");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-sm"
                >
                  J'ai noté mes identifiants, aller à la connexion
                </Button>
              </div>
            </div>
          </div>
        )}

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

        <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center">
          <div><p className="font-black text-blue-950">Pôle 3M Digital</p><p className="text-sm text-blue-800">Consultez et traitez les demandes de plateformes, marketing, support IT et formation.</p></div>
          <a href="/admin/digital-services" className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Ouvrir les demandes 3M Digital</a>
        </div>
        {/* Onglets : Dossiers, Paiements, Documents, Paramètres Vols */}
        <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="w-full" aria-label="Sections du tableau de bord administrateur">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Pilotage centralisé</p><h2 className="text-xl font-black tracking-tight text-slate-950">Espaces de travail</h2></div><p className="text-xs font-medium text-slate-500">Sélectionnez une section pour traiter les demandes manuellement.</p></div>
          <div className="mb-6 grid gap-3 lg:grid-cols-2 2xl:grid-cols-5">
            <AdminNavGroup title="Pilotage des dossiers"><TabsTrigger value="pilotage" onClick={() => setActiveAdminTab("pilotage")} className="font-bold text-cyan-700">Pilotage synchronisé</TabsTrigger><TabsTrigger value="candidates" onClick={() => setActiveAdminTab("candidates")}>Dossiers</TabsTrigger><TabsTrigger value="pre-dossiers" onClick={() => setActiveAdminTab("pre-dossiers")} className="font-bold text-blue-700">Pré-dossiers</TabsTrigger><TabsTrigger value="inbox" onClick={() => setActiveAdminTab("inbox")}>Demandes unifiées</TabsTrigger><TabsTrigger value="evaluation-review" onClick={() => setActiveAdminTab("evaluation-review")} className="font-bold text-amber-700">Bilans à valider</TabsTrigger><TabsTrigger value="evaluation-reminders" onClick={() => setActiveAdminTab("evaluation-reminders")} className="font-bold text-violet-700">Bilans à relancer</TabsTrigger><TabsTrigger value="documents" onClick={() => setActiveAdminTab("documents")}>Documents</TabsTrigger><TabsTrigger value="activations" onClick={() => setActiveAdminTab("activations")}>Activations</TabsTrigger></AdminNavGroup>
            <AdminNavGroup title="Services & catalogue"><TabsTrigger value="tourism" onClick={() => setActiveAdminTab("tourism")}>Tourisme & Devis</TabsTrigger><TabsTrigger value="consular" onClick={() => setActiveAdminTab("consular")} className="font-bold text-blue-600">Consulats & Liens</TabsTrigger><TabsTrigger value="destination-analytics" onClick={() => setActiveAdminTab("destination-analytics")} className="font-bold text-indigo-700">Destinations</TabsTrigger><TabsTrigger value="evisa-catalogue" onClick={() => setActiveAdminTab("evisa-catalogue")} className="font-bold text-cyan-700">Catalogue e‑Visa</TabsTrigger></AdminNavGroup>
            <AdminNavGroup title="Réservations & finance"><TabsTrigger value="calendar" onClick={() => setActiveAdminTab("calendar")}>Calendrier</TabsTrigger><TabsTrigger value="payments" onClick={() => setActiveAdminTab("payments")}>Paiements {pendingPaymentApplications.length > 0 && <Badge className="h-5 min-w-5 rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{pendingPaymentApplications.length}</Badge>}</TabsTrigger><TabsTrigger value="flights" onClick={() => setActiveAdminTab("flights")} className="font-bold text-sky-700"><Plane className="h-4 w-4" /> Réservations vols {(flightQueueSummary?.pending_review ?? 0) > 0 && <Badge className="h-5 min-w-5 rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{flightQueueSummary?.pending_review}</Badge>}</TabsTrigger><TabsTrigger value="rates" onClick={() => setActiveAdminTab("rates")} className="font-bold text-emerald-600">Taux de change</TabsTrigger></AdminNavGroup>
            <AdminNavGroup title="Communication & qualité"><TabsTrigger value="emails" onClick={() => setActiveAdminTab("emails")}>E-mails</TabsTrigger><TabsTrigger value="faq" onClick={() => setActiveAdminTab("faq")}>Satisfaction FAQ</TabsTrigger><TabsTrigger value="rag" onClick={() => setActiveAdminTab("rag")}>Guides & RAG</TabsTrigger><TabsTrigger value="passport-history" onClick={() => setActiveAdminTab("passport-history")}>Passeports</TabsTrigger></AdminNavGroup>
            <AdminNavGroup title="Supervision"><TabsTrigger value="route-health" onClick={() => setActiveAdminTab("route-health")} className="font-bold text-rose-700">404 & Liens</TabsTrigger><TabsTrigger value="simulator-health" onClick={() => setActiveAdminTab("simulator-health")} className="font-bold text-amber-700">Santé simulateurs</TabsTrigger><TabsTrigger value="footer-engagement" onClick={() => setActiveAdminTab("footer-engagement")} className="font-bold text-blue-700">Engagement footer</TabsTrigger><TabsTrigger value="system-status" onClick={() => setActiveAdminTab("system-status")} className="font-bold text-emerald-700">État système</TabsTrigger><TabsTrigger value="audit" onClick={() => setActiveAdminTab("audit")}>Journal d’audit</TabsTrigger></AdminNavGroup>
          </div>
          <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600"><span>Section active : <strong className="text-slate-950">{activeAdminTab === "candidates" ? "Dossiers" : activeAdminTab === "pre-dossiers" ? "Pré-dossiers" : activeAdminTab === "flights" ? "Réservations vols" : activeAdminTab}</strong></span><span className="hidden sm:inline">Les changements sensibles nécessitent une validation humaine.</span></div>

          <TabsContent value="pilotage" className="space-y-6"><AdminOperationsControlCenter totalCandidates={total} pendingEvaluations={pendingEvaluationCandidates.length} pendingPayments={pendingPaymentApplications.length} pendingFlights={flightQueueSummary?.pending_review ?? 0} openDeadlines={advisorDeadlineGroups.reduce((count, group) => count + group.items.length, 0)} smtpFailures={smtpSummary.failed} lastSyncedAt={lastSyncedAt} isRefreshing={isRefreshing} onRefresh={handleRefresh} onNavigate={setActiveAdminTab} />
            <Card className="border-amber-200 bg-amber-50/70">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><h2 className="text-base font-black text-slate-950">Déclarations préalables à contrôler</h2><p className="text-sm text-slate-600">Candidats ayant déclaré une évaluation déjà réalisée ou un paiement effectué en agence.</p></div>
                  <Badge className="w-fit bg-amber-600 text-white">{externalEvaluationCandidates.length + candidates.filter((candidate) => candidate.source === "AGENCY_PHYSICAL").length} à contrôler</Badge>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {[...externalEvaluationCandidates, ...candidates.filter((candidate) => candidate.source === "AGENCY_PHYSICAL")].slice(0, 8).map((candidate) => (
                    <div key={`declaration-${candidate.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white p-3">
                      <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{candidate.fullName}</p><p className="truncate text-xs text-slate-500">{candidate.folderCode} · {candidate.destinationCountry}</p><div className="mt-1 flex flex-wrap gap-1"><EvaluationDeclarationBadge status={candidate.evaluationDeclarationStatus} /><Badge variant="outline" className="text-[10px]">{candidate.source === "AGENCY_PHYSICAL" ? "Paiement/dépôt agence" : "Évaluation déclarée"}</Badge></div></div>
                      <Button type="button" size="sm" variant="outline" onClick={() => setSelectedCandidateId(candidate.id)} aria-label={`Ouvrir le dossier de ${candidate.fullName}`}>Ouvrir</Button>
                    </div>
                  ))}
                </div>
                {(externalEvaluationCandidates.length + candidates.filter((candidate) => candidate.source === "AGENCY_PHYSICAL").length) === 0 && <p className="mt-4 rounded-lg bg-white/80 p-4 text-sm text-slate-600">Aucune déclaration préalable en attente de contrôle.</p>}
              </CardContent>
            </Card>
            <AdminCandidateKanban candidates={kanbanCandidates} onMove={handleKanbanMove} onOpen={(candidate) => setSelectedCandidateId(candidate.id)} /></TabsContent>

          <TabsContent value="tourism" className="space-y-6">
            <AdminTourismRequests />
          </TabsContent>
          <TabsContent value="evisa-catalogue" className="space-y-6"><AdminEvisaCatalogueManager sessionToken={sessionToken} /></TabsContent>
          <TabsContent value="route-health" className="space-y-6"><AdminRouteHealthManager sessionToken={sessionToken} /></TabsContent>
          <TabsContent value="simulator-health" className="space-y-6"><AdminSimulatorHealth sessionToken={sessionToken} /></TabsContent>
          <TabsContent value="system-status" className="space-y-6"><AdminSystemStatus /></TabsContent>
          <TabsContent value="footer-engagement" className="space-y-6"><AdminFooterEngagement sessionToken={sessionToken} /></TabsContent>

          <TabsContent value="consular" className="space-y-6">
            <AdminConsularRegistry sessionToken={sessionToken} />
          </TabsContent>

          <TabsContent value="destination-analytics" className="space-y-6">
            <AdminDestinationAnalytics sessionToken={sessionToken} />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <AdminCalendarView />
          </TabsContent>

          <TabsContent value="flights" className="space-y-6">
            <FlightAgentDashboard />
          </TabsContent>

          <TabsContent value="evaluation-review" className="space-y-6">
            <AdvisorEvaluationReviewQueue sessionToken={sessionToken} onOpenDossier={(dossierNumber, candidateId) => { setSearch(dossierNumber); setOpenEvaluationEditor(true); setSelectedCandidateId(candidateId); setActiveAdminTab("candidates"); toast({ title: "Dossier ouvert", description: `${dossierNumber} est ouvert dans la fiche 360° pour préparer et relire le bilan.` }); }} />
          </TabsContent>

          <TabsContent value="evaluation-reminders" className="space-y-6">
            <BilanReminderDashboard sessionToken={sessionToken} />
          </TabsContent>

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
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row">
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
          <Select value={activationFilter} onValueChange={(value) => setActivationFilter(value as CandidateActivationStatus | "ALL")}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filtrer par statut d’activation">
              <SelectValue placeholder="Toutes les activations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes les activations</SelectItem>
              {Object.entries(ACTIVATION_STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">{cfg.icon}{cfg.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as CandidateSource | "ALL")}>
              <SelectTrigger className="w-full lg:w-48" aria-label="Filtrer par source"><SelectValue placeholder="Toutes les sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les sources</SelectItem>
                {Object.entries(SOURCE_CONFIG).map(([key, config]) => <SelectItem key={key} value={key}>{config.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={destinationFilter} onValueChange={setDestinationFilter}>
              <SelectTrigger className="w-full lg:w-52" aria-label="Filtrer par destination"><SelectValue placeholder="Toutes les destinations" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les destinations</SelectItem>
                {availableDestinations.map((destination) => <SelectItem key={destination} value={destination}>{destination}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-full lg:w-56" aria-label="Trier les dossiers"><ArrowDownUp className="mr-2 h-4 w-4" /><SelectValue placeholder="Trier les dossiers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priorités d’abord</SelectItem>
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="oldest">Plus anciens</SelectItem>
                <SelectItem value="name">Nom du candidat</SelectItem>
                <SelectItem value="score_desc">Score décroissant</SelectItem>
              </SelectContent>
            </Select>
            {hasCandidateFilters && <Button type="button" variant="outline" onClick={resetCandidateFilters} className="gap-2"><X className="h-4 w-4" />Réinitialiser</Button>}
          </div>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Activation</th>
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
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="admin-table-skeleton h-4 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>Aucun candidat trouvé</p>
                      {hasCandidateFilters && (
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
                          <div className="mt-1"><EvaluationDeclarationBadge status={candidate.evaluationDeclarationStatus} /></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-700 text-xs">{candidate.destinationCountry}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <SourceBadge source={candidate.source} />
                      </td>
                      <td className="px-4 py-3">
                        <ActivationBadge status={candidate.activationStatus} />
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

          <TabsContent value="pre-dossiers" className="space-y-6">
            <AdminPreDossierAccountsPanel sessionToken={sessionToken} />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AdminAuditLogPanel sessionToken={sessionToken} />
          </TabsContent>

          <TabsContent value="rates" className="space-y-6">
            <AdminCurrencyRates />
          </TabsContent>

          <TabsContent value="passport-history" className="space-y-6">
            <AdminPassportCorrectionHistory />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <AdminPaymentManagement
              onPaymentUpdated={() => {
                void trpcUtils.admin.listCandidates.invalidate();
                void trpcUtils.application.listApplications.invalidate();
              }}
            />
          </TabsContent>

          <TabsContent value="inbox" className="space-y-6">
            <UnifiedRequestInbox sessionToken={sessionToken} />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <AdminDocumentsManagement />
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <AdminEmailDeliveryManagement />
          </TabsContent>

          <TabsContent value="activations" className="space-y-6">
            <AdminCandidateActivationPanel sessionToken={sessionToken} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modales */}
      {selectedCandidateId && (
        <CandidateDetailModal
          candidateId={selectedCandidateId}
          onClose={() => { setSelectedCandidateId(null); setOpenEvaluationEditor(false); }}
          onStatusUpdated={handleRefresh}
          openEvaluationEditor={openEvaluationEditor}
          onOpenOperations={(area, folderCode) => {
            setSearch(folderCode);
            setActiveAdminTab(area);
            setSelectedCandidateId(null);
            toast({ title: "Centre de traitement ouvert", description: `Module ${area === "documents" ? "documents" : area === "payments" ? "paiements" : "e-mails"} ouvert pour poursuivre le traitement du dossier ${folderCode}.` });
          }}
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
