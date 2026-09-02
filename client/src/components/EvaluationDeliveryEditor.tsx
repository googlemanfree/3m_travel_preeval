import { useEffect, useMemo, useRef, useState } from "react";
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
import { RichTextEditor } from "@/components/RichTextEditor";
import { PDFPreviewModal } from "@/components/PDFPreviewModal";

type Props = {
  sessionToken: string;
  sourceRecordId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

const MESSAGE_TEMPLATES = {
  en_standard: { label: "English — Standard assessment", subject: "Your 3M Travel & Services profile assessment", message: "Hello,\n\nOur team has completed the preliminary review of your profile. This assessment outlines your strengths, areas to improve and recommended next steps for your international mobility project." },
  en_promising: { label: "English — Promising profile", subject: "Your profile shows promising prospects - 3M Travel", message: "Hello,\n\nYour profile shows promising strengths for your project. Please review the attached assessment and prepare the recommended information to strengthen your application." },
  en_canada: { label: "English — Canada assessment", subject: "Your Canada procedure assessment - 3M Travel", message: "Hello,\n\nOur team has completed the review of your Canada project. Your assessment presents the points reviewed, documents to prepare and recommended next steps." },
  en_luxembourg: { label: "English — Luxembourg assessment", subject: "Your Luxembourg procedure assessment - 3M Travel", message: "Hello,\n\nYour Luxembourg assessment is ready. Please review the priorities and prepare the supporting documents listed for the next stage of your file." },
  standard: {
    label: "Bilan standard",
    subject: "Votre Bilan d'Évaluation - 3M Travel & Services",
    message: "Bonjour,\n\nNotre équipe a finalisé l'analyse préliminaire de votre profil. Vous trouverez dans ce bilan vos points forts, les axes à renforcer et les prochaines étapes recommandées pour votre projet de mobilité internationale.",
  },
  promising: {
    label: "Profil prometteur",
    subject: "Votre profil présente de belles perspectives - 3M Travel",
    message: "Bonjour,\n\nVotre profil présente des atouts intéressants pour votre projet. Nous vous invitons à consulter le bilan joint et à préparer les éléments recommandés afin de renforcer votre candidature.",
  },
  improvement: {
    label: "Profil à renforcer",
    subject: "Votre plan d'amélioration personnalisé - 3M Travel",
    message: "Bonjour,\n\nNotre analyse identifie des axes précis à renforcer avant la suite de votre procédure. Votre bilan détaille les actions prioritaires qui permettront d'améliorer la présentation et la cohérence de votre dossier.",
  },
  canada: {
    label: "Canada — bilan et prochaines étapes",
    subject: "Votre bilan de procédure Canada - 3M Travel",
    message: "Bonjour,\n\nNotre équipe a finalisé la revue de votre projet Canada. Votre bilan présente les éléments retenus, les justificatifs à préparer et les prochaines étapes recommandées pour faire avancer votre dossier.",
  },
  luxembourg: {
    label: "Luxembourg — bilan et pièces à préparer",
    subject: "Votre bilan de procédure Luxembourg - 3M Travel",
    message: "Bonjour,\n\nVotre bilan pour le Luxembourg est prêt. Nous vous invitons à consulter les priorités indiquées et à préparer les pièces justificatives listées pour la prochaine étape de votre dossier.",
  },
  europe: {
    label: "Europe — orientation et plan d’action",
    subject: "Votre bilan de mobilité Europe - 3M Travel",
    message: "Bonjour,\n\nNotre équipe a préparé votre bilan de mobilité Europe. Vous y trouverez l’orientation retenue, les points à renforcer et le plan d’action recommandé avant la suite de la procédure.",
  },
} as const;

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

export function EvaluationDeliveryEditor({ sessionToken, sourceRecordId, open, onOpenChange, onCompleted }: Props) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data, isLoading, isFetching, isError, error, refetch } = trpc.unifiedRequests.getEvaluationDelivery.useQuery({ sessionToken, sourceRecordId }, { enabled: open && Boolean(sessionToken), retry: 2, refetchOnWindowFocus: false });
  const [score, setScore] = useState("0");
  const [destination, setDestination] = useState<EvaluationDestination>("europe");
  const [verdict, setVerdict] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
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
  const lastAutosavedPayload = useRef("");

  useEffect(() => {
    if (!data?.draft) return;
    setDestination(normalizeDestination(data.draft.destination));
    setScore(String(data.draft.finalScore));
    setVerdict(data.draft.verdict);
    setStrengths(joinLines(data.draft.strengths));
    setWeaknesses(joinLines(data.draft.weaknesses));
    setRecommendations(joinLines(data.draft.recommendations));
    setSubject(data.draft.subject);
    setMessage(data.draft.message);
    setLanguage(data.draft.language === "en" ? "en" : "fr");
    setScheduledAt(data.application.evaluationScheduledAt ? new Date(data.application.evaluationScheduledAt).toISOString().slice(0, 16) : "");
    setRequiresSecondApproval(data.draft.requiresSecondApproval);
    setComparisonLeftId(String(data.versions[1]?.id ?? data.versions[0]?.id ?? ""));
    setComparisonRightId(String(data.versions[0]?.id ?? ""));
    setPreviewHtml("");
  }, [data]);

  const payload = useMemo(() => ({
    sessionToken,
    sourceRecordId,
    destination,
    finalScore: Math.max(0, Math.min(100, Number(score) || 0)),
    verdict: verdict.trim() || "Évaluation préliminaire à consulter",
    strengths: splitLines(strengths),
    weaknesses: splitLines(weaknesses),
    recommendations: splitLines(recommendations),
    subject: subject.trim() || undefined,
    message: message.trim() || undefined,
    requiresSecondApproval,
    language,
  }), [sessionToken, sourceRecordId, destination, score, verdict, strengths, weaknesses, recommendations, subject, message, requiresSecondApproval, language]);

  const saveDraft = trpc.unifiedRequests.saveEvaluationDeliveryDraft.useMutation({
    onSuccess: (result) => setPreviewHtml(result.reportHtml),
    onError: (error) => toast({ title: "Brouillon non enregistré", description: error.message, variant: "destructive" }),
  });
  const sendNow = trpc.unifiedRequests.sendEvaluationNow.useMutation({
    onSuccess: (result) => {
      toast({ title: "E-mail d’évaluation envoyé", description: `${result.message} Destinataire : ${data?.application?.email ?? "candidat"}. Dossier : ${result.dossierNumber ?? data?.application?.dossierNumber ?? "—"}.` });
      onCompleted();
      onOpenChange(false);
    },
    onError: (error) => toast({ title: "Envoi impossible", description: error.message, variant: "destructive" }),
  });
  const schedule = trpc.unifiedRequests.scheduleEvaluationDelivery.useMutation({
    onSuccess: (result) => {
      toast({ title: "Envoi programmé", description: result.message });
      onCompleted();
      onOpenChange(false);
    },
    onError: (error) => toast({ title: "Planification impossible", description: error.message, variant: "destructive" }),
  });
  const approve = trpc.unifiedRequests.approveSensitiveEvaluation.useMutation({
    onSuccess: (result) => { void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId }); toast({ title: "Bilan approuvé", description: result.message }); },
    onError: (error) => toast({ title: "Approbation impossible", description: error.message, variant: "destructive" }),
  });
  const validateDraft = trpc.unifiedRequests.validateEvaluationDraft.useMutation({
    onSuccess: (result) => {
      void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId });
      toast({ title: "Bilan validé", description: result.message });
    },
    onError: (error) => toast({ title: "Validation impossible", description: error.message, variant: "destructive" }),
  });
  useEffect(() => {
    if (!open || !data || isLoading || isFetching || !payload.recommendations.length) return;
    const fingerprint = JSON.stringify(payload);
    if (fingerprint === lastAutosavedPayload.current) return;
    setAutosaveStatus("saving");
    const timer = window.setTimeout(() => {
      saveDraft.mutate(payload, {
        onSuccess: () => { lastAutosavedPayload.current = fingerprint; setAutosaveStatus("saved"); },
        onError: () => setAutosaveStatus("error"),
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [open, data, isLoading, isFetching, payload]);

  const previewEmail = trpc.unifiedRequests.previewEvaluationDeliveryEmail.useQuery({ sessionToken, sourceRecordId }, { enabled: false });
  const previewPdf = trpc.unifiedRequests.previewEvaluationDeliveryPdf.useMutation({
    onSuccess: (result) => setPdfPreview({ url: result.url, fileName: result.fileName }),
    onError: (error) => toast({ title: "Aperçu PDF indisponible", description: error.message, variant: "destructive" }),
  });
  const sendTestEmail = trpc.unifiedRequests.sendEvaluationTestEmail.useMutation({
    onSuccess: (result) => toast({ title: "Test interne envoyé", description: result.message }),
    onError: (error) => toast({ title: "Test non envoyé", description: error.message, variant: "destructive" }),
  });

  const ensureDraft = async () => {
    if (payload.verdict.trim().length < 3) {
      toast({ title: "Bilan requis", description: "Saisissez au moins trois caractères dans le champ du bilan avant l’envoi.", variant: "destructive" });
      return false;
    }
    await saveDraft.mutateAsync(payload);
    lastAutosavedPayload.current = JSON.stringify(payload);
    void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId });
    return true;
  };
  const saveDraftOnly = async () => {
    if (payload.verdict.trim().length < 3) {
      toast({ title: "Bilan requis", description: "Saisissez au moins trois caractères avant d’enregistrer le brouillon.", variant: "destructive" });
      return;
    }
    await saveDraft.mutateAsync(payload);
    lastAutosavedPayload.current = JSON.stringify(payload);
    void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId });
    toast({ title: "Brouillon enregistré", description: "Le bilan est sauvegardé sans e-mail, sans publication et sans changement d’étape côté candidat." });
  };

  const applyTemplate = (key: keyof typeof MESSAGE_TEMPLATES) => {
    const template = MESSAGE_TEMPLATES[key];
    setSubject(template.subject);
    setMessage(template.message);
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
  const openWhatsAppDraft = async () => {
    if (!(await ensureDraft())) return;
    const phone = String((data?.application as any)?.whatsappNumber ?? (data?.application as any)?.phone ?? "").replace(/\D/g, "");
    if (!phone) {
      toast({ title: "WhatsApp indisponible", description: "Aucun numéro WhatsApp vérifié n’est enregistré pour ce candidat.", variant: "destructive" });
      return;
    }
    const text = `${subject.trim() || "Votre évaluation 3M Travel & Services"}\n\nBonjour ${data?.application?.fullName || ""},\n\n${message.trim() || "Votre évaluation est disponible dans votre espace client."}\n\nLe bilan complet est consultable dans votre espace client. Cette ouverture WhatsApp nécessite votre confirmation avant l’envoi.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };
  const openPdfPreview = async () => {
    if (!(await ensureDraft())) return;
    previewPdf.mutate({ sessionToken, sourceRecordId });
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
  };
  const currentDraft = data?.draft ?? {
    advisorValidated: false,
    profileSummary: "",
    informationToVerify: [] as string[],
    nextAdminAction: "",
  };
  const requiresApprovalBeforeDelivery = !currentDraft.advisorValidated || (requiresSecondApproval && data?.application?.evaluationApprovalStatus !== "approved");
  const provisionalReference = Boolean(data?.application?.dossierNumber?.startsWith("EVAL-DRAFT-"));
  const reviewDeadline = data?.application?.createdAt ? new Date(new Date(data.application.createdAt).getTime() + 8 * 60 * 60 * 1000) : null;
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
    setLanguage(draft.language === "en" ? "en" : "fr");
    setRequiresSecondApproval(Boolean(version.requiresSecondApproval ?? draft.requiresSecondApproval));
    setPreviewHtml(String(version.reportHtml ?? ""));
    toast({ title: `Version ${version.versionNumber} reprise`, description: "Vous pouvez maintenant la modifier puis l’enregistrer ou la valider avant envoi." });
  };
  const versions = data?.versions ?? [];
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
    doc.setFillColor(30, 58, 138); doc.rect(0, 0, 210, 28, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text("3M Travel & Services — Audit de versions", 14, 17);
    doc.setTextColor(31, 41, 55); doc.setFontSize(10); doc.setFont("helvetica", "normal"); y = 40;
    doc.text(`${data.application.fullName} · Dossier ${data.application.dossierNumber}`, 14, y); y += 7;
    doc.text(`Comparatif exporté le ${new Date().toLocaleString("fr-FR")}`, 14, y); y += 10;
    comparisonRows.forEach(([label, left, right]) => write(label, left, right));
    doc.save(`audit-bilan-${data.application.dossierNumber}-v${comparisonLeft.versionNumber}-v${comparisonRight.versionNumber}.pdf`);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col overflow-hidden rounded-none border-0 border-slate-200 bg-slate-50/95 p-3 shadow-2xl sm:p-5 lg:p-6">
      <DialogHeader className="shrink-0 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm lg:px-7">
        <DialogTitle className="flex items-center gap-2"><FilePenLine className="h-5 w-5 text-blue-700" />Préparer le bilan avant envoi</DialogTitle>
        <DialogDescription>Rédigez directement le bilan dans cet espace de travail, prévisualisez-le et validez-le humainement avant toute diffusion. Aucun bilan n’est envoyé automatiquement sans validation du conseiller.</DialogDescription>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600" role="status" aria-live="polite"><span className={`inline-block h-2 w-2 rounded-full ${autosaveStatus === "saving" ? "bg-amber-500" : autosaveStatus === "error" ? "bg-rose-500" : autosaveStatus === "saved" ? "bg-emerald-500" : "bg-slate-300"}`} />{autosaveStatus === "saving" ? "Sauvegarde automatique en cours…" : autosaveStatus === "error" ? "Sauvegarde à vérifier" : autosaveStatus === "saved" ? "Brouillon sauvegardé" : "Prêt pour la rédaction"}</div>
      </DialogHeader>
      {!sessionToken ? <div role="alert" className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-950"><strong className="block text-base">Session administrateur introuvable</strong><p className="mt-2">Reconnectez-vous à l’espace admin puis rouvrez ce bilan.</p></div> : isLoading ? <div role="status" className="mx-auto flex min-h-[320px] max-w-xl items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500"><span><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-700" />Chargement du brouillon d’évaluation…</span></div> : isError || !data ? <div role="alert" className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-950"><strong className="block text-base">Le brouillon n’a pas pu être chargé</strong><p className="mt-2">{error?.message || "Aucune donnée n’a été retournée par le serveur."}</p><Button className="mt-4" variant="outline" onClick={() => { setRetryAttempts((attempts) => attempts + 1); void refetch(); }}><RefreshCw className="mr-2 h-4 w-4" />Réessayer</Button>{retryAttempts >= 3 && <Button asChild className="mt-3" variant="outline"><a href={`mailto:3mtravelandservices@gmail.com?subject=${encodeURIComponent(`Problème de chargement du bilan ${sourceRecordId}`)}&body=${encodeURIComponent(`Bonjour,\n\nLe brouillon du bilan ${sourceRecordId} ne se charge pas après ${retryAttempts} tentatives.\nURL : ${window.location.href}`)}`}><MessageCircle className="mr-2 h-4 w-4" />Signaler au support technique</a></Button>}</div> : <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-y-auto pb-24 lg:flex-row lg:gap-6 lg:overflow-hidden">
        <div className="min-w-0 flex-none space-y-4 pr-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950"><strong>{data.application.fullName}</strong> · {provisionalReference ? "Numéro de dossier attribué à la validation finale" : `Dossier ${data.application.dossierNumber}`} · {data.application.destination || "Destination à préciser"}</div>
          {data.application.evaluationDeliveryStatus === "sent" && <div className={`rounded-lg border p-3 text-sm ${data.application.evaluationReportViewedAt ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-slate-200 bg-slate-50 text-slate-700"}`}><div className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" />{data.application.evaluationReportViewedAt ? `E-mail de bilan ouvert le ${new Date(data.application.evaluationReportViewedAt).toLocaleString("fr-FR")}` : "E-mail de bilan envoyé — ouverture non encore confirmée"}</div><p className="mt-1 text-xs">Ce statut est mis à jour lorsqu’une ouverture de l’e-mail est détectée ; il ne remplace pas la consultation du PDF dans l’espace client.</p></div>}
          {reviewDeadline && <div className={`rounded-lg border p-3 text-sm ${reviewOverdue ? "border-amber-300 bg-amber-50 text-amber-950" : "border-slate-200 bg-slate-50 text-slate-700"}`}><div className="flex items-center gap-2 font-semibold">{reviewOverdue ? <AlertTriangle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}{reviewOverdue ? "Priorité de relecture : délai interne de 8 h dépassé" : `Échéance de relecture interne : ${reviewDeadline.toLocaleString("fr-FR")}`}</div><p className="mt-1 text-xs">Cette échéance alerte les conseillers. Elle ne provoque jamais l’envoi automatique du bilan au candidat.</p></div>}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4"><Label htmlFor="evaluation-destination" className="text-blue-950">Destination du bilan</Label><Select value={destination} onValueChange={(value) => setDestination(value as EvaluationDestination)}><SelectTrigger id="evaluation-destination" className="mt-2 w-full bg-white sm:w-60"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="canada">Canada</SelectItem><SelectItem value="luxembourg">Luxembourg</SelectItem><SelectItem value="europe">Europe</SelectItem></SelectContent></Select><p className="mt-2 text-xs text-blue-900">Le conseiller rédige et valide manuellement chaque élément du bilan avant diffusion.</p></div>
          <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-3 text-xs text-violet-950"><strong className="mr-2">Zone préparée par l’assistance IA</strong><span>Les valeurs proposées ci-dessous restent modifiables et doivent être relues par un conseiller.</span></div>
          <div className="grid grid-cols-[120px_1fr] items-end gap-3"><div><Label htmlFor="delivery-score">Score final /100</Label><Input id="delivery-score" className="mt-1" type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} /></div><div><Label htmlFor="delivery-verdict">Verdict du conseiller</Label><Input id="delivery-verdict" className="mt-1" value={verdict} onChange={(event) => setVerdict(event.target.value)} placeholder="Ex. Profil favorable sous réserve" /></div></div>
          <div className="rounded-lg border-l-4 border-violet-300 pl-3"><Label htmlFor="delivery-strengths">Points forts — une ligne par point <span className="text-xs font-normal text-violet-700">(proposition IA à relire)</span></Label><Textarea id="delivery-strengths" className="mt-1 min-h-20" value={strengths} onChange={(event) => setStrengths(event.target.value)} placeholder="Expérience professionnelle cohérente\nFormation valorisable" /></div>
          <div className="rounded-lg border-l-4 border-violet-300 pl-3"><Label htmlFor="delivery-weaknesses">Axes d’amélioration — une ligne par point <span className="text-xs font-normal text-violet-700">(proposition IA à relire)</span></Label><Textarea id="delivery-weaknesses" className="mt-1 min-h-20" value={weaknesses} onChange={(event) => setWeaknesses(event.target.value)} placeholder="Justifier le niveau linguistique\nPréparer les attestations de travail" /></div>
          <div className="rounded-lg border-l-4 border-violet-300 pl-3"><Label htmlFor="delivery-recommendations">Recommandations — une ligne par action <span className="text-xs font-normal text-violet-700">(proposition IA à relire)</span></Label><Textarea id="delivery-recommendations" className="mt-1 min-h-24" value={recommendations} onChange={(event) => setRecommendations(event.target.value)} placeholder="Passer un test TCF ou IELTS certifié\nFaire évaluer les diplômes" /></div>
          <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="delivery-language">Langue du candidat</Label><Select value={language} onValueChange={(value) => setLanguage(value as "fr" | "en")}><SelectTrigger id="delivery-language" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fr">Français</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select></div><div><Label>Modèle de message par procédure</Label><Select onValueChange={(value) => applyTemplate(value as keyof typeof MESSAGE_TEMPLATES)}><SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un modèle, puis personnaliser" /></SelectTrigger><SelectContent>{Object.entries(MESSAGE_TEMPLATES).filter(([value]) => language === "en" ? value.startsWith("en_") : !value.startsWith("en_")).map(([value, template]) => <SelectItem key={value} value={value}>{template.label}</SelectItem>)}</SelectContent></Select><p className="mt-1 text-xs text-slate-500">Les modèles sont filtrés selon la langue choisie et restent entièrement personnalisables.</p></div></div>
          <div><Label htmlFor="delivery-subject">Objet de l’e-mail</Label><Input id="delivery-subject" className="mt-1" value={subject} onChange={(event) => setSubject(event.target.value)} /></div>
          <RichTextEditor label="Bloc-notes du conseiller — message d’évaluation" value={message} onChange={setMessage} placeholder="Rédigez ici l’évaluation et les explications personnalisées du candidat…" minHeight="34rem" maxCharacters={8000} sessionToken={sessionToken} templateScope="evaluation_message" />
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-950"><Checkbox checked={requiresSecondApproval} onCheckedChange={(value) => setRequiresSecondApproval(value === true)} /><span><strong className="block">Bilan sensible : exiger une seconde approbation</strong>Un autre administrateur devra valider cette version avant son envoi ou sa programmation.</span></label>
          <div className={`rounded-lg border p-3 text-sm ${currentDraft.advisorValidated ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />Validation obligatoire du conseiller : {currentDraft.advisorValidated ? "effectuée" : "à effectuer"}</div><p className="mt-1 text-xs">Chaque modification remet le bilan à contrôler. La validation attribue le numéro de dossier final. L’envoi et la programmation restent bloqués tant que cette validation n’est pas enregistrée.</p><Button className="mt-2" size="sm" variant="outline" disabled={validateDraft.isPending || saveDraft.isPending} onClick={async () => { if (await ensureDraft()) validateDraft.mutate({ sessionToken, sourceRecordId, validationComment: "Bilan relu, ajusté si nécessaire et validé avant diffusion." }); }}>{validateDraft.isPending ? "Validation…" : "Valider le bilan et attribuer le dossier"}</Button></div>
          {requiresSecondApproval && <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />Seconde approbation : {data.application.evaluationApprovalStatus === "approved" ? "approuvée" : data.application.evaluationApprovalStatus === "pending" ? "en attente d’un second administrateur" : "à soumettre"}</div>{data.application.evaluationApprovalStatus === "pending" && <Button className="mt-2" size="sm" variant="outline" disabled={approve.isPending} onClick={() => approve.mutate({ sessionToken, sourceRecordId, approvalComment: "Bilan contrôlé avant diffusion." })}>{approve.isPending ? "Approbation…" : "Approuver comme second administrateur"}</Button>}</div>}
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><Label htmlFor="delivery-scheduled-at">Planifier l’envoi à une date et heure</Label><Input id="delivery-scheduled-at" className="mt-2" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /><Button className="mt-2" variant="outline" disabled={!scheduledAt || schedule.isPending || saveDraft.isPending || requiresApprovalBeforeDelivery} onClick={async () => { if (requiresSecondApproval) schedule.mutate({ sessionToken, sourceRecordId, scheduledAt: new Date(scheduledAt) }); else if (await ensureDraft()) schedule.mutate({ sessionToken, sourceRecordId, scheduledAt: new Date(scheduledAt) }); }}><CalendarClock className="mr-1 h-4 w-4" />{schedule.isPending ? "Programmation…" : "Programmer l’envoi"}</Button></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><Button aria-busy={sendNow.isPending || saveDraft.isPending || validateDraft.isPending} className="min-w-0 w-full whitespace-normal bg-blue-700 px-3 py-2 text-center leading-5 hover:bg-blue-800" disabled={sendNow.isPending || saveDraft.isPending || validateDraft.isPending || (requiresSecondApproval && data.application.evaluationApprovalStatus !== "approved")} onClick={async () => { if (!(await ensureDraft())) return; if (!currentDraft.advisorValidated) { await validateDraft.mutateAsync({ sessionToken, sourceRecordId, validationComment: "Bilan relu et validé avant diffusion." }); } sendNow.mutate({ sessionToken, sourceRecordId }); }}>{sendNow.isPending || validateDraft.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{sendNow.isPending ? "Génération du PDF et envoi…" : validateDraft.isPending ? "Validation du bilan…" : "Valider et envoyer par e-mail"}</Button><Button type="button" variant="outline" className="min-w-0 w-full whitespace-normal border-emerald-300 px-3 py-2 text-center leading-5 text-emerald-800 hover:bg-emerald-50" disabled={saveDraft.isPending} onClick={() => void openWhatsAppDraft()}><MessageCircle className="mr-2 h-4 w-4" />Ouvrir WhatsApp avec le bilan</Button></div>
        </div>
        <div className="min-w-0 flex-none space-y-4 pr-1 lg:min-h-0 lg:min-w-[560px] lg:flex-[1.2] lg:overflow-y-auto lg:overscroll-contain lg:pr-3"><div className="min-h-[420px] rounded-lg border border-slate-200 bg-slate-50 p-3 lg:min-h-[600px]"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Eye className="h-4 w-4" />Aperçu du bilan qui sera envoyé</div>{previewHtml ? <iframe title="Prévisualisation du bilan" sandbox="" srcDoc={previewHtml} className="h-[520px] min-h-[420px] w-full rounded border bg-white lg:h-[620px] lg:min-h-[50vh]" /> : <div className="flex h-[360px] items-center justify-center rounded border border-dashed bg-white p-5 text-center text-sm text-slate-500 lg:h-[560px] lg:p-8">Modifiez les éléments nécessaires puis cliquez sur <strong className="ml-1">Prévisualiser</strong> pour consulter le rendu exact avant l’envoi.</div>}</div><div className="rounded-lg border p-3"><p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><History className="h-4 w-4" />Historique des versions</p><div className="mt-3 space-y-2">{data.versions.length ? data.versions.map((version) => <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded border bg-slate-50 p-2 text-xs"><div><strong>Version {version.versionNumber}</strong> · {version.approvalStatus}<br /><span className="text-slate-500">{new Date(version.createdAt).toLocaleString("fr-FR")}</span></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => resumeVersion(version)}><FilePenLine className="mr-1 h-3.5 w-3.5" />Reprendre l’évaluation</Button>{version.pdfUrl && <Button asChild size="sm" variant="outline"><a href={version.pdfUrl} target="_blank" rel="noreferrer"><Download className="mr-1 h-3.5 w-3.5" />PDF</a></Button>}</div></div>) : <p className="text-sm text-slate-500">La première version apparaîtra dès l’enregistrement du brouillon.</p>}</div>{data.versions.length > 1 && <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="flex items-center gap-2 text-sm font-semibold text-indigo-950"><GitCompareArrows className="h-4 w-4" />Comparer deux versions</p><Button size="sm" variant="outline" disabled={!comparisonLeft || !comparisonRight || comparisonLeft.id === comparisonRight.id} onClick={exportComparisonPdf}><Download className="mr-1 h-3.5 w-3.5" />Exporter le comparatif PDF</Button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><Select value={comparisonLeftId} onValueChange={setComparisonLeftId}><SelectTrigger><SelectValue placeholder="Version précédente" /></SelectTrigger><SelectContent>{data.versions.map((version: any) => <SelectItem key={version.id} value={String(version.id)}>Version {version.versionNumber}</SelectItem>)}</SelectContent></Select><Select value={comparisonRightId} onValueChange={setComparisonRightId}><SelectTrigger><SelectValue placeholder="Version récente" /></SelectTrigger><SelectContent>{data.versions.map((version: any) => <SelectItem key={version.id} value={String(version.id)}>Version {version.versionNumber}</SelectItem>)}</SelectContent></Select></div><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead><tr className="border-b text-slate-500"><th className="p-2">Élément</th><th className="p-2">V{comparisonLeft?.versionNumber ?? "—"}</th><th className="p-2">V{comparisonRight?.versionNumber ?? "—"}</th></tr></thead><tbody>{comparisonRows.map(([label, left, right]) => { const changed = left !== right; return <tr key={label} className="border-b last:border-0"><th className="p-2 font-medium text-slate-700">{label}</th><td className={`p-2 align-top ${changed ? "bg-amber-50 text-amber-950" : "text-slate-700"}`}>{left}</td><td className={`p-2 align-top ${changed ? "bg-emerald-50 text-emerald-950" : "text-slate-700"}`}>{right}</td></tr>; })}</tbody></table></div></div>}</div></div>
      </div>}
      {emailPreviewOpen && emailPreview && <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="flex items-center gap-2 font-semibold text-blue-950"><Mail className="h-4 w-4" />Aperçu exact de l’e-mail</p><p className="text-xs text-blue-900">Le message affiche la signature du conseiller et reste modifiable avant la diffusion finale.</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={printEmailPreview}><Printer className="mr-1 h-3.5 w-3.5" />Imprimer l’aperçu</Button><Button size="sm" variant="outline" onClick={() => setEmailPreviewOpen(false)}>Fermer l’aperçu</Button></div></div><div className="grid gap-2 rounded border border-blue-100 bg-white p-3 text-sm sm:grid-cols-2"><p><strong>Destinataire :</strong> {emailPreview.recipient}</p><p><strong>Pièce jointe :</strong> <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{emailPreview.attachmentLabel}</span></p><p className="sm:col-span-2"><strong>Objet :</strong> {emailPreview.subject}</p></div><div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3"><Label htmlFor="evaluation-test-email" className="text-sm font-semibold text-amber-950">Envoyer un test interne</Label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><Input id="evaluation-test-email" type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="adresse-admin@3mtravelagency.com" /><Button variant="outline" disabled={!testEmail || sendTestEmail.isPending} onClick={() => sendTestEmail.mutate({ sessionToken, sourceRecordId, testEmail })}>{sendTestEmail.isPending ? "Envoi…" : "Envoyer le test"}</Button></div><p className="mt-2 text-xs text-amber-900">Seules les adresses d’administrateurs internes actives sont acceptées. Le client ne reçoit aucune notification.</p></div><iframe title="Aperçu exact de l’e-mail d’évaluation" sandbox="" srcDoc={emailPreview.html} className="mt-3 h-[560px] w-full rounded border bg-white" /></div>}
      {data && <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-1 gap-2 border-t-2 border-blue-200 bg-white px-3 py-3 shadow-[0_-10px_28px_rgba(15,23,42,0.18)] sm:grid-cols-2 sm:px-6 lg:px-10"><Button aria-busy={validateDraft.isPending} className="min-w-0 w-full whitespace-normal border border-amber-300 bg-amber-50 px-3 py-2 text-center font-semibold leading-5 text-amber-950 hover:bg-amber-100" variant="outline" disabled={validateDraft.isPending || saveDraft.isPending} onClick={async () => { if (await ensureDraft()) validateDraft.mutate({ sessionToken, sourceRecordId, validationComment: "Bilan relu, ajusté si nécessaire et validé avant diffusion." }); }}>{validateDraft.isPending ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Validation en cours…</> : "Valider le bilan"}</Button><Button aria-busy={sendNow.isPending || validateDraft.isPending} className="min-w-0 w-full whitespace-normal bg-blue-700 px-3 py-2 text-center font-semibold leading-5 hover:bg-blue-800" disabled={sendNow.isPending || saveDraft.isPending || validateDraft.isPending || (requiresSecondApproval && data.application.evaluationApprovalStatus !== "approved")} onClick={async () => { if (!(await ensureDraft())) return; if (!currentDraft.advisorValidated) { await validateDraft.mutateAsync({ sessionToken, sourceRecordId, validationComment: "Bilan relu et validé avant diffusion." }); } sendNow.mutate({ sessionToken, sourceRecordId }); }}>{sendNow.isPending || validateDraft.isPending ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />{sendNow.isPending ? "Génération du PDF et envoi…" : "Validation en cours…"}</> : "Valider et envoyer"}</Button></div>}
      </DialogContent>
      <PDFPreviewModal isOpen={Boolean(pdfPreview)} onClose={() => setPdfPreview(null)} pdfUrl={pdfPreview?.url ?? ""} fileName={pdfPreview?.fileName ?? "bilan.pdf"} downloadUrl={pdfPreview?.url ?? ""} />
  </Dialog>;
}
