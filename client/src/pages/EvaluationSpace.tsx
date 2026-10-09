import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Loader2,
  ChevronRight,
  TrendingUp,
  FileText,
  Plane,
  FolderOpen,
  User,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { INITIAL_AGREEMENT_PROTOCOL } from "@shared/agreementProtocolContent";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import ClientSpaceNavigation from "@/components/ClientSpaceNavigation";
import ClientMessagesPanel from "@/components/ClientMessagesPanel";
import ClientProfilePanel from "@/components/ClientProfilePanel";
import { ProfileCompletionBar } from "@/components/ProfileCompletionBar";
import CandidateAvatar from "@/components/CandidateAvatar";
import DossierProgressTimeline from "@/components/DossierProgressTimeline";
import AgencyDocumentsPanel, { type AgencyDocumentView } from "@/components/AgencyDocumentsPanel";
import { clientStatusLabel, describeDossierProgress } from "@shared/dossierProgress";
import { accountReference } from "@shared/caseReference";
import DossierDocumentChecklist, { buildRequirementOptions, summarizeChecklist } from "@/components/DossierDocumentChecklist";
import { DocumentClarificationHistoryPanel } from "@/components/DocumentClarificationHistoryPanel";
import { DocumentUploader } from "@/components/DocumentUploader";
import { AureolAssistantChat } from "@/components/AureolAssistantChat";
import SavedDestinationComparisonsPanel from "@/components/SavedDestinationComparisonsPanel";
import EvaluationHistoryPanel from "@/components/EvaluationHistoryPanel";
import ClientAppointmentRequest from "@/components/ClientAppointmentRequest";
import SignatureCanvas from "@/components/SignatureCanvas";
import { CandidateCountryJourney } from "@/components/CandidateCountryJourney";
import CandidateEvaluationStatus from "@/components/CandidateEvaluationStatus";
import { SignableDocumentsPanel } from "@/components/SignableDocumentsPanel";
import NextStepCard from "@/components/NextStepCard";
import DossierPaymentCard from "@/components/DossierPaymentCard";
import WelcomeJourneyCard from "@/components/WelcomeJourneyCard";
import MyFlightRequestsCard from "@/components/MyFlightRequestsCard";
import PrivacyDataCard from "@/components/PrivacyDataCard";
import FlightAfterVisaCard from "@/components/FlightAfterVisaCard";
import SubmitReview from "@/pages/SubmitReview";
import CaseDocumentsPanel, { agencyDepositedDocuments } from "@/components/CaseDocumentsPanel";
import { EVALUATION_ANCHOR_ID, computeNextStep, type NextStep } from "@/lib/nextStep";
import { CLIENT_SPACE_SUMMARY_POLL_MS, buildClientSpaceSnapshot, clientSpacePolling, diffClientSpace, limitAnnouncements, mergeClientSpaceSnapshots, type ClientSpaceSnapshot } from "@/lib/clientSpaceSync";

export type ClientDossierStatusSummary = {
  label: string;
  progress: number;
  tone: string;
  nextAction: string;
};

export function clientDossierStatusSummary(status: string | null | undefined, paymentStatus?: string | null): ClientDossierStatusSummary {
  const normalized = String(status ?? "evaluation").toLowerCase();
  if (["approuve", "visa_approuve", "approved"].includes(normalized)) return { label: "Visa approuvé", progress: 100, tone: "border-emerald-200 bg-emerald-50 text-emerald-800", nextAction: "Préparer votre départ" };
  if (["refuse", "rejected"].includes(normalized)) return { label: "Décision à revoir", progress: 100, tone: "border-rose-200 bg-rose-50 text-rose-800", nextAction: "Contacter votre conseiller" };
  if (["soumis", "submitted"].includes(normalized)) return { label: "Dossier soumis", progress: 80, tone: "border-indigo-200 bg-indigo-50 text-indigo-800", nextAction: "Suivre la décision" };
  if (["traitement", "processing"].includes(normalized)) return { label: "En traitement", progress: 65, tone: "border-blue-200 bg-blue-50 text-blue-800", nextAction: "Vérifier les messages" };
  if (["documents", "documents_requis"].includes(normalized)) return { label: "Documents requis", progress: 45, tone: "border-amber-200 bg-amber-50 text-amber-800", nextAction: "Déposer les pièces demandées" };
  if (String(paymentStatus).toUpperCase() !== "SUCCESS") return { label: "Paiement à confirmer", progress: 25, tone: "border-orange-200 bg-orange-50 text-orange-800", nextAction: "Vérifier le paiement d’ouverture" };
  if (["evaluation", "evaluation_en_cours"].includes(normalized)) return { label: "Évaluation en cours", progress: 20, tone: "border-violet-200 bg-violet-50 text-violet-800", nextAction: "Consulter l’évaluation" };
  return { label: "Nouveau dossier", progress: 10, tone: "border-slate-200 bg-slate-50 text-slate-800", nextAction: "Compléter votre profil" };
}

export default function EvaluationSpace() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const section = searchParams.get("section") || "overview";
  const validSections = ["overview", "dossier", "signatures", "documents", "profile", "messages"] as const;
  type ClientSection = (typeof validSections)[number];
  const { candidate, isAuthenticated, logout } = useCandidateAuth();
  const trpcUtils = trpc.useUtils();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const initialSection = validSections.includes(section as ClientSection) ? (section as ClientSection) : "overview";
  const [activeTab, setActiveTab] = useState<ClientSection>(initialSection);
  const [clarificationDocument, setClarificationDocument] = useState<string | null>(null);
  const [clarificationDetails, setClarificationDetails] = useState("");
  const [uploadClarification, setUploadClarification] = useState<{ id: number; documentLabel: string } | null>(null);
  const seenAnsweredClarificationIds = useRef<Set<number> | null>(null);

  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementSignatureName, setAgreementSignatureName] = useState("");
  const [agreementSignatureDataUrl, setAgreementSignatureDataUrl] = useState<string | null>(null);
  const [agreementPreviewOpen, setAgreementPreviewOpen] = useState(false);
  const [agreementPreviewConfirmed, setAgreementPreviewConfirmed] = useState(false);
  // Un candidat peut ouvrir plusieurs dossiers en ligne pour des projets différents (ex. Études puis
  // Travail) : ce choix sélectionne lequel afficher. null = comportement par défaut du serveur (le
  // dossier payé, sinon le plus récent).
  const [selectedDossierNumber, setSelectedDossierNumber] = useState<string | null>(null);

  // Requête unique pour le résumé complet du tableau de bord client
  // Les données que l'administrateur fait évoluer se rafraîchissent seules (onglet visible) : voir clientSpaceSync.
  const { data: dashboardData, dataUpdatedAt: dashboardUpdatedAt, isLoading, isFetching, isError, error, refetch } = trpc.candidate.getClientDashboardSummary.useQuery(
    selectedDossierNumber ? { selectedDossierNumber } : undefined,
    {
      enabled: isAuthenticated,
      ...clientSpacePolling(CLIENT_SPACE_SUMMARY_POLL_MS),
      retry: 3,
      retryDelay: 1000,
    }
  );
  // Évaluation à validation administrateur : avis d’attente, demandes de complément puis rapport PUBLIÉ (jamais de brouillon).
  const structuredEvaluationQuery = trpc.evaluationValidation.myEvaluation.useQuery(undefined, { enabled: isAuthenticated, ...clientSpacePolling(), retry: 1 });
  const structuredEvaluation = structuredEvaluationQuery.data;
  // Les hooks doivent rester inconditionnels : la section dossier réutilise ce résultat sans remonter d’erreur de rendu.
  const evisaEmail = dashboardData?.candidate?.email ?? "";
  const { data: evisaReqs } = trpc.evisa.getMyEvisaRequests.useQuery(
    undefined,
    { enabled: isAuthenticated && Boolean(evisaEmail), ...clientSpacePolling(), retry: 1 },
  );
  const { data: caseTrackingData, dataUpdatedAt: caseTrackingUpdatedAt, refetch: refetchCaseTracking } = trpc.caseTracking.getMyCases.useQuery(undefined, {
    enabled: isAuthenticated,
    ...clientSpacePolling(),
    retry: 2,
  });
  const { data: insuranceRequests } = trpc.caseTracking.getMyInsuranceRequests.useQuery(undefined, {
    enabled: isAuthenticated,
    ...clientSpacePolling(),
    retry: false,
  });
  const downloadCaseDocument = async (documentId: number) => {
    try {
      const result = await trpcUtils.caseTracking.downloadMyDocument.fetch({ documentId });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Document indisponible pour le moment.");
    }
  };
  const downloadInsuranceCoupon = async (id: number) => {
    try {
      const result = await trpcUtils.caseTracking.downloadMyInsuranceCoupon.fetch({ insuranceRequestId: id });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Coupon indisponible pour le moment.");
    }
  };
  const downloadInsuranceAttestation = async (id: number) => {
    try {
      const result = await trpcUtils.caseTracking.downloadMyInsuranceAttestation.fetch({ insuranceRequestId: id });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Attestation indisponible pour le moment.");
    }
  };
  const { data: documentClarifications = [] } = trpc.candidate.getDocumentClarifications.useQuery(undefined, {
    enabled: isAuthenticated,
    ...clientSpacePolling(),
  });
  const signAgreementMutation = trpc.candidate.signAgreementProtocol.useMutation({
    onSuccess: (result) => {
      toast.success(result.message || "Protocole d’accord signé. Un exemplaire PDF signé vous a été envoyé par e-mail.");
      void trpcUtils.candidate.getClientDashboardSummary.invalidate();
      setAgreementAccepted(false);
      setAgreementSignatureName("");
      setAgreementSignatureDataUrl(null);
      setAgreementPreviewOpen(false);
      setAgreementPreviewConfirmed(false);
    },
    onError: (signError) => toast.error(signError.message || "La signature n’a pas pu être enregistrée."),
  });
  const clarificationMutation = trpc.candidate.requestDocumentClarification.useMutation({
    onSuccess: () => {
      toast.success("Votre demande de clarification a été transmise à l’agence.");
      setClarificationDocument(null);
      setClarificationDetails("");
      void Promise.all([
        trpcUtils.candidate.getClientDashboardSummary.invalidate(),
        trpcUtils.candidate.getDocumentClarifications.invalidate(),
      ]);
    },
    onError: (requestError) => {
      toast.error(requestError.message || "Votre demande n’a pas pu être envoyée. Réessayez dans quelques instants.");
    },
  });
  const sessionConfirmedInvalid = isError && /non authentifi|expir|invalid/i.test(error instanceof Error ? error.message : "");
  const [loadingTimeoutReached, setLoadingTimeoutReached] = useState(false);

  useEffect(() => {
    const answered = documentClarifications.filter((item) => item.status === "answered" && typeof item.id === "number" && item.documentLabel?.trim());
    const currentIds = new Set(answered.map((item) => item.id as number));
    if (!seenAnsweredClarificationIds.current) {
      seenAnsweredClarificationIds.current = currentIds;
      return;
    }
    const freshAnswer = answered.find((item) => !seenAnsweredClarificationIds.current?.has(item.id as number));
    if (freshAnswer) {
      toast.info("Réponse reçue pour une pièce justificative", {
        description: `Une réponse est disponible pour « ${freshAnswer.documentLabel} » dans votre checklist.`,
        duration: 8_000,
      });
    }
    seenAnsweredClarificationIds.current = currentIds;
  }, [documentClarifications]);

  // Ce que l'équipe change côté back-office (état d'un dossier, pièce validée ou à corriger, évaluation publiée,
  // e-Visa, assurance, message) est annoncé au candidat ; la première lecture sert de référence, sans annonce.
  const previousSpaceSnapshot = useRef<ClientSpaceSnapshot | null>(null);
  useEffect(() => {
    const activeStatus = dashboardData?.candidate?.dossierStatus ?? dashboardData?.activeDossier?.dossierStatus;
    const activeNumber = dashboardData?.activeDossier?.dossierNumber ?? (dashboardData?.candidate as { dossierNumber?: string | null } | undefined)?.dossierNumber ?? null;
    const next = buildClientSpaceSnapshot({
      evaluation: structuredEvaluation,
      cases: caseTrackingData,
      insurance: insuranceRequests,
      evisa: evisaReqs,
      procedure: activeStatus
        ? { status: String(activeStatus), label: clientStatusLabel(String(activeStatus)), number: activeNumber ? String(activeNumber) : null }
        : undefined,
    });
    const changes = diffClientSpace(previousSpaceSnapshot.current, next);
    previousSpaceSnapshot.current = mergeClientSpaceSnapshots(previousSpaceSnapshot.current, next);
    for (const change of limitAnnouncements(changes)) {
      const options = { id: change.id, description: change.description, duration: 8_000 };
      if (change.tone === "success") toast.success(change.title, options);
      else if (change.tone === "warning") toast.warning(change.title, options);
      else toast.info(change.title, options);
    }
  }, [structuredEvaluation, caseTrackingData, insuranceRequests, evisaReqs, dashboardData]);

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
    const [result, caseResult] = await Promise.all([refetch(), refetchCaseTracking()]);
    if (!result.error && !caseResult.error) setLastSyncedAt(Date.now());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // « Mise à jour à » suit la dernière lecture réussie, pas seulement un changement de contenu.
  const lastDataUpdate = Math.max(dashboardUpdatedAt || 0, caseTrackingUpdatedAt || 0);
  useEffect(() => {
    if (lastDataUpdate) setLastSyncedAt(lastDataUpdate);
  }, [lastDataUpdate]);

  useEffect(() => {
    if (searchParams.get("section")) {
      const s = searchParams.get("section") as ClientSection;
      if (validSections.includes(s)) {
        setActiveTab(s);
      }
    }
  }, [location]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
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
      </main>
    );
  }

  if (isLoading && !loadingTimeoutReached) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center" aria-busy="true" aria-live="polite">
        <Card className="w-full max-w-md p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <Loader2 className="h-9 w-9 animate-spin" aria-hidden="true" />
          </div>
          <h2 className="mb-1 text-xl font-bold text-gray-900">Chargement de votre tableau de bord...</h2>
          <p className="text-sm text-gray-500">Récupération sécurisée de vos dossiers, documents et messages.</p>
          <div className="mt-6 space-y-3" aria-hidden="true">
            <div className="h-3 animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-200" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
          <p className="mt-5 text-xs text-slate-500">Si cela dure, un bouton de reprise apparaîtra automatiquement.</p>
        </Card>
      </main>
    );
  }

  if (isError || !dashboardData) {
    const errorMessage = error instanceof Error ? error.message : "La synchronisation de votre dossier n’a pas abouti.";
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Votre espace ne répond pas encore</h2>
          <p className="text-gray-600 text-sm">Nous n’avons pas pu synchroniser les données de votre dossier. Vos informations restent conservées.</p>
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-left text-xs text-amber-900">{errorMessage}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button onClick={() => { setLoadingTimeoutReached(false); void refetch(); }} className="bg-blue-600 hover:bg-blue-700"><RefreshCw className="mr-2 h-4 w-4" />Réessayer</Button>
            {sessionConfirmedInvalid ? <Button variant="outline" onClick={() => { logout(); setLocation("/login"); }}>Se reconnecter</Button> : <Button variant="outline" onClick={() => void refetch()}>Conserver ma session</Button>}
          </div>
          <Button variant="link" className="mt-3 text-sm" onClick={() => setLocation(`/mon-espace?section=messages`)}><MessageSquare className="mr-1 h-4 w-4" />Contacter l’agence</Button>
        </Card>
      </main>
    );
  }

  const { candidate: rawCProfile, activeDossier, onlineDossiers, favoriteFlights, evaluations, messages, candidateFiles, agencyDocuments, stats } = dashboardData;
  const signedProtocolDocument = (agencyDocuments as any[]).find((document) => /protocole|accord/i.test(`${document.documentName ?? ""} ${document.documentType ?? ""}`) && /sign/i.test(`${document.documentName ?? ""} ${document.uploadedByAdmin ?? ""}`));
  const dossierSwitcherLabel = (dossier: { visaType?: string | null; destination?: string | null; dossierNumber?: string | null }) =>
    dossier.visaType || dossier.destination || dossier.dossierNumber || "";
  const cProfile = {
    ...rawCProfile,
    dossierNumber: rawCProfile.dossierNumber && rawCProfile.dossierNumber !== "N/A"
      ? rawCProfile.dossierNumber
      : activeDossier?.dossierNumber
        || ((rawCProfile.dossierStatus !== "nouveau" || rawCProfile.evaluationDeclarationStatus === "validated")
          ? accountReference(rawCProfile.id)
          : "N/A"),
  };
  // Référence lue par le candidat : « COMPTE-… » avant l'activation, numéro de dossier « 3M-… » après (dossierNumber reste la clé technique).
  const displayReference: string = (rawCProfile as any).reference?.reference ?? cProfile.dossierNumber;
  const formerAccountReference: string | null = (rawCProfile as any).reference?.formerAccountReference ?? null;
  const workflow = dashboardData.workflow;
  const portraitIsMissing = !cProfile.avatarUrl;
  // Pays précis déclarés à l'inscription (jusqu'à 3). Prioritaire sur cProfile.destination, qui ne
  // reste qu'une catégorie large ("europe", "golfe"...) insuffisante pour la checklist et le score.
  const preferredDestinationsList: string[] = (() => {
    try {
      const parsed = JSON.parse((rawCProfile as any).preferredDestinations || "[]");
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string" && value.length > 0) : [];
    } catch {
      return [];
    }
  })();
  const primaryDestination = preferredDestinationsList[0] || cProfile.destination;
  const checklistDocuments = [...(agencyDocuments ?? []), ...(candidateFiles ?? [])].map((document: any) => ({
    documentType: document.documentType ?? document.fileType,
    documentName: document.documentName ?? document.fileName,
    verificationStatus: document.verificationStatus,
    status: document.status,
  }));
  // Après l'envoi d'une pièce depuis la checklist : la liste, les compteurs et l'état de chaque pièce se rafraîchissent.
  const refreshDocuments = () => {
    void trpcUtils.candidate.getMyAgencyDocuments.invalidate();
    void refetch();
  };
  const agencyDocumentCount = (agencyDocuments ?? []).length;
  const candidateDocumentCount = (candidateFiles ?? []).length;
  // Même libellé que les e-mails et les notifications : source unique dans shared/dossierProgress.ts.
  const currentDossierStatusLabel = clientStatusLabel(cProfile.dossierStatus);
  const latestEvaluation = (evaluations[0] as any) ?? (activeDossier?.evaluationDeliveryStatus === "sent" ? {
    id: `application-${activeDossier.id}`,
    referenceCode: activeDossier.dossierNumber,
    destinationCountry: activeDossier.destination,
    projectType: (activeDossier as any).projectType,
    visaType: (activeDossier as any).visaType,
    status: "completed",
    finalResponseSentAt: activeDossier.evaluationCompletedAt,
    reviewDraft: activeDossier.evaluationDeliveryMessage,
    createdAt: activeDossier.evaluationCompletedAt,
  } : null);
  const candidateCase = (caseTrackingData?.cases?.[0] ?? null) as any;
  const validatedSteps = (candidateCase?.history ?? []).filter((entry: any) => entry.changedByRole === "admin" || entry.changedByRole === "system").slice(0, 5);
  const evaluationCaseNumber = latestEvaluation?.referenceCode ? String(latestEvaluation.referenceCode) : latestEvaluation?.id ? `EVAL-${latestEvaluation.id}` : null;
  const customRequirements = (caseTrackingData?.cases ?? [])
    .filter((item: any) => item.caseNumber === evaluationCaseNumber)
    .flatMap((item: any) => item.requirements ?? []);
  const finalReviewPending = Boolean(latestEvaluation?.secondReviewRequired && !latestEvaluation?.secondReviewedAt);
  const evaluationStatusLabel = cProfile.evaluationDeclarationStatus === "validated"
    ? "Évaluation validée"
    : !latestEvaluation
    ? "Aucune évaluation transmise"
    : finalReviewPending
      ? "Seconde validation en cours"
      : latestEvaluation?.finalResponseSentAt
        ? "Évaluation validée par l’agence"
        : cProfile.evaluationReviewedAt
          ? "Évaluation examinée par l’agence"
          : "Évaluation reçue — examen en cours";
  const validatedEvaluationResponse = latestEvaluation?.finalResponseSentAt && latestEvaluation?.reviewDraft ? String(latestEvaluation.reviewDraft) : null;
  const evaluationStatusDetail = cProfile.evaluationDeclarationStatus === "validated"
    ? "Votre évaluation reçue avant la création du compte a été rapprochée de manière sécurisée. Déposez les pièces demandées dans le centre documentaire."
    : !latestEvaluation
    ? "Créez ou poursuivez votre évaluation pour initier le dossier."
    : finalReviewPending
      ? "Une seconde validation humaine est requise avant la diffusion de votre résultat."
      : validatedEvaluationResponse || cProfile.evaluationReviewNote || "Un conseiller vérifie vos éléments et vous contactera si une précision est nécessaire.";
  const reviewDueAt = (latestEvaluation as any)?.reviewDeadline ?? (cProfile as any).dueAt ?? null;
  const reviewDueLabel = reviewDueAt ? new Date(reviewDueAt).toLocaleDateString("fr-FR", { dateStyle: "long" }) : null;
  const evaluationRequired = !latestEvaluation && cProfile.evaluationDeclarationStatus !== "validated" && (Boolean(workflow?.evaluationRequired) || cProfile.evaluationDeclarationStatus === "not_declared" || cProfile.evaluationDeclarationStatus === "refused");
  const agreementAfterPaymentRequired = Boolean(workflow?.showAgreementAfterPayment);
  const journeyVisaType = String((cProfile as any).visaType ?? latestEvaluation?.visaType ?? "");
  const journeyProcedureLabel = String(latestEvaluation?.projectDetails?.procedureLabel ?? latestEvaluation?.projectDetails?.procedureName ?? latestEvaluation?.visaType ?? "");
  const openEvaluation = () => setLocation(`/evaluation?source=client-space&destination=${encodeURIComponent(primaryDestination || "general")}`);
  // Les onglets Documents/Dossier n'ont de sens qu'une fois l'évaluation soumise : avant cela, le
  // candidat n'a ni pays précis validé ni base pour une checklist ou un suivi réels. On bloque
  // réellement l'accès (pas une simple incitation) plutôt que d'afficher un espace vide ou générique.
  const evaluationGateCard = (
    <Card className="border-2 border-violet-300 bg-violet-50 p-8 text-center shadow-sm" role="region" aria-labelledby="evaluation-gate-title">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm"><Sparkles className="h-7 w-7" aria-hidden="true" /></span>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-violet-700">Étape obligatoire</p>
      <h3 id="evaluation-gate-title" className="mt-1 text-xl font-black text-slate-950">Terminez d'abord votre évaluation</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-violet-900">Cette section s'ouvre une fois votre évaluation soumise : c'est elle qui précise votre destination et votre projet, et sans laquelle il n'y a ni pièces à demander ni dossier à suivre.</p>
      <Button type="button" onClick={openEvaluation} className="mt-5 h-12 bg-violet-700 px-6 text-white hover:bg-violet-800"><Sparkles className="mr-2 h-4 w-4" />Faire mon évaluation</Button>
    </Card>
  );
  const priority = stats.unreadMessages > 0
    ? { title: "Lire la réponse de votre conseiller", detail: `${stats.unreadMessages} message${stats.unreadMessages > 1 ? "s" : ""} attend${stats.unreadMessages > 1 ? "ent" : ""} votre lecture.`, target: "messages" as const, label: "Ouvrir la messagerie", icon: MessageSquare, tone: "bg-amber-50 border-amber-200 text-amber-950" }
    : cProfile.dossierStatus === "documents"
      ? { title: "Compléter les documents demandés", detail: "Consultez la checklist : l’agence précise les pièces réellement nécessaires à votre dossier.", target: "documents" as const, label: "Voir mes documents", icon: FileText, tone: "bg-blue-50 border-blue-200 text-blue-950" }
      : !latestEvaluation
        ? { title: "Poursuivre votre évaluation", detail: "Votre dossier reste préparatoire tant que les informations et le CV requis ne sont pas transmis.", target: "dossier" as const, label: "Faire mon évaluation", icon: Sparkles, tone: "bg-violet-50 border-violet-200 text-violet-950" }
        : { title: "Suivre l’avancement de votre dossier", detail: reviewDueLabel ? `Une revue est indiquée au plus tard le ${reviewDueLabel}.` : "Votre conseiller publiera la prochaine étape après vérification.", target: "dossier" as const, label: "Suivre mon dossier", icon: FolderOpen, tone: "bg-emerald-50 border-emerald-200 text-emerald-950" };
  const PriorityIcon = priority.icon;
  const switchToSection = (nextSection: typeof activeTab) => {
    setActiveTab(nextSection);
    setLocation(`/mon-espace?section=${nextSection}`);
  };
  const structuredStage = structuredEvaluation?.available ? structuredEvaluation.view.stage : undefined;
  const checklistSummary = summarizeChecklist(primaryDestination, latestEvaluation?.projectType, checklistDocuments, customRequirements);
  const checklistReceived = Math.max(0, checklistSummary.total - checklistSummary.missing - checklistSummary.replace);
  // « Étape N sur M » : même calcul (et mêmes jalons) que le parcours affiché plus bas et que les e-mails de l'agence.
  const journeyProgress = describeDossierProgress({
    destination: primaryDestination,
    visaType: journeyVisaType,
    procedureLabel: journeyProcedureLabel,
    dossierStatus: cProfile.dossierStatus,
    evaluationStatus: cProfile.evaluationDeclarationStatus,
    milestones: {
      evaluationClientConfirmed: Boolean((cProfile as any).evaluationClientConfirmedAt),
      activationRequested: Boolean((cProfile as any).activationRequestedAt),
      paymentConfirmed: String((cProfile as any).paymentStatus ?? "").toUpperCase() === "SUCCESS" || (cProfile as any).initialPaymentStatus === "paid",
    },
  });
  const nextStep = computeNextStep({
    evaluationRequired,
    evaluationStage: structuredStage,
    cvOnFile: structuredEvaluation?.available ? structuredEvaluation.view.cv.onFile : undefined,
    agreementSignatureRequired: agreementAfterPaymentRequired,
    requirements: (caseTrackingData?.cases ?? []).flatMap((item: any) => item.requirements ?? []),
    checklist: checklistSummary,
  });
  const actOnNextStep = (step: NextStep) => {
    if (step.action.kind === "evaluation") openEvaluation();
    else if (step.action.kind === "section") switchToSection(step.action.section);
    else if (step.action.kind === "anchor") document.getElementById(step.action.elementId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const openDocumentClarification = (documentLabel: string) => {
    setClarificationDocument(documentLabel);
    setClarificationDetails("");
  };
  const submitDocumentClarification = () => {
    if (!clarificationDocument) return;
    clarificationMutation.mutate({ documentLabel: clarificationDocument, details: clarificationDetails.trim() || undefined });
  };

  return (
    <main className="premium-page-shell min-h-screen pb-16">
      {/* En-tête du tableau de bord unifié */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 sm:px-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <CandidateAvatar avatarUrl={cProfile.avatarUrl} fullName={cProfile.fullName} size="lg" />
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Espace client · 3M TRAVEL AGENCY</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="premium-section-title text-xl sm:text-2xl">{cProfile.fullName}</h1>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  {formerAccountReference ? "Dossier" : "Compte"} {displayReference}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{cProfile.email} {cProfile.phone ? `• ${cProfile.phone}` : ""}</p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto sm:justify-end">
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              className="h-11 gap-2 border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
              Actualiser
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              size="sm"
              className="h-11 border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
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

      {/* Sélecteur de dossier : les onglets n'apparaissent qu'à partir de 2 dossiers en ligne (ex. Études + Travail),
          mais le lien pour en ouvrir un second reste visible dès le premier dossier. */}
      {onlineDossiers.length >= 1 && (
        <div className="border-b border-slate-200 bg-white/95">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
            <span className="mr-1 text-xs font-semibold text-slate-600">Mes dossiers ({onlineDossiers.length}/5) :</span>
            {onlineDossiers.map((dossier) => {
              const isSelected = dossier.dossierNumber === (selectedDossierNumber ?? activeDossier?.dossierNumber);
              const status = clientDossierStatusSummary(dossier.dossierStatus, dossier.paymentStatus);
              return (
                <button
                  key={dossier.dossierNumber ?? dossierSwitcherLabel(dossier)}
                  type="button"
                  onClick={() => setSelectedDossierNumber(dossier.dossierNumber ?? null)}
                  aria-pressed={isSelected}
                  aria-label={`${dossierSwitcherLabel(dossier)} : ${status.label}`}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isSelected ? "border-blue-700 bg-blue-700 text-white shadow-sm" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {dossierSwitcherLabel(dossier)}
                  <span className="ml-1.5 font-mono opacity-75">{dossier.dossierNumber}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isSelected ? "bg-white/20 text-white" : status.tone}`}>
                    {status.label}
                  </span>
                  <span className={`text-[10px] font-black ${isSelected ? "text-white/90" : "text-blue-800"}`}>{status.progress}%</span>
                </button>
              );
            })}
            {onlineDossiers.length < 5 ? (
              <a
                href="/evaluation"
                className="ml-1 rounded-full border border-dashed border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                + Ouvrir un dossier pour un autre projet
              </a>
            ) : (
              <span className="ml-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                Limite de 5 dossiers atteinte
              </span>
            )}
            {isFetching && selectedDossierNumber && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700" role="status" aria-live="polite">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Chargement du dossier sélectionné…
              </span>
            )}
          </div>
        </div>
      )}
      {onlineDossiers.length > 0 && (
        <Card className="premium-surface mt-4 border-blue-100/80 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-5" aria-labelledby="global-dossiers-summary-title">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Vue globale</p>
              <h2 id="global-dossiers-summary-title" className="premium-section-title mt-1 text-lg sm:text-xl">Résumé de vos dossiers ouverts</h2>
              <p className="premium-copy mt-1 text-sm">{onlineDossiers.length} dossier{onlineDossiers.length > 1 ? "s" : ""} suivi{onlineDossiers.length > 1 ? "s" : ""} par 3M TRAVEL AGENCY, avec la prochaine action à effectuer pour chacun.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-800 shadow-sm">{Math.round(onlineDossiers.reduce((total, dossier) => total + clientDossierStatusSummary(dossier.dossierStatus, dossier.paymentStatus).progress, 0) / onlineDossiers.length)} % moyen</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {onlineDossiers.map((dossier) => {
              const status = clientDossierStatusSummary(dossier.dossierStatus, dossier.paymentStatus);
              return <button key={`summary-${dossier.dossierNumber ?? dossierSwitcherLabel(dossier)}`} type="button" onClick={() => setSelectedDossierNumber(dossier.dossierNumber ?? null)} className="rounded-2xl border border-white bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{dossierSwitcherLabel(dossier)}</p><p className="mt-1 font-mono text-[11px] text-slate-500">{dossier.dossierNumber}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${status.tone}`}>{status.label}</span></div>
                <div className="mt-3 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${status.progress}%` }} /></div><span className="text-xs font-black text-blue-800">{status.progress}%</span></div>
                <p className="mt-2 text-xs font-semibold text-slate-600">Prochaine action : <span className="text-slate-900">{status.nextAction}</span></p>
              </button>;
            })}
          </div>
        </Card>
      )}

      {/* Barre de navigation principale du tableau de bord */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <ClientSpaceNavigation compact />
          <div className="mobile-scroll-region -mx-4 mt-4 flex items-center gap-2 overflow-x-auto border-b border-slate-200 px-4 pb-2 sm:mx-0 sm:px-0" role="tablist" aria-label="Sections de l’espace candidat">
          {[
            { id: "overview", label: "Vue d'ensemble", icon: TrendingUp },
            { id: "dossier", label: "Mon Dossier & Étapes", icon: FolderOpen },
            { id: "signatures", label: "Documents à signer", icon: ShieldCheck },
            { id: "documents", label: "Centre Documentaire", icon: FileText },
            { id: "profile", label: "Mon Profil & Avatar", icon: User },
            { id: "messages", label: `Messagerie ${stats.unreadMessages > 0 ? `(${stats.unreadMessages})` : ""}`, icon: MessageSquare },
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
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                  isActive
                    ? "premium-action text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenu dynamique par onglet */}
        <div id="candidate-space-content" className="mt-6" role="tabpanel" tabIndex={-1}>
          {activeTab === "overview" && (
            <div className="space-y-6">
              <NextStepCard step={nextStep} onAct={actOnNextStep} />
              <WelcomeJourneyCard evaluationRequired={evaluationRequired} checklistMissing={checklistSummary.missing + checklistSummary.replace} checklistTotal={checklistSummary.total} paymentConfirmed={Boolean(workflow?.paymentConfirmed)} agreementSigned={Boolean(workflow?.agreementSigned)} accountAgeDays={cProfile.createdAt ? Math.floor((Date.now() - new Date(cProfile.createdAt as any).getTime()) / 86_400_000) : 0} />
              <DossierPaymentCard dossierNumber={activeDossier?.dossierNumber} amount={(activeDossier as any)?.paymentAmount} currency={(activeDossier as any)?.paymentCurrency} confirmed={Boolean(workflow?.paymentConfirmed)} requested={Boolean(workflow?.paymentOpeningRequested || workflow?.activationRequested)} />
              <FlightAfterVisaCard approved={["approuve", "visa_approuve"].includes(String(cProfile.dossierStatus)) || ["approuve", "visa_approuve"].includes(String((activeDossier as any)?.status ?? (activeDossier as any)?.dossierStatus))} destination={primaryDestination} />
              <MyFlightRequestsCard />
              <Card className="border-blue-100 bg-white p-5 shadow-sm"><SubmitReview embedded initialFullName={cProfile.fullName} initialEmail={cProfile.email} /></Card>
              {portraitIsMissing && <Card className="border-amber-200 bg-amber-50 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-amber-950">Complétez votre profil</p><p className="text-sm text-amber-800">Ajoutez votre portrait pour faciliter l’identification de votre dossier par l’agence.</p></div><Button onClick={() => { setActiveTab("profile"); setLocation("/mon-espace?section=profile"); }} className="bg-amber-700 text-white hover:bg-amber-800">Compléter</Button></div></Card>}
              <ProfileCompletionBar completion={dashboardData.profileCompletion} onEditClick={() => switchToSection("profile")} />
              <PrivacyDataCard />
              {/* Widgets statistiques et progression */}
              {evaluationRequired && (
                <Card className="border-2 border-violet-300 bg-gradient-to-r from-violet-50 via-white to-amber-50 p-6 shadow-md" role="region" aria-labelledby="quick-evaluation-title">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="rounded-2xl bg-violet-600 p-3 text-white shadow-sm"><Sparkles className="h-6 w-6" aria-hidden="true" /></span>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Étape obligatoire</p>
                        <h2 id="quick-evaluation-title" className="mt-1 text-xl font-black text-slate-950">Évaluation rapide à compléter</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">Votre dossier ne peut pas avancer avant la soumission et la validation humaine de votre évaluation. Commencez maintenant depuis votre espace.</p>
                      </div>
                    </div>
                    <Button type="button" onClick={openEvaluation} className="h-12 shrink-0 bg-violet-700 px-5 text-white hover:bg-violet-800"><Sparkles className="mr-2 h-4 w-4" />Faire mon évaluation</Button>
                  </div>
                </Card>
              )}
              {structuredEvaluation?.available && structuredEvaluation.evaluationId !== null && structuredEvaluation.view.stage !== "not_started" && (
                <div id={EVALUATION_ANCHOR_ID} className="scroll-mt-24">
                  <CandidateEvaluationStatus evaluationId={structuredEvaluation.evaluationId} view={structuredEvaluation.view} onChanged={() => { void structuredEvaluationQuery.refetch(); }} />
                </div>
              )}
              {agreementAfterPaymentRequired && (
                <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-blue-50 p-6 shadow-md" role="region" aria-labelledby="agreement-after-payment-title">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4"><span className="rounded-2xl bg-amber-700 p-3 text-white"><ShieldCheck className="h-6 w-6" aria-hidden="true" /></span><div><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Paiement confirmé · action requise</p><h2 id="agreement-after-payment-title" className="mt-1 text-xl font-black text-slate-950">Signez votre protocole d’accord</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">Votre paiement est enregistré. La signature du protocole est la prochaine étape avant le traitement humain de votre dossier.</p></div></div>
                    <Button type="button" onClick={() => switchToSection("dossier")} className="h-12 shrink-0 bg-amber-700 px-5 text-white hover:bg-amber-800"><ShieldCheck className="mr-2 h-4 w-4" />Ouvrir le protocole</Button>
                  </div>
                </Card>
              )}
              <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]" aria-label="Résumé du dossier et documents synchronisés">
                <Card className="border-blue-200 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 p-6 text-white shadow-lg">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-200">Statut actuel du dossier</p>
                      <h2 className="mt-2 text-2xl font-black">{currentDossierStatusLabel}</h2>
                      {journeyProgress.stepNumber !== null && (
                        <div className="mt-3" data-testid="journey-progress">
                          <p className="text-sm font-bold text-white">Étape {journeyProgress.stepNumber} sur {journeyProgress.stepCount} : {journeyProgress.stepLabel}</p>
                          <div className="mt-2 h-2 max-w-xs overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Avancement de la procédure" aria-valuemin={0} aria-valuemax={100} aria-valuenow={journeyProgress.percent}><div className="h-full rounded-full bg-amber-300" style={{ width: `${journeyProgress.percent}%` }} /></div>
                          {journeyProgress.nextStepLabel && <p className="mt-1.5 text-xs text-blue-200">Étape suivante : {journeyProgress.nextStepLabel}</p>}
                        </div>
                      )}
                      <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Votre dossier est suivi par l’agence. Les étapes sont mises à jour après validation humaine de chaque élément.</p>
                    </div>
                    <span className="rounded-2xl bg-white/15 p-3" aria-hidden="true"><TrendingUp className="h-7 w-7 text-amber-300" /></span>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/15 pt-4 text-sm text-blue-100">
                    <span><strong className="text-white">{formerAccountReference ? "Numéro de dossier :" : "Référence de compte :"}</strong> {displayReference || "En attribution"}{formerAccountReference ? <span className="ml-2 text-xs opacity-70">(ancienne référence de compte : {formerAccountReference})</span> : null}</span>
                    <span><strong className="text-white">Destination{preferredDestinationsList.length > 1 ? "s" : ""} :</strong> {preferredDestinationsList.length > 0 ? preferredDestinationsList.join(", ") : cProfile.destination || "À préciser"}</span>
                  </div>
                  <Button type="button" onClick={() => switchToSection("dossier")} className="mt-5 bg-white text-blue-950 hover:bg-blue-50"><FolderOpen className="mr-2 h-4 w-4" />Voir les étapes</Button>
                  <div className="mt-5 border-t border-white/15 pt-4" aria-label="Historique simplifié des étapes validées"><p className="text-xs font-black uppercase tracking-[0.14em] text-blue-200">Étapes validées récemment</p>{validatedSteps.length === 0 ? <p className="mt-2 text-xs text-blue-100">Aucune étape validée n’est encore enregistrée.</p> : <ol className="mt-3 space-y-2">{validatedSteps.map((entry: any) => <li key={entry.id} className="flex items-start gap-2 text-xs text-blue-50"><span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-black text-blue-950">✓</span><span><strong className="text-white">{String(entry.newStatus).replaceAll("_", " ")}</strong><span className="ml-2 text-blue-200">{new Date(entry.createdAt).toLocaleDateString("fr-FR")}</span></span></li>)}</ol>}</div>
                </Card>
                <Card className="border-emerald-200 bg-emerald-50/70 p-6 shadow-sm" role="region" aria-labelledby="agency-sync-title">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Synchronisation agence</p><h2 id="agency-sync-title" className="mt-2 text-xl font-black text-slate-950">Documents reçus et visibles</h2></div>
                    <span className="rounded-2xl bg-emerald-700 p-3 text-white" aria-hidden="true"><FileText className="h-6 w-6" /></span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">Les pièces déposées en agence apparaissent ici avec leur statut de vérification, sans attendre une nouvelle transmission.</p>
                  <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-slate-500">Par l’agence</p><p className="mt-1 text-2xl font-black text-emerald-800">{agencyDocumentCount}</p></div><div className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-slate-500">Depuis votre espace</p><p className="mt-1 text-2xl font-black text-slate-900">{candidateDocumentCount}</p></div></div>
                  <Button type="button" variant="outline" onClick={() => switchToSection("documents")} className="mt-4 border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100"><FileText className="mr-2 h-4 w-4" />Ouvrir le centre documentaire</Button>
                </Card>
              </section>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 border-violet-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Évaluation</p>
                      <h3 className="mt-1 text-base font-bold text-gray-900">{evaluationStatusLabel}</h3>
                    </div>
                    <div className="rounded-xl bg-violet-50 p-3 text-violet-700"><Sparkles className="h-6 w-6" /></div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-violet-800">{evaluationStatusDetail}</p>
                  {reviewDueLabel && <p className="mt-2 text-xs font-semibold text-violet-900">Revue estimée au plus tard le {reviewDueLabel}</p>}
                  {validatedEvaluationResponse && <p className="mt-2 text-xs font-semibold text-emerald-800">Réponse validée par l’agence.</p>}
                </Card>
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
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pièces de votre checklist</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1" data-testid="checklist-received">{checklistReceived}/{checklistSummary.total}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <FileText className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700 mt-4 font-medium">{checklistSummary.missing + checklistSummary.replace > 0 ? `${checklistSummary.missing + checklistSummary.replace} à envoyer ou à corriger` : "Toutes les pièces demandées sont reçues"}</p>
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

              {/* Résumé d’avancement — le parcours détaillé reste dans l’onglet Dossier */}
              <Card className="border-blue-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    Avancement de votre procédure
                  </h3>
                  <p className="text-xs font-semibold text-slate-600" aria-live="polite">
                    Sync agence {lastSyncedAt ? `· ${new Date(lastSyncedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "· en cours"}
                  </p>
                </div>
                <DossierProgressTimeline dossierStatus={cProfile.dossierStatus} dossierKey={cProfile.dossierNumber} evaluationDeclarationStatus={cProfile.evaluationDeclarationStatus} />
                <Button type="button" variant="outline" className="mt-4" onClick={() => switchToSection("dossier")}>
                  Voir le parcours détaillé<ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>

              <section aria-labelledby="client-priority-title">
                <Card className={`border p-5 shadow-sm ${priority.tone}`}>
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="flex min-w-0 gap-3">
                      <span className="shrink-0 rounded-xl bg-white/80 p-3 shadow-sm"><PriorityIcon className="h-5 w-5" aria-hidden="true" /></span>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] opacity-75">Priorité du dossier</p>
                        <h3 id="client-priority-title" className="mt-1 text-lg font-black">{priority.title}</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 opacity-90">{priority.detail}</p>
                        <p className="mt-2 text-xs leading-5 opacity-80">Les statuts et demandes sont synchronisés depuis l’agence. Aucune décision n’est prise automatiquement dans cet espace.</p>
                      </div>
                    </div>
                    <Button type="button" onClick={() => evaluationRequired ? openEvaluation() : switchToSection(priority.target)} className="h-11 shrink-0 bg-slate-950 text-white hover:bg-slate-800">
                      {priority.label}<ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-5 grid gap-2 border-t border-current/15 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                    <button type="button" onClick={() => switchToSection("dossier")} className="rounded-xl bg-white/70 p-3 text-left text-sm font-bold hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">
                      <span className="block text-xs font-semibold opacity-70">{formerAccountReference ? "Référence de dossier" : "Référence de compte"}</span><span className="mt-1 block font-mono">{displayReference || "En cours d’attribution"}</span>{!formerAccountReference && <span className="mt-1 block text-[11px] opacity-70">Votre numéro de dossier « 3M-… » vous sera attribué à l’activation de votre dossier.</span>}
                    </button>
                    <button type="button" onClick={() => switchToSection("documents")} className="rounded-xl bg-white/70 p-3 text-left text-sm font-bold hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">
                      <span className="block text-xs font-semibold opacity-70">Documents synchronisés</span><span className="mt-1 block">{stats.totalDocuments} élément{stats.totalDocuments > 1 ? "s" : ""}</span>
                    </button>
                    <button type="button" onClick={() => switchToSection("messages")} className="rounded-xl bg-white/70 p-3 text-left text-sm font-bold hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">
                      <span className="block text-xs font-semibold opacity-70">Messagerie</span><span className="mt-1 block">{stats.unreadMessages ? `${stats.unreadMessages} non lu${stats.unreadMessages > 1 ? "s" : ""}` : "À jour"}</span>
                    </button>
                    <button type="button" onClick={handleManualRefresh} disabled={isRefreshing} className="rounded-xl bg-white/70 p-3 text-left text-sm font-bold hover:bg-white disabled:cursor-wait focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">
                      <span className="block text-xs font-semibold opacity-70">Synchronisation</span><span className="mt-1 flex items-center gap-1.5">{isRefreshing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}{lastSyncedAt ? `Mise à jour à ${new Date(lastSyncedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "Actualiser"}</span>
                    </button>
                  </div>
                </Card>
              </section>

              <ClientAppointmentRequest
                dossierNumber={cProfile.dossierNumber === "N/A" ? null : cProfile.dossierNumber}
                messages={messages}
                onRequested={handleManualRefresh}
              />

              <section aria-label="Documents recommandés à compléter">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div><h3 className="text-lg font-bold text-gray-900">Documents à compléter</h3><p className="text-sm text-gray-600">Les pièces complémentaires dépendent de votre destination et restent à confirmer par l’agence.</p></div>
                  <Button type="button" variant="outline" onClick={() => { setActiveTab("documents"); setLocation("/mon-espace?section=documents"); }}><FileText className="mr-2 h-4 w-4" />Ajouter mes documents</Button>
                </div>
                <DossierDocumentChecklist destination={primaryDestination} projectType={latestEvaluation?.projectType} documents={checklistDocuments} customRequirements={customRequirements} clarifications={documentClarifications} onOpenDocuments={() => switchToSection("documents")} onRequestClarification={openDocumentClarification} onUploaded={refreshDocuments} />
              </section>

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

          {activeTab === "dossier" && (evaluationRequired ? evaluationGateCard : (
            <div className="space-y-6">
              <Card className="p-6 border-blue-100 bg-white shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Dossier d'immigration actif ({displayReference})</h3>
                <DossierProgressTimeline dossierStatus={cProfile.dossierStatus} dossierKey={cProfile.dossierNumber} evaluationDeclarationStatus={cProfile.evaluationDeclarationStatus} />
              </Card>
              <CandidateCountryJourney destination={primaryDestination} visaType={journeyVisaType} procedureLabel={journeyProcedureLabel} dossierStatus={cProfile.dossierStatus} evaluationStatus={cProfile.evaluationDeclarationStatus} evaluationClientConfirmed={Boolean((cProfile as any).evaluationClientConfirmedAt)} activationRequested={Boolean((cProfile as any).activationRequestedAt)} paymentConfirmed={String((cProfile as any).paymentStatus ?? "").toUpperCase() === "SUCCESS" || (cProfile as any).initialPaymentStatus === "paid"} documents={[...(agencyDocuments ?? []), ...(candidateFiles ?? [])].map((document: any) => ({ documentName: document.documentName ?? document.fileName, documentType: document.documentType ?? document.fileType, documentUrl: document.documentUrl ?? document.url, verificationStatus: document.verificationStatus }))} />
              {evaluationRequired && (
                <Card className="border-2 border-violet-300 bg-violet-50 p-6 shadow-sm" role="region" aria-labelledby="dossier-evaluation-title">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Prochaine étape</p><h3 id="dossier-evaluation-title" className="mt-1 text-xl font-black text-violet-950">Compléter l’évaluation rapide</h3><p className="mt-2 text-sm leading-6 text-violet-900">Cette étape doit être terminée avant l’examen des documents et la poursuite du dossier.</p></div>
                    <Button type="button" onClick={openEvaluation} className="h-12 shrink-0 bg-violet-700 text-white hover:bg-violet-800"><Sparkles className="mr-2 h-4 w-4" />Ouvrir l’évaluation</Button>
                  </div>
                </Card>
              )}
              <Card className="border-amber-200 bg-white shadow-sm" aria-labelledby="client-agreement-title">
                <CardHeader>
                  <CardTitle id="client-agreement-title" className="flex items-center gap-2 text-blue-950"><ShieldCheck className="h-5 w-5 text-amber-600" /> Protocole d’accord obligatoire</CardTitle>
                  <p className="text-sm leading-6 text-slate-600">Ce protocole est requis avant le passage du dossier en traitement. Il reste visible ici jusqu’à sa signature.</p>
                </CardHeader>
                <CardContent>
                  {!activeDossier ? (
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4" role="status"><Clock className="h-5 w-5 shrink-0 text-slate-500" /><div><p className="font-semibold text-slate-800">Pas encore de dossier actif</p><p className="text-sm text-slate-600">Le protocole devient signable une fois votre dossier officiellement ouvert (après confirmation du paiement). Revenez ici à ce moment-là.</p></div></div>
                  ) : activeDossier?.agreementSigned ? (
                    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-700 flex flex-col gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center" role="status" data-testid="agreement-signature-success"><CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-700" /><div className="min-w-0 flex-1"><p className="font-semibold text-emerald-900">Protocole signé et transmis</p><p className="text-sm text-emerald-800">Votre signature est enregistrée. Un exemplaire PDF signé (en-tête et pied de page 3M TRAVEL AGENCY) vous a été envoyé par e-mail et reste disponible dans vos documents.</p></div>{signedProtocolDocument?.documentUrl && <Button asChild type="button" className="shrink-0 bg-emerald-700 text-white hover:bg-emerald-800" data-testid="download-signed-agreement"><a href={signedProtocolDocument.documentUrl} target="_blank" rel="noreferrer" download><Download className="mr-2 h-4 w-4" />Télécharger le PDF signé</a></Button>}</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" tabIndex={0} aria-label="Texte du protocole d’accord"><p className="font-bold text-slate-950">Protocole d’accord — 3M Travel Agency SARL</p>{INITIAL_AGREEMENT_PROTOCOL.split("\n\n").map((paragraph, index) => <p key={index} className="mt-2 whitespace-pre-line">{paragraph}</p>)}</div>
                      <div className="flex items-start gap-3 rounded-lg border-2 border-rose-300 bg-rose-50 p-3 text-sm text-rose-950" role="alert"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" /><p><strong>Important :</strong> les frais d’ouverture de dossier ne sont pas remboursables une fois le traitement engagé, sauf disposition légale impérative contraire. Lisez le protocole ci-dessus avant de signer.</p></div>
                      <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><input type="checkbox" className="mt-1 h-4 w-4" checked={agreementAccepted} onChange={(event) => setAgreementAccepted(event.target.checked)} disabled={signAgreementMutation.isPending} /><span>J’ai lu le protocole, compris ses limites et autorise la poursuite de l’instruction humaine de mon dossier.</span></label>
                      <div className="grid gap-4 md:grid-cols-2"><div><label htmlFor="client-agreement-signature" className="text-sm font-semibold text-slate-800">Nom complet du signataire</label><input id="client-agreement-signature" value={agreementSignatureName} onChange={(event) => { setAgreementSignatureName(event.target.value); setAgreementPreviewConfirmed(false); }} maxLength={255} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Votre nom complet" disabled={signAgreementMutation.isPending} /></div><div><p className="text-sm font-semibold text-slate-800">Signature</p><SignatureCanvas onSignatureChange={(value) => { setAgreementSignatureDataUrl(value); setAgreementPreviewConfirmed(false); }} /></div></div>
                      <Button type="button" variant="outline" className="w-full border-indigo-300 text-indigo-800 hover:bg-indigo-50" disabled={!agreementSignatureName.trim() || !agreementSignatureDataUrl || signAgreementMutation.isPending} onClick={() => setAgreementPreviewOpen(true)} data-testid="preview-signed-agreement"><FileText className="mr-2 h-4 w-4" />Prévisualiser le PDF signé</Button>
                      <Button type="button" className="w-full bg-blue-800 text-white hover:bg-blue-900" disabled={!agreementAccepted || !agreementSignatureName.trim() || !agreementSignatureDataUrl || !agreementPreviewConfirmed || !activeDossier?.dossierNumber || signAgreementMutation.isPending} onClick={() => activeDossier?.dossierNumber && agreementSignatureDataUrl && signAgreementMutation.mutate({ dossierNumber: activeDossier.dossierNumber, signatureName: agreementSignatureName.trim(), signatureDataUrl: agreementSignatureDataUrl })}>{signAgreementMutation.isPending ? "Signature et envoi…" : "Confirmer la signature et l’envoi"}</Button>
                      {!signAgreementMutation.isPending && (!agreementAccepted || !agreementSignatureName.trim() || !agreementSignatureDataUrl || !agreementPreviewConfirmed || !activeDossier?.dossierNumber) && (
                        <p className="text-xs text-slate-500" role="status">
                          Bouton inactif tant que : {[
                            !agreementAccepted && "la case à cocher n’est pas validée",
                            !agreementSignatureName.trim() && "le nom du signataire n’est pas renseigné",
                            !agreementSignatureDataUrl && "aucune signature n’a été dessinée ci-dessus",
                            !agreementPreviewConfirmed && "la prévisualisation du PDF signé n’est pas confirmée",
                            !activeDossier?.dossierNumber && "aucun dossier actif n’est associé à ce compte",
                          ].filter(Boolean).join(" · ")}.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Suivi e-Visa en direct */}
              <Card className="p-6 border-blue-200 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                    <Plane className="w-5 h-5 text-blue-600" />
                    Suivi de vos demandes e-Visa
                  </h3>
                  <span className="text-xs font-bold bg-blue-700 text-white px-3 py-1 rounded-full uppercase">Temps réel</span>
                </div>
                {(() => {
                  const list = Array.isArray(evisaReqs?.data) ? evisaReqs.data : [];
                  if (list.length === 0) {
                    return (
                      <div className="text-center py-6 text-gray-500 bg-white/60 rounded-xl border border-dashed border-blue-200">
                        <p className="text-sm">Aucune demande d'e-Visa active pour l'e-mail {cProfile.email}.</p>
                        <Button onClick={() => setLocation("/evisas")} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs">
                          Explorer les destinations e-Visa
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {list.map((ev: any) => {
                        const stepIndex = ev.status === 'approved' ? 3 : ev.status === 'processing' ? 2 : ev.status === 'rejected' ? 3 : 1;
                        const percent = ev.status === 'approved' ? 100 : ev.status === 'processing' ? 66 : ev.status === 'rejected' ? 100 : 33;
                        return (
                          <div key={ev.id} className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 text-base">{ev.countryName} ({ev.countryCode.toUpperCase()})</span>
                                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                    ev.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    ev.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {ev.status === 'approved' ? 'Approuvé' : ev.status === 'rejected' ? 'Refusé' : 'En attente consulaire'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Soumis le : {new Date(ev.createdAt).toLocaleDateString('fr-FR')} — Frais totaux : {ev.totalCost} {ev.currency}</p>
                              </div>
                              <div className="text-right flex flex-col items-end gap-2">
                                <div>
                                  <span className="text-xs font-mono text-gray-600 block mb-1">ID Demande : #{ev.id}</span>
                                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-lg">
                                    {ev.status === 'approved' ? 'Approuvé' : 'Vérification en cours'}
                                  </span>
                                </div>
                                {ev.issuedPdfUrl && (
                                  <Button
                                    onClick={() => window.open(ev.issuedPdfUrl, '_blank')}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1.5 h-auto flex items-center gap-1.5 shadow-sm"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Télécharger mon e-Visa
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Barre de progression visuelle e-Visa */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                              <div className="flex justify-between text-xs font-medium text-gray-600">
                                <span className={stepIndex >= 1 ? 'text-blue-700 font-bold' : ''}>1. Soumission</span>
                                <span className={stepIndex >= 2 ? 'text-blue-700 font-bold' : ''}>2. Vérification pièces</span>
                                <span className={stepIndex >= 3 ? 'text-blue-700 font-bold' : ''}>3. Traitement consulaire & Décision</span>
                              </div>
                              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    ev.status === 'rejected' ? 'bg-red-500' : ev.status === 'approved' ? 'bg-emerald-600' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </Card>

              {agencyDocuments && agencyDocuments.length > 0 && (
                <AgencyDocumentsPanel documents={agencyDocuments as any[]} candidateName={cProfile.fullName} candidateEmail={cProfile.email} dossierNumber={cProfile.dossierNumber} />
              )}
              {insuranceRequests && insuranceRequests.length > 0 && (
                <Card className="p-6 border-blue-100 bg-white shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Mes assurances voyage</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {insuranceRequests.map((item: any) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{item.reference}</p>
                            <p className="text-xs text-slate-500">{item.destinationCountry} · {item.coveragePlan}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">{item.status}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.couponFileName && <Button type="button" variant="outline" size="sm" onClick={() => downloadInsuranceCoupon(item.id)}><Download className="mr-2 h-3.5 w-3.5" />Coupon</Button>}
                          {item.attestationFileName ? <Button type="button" size="sm" onClick={() => downloadInsuranceAttestation(item.id)}><Download className="mr-2 h-3.5 w-3.5" />Attestation</Button> : <span className="text-xs text-slate-500">Attestation en attente</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ))}

          {activeTab === "signatures" && (
            <SignableDocumentsPanel
              activeDossier={activeDossier}
              documents={agencyDocuments as any[]}
              onOpenProtocol={() => switchToSection("dossier")}
            />
          )}

          {activeTab === "documents" && (evaluationRequired ? evaluationGateCard : (
            <div className="space-y-6">
              <DossierDocumentChecklist destination={primaryDestination} projectType={latestEvaluation?.projectType} documents={checklistDocuments} customRequirements={customRequirements} clarifications={documentClarifications} onOpenDocuments={() => switchToSection("documents")} onRequestClarification={openDocumentClarification} onUploadClarification={setUploadClarification} onUploaded={refreshDocuments} />
              <DocumentClarificationHistoryPanel clarifications={documentClarifications as any[]} onUpload={setUploadClarification} />
              {uploadClarification && <Card className="border-violet-200 bg-violet-50/40 p-6 shadow-sm"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-950">Déposer la pièce après clarification</h3><p className="mt-1 text-sm text-slate-600">La pièce sera liée à l’échange « {uploadClarification.documentLabel} » et restera en vérification jusqu’au contrôle humain.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setUploadClarification(null)}>Fermer</Button></div><DocumentUploader dossierNumber={cProfile.dossierNumber} clarificationRequestId={uploadClarification.id} clarificationDocumentLabel={uploadClarification.documentLabel} singleFile onUploadSuccess={() => { setUploadClarification(null); void Promise.all([trpcUtils.candidate.getDocumentClarifications.invalidate(), trpcUtils.candidate.getMyAgencyDocuments.invalidate(), refetch()]); }} /></Card>}
              <CaseDocumentsPanel documents={agencyDepositedDocuments(caseTrackingData?.cases)} onDownload={(documentId) => { void downloadCaseDocument(documentId); }} />
              {agencyDocuments && agencyDocuments.length > 0 && (
                <AgencyDocumentsPanel documents={agencyDocuments as any[]} candidateName={cProfile.fullName} candidateEmail={cProfile.email} dossierNumber={cProfile.dossierNumber} />
              )}
              <Card className="p-6 border-blue-100 bg-white shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Téléverser de nouveaux documents</h3>
                <DocumentUploader
                  dossierNumber={cProfile.dossierNumber}
                  requirementOptions={buildRequirementOptions(primaryDestination, latestEvaluation?.projectType, customRequirements)}
                  onUploadSuccess={() => {
                    void trpcUtils.candidate.getMyAgencyDocuments.invalidate();
                    void refetch();
                  }}
                />
              </Card>
              <section aria-labelledby="client-history-title">
                <h3 id="client-history-title" className="mb-3 text-base font-bold text-gray-900">Historique des évaluations et comparaisons</h3>
                <div className="space-y-4">
                  <EvaluationHistoryPanel evaluations={evaluations as any[]} candidateName={cProfile.fullName} candidateEmail={cProfile.email} />
                  <SavedDestinationComparisonsPanel />
                </div>
              </section>
            </div>
          ))}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <ClientProfilePanel />
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-6">
              <div className="premium-surface mb-2 flex items-center justify-between rounded-2xl border-blue-100/80 bg-blue-50/70 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Espace client</p>
                  <h3 className="premium-section-title mt-1 text-lg sm:text-xl">
                    Messagerie avec votre conseiller 3M TRAVEL AGENCY
                  </h3>
                  <p className="premium-copy mt-1 text-sm">
                    Posez vos questions à l’équipe ou échangez directement avec votre conseiller attitré.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-sm font-bold text-slate-900">Assistance 3M TRAVEL AGENCY</h4>
                  <AureolAssistantChat />
                </div>
                <div>
                  <h4 className="mb-3 text-sm font-bold text-slate-900">Messages Agence & Conseiller</h4>
                  <ClientMessagesPanel />
                </div>
              </div>
            </div>
          )}
	        </div>
	      </div>
      <Dialog open={agreementPreviewOpen} onOpenChange={(open) => { if (!open) setAgreementPreviewOpen(false); }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-950"><FileText className="h-5 w-5 text-indigo-700" />Aperçu du PDF signé</DialogTitle>
            <DialogDescription>Vérifiez le contenu, votre nom et votre signature avant la validation finale et l’envoi par e-mail.</DialogDescription>
          </DialogHeader>
          <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-slate-300 bg-slate-100 p-3" data-testid="signed-agreement-preview">
            <div className="bg-white p-6 shadow-sm">
              <div className="rounded-t-lg bg-[#0f2460] px-5 py-4 text-white"><p className="text-lg font-black tracking-wide">3M TRAVEL AGENCY</p><p className="text-xs text-blue-100">Protocole d’accord N°01 — exemplaire signé</p></div>
              <div className="border-b border-amber-500 px-5 py-4 text-xs text-slate-600"><p>Dossier : <strong>{activeDossier?.dossierNumber ?? "—"}</strong></p><p>Candidat : <strong>{cProfile.fullName}</strong></p></div>
              <div className="max-h-64 overflow-y-auto whitespace-pre-line px-5 py-5 text-sm leading-6 text-slate-700">{INITIAL_AGREEMENT_PROTOCOL}</div>
              <div className="mt-3 border-t border-slate-200 px-5 pt-4"><p className="font-bold text-blue-950">Signature électronique du candidat</p><p className="mt-2 text-sm text-slate-700">Signataire : <strong>{agreementSignatureName || "—"}</strong></p>{agreementSignatureDataUrl && <img src={agreementSignatureDataUrl} alt="Aperçu de votre signature" className="mt-3 h-20 max-w-[220px] rounded border border-slate-200 bg-white object-contain p-2" />}<p className="mt-3 text-xs text-slate-500">La date et l’adresse IP seront ajoutées automatiquement lors de la validation sécurisée.</p></div>
              <div className="mt-5 border-t-2 border-amber-500 px-5 pt-3 text-[11px] text-slate-500">3M TRAVEL AGENCY — RC/YAO/2019/A/2567 | NIU : M112417203369H<br />Yaoundé, Cameroun · hello@3mtravelagency.com · +237 698 104 832</div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAgreementPreviewOpen(false)}>Modifier</Button>
            <Button type="button" className="bg-blue-800 text-white hover:bg-blue-900" onClick={() => { setAgreementPreviewConfirmed(true); setAgreementPreviewOpen(false); }}>J’ai vérifié, poursuivre la signature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(clarificationDocument)} onOpenChange={(open) => { if (!open && !clarificationMutation.isPending) setClarificationDocument(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une clarification</DialogTitle>
            <DialogDescription>
              Votre demande concerne la pièce « {clarificationDocument} ». Elle est transmise à l’équipe en charge de votre dossier.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="document-clarification-details">
            Votre question <span className="font-normal text-slate-500">(facultatif)</span>
            <Textarea id="document-clarification-details" value={clarificationDetails} onChange={(event) => setClarificationDetails(event.target.value.slice(0, 1500))} placeholder="Ex. Quel format ou quelle période est attendue ?" maxLength={1500} className="min-h-28" />
          </label>
          <p className="text-xs text-slate-500">N’ajoutez ni numéro de passeport, ni mot de passe, ni données bancaires dans cette demande.</p>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={clarificationMutation.isPending} onClick={() => setClarificationDocument(null)}>Annuler</Button>
            <Button type="button" disabled={clarificationMutation.isPending} onClick={submitDocumentClarification}>{clarificationMutation.isPending ? "Envoi…" : "Envoyer ma demande"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
