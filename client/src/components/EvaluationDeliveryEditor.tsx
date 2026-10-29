import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarClock, Clock3, Download, Eye, FilePenLine, FileText, GitCompareArrows, History, Loader2, Mail, MessageCircle, Printer, RefreshCw, Save, Send, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PDFPreviewModal } from "@/components/PDFPreviewModal";
import { RichTextEditor } from "@/components/RichTextEditor";
import { BilanPasteEditor } from "@/components/BilanPasteEditor";
import { inspectBilan } from "@shared/bilanContent";
import { bilanVariablesFrom } from "@shared/bilanVariables";
import { proposedOpeningFee } from "@shared/openingFee";
import { BilanTemplatesPanel } from "@/components/BilanTemplatesPanel";
import {
  bilanStructuresForKind,
  EVALUATION_KIND_LABELS,
  messageTemplatesForKind,
  resolveBilanProjectKind,
} from "@shared/evaluationBilanTemplates";
import type { EvaluationProjectKind } from "@shared/evaluationVisaCv";

type Props = {
  sessionToken: string;
  sourceRecordId: number;
  sourceType?: "application" | "candidate" | "agency";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};
type EvaluationAttachment = { name: string; mimeType: "application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "image/jpeg" | "image/png"; contentBase64: string; size: number };

const splitLines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const joinLines = (values: string[]) => values.join("\n");
const evaluationDestinations = ["canada", "luxembourg", "europe"] as const;
type EvaluationDestination = typeof evaluationDestinations[number];
const normalizeDestination = (value: string | null | undefined): EvaluationDestination => {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("canada")) return "canada";
  if (normalized.includes("luxembourg")) return "luxembourg";
  return "europe";
};

export function EvaluationDeliveryEditor({ sessionToken: providedSessionToken, sourceRecordId, sourceType = "application", open, onOpenChange, onCompleted }: Props) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const platformBootstrap = trpc.adminAuth.bootstrapPlatformSession.useQuery(undefined, {
    enabled: open && !providedSessionToken,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const restoredPlatformToken = (platformBootstrap.data as { sessionToken?: string } | undefined)?.sessionToken;
  const sessionToken = providedSessionToken || restoredPlatformToken || "";
  useEffect(() => {
    if (!restoredPlatformToken) return;
    sessionStorage.setItem("adminSessionToken", restoredPlatformToken);
    localStorage.setItem("adminSessionToken", restoredPlatformToken);
  }, [restoredPlatformToken]);
  const [candidateBootstrapReady, setCandidateBootstrapReady] = useState(sourceType !== "candidate");
  const [candidateBootstrapApplicationId, setCandidateBootstrapApplicationId] = useState<number | null>(null);
  const [bootstrapApplicationSnapshot, setBootstrapApplicationSnapshot] = useState<{
    id: number;
    dossierNumber: string;
    fullName: string;
    email: string;
    whatsappNumber?: string | null;
    destination?: string | null;
  } | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [useEmptyDraftFallback, setUseEmptyDraftFallback] = useState(false);
  const effectiveSourceRecordId = sourceType === "candidate" && candidateBootstrapApplicationId !== null ? candidateBootstrapApplicationId : sourceRecordId;
  const bootstrapAttempt = useRef("");
  const bootstrapTimeout = useRef<number | null>(null);
  const initializeEvaluationDelivery = trpc.unifiedRequests.initializeEvaluationDelivery.useMutation({
    onSuccess: (result) => {
      const resolvedApplicationId = result.application?.id;
      if (typeof resolvedApplicationId === "number") setCandidateBootstrapApplicationId(resolvedApplicationId);
      if (result.application) {
        setBootstrapApplicationSnapshot({
          id: result.application.id,
          dossierNumber: result.application.dossierNumber,
          fullName: result.application.fullName,
          email: result.application.email,
          whatsappNumber: result.application.whatsappNumber ?? null,
          destination: result.application.destination ?? null,
        });
      }
      setBootstrapError(null);
      setUseEmptyDraftFallback(false);
      setCandidateBootstrapReady(true);
    },
    onError: (bootstrapError) => {
      setCandidateBootstrapApplicationId(null);
      setBootstrapApplicationSnapshot(null);
      setCandidateBootstrapReady(false);
      setBootstrapError(bootstrapError.message);
      toast({ title: "Initialisation impossible", description: bootstrapError.message, variant: "destructive" });
    },
  });
  const bootstrapKey = `${sourceType}:${sourceRecordId}`;
  useEffect(() => {
    if (sourceType !== "candidate") return;
    if (!open || !sessionToken || bootstrapAttempt.current === bootstrapKey) return;
    bootstrapAttempt.current = bootstrapKey;
    setCandidateBootstrapApplicationId(null);
    setCandidateBootstrapReady(false);
    setBootstrapError(null);
    initializeEvaluationDelivery.mutate({ sessionToken, candidateId: sourceRecordId, sourceType: "candidate" });
    bootstrapTimeout.current = window.setTimeout(() => {
      setCandidateBootstrapReady(false);
      setBootstrapError("Le serveur n’a pas répondu après 15 secondes. Vérifiez la session administrateur puis réessayez.");
    }, 15000);
    return () => {
      if (bootstrapTimeout.current !== null) window.clearTimeout(bootstrapTimeout.current);
      bootstrapTimeout.current = null;
    };
  }, [bootstrapKey, initializeEvaluationDelivery, open, sessionToken, sourceRecordId, sourceType]);
  useEffect(() => {
    if (!open) {
      bootstrapAttempt.current = "";
      if (bootstrapTimeout.current !== null) window.clearTimeout(bootstrapTimeout.current);
      bootstrapTimeout.current = null;
      if (sourceType === "candidate") {
        setCandidateBootstrapApplicationId(null);
        setBootstrapApplicationSnapshot(null);
        setCandidateBootstrapReady(false);
        setBootstrapError(null);
      }
      setUseEmptyDraftFallback(false);
    }
  }, [open, sourceType]);
  const retryCandidateBootstrap = () => {
    bootstrapAttempt.current = "";
    setBootstrapError(null);
    setCandidateBootstrapApplicationId(null);
    setBootstrapApplicationSnapshot(null);
    setUseEmptyDraftFallback(false);
    setCandidateBootstrapReady(false);
    initializeEvaluationDelivery.mutate({ sessionToken, candidateId: sourceRecordId, sourceType: "candidate" });
  };
  const queryEnabled = open && Boolean(sessionToken) && (sourceType !== "candidate" || candidateBootstrapReady);
  const { data, isLoading, isFetching, isError, error, refetch } = trpc.unifiedRequests.getEvaluationDelivery.useQuery({ sessionToken, sourceRecordId: effectiveSourceRecordId }, { enabled: queryEnabled, retry: 2, refetchOnWindowFocus: false });
  useEffect(() => {
    if (data) setUseEmptyDraftFallback(false);
  }, [data]);
  const emptyDraftFallback = useMemo(() => {
    if (!useEmptyDraftFallback) return null;
    const snapshot = bootstrapApplicationSnapshot;
    return {
      application: {
        id: snapshot?.id ?? effectiveSourceRecordId,
        dossierNumber: snapshot?.dossierNumber ?? `EVAL-DRAFT-${effectiveSourceRecordId}`,
        fullName: snapshot?.fullName ?? "Candidat",
        email: snapshot?.email ?? "",
        whatsappNumber: snapshot?.whatsappNumber ?? null,
        destination: snapshot?.destination ?? "europe",
        scoringTotal: 0,
        evaluationScheduledAt: null as string | null,
        evaluationDeliveryStatus: "draft",
        evaluationReportViewedAt: null as string | null,
        evaluationApprovalStatus: "not_required",
        evaluationRequiresSecondApproval: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      versions: [] as Array<Record<string, unknown>>,
      offlineEvaluation: { validated: false as const, validatedAt: null as string | null, validatedBy: null as string | null },
      draft: {
        destination: normalizeDestination(snapshot?.destination),
        modelLabel: null,
        criteria: null,
        projectKind: "autre" as EvaluationProjectKind,
        projectType: null as string | null,
        finalScore: 0,
        verdict: "",
        profileSummary: "",
        bilanHtml: "",
        strengths: [] as string[],
        weaknesses: [] as string[],
        recommendations: [] as string[],
        informationToVerify: [] as string[],
        nextAdminAction: "",
        message: "",
        language: "fr" as const,
        subject: "Votre bilan d'évaluation 3M TRAVEL AGENCY",
        requiresSecondApproval: false,
        advisorValidated: false,
        advisorValidatedAt: null as string | null,
        advisorValidatedByAdminId: null as number | null,
      },
    };
  }, [bootstrapApplicationSnapshot, effectiveSourceRecordId, useEmptyDraftFallback]);
  const deliveryData = data ?? emptyDraftFallback;
  const projectKind = useMemo<EvaluationProjectKind>(() => {
    const draftKind = (deliveryData as { draft?: { projectKind?: EvaluationProjectKind } } | null)?.draft?.projectKind;
    if (draftKind === "travail" || draftKind === "etudes" || draftKind === "tourisme" || draftKind === "autre") return draftKind;
    return resolveBilanProjectKind(
      (deliveryData as { draft?: { projectType?: string | null } } | null)?.draft?.projectType,
      (deliveryData as { application?: { visaType?: string | null } } | null)?.application?.visaType,
    );
  }, [deliveryData]);
  const messageTemplates = useMemo(() => messageTemplatesForKind(projectKind), [projectKind]);
  const bilanStructures = useMemo(() => bilanStructuresForKind(projectKind), [projectKind]);
  const projectKindLabel = EVALUATION_KIND_LABELS[projectKind];
  const loadErrorMessage = (() => {
    const raw = error?.message || "";
    if (raw.includes("Unable to transform response")) {
      return "La réponse du serveur n’a pas pu être lue. Réessayez, ou continuez avec un brouillon vide pour rédiger le bilan.";
    }
    return raw || "Aucune donnée n’a été retournée par le serveur.";
  })();
  const [score, setScore] = useState("0");
  const [destination, setDestination] = useState<EvaluationDestination>("europe");
  const [verdict, setVerdict] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  // Bilan complet collé (HTML, texte, Markdown…) : prioritaire sur la structure verdict / points forts / recommandations.
  const [bilanHtml, setBilanHtml] = useState("");
  const [structureOpen, setStructureOpen] = useState(false);
  const bilanInspection = useMemo(() => inspectBilan(bilanHtml), [bilanHtml]);
  const hasFreeBilan = !bilanInspection.empty;
  const showStructure = !hasFreeBilan || structureOpen;
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const [scheduledAt, setScheduledAt] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{ recipient: string; subject: string; html: string; attachmentLabel: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [pdfPreview, setPdfPreview] = useState<{ url: string; fileName: string } | null>(null);
  const [requiresSecondApproval, setRequiresSecondApproval] = useState(false);
  const [comparisonLeftId, setComparisonLeftId] = useState("");
  const [comparisonRightId, setComparisonRightId] = useState("");
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [additionalAttachments, setAdditionalAttachments] = useState<EvaluationAttachment[]>([]);
  const [previewReviewed, setPreviewReviewed] = useState(false);
  const [previewOpened, setPreviewOpened] = useState(false);
  const lastAutosavedPayload = useRef("");
  const previewGateRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!deliveryData?.draft) return;
    setDestination(normalizeDestination(deliveryData.draft.destination));
    setScore(String(deliveryData.draft.finalScore));
    setVerdict(deliveryData.draft.verdict);
    setStrengths(joinLines(deliveryData.draft.strengths));
    setWeaknesses(joinLines(deliveryData.draft.weaknesses));
    setRecommendations(joinLines(deliveryData.draft.recommendations));
    setSubject(deliveryData.draft.subject);
    setMessage(deliveryData.draft.message);
    setBilanHtml((deliveryData.draft as { bilanHtml?: string }).bilanHtml ?? "");
    setLanguage(deliveryData.draft.language === "en" ? "en" : "fr");
    setScheduledAt(deliveryData.application.evaluationScheduledAt ? new Date(deliveryData.application.evaluationScheduledAt).toISOString().slice(0, 16) : "");
    setRequiresSecondApproval(deliveryData.draft.requiresSecondApproval);
    setComparisonLeftId(String(deliveryData.versions[1]?.id ?? deliveryData.versions[0]?.id ?? ""));
    setComparisonRightId(String(deliveryData.versions[0]?.id ?? ""));
    setPreviewHtml("");
    setPreviewReviewed(false);
    setPreviewOpened(false);
  }, [deliveryData]);

  const payload = useMemo(() => ({
    sessionToken,
    sourceRecordId: effectiveSourceRecordId,
    destination,
    finalScore: Math.max(0, Math.min(100, Number(score) || 0)),
    verdict: verdict.trim() || "Évaluation préliminaire à consulter",
    strengths: splitLines(strengths),
    weaknesses: splitLines(weaknesses),
    recommendations: splitLines(recommendations),
    subject: subject.trim() || undefined,
    message: message.trim() || undefined,
    bilanHtml,
    requiresSecondApproval,
    language,
  }), [sessionToken, effectiveSourceRecordId, destination, score, verdict, strengths, weaknesses, recommendations, subject, message, bilanHtml, requiresSecondApproval, language]);

  const saveDraft = trpc.unifiedRequests.saveEvaluationDeliveryDraft.useMutation({
    onSuccess: (result) => {
      setPreviewHtml(result.reportHtml);
      setPreviewOpened(true);
    },
    onError: (error) => toast({ title: "Brouillon non enregistré", description: error.message, variant: "destructive" }),
  });
  const sendNow = trpc.unifiedRequests.sendEvaluationNow.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Bilan envoyé (espace client + e-mail)",
        description: `${result.message} Destinataire : ${data?.application?.email ?? "candidat"}. Dossier : ${result.dossierNumber ?? data?.application?.dossierNumber ?? "—"}. Type de visa journalisé : ${(result as { visaType?: string }).visaType ?? projectKindLabel}.`,
      });
      onCompleted();
      onOpenChange(false);
    },
    onError: (error) => toast({ title: "Envoi impossible", description: error.message, variant: "destructive" }),
  });
  const sendHistory = trpc.unifiedRequests.listEvaluationDeliveryHistory.useQuery({ sessionToken, sourceRecordId: effectiveSourceRecordId }, { enabled: open && Boolean(sessionToken) && Boolean(deliveryData), refetchOnWindowFocus: false });
  const resendHistory = trpc.unifiedRequests.resendEvaluationHistory.useMutation({ onSuccess: (result) => { void sendHistory.refetch(); toast({ title: "Bilan renvoyé", description: result.message }); }, onError: (error) => toast({ title: "Renvoi impossible", description: error.message, variant: "destructive" }) });
  const schedule = trpc.unifiedRequests.scheduleEvaluationDelivery.useMutation({
    onSuccess: (result) => {
      toast({ title: "Envoi programmé", description: result.message });
      onCompleted();
      onOpenChange(false);
    },
    onError: (error) => toast({ title: "Planification impossible", description: error.message, variant: "destructive" }),
  });
  const approve = trpc.unifiedRequests.approveSensitiveEvaluation.useMutation({
    onSuccess: (result) => { void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId: effectiveSourceRecordId }); toast({ title: "Bilan approuvé", description: result.message }); },
    onError: (error) => toast({ title: "Approbation impossible", description: error.message, variant: "destructive" }),
  });
  const validateDraft = trpc.unifiedRequests.validateEvaluationDraft.useMutation({
    onSuccess: (result) => {
      void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId: effectiveSourceRecordId });
      toast({ title: "Bilan validé", description: result.message });
    },
    onError: (error) => toast({ title: "Validation impossible", description: error.message, variant: "destructive" }),
  });
  useEffect(() => {
    if (!open || !deliveryData || isLoading || isFetching || saveDraft.isPending) return;
    const fingerprint = JSON.stringify(payload);
    if (fingerprint === lastAutosavedPayload.current) return;
    setPreviewReviewed(false);
    setAutosaveStatus("saving");
    const timer = window.setTimeout(() => {
      saveDraft.mutate(payload, {
        onSuccess: () => { lastAutosavedPayload.current = fingerprint; setAutosaveStatus("saved"); },
        onError: () => setAutosaveStatus("error"),
      });
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [open, deliveryData, isLoading, isFetching, payload]);

  const previewEmail = trpc.unifiedRequests.previewEvaluationDeliveryEmail.useQuery({ sessionToken, sourceRecordId: effectiveSourceRecordId }, { enabled: false });
  const deliveryHealth = trpc.monitoring.getEvaluationDeliveryHealth.useQuery(undefined, { enabled: open && Boolean(sessionToken), refetchOnWindowFocus: false });
  const previewPdf = trpc.unifiedRequests.previewEvaluationDeliveryPdf.useMutation({
    onSuccess: (result) => setPdfPreview({ url: result.url, fileName: result.fileName }),
    onError: (error) => toast({ title: "Aperçu PDF indisponible", description: error.message, variant: "destructive" }),
  });
  const sendTestEmail = trpc.unifiedRequests.sendEvaluationTestEmail.useMutation({
    onSuccess: (result) => toast({ title: "Test interne envoyé", description: result.message }),
    onError: (error) => toast({ title: "Test non envoyé", description: error.message, variant: "destructive" }),
  });

  const hasBilanContent = hasFreeBilan || verdict.trim().length >= 3 || splitLines(recommendations).length > 0 || message.replace(/<[^>]+>/g, " ").trim().length >= 20;
  const ensureDraft = async () => {
    if (!hasBilanContent) {
      toast({ title: "Bilan requis", description: "Collez ou rédigez le bilan (zone « Bilan complet ») avant de prévisualiser ou d’envoyer.", variant: "destructive" });
      return false;
    }
    try {
      await saveDraft.mutateAsync(payload);
      lastAutosavedPayload.current = JSON.stringify(payload);
      void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId: effectiveSourceRecordId });
      return true;
    } catch {
      toast({ title: "Préparation impossible", description: "Le brouillon n’a pas pu être enregistré. Vérifiez les champs requis puis réessayez.", variant: "destructive" });
      return false;
    }
  };
  const saveDraftOnly = async () => {
    if (!hasBilanContent) {
      toast({ title: "Bilan requis", description: "Collez ou rédigez le bilan avant d’enregistrer le brouillon.", variant: "destructive" });
      return;
    }
    try {
      await saveDraft.mutateAsync(payload);
      lastAutosavedPayload.current = JSON.stringify(payload);
      void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId: effectiveSourceRecordId });
      toast({ title: "Brouillon enregistré", description: "Le bilan est sauvegardé sans e-mail, sans publication et sans changement d’étape côté candidat." });
    } catch {
      toast({ title: "Brouillon non enregistré", description: "Le brouillon n’a pas pu être enregistré. Vérifiez les champs requis puis réessayez.", variant: "destructive" });
    }
  };

  const applyTemplate = (key: string) => {
    const template = messageTemplates[key];
    if (!template) return;
    setSubject(template.subject);
    setMessage(template.message);
  };
  const applyBilanStructure = (key: string) => {
    const structure = bilanStructures[key];
    if (!structure) return;
    setScore(structure.score);
    setVerdict(structure.verdict);
    setStrengths(structure.strengths);
    setWeaknesses(structure.weaknesses);
    setRecommendations(structure.recommendations);
    setMessage(structure.message);
    setSubject(messageTemplates.standard?.subject ?? subject);
    toast({ title: "Structure chargée", description: `${structure.label} (${projectKindLabel}) chargée. Relisez et adaptez chaque élément avant validation.` });
  };
  const addAttachments = async (files: FileList | null) => {
    if (!files) return;
    const allowed = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"]);
    const selected = Array.from(files);
    if (additionalAttachments.length + selected.length > 3) { toast({ title: "Trop de pièces jointes", description: "Ajoutez au maximum trois pièces jointes supplémentaires.", variant: "destructive" }); return; }
    const next: EvaluationAttachment[] = [];
    for (const file of selected) {
      if (!allowed.has(file.type) || file.size > 5 * 1024 * 1024) { toast({ title: "Fichier non accepté", description: `${file.name} doit être un PDF, document Word ou image de 5 Mo maximum.`, variant: "destructive" }); continue; }
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
      next.push({ name: file.name, mimeType: file.type as EvaluationAttachment["mimeType"], contentBase64: dataUrl.split(",")[1] || "", size: file.size });
    }
    setAdditionalAttachments((current) => [...current, ...next]);
  };
  const printEmailPreview = () => {
    if (!emailPreview) return;
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      toast({ title: "Impression bloquée", description: "Autorisez les fenêtres contextuelles pour imprimer cet aperçu.", variant: "destructive" });
      return;
    }
    printWindow.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${emailPreview.subject.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title><style>body{margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a}main{max-width:760px;margin:32px auto;padding:32px;background:#fff} @media print{body{background:#fff}main{margin:0;max-width:none;padding:0}}</style></head><body><main>${emailPreview.html}</main></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 150);
  };
  const checkSmtp = async () => {
    const result = await deliveryHealth.refetch();
    if (!result.data) {
      toast({ title: "Contrôle SMTP indisponible", description: "La supervision n’a pas pu être actualisée.", variant: "destructive" });
      return;
    }
    toast({ title: result.data.smtp.status === "operational" ? "SMTP opérationnel" : "SMTP à vérifier", description: `Remises 24 h : ${result.data.smtp.sentLast24h} envoyée(s), ${result.data.smtp.failedLast24h} échec(s). PDF : ${result.data.pdf.status}.` });
  };

  const openWhatsAppDraft = async () => {
    if (!(await ensureDraft())) return;
    const phone = String((data?.application as any)?.whatsappNumber ?? (data?.application as any)?.phone ?? "").replace(/\D/g, "");
    if (!phone) {
      toast({ title: "WhatsApp indisponible", description: "Aucun numéro WhatsApp vérifié n’est enregistré pour ce candidat.", variant: "destructive" });
      return;
    }
    const text = `${subject.trim() || "Votre évaluation 3M TRAVEL AGENCY"}\n\nBonjour ${data?.application?.fullName || ""},\n\n${message.trim() || "Votre évaluation est disponible dans votre espace client."}\n\nLe bilan complet est consultable dans votre espace client. Cette ouverture WhatsApp nécessite votre confirmation avant l’envoi.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };
  const openPdfPreview = async () => {
    if (!(await ensureDraft())) return;
    setPreviewOpened(true);
    previewPdf.mutate({ sessionToken, sourceRecordId: effectiveSourceRecordId });
  };
  const openEmailPreview = async () => {
    if (!(await ensureDraft())) return;
    const result = await previewEmail.refetch();
    if (!result.data) {
      toast({ title: "Aperçu indisponible", description: "Le message doit être enregistré avant sa prévisualisation.", variant: "destructive" });
      return;
    }
    setEmailPreview(result.data);
    setEmailPreviewOpen(true);
    setPreviewOpened(true);
  };
  const canConfirmPreview = previewOpened || Boolean(previewHtml) || Boolean(emailPreview);
  const canSendWithPreview = previewReviewed && canConfirmPreview;
  const assertPreviewBeforeSend = () => {
    if (canSendWithPreview) return true;
    previewGateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    toast({
      title: "Contrôle d’aperçu requis",
      description: canConfirmPreview
        ? "Cochez la case de contrôle d’aperçu avant d’envoyer le bilan."
        : "Ouvrez d’abord l’aperçu espace candidat, e-mail ou PDF, puis confirmez le contrôle.",
      variant: "destructive",
    });
    return false;
  };
  const offlineEvaluationValidated = deliveryData?.offlineEvaluation?.validated === true;
  const currentDraft = deliveryData?.draft ?? {
    advisorValidated: false,
    profileSummary: "",
    informationToVerify: [] as string[],
    nextAdminAction: "",
  };
  const requiresApprovalBeforeDelivery = !currentDraft.advisorValidated || (requiresSecondApproval && deliveryData?.application?.evaluationApprovalStatus !== "approved");
  const provisionalReference = Boolean(deliveryData?.application?.dossierNumber?.startsWith("EVAL-DRAFT-"));
  const reviewDeadline = deliveryData?.application?.createdAt ? new Date(new Date(deliveryData.application.createdAt).getTime() + 8 * 60 * 60 * 1000) : null;
  const reviewOverdue = Boolean(reviewDeadline && !currentDraft.advisorValidated && reviewDeadline.getTime() <= Date.now());
  const parseVersionDraft = (version: any) => { try { return JSON.parse(version?.contentJson || "{}").adminDraft ?? {}; } catch { return {}; } };
  const resumeVersion = (version: any) => {
    const stored = (() => { try { return JSON.parse(version?.contentJson || "{}"); } catch { return {}; } })();
    const draft = stored.adminDraft ?? {};
    setDestination(normalizeDestination(draft.destination));
    setScore(String(draft.finalScore ?? 0));
    setVerdict(String(draft.verdict ?? ""));
    setStrengths(joinLines(Array.isArray(draft.strengths) ? draft.strengths : []));
    setWeaknesses(joinLines(Array.isArray(draft.weaknesses) ? draft.weaknesses : []));
    setRecommendations(joinLines(Array.isArray(draft.recommendations) ? draft.recommendations : []));
    setSubject(String(stored.subject ?? draft.subject ?? ""));
    setMessage(String(stored.message ?? draft.message ?? ""));
    setBilanHtml(String(draft.bilanHtml ?? ""));
    setLanguage(draft.language === "en" ? "en" : "fr");
    setRequiresSecondApproval(Boolean(version.requiresSecondApproval ?? draft.requiresSecondApproval));
    setPreviewHtml(String(version.reportHtml ?? ""));
    toast({ title: `Version ${version.versionNumber} reprise`, description: "Vous pouvez maintenant la modifier puis l’enregistrer ou la valider avant envoi." });
  };
  const versions = deliveryData?.versions ?? [];
  const comparisonLeft = versions.find((version: any) => String(version.id) === comparisonLeftId);
  const comparisonRight = versions.find((version: any) => String(version.id) === comparisonRightId);
  const leftDraft = parseVersionDraft(comparisonLeft);
  const rightDraft = parseVersionDraft(comparisonRight);
  const comparisonRows = [
    ["Score final", String(leftDraft.finalScore ?? "—"), String(rightDraft.finalScore ?? "—")],
    ["Verdict", leftDraft.verdict || "—", rightDraft.verdict || "—"],
    ["Points forts", Array.isArray(leftDraft.strengths) ? leftDraft.strengths.join(" · ") : "—", Array.isArray(rightDraft.strengths) ? rightDraft.strengths.join(" · ") : "—"],
    ["Axes d’amélioration", Array.isArray(leftDraft.weaknesses) ? leftDraft.weaknesses.join(" · ") : "—", Array.isArray(rightDraft.weaknesses) ? rightDraft.weaknesses.join(" · ") : "—"],
    ["Recommandations", Array.isArray(leftDraft.recommendations) ? leftDraft.recommendations.join(" · ") : "—", Array.isArray(rightDraft.recommendations) ? rightDraft.recommendations.join(" · ") : "—"],
  ] as const;
  const exportComparisonPdf = async () => {
    if (!comparisonLeft || !comparisonRight) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = 18;
    const write = (label: string, left: string, right: string) => {
      if (y > 260) { doc.addPage(); y = 18; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text(label, 14, y); y += 6;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      const leftLines = doc.splitTextToSize(`Version ${comparisonLeft.versionNumber} : ${left}`, 85) as string[];
      const rightLines = doc.splitTextToSize(`Version ${comparisonRight.versionNumber} : ${right}`, 85) as string[];
      const height = Math.max(leftLines.length, rightLines.length) * 5;
      if (y + height > 280) { doc.addPage(); y = 18; }
      doc.text(leftLines, 14, y); doc.text(rightLines, 110, y); y += height + 6;
    };
    doc.setFillColor(30, 58, 138); doc.rect(0, 0, 210, 28, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text("3M TRAVEL AGENCY — Audit de versions", 14, 17);
    doc.setTextColor(31, 41, 55); doc.setFontSize(10); doc.setFont("helvetica", "normal"); y = 40;
    doc.text(`${data.application.fullName} · Dossier ${data.application.dossierNumber}`, 14, y); y += 7;
    doc.text(`Comparatif exporté le ${new Date().toLocaleString("fr-FR")}`, 14, y); y += 10;
    comparisonRows.forEach(([label, left, right]) => write(label, left, right));
    doc.save(`audit-bilan-${data.application.dossierNumber}-v${comparisonLeft.versionNumber}-v${comparisonRight.versionNumber}.pdf`);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen !max-w-none flex-col overflow-hidden rounded-none border-0 border-slate-200 bg-slate-50/95 p-3 shadow-2xl sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:!max-w-none sm:rounded-2xl sm:p-5 lg:p-6">
      <DialogHeader className="shrink-0 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm lg:px-7">
        <DialogTitle className="flex items-center gap-2"><FilePenLine className="h-5 w-5 text-blue-700" />Préparer le bilan avant envoi</DialogTitle>
        <DialogDescription>Espace de saisie complet selon le type de visa du candidat. Rédigez le bilan, prévisualisez-le, puis envoyez-le en un clic dans l’espace client et par e-mail. Aucun bilan n’est diffusé sans validation du conseiller.</DialogDescription>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600" role="status" aria-live="polite"><span className={`inline-block h-2 w-2 rounded-full ${autosaveStatus === "saving" ? "bg-amber-500" : autosaveStatus === "error" ? "bg-rose-500" : autosaveStatus === "saved" ? "bg-emerald-500" : "bg-slate-300"}`} />{autosaveStatus === "saving" ? "Sauvegarde automatique en cours…" : autosaveStatus === "error" ? "Sauvegarde à vérifier" : autosaveStatus === "saved" ? "Brouillon sauvegardé" : "Prêt pour la rédaction"}</div>
        {data && !isLoading && <><div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3" aria-label="Outils du bilan"><Button size="sm" variant="outline" onClick={() => void ensureDraft()} disabled={offlineEvaluationValidated || saveDraft.isPending}><Eye className="mr-1 h-4 w-4" />Aperçu espace candidat</Button><Button size="sm" variant="outline" onClick={() => void openEmailPreview()} disabled={offlineEvaluationValidated || saveDraft.isPending || previewEmail.isFetching}><Mail className="mr-1 h-4 w-4" />{previewEmail.isFetching ? "Préparation…" : "Aperçu e-mail"}</Button><Button size="sm" variant="outline" onClick={() => void openPdfPreview()} disabled={offlineEvaluationValidated || saveDraft.isPending || previewPdf.isPending}><FileText className="mr-1 h-4 w-4" />{previewPdf.isPending ? "Génération PDF…" : "Aperçu PDF"}</Button><Button size="sm" variant="outline" onClick={() => void saveDraftOnly()} disabled={offlineEvaluationValidated || saveDraft.isPending}><Save className="mr-1 h-4 w-4" />Enregistrer le brouillon</Button><Button size="sm" variant="outline" className="border-emerald-300 text-emerald-800" onClick={() => void openWhatsAppDraft()} disabled={offlineEvaluationValidated || saveDraft.isPending}><MessageCircle className="mr-1 h-4 w-4" />Ouvrir WhatsApp avec le bilan</Button><Button size="sm" variant="outline" className="border-sky-300 text-sky-800" onClick={() => void checkSmtp()} disabled={offlineEvaluationValidated || deliveryHealth.isFetching}><Mail className="mr-1 h-4 w-4" />{deliveryHealth.isFetching ? "Contrôle SMTP…" : "Tester SMTP"}</Button></div><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-950" role="status" aria-live="polite"><span className="font-semibold">SMTP/PDF :</span>{deliveryHealth.data ? `${deliveryHealth.data.smtp.status === "operational" ? "opérationnel" : "à vérifier"} · ${deliveryHealth.data.smtp.sentLast24h} remise(s) / 24 h · PDF ${deliveryHealth.data.pdf.status}` : deliveryHealth.isFetching ? "contrôle en cours…" : "contrôle disponible via « Tester SMTP »"}</div></>}
        {offlineEvaluationValidated && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950" role="status" aria-live="polite"><strong>Évaluation déjà validée hors ligne</strong>{data?.offlineEvaluation?.validatedAt ? ` le ${new Date(data.offlineEvaluation.validatedAt).toLocaleString("fr-FR")}` : ""}{data?.offlineEvaluation?.validatedBy ? ` par ${data.offlineEvaluation.validatedBy}` : ""}. Aucune nouvelle préparation ne peut être lancée depuis ce panneau.</div>}
      </DialogHeader>
      {!sessionToken ? <div role="alert" className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-950"><strong className="block text-base">Session administrateur introuvable</strong><p className="mt-2">Reconnectez-vous à l’espace admin puis rouvrez ce bilan.</p></div> : sourceType === "candidate" && bootstrapError ? <div role="alert" className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-950"><strong className="block text-base">Initialisation du dossier impossible</strong><p className="mt-2">{bootstrapError}</p><Button className="mt-4" variant="outline" disabled={initializeEvaluationDelivery.isPending} onClick={retryCandidateBootstrap}><RefreshCw className="mr-2 h-4 w-4" />{initializeEvaluationDelivery.isPending ? "Nouvel essai…" : "Réessayer l’initialisation"}</Button><p className="mt-3 text-xs text-rose-800">Aucune validation, aucun e-mail et aucun changement d’étape n’est déclenché par cette tentative.</p></div> : sourceType === "candidate" && !candidateBootstrapReady ? <div role="status" className="mx-auto flex min-h-[320px] max-w-xl items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500"><span><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-700" />Initialisation sécurisée du dossier d’évaluation…</span></div> : isLoading ? <div role="status" className="mx-auto flex min-h-[320px] max-w-xl items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500"><span><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-700" />Chargement du brouillon d’évaluation…</span></div> : isError || !data ? <div role="alert" className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-950"><strong className="block text-base">Le brouillon n’a pas pu être chargé</strong><p className="mt-2">{error?.message || "Aucune donnée n’a été retournée par le serveur."}</p><Button className="mt-4" variant="outline" onClick={() => { setRetryAttempts((attempts) => attempts + 1); void refetch(); }}><RefreshCw className="mr-2 h-4 w-4" />Réessayer</Button>{retryAttempts >= 3 && <Button asChild className="mt-3" variant="outline"><a href={`mailto:3mtravelandservices@gmail.com?subject=${encodeURIComponent(`Problème de chargement du bilan ${sourceRecordId}`)}&body=${encodeURIComponent(`Bonjour,\n\nLe brouillon du bilan ${sourceRecordId} ne se charge pas après ${retryAttempts} tentatives.\nURL : ${window.location.href}`)}`}><MessageCircle className="mr-2 h-4 w-4" />Signaler au support technique</a></Button>}</div> : <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-y-auto pb-24 lg:flex-row lg:gap-6 lg:overflow-hidden">
        <div className="min-w-0 flex-none space-y-4 pr-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950" data-testid="evaluation-project-kind"><strong>{data.application.fullName}</strong> · {provisionalReference ? "Numéro de dossier attribué à la validation finale" : `Dossier ${data.application.dossierNumber}`} · {data.application.destination || "Destination à préciser"} · <span className="font-semibold text-indigo-900">{projectKindLabel}</span>{data.application.visaType ? <span className="text-blue-800"> ({data.application.visaType})</span> : null}</div>
          {data.application.evaluationDeliveryStatus === "sent" && <div className={`rounded-lg border p-3 text-sm ${data.application.evaluationReportViewedAt ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-slate-200 bg-slate-50 text-slate-700"}`}><div className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" />{data.application.evaluationReportViewedAt ? `E-mail de bilan ouvert le ${new Date(data.application.evaluationReportViewedAt).toLocaleString("fr-FR")}` : "E-mail de bilan envoyé — ouverture non encore confirmée"}</div><p className="mt-1 text-xs">Ce statut est mis à jour lorsqu’une ouverture de l’e-mail est détectée ; il ne remplace pas la consultation du PDF dans l’espace client.</p></div>}
          {reviewDeadline && <div className={`rounded-lg border p-3 text-sm ${reviewOverdue ? "border-amber-300 bg-amber-50 text-amber-950" : "border-slate-200 bg-slate-50 text-slate-700"}`}><div className="flex items-center gap-2 font-semibold">{reviewOverdue ? <AlertTriangle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}{reviewOverdue ? "Priorité de relecture : délai interne de 8 h dépassé" : `Échéance de relecture interne : ${reviewDeadline.toLocaleString("fr-FR")}`}</div><p className="mt-1 text-xs">Cette échéance alerte les conseillers. Elle ne provoque jamais l’envoi automatique du bilan au candidat.</p></div>}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4"><Label htmlFor="evaluation-destination" className="text-blue-950">Destination du bilan</Label><Select value={destination} onValueChange={(value) => setDestination(value as EvaluationDestination)}><SelectTrigger id="evaluation-destination" className="mt-2 w-full bg-white sm:w-60"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="canada">Canada</SelectItem><SelectItem value="luxembourg">Luxembourg</SelectItem><SelectItem value="europe">Europe</SelectItem></SelectContent></Select><p className="mt-2 text-xs text-blue-900">Le conseiller rédige et valide manuellement chaque élément du bilan avant diffusion.</p></div>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4"><Label htmlFor="bilan-structure" className="text-indigo-950">Charger une structure de bilan — {projectKindLabel}</Label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><Select onValueChange={(value) => applyBilanStructure(value)}><SelectTrigger id="bilan-structure" className="bg-white sm:w-80"><SelectValue placeholder="Choisir une structure adaptée au type de visa" /></SelectTrigger><SelectContent>{Object.entries(bilanStructures).map(([key, structure]) => <SelectItem key={key} value={key}>{structure.label}</SelectItem>)}</SelectContent></Select><span className="self-center text-xs text-indigo-800">Structures dynamiques selon le visa ; tous les champs restent modifiables après chargement.</span></div></div>
          <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-3 text-xs text-violet-950"><strong className="mr-2">Zone préparée par l’assistance IA</strong><span>Les valeurs proposées ci-dessous restent modifiables et doivent être relues par un conseiller.</span></div>
          <div className="rounded-xl border-2 border-emerald-300 bg-white p-4 shadow-sm" data-testid="bilan-complet-zone">
            <div className="mb-2 rounded-md bg-emerald-50 p-2 text-xs text-emerald-950"><strong>Copier-coller un bilan déjà saisi ailleurs.</strong> Word, Google Docs, e-mail, ChatGPT, page web, texte, Markdown ou code HTML : la mise en forme est nettoyée et reprise à l’identique dans l’espace candidat, le PDF et l’e-mail. Vous le relisez dans l’aperçu à droite, puis un seul clic le valide et l’envoie.</div>
            <BilanTemplatesPanel sessionToken={sessionToken} projectKind={projectKindLabel} currentHtml={bilanHtml} disabled={offlineEvaluationValidated} onLoad={(html) => setBilanHtml(html)} />
            <BilanPasteEditor value={bilanHtml} onChange={setBilanHtml} disabled={offlineEvaluationValidated} label={`Bilan complet — ${projectKindLabel}`} variables={bilanVariablesFrom({ fullName: data.application.fullName, dossierNumber: data.application.dossierNumber, destination: data.application.destination ?? null, visaLabel: projectKindLabel, paymentAmount: (data.application as { paymentAmount?: number | null }).paymentAmount ?? null, score: Number(score) > 0 ? Number(score) : null })} reviewContext={{ fullName: data.application.fullName, destinations: [data.application.destination ?? null], expectedAmount: ((data.application as { paymentAmount?: number | null }).paymentAmount ?? 0) > 0 ? (data.application as { paymentAmount?: number | null }).paymentAmount : proposedOpeningFee(projectKindLabel) }} documentMeta={{ title: `Évaluation professionnelle — ${projectKindLabel}`, candidateName: data.application.fullName, reference: data.application.dossierNumber && !data.application.dossierNumber.startsWith("EVAL-DRAFT-") ? data.application.dossierNumber : null, projectLabel: projectKindLabel, destination: data.application.destination ?? null, score: Number(score) > 0 ? Number(score) : null }} />
            {hasFreeBilan && <Button type="button" variant="link" size="sm" className="mt-1 h-auto px-0 text-xs" onClick={() => setStructureOpen((open) => !open)}>{structureOpen ? "Masquer la structure facultative (verdict, points forts…)" : "Afficher la structure facultative (score, verdict, points forts, recommandations)"}</Button>}
          </div>
          {showStructure && <>
          <div className="grid grid-cols-[120px_1fr] items-end gap-3"><div><Label htmlFor="delivery-score">Score final /100</Label><Input id="delivery-score" className="mt-1" type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} /></div><div><Label htmlFor="delivery-verdict">Verdict du conseiller</Label><Input id="delivery-verdict" className="mt-1" value={verdict} onChange={(event) => setVerdict(event.target.value)} placeholder="Ex. Profil favorable sous réserve" maxLength={255} /></div></div>
          <div className="rounded-lg border-l-4 border-violet-300 pl-3"><Label htmlFor="delivery-strengths">Points forts — une ligne par point <span className="text-xs font-normal text-violet-700">(proposition IA à relire)</span></Label><Textarea id="delivery-strengths" className="mt-1 min-h-20" value={strengths} onChange={(event) => setStrengths(event.target.value)} placeholder={projectKind === "etudes" ? "Parcours académique cohérent\nCycle et filière clairement définis" : projectKind === "tourisme" ? "Statut et motif clairement exprimés\nCohérence du séjour" : "Expérience professionnelle cohérente\nFormation valorisable"} maxLength={2000} /></div>
          <div className="rounded-lg border-l-4 border-violet-300 pl-3"><Label htmlFor="delivery-weaknesses">Axes d’amélioration — une ligne par point <span className="text-xs font-normal text-violet-700">(proposition IA à relire)</span></Label><Textarea id="delivery-weaknesses" className="mt-1 min-h-20" value={weaknesses} onChange={(event) => setWeaknesses(event.target.value)} placeholder={projectKind === "etudes" ? "Compléter diplômes et relevés\nClarifier le financement des études" : projectKind === "tourisme" ? "Préciser l’itinéraire et l’hébergement\nRenforcer les preuves d’attaches" : "Justifier le niveau linguistique\nPréparer les attestations de travail"} maxLength={2000} /></div>
          <div className="rounded-lg border-l-4 border-violet-300 pl-3"><Label htmlFor="delivery-recommendations">Recommandations — une ligne par action <span className="text-xs font-normal text-violet-700">(proposition IA à relire)</span></Label><Textarea id="delivery-recommendations" className="mt-1 min-h-24" value={recommendations} onChange={(event) => setRecommendations(event.target.value)} placeholder={projectKind === "etudes" ? "Joindre diplômes et relevés complets\nPréciser le cycle visé (licence, master…)" : projectKind === "tourisme" ? "Documenter le statut et le motif du séjour\nPréparer preuves de fonds et d’attaches" : "Passer un test TCF ou IELTS certifié\nDéposer un CV à jour"} maxLength={4000} /></div>
          </>}
          <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="delivery-language">Langue du candidat</Label><Select value={language} onValueChange={(value) => setLanguage(value as "fr" | "en")}><SelectTrigger id="delivery-language" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fr">Français</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select></div><div><Label>Modèle de message — {projectKindLabel}</Label><Select onValueChange={(value) => applyTemplate(value)}><SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un modèle adapté au visa, puis personnaliser" /></SelectTrigger><SelectContent>{Object.entries(messageTemplates).filter(([value]) => language === "en" ? value.startsWith("en_") : !value.startsWith("en_")).map(([value, template]) => <SelectItem key={value} value={value}>{template.label}</SelectItem>)}</SelectContent></Select><p className="mt-1 text-xs text-slate-500">Les modèles suivent le type de visa du candidat et restent entièrement personnalisables.</p></div></div>
          <div><Label htmlFor="delivery-subject">Objet de l’e-mail</Label><Input id="delivery-subject" className="mt-1" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={255} /></div>
          <div className="rounded-xl border-2 border-blue-200 bg-white p-4 shadow-sm" data-testid="candidate-bilan-editor">
            <RichTextEditor label="Message d’accompagnement (en tête du bilan et de l’e-mail)" value={message} onChange={setMessage} placeholder={projectKind === "etudes" ? "Rédigez ici le bilan études (parcours académique, cycle, diplômes, financement)…" : projectKind === "tourisme" ? "Rédigez ici le bilan visiteurs (statut, motif, itinéraire, ressources, attaches)…" : "Rédigez ici le bilan travail (profil pro, CV, expérience, langues)…"} minHeight="18rem" maxCharacters={60000} sessionToken={sessionToken} templateScope="evaluation_message" />
            <p className="mt-2 text-xs text-slate-600">Champ de saisie complet : le contenu enrichi est enregistré dans le brouillon, publié dans l’espace candidat et repris dans l’e-mail via le bouton unique « Valider et envoyer (espace + e-mail) ».</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><Label htmlFor="evaluation-attachments" className="font-semibold text-slate-900">Pièces jointes supplémentaires</Label><p className="mt-1 text-xs text-slate-600">Jusqu’à trois fichiers PDF, Word ou image de 5 Mo maximum, en plus du bilan PDF généré.</p><Input id="evaluation-attachments" className="mt-3 bg-white" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(event) => { void addAttachments(event.target.files); event.currentTarget.value = ""; }} disabled={offlineEvaluationValidated || sendNow.isPending} />{additionalAttachments.length > 0 && <ul className="mt-3 space-y-2 text-sm">{additionalAttachments.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded border bg-white px-3 py-2"><span className="truncate">{file.name}</span><Button type="button" size="sm" variant="ghost" onClick={() => setAdditionalAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Retirer</Button></li>)}</ul>}</div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-950"><Checkbox checked={requiresSecondApproval} onCheckedChange={(value) => setRequiresSecondApproval(value === true)} /><span><strong className="block">Bilan sensible : exiger une seconde approbation</strong>Un autre administrateur devra valider cette version avant son envoi ou sa programmation.</span></label>
          <div className={`rounded-lg border p-3 text-sm ${currentDraft.advisorValidated ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />Validation obligatoire du conseiller : {currentDraft.advisorValidated ? "effectuée" : "à effectuer"}</div><p className="mt-1 text-xs">Chaque modification remet le bilan à contrôler. La validation attribue le numéro de dossier final. L’envoi et la programmation restent bloqués tant que cette validation n’est pas enregistrée.</p><Button className="mt-2" size="sm" variant="outline" disabled={offlineEvaluationValidated || validateDraft.isPending || saveDraft.isPending} onClick={async () => { if (await ensureDraft()) validateDraft.mutate({ sessionToken, sourceRecordId: effectiveSourceRecordId, validationComment: "Bilan relu, ajusté si nécessaire et validé avant diffusion." }); }}>{validateDraft.isPending ? "Validation…" : "Valider le bilan et attribuer le dossier"}</Button></div>
          {requiresSecondApproval && <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />Seconde approbation : {data.application.evaluationApprovalStatus === "approved" ? "approuvée" : data.application.evaluationApprovalStatus === "pending" ? "en attente d’un second administrateur" : "à soumettre"}</div>{data.application.evaluationApprovalStatus === "pending" && <Button className="mt-2" size="sm" variant="outline" disabled={offlineEvaluationValidated || approve.isPending} onClick={() => approve.mutate({ sessionToken, sourceRecordId: effectiveSourceRecordId, approvalComment: "Bilan contrôlé avant diffusion." })}>{approve.isPending ? "Approbation…" : "Approuver comme second administrateur"}</Button>}</div>}
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><Label htmlFor="delivery-scheduled-at">Planifier l’envoi à une date et heure</Label><Input id="delivery-scheduled-at" className="mt-2" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /><Button className="mt-2" variant="outline" disabled={offlineEvaluationValidated || !scheduledAt || schedule.isPending || saveDraft.isPending || validateDraft.isPending} onClick={async () => { if (!assertPreviewBeforeSend()) return; if (requiresSecondApproval && deliveryData?.application?.evaluationApprovalStatus !== "approved") { toast({ title: "Seconde approbation requise", description: "Ce bilan sensible doit d’abord être approuvé par un autre administrateur.", variant: "destructive" }); return; } if (!(await ensureDraft())) return; if (!currentDraft.advisorValidated) { try { await validateDraft.mutateAsync({ sessionToken, sourceRecordId: effectiveSourceRecordId, validationComment: "Bilan relu et validé avant programmation." }); } catch { return; } } schedule.mutate({ sessionToken, sourceRecordId: effectiveSourceRecordId, scheduledAt: new Date(scheduledAt) }); }}><CalendarClock className="mr-1 h-4 w-4" />{schedule.isPending ? "Programmation…" : "Programmer l’envoi"}</Button></div>
          <div ref={previewGateRef} className={`rounded-lg border p-3 text-sm ${canSendWithPreview ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-300 bg-amber-50 text-amber-950"}`} data-testid="bilan-preview-gate">
            <div className="flex items-center gap-2 font-semibold"><Eye className="h-4 w-4" />Contrôle d’aperçu avant envoi — {projectKindLabel}</div>
            <p className="mt-1 text-xs">Ouvrez l’aperçu (espace candidat, e-mail ou PDF), relisez le rendu, puis confirmez. L’envoi reste bloqué tant que ce contrôle n’est pas coché.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void ensureDraft()} disabled={offlineEvaluationValidated || saveDraft.isPending}><Eye className="mr-1 h-3.5 w-3.5" />Générer l’aperçu</Button>
              <Button size="sm" variant="outline" onClick={() => void openEmailPreview()} disabled={offlineEvaluationValidated || saveDraft.isPending || previewEmail.isFetching}><Mail className="mr-1 h-3.5 w-3.5" />Aperçu e-mail</Button>
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-md border border-current/20 bg-white/70 p-3">
              <Checkbox
                checked={previewReviewed}
                disabled={!canConfirmPreview || offlineEvaluationValidated}
                onCheckedChange={(value) => setPreviewReviewed(value === true)}
                aria-label="Confirmer le contrôle d’aperçu du bilan"
              />
              <span>
                <strong className="block">J’ai contrôlé l’aperçu du bilan avant envoi</strong>
                <span className="text-xs opacity-90">Confirmation obligatoire pour publier dans l’espace client et envoyer l’e-mail ({projectKindLabel}).</span>
              </span>
            </label>
            {!canConfirmPreview && <p className="mt-2 text-xs font-medium">Aperçu pas encore ouvert — utilisez les boutons ci-dessus.</p>}
          </div>
        </div>
        <div className="min-w-0 flex-none space-y-4 pr-1 lg:min-h-0 lg:min-w-[640px] lg:flex-[1.35] lg:overflow-y-auto lg:overscroll-contain lg:pr-3"><div className="min-h-[480px] rounded-lg border border-slate-200 bg-slate-50 p-3 lg:min-h-[680px]">
<div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Eye className="h-4 w-4" />Aperçu du bilan qui sera envoyé</div>{previewHtml ? <iframe title="Prévisualisation du bilan" sandbox="" srcDoc={previewHtml} className="h-[600px] min-h-[480px] w-full rounded border bg-white lg:h-[700px] lg:min-h-[62vh]" /> : <div className="flex h-[360px] items-center justify-center rounded border border-dashed bg-white p-5 text-center text-sm text-slate-500 lg:h-[560px] lg:p-8">Modifiez les éléments nécessaires puis cliquez sur <strong className="ml-1">Prévisualiser</strong> pour consulter le rendu exact avant l’envoi.</div>}</div><div className="rounded-lg border border-slate-200 p-3" data-testid="evaluation-send-journal"><p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Send className="h-4 w-4" />Journal des envois (type de visa)</p>{sendHistory.isLoading ? <p className="mt-2 text-xs text-slate-500">Chargement de l’historique…</p> : sendHistory.data?.length ? <div className="mt-3 space-y-2">{sendHistory.data.map((item: any) => <details key={item.id} className="rounded border bg-slate-50 p-2 text-xs"><summary className="cursor-pointer font-semibold">{item.status === "sent" ? "Envoyé" : item.status === "failed" ? "Échec" : "En attente"} · {item.visaType || item.projectKindLabel || "Visa non précisé"} · {item.sentAt ? new Date(item.sentAt).toLocaleString("fr-FR") : new Date(item.createdAt).toLocaleString("fr-FR")}</summary><div className="mt-2 space-y-2"><p className="text-slate-700"><strong>Type de visa journalisé :</strong> {item.visaType || "—"}</p><p className="whitespace-pre-wrap text-slate-600">{item.contentText || "Contenu non disponible"}</p><Button type="button" size="sm" variant="outline" onClick={() => resendHistory.mutate({ sessionToken, emailId: item.id })} disabled={resendHistory.isPending || item.status !== "sent"}><Send className="mr-1 h-3.5 w-3.5" />Renvoyer</Button></div></details>)}</div> : <p className="mt-2 text-xs text-slate-500">Aucun bilan envoyé pour ce dossier.</p>}</div><div className="rounded-lg border p-3"><p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><History className="h-4 w-4" />Historique des versions</p><div className="mt-3 space-y-2">{data.versions.length ? data.versions.map((version) => <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded border bg-slate-50 p-2 text-xs"><div><strong>Version {version.versionNumber}</strong> · {version.approvalStatus}<br /><span className="text-slate-500">{new Date(version.createdAt).toLocaleString("fr-FR")}</span></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => resumeVersion(version)}><FilePenLine className="mr-1 h-3.5 w-3.5" />Reprendre l’évaluation</Button>{version.pdfUrl && <Button asChild size="sm" variant="outline"><a href={version.pdfUrl} target="_blank" rel="noreferrer"><Download className="mr-1 h-3.5 w-3.5" />PDF</a></Button>}</div></div>) : <p className="text-sm text-slate-500">La première version apparaîtra dès l’enregistrement du brouillon.</p>}</div>{data.versions.length > 1 && <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="flex items-center gap-2 text-sm font-semibold text-indigo-950"><GitCompareArrows className="h-4 w-4" />Comparer deux versions</p><Button size="sm" variant="outline" disabled={!comparisonLeft || !comparisonRight || comparisonLeft.id === comparisonRight.id} onClick={exportComparisonPdf}><Download className="mr-1 h-3.5 w-3.5" />Exporter le comparatif PDF</Button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><Select value={comparisonLeftId} onValueChange={setComparisonLeftId}><SelectTrigger><SelectValue placeholder="Version précédente" /></SelectTrigger><SelectContent>{data.versions.map((version: any) => <SelectItem key={version.id} value={String(version.id)}>Version {version.versionNumber}</SelectItem>)}</SelectContent></Select><Select value={comparisonRightId} onValueChange={setComparisonRightId}><SelectTrigger><SelectValue placeholder="Version récente" /></SelectTrigger><SelectContent>{data.versions.map((version: any) => <SelectItem key={version.id} value={String(version.id)}>Version {version.versionNumber}</SelectItem>)}</SelectContent></Select></div><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead><tr className="border-b text-slate-500"><th className="p-2">Élément</th><th className="p-2">V{String(comparisonLeft?.versionNumber ?? "—")}</th><th className="p-2">V{String(comparisonRight?.versionNumber ?? "—")}</th></tr></thead><tbody>{comparisonRows.map((row: any) => { const [label, left, right] = row; const changed = left !== right; return <tr key={String(label)} className="border-b last:border-0"><th className="p-2 font-medium text-slate-700">{String(label)}</th><td className={`p-2 align-top ${changed ? "bg-amber-50 text-amber-950" : "text-slate-700"}`}>{String(left ?? "")}</td><td className={`p-2 align-top ${changed ? "bg-emerald-50 text-emerald-950" : "text-slate-700"}`}>{String(right ?? "")}</td></tr>; })}</tbody></table></div></div>}</div></div>
      </div>}
      {emailPreviewOpen && emailPreview && <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="flex items-center gap-2 font-semibold text-blue-950"><Mail className="h-4 w-4" />Aperçu exact de l’e-mail</p><p className="text-xs text-blue-900">Le message affiche la signature du conseiller et reste modifiable avant la diffusion finale.</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={printEmailPreview}><Printer className="mr-1 h-3.5 w-3.5" />Imprimer l’aperçu</Button><Button size="sm" variant="outline" onClick={() => setEmailPreviewOpen(false)}>Fermer l’aperçu</Button></div></div><div className="grid gap-2 rounded border border-blue-100 bg-white p-3 text-sm sm:grid-cols-2"><p><strong>Destinataire :</strong> {emailPreview.recipient}</p><p><strong>Pièce jointe :</strong> <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{emailPreview.attachmentLabel}</span></p><p className="sm:col-span-2"><strong>Objet :</strong> {emailPreview.subject}</p></div><div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3"><Label htmlFor="evaluation-test-email" className="text-sm font-semibold text-amber-950">Envoyer un test interne</Label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><Input id="evaluation-test-email" type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="adresse-admin@3mtravelagency.com" maxLength={320} /><Button variant="outline" disabled={!testEmail || sendTestEmail.isPending} onClick={() => sendTestEmail.mutate({ sessionToken, sourceRecordId: effectiveSourceRecordId, testEmail })}>{sendTestEmail.isPending ? "Envoi…" : "Envoyer le test"}</Button></div><p className="mt-2 text-xs text-amber-900">Seules les adresses d’administrateurs internes actives sont acceptées. Le client ne reçoit aucune notification.</p></div><iframe title="Aperçu exact de l’e-mail d’évaluation" sandbox="" srcDoc={emailPreview.html} className="mt-3 h-[560px] w-full rounded border bg-white" /></div>}
      {data && <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-1 gap-2 border-t-2 border-blue-200 bg-white px-3 py-3 shadow-[0_-10px_28px_rgba(15,23,42,0.18)] sm:grid-cols-2 sm:px-6 lg:px-10"><Button aria-busy={validateDraft.isPending} className="min-w-0 w-full whitespace-normal border border-amber-300 bg-amber-50 px-3 py-2 text-center font-semibold leading-5 text-amber-950 hover:bg-amber-100" variant="outline" disabled={offlineEvaluationValidated || validateDraft.isPending || saveDraft.isPending} onClick={async () => { if (await ensureDraft()) validateDraft.mutate({ sessionToken, sourceRecordId: effectiveSourceRecordId, validationComment: "Bilan relu, ajusté si nécessaire et validé avant diffusion." }); }}>{validateDraft.isPending ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Validation en cours…</> : "Valider le bilan"}</Button><Button aria-label="Valider et envoyer dans l’espace client et par e-mail" title={canSendWithPreview ? "Un seul bouton : publie le bilan dans l’espace client et l’envoie par e-mail" : "Contrôlez d’abord l’aperçu du bilan"} aria-busy={sendNow.isPending || validateDraft.isPending} className="min-w-0 w-full whitespace-normal bg-blue-700 px-3 py-2 text-center font-semibold leading-5 hover:bg-blue-800" disabled={offlineEvaluationValidated || sendNow.isPending || saveDraft.isPending || validateDraft.isPending} onClick={async () => { if (requiresSecondApproval && data.application.evaluationApprovalStatus !== "approved") { toast({ title: "Seconde approbation requise", description: "Ce bilan sensible doit d’abord être approuvé par un autre administrateur.", variant: "destructive" }); return; } if (!assertPreviewBeforeSend()) return; if (!(await ensureDraft())) return; if (!currentDraft.advisorValidated) { await validateDraft.mutateAsync({ sessionToken, sourceRecordId: effectiveSourceRecordId, validationComment: "Bilan relu et validé avant diffusion." }); } sendNow.mutate({ sessionToken, sourceRecordId: effectiveSourceRecordId, previewConfirmed: true as const, attachments: additionalAttachments }); }}>{sendNow.isPending || validateDraft.isPending ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />{sendNow.isPending ? "Envoi espace client + e-mail…" : "Validation en cours…"}</> : canSendWithPreview ? "Valider et envoyer (espace + e-mail)" : "Valider et envoyer (cochez le contrôle d’aperçu)"}</Button></div>}
      </DialogContent>
      <PDFPreviewModal isOpen={Boolean(pdfPreview)} onClose={() => setPdfPreview(null)} pdfUrl={pdfPreview?.url ?? ""} fileName={pdfPreview?.fileName ?? "bilan.pdf"} downloadUrl={pdfPreview?.url ?? ""} />
  </Dialog>;
}
