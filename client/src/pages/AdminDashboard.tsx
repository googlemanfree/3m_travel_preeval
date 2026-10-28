/**
 * Dashboard Administrateur — 3M TRAVEL AGENCY
 * Gestion unifiée des candidats (dossiers en ligne + dossiers agence)
 */
import React, { lazy, Suspense, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { evaluationSourceTypeOf } from "@/lib/evaluationSourceType";

/** Libellés des sections du poste de pilotage (fil d'Ariane, barre « Section active »). */
const ADMIN_TAB_LABELS: Record<string, string> = {
  pilotage: "Pilotage synchronisé",
  candidates: "Dossiers",
  "pre-dossiers": "Pré-dossiers",
  inbox: "Demandes unifiées",
  "evaluation-review": "Bilans à valider",
  "evaluation-reminders": "Bilans à relancer",
  documents: "Documents",
  activations: "Activations",
  partners: "Partenaires & placement",
  tourism: "Tourisme & devis",
  consular: "Consulats & liens",
  "destination-analytics": "Destinations",
  "evisa-catalogue": "Catalogue e-Visa",
  "evaluation-config": "Évaluation & pays",
  calendar: "Calendrier",
  payments: "Paiements",
  flights: "Réservations vols",
  rates: "Taux de change",
  emails: "E-mails",
  faq: "Satisfaction FAQ",
  rag: "Guides & RAG",
  "passport-history": "Passeports",
  "route-health": "404 & liens",
  "simulator-health": "Santé simulateurs",
  "footer-engagement": "Engagement footer",
  "system-status": "État système",
  scheduler: "Planificateur",
  audit: "Journal d'audit",
  privacy: "Confidentialité",
};
const ADMIN_TAB_STORAGE_KEY = "3m-admin-active-tab";
/** Sections sensibles : jamais restaurées automatiquement (elles dépendent des droits de la session). */
const ADMIN_TAB_NOT_RESTORED = new Set(["rates", "scheduler"]);

function readInitialAdminTab(): string {
  if (typeof window === "undefined") return "pilotage";
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("tab");
    if (fromUrl && ADMIN_TAB_LABELS[fromUrl] && !ADMIN_TAB_NOT_RESTORED.has(fromUrl)) return fromUrl;
    const stored = window.localStorage.getItem(ADMIN_TAB_STORAGE_KEY);
    if (stored && ADMIN_TAB_LABELS[stored] && !ADMIN_TAB_NOT_RESTORED.has(stored)) return stored;
  } catch {
    // stockage indisponible : on retombe sur le pilotage
  }
  return "pilotage";
}

function rememberAdminTab(tab: string) {
  try {
    window.localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {
    // navigation privée ou stockage bloqué : l'onglet change quand même
  }
}

function AdminNavGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="premium-surface min-w-0 rounded-2xl p-3">
      <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">{title}</p>
      <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-slate-100/90 p-1">{children}</TabsList>
    </section>
  );
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
  DialogDescription,
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
  FolderPlus,
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
  Trash2,
  UserCheck,
  Hand,
  Loader2,
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
import { AdminPaymentInstructions } from "@/components/AdminPaymentInstructions";
import { AdminReservationPayments } from "@/components/AdminReservationPayments";
import { AdminDocumentsManagement } from "@/components/AdminDocumentsManagement";
import AdminEmailDeliveryManagement from "@/components/AdminEmailDeliveryManagement";
import AdminNotificationBell from "@/components/AdminNotificationBell";
import AdminAuditLogPanel from "@/components/AdminAuditLogPanel";
import AdminCandidateActivationPanel from "@/components/AdminCandidateActivationPanel";
import AdminContractsReceiptsDesk from "@/components/AdminContractsReceiptsDesk";
import AdminNoEvaluationOutreachPanel from "@/components/AdminNoEvaluationOutreachPanel";
import AdminPreDossierAccountsPanel from "@/components/AdminPreDossierAccountsPanel";
import AdminRedundantPreAccountsPanel from "@/components/AdminRedundantPreAccountsPanel";
import AdminGuichetPanel from "@/components/AdminGuichetPanel";
import AdminCockpitControlBoard from "@/components/AdminCockpitControlBoard";
import AdminCandidateCockpitStrip from "@/components/AdminCandidateCockpitStrip";
import AdminClientSpacePreview from "@/components/AdminClientSpacePreview";
import AdminEmployerSelectionPanel from "@/components/AdminEmployerSelectionPanel";
import {
  ADMIN_STAGE_CATALOG,
  ADMIN_STAGE_SEQUENCE,
  getNextAdminStage,
  getPreviousAdminStage,
  resolveGuidedNextAdminAction,
  type GuidedNextAction,
} from "@shared/adminStageCatalog";
import {
  preDossierReadinessBadge,
  type AdminRelanceStage,
} from "@shared/adminOpsToolkit";
import { isOpenableStoredUrl } from "@shared/storedFileUrl";
import AdminPilotageQueue from "@/components/AdminPilotageQueue";
import AdminDelayStats from "@/components/AdminDelayStats";
import { AdminTourismRequests } from "@/components/AdminTourismRequests";
import { AdminConsularRegistry } from "@/components/AdminConsularRegistry";
import { AdminDestinationAnalytics } from "@/components/AdminDestinationAnalytics";
import AdminRegistrationProfile from "@/components/AdminRegistrationProfile";
import { AdminCurrencyRates } from "@/components/AdminCurrencyRates";
import { AdminPassportCorrectionHistory } from "@/components/AdminPassportCorrectionHistory";
import { AdminEvisaCatalogueManager } from "@/components/AdminEvisaCatalogueManager";
import { AdminRouteHealthManager } from "@/components/AdminRouteHealthManager";
import { AdminSystemStatus } from "@/components/AdminSystemStatus";
import { AdminSchedulerPanel, SchedulerDryRunBanner, SchedulerModeBadge } from "@/components/AdminSchedulerPanel";
import { AdminSimulatorHealth } from "@/components/AdminSimulatorHealth";
import { AdminFooterEngagement } from "@/components/AdminFooterEngagement";
import { AdminPlacementPipeline } from "@/components/AdminPlacementPipeline";
import { AdminPartnerModule } from "@/components/AdminPartnerModule";
import { AdminCvthequeReview } from "@/components/AdminCvthequeReview";
import { AdminRecruitmentInbox } from "@/components/AdminRecruitmentInbox";
import { AdminEvaluationJourneyBoard } from "@/components/AdminEvaluationJourneyBoard";
import { AdminEvaluationFormEditor } from "@/components/AdminEvaluationFormEditor";
import { AdminCountryCatalog } from "@/components/AdminCountryCatalog";
import { AdminPrivacyCenter } from "@/components/AdminPrivacyCenter";
import { AdminOperationsControlCenter } from "@/components/AdminOperationsControlCenter";
import AdminTodayDashboard, { type TodayCandidate } from "@/components/AdminTodayDashboard";
import { AdminCandidateKanban, getNextKanbanStatus, type KanbanCandidate } from "@/components/AdminCandidateKanban";
import { AdminCalendarView } from "@/components/AdminCalendarView";
import { UnifiedRequestInbox } from "@/components/UnifiedRequestInbox";
import { Candidate360Workspace } from "@/components/Candidate360Workspace";
import { adminLoginUrl, clearAdminSession, isAdminSessionError } from "@/lib/adminSession";
import FlightAgentDashboard from "@/pages/FlightAgentDashboard";
import { AdvisorEvaluationReviewQueue } from "@/components/AdvisorEvaluationReviewQueue";
import { BilanReminderDashboard } from "@/components/BilanReminderDashboard";
import { EvaluationDeclarationBadge } from "@/components/EvaluationDeclarationBadge";
import { AdminPreDossierEvaluationPanel } from "@/components/AdminPreDossierEvaluationPanel";
import type { EvaluationDeclarationStatus } from "@shared/evaluationDeclaration";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAdminSyncTime } from "@shared/adminSync";
import { ADMIN_NEXT_ACTION_URGENCY_CLASS, determineAdminListNextAction } from "@shared/adminDossierNextAction";
import { ADMIN_OPERATIONAL_STAGES, type AdminProcedureSnapshot } from "@shared/adminProcedureJourney";
import { procedureLabelForDossier, type SiblingProcedureSummary } from "@shared/clientMultiDossier";
import { ADMIN_PROCEDURE_TYPES, normalizeAdminProcedureType } from "@shared/dossierProcedureSelection";
import { POPULAR_DESTINATION_NAMES, getCandidateDestinationOption } from "@shared/candidateDestinationOptions";
import { resourceLibraryPathForCountry } from "@shared/countryResourceCatalog";
import { CountrySelect } from "@/components/CountryPicker";

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
  paymentStatus?: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "NOT_PAID";
  agreementSigned?: boolean | null;
  secondProtocolReady?: boolean;
  secondProtocolSigned?: boolean;
  checklistPercent?: number | null;
  procedureStep?: string;
  isActiveDossier?: boolean;
  procedureJourney?: AdminProcedureSnapshot;
  siblingCount?: number;
  siblingProcedures?: SiblingProcedureSummary[];
  journeySla?: {
    label: string;
    tone: "ok" | "soon" | "overdue" | "unset";
    slaDays: number;
    stepLabel: string | null;
    explanation: string;
    dueAt: string | null;
  };
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AdminStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  PENDING_48H: {
    label: ADMIN_STAGE_CATALOG.PENDING_48H.label,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  PUBLISHED: {
    label: ADMIN_STAGE_CATALOG.PUBLISHED.label,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: <FileCheck className="w-3 h-3" />,
  },
  DOCUMENTS_CHECK: {
    label: ADMIN_STAGE_CATALOG.DOCUMENTS_CHECK.label,
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
    icon: <Send className="w-3 h-3" />,
  },
  SUBMITTED: {
    label: ADMIN_STAGE_CATALOG.SUBMITTED.label,
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
    icon: <Globe className="w-3 h-3" />,
  },
  APPROVED: {
    label: ADMIN_STAGE_CATALOG.APPROVED.label,
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: <CheckCircle className="w-3 h-3" />,
  },
};

const ADMIN_STATUS_SEQUENCE: AdminStatus[] = [...ADMIN_STAGE_SEQUENCE];
const PAYMENT_STATUS_LABELS: Record<string, string> = { SUCCESS: "Payé", PENDING: "En attente", FAILED: "Échec", CANCELLED: "Annulé", NOT_PAID: "Non payé" };
const PAYMENT_STATUS_BADGE_CLASSES: Record<string, string> = { SUCCESS: "border-emerald-200 bg-emerald-50 text-emerald-800", PENDING: "border-amber-200 bg-amber-50 text-amber-800", FAILED: "border-rose-200 bg-rose-50 text-rose-800", CANCELLED: "border-slate-300 bg-slate-100 text-slate-700", NOT_PAID: "border-slate-300 bg-white text-slate-700" };
const PROCEDURE_STEP_LABELS: Record<string, string> = {
  PENDING_48H: ADMIN_STAGE_CATALOG.PENDING_48H.label,
  PUBLISHED: ADMIN_STAGE_CATALOG.PUBLISHED.label,
  DOCUMENTS_CHECK: ADMIN_STAGE_CATALOG.DOCUMENTS_CHECK.label,
  SUBMITTED: ADMIN_STAGE_CATALOG.SUBMITTED.label,
  APPROVED: ADMIN_STAGE_CATALOG.APPROVED.label,
};
const PROCEDURE_STEP_BADGE_CLASSES: Record<string, string> = { PENDING_48H: "border-violet-200 bg-violet-50 text-violet-800", PUBLISHED: "border-amber-200 bg-amber-50 text-amber-800", DOCUMENTS_CHECK: "border-blue-200 bg-blue-50 text-blue-800", SUBMITTED: "border-indigo-200 bg-indigo-50 text-indigo-800", APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800" };

function procedureStageLabel(candidate: { procedureJourney?: AdminProcedureSnapshot | null }, stage: string): string {
  const fromJourney = candidate.procedureJourney?.stageLabels?.[stage as keyof NonNullable<AdminProcedureSnapshot["stageLabels"]>];
  return fromJourney || PROCEDURE_STEP_LABELS[stage] || stage;
}

function getNextAdminStatus(status?: string): AdminStatus | null {
  return getNextAdminStage(status) as AdminStatus | null;
}

function getPreviousAdminStatus(status?: string): AdminStatus | null {
  return getPreviousAdminStage(status) as AdminStatus | null;
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

const DESTINATION_OPTIONS = POPULAR_DESTINATION_NAMES;

const PROJECT_TYPE_OPTIONS = [...ADMIN_PROCEDURE_TYPES];

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
  { label: "Planificateur", hint: "Tester les relances et consulter l’historique", tab: "scheduler" },
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
  sessionToken,
  onClose,
  onStatusUpdated,
  onOpenOperations,
  onNavigateToCandidate,
  onOpenFullActivation,
  openEvaluationEditor = false,
}: {
  candidateId: string;
  sessionToken: string;
  onClose: () => void;
  onStatusUpdated: () => void;
  onOpenOperations: (area: "payments" | "documents" | "emails", folderCode: string) => void;
  onNavigateToCandidate?: (candidateId: string) => void;
  /** Ouvre l’assistant d’activation complet (liste Pré-dossiers) pour ce compte. */
  onOpenFullActivation?: (accountId: number) => void;
  openEvaluationEditor?: boolean;
}) {
  const { toast } = useToast();
  const [notifyClient, setNotifyClient] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<AdminStatus | "">("");
  const [preDossierDestination, setPreDossierDestination] = useState("");
  const [preDossierVisaType, setPreDossierVisaType] = useState("");
  const [preDossierNotes, setPreDossierNotes] = useState("");
  const [preDossierConfirmationOpen, setPreDossierConfirmationOpen] = useState(false);
  const [preDossierActivationError, setPreDossierActivationError] = useState<string | null>(null);
  const [paymentConfirmedOptimistically, setPaymentConfirmedOptimistically] = useState(false);
  const [evaluationEditorOpen, setEvaluationEditorOpen] = useState(false);
  const [candidate360Tab, setCandidate360Tab] = useState<"overview" | "evaluation" | "documents" | "payments" | "messages" | "history">("overview");
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [rollbackReason, setRollbackReason] = useState("");
  const [portraitPreviewOpen, setPortraitPreviewOpen] = useState(false);
  const { data, isLoading, error, refetch } = trpc.admin.getCandidateDetails.useQuery(
    { sessionToken, candidateId },
    {
      enabled: !!candidateId && !!sessionToken,
      placeholderData: (previous) => previous,
      retry: 2,
    }
  );
  const candidate = data?.candidate;
  const paymentSnapshot = (data as { payments?: Array<{ status?: string | null; validatedBy?: string | null; validatedAt?: string | Date | null; paidAt?: string | Date | null; amount?: number | null; currency?: string | null }> } | undefined)?.payments?.[0];
  const paymentAlreadyConfirmed = paymentConfirmedOptimistically
    || ["SUCCESS", "success", "completed", "paye", "paid"].includes(String(paymentSnapshot?.status ?? ""))
    || ["SUCCESS", "success", "completed", "paye", "paid"].includes(String((candidate as Candidate | undefined)?.paymentStatus ?? ""));
  const nextAdminStatus = getNextAdminStatus(candidate?.status);
  const previousAdminStatus = getPreviousAdminStatus(candidate?.status);
  const stageCoherence = (data as { stageCoherence?: {
    procedureKind?: string;
    employerSelected?: boolean;
    guided?: GuidedNextAction;
    stages?: Array<{ stage: string; label: string; detail: string; clientLabel: string; prerequisites: string[]; current: boolean }>;
  } } | undefined)?.stageCoherence;
  const guidedNext: GuidedNextAction = stageCoherence?.guided ?? resolveGuidedNextAdminAction({
    currentStatus: candidate?.status,
    paymentConfirmed: paymentAlreadyConfirmed,
    protocolSigned: Boolean((candidate as any)?.agreementSigned),
    procedureKind: (stageCoherence?.procedureKind as any) ?? null,
    visaType: candidate?.projectType,
    employerSelected: Boolean(stageCoherence?.employerSelected || (candidate as any)?.secondProtocolReady),
    secondProtocolReady: Boolean((candidate as any)?.secondProtocolReady),
    secondProtocolSigned: Boolean((candidate as any)?.secondProtocolSigned),
    checklistPercent: (candidate as any)?.checklistPercent ?? null,
  });
  const isPreDossierAccount = candidate?.source === "ACCOUNT_ONLY";
  const evaluationBlocksActivation = isPreDossierAccount
    && candidate?.evaluationDeclarationStatus !== "not_declared"
    && candidate?.evaluationDeclarationStatus !== "validated";
  const evaluationEditorSourceType = evaluationSourceTypeOf(candidate);
  const preDossierCvUrl = (() => {
    const fromDoc = (data as { cvDocument?: { documentUrl?: string | null } } | undefined)?.cvDocument?.documentUrl;
    const fromEval = (data as { evaluationContext?: { cvFileUrl?: string | null } } | undefined)?.evaluationContext?.cvFileUrl;
    const url = fromDoc || fromEval || null;
    return isOpenableStoredUrl(url) ? url : null;
  })();
  const preDossierCvName = (data as { cvDocument?: { fileName?: string | null } } | undefined)?.cvDocument?.fileName
    || (data as { evaluationContext?: { cvFileName?: string | null } } | undefined)?.evaluationContext?.cvFileName
    || "CV préévaluation";
  const [relancePendingKey, setRelancePendingKey] = useState<string | null>(null);
  const [relanceSentKeys, setRelanceSentKeys] = useState<Record<string, true>>({});
  const sendDynamicRelanceMutation = trpc.adminCandidateManagement.sendDynamicRelance.useMutation({
    onSuccess: (result, variables) => {
      if (!variables) return;
      const key = `${variables.stage}:${variables.channel}`;
      setRelancePendingKey(null);
      setRelanceSentKeys((prev) => ({ ...prev, [key]: true }));
      if (variables.channel === "email" || variables.channel === "both") {
        toast({
          title: result.emailSent ? "E-mail bien parti" : "E-mail non délivré",
          description: result.emailSent
            ? `${result.message} Le candidat le reçoit aussi dans son espace (entête 3M).`
            : `${result.message} Vérifiez la configuration e-mail ou renvoyez plus tard.`,
          variant: result.emailSent ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Relance déposée",
          description: result.message,
        });
      }
      if (variables.channel === "whatsapp" || variables.channel === "both") {
        if (result.whatsappUrl) {
          window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
        } else if (variables.channel === "whatsapp") {
          toast({ title: "WhatsApp", description: "Message déposé dans l’espace client ; téléphone manquant pour ouvrir WhatsApp.", variant: "destructive" });
        }
      }
      void refetch();
      onStatusUpdated();
    },
    onError: (err) => {
      setRelancePendingKey(null);
      toast({ title: "Relance impossible", description: err.message, variant: "destructive" });
    },
  });
  const openPreDossierRelance = (stage: AdminRelanceStage, channel: "email" | "whatsapp") => {
    if (!candidate) return;
    const key = `${stage}:${channel}`;
    if (relanceSentKeys[key] || sendDynamicRelanceMutation.isPending) return;
    setRelancePendingKey(key);
    sendDynamicRelanceMutation.mutate({
      sessionToken,
      candidateId: candidate.id,
      stage,
      channel,
      useAi: true,
    });
  };
  const archivePreDossierMutation = trpc.admin.archiveDuplicateRecord.useMutation({
    onError: (error) => toast({ title: "Nettoyage du pré-dossier impossible", description: `Le dossier lié reste consultable, mais l’ancien pré-dossier n’a pas pu être archivé : ${error.message}`, variant: "destructive" }),
  });
  const requestPassportPhotoMutation = trpc.adminCandidateManagement.reviewPortrait.useMutation({
    onSuccess: (result) => {
      toast({ title: "Photo de profil", description: (result as any).message || "Demande enregistrée." });
      void refetch();
      onStatusUpdated();
    },
    onError: (err) => toast({ title: "Demande photo impossible", description: err.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (candidate && openEvaluationEditor) setEvaluationEditorOpen(true);
  }, [candidate, openEvaluationEditor]);

  useEffect(() => {
    setPortraitPreviewOpen(false);
    setRelancePendingKey(null);
    setRelanceSentKeys({});
  }, [candidateId]);

  // EVAL-AG-{id} = miroir du dossier actif 3M-AGN-{id} : ouvrir uniquement le 3M.
  useEffect(() => {
    const redirectId = (data as { redirectToCanonicalAgencyId?: string | null } | undefined)?.redirectToCanonicalAgencyId;
    if (!redirectId || redirectId === candidateId) return;
    toast({
      title: "Dossier actif 3M",
      description: `${candidate?.folderCode || "EVAL-AG"} est un miroir de préparation. Ouverture du dossier actif ${redirectId.replace(/^agency_/, "3M-AGN-")}.`,
    });
    onNavigateToCandidate?.(redirectId);
  }, [data, candidateId, candidate?.folderCode, onNavigateToCandidate]);

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
      setPreDossierActivationError(null);
      setPreDossierConfirmationOpen(false);
      const passportNote = (result as { passportPhotoRequested?: boolean; passportPhotoEmailSent?: boolean }).passportPhotoRequested
        ? ((result as { passportPhotoEmailSent?: boolean }).passportPhotoEmailSent
          ? " Photo type passeport exigée : e-mail et notification envoyés (remplace la photo de profil)."
          : " Photo type passeport exigée dans l’espace client (e-mail à relancer si besoin).")
        : "";
      toast({
        title: "Dossier activé",
        description: (result.emailSent
          ? "Le dossier est actif dans l’espace client et la confirmation a été envoyée."
          : "Le dossier est actif dans l’espace client ; la confirmation e-mail devra être relancée.") + passportNote,
      });
      onStatusUpdated();
      onClose();
    },
    onError: (err) => {
      const message = err.message || "Le dossier n’a pas pu être activé. Vérifiez l’état du dossier et réessayez.";
      setPreDossierActivationError(message);
      toast({ title: "Activation impossible", description: message, variant: "destructive" });
    },
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
  const offlineEvaluationMutation = trpc.adminCandidateManagement.validateOfflineEvaluation.useMutation({
    onSuccess: () => {
      toast({ title: "Évaluation hors ligne validée", description: "Le canal, le conseiller et la date sont enregistrés dans le dossier." });
      void refetch();
      onStatusUpdated();
    },
    onError: (err) => toast({ title: "Validation hors ligne impossible", description: err.message, variant: "destructive" }),
  });
  const requestRegistrationInfoMutation = trpc.adminCandidateManagement.requestRegistrationSupplementaryInfo.useMutation({
    onSuccess: (result) => {
      toast({
        title: result.alreadySent ? "Demande déjà envoyée" : "Demande d’informations envoyée",
        description: result.message,
      });
      void refetch();
      onStatusUpdated();
    },
    onError: (err) => toast({ title: "Demande d’informations impossible", description: err.message, variant: "destructive" }),
  });
  const detailUtils = trpc.useUtils();
  const printReceiptA5 = async (candidateRef: string) => {
    try {
      const result = await detailUtils.adminCandidateManagement.getPaymentReceiptA5Html.fetch({ sessionToken, candidateId: candidateRef });
      // Sans noopener : window.open(..., "noopener") renvoie null et bloquait l’impression.
      const blob = new Blob([result.html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank", "width=900,height=700");
      if (!printWindow) {
        URL.revokeObjectURL(url);
        toast({ title: "Pop-up bloquée", description: "Autorisez les fenêtres pour imprimer le reçu A5.", variant: "destructive" });
        return;
      }
      printWindow.focus();
      const triggerPrint = () => {
        try { printWindow.print(); } catch { /* ignore */ }
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      };
      printWindow.addEventListener?.("load", triggerPrint);
      window.setTimeout(triggerPrint, 400);
    } catch (error) {
      toast({
        title: "Reçu A5 indisponible",
        description: error instanceof Error ? error.message : "Impossible de générer le reçu A5.",
        variant: "destructive",
      });
    }
  };

  const confirmPaymentForCandidateMutation = trpc.adminCandidateManagement.confirmPaymentForCandidate.useMutation({
    onSuccess: (result) => {
      setPaymentConfirmedOptimistically(true);
      toast({
        title: result.alreadyConfirmed ? "Paiement déjà confirmé" : "Paiement confirmé",
        description: result.packageSent
          ? `${result.dossierNumber} — validation enregistrée pour ${result.fullName}. Le reçu et le protocole d’accord N°01 ont été envoyés ensemble au candidat.`
          : result.packageError
            ? `${result.dossierNumber} — paiement validé, mais le reçu et le protocole n’ont pas pu partir : ${result.packageError} Relancez « Envoyer reçu + protocole ».`
            : `${result.dossierNumber} — validation enregistrée pour ${result.fullName}.`,
      });
      if (result.receiptA5Ready && candidate?.id) {
        void printReceiptA5(candidate.id);
      }
      void refetch();
      onStatusUpdated();
    },
    onError: (err) => toast({ title: "Validation du paiement impossible", description: err.message, variant: "destructive" }),
  });

  useEffect(() => {
    setPaymentConfirmedOptimistically(false);
  }, [candidateId]);

  useEffect(() => {
    if (!isPreDossierAccount || !candidate) return;
    const rawDestination = candidate.destinationCountry === "Non spécifiée" ? "" : candidate.destinationCountry;
    setPreDossierDestination(rawDestination ? (getCandidateDestinationOption(rawDestination)?.name ?? rawDestination) : "");
    setPreDossierVisaType(
      !candidate.projectType || candidate.projectType === "À qualifier"
        ? ""
        : normalizeAdminProcedureType(candidate.projectType),
    );
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
      <Dialog open={!evaluationEditorOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] !max-w-none overflow-y-auto rounded-2xl border-0 bg-slate-50 p-0 shadow-2xl transition-opacity duration-200 sm:h-[calc(100vh-2rem)] sm:w-[calc(100vw-2rem)] sm:!max-w-none">
        <DialogHeader className="sticky top-0 z-20 border-b border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-7">
          <DialogTitle className="flex items-center gap-2 text-lg text-blue-950 sm:text-xl">
            <Users className="h-5 w-5" />
            Poste de pilotage dossier 360°
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-500">Gérez l’intégralité du dossier : procédure, évaluation, documents, paiements, échanges et historique.</p>
        </DialogHeader>

        {isLoading ? (
          <div className="mx-auto grid max-w-[1920px] gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:p-7" data-testid="candidate360-loading-skeleton" aria-busy="true" aria-live="polite">
            <div className="space-y-5">
              <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
                <div className="h-16 w-16 animate-pulse rounded-full bg-blue-200" />
                <div className="flex-1 space-y-3"><div className="h-5 w-56 animate-pulse rounded bg-blue-200" /><div className="h-3 w-32 animate-pulse rounded bg-blue-100" /><div className="h-8 w-44 animate-pulse rounded bg-blue-100" /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2"><div className="h-36 animate-pulse rounded-xl bg-white" /><div className="h-36 animate-pulse rounded-xl bg-white" /></div>
              <div className="h-64 animate-pulse rounded-xl bg-white" />
            </div>
            <aside className="space-y-4"><div className="h-52 animate-pulse rounded-xl bg-white" /><div className="h-36 animate-pulse rounded-xl bg-white" /></aside>
            <div className="col-span-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-800"><RefreshCw className="h-4 w-4 animate-spin" />Synchronisation de la fiche 360°…</div>
          </div>
        ) : candidate ? (
          <div className="mx-auto grid max-w-[1920px] gap-6 p-4 transition-opacity duration-200 xl:grid-cols-[minmax(0,1fr)_320px] xl:p-7">
            <div className="min-w-0 space-y-5">
            {/* En-tête candidat avec avatar et actions */}
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-4">
                {candidate.avatarUrl ? (
                  <button
                    type="button"
                    className="group relative shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    onClick={() => setPortraitPreviewOpen(true)}
                    aria-label={`Agrandir la photo de ${candidate.fullName}`}
                    data-testid="candidate-portrait-preview-trigger"
                  >
                    <img
                      src={candidate.avatarUrl}
                      alt={candidate.fullName}
                      className="h-16 w-16 rounded-full border-2 border-blue-600 object-cover shadow-md transition group-hover:brightness-95"
                    />
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/45 group-hover:opacity-100">
                      <Eye className="h-5 w-5" />
                    </span>
                  </button>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-md">
                    {candidate.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-blue-900">{candidate.fullName}</h3>
                  <p className="text-sm font-mono font-semibold text-blue-600">{candidate.folderCode}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {candidate.whatsapp && (
                      <a
                        href={`https://wa.me/${candidate.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-green-700 px-2.5 py-1 text-xs text-white transition hover:bg-green-800"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs text-white transition hover:bg-blue-700 disabled:opacity-60"
                      disabled={sendDynamicRelanceMutation.isPending || Boolean(relanceSentKeys["generic:email"])}
                      onClick={() => openPreDossierRelance("generic", "email")}
                      data-testid="candidate-header-email-relance"
                    >
                      <Mail className="h-3.5 w-3.5" /> {relanceSentKeys["generic:email"] ? "E-mail envoyé" : "E-mail"}
                    </button>
                    {candidate.avatarUrl && (
                      <>
                        <Button type="button" size="sm" variant="outline" className="h-7 border-blue-200 bg-white px-2 text-xs" onClick={() => setPortraitPreviewOpen(true)} data-testid="candidate-portrait-view">
                          <Eye className="mr-1 h-3.5 w-3.5" />Voir photo
                        </Button>
                        <a
                          href={candidate.avatarUrl}
                          download={`photo-${String(candidate.fullName || "candidat").replace(/[^\w.-]+/g, "_")}.jpg`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-blue-200 bg-white px-2 text-xs font-medium text-slate-800 hover:bg-blue-50"
                          data-testid="candidate-portrait-download"
                        >
                          <Download className="h-3.5 w-3.5" />Photo
                        </a>
                      </>
                    )}
                    {preDossierCvUrl ? (
                      <>
                        <a
                          href={preDossierCvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-indigo-300 bg-indigo-50 px-2 text-xs font-semibold text-indigo-950 hover:bg-indigo-100"
                          data-testid="candidate-cv-open"
                          title={preDossierCvName}
                        >
                          <FileText className="h-3.5 w-3.5" />Voir CV
                        </a>
                        <a
                          href={preDossierCvUrl}
                          download={preDossierCvName.replace(/[^\w.-]+/g, "_")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-indigo-300 bg-white px-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-50"
                          data-testid="candidate-cv-download"
                        >
                          <Download className="h-3.5 w-3.5" />Télécharger CV
                        </a>
                      </>
                    ) : (
                      <Badge className="border-amber-300 bg-amber-50 text-amber-950" data-testid="candidate-cv-missing">
                        CV non reçu
                      </Badge>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 border-amber-300 bg-amber-50 px-2 text-xs text-amber-950 hover:bg-amber-100"
                      disabled={requestPassportPhotoMutation.isPending}
                      onClick={() =>
                        requestPassportPhotoMutation.mutate({
                          sessionToken,
                          candidateId,
                          decision: "request_passport",
                        })
                      }
                      data-testid="candidate-portrait-request-passport"
                    >
                      <ImagePlus className="mr-1 h-3.5 w-3.5" />
                      {requestPassportPhotoMutation.isPending ? "Envoi…" : "Demander photo passeport"}
                    </Button>
                  </div>
                  <p className="mt-1.5 max-w-xl text-[11px] leading-4 text-slate-600">
                    {preDossierCvUrl
                      ? `CV préévaluation : ${preDossierCvName}. Après activation visa travail : photo type passeport obligatoire pour employeurs.`
                      : "Aucun CV rattaché à ce précompte — relancez le candidat avant le bilan. Après activation visa travail : photo type passeport obligatoire pour employeurs."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge status={candidate.status} />
                <SourceBadge source={candidate.source} />
              </div>
            </div>
            {portraitPreviewOpen && candidate.avatarUrl && (
              <div
                className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4"
                role="dialog"
                aria-modal="true"
                aria-label={`Photo de ${candidate.fullName}`}
                onClick={() => setPortraitPreviewOpen(false)}
                data-testid="candidate-portrait-modal"
              >
                <div className="relative max-h-[90vh] w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{candidate.fullName}</p>
                      <p className="text-xs text-slate-500">Aperçu photo de profil · {candidate.folderCode}</p>
                    </div>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setPortraitPreviewOpen(false)} aria-label="Fermer l’aperçu">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <img src={candidate.avatarUrl} alt={`Photo de ${candidate.fullName}`} className="max-h-[70vh] w-full rounded-xl bg-slate-100 object-contain" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={candidate.avatarUrl}
                      download={`photo-${String(candidate.fullName || "candidat").replace(/[^\w.-]+/g, "_")}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                      <Download className="h-4 w-4" />Télécharger la photo
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-amber-300 text-amber-950"
                      disabled={requestPassportPhotoMutation.isPending}
                      onClick={() =>
                        requestPassportPhotoMutation.mutate({
                          sessionToken,
                          candidateId,
                          decision: "request_passport",
                        })
                      }
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />Demander une photo type passeport
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isPreDossierAccount ? (
              <>
                {(data as any)?.cockpit ? (
                  <AdminCandidateCockpitStrip
                    cockpit={(data as any).cockpit}
                    onTreatNow={(target) => {
                      if (target.tab === "evaluation" || target.key === "evaluation_missing" || target.key === "evaluation_pending" || target.key === "request_evaluation" || target.key === "review_evaluation" || target.key === "validate_evaluation") {
                        setEvaluationEditorOpen(true);
                        document.getElementById("predossier-evaluation-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        toast({ title: "Évaluation", description: "Ouvrez ou validez l’évaluation pour lever ce bloqueur." });
                        return;
                      }
                      if (target.tab === "payments" || target.key === "payment_missing" || target.key === "confirm_payment" || target.key === "receipt_missing") {
                        onOpenOperations("payments", candidate.folderCode);
                        toast({ title: "Paiements", description: `Module paiements ouvert pour ${candidate.folderCode}.` });
                        return;
                      }
                      if (target.tab === "documents" || target.key === "documents_pending") {
                        onOpenOperations("documents", candidate.folderCode);
                        toast({ title: "Documents", description: `Module documents ouvert pour ${candidate.folderCode}.` });
                        return;
                      }
                      if (target.tab === "messages") {
                        onOpenOperations("emails", candidate.folderCode);
                        toast({ title: "E-mails", description: `Module e-mails ouvert pour ${candidate.folderCode}.` });
                        return;
                      }
                      document.getElementById("predossier-treatment-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      toast({
                        title: "Traitement pré-dossier",
                        description:
                          target.key === "confirm_email" || target.key === "email_unverified"
                            ? "Confirmez l’e-mail puis poursuivez l’ouverture du dossier."
                            : "Complétez destination et procédure, puis ouvrez le dossier pour activer le suivi.",
                      });
                    }}
                  />
                ) : null}
                <section
                  id="predossier-pilotage-panel"
                  className="scroll-mt-24 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 shadow-sm"
                  data-testid="predossier-pilotage-panel"
                  aria-label="Pilotage et relances du précompte"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Pilotage précompte</p>
                      <h4 className="mt-1 text-lg font-bold text-slate-950">Relancer et convaincre d’ouvrir le dossier</h4>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                        Boutons bleus = prêts à envoyer. Au clic : toast de confirmation, puis le bouton passe à « Envoyé » (verrouillé) pour éviter les doublons. Message pro dans l’espace client (entête 3M) + boîte mail.
                      </p>
                    </div>
                    <Badge className={preDossierCvUrl ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}>
                      {preDossierCvUrl ? "CV reçu" : "CV manquant"}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {([
                      { stage: "email_unverified" as const, label: "Confirmer l’e-mail", hint: "Lien de confirmation" },
                      { stage: "cv_missing" as const, label: "Demander le CV", hint: "Obligatoire pour un bilan complet" },
                      { stage: "evaluation_missing" as const, label: "Finaliser l’évaluation", hint: "Formulaire + contexte visa" },
                      { stage: "payment_pending" as const, label: "Frais d’ouverture", hint: "Avant protocole N°01" },
                      { stage: "conversion_open_dossier" as const, label: "Convaincre d’ouvrir", hint: "Passage COMPTE → 3M" },
                      { stage: "generic" as const, label: "Relance générale", hint: "Message libre adapté" },
                    ]).map((item) => {
                      const mailKey = `${item.stage}:email`;
                      const waKey = `${item.stage}:whatsapp`;
                      const mailSent = Boolean(relanceSentKeys[mailKey]);
                      const waSent = Boolean(relanceSentKeys[waKey]);
                      const mailPending = relancePendingKey === mailKey;
                      const waPending = relancePendingKey === waKey;
                      const busy = sendDynamicRelanceMutation.isPending;
                      return (
                      <div key={item.stage} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm" data-testid={`predossier-relance-card-${item.stage}`}>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{item.hint}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className={`h-8 text-xs ${waSent ? "border-emerald-400 bg-emerald-100 font-semibold text-emerald-900" : "border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100"}`}
                            disabled={busy || waSent || !candidate.whatsapp}
                            aria-busy={waPending}
                            aria-disabled={busy || waSent || !candidate.whatsapp}
                            title={!candidate.whatsapp ? "Téléphone manquant — WhatsApp indisponible" : waSent ? "Déjà envoyé — verrouillé pour éviter un doublon" : waPending ? "Envoi en cours…" : "Accessible : dépose dans l’espace puis ouvre WhatsApp"}
                            onClick={() => openPreDossierRelance(item.stage, "whatsapp")}
                            data-testid={`predossier-relance-wa-${item.stage}`}
                            data-relance-state={waSent ? "sent" : waPending ? "pending" : candidate.whatsapp ? "ready" : "unavailable"}
                          >
                            {waPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : waSent ? <CheckCircle className="mr-1 h-3.5 w-3.5" /> : <MessageSquare className="mr-1 h-3.5 w-3.5" />}
                            {waSent ? "Envoyé" : waPending ? "Envoi…" : "WhatsApp"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className={`h-8 text-xs ${mailSent ? "bg-emerald-700 text-white hover:bg-emerald-700" : "bg-blue-700 text-white hover:bg-blue-800"}`}
                            disabled={busy || mailSent || !candidate.email}
                            aria-busy={mailPending}
                            aria-disabled={busy || mailSent || !candidate.email}
                            title={!candidate.email ? "E-mail candidat manquant" : mailSent ? "Déjà envoyé — verrouillé pour éviter un doublon" : mailPending ? "Envoi en cours…" : "Accessible : envoie e-mail + espace client"}
                            onClick={() => openPreDossierRelance(item.stage, "email")}
                            data-testid={`predossier-relance-mail-${item.stage}`}
                            data-relance-state={mailSent ? "sent" : mailPending ? "pending" : candidate.email ? "ready" : "unavailable"}
                          >
                            {mailPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : mailSent ? <CheckCircle className="mr-1 h-3.5 w-3.5" /> : <Mail className="mr-1 h-3.5 w-3.5" />}
                            {mailSent ? "E-mail envoyé" : mailPending ? "Envoi…" : "Envoyer e-mail"}
                          </Button>
                        </div>
                        {!candidate.whatsapp ? (
                          <p className="mt-2 text-[10px] text-slate-500">WhatsApp grisé : numéro manquant.</p>
                        ) : null}
                      </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-indigo-700 hover:bg-indigo-800"
                      onClick={() => setEvaluationEditorOpen(true)}
                      data-testid="predossier-open-eval-editor"
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" />Préparer / envoyer le bilan
                    </Button>
                    {preDossierCvUrl ? (
                      <a
                        href={preDossierCvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-indigo-300 bg-white px-3 text-sm font-semibold text-indigo-950 hover:bg-indigo-50"
                        data-testid="predossier-pilotage-cv-open"
                      >
                        <Eye className="h-3.5 w-3.5" />Ouvrir le CV
                      </a>
                    ) : null}
                  </div>
                </section>
                <div id="predossier-evaluation-panel" className="scroll-mt-24">
                <AdminPreDossierEvaluationPanel
                  status={candidate.evaluationDeclarationStatus}
                  declaredAt={candidate.evaluationDeclaredAt}
                  reviewedAt={candidate.evaluationReviewedAt}
                  reviewedBy={candidate.evaluationReviewedBy}
                  reviewNote={candidate.evaluationReviewNote}
                  isReviewing={reviewEvaluationMutation.isPending}
                  onReview={(decision, note) => reviewEvaluationMutation.mutate({ sessionToken, candidateId: candidate.internalId, decision, note })}
                  onOpenEditor={() => setEvaluationEditorOpen(true)}
                  onOfflineValidate={(channel, note) => offlineEvaluationMutation.mutate({ sessionToken, candidateId: candidate.id, channel, note })}
                  isOfflineValidating={offlineEvaluationMutation.isPending}
                />
                </div>
                {candidate?.internalStatus === "nouveau" ? (
                  <section id="predossier-treatment-panel" className="scroll-mt-24 rounded-xl border border-blue-200 bg-white p-5 shadow-sm" aria-label="Actions de traitement du compte pré-dossier">
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
                      <div>
                        <Label htmlFor="predossier-destination-modal">Pays de destination confirmé</Label>
                        <div className="mt-2">
                          <CountrySelect
                            id="predossier-destination-modal"
                            value={preDossierDestination}
                            onChange={setPreDossierDestination}
                            placeholder="Choisir le pays exact…"
                            ariaLabel="Pays de destination confirmé"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="predossier-procedure-modal">Type de visa / procédure</Label>
                        <Select value={preDossierVisaType} onValueChange={setPreDossierVisaType}>
                          <SelectTrigger id="predossier-procedure-modal" className="mt-2">
                            <SelectValue placeholder="Choisir la procédure…" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4"><Label htmlFor="predossier-notes-modal">Note interne</Label><textarea id="predossier-notes-modal" value={preDossierNotes} onChange={(event) => setPreDossierNotes(event.target.value)} placeholder="Pièces déposées, suite attendue, décision de l’agence…" maxLength={2000} className="mt-2 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" /></div>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button onClick={() => setPreDossierConfirmationOpen(true)} disabled={isPreDossierActivationDisabled} aria-describedby="predossier-activation-guidance" className="bg-blue-700 hover:bg-blue-800"><FileCheck className="mr-2 h-4 w-4" />Ouvrir le dossier et activer le suivi</Button>
                      {onOpenFullActivation && candidate?.internalId ? (
                        <Button
                          type="button"
                          variant="outline"
                          data-testid="predossier-open-full-activation"
                          onClick={() => onOpenFullActivation(candidate.internalId)}
                          className="border-blue-300 text-blue-900"
                        >
                          <FolderPlus className="mr-2 h-4 w-4" />
                          Assistant d’activation complet
                        </Button>
                      ) : null}
                      <p id="predossier-activation-guidance" role="status" aria-live="polite" className="text-xs text-slate-500">{preDossierActivationGuidance}</p>
                    </div>
                  </section>
                ) : (
                  <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm" aria-label="Dossier déjà activé">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Dossier déjà ouvert</p>
                    <h4 className="mt-1 text-lg font-bold text-slate-950">Ce compte a déjà été activé</h4>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">
                      Ce n’est plus un pré-dossier : l’ouverture a déjà été confirmée{(candidate as any)?.linkedAgencyDossierDestination ? ` pour ${(candidate as any).linkedAgencyDossierDestination}` : ""}.
                      {!(candidate as any)?.linkedAgencyDossierReference && " Recherchez ce candidat dans l’onglet Dossiers pour retrouver son dossier actif."}
                    </p>
                    {(candidate as any)?.linkedAgencyDossierReference && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={archivePreDossierMutation.isPending}
                          className="mt-3 bg-emerald-700 hover:bg-emerald-800"
                          onClick={async () => {
                            const linkedReference = (candidate as any).linkedAgencyDossierReference;
                            const linkedId = (candidate as any).linkedAgencyDossierId;
                            const folderCode = candidate?.folderCode;
                            try {
                              await archivePreDossierMutation.mutateAsync({
                                sessionToken,
                                candidateId,
                                reason: `Pré-dossier obsolète : dossier agence ${linkedReference} déjà ouvert et suivi.`,
                                confirmation: "CORBEILLE",
                              });
                              toast({ title: "Pré-dossier archivé", description: `${folderCode} a été placé dans la corbeille réversible ; le dossier actif ${linkedReference} reste consultable.` });
                              onStatusUpdated();
                            } catch {
                              // Le pré-dossier reste actif ; l’admin peut quand même consulter le dossier lié.
                            }
                            setCandidate360Tab("overview");
                            onNavigateToCandidate?.(`agency_${linkedId}`);
                          }}
                          aria-label={`Ouvrir le dossier actif ${(candidate as any).linkedAgencyDossierReference} et archiver ce pré-dossier`}
                        >
                          {archivePreDossierMutation.isPending ? "Archivage du pré-dossier…" : `Ouvrir le dossier ${(candidate as any).linkedAgencyDossierReference}`}
                        </Button>
                        <p className="mt-2 text-xs text-emerald-800">L’ouverture archive automatiquement ce pré-dossier (réversible depuis la corbeille) puisque le dossier actif est déjà suivi.</p>
                      </>
                    )}
                  </section>
                )}
              </>
            ) : (
              <Candidate360Workspace
                sessionToken={sessionToken}
                candidate={candidate as any}
                siblingProcedures={((candidate as Candidate).siblingProcedures ?? []).map((sibling) => ({
                  id: sibling.id,
                  folderCode: sibling.folderCode,
                  projectType: sibling.projectType,
                  destinationCountry: sibling.destinationCountry,
                  paymentStatus: sibling.paymentStatus,
                  status: sibling.status,
                  procedureLabel: sibling.procedureLabel,
                }))}
                onSelectSibling={(siblingId) => {
                  onNavigateToCandidate?.(siblingId);
                }}
                onRefresh={() => {
                  void refetch();
                  onStatusUpdated();
                }}
                initialTab={candidate360Tab}
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
                  {candidate.whatsapp && <a href={`https://wa.me/${candidate.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"><MessageSquare className="h-4 w-4" />WhatsApp</a>}
                  <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60" disabled={sendDynamicRelanceMutation.isPending || Boolean(relanceSentKeys["generic:email"])} onClick={() => openPreDossierRelance("generic", "email")} data-testid="candidate-aside-email-relance"><Mail className="h-4 w-4" />{relanceSentKeys["generic:email"] ? "E-mail envoyé" : "E-mail"}</button>
                </div>
              </section>
              <AdminRegistrationProfile
                profile={(candidate as any).registrationProfile}
                fullName={candidate.fullName}
                email={candidate.email}
                cvDocument={(data as any)?.cvDocument ?? null}
                hasCv={Boolean((candidate as any).hasCv || (data as any)?.cvDocument?.documentUrl)}
                evaluationCompleted={Boolean(
                  candidate.evaluationDeclarationStatus === "validated"
                  || candidate.evaluationReviewedAt
                  || (candidate as any).evaluationValidatedAt
                  || (data as any)?.evaluationClientConfirmed
                  || (data as any)?.evaluationClientConfirmedAt
                  || String((data as any)?.candidate?.evaluationDeliveryStatus || (candidate as any).evaluationDeliveryStatus || "").toLowerCase() === "sent"
                  || String((candidate as any).internalStatus || "").toLowerCase() === "bilan_envoye"
                )}
                infoRequestAlreadySent={Boolean(
                  (candidate as any).registrationInfoRequestSentAt
                  || (data as any)?.registrationInfoRequestSentAt
                  || ((data as any)?.communications?.notifications || []).some((row: { type?: string }) => row.type === "registration_info_request")
                )}
                isRequestingInfo={requestRegistrationInfoMutation.isPending}
                onRequestInfo={({ destination, visaType }) =>
                  requestRegistrationInfoMutation.mutate({
                    sessionToken,
                    candidateId,
                    destination,
                    visaType,
                    forceResend: Boolean(
                      (candidate as any).registrationInfoRequestSentAt
                      || (data as any)?.registrationInfoRequestSentAt
                      || ((data as any)?.communications?.notifications || []).some((row: { type?: string }) => row.type === "registration_info_request")
                    ),
                  })
                }
              />

              {!isPreDossierAccount && <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-5" data-testid="pilotage-decision-panel">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Pilotage guidé</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{candidate.projectType || "Procédure à qualifier"}</p>
                <p className="mt-1 font-mono text-xs text-blue-800">{candidate.folderCode}</p>
                {Array.isArray((candidate as any).formerFolderCodes) && (candidate as any).formerFolderCodes.length > 0 && (
                  <p className="mt-1 text-[11px] text-slate-500">Variante : {(candidate as any).formerFolderCodes.join(" · ")}</p>
                )}
                <div className="mt-4 space-y-3 border-t border-blue-100 pt-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3" data-testid="guided-next-action">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Prochaine action utile</p>
                    {paymentAlreadyConfirmed ? (
                      <div className="mt-2 rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-900" role="status" data-testid="payment-already-confirmed">
                        <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Paiement déjà confirmé</div>
                        <p className="mt-1 text-xs font-normal text-emerald-800">
                          {paymentSnapshot?.validatedBy ? `Validé par ${paymentSnapshot.validatedBy}` : "Frais d’ouverture au statut SUCCESS."}
                          {paymentSnapshot?.validatedAt ? ` · ${new Date(paymentSnapshot.validatedAt).toLocaleString("fr-FR")}` : ""}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 border-emerald-400 bg-white text-emerald-900 hover:bg-emerald-50"
                          data-testid="print-receipt-a5"
                          onClick={() => void printReceiptA5(candidate.id)}
                        >
                          Imprimer reçu A5 (caisse)
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => confirmPaymentForCandidateMutation.mutate({ sessionToken, candidateId: candidate.id })}
                        disabled={confirmPaymentForCandidateMutation.isPending}
                        className="mt-2 w-full bg-amber-700 text-white hover:bg-amber-800"
                        data-testid="confirm-payment-button"
                      >
                        {confirmPaymentForCandidateMutation.isPending ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Validation du paiement…</> : <>Valider le paiement</>}
                      </Button>
                    )}
                    {guidedNext.canAdvance && guidedNext.nextStage ? (
                      <Button
                        type="button"
                        onClick={() => {
                          updateStatusMutation.mutate({ sessionToken, candidateId, newStatus: guidedNext.nextStage as AdminStatus, notifyClient });
                        }}
                        disabled={updateStatusMutation.isPending}
                        className="mt-2 w-full bg-emerald-700 hover:bg-emerald-800"
                        data-testid="advance-guided-stage"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />{guidedNext.buttonLabel}
                      </Button>
                    ) : guidedNext.code === "employer_selection" || guidedNext.code === "protocol_two" ? (
                      <Button
                        type="button"
                        onClick={() => setCandidate360Tab(guidedNext.focusTab || "evaluation")}
                        className="mt-2 w-full bg-amber-700 text-white hover:bg-amber-800"
                        data-testid="guided-employer-selection"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />{guidedNext.buttonLabel}
                      </Button>
                    ) : paymentAlreadyConfirmed && guidedNext.code === "done" ? (
                      <p className="mt-2 text-sm font-semibold text-emerald-900">Parcours guidé à jour pour ce dossier.</p>
                    ) : null}
                    <p className="mt-2 text-xs leading-5 text-emerald-900" data-testid="guided-next-reason">{guidedNext.reason}</p>
                    {guidedNext.subStage === "employer_placement" && (
                      <div className="mt-3">
                        <AdminEmployerSelectionPanel
                          sessionToken={sessionToken}
                          candidateId={candidate.id}
                          onSaved={() => { void refetch(); onStatusUpdated(); }}
                        />
                      </div>
                    )}
                    {guidedNext.approvalChecklist && (
                      <ul className="mt-3 space-y-1.5 rounded-lg border border-emerald-100 bg-white/80 p-3" data-testid="approval-prerequisites-checklist">
                        {guidedNext.approvalChecklist.items.map((item) => (
                          <li key={item.key} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className={item.ok ? "text-emerald-700" : item.required ? "text-amber-700" : "text-slate-400"}>
                              {item.ok ? "✓" : "○"}
                            </span>
                            <span>
                              <span className="font-semibold">{item.label}</span>
                              {!item.required ? <span className="text-slate-400"> · optionnel</span> : null}
                              <span className="mt-0.5 block text-slate-500">{item.detail}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {previousAdminStatus && paymentAlreadyConfirmed && (
                      <Button type="button" variant="outline" data-testid="cancel-last-kanban-step" onClick={() => setRollbackDialogOpen(true)} disabled={revertStatusMutation.isPending} className="mt-2 w-full border-red-300 text-red-700 hover:bg-red-50">
                        <X className="mr-2 h-4 w-4" />Annuler la dernière validation
                      </Button>
                    )}
                    <p className="mt-2 text-xs leading-5 text-emerald-900">Le serveur vérifie l’évaluation, le protocole, le paiement, la sélection employeur (visa travail) et l’ordre des étapes — sans réécrire les dossiers actifs hors action explicite.</p>
                  </div>
                  <div className="grid gap-2">
                    <AdminClientSpacePreview
                      sessionToken={sessionToken}
                      candidateId={candidate.id}
                      candidateName={candidate.fullName}
                      compact
                      triggerClassName="justify-start border-indigo-300 bg-indigo-50 text-indigo-950 hover:bg-indigo-100"
                    />
                    <Button variant="outline" className="justify-start" onClick={() => setCandidate360Tab("documents")} data-testid="open-360-documents">
                      <FileCheck className="mr-2 h-4 w-4 text-violet-700" />Documents du dossier 360°
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => setCandidate360Tab("payments")} data-testid="open-cancel-validated-payment">
                      <FileText className="mr-2 h-4 w-4 text-amber-700" />Paiements et annulation
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => setCandidate360Tab("overview")} data-testid="open-360-summary">
                      <FileText className="mr-2 h-4 w-4 text-indigo-700" />Synthèse & vue d’ensemble
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => setCandidate360Tab("messages")}>
                      <Mail className="mr-2 h-4 w-4 text-blue-700" />Échanges candidat
                    </Button>
                  </div>
                  <details className="rounded-lg border border-slate-200 bg-white p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-700">Correction avancée du statut</summary>
                    <div className="mt-3 space-y-2">
                      <Label htmlFor="candidate-status">Étape admin (5 étapes · détail métier)</Label>
                      <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as AdminStatus)}>
                        <SelectTrigger id="candidate-status" className="bg-white" data-testid="admin-status-select"><SelectValue placeholder="Choisir une étape…" /></SelectTrigger>
                        <SelectContent>
                          {ADMIN_STATUS_SEQUENCE.map((key) => {
                            const cfg = STATUS_CONFIG[key];
                            const catalog = ADMIN_STAGE_CATALOG[key];
                            return (
                              <SelectItem key={key} value={key} textValue={cfg.label}>
                                <div className="flex flex-col gap-0.5 py-0.5">
                                  <span className="font-semibold">{cfg.label}</span>
                                  <span className="text-[11px] leading-snug text-slate-500">{catalog.detail}</span>
                                  <span className="text-[10px] text-indigo-700">Client : {catalog.clientLabel}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {selectedStatus && (
                        <ul className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600" data-testid="admin-status-prerequisites">
                          {ADMIN_STAGE_CATALOG[selectedStatus].prerequisites.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      )}
                      <label className="flex items-start gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={notifyClient} onChange={(e) => setNotifyClient(e.target.checked)} className="mt-0.5 rounded border-slate-300 text-blue-700" />
                        <span>Notifier le candidat par e-mail (libellé phase client, sans jargon admin).</span>
                      </label>
                      <Button onClick={handleStatusUpdate} disabled={!selectedStatus || updateStatusMutation.isPending} className="w-full bg-slate-800 hover:bg-slate-900">
                        {updateStatusMutation.isPending ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Mise à jour…</> : "Enregistrer l’étape"}
                      </Button>
                    </div>
                  </details>
                </div>
              </section>}

              {candidate.scoringTotal !== null && <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Score d’évaluation</p><p className="mt-1 text-3xl font-black text-emerald-800">{candidate.scoringTotal}<span className="text-base font-semibold">/100</span></p><div className="mt-3 h-2 rounded-full bg-emerald-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, candidate.scoringTotal)}%` }} /></div></section>}
            </aside>

          </div>
        ) : (
          <div className="py-12 text-center text-gray-600">
            <AlertCircle className="mx-auto mb-3 h-6 w-6 text-amber-600" />
            {isAdminSessionError(error) ? (
              <div data-testid="candidate-360-session-ended">
                <p className="font-medium">Votre session administrateur a pris fin</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">La durée de session est dépassée, ou le même compte s'est connecté ailleurs. Reconnectez-vous : vous reviendrez sur ce dossier.</p>
                <Button className="mt-4 bg-blue-800 text-white hover:bg-blue-900" onClick={() => { clearAdminSession(); window.location.assign(adminLoginUrl(`${window.location.pathname}${window.location.search}`)); }}>Se reconnecter</Button>
              </div>
            ) : (
              <>
                <p className="font-medium">Impossible de charger cette fiche candidat</p>
                <p className="mt-1 text-sm text-gray-500">{error?.message || "La fiche est peut-être en cours de synchronisation. Actualisez puis réessayez."}</p>
                <Button className="mt-4" variant="outline" onClick={() => void refetch()}>Réessayer</Button>
              </>
            )}
          </div>
        )}

        <DialogFooter className="sticky bottom-0 z-20 border-t border-slate-200 bg-white px-5 py-3 sm:px-7">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <p className="hidden text-xs text-slate-500 md:block">Toutes les actions sont journalisées dans l’historique du dossier.</p>
        </DialogFooter>
        <AlertDialog open={preDossierConfirmationOpen} onOpenChange={(open) => { setPreDossierConfirmationOpen(open); if (!open) setPreDossierActivationError(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer l’ouverture du dossier ?</AlertDialogTitle>
              <AlertDialogDescription>Le compte de {candidate?.fullName} deviendra un dossier actif pour {preDossierDestination || "la destination choisie"}. Le client pourra suivre son dossier et recevra une confirmation lorsque l’envoi e-mail est disponible.</AlertDialogDescription>
              {preDossierActivationError && (
                <div role="alert" className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  <strong>Activation refusée :</strong> {preDossierActivationError}
                  {preDossierActivationError.toLowerCase().includes("dossier actif") && (
                    <p className="mt-1 text-xs text-rose-700">Ce candidat possède déjà un dossier actif. Fermez ou archivez l’ancien dossier avant d’en ouvrir un nouveau.</p>
                  )}
                </div>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={activatePreDossierMutation.isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction disabled={activatePreDossierMutation.isPending || !candidate?.internalId} onClick={(event) => { event.preventDefault(); setPreDossierActivationError(null); if (candidate?.internalId) activatePreDossierMutation.mutate({ sessionToken, candidateId: candidate.internalId, destination: preDossierDestination.trim(), visaType: preDossierVisaType.trim(), adminNotes: preDossierNotes.trim() || undefined }); }}>{activatePreDossierMutation.isPending ? "Activation…" : "Confirmer l’activation"}</AlertDialogAction>
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

  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken") || "" : "";
  const checklistPreview = trpc.admin.previewCountryVisaChecklist.useQuery(
    {
      sessionToken,
      destinationCountry: form.destinationCountry,
      projectType: form.projectType,
      documentsReceived: form.documentsReceived || undefined,
    },
    {
      enabled: Boolean(sessionToken && form.destinationCountry && form.projectType),
      staleTime: 30_000,
    },
  );

  const importMutation = trpc.admin.importAgencyDossier.useMutation({
    onSuccess: (result) => {
      const checklistHint = result.procedure?.checklistAdded
        ? ` Checklist ${result.procedure.checklistLabel || ""} : ${result.procedure.checklistAdded} pièce(s).`
        : "";
      const whatsappHint = result.whatsappSent ? " WhatsApp envoyé." : "";
      const accessHint = result.clientInviteSent
        ? " Lien d’activation espace client envoyé."
        : result.clientAccountCreated
          ? " Compte client créé."
          : "";
      toast({
        title: result.clientAccountCreated
          ? "Dossier + compte client créés"
          : result.linkedCandidateId
            ? "Dossier rattaché au compte client"
            : "Dossier créé",
        description: `${result.message}${checklistHint}${whatsappHint}${accessHint} ${result.nextStep || ""}`.trim(),
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
    importMutation.mutate({
      sessionToken,
      fullName: form.fullName,
      email: form.email,
      whatsapp: form.whatsapp,
      city: form.city,
      destinationCountry: form.destinationCountry,
      projectType: form.projectType,
      documentsReceived: form.documentsReceived || undefined,
      assignedToAdmin: form.assignedToAdmin || undefined,
      depositDate: form.depositDate || undefined,
      initialPaymentStatus: form.initialPaymentStatus,
      initialStatus: form.initialStatus,
    });
  };

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <Building2 className="w-5 h-5" />
            Ajouter un dossier déjà inscrit en agence
          </DialogTitle>
          <p className="text-sm text-slate-600">Crée le dossier dynamique (pays × visa), rattache le compte client s’il existe, puis vous pourrez scanner et publier les pièces dans son espace.</p>
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
                maxLength={255}
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
                maxLength={320}
              />
              <p className="mt-1 text-xs text-slate-500">Même e-mail que le compte client : le dossier et les documents scannés y seront rattachés.</p>
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp / Téléphone *</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => setField("whatsapp", e.target.value)}
                placeholder="+237 6XX XXX XXX"
                required
                maxLength={50}
              />
            </div>

            <div>
              <Label htmlFor="city">Ville</Label>
              <Input id="city" value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="Yaoundé" maxLength={100} />
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date de naissance</Label>
              <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => setField("dateOfBirth", e.target.value)} />
            </div>

            <div>
              <Label htmlFor="nationality">Nationalité</Label>
              <Input id="nationality" value={form.nationality} onChange={(e) => setField("nationality", e.target.value)} placeholder="Camerounaise" maxLength={100} />
            </div>

            <div>
              <Label htmlFor="destination">Pays de destination *</Label>
              <div className="mt-1">
                <CountrySelect
                  id="destination"
                  value={form.destinationCountry}
                  onChange={(v) => setField("destinationCountry", v)}
                  placeholder="Choisir le pays exact…"
                  ariaLabel="Pays de destination"
                  priority={DESTINATION_OPTIONS}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="projectType">Type de visa / procédure *</Label>
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
              <Label htmlFor="documentsReceived">Documents déjà remis en agence</Label>
              <textarea id="documentsReceived" value={form.documentsReceived} onChange={(e) => setField("documentsReceived", e.target.value)} placeholder="Ex. CV, passeport, diplôme (séparés par des virgules)" maxLength={2000} className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
              <p className="mt-1 text-xs text-slate-500">Ces pièces enrichissent la checklist dynamique. Scannez ensuite les fichiers dans le centre documentaire, puis publiez-les vers l’espace client.</p>
            </div>

            {checklistPreview.data?.documents?.length ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3" data-testid="import-checklist-preview">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
                  Checklist dynamique · {checklistPreview.data.destination} · {checklistPreview.data.label}
                </p>
                <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs text-slate-700">
                  {checklistPreview.data.documents.slice(0, 16).map((item) => (
                    <li key={`${item.source}-${item.documentType}`}>• {item.documentType}</li>
                  ))}
                  {checklistPreview.data.documents.length > 12 ? (
                    <li className="text-slate-500">+ {checklistPreview.data.documents.length - 12} autre(s)</li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            <div>
              <Label htmlFor="initialPaymentStatus">Statut de paiement initial (ce dossier uniquement)</Label>
              <Select value={form.initialPaymentStatus} onValueChange={(v) => setField("initialPaymentStatus", v)}>
                <SelectTrigger id="initialPaymentStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Non renseigné</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payé en agence</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-slate-500">1 dossier = 1 paiement : un second dossier pour le même client reste non payé tant que vous ne validez pas son propre règlement.</p>
            </div>

            <div>
              <Label htmlFor="assignedToAdmin">Conseiller référent (email)</Label>
              <Input id="assignedToAdmin" type="email" value={form.assignedToAdmin} onChange={(e) => setField("assignedToAdmin", e.target.value)} placeholder="conseiller@3mtravelagency.com" maxLength={320} />
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
  const [visaKindFilter, setVisaKindFilter] = useState("ALL");
  const [activationFilter, setActivationFilter] = useState<CandidateActivationStatus | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<CandidateSource | "ALL">("ALL");
  const [destinationFilter, setDestinationFilter] = useState("ALL");
  const [assignedToMeFilter, setAssignedToMeFilter] = useState(false);
  const [sortBy, setSortBy] = useState<"priority" | "recent" | "oldest" | "name" | "score_desc">("priority");
  const [nextActionFilter, setNextActionFilter] = useState<"ALL" | "high" | "medium" | "low">("ALL");
  const [nextActionSort, setNextActionSort] = useState<"default" | "urgency_desc" | "label">("default");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [openEvaluationEditor, setOpenEvaluationEditor] = useState(false);
  const [preDossierActivateAccountId, setPreDossierActivateAccountId] = useState<number | null>(null);
  const [activeAdminTab, setActiveAdminTabState] = useState<string>(readInitialAdminTab);
  // Un clic sur une section en affiche directement le contenu : on mémorise l'onglet et on amène le contenu sous l'en-tête.
  const setActiveAdminTab = useCallback((tab: string) => {
    setActiveAdminTabState(tab);
    rememberAdminTab(tab);
    if (typeof window !== "undefined") window.requestAnimationFrame(() => document.getElementById("admin-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);
  useEffect(() => {
    // Lien direct (?tab=candidates) : le contenu apparaît tout de suite, sans descendre dans la page.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab")) window.setTimeout(() => document.getElementById("admin-workspace")?.scrollIntoView({ block: "start" }), 400);
  }, []);
  const [guichetMode, setGuichetMode] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [advisorDeadlinePriorityFilter, setAdvisorDeadlinePriorityFilter] = useState<"all" | "low" | "normal" | "high" | "urgent">("all");
  const [pendingInlineChanges, setPendingInlineChanges] = useState<Record<string, { paymentStatus?: keyof typeof PAYMENT_STATUS_LABELS; procedureStep?: AdminStatus }>>({});
  const [showArchiveView, setShowArchiveView] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [orphanCleanupPreview, setOrphanCleanupPreview] = useState<{ count: number; duplicates: { dossierNumber: string; fullName: string; email: string }[] } | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [showPendingSaveConfirm, setShowPendingSaveConfirm] = useState(false);
  const { toast } = useToast();
  const updateDossierPaymentStateMutation = trpc.admin.updateDossierPaymentState.useMutation();
  const updateInlineProcedureMutation = trpc.admin.updateCandidateStatus.useMutation();
  const confirmInlinePaymentMutation = trpc.adminCandidateManagement.confirmPaymentForCandidate.useMutation();
  const archiveDuplicateMutation = trpc.admin.archiveDuplicateRecord.useMutation({
    onSuccess: () => { void trpcUtils.admin.listCandidates.invalidate(); },
    onError: (error) => toast({ title: "Mise en corbeille impossible", description: error.message, variant: "destructive" }),
  });
  const cleanupOrphanedPreAccountsMutation = trpc.adminCandidateManagement.cleanupOrphanedPreAccounts.useMutation({
    onSuccess: (result) => {
      setOrphanCleanupPreview({
        count: result.count ?? 0,
        duplicates: (result.duplicates ?? []).map((duplicate) => ({
          dossierNumber: duplicate.dossierNumber ?? "",
          fullName: duplicate.fullName ?? "",
          email: duplicate.email ?? "",
        })),
      });
      if (result.deleted) {
        toast({ title: "Pré-comptes archivés", description: `${result.count} pré-dossier(s) en doublon envoyé(s) dans la corbeille.` });
        void trpcUtils.admin.listCandidates.invalidate();
      }
    },
    onError: (error) => toast({ title: "Détection impossible", description: error.message, variant: "destructive" }),
  });
  const trpcUtils = trpc.useUtils();
  const archivedRecordsQuery = trpc.admin.listArchivedRecords.useQuery({ sessionToken, search: archiveSearch || undefined }, { enabled: showArchiveView });
  const digitalNewCountQuery = trpc.digitalServices.adminCountNew.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), refetchInterval: 60_000 });
  const digitalNewCount = digitalNewCountQuery.data ?? 0;
  const restoreArchivedMutation = trpc.admin.restoreArchivedRecord.useMutation({
    onSuccess: () => { toast({ title: "Archive restaurée", description: "L’enregistrement est de nouveau visible dans la liste active." }); void archivedRecordsQuery.refetch(); void trpcUtils.admin.listCandidates.invalidate(); },
    onError: (error) => toast({ title: "Restauration impossible", description: error.message, variant: "destructive" }),
  });

  const [archiveDialogItems, setArchiveDialogItems] = useState<Array<{ id: string; folderCode?: string; fullName?: string; email?: string; source?: string }> | null>(null);
  const [archiveReasonInput, setArchiveReasonInput] = useState("Doublon à vérifier");
  const [restoreDialogRecord, setRestoreDialogRecord] = useState<{ candidateId: string; reference: string } | null>(null);
  const [purgeDialogRecord, setPurgeDialogRecord] = useState<{ candidateId: string; reference: string; email: string } | null>(null);
  const [purgeEmailInput, setPurgeEmailInput] = useState("");
  const purgeArchivedMutation = trpc.admin.purgeArchivedAccount.useMutation({
    onSuccess: (result) => {
      toast({ title: "Compte supprimé définitivement", description: result.message });
      setPurgeDialogRecord(null);
      setPurgeEmailInput("");
      void archivedRecordsQuery.refetch();
      void trpcUtils.admin.listCandidates.invalidate();
    },
    onError: (error) => toast({ title: "Suppression impossible", description: error.message, variant: "destructive" }),
  });

  const archiveCandidateFromTable = useCallback((candidate: { id?: string; folderCode?: string; fullName?: string; email?: string; source?: string }) => {
    if (!candidate.id) return;
    setArchiveDialogItems([candidate as { id: string; folderCode?: string; fullName?: string; email?: string; source?: string }]);
    setArchiveReasonInput("Doublon à vérifier");
  }, []);

  const toggleCandidateSelection = useCallback((candidateId: string) => {
    setSelectedCandidateIds((current) => {
      const next = new Set(current);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });
  }, []);

  const openBulkArchiveDialog = useCallback((selected: Array<{ id: string; folderCode?: string; fullName?: string; email?: string; source?: string }>) => {
    if (!selected.length) return;
    setArchiveDialogItems(selected);
    setArchiveReasonInput("Doublon à vérifier");
  }, []);

  const confirmArchiveDialog = useCallback(async () => {
    if (!archiveDialogItems) return;
    const reason = archiveReasonInput.trim();
    if (reason.length < 8) { toast({ title: "Motif obligatoire", description: "Saisissez au moins 8 caractères pour continuer.", variant: "destructive" }); return; }
    let succeeded = 0;
    let failed = 0;
    for (const item of archiveDialogItems) {
      try {
        await archiveDuplicateMutation.mutateAsync({ sessionToken, candidateId: item.id, reason, confirmation: "CORBEILLE" });
        succeeded += 1;
      } catch {
        failed += 1;
      }
    }
    const isBulk = archiveDialogItems.length > 1;
    setSelectedCandidateIds(new Set());
    setArchiveDialogItems(null);
    toast({
      title: isBulk ? "Mise en corbeille groupée terminée" : "Dossier placé dans la corbeille",
      description: `${succeeded} dossier(s) archivé(s)${failed ? `, ${failed} échec(s)` : ""}.`,
      variant: failed ? "destructive" : undefined,
    });
  }, [archiveDialogItems, archiveReasonInput, archiveDuplicateMutation, sessionToken, toast]);

  const queueInlineChange = useCallback((candidateId: string, field: "paymentStatus" | "procedureStep", value: string) => {
    setPendingInlineChanges((current) => ({ ...current, [candidateId]: { ...current[candidateId], [field]: value } }));
  }, []);

  const saveInlineChanges = useCallback(async () => {
    const entries = Object.entries(pendingInlineChanges);
    if (!entries.length) return;
    if (!window.confirm(`Enregistrer les modifications de ${entries.length} dossier${entries.length > 1 ? "s" : ""} ?`)) return;
    try {
      for (const [candidateId, change] of entries) {
        if (change.paymentStatus) {
          if (change.paymentStatus === "SUCCESS") await confirmInlinePaymentMutation.mutateAsync({ sessionToken, candidateId });
          else await updateDossierPaymentStateMutation.mutateAsync({ sessionToken, candidateId, status: change.paymentStatus as "PENDING" | "FAILED" | "CANCELLED" | "NOT_PAID" });
        }
        if (change.procedureStep) await updateInlineProcedureMutation.mutateAsync({ sessionToken, candidateId, newStatus: change.procedureStep, notifyClient: false });
      }
      setPendingInlineChanges({});
      toast({ title: "Modifications enregistrées", description: `${entries.length} dossier${entries.length > 1 ? "s" : ""} mis à jour.` });
      await trpcUtils.admin.listCandidates.invalidate();
    } catch (error) {
      toast({ title: "Enregistrement groupé incomplet", description: error instanceof Error ? error.message : "Une modification n’a pas pu être enregistrée.", variant: "destructive" });
    }
  }, [confirmInlinePaymentMutation, pendingInlineChanges, sessionToken, toast, trpcUtils, updateDossierPaymentStateMutation, updateInlineProcedureMutation]);
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
    visaKind: visaKindFilter !== "ALL" ? (visaKindFilter as "evisa" | "work" | "study" | "visitor" | "family" | "residence" | "other") : undefined,
    assignedToMe: assignedToMeFilter || undefined,
    sortBy,
  }), [sessionToken, search, statusFilter, activationFilter, sourceFilter, destinationFilter, visaKindFilter, assignedToMeFilter, sortBy]);
  const { data, isLoading, error: candidateListError, refetch, dataUpdatedAt, isFetching: isFetchingCandidates } = trpc.admin.listCandidates.useQuery(
    candidateListInput,
    {
      enabled: !!sessionToken,
      placeholderData: (previous) => previous,
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );
  useEffect(() => {
    if (!sessionToken) return;
    void trpcUtils.admin.listCandidates.reset();
  }, [sessionToken, trpcUtils]);
  useEffect(() => {
    setSelectedCandidateIds(new Set());
  }, [candidateListInput]);
  useEffect(() => {
    const message = candidateListError?.message?.toLowerCase() ?? "";
    const unauthorized = candidateListError?.data?.code === "UNAUTHORIZED" || message.includes("session invalide") || message.includes("session expirée") || message.includes("session administrateur requise");
    if (!unauthorized) return;
    localStorage.removeItem("adminSessionToken");
    sessionStorage.removeItem("adminSessionToken");
    localStorage.removeItem("adminType");
    localStorage.removeItem("adminName");
    toast({ title: "Session administrateur expirée", description: "Reconnectez-vous pour reprendre le pilotage des dossiers.", variant: "destructive" });
    navigate("/admin/login");
  }, [candidateListError, navigate, toast]);
  const { data: pendingPaymentApplications = [] } = trpc.application.listApplications.useQuery({
    paymentStatus: "PENDING",
    limit: 100,
    offset: 0,
  });
  const { data: currentAdminData } = trpc.adminAuth.me.useQuery({ sessionToken }, { enabled: !!sessionToken });
  const currentAdminEmail = currentAdminData?.authenticated ? currentAdminData.admin.email : null;
  const currentAdminRoleLabel = currentAdminData?.authenticated
    ? (
        ({
          evaluation: "Conseiller évaluation",
          accompagnement: "Conseiller accompagnement",
          procedures: "Conseiller procédures",
        } as Record<string, string>)[String((currentAdminData.admin as { adminType?: string }).adminType ?? "")]
        || ((currentAdminData.admin as { role?: string }).role === "super_admin" ? "Super-admin" : "Administrateur")
      )
    : "Administrateur";
  const currentAdminType = currentAdminData?.authenticated
    ? String((currentAdminData.admin as { adminType?: string }).adminType ?? "")
    : "";
  /** Les taux et le planificateur restent hors périmètre « évaluation seule ». */
  const canManageSensitiveOps = currentAdminType !== "evaluation";
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
    if (dataUpdatedAt) {
      setLastSyncedAt(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

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
  const displayCandidates = useMemo(() => {
    const ranked = candidates.map((candidate) => {
      const next = determineAdminListNextAction({
        paymentStatus: pendingInlineChanges[candidate.id]?.paymentStatus ?? candidate.paymentStatus,
        procedureStep: pendingInlineChanges[candidate.id]?.procedureStep ?? candidate.procedureStep ?? candidate.status,
        status: candidate.status,
        activationStatus: candidate.activationStatus,
        destination: candidate.destinationCountry,
        visaType: candidate.projectType,
      });
      return { candidate, next };
    }).filter(({ next }) => nextActionFilter === "ALL" || next.urgency === nextActionFilter);
    if (nextActionSort === "urgency_desc") {
      const rank = { high: 0, medium: 1, low: 2 } as const;
      ranked.sort((a, b) => rank[a.next.urgency] - rank[b.next.urgency] || a.next.label.localeCompare(b.next.label, "fr"));
    } else if (nextActionSort === "label") {
      ranked.sort((a, b) => a.next.label.localeCompare(b.next.label, "fr"));
    }
    return ranked.map(({ candidate }) => candidate);
  }, [candidates, nextActionFilter, nextActionSort, pendingInlineChanges]);
  const kanbanCandidates: KanbanCandidate[] = candidates.filter((candidate) => Boolean(candidate.id)).map((candidate) => {
    const status = (candidate.status ?? "PENDING_48H") as AdminStatus;
    const referenceDate = candidate.evaluationScheduledAt ?? candidate.lastStatusUpdateAt ?? candidate.updatedAt ?? candidate.createdAt;
    const slaHours = status === "PENDING_48H" ? 48 : status === "PUBLISHED" ? 72 : 120;
    const dueAt = candidate.dueAt ?? (referenceDate ? new Date(new Date(referenceDate).getTime() + slaHours * 60 * 60 * 1000) : null);
    const history = [{ status, label: STATUS_CONFIG[status]?.label ?? status, at: candidate.lastStatusUpdateAt ?? candidate.updatedAt }, ...(candidate.createdAt ? [{ status: "created", label: "Dossier créé", at: candidate.createdAt }] : [])];
    return { id: candidate.id!, fullName: candidate.fullName ?? "Candidat sans nom", folderCode: candidate.folderCode ?? "Dossier non référencé", destinationCountry: candidate.destinationCountry ?? "", projectType: candidate.projectType ?? "", status, source: candidate.source ?? "WEB", advisorName: candidate.adminAssignedTo ?? null, dueAt, history, paymentStatus: candidate.paymentStatus ?? null, activationStatus: candidate.activationStatus ?? null, procedureStep: candidate.procedureStep ?? null, procedureJourney: candidate.procedureJourney ?? null };
  });
  const handleKanbanMove = (candidate: KanbanCandidate, newStatus: AdminStatus) => {
    if (!sessionToken || candidate.status === newStatus || updateKanbanStatusMutation.isPending) return;
    const statusLabel = STATUS_CONFIG[newStatus].label;
    if (!window.confirm(`Confirmer le déplacement de ${candidate.fullName} vers « ${statusLabel} » ? Le changement sera tracé et pourra déclencher une notification client.`)) return;
    updateKanbanStatusMutation.mutate({ sessionToken, candidateId: candidate.id, newStatus, notifyClient: true });
  };
  const handleKanbanAdvance = async (candidate: KanbanCandidate, requestedStatus: AdminStatus) => {
    if (!sessionToken || updateKanbanStatusMutation.isPending || getNextKanbanStatus(candidate.status) !== requestedStatus) return;
    await updateKanbanStatusMutation.mutateAsync({ sessionToken, candidateId: candidate.id, newStatus: requestedStatus, notifyClient: true });
  };
  const availableDestinations = data?.availableDestinations || [];
  const hasCandidateFilters = Boolean(search || statusFilter !== "ALL" || activationFilter !== "ALL" || sourceFilter !== "ALL" || destinationFilter !== "ALL" || visaKindFilter !== "ALL" || assignedToMeFilter || sortBy !== "priority" || nextActionFilter !== "ALL" || nextActionSort !== "default");
  const resetCandidateFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setActivationFilter("ALL");
    setSourceFilter("ALL");
    setDestinationFilter("ALL");
    setVisaKindFilter("ALL");
    setAssignedToMeFilter(false);
    setSortBy("priority");
    setNextActionFilter("ALL");
    setNextActionSort("default");
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
    .filter((group) => !assignedToMeFilter || !currentAdminEmail || group.advisorEmail?.toLowerCase() === currentAdminEmail.toLowerCase())
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
    <main data-admin-ops-mobile data-admin-guichet={guichetMode ? "true" : undefined} className="premium-page-shell min-h-screen text-slate-900 transition-colors duration-300 dark:bg-[#071426] dark:text-slate-100">
      {/* En-tête fixe */}
      <div className="glass-admin-header sticky top-0 z-50 bg-gradient-to-r from-[#071b3d]/96 via-[#0b2f6f]/96 to-[#123c86]/96 text-white shadow-lg backdrop-blur-xl transition-colors duration-300">
        <div className="mx-auto w-full max-w-[1920px] space-y-3 px-4 py-4 sm:px-6 xl:px-8 2xl:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#efd38a]">Administration · 3M TRAVEL AGENCY</p>
              <h1 className="mt-1 font-[family-name:Sora,Manrope,sans-serif] text-xl font-extrabold tracking-tight sm:text-2xl">Tableau de bord Admin</h1>
              <p className="mt-1 text-sm text-blue-100/95">Bienvenue, {adminName} — pilotage unifié des dossiers et services.</p>
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
                  maxLength={200}
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
                {isFetchingCandidates && !isRefreshing
                  ? "Synchronisation des dossiers…"
                  : lastSyncedAt
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGuichetMode((current) => !current);
                  setActiveAdminTab("pilotage");
                }}
                aria-pressed={guichetMode}
                data-testid="admin-guichet-toggle"
                className={`gap-1.5 border-white/30 text-white hover:bg-white/10 ${guichetMode ? "bg-amber-400/30 ring-1 ring-amber-200/60" : ""}`}
                title="Mode guichet tactile — grandes tuiles pour le comptoir"
              >
                <Hand className="w-4 h-4" /> {guichetMode ? "Guichet ON" : "Mode guichet"}
              </Button>
            </div>
            <nav aria-label="Fil d’Ariane du pilotage admin" className="flex w-full items-center gap-2 border-t border-white/15 pt-3 text-sm text-blue-100">
              <button type="button" onClick={() => setActiveAdminTab("pilotage")} className="rounded px-1 font-semibold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Administration</button>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="font-bold text-white">{ADMIN_TAB_LABELS[activeAdminTab] || "Pilotage"}</span>
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
            <div className="flex items-center gap-2 pl-3 border-l border-white/20" data-testid="admin-role-badge">
              <div className="w-10 h-10 bg-gradient-to-br from-[#f4b942] to-[#d99b22] text-[#071b3d] font-bold rounded-full flex items-center justify-center shadow-md shadow-black/20 text-sm">
                {getInitials(adminName)}
              </div>
              <div className="hidden sm:flex flex-col">
                <p className="text-sm font-semibold text-white leading-tight">{adminName}</p>
                <p className="text-xs text-blue-200">{currentAdminRoleLabel}</p>
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
            <Input autoFocus value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Rechercher un espace ou un outil..." aria-label="Recherche globale administrateur" maxLength={200} className="h-11" />
            <div className="mt-3 max-h-80 space-y-1 overflow-y-auto" role="listbox" aria-label="Résultats de recherche admin">
              {filteredGlobalSearchItems.length === 0 ? <p className="px-3 py-8 text-center text-sm text-slate-500">Aucun espace ne correspond à votre recherche.</p> : filteredGlobalSearchItems.map((item) => <button key={item.label} type="button" role="option" onClick={() => openGlobalSearchItem(item)} className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><Search className="h-4 w-4" /></span><span className="min-w-0"><strong className="block text-sm font-bold text-slate-950">{item.label}</strong><span className="block text-xs text-slate-600">{item.hint}</span></span></button>)}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto w-full max-w-[1920px] px-4 py-6 space-y-6 sm:px-6 xl:px-8 2xl:px-10">
        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total", value: stats.total, icon: <Users className="h-4 w-4" />, color: "bg-slate-100 text-slate-800" },
            { label: "Éval. 48h", value: stats.pending, icon: <Clock className="h-4 w-4" />, color: "bg-amber-100 text-amber-800" },
            { label: "Bilan dispo", value: stats.published, icon: <FileCheck className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
            { label: "Documents", value: stats.documents, icon: <Send className="h-4 w-4" />, color: "bg-violet-100 text-violet-800" },
            { label: "Soumis", value: stats.submitted, icon: <Globe className="h-4 w-4" />, color: "bg-indigo-100 text-indigo-800" },
            { label: "Décision favorable", value: stats.approved, icon: <CheckCircle className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-800" },
          ].map((s) => (
            <Card key={s.label} className="premium-surface border-white/90">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-600">{s.label}</p>
                    <p className="mt-0.5 text-2xl font-black tracking-tight text-slate-950">{s.value}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${s.color}`}>{s.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sources */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
          <span className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-sky-600" />
            <strong>{stats.web}</strong> dossiers en ligne
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-orange-600" />
            <strong>{stats.agency}</strong> dossiers agence
          </span>
        </div>

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

        <SchedulerDryRunBanner />
        {/* Onglets : Dossiers, Paiements, Documents, Paramètres Vols */}
        <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="w-full" aria-label="Sections du tableau de bord administrateur">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="text-base font-black text-slate-950 sm:text-lg">Espaces de travail</h2>
            <p className="hidden text-xs text-slate-500 sm:block">Un clic ouvre directement le contenu de la section.</p>
          </div>
          <div className="mb-3 grid gap-3 lg:grid-cols-2 2xl:grid-cols-5">
            <AdminNavGroup title="Pilotage des dossiers"><TabsTrigger value="pilotage" onClick={() => setActiveAdminTab("pilotage")} className="font-bold text-cyan-700">Pilotage synchronisé</TabsTrigger><TabsTrigger value="candidates" onClick={() => setActiveAdminTab("candidates")}>Dossiers</TabsTrigger><TabsTrigger value="pre-dossiers" onClick={() => setActiveAdminTab("pre-dossiers")} className="font-bold text-blue-700">Pré-dossiers</TabsTrigger><TabsTrigger value="inbox" onClick={() => setActiveAdminTab("inbox")}>Demandes unifiées</TabsTrigger><TabsTrigger value="evaluation-review" onClick={() => setActiveAdminTab("evaluation-review")} className="font-bold text-amber-700">Bilans à valider</TabsTrigger><TabsTrigger value="evaluation-reminders" onClick={() => setActiveAdminTab("evaluation-reminders")} className="font-bold text-violet-700">Bilans à relancer</TabsTrigger><TabsTrigger value="documents" onClick={() => setActiveAdminTab("documents")}>Documents</TabsTrigger><TabsTrigger value="activations" onClick={() => setActiveAdminTab("activations")}>Activations</TabsTrigger><TabsTrigger value="partners" onClick={() => setActiveAdminTab("partners")} data-testid="admin-tab-partners">Partenaires & placement</TabsTrigger></AdminNavGroup>
            <AdminNavGroup title="Services & catalogue"><TabsTrigger value="tourism" onClick={() => setActiveAdminTab("tourism")}>Tourisme & Devis</TabsTrigger><TabsTrigger value="consular" onClick={() => setActiveAdminTab("consular")} className="font-bold text-blue-600">Consulats & Liens</TabsTrigger><TabsTrigger value="destination-analytics" onClick={() => setActiveAdminTab("destination-analytics")} className="font-bold text-indigo-700">Destinations</TabsTrigger><TabsTrigger value="evisa-catalogue" onClick={() => setActiveAdminTab("evisa-catalogue")} className="font-bold text-cyan-700">Catalogue e‑Visa</TabsTrigger><TabsTrigger value="evaluation-config" onClick={() => setActiveAdminTab("evaluation-config")} data-testid="admin-tab-evaluation-config">Évaluation & pays</TabsTrigger></AdminNavGroup>
            <AdminNavGroup title="Réservations & finance"><TabsTrigger value="calendar" onClick={() => setActiveAdminTab("calendar")}>Calendrier</TabsTrigger><TabsTrigger value="payments" onClick={() => setActiveAdminTab("payments")}>Paiements {pendingPaymentApplications.length > 0 && <Badge className="h-5 min-w-5 rounded-full bg-amber-700 px-1.5 text-[10px] text-white">{pendingPaymentApplications.length}</Badge>}</TabsTrigger><TabsTrigger value="flights" onClick={() => setActiveAdminTab("flights")} className="font-bold text-sky-700"><Plane className="h-4 w-4" /> Réservations vols {(flightQueueSummary?.pending_review ?? 0) > 0 && <Badge className="h-5 min-w-5 rounded-full bg-amber-700 px-1.5 text-[10px] text-white">{flightQueueSummary?.pending_review}</Badge>}</TabsTrigger>{canManageSensitiveOps ? <TabsTrigger value="rates" onClick={() => setActiveAdminTab("rates")} className="font-bold text-emerald-600" data-testid="admin-tab-rates">Taux de change</TabsTrigger> : null}</AdminNavGroup>
            <AdminNavGroup title="Communication & qualité"><TabsTrigger value="emails" onClick={() => setActiveAdminTab("emails")}>E-mails</TabsTrigger><TabsTrigger value="faq" onClick={() => setActiveAdminTab("faq")}>Satisfaction FAQ</TabsTrigger><TabsTrigger value="rag" onClick={() => setActiveAdminTab("rag")}>Guides & RAG</TabsTrigger><TabsTrigger value="passport-history" onClick={() => setActiveAdminTab("passport-history")}>Passeports</TabsTrigger></AdminNavGroup>
            <AdminNavGroup title="Supervision"><TabsTrigger value="route-health" onClick={() => setActiveAdminTab("route-health")} className="font-bold text-rose-700">404 & Liens</TabsTrigger><TabsTrigger value="simulator-health" onClick={() => setActiveAdminTab("simulator-health")} className="font-bold text-amber-700">Santé simulateurs</TabsTrigger><TabsTrigger value="footer-engagement" onClick={() => setActiveAdminTab("footer-engagement")} className="font-bold text-blue-700">Engagement footer</TabsTrigger><TabsTrigger value="system-status" onClick={() => setActiveAdminTab("system-status")} className="font-bold text-emerald-700">État système</TabsTrigger>{canManageSensitiveOps ? <TabsTrigger value="scheduler" onClick={() => setActiveAdminTab("scheduler")} className="font-bold text-amber-700" data-testid="admin-tab-scheduler">Planificateur</TabsTrigger> : null}<TabsTrigger value="audit" onClick={() => setActiveAdminTab("audit")}>Journal d’audit</TabsTrigger><TabsTrigger value="privacy" onClick={() => setActiveAdminTab("privacy")} data-testid="admin-tab-privacy">Confidentialité</TabsTrigger></AdminNavGroup>
          </div>
          <div id="admin-workspace" className="mb-4 flex scroll-mt-44 flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600"><span>Section active : <strong className="text-slate-950" data-testid="admin-active-section">{ADMIN_TAB_LABELS[activeAdminTab] ?? activeAdminTab}</strong></span><div className="flex items-center gap-2"><SchedulerModeBadge compact /><span className="hidden sm:inline">Les changements sensibles nécessitent une validation humaine.</span></div></div>

          <TabsContent value="pilotage" className="space-y-6">
            {guichetMode ? (
              <AdminGuichetPanel
                candidates={candidates as TodayCandidate[]}
                onOpen={(candidateId) => setSelectedCandidateId(candidateId)}
                onExit={() => setGuichetMode(false)}
              />
            ) : null}
            <AdminTodayDashboard candidates={candidates as TodayCandidate[]} isRefreshing={isFetchingCandidates} lastUpdatedAt={dataUpdatedAt ? new Date(dataUpdatedAt) : null} onRefresh={() => void handleRefresh()} onOpen={(candidateId) => setSelectedCandidateId(candidateId)} />
            <AdminOperationsControlCenter sessionToken={sessionToken} totalCandidates={total} pendingEvaluations={pendingEvaluationCandidates.length} pendingPayments={pendingPaymentApplications.length} pendingFlights={flightQueueSummary?.pending_review ?? 0} openDeadlines={advisorDeadlineGroups.reduce((count, group) => count + group.items.length, 0)} smtpFailures={smtpSummary.failed} lastSyncedAt={lastSyncedAt} isRefreshing={isRefreshing} onRefresh={handleRefresh} onNavigate={setActiveAdminTab} />
            <AdminCockpitControlBoard sessionToken={sessionToken} onOpen={(openId) => setSelectedCandidateId(openId)} />
            <AdminPilotageQueue sessionToken={sessionToken} onOpen={(openId) => setSelectedCandidateId(openId)} />
            <AdminDelayStats sessionToken={sessionToken} />
            <Card className="border-amber-200 bg-amber-50/70">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><h2 className="text-base font-black text-slate-950">Déclarations préalables à contrôler</h2><p className="text-sm text-slate-600">Candidats ayant déclaré une évaluation déjà réalisée ou un paiement effectué en agence.</p></div>
                  <Badge className="w-fit bg-amber-700 text-white">{externalEvaluationCandidates.length + candidates.filter((candidate) => candidate.source === "AGENCY_PHYSICAL").length} à contrôler</Badge>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {[...externalEvaluationCandidates, ...candidates.filter((candidate) => candidate.source === "AGENCY_PHYSICAL")].slice(0, 8).map((candidate) => (
                    <div key={`declaration-${candidate.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white p-3">
                      <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{candidate.fullName}</p><p className="truncate text-xs text-slate-500">{candidate.folderCode} · {candidate.destinationCountry}</p><div className="mt-1 flex flex-wrap gap-1"><EvaluationDeclarationBadge status={candidate.evaluationDeclarationStatus as EvaluationDeclarationStatus | undefined} /><Badge variant="outline" className="text-[10px]">{candidate.source === "AGENCY_PHYSICAL" ? "Paiement/dépôt agence" : "Évaluation déclarée"}</Badge></div></div>
                      <Button type="button" size="sm" variant="outline" onClick={() => setSelectedCandidateId(candidate.id)} aria-label={`Ouvrir le dossier de ${candidate.fullName}`}>Ouvrir</Button>
                    </div>
                  ))}
                </div>
                {(externalEvaluationCandidates.length + candidates.filter((candidate) => candidate.source === "AGENCY_PHYSICAL").length) === 0 && <p className="mt-4 rounded-lg bg-white/80 p-4 text-sm text-slate-600">Aucune déclaration préalable en attente de contrôle.</p>}
              </CardContent>
            </Card>
            <AdminCandidateKanban candidates={kanbanCandidates} onMove={handleKanbanMove} onAdvance={handleKanbanAdvance} onOpen={(candidate) => setSelectedCandidateId(candidate.id)} />
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
                  {assignedToMeFilter && <p className="mt-1 text-xs font-semibold text-blue-700">Filtré sur « Mes dossiers » ({currentAdminEmail ?? "…"}).</p>}
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

            <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center">
              <div><p className="font-black text-blue-950">Pôle 3M Solutions</p><p className="text-sm text-blue-800">Consultez et traitez les demandes de plateformes, marketing, support IT et formation.</p></div>
              <a href="/admin/digital-services" className="relative inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Ouvrir les demandes 3M Solutions
                {digitalNewCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-black text-amber-950">
                    {digitalNewCount}
                  </span>
                )}
              </a>
            </div>

          </TabsContent>
          <TabsContent value="partners" className="space-y-6">
            <div id="admin-placement-pipeline"><AdminPlacementPipeline sessionToken={sessionToken} onOpenCandidate={(adminCandidateRef) => setSelectedCandidateId(adminCandidateRef)} /></div>
            <div id="admin-partner-module"><AdminPartnerModule sessionToken={sessionToken} /></div>
            <div id="admin-cvtheque-review"><AdminCvthequeReview sessionToken={sessionToken} /></div>
            <div id="admin-recruitment-inbox"><AdminRecruitmentInbox sessionToken={sessionToken} /></div>
          </TabsContent>
          <TabsContent value="evaluation-config" className="space-y-6">
            <div id="admin-evaluation-journeys"><AdminEvaluationJourneyBoard sessionToken={sessionToken} /></div>
            <div id="admin-evaluation-form-editor"><AdminEvaluationFormEditor sessionToken={sessionToken} /></div>
            <div id="admin-country-catalog"><AdminCountryCatalog sessionToken={sessionToken} /></div>
          </TabsContent>
          <TabsContent value="privacy" className="space-y-6">
            <div id="admin-privacy-center"><AdminPrivacyCenter sessionToken={sessionToken} /></div>
          </TabsContent>
          <TabsContent value="tourism" className="space-y-6">
            <AdminTourismRequests />
          </TabsContent>
          <TabsContent value="evisa-catalogue" className="space-y-6"><AdminEvisaCatalogueManager sessionToken={sessionToken} /></TabsContent>
          <TabsContent value="route-health" className="space-y-6"><AdminRouteHealthManager sessionToken={sessionToken} /></TabsContent>
          <TabsContent value="simulator-health" className="space-y-6"><AdminSimulatorHealth sessionToken={sessionToken} /></TabsContent>
          <TabsContent value="system-status" className="space-y-6"><AdminSystemStatus /></TabsContent>
          <TabsContent value="scheduler" className="space-y-6"><AdminSchedulerPanel /></TabsContent>
          <TabsContent value="footer-engagement" className="space-y-6"><AdminFooterEngagement sessionToken={sessionToken} /></TabsContent>

          <TabsContent value="consular" className="space-y-6">
            <AdminConsularRegistry sessionToken={sessionToken} />
          </TabsContent>

          <TabsContent value="destination-analytics" className="space-y-6">
            <AdminDestinationAnalytics sessionToken={sessionToken} />
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

          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <AdminCalendarView />
          </TabsContent>

          <TabsContent value="flights" className="space-y-6">
            <nav aria-label="Raccourcis de l’onglet vols" className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-sky-100 bg-white/95 p-3 shadow-sm backdrop-blur">
              <span className="mr-1 text-xs font-black uppercase tracking-wide text-slate-500">Accès rapide</span>
              <a href="#flight-queue" className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 underline-offset-2 hover:bg-sky-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">File des demandes</a>
              <a href="#flight-monitoring" className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 underline-offset-2 hover:bg-slate-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600">Supervision technique</a>
              <a href="#flight-commission" className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 underline-offset-2 hover:bg-amber-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700">Commission agence</a>
            </nav>
            <div id="flight-queue" className="scroll-mt-24"><FlightAgentDashboard /></div>
            <div id="flight-monitoring" className="scroll-mt-24 border-t border-slate-200 pt-6">
              <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Supervision technique &amp; réglages de commission</h3>
              <div className="space-y-6">
                <SearchApiMonitoring />
                <Card id="flight-commission" className="scroll-mt-24 border-0 shadow-sm hover:-translate-y-1">
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
              </div>
            </div>
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
                    Gestion Documentaire RAG (catalogue documenté)
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
                    maxLength={255}
                    className="px-3 py-2 text-sm rounded-lg border bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Pays (ex: Canada)"
                    id="rag-doc-country"
                    maxLength={100}
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
                    maxLength={500}
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
                    📚 Guides pays du catalogue documenté, indexés par défaut dans le moteur RAG d’Aureol.
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
              maxLength={200}
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
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par type de visa" data-testid="visa-kind-filters">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Type de visa</span>
            {([["ALL", "Tous"], ["work", "Travail"], ["study", "Études"], ["visitor", "Visiteur"], ["evisa", "e-Visa"], ["family", "Famille"], ["residence", "Résidence"], ["other", "À qualifier"]] as const).map(([key, label]) => {
              const count = key === "ALL" ? undefined : (data as { availableVisaKinds?: Record<string, number> } | undefined)?.availableVisaKinds?.[key] ?? 0;
              if (key !== "ALL" && !count && visaKindFilter !== key) return null;
              const active = visaKindFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  data-testid={`visa-kind-${key}`}
                  onClick={() => setVisaKindFilter(key)}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"}`}
                >
                  {label}{count !== undefined && <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-slate-100"}`}>{count}</span>}
                </button>
              );
            })}
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
            <Button
              type="button"
              variant={assignedToMeFilter ? "default" : "outline"}
              className={`w-full gap-2 lg:w-auto ${assignedToMeFilter ? "bg-blue-700 hover:bg-blue-800" : ""}`}
              aria-pressed={assignedToMeFilter}
              onClick={() => setAssignedToMeFilter((value) => !value)}
              title="N’afficher que les dossiers qui me sont assignés"
            >
              <UserCheck className="h-4 w-4" />
              Mes dossiers
            </Button>
            <Button
              type="button"
              variant={activationFilter === "active" ? "default" : "outline"}
              className={`w-full gap-2 lg:w-auto ${activationFilter === "active" ? "bg-emerald-700 hover:bg-emerald-800" : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"}`}
              aria-pressed={activationFilter === "active"}
              onClick={() => setActivationFilter((value) => value === "active" ? "ALL" : "active")}
              title="Afficher uniquement les comptes activés, considérés comme comptes premium opérationnels"
            >
              <Sparkles className="h-4 w-4" />
              Comptes premium / activés
            </Button>
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
            <Select value={nextActionFilter} onValueChange={(value) => setNextActionFilter(value as typeof nextActionFilter)}>
              <SelectTrigger className="w-full lg:w-56" aria-label="Filtrer par prochaine action"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Toutes les prochaines actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les prochaines actions</SelectItem>
                <SelectItem value="high">Critiques / en retard</SelectItem>
                <SelectItem value="medium">À surveiller</SelectItem>
                <SelectItem value="low">Faible priorité</SelectItem>
              </SelectContent>
            </Select>
            <Select value={nextActionSort} onValueChange={(value) => setNextActionSort(value as typeof nextActionSort)}>
              <SelectTrigger className="w-full lg:w-56" aria-label="Trier par prochaine action"><ArrowDownUp className="mr-2 h-4 w-4" /><SelectValue placeholder="Ordre des actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Ordre des dossiers</SelectItem>
                <SelectItem value="urgency_desc">Urgence décroissante</SelectItem>
                <SelectItem value="label">Action par ordre alphabétique</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              variant={nextActionFilter === "high" && nextActionSort === "urgency_desc" ? "default" : "outline"}
              className={`h-10 gap-2 ${nextActionFilter === "high" && nextActionSort === "urgency_desc" ? "bg-rose-700 hover:bg-rose-800" : "border-rose-200 text-rose-800 hover:bg-rose-50"}`}
              aria-pressed={nextActionFilter === "high" && nextActionSort === "urgency_desc"}
              onClick={() => {
                const active = nextActionFilter === "high" && nextActionSort === "urgency_desc";
                setNextActionFilter(active ? "ALL" : "high");
                setNextActionSort(active ? "default" : "urgency_desc");
              }}
            >
              <AlertCircle className="h-4 w-4" /> Urgents d’abord
            </Button>
            {hasCandidateFilters && <Button type="button" variant="outline" onClick={resetCandidateFilters} className="gap-2"><X className="h-4 w-4" />Réinitialiser</Button>}
            <Button type="button" variant="outline" onClick={() => setShowArchiveView(true)} className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" />Corbeille / doublons</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-2" aria-label="Filtres rapides par étape">
            <span className="px-1 text-xs font-bold uppercase tracking-wide text-blue-800">Accès rapide :</span>
            {[['PENDING_48H', 'Évaluation'], ['PUBLISHED', 'Ouverture'], ['DOCUMENTS_CHECK', 'Documents'], ['SUBMITTED', 'Suivi & dépôt'], ['APPROVED', 'Décision favorable']].map(([value, label]) => <Button key={value} type="button" size="sm" variant={statusFilter === value ? "default" : "outline"} onClick={() => setStatusFilter(statusFilter === value ? "ALL" : value)} className="h-8 bg-white text-xs">{label}</Button>)}
          </div>
          {Object.keys(pendingInlineChanges).length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2" role="status"><div className="text-sm text-amber-950"><strong>{Object.keys(pendingInlineChanges).length}</strong> dossier(s) modifié(s) en attente d’enregistrement. Les badges marqués « à enregistrer » ne sont pas encore persistés.</div><div className="flex items-center gap-2"><Button type="button" variant="outline" onClick={() => setPendingInlineChanges({})} disabled={updateDossierPaymentStateMutation.isPending || updateInlineProcedureMutation.isPending || confirmInlinePaymentMutation.isPending}>Annuler les changements</Button><Button type="button" onClick={() => setShowPendingSaveConfirm(true)} disabled={updateDossierPaymentStateMutation.isPending || updateInlineProcedureMutation.isPending || confirmInlinePaymentMutation.isPending} className="bg-amber-700 text-white hover:bg-amber-800">{updateDossierPaymentStateMutation.isPending || updateInlineProcedureMutation.isPending || confirmInlinePaymentMutation.isPending ? "Enregistrement…" : "Enregistrer les modifications"}</Button></div></div>}
        </div>

        <Dialog open={showPendingSaveConfirm} onOpenChange={setShowPendingSaveConfirm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Confirmer l’enregistrement groupé</DialogTitle>
              <DialogDescription>Vérifiez les modifications en attente avant leur persistance définitive.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3">
              {Object.entries(pendingInlineChanges).map(([candidateId, changes]) => {
                const candidate = candidates.find((item) => String(item.id) === candidateId);
                return <div key={candidateId} className="rounded border border-amber-200 bg-white p-3 text-sm"><p className="font-semibold text-slate-900">{candidate?.folderCode ?? `Dossier ${candidateId}`}{candidate?.fullName ? ` — ${candidate.fullName}` : ""}</p><div className="mt-1 space-y-1 text-slate-700">{changes.paymentStatus && <p>Statut paiement : <strong>{PAYMENT_STATUS_LABELS[changes.paymentStatus] ?? changes.paymentStatus}</strong></p>}{changes.procedureStep && <p>Étape : <strong>{candidate ? procedureStageLabel(candidate, changes.procedureStep) : (PROCEDURE_STEP_LABELS[changes.procedureStep] ?? changes.procedureStep)}</strong></p>}</div></div>;
              })}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPendingSaveConfirm(false)} disabled={updateDossierPaymentStateMutation.isPending || updateInlineProcedureMutation.isPending || confirmInlinePaymentMutation.isPending}>Retour aux modifications</Button>
              <Button type="button" onClick={() => { setShowPendingSaveConfirm(false); void saveInlineChanges(); }} disabled={updateDossierPaymentStateMutation.isPending || updateInlineProcedureMutation.isPending || confirmInlinePaymentMutation.isPending} className="bg-amber-700 text-white hover:bg-amber-800">Confirmer et enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={showArchiveView} onOpenChange={setShowArchiveView}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>Corbeille réversible — doublons et comptes mal créés</DialogTitle><DialogDescription>Les enregistrements archivés restent restaurables. Aucune suppression physique n’est effectuée.</DialogDescription></DialogHeader>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Pré-dossiers en doublon (créés avant l’activation du compte)</p>
                  <p className="text-xs text-amber-700">Un pré-dossier anonyme et jamais payé qui partage l’e-mail d’un compte déjà activé. Nouvellement créés, ils sont désormais archivés automatiquement ; ce bouton nettoie ceux déjà existants.</p>
                </div>
                <Button type="button" size="sm" variant="outline" disabled={cleanupOrphanedPreAccountsMutation.isPending} onClick={() => cleanupOrphanedPreAccountsMutation.mutate({ sessionToken, confirmDelete: false })} className="border-amber-300 text-amber-900 hover:bg-amber-100">
                  {cleanupOrphanedPreAccountsMutation.isPending ? "Détection…" : "Détecter les doublons"}
                </Button>
              </div>
              {orphanCleanupPreview && (
                <div className="mt-3 border-t border-amber-200 pt-3">
                  {orphanCleanupPreview.count === 0 ? (
                    <p className="text-xs text-amber-800">Aucun pré-dossier en doublon détecté.</p>
                  ) : (
                    <>
                      <div className="max-h-32 space-y-1 overflow-y-auto text-xs text-amber-900">
                        {orphanCleanupPreview.duplicates.map((item) => (
                          <p key={item.dossierNumber}><span className="font-mono font-semibold">{item.dossierNumber}</span> — {item.fullName} ({item.email})</p>
                        ))}
                      </div>
                      <Button type="button" size="sm" disabled={cleanupOrphanedPreAccountsMutation.isPending} onClick={() => cleanupOrphanedPreAccountsMutation.mutate({ sessionToken, confirmDelete: true })} className="mt-2 bg-amber-700 text-white hover:bg-amber-800">
                        {cleanupOrphanedPreAccountsMutation.isPending ? "Archivage…" : `Archiver ces ${orphanCleanupPreview.count} doublon${orphanCleanupPreview.count > 1 ? "s" : ""}`}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
            <Input value={archiveSearch} onChange={(event) => setArchiveSearch(event.target.value)} placeholder="Rechercher une référence, un nom ou un e-mail…" aria-label="Rechercher dans la corbeille" maxLength={200} />
            <div className="max-h-[55vh] space-y-2 overflow-y-auto">
              {archivedRecordsQuery.isLoading && <p className="text-sm text-slate-500">Chargement des archives…</p>}
              {!archivedRecordsQuery.isLoading && !(archivedRecordsQuery.data?.length) && <p className="text-sm text-slate-500">Aucune archive dans la corbeille.</p>}
              {(archivedRecordsQuery.data ?? []).map((record) => <div key={record.candidateId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"><div><p className="font-semibold text-slate-800">{record.reference} — {record.fullName}</p><p className="text-xs text-slate-500">{record.email} · {record.source} · {record.reason || "Motif non renseigné"}</p><p className="text-xs text-slate-400">Archivé le {record.deletedAt ? new Date(record.deletedAt).toLocaleString("fr-FR") : "—"} par {record.deletedBy || "—"}</p></div><Button type="button" variant="outline" disabled={restoreArchivedMutation.isPending} onClick={() => setRestoreDialogRecord({ candidateId: record.candidateId, reference: record.reference })}>Restaurer</Button>{record.source === "account" && <Button type="button" variant="destructive" disabled={purgeArchivedMutation.isPending} onClick={() => { setPurgeEmailInput(""); setPurgeDialogRecord({ candidateId: record.candidateId, reference: record.reference, email: record.email }); }}>Supprimer définitivement</Button>}</div>)}
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={Boolean(purgeDialogRecord)} onOpenChange={(open) => { if (!open) { setPurgeDialogRecord(null); setPurgeEmailInput(""); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer définitivement {purgeDialogRecord?.reference} ?</AlertDialogTitle>
              <AlertDialogDescription>
                Action irréversible : le compte et ses données personnelles (messages, pièces déposées, notifications, consentements, fiches de placement) sont effacés, et l’adresse e-mail est libérée pour une nouvelle inscription. Les dossiers, évaluations et pièces comptables ne sont pas touchés. Impossible si un paiement est validé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="purge-email-confirmation">Pour confirmer, saisissez l’adresse e-mail du compte : <strong>{purgeDialogRecord?.email}</strong></Label>
              <Input id="purge-email-confirmation" value={purgeEmailInput} onChange={(event) => setPurgeEmailInput(event.target.value)} autoComplete="off" maxLength={320} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={!purgeDialogRecord || purgeArchivedMutation.isPending || purgeEmailInput.trim().toLowerCase() !== (purgeDialogRecord?.email ?? "").trim().toLowerCase()}
                onClick={(event) => {
                  event.preventDefault();
                  if (!purgeDialogRecord) return;
                  purgeArchivedMutation.mutate({ sessionToken, candidateId: purgeDialogRecord.candidateId, emailConfirmation: purgeEmailInput, confirmation: "SUPPRIMER DEFINITIVEMENT" });
                }}
              >
                Supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={Boolean(restoreDialogRecord)} onOpenChange={(open) => { if (!open) setRestoreDialogRecord(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurer {restoreDialogRecord?.reference} ?</AlertDialogTitle>
              <AlertDialogDescription>L’enregistrement redeviendra visible dans la liste active des dossiers.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={restoreArchivedMutation.isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={restoreArchivedMutation.isPending}
                onClick={(event) => {
                  event.preventDefault();
                  if (!restoreDialogRecord) return;
                  restoreArchivedMutation.mutate({ sessionToken, candidateId: restoreDialogRecord.candidateId, confirmation: "RESTAURER" }, { onSuccess: () => setRestoreDialogRecord(null) });
                }}
              >
                {restoreArchivedMutation.isPending ? "Restauration…" : "Confirmer la restauration"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={Boolean(archiveDialogItems)} onOpenChange={(open) => { if (!open) setArchiveDialogItems(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Mettre {archiveDialogItems?.length ?? 0} dossier{(archiveDialogItems?.length ?? 0) > 1 ? "s" : ""} à la corbeille</DialogTitle>
              <DialogDescription>Action réversible : les dossiers restent restaurables depuis Corbeille / doublons. Un motif d’au moins 8 caractères est obligatoire.</DialogDescription>
            </DialogHeader>
            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
              {archiveDialogItems?.map((item) => (
                <p key={item.id} className="text-sm text-slate-700">
                  <span className="font-mono text-xs font-semibold text-blue-700">{item.folderCode ?? "—"}</span> — {item.fullName ?? "—"}{item.email ? ` (${item.email})` : ""}
                </p>
              ))}
            </div>
            <div>
              <Label htmlFor="archive-reason-input">Motif (doublon, compte mal créé, autre)</Label>
              <textarea
                id="archive-reason-input"
                value={archiveReasonInput}
                onChange={(event) => setArchiveReasonInput(event.target.value)}
                maxLength={500}
                className="mt-2 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setArchiveDialogItems(null)} disabled={archiveDuplicateMutation.isPending}>Annuler</Button>
              <Button type="button" className="bg-rose-700 hover:bg-rose-800" onClick={() => void confirmArchiveDialog()} disabled={archiveDuplicateMutation.isPending || archiveReasonInput.trim().length < 8}>
                {archiveDuplicateMutation.isPending ? "Archivage…" : "Confirmer la mise à la corbeille"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedCandidateIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-900">{selectedCandidateIds.size} dossier{selectedCandidateIds.size > 1 ? "s" : ""} sélectionné{selectedCandidateIds.size > 1 ? "s" : ""}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCandidateIds(new Set())}>Tout désélectionner</Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
                disabled={archiveDuplicateMutation.isPending}
                onClick={() => openBulkArchiveDialog(candidates.flatMap((candidate) => typeof candidate.id === "string" && selectedCandidateIds.has(candidate.id) ? [{ id: candidate.id, folderCode: candidate.folderCode, fullName: candidate.fullName, email: candidate.email, source: candidate.source }] : []))}
              >
                <Trash2 className="h-4 w-4" />
                Mettre à la corbeille ({selectedCandidateIds.size})
              </Button>
            </div>
          </div>
        )}

        {/* Tableau */}
        <Card className="admin-glass-table border-0 overflow-hidden hover:-translate-y-0.5" aria-busy={isLoading}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200/70">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      aria-label="Sélectionner tous les dossiers affichés"
                      checked={displayCandidates.length > 0 && displayCandidates.every((candidate) => selectedCandidateIds.has(candidate.id))}
                      onChange={(event) => setSelectedCandidateIds(event.target.checked ? new Set(displayCandidates.map((candidate) => candidate.id)) : new Set())}
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">N° Dossier</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Candidat</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">Destination</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden lg:table-cell">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Activation</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Paiement</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Étape de la procédure</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden lg:table-cell">Prochaine action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden xl:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/70">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 13 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="admin-table-skeleton h-4 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : displayCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>{candidateListError ? "Impossible de synchroniser la liste. Réessayez dans quelques secondes." : isLoading ? "Chargement des dossiers…" : "Aucun candidat trouvé"}</p>
                      {hasCandidateFilters && !candidateListError && (
                        <p className="text-xs mt-1">Essayez de modifier vos filtres</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className={`transition-colors cursor-pointer ${pendingInlineChanges[candidate.id] ? "bg-amber-50/90 hover:bg-amber-100/90 ring-1 ring-inset ring-amber-200" : "hover:bg-blue-50/40"}`}
                      onClick={() => setSelectedCandidateId(candidate.id)}
                    >
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          aria-label={`Sélectionner le dossier de ${candidate.fullName}`}
                          checked={selectedCandidateIds.has(candidate.id)}
                          onChange={() => toggleCandidateSelection(candidate.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit" title={`Référence dossier ${candidate.folderCode}`}>
                            {candidate.folderCode}
                          </span>
                          {candidate.isActiveDossier && (
                            <span data-testid="admin-active-treatment-badge" data-active-dossier-badge="admin-active-dossier-badge" className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Dossier actif
                            </span>
                          )}
                          {(() => {
                            const readiness = preDossierReadinessBadge({
                              source: candidate.source,
                              evaluationDeclarationStatus: candidate.evaluationDeclarationStatus,
                              paymentStatus: pendingInlineChanges[candidate.id]?.paymentStatus ?? candidate.paymentStatus,
                            });
                            if (!readiness) return null;
                            const toneClass =
                              readiness.tone === "emerald"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : readiness.tone === "rose"
                                  ? "border-rose-200 bg-rose-50 text-rose-800"
                                  : "border-amber-200 bg-amber-50 text-amber-900";
                            return (
                              <span data-testid="admin-predossier-readiness-badge" className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${toneClass}`}>
                                {readiness.label}
                              </span>
                            );
                          })()}
                          <span className="text-[10px] font-semibold text-slate-700">
                            {procedureLabelForDossier({ visaType: candidate.projectType, destination: candidate.destinationCountry, dossierNumber: candidate.folderCode })}
                          </span>
                          {(candidate.siblingProcedures?.length ?? 0) > 0 && (
                            <div className="mt-1 space-y-0.5" data-testid="admin-sibling-dossiers">
                              <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                                {candidate.siblingCount ?? (candidate.siblingProcedures!.length + 1)} procédures · même client
                              </span>
                              {candidate.siblingProcedures!.slice(0, 3).map((sibling) => (
                                <button
                                  key={sibling.id}
                                  type="button"
                                  className="block max-w-[220px] truncate text-left text-[10px] font-semibold text-blue-800 underline-offset-2 hover:underline"
                                  title={`Ouvrir ${sibling.folderCode}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedCandidateId(sibling.id);
                                  }}
                                >
                                  Aussi : {procedureLabelForDossier({ visaType: sibling.projectType, destination: sibling.destinationCountry, dossierNumber: sibling.folderCode })} · {sibling.folderCode}
                                </button>
                              ))}
                            </div>
                          )}
                          <span className="text-[10px] text-slate-500 lg:hidden">
                            {determineAdminListNextAction({
                              paymentStatus: pendingInlineChanges[candidate.id]?.paymentStatus ?? candidate.paymentStatus,
                              procedureStep: pendingInlineChanges[candidate.id]?.procedureStep ?? candidate.procedureStep ?? candidate.status,
                              status: candidate.status,
                              activationStatus: candidate.activationStatus,
                              destination: candidate.destinationCountry,
                              visaType: candidate.projectType,
                            }).label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800 truncate max-w-[160px]">{candidate.fullName}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[160px]">{candidate.email}</p>
                          <div className="mt-1"><EvaluationDeclarationBadge status={candidate.evaluationDeclarationStatus as EvaluationDeclarationStatus | undefined} /></div>
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
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        {(() => { const pendingPayment = pendingInlineChanges[candidate.id]?.paymentStatus; const paymentStatus = pendingPayment ?? candidate.paymentStatus ?? "NOT_PAID"; return <div className="flex min-w-[128px] flex-col items-start gap-1"><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${PAYMENT_STATUS_BADGE_CLASSES[paymentStatus] ?? PAYMENT_STATUS_BADGE_CLASSES.NOT_PAID}`}>{PAYMENT_STATUS_LABELS[paymentStatus] ?? "Non payé"}{pendingPayment && <span className="ml-1 text-[9px] font-normal">· à enregistrer</span>}</span><Select value={paymentStatus} onValueChange={(value) => queueInlineChange(candidate.id, "paymentStatus", value)}><SelectTrigger aria-label={`Modifier le statut du paiement de ${candidate.fullName}`} className="h-8 w-full min-w-[128px] bg-white text-[11px] font-semibold"><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent className="z-[120]">{Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>; })()}
                      </td>
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        {(() => {
                          const currentStep = candidate.procedureStep ?? candidate.status;
                          const pendingStep = pendingInlineChanges[candidate.id]?.procedureStep;
                          const procedureStep = pendingStep ?? currentStep;
                          const journey = candidate.procedureJourney;
                          const resourceLibraryHref = resourceLibraryPathForCountry(journey?.country);
                          return (
                            <div className="flex min-w-[180px] flex-col items-start gap-1" data-testid="admin-procedure-journey">
                              {(journey?.country || journey?.visaType) && (
                                <span className="max-w-[200px] text-[10px] font-bold leading-tight text-slate-900" data-testid="admin-journey-country-visa">
                                  {[journey.country, journey.visaType].filter(Boolean).join(" · ")}
                                </span>
                              )}
                              {journey?.phaseLabel && (
                                <span className="max-w-[200px] text-[10px] font-semibold text-amber-800" data-testid="admin-journey-phase">
                                  {journey.phaseLabel}
                                  {typeof journey.agencyDone === "number"
                                    ? ` · Agence ${journey.agencyDone}/${journey.agencyTotal} · Pays ${journey.countryDone}/${journey.countryTotal}`
                                    : ""}
                                </span>
                              )}
                              {journey?.stepLabel && (
                                <span className="max-w-[200px] text-[10px] font-semibold leading-tight text-slate-700" title={journey.journeyTitle}>
                                  {journey.stepNumber != null ? `${journey.stepNumber}/${journey.stepCount} · ` : ""}{journey.stepLabel}
                                </span>
                              )}
                              {journey?.publishedGuide?.pdfUrl && (
                                <a
                                  href={journey.publishedGuide.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="max-w-[200px] truncate text-[10px] font-semibold text-blue-800 underline underline-offset-2"
                                  title={journey.publishedGuide.summaryOverview || journey.publishedGuide.title}
                                  data-testid="admin-published-guide-link"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  Guide PDF · {journey.publishedGuide.programLabel || journey.publishedGuide.title}
                                </a>
                              )}
                              {resourceLibraryHref && (
                                <a
                                  href={resourceLibraryHref}
                                  className="max-w-[200px] truncate text-[10px] font-semibold text-indigo-800 underline underline-offset-2"
                                  data-testid="admin-resource-library-link"
                                  onClick={(event) => event.stopPropagation()}
                                  title={`Bibliothèque PDF ${journey?.country}`}
                                >
                                  Bibliothèque · {journey?.country}
                                </a>
                              )}
                              {journey?.publishedGuide?.officialPortalUrl && (
                                <a
                                  href={journey.publishedGuide.officialPortalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="max-w-[200px] truncate text-[10px] font-semibold text-emerald-800 underline underline-offset-2"
                                  data-testid="admin-official-portal-link"
                                  onClick={(event) => event.stopPropagation()}
                                  title={journey.publishedGuide.officialPortalLabel || "Portail officiel"}
                                >
                                  Portail officiel
                                </a>
                              )}
                              {journey?.publishedGuide?.summaryOverview && (
                                <span className="max-w-[220px] line-clamp-2 text-[9px] leading-snug text-slate-500" data-testid="admin-guide-summary">
                                  {journey.publishedGuide.summaryOverview}
                                </span>
                              )}
                              {journey?.nextStepLabel && (
                                <span className="max-w-[200px] text-[10px] text-slate-500">Suite : {journey.nextStepLabel}</span>
                              )}
                              {candidate.journeySla && (
                                <span
                                  className={`max-w-[200px] text-[10px] font-semibold ${
                                    candidate.journeySla.tone === "overdue"
                                      ? "text-rose-700"
                                      : candidate.journeySla.tone === "soon"
                                        ? "text-amber-700"
                                        : "text-slate-500"
                                  }`}
                                  title={candidate.journeySla.explanation}
                                  data-testid="admin-journey-sla"
                                >
                                  {candidate.journeySla.label}
                                </span>
                              )}
                              <span className={`inline-flex max-w-[200px] items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${PROCEDURE_STEP_BADGE_CLASSES[procedureStep] ?? "border-slate-300 bg-slate-100 text-slate-700"}`}>
                                {procedureStageLabel(candidate, procedureStep)}{pendingStep && <span className="ml-1 text-[9px] font-normal">· à enregistrer</span>}
                              </span>
                              <Select value={procedureStep} onValueChange={(value) => queueInlineChange(candidate.id, "procedureStep", value)}>
                                <SelectTrigger aria-label={`Modifier l’étape de la procédure de ${candidate.fullName}`} className="h-8 w-full min-w-[160px] bg-white text-[11px] font-semibold">
                                  <SelectValue placeholder="Choisir" />
                                </SelectTrigger>
                                <SelectContent className="z-[120]">
                                  {ADMIN_OPERATIONAL_STAGES.map((value) => (
                                    <SelectItem key={value} value={value}>{procedureStageLabel(candidate, value)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={candidate.status} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {(() => {
                          const next = determineAdminListNextAction({
                            paymentStatus: pendingInlineChanges[candidate.id]?.paymentStatus ?? candidate.paymentStatus,
                            procedureStep: pendingInlineChanges[candidate.id]?.procedureStep ?? candidate.procedureStep ?? candidate.status,
                            status: candidate.status,
                            activationStatus: candidate.activationStatus,
                            destination: candidate.destinationCountry,
                            visaType: candidate.projectType,
                          });
                          return (
                            <span className={`inline-flex max-w-[220px] items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold leading-tight transition-colors duration-200 ${ADMIN_NEXT_ACTION_URGENCY_CLASS[next.urgency]}`} title={`Priorité ${next.urgency === "high" ? "critique / en retard" : next.urgency === "medium" ? "à surveiller" : "faible"}`}>
                              {next.urgency === "high" ? <AlertCircle className="h-3.5 w-3.5 shrink-0" /> : next.urgency === "medium" ? <Clock className="h-3.5 w-3.5 shrink-0" /> : <CheckCircle className="h-3.5 w-3.5 shrink-0" />}
                              {next.label}
                            </span>
                          );
                        })()}
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-blue-100"
                            aria-label={`Ouvrir la fiche de ${candidate.fullName}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidateId(candidate.id);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-rose-100"
                            aria-label={`Mettre ${candidate.fullName} à la corbeille`}
                            disabled={archiveDuplicateMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveCandidateFromTable(candidate);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </Button>
                        </div>
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
            <AdminPreDossierAccountsPanel
              sessionToken={sessionToken}
              onOpenCandidate={(openId) => setSelectedCandidateId(openId)}
              activateAccountId={preDossierActivateAccountId}
              onActivateAccountConsumed={() => setPreDossierActivateAccountId(null)}
            />
            <AdminNoEvaluationOutreachPanel sessionToken={sessionToken} />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AdminAuditLogPanel sessionToken={sessionToken} />
            <AdminRedundantPreAccountsPanel sessionToken={sessionToken} />
          </TabsContent>

          <TabsContent value="rates" className="space-y-6">
            <AdminCurrencyRates />
          </TabsContent>

          <TabsContent value="passport-history" className="space-y-6">
            <AdminPassportCorrectionHistory />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <AdminContractsReceiptsDesk sessionToken={sessionToken || ""} onOpenCandidate={(candidateId) => setSelectedCandidateId(candidateId)} />
            <AdminPaymentInstructions sessionToken={sessionToken || ""} />
            <AdminPaymentManagement
              sessionToken={sessionToken || ""}
              onOpenCandidate={(openId) => setSelectedCandidateId(openId)}
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
          sessionToken={sessionToken}
          onClose={() => { setSelectedCandidateId(null); setOpenEvaluationEditor(false); }}
          onStatusUpdated={handleRefresh}
          openEvaluationEditor={openEvaluationEditor}
          onNavigateToCandidate={(nextCandidateId) => {
            setOpenEvaluationEditor(false);
            setSelectedCandidateId(nextCandidateId);
            toast({ title: "Dossier ouvert", description: "Le dossier lié a été ouvert dans la fiche 360°." });
          }}
          onOpenOperations={(area, folderCode) => {
            setSearch(folderCode);
            setActiveAdminTab(area);
            setSelectedCandidateId(null);
            toast({ title: "Centre de traitement ouvert", description: `Module ${area === "documents" ? "documents" : area === "payments" ? "paiements" : "e-mails"} ouvert pour poursuivre le traitement du dossier ${folderCode}.` });
          }}
          onOpenFullActivation={(accountId) => {
            setOpenEvaluationEditor(false);
            setSelectedCandidateId(null);
            setActiveAdminTab("pre-dossiers");
            setPreDossierActivateAccountId(accountId);
            toast({
              title: "Assistant d’activation",
              description: "Dialogue d’activation ouvert depuis la fiche 360° (paiement, double procédure, checklist).",
            });
          }}
        />
      )}

      {showImportModal && (
        <ImportAgencyModal
          onClose={() => setShowImportModal(false)}
          onImported={handleRefresh}
        />
      )}
    </main>
  );
}

function FlightCommissionSettings() {
  const { data, refetch } = trpc.flights.getCommission.useQuery();
  const [commission, setCommission] = useState<number>(8);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
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
    const sessionToken = localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken");
    if (!sessionToken) {
      toast({ title: "Session administrateur requise", description: "Reconnectez-vous avant de modifier la commission.", variant: "destructive" });
      return;
    }
    setIsConfirmationOpen(true);
  };

  const confirmSave = () => {
    const sessionToken = localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken");
    if (!sessionToken) {
      setIsConfirmationOpen(false);
      toast({ title: "Session administrateur requise", description: "Reconnectez-vous avant de modifier la commission.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      sessionToken,
      commissionPercent: Number(commission),
    });
    setIsConfirmationOpen(false);
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
      {data?.saved ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          Commission active : {data.commissionPercent}% ajoutés au tarif fournisseur sur les recherches, les meilleures offres et les récapitulatifs e-mail.
        </p>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Aucune commission enregistrée pour l'instant : les tarifs affichés sont ceux du fournisseur, sans marge ajoutée. Enregistrez un taux (0% pour confirmer sciemment aucune marge) pour l'activer.
        </p>
      )}
      <p className="text-xs text-gray-400">
        Une fois enregistrée, cette commission est automatiquement incluse dans les grilles tarifaires de vols présentées aux candidats et sur les récapitulatifs e-mail.
      </p>
      <AlertDialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la modification de commission</AlertDialogTitle>
            <AlertDialogDescription>
              Cette valeur modifiera les tarifs de vols affichés aux candidats et les récapitulatifs e-mail. Confirmez-vous l’application d’une commission de <strong>{commission}%</strong> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmSave} disabled={updateMutation.isPending} className="bg-blue-800 text-white hover:bg-blue-900">
              {updateMutation.isPending ? "Enregistrement…" : "Confirmer et enregistrer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

function SearchApiMonitoring() {
  const { toast } = useToast();
  const sessionToken = localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken");
  const { data: status, isLoading, refetch } = trpc.flights.getSearchApiStatus.useQuery(
    { sessionToken: sessionToken || "missing" },
    { enabled: Boolean(sessionToken), refetchOnWindowFocus: false }
  );
  // Diagnostic gratuit et sans secret exposé : dit si chaque fournisseur est configuré côté serveur (aucun appel payant).
  const { data: providerDiagnostics, refetch: refetchDiagnostics } = trpc.flights.providerDiagnostics.useQuery(undefined, { enabled: Boolean(sessionToken), refetchOnWindowFocus: false });
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

  const copySecretName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      toast({ title: "Nom de variable copié", description: `Ouvrez Paramètres > Secrets dans l’interface de gestion et remplacez la valeur de ${name}.` });
    } catch {
      toast({ title: "Mise à jour sécurisée", description: `Ouvrez Paramètres > Secrets dans l’interface de gestion puis remplacez ${name}.` });
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
          <Button type="button" variant="outline" size="sm" onClick={() => { refetch(); refetchDiagnostics(); }} disabled={isLoading || !sessionToken} className="gap-2">
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

      {providerDiagnostics && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3" data-testid="provider-diagnostics">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SearchAPI.io (principal)</p>
            <Badge className={`mt-2 border ${providerDiagnostics.searchApiConfigured ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
              {providerDiagnostics.searchApiConfigured ? "Clé vue par le serveur" : "Clé absente côté serveur"}
            </Badge>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SerpApi (secours)</p>
            <Badge className={`mt-2 border ${providerDiagnostics.serpApiConfigured ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
              {providerDiagnostics.serpApiConfigured ? "Clé vue par le serveur" : "Clé absente côté serveur"}
            </Badge>
            <p className="mt-2 text-xs text-slate-500">Utilisé seulement pour les recherches des visiteurs, jamais pour les offres ni les alertes.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secours utilisé aujourd’hui</p>
            <p className="mt-1 text-2xl font-black text-[#1E3A8A]">{providerDiagnostics.fallbackCallsToday} / 8</p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 md:flex-row md:items-center md:justify-between">
        <p><strong>Mettre à jour une clé :</strong> utilisez les <strong>Paramètres &gt; Secrets</strong> du projet, puis republiez le site. La valeur n’est jamais affichée ni enregistrée dans le navigateur.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => copySecretName("SEARCHAPI_KEY")} className="shrink-0 border-blue-200 text-[#1E3A8A]">
            Copier SEARCHAPI_KEY
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => copySecretName("SERPAPI_KEY")} className="shrink-0 border-blue-200 text-[#1E3A8A]">
            Copier SERPAPI_KEY
          </Button>
        </div>
      </div>
    </Card>
  );
}
