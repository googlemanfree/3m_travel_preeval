import { useEffect, useMemo, useState } from "react";
import {
  Bell, CalendarClock, CheckCircle2, ClipboardCheck, CreditCard, FileCheck2, FileText,
  FolderKanban, History, Mail, MessageSquare, Plus, Save, Send, ShieldAlert, UserCheck,
  ArrowRight, CircleAlert, Gauge, Sparkles, TimerReset, UserRoundCheck, Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { EvaluationDeliveryEditor } from "@/components/EvaluationDeliveryEditor";
import { CommunicationHistoryPdfButton } from "@/components/CommunicationHistoryPdfButton";
import { RichTextEditor } from "@/components/RichTextEditor";
import { evisasDatabaseComplete } from "@/data/evisasDatabaseComplete";
import { buildEvisaMessageSnapshot, buildEvisaMessageTemplate, type EvisaMessageSnapshot } from "@/lib/evisaMessageTemplate";
import { mergeEvisaCatalogue } from "@/lib/evisaCatalogueMerge";

type CandidateSummary = {
  id: string;
  internalId: number;
  fullName: string;
  folderCode: string;
  email: string;
  destinationCountry: string;
  projectType: string;
  scoringTotal: number | null;
  source: string;
};

type Props = {
  sessionToken: string;
  candidate: CandidateSummary;
  onRefresh: () => void;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau", qualifying: "À qualifier", waiting_customer: "En attente du client",
  documents_review: "Documents à vérifier", payment_review: "Paiement à valider",
  processing: "En traitement", submitted: "Soumis", completed: "Terminé",
  closed: "Clôturé", rejected: "Refusé",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Faible", normal: "Normale", high: "Haute", urgent: "Urgente",
};

function procedureFromEvaluationContext(context?: { projectType?: string | null; procedureLabel?: string | null; procedureCode?: string | null } | null) {
  const value = [context?.procedureCode, context?.procedureLabel, context?.projectType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (value.includes("e-visa") || value.includes("evisa") || value.includes("électron")) return "evisa";
  if (value.includes("étude") || value.includes("study") || value.includes("academ")) return "study_permit";
  if (value.includes("travail") || value.includes("work") || value.includes("emploi")) return "work_permit";
  if (value.includes("touris") || value.includes("visiteur") || value.includes("visitor")) return "visitor_visa";
  if (value.includes("famill") || value.includes("regroupement")) return "family_reunification";
  return "permanent_residence";
}

function formatDate(value?: Date | string | null) {
  if (!value) return "Non définie";
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function StateBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
    rejected: "bg-rose-50 text-rose-800 border-rose-200",
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    received: "bg-blue-50 text-blue-800 border-blue-200",
    completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    open: "bg-amber-50 text-amber-800 border-amber-200",
    in_progress: "bg-sky-50 text-sky-800 border-sky-200",
  };
  return <Badge className={styles[status] ?? "bg-slate-50 text-slate-700 border-slate-200"}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export function Candidate360Workspace({ sessionToken, candidate, onRefresh }: Props) {
  const utils = trpc.useUtils();
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState("new");
  const [priority, setPriority] = useState("normal");
  const [advisorId, setAdvisorId] = useState("unassigned");
  const [dueAt, setDueAt] = useState("");
  const [labels, setLabels] = useState("");
  const [comment, setComment] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [checklistCountry, setChecklistCountry] = useState(candidate.destinationCountry || "Canada");
  const [checklistProcedure, setChecklistProcedure] = useState("permanent_residence");
  const [customChecklistDocuments, setCustomChecklistDocuments] = useState("");
  const [outboundMessage, setOutboundMessage] = useState("");
  const [quickMessageOpen, setQuickMessageOpen] = useState(false);
  const [quickMessageText, setQuickMessageText] = useState("");
  const [quickMessageEvisaId, setQuickMessageEvisaId] = useState("");
  const [quickMessageEvisaSnapshots, setQuickMessageEvisaSnapshots] = useState<EvisaMessageSnapshot[]>([]);
  const [quickAttachment, setQuickAttachment] = useState<{ name: string; url: string; size?: number; type?: string } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const { data: managedEvisaOverrides } = trpc.evisaCatalogue.getPublicOverrides.useQuery();
  const availableEvisas = mergeEvisaCatalogue(evisasDatabaseComplete, managedEvisaOverrides);

  const { data, isLoading, error } = trpc.admin.getCandidate360.useQuery(
    { sessionToken, candidateId: candidate.id },
    { enabled: Boolean(sessionToken && candidate.id) },
  );

  const dossierProgress = useMemo(() => {
    if (!data) return { value: 0, currentLabel: "Chargement du dossier", documentsLabel: "" };
    const stageValues: Record<string, number> = { new: 8, qualifying: 18, waiting_customer: 30, documents_review: 45, payment_review: 55, processing: 68, submitted: 82, completed: 100, closed: 100, rejected: 35 };
    const totalRequirements = data.requirements.length;
    const completedRequirements = data.requirements.filter((item: any) => ["received", "approved", "completed"].includes(item.status)).length;
    const documentsPercent = totalRequirements ? Math.round((completedRequirements / totalRequirements) * 100) : 0;
    const stageValue = stageValues[data.operationalCase.currentStatus] ?? 8;
    const value = totalRequirements ? Math.max(stageValue, Math.min(95, Math.round((stageValue * 0.7) + (documentsPercent * 0.3)))) : stageValue;
    return { value, currentLabel: STATUS_LABELS[data.operationalCase.currentStatus] ?? data.operationalCase.currentStatus, documentsLabel: totalRequirements ? `${completedRequirements}/${totalRequirements} pièce(s) validée(s)` : "Checklist à créer" };
  }, [data]);

  useEffect(() => {
    if (!data?.operationalCase) return;
    setWorkflowStatus(data.operationalCase.currentStatus);
    setPriority(data.operationalCase.priority);
    setAdvisorId(data.operationalCase.assignedAdminId ? String(data.operationalCase.assignedAdminId) : "unassigned");
    setLabels((data.operationalCase.labels ?? []).join(", "));
    setDueAt(data.operationalCase.dueAt ? new Date(data.operationalCase.dueAt).toISOString().slice(0, 16) : "");
  }, [data]);

  useEffect(() => {
    const context = data?.evaluationContext;
    if (!context) return;
    if (context.destinationCountry?.trim()) setChecklistCountry(context.destinationCountry.trim());
    setChecklistProcedure(procedureFromEvaluationContext(context));
  }, [data?.evaluationContext]);

  const refresh = async () => {
    await utils.admin.getCandidate360.invalidate({ sessionToken, candidateId: candidate.id });
    onRefresh();
  };

  const updateMutation = trpc.admin.updateCandidate360Workflow.useMutation({
    onSuccess: async (result) => {
      toast.success("Dossier mis à jour", { description: `L’étape « ${result.clientStatusLabel ?? "mise à jour"} » est maintenant visible dans l’espace client.` });
      setComment("");
      await refresh();
    },
    onError: (mutationError) => toast.error("Mise à jour impossible", { description: mutationError.message }),
  });
  const updateDeadlineMutation = trpc.admin.updateCandidate360Deadline.useMutation({
    onSuccess: async () => {
      toast.success("Échéance enregistrée", { description: "La date métier est persistée et ajoutée à la timeline du dossier." });
      await refresh();
    },
    onError: (mutationError) => toast.error("Échéance impossible à enregistrer", { description: mutationError.message }),
  });
  const createTaskMutation = trpc.admin.addCandidate360Task.useMutation({
    onSuccess: async () => {
      toast.success("Action ajoutée", { description: "La tâche est visible dans le dossier et la vue quotidienne." });
      setTaskTitle("");
      setTaskDueAt("");
      await refresh();
    },
    onError: (mutationError) => toast.error("Création impossible", { description: mutationError.message }),
  });
  const completeTaskMutation = trpc.admin.completeCandidate360Task.useMutation({
    onSuccess: () => void refresh(),
    onError: (mutationError) => toast.error("Action impossible", { description: mutationError.message }),
  });
  const countryChecklistMutation = trpc.admin.createCountryDocumentChecklist.useMutation({
    onSuccess: async (result) => {
      toast.success("Checklist créée", { description: `${result.added} pièce(s) ajoutée(s) · ${result.procedure} · ${result.country}.` });
      await refresh();
    },
    onError: (mutationError) => toast.error("Checklist impossible", { description: mutationError.message }),
  });
  const documentReminderMutation = trpc.admin.sendCandidate360DocumentReminder.useMutation({
    onSuccess: async (result) => { toast.success("Relance envoyée", { description: `Le candidat a été relancé pour ${result.count} pièce(s).` }); await refresh(); },
    onError: (mutationError) => toast.error("Relance impossible", { description: mutationError.message }),
  });
  const sendMessageMutation = trpc.admin.sendCandidate360Message.useMutation({
    onSuccess: async (result) => {
      toast.success("Message enregistré", { description: result.emailSent ? "Le candidat a été notifié dans son espace et par e-mail." : "Le message est visible dans l’espace candidat. L’e-mail n’a pas pu être envoyé." });
      setOutboundMessage("");
      await refresh();
    },
    onError: (mutationError) => toast.error("Envoi impossible", { description: mutationError.message }),
  });

  const pendingRequirements = useMemo(() => (data?.requirements ?? []).filter((item: any) => item.status !== "approved" && item.status !== "waived"), [data]);

  if (isLoading) return <div className="py-12 text-center text-sm text-slate-500">Chargement du centre de gestion…</div>;
  if (error || !data) return <div className="py-10 text-center text-sm text-rose-700">La fiche 360° n’a pas pu être chargée. Réessayez depuis la liste des candidats.</div>;

  const operationalCase: any = data.operationalCase ?? {
    currentStatus: "qualifying",
    priority: "normal",
    assignedAdminId: null,
    dueAt: null,
    labels: [],
  };
  const nextAction = data.nextAction ?? {
    label: "Définir la prochaine action",
    description: "Aucune action n’est encore planifiée pour ce dossier. Ajoutez une étape de traitement ou une échéance.",
  };
  const labelsList = labels.split(",").map((value) => value.trim()).filter(Boolean);
  const isOnlineApplication = candidate.id.startsWith("online_");

  const saveOperationalState = () => updateMutation.mutate({
    sessionToken,
    candidateId: candidate.id,
    workflowStatus: workflowStatus as any,
    priority: priority as any,
    assignedAdminId: advisorId === "unassigned" ? null : Number(advisorId),
    dueAt: dueAt ? new Date(dueAt) : null,
    labels: labelsList,
    comment: comment.trim() || undefined,
  });

  const setDueShortcut = (hours: number) => {
    const target = new Date(Date.now() + hours * 60 * 60 * 1000);
    setDueAt(target.toISOString().slice(0, 16));
  };

  const saveDeadline = () => updateDeadlineMutation.mutate({
    sessionToken,
    candidateId: candidate.id,
    dueAt: dueAt ? new Date(dueAt) : null,
    reason: "Échéance métier modifiée depuis la fiche 360°.",
  });

  const quickWorkflowOptions = [
    { value: "qualifying", label: "Qualifier", description: "Vérifier le projet", icon: Sparkles, tone: "border-violet-200 bg-violet-50 text-violet-800" },
    { value: "waiting_customer", label: "Relancer client", description: "Attendre les pièces", icon: Bell, tone: "border-amber-200 bg-amber-50 text-amber-800" },
    { value: "documents_review", label: "Vérifier pièces", description: "Contrôle documentaire", icon: FileCheck2, tone: "border-sky-200 bg-sky-50 text-sky-800" },
    { value: "processing", label: "Traiter", description: "Dossier en cours", icon: Gauge, tone: "border-blue-200 bg-blue-50 text-blue-800" },
    { value: "submitted", label: "Soumettre", description: "Envoyé au partenaire", icon: ArrowRight, tone: "border-indigo-200 bg-indigo-50 text-indigo-800" },
    { value: "completed", label: "Finaliser", description: "Étape terminée", icon: CheckCircle2, tone: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">Action rapide</p>
          <p className="text-sm font-medium text-slate-900">Envoyer une notification directe ou un message urgent au candidat</p>
        </div>
        <Button className="bg-blue-700 hover:bg-blue-800 text-white shadow" onClick={() => setQuickMessageOpen(true)}>
          <Mail className="mr-2 h-4 w-4" /> Message & Notification instantanée
        </Button>
      </div>

      <Dialog open={quickMessageOpen} onOpenChange={setQuickMessageOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Envoyer un message personnalisé</DialogTitle>
            <DialogDescription>
              Le message sera envoyé instantanément dans l’espace personnel du candidat (notification push) et par e-mail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Modèle rapide</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickMessageText("Bonjour, votre dossier avance bien. Veuillez vérifier vos pièces justificatives dans votre espace.")}>
                  Relance pièces
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickMessageText("Bonjour, votre bilan d'évaluation est disponible dans votre espace client. Consultez-le dès à présent.")}>
                  Disponibilité bilan
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickMessageText("Bonjour, nous avons besoin d'une précision concernant votre dossier. Merci de nous répondre ici.")}>
                  Demande précision
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
              <Label htmlFor="quick-message-evisa" className="text-cyan-950">Insérer les informations e‑Visa officielles</Label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Select value={quickMessageEvisaId} onValueChange={setQuickMessageEvisaId}>
                  <SelectTrigger id="quick-message-evisa" className="bg-white sm:flex-1"><SelectValue placeholder="Sélectionner une destination e‑Visa" /></SelectTrigger>
                  <SelectContent>
                    {evisasDatabaseComplete.map((destination) => <SelectItem key={destination.id} value={destination.id}>{destination.flag} {destination.country}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="border-cyan-300 bg-white text-cyan-950"
                  disabled={!quickMessageEvisaId}
                  onClick={() => {
                    const destination = availableEvisas.find((item) => item.id === quickMessageEvisaId);
                    if (!destination) return;
                    const template = buildEvisaMessageTemplate(destination, window.location.origin);
                    const snapshot = buildEvisaMessageSnapshot(destination, window.location.origin);
                    setQuickMessageText((current) => current.trim() ? `${current.trim()}\n\n${template}` : template);
                    setQuickMessageEvisaSnapshots((current) => [...current.filter((item) => item.destinationId !== snapshot.destinationId), snapshot]);
                    toast.success("Informations e‑Visa insérées", { description: `Le contenu officiel de ${destination.country} peut encore être personnalisé avant envoi.` });
                  }}
                >
                  Insérer dans le message
                </Button>
              </div>
              <p className="mt-2 text-xs text-cyan-900">Le message contient le portail officiel, la date de vérification, les exigences principales et le lien vers la procédure. Relisez-le avant envoi.</p>
            </div>
            <RichTextEditor
              label="Message personnalisé"
              value={quickMessageText}
              onChange={setQuickMessageText}
              placeholder="Rédigez votre message avec la mise en forme souhaitée…"
              minHeight="10rem"
              maxCharacters={8000}
              sessionToken={sessionToken}
              templateScope="candidate_message"
            />
            <div>
              <Label>Pièce jointe (facultatif)</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="file"
                  id="admin-quick-attachment-file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 15 * 1024 * 1024) {
                      toast.error("Fichier trop volumineux (max 15 Mo)");
                      return;
                    }
                    setUploadingAttachment(true);
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      const data = await res.json();
                      if (data.url) {
                        setQuickAttachment({
                          name: file.name,
                          url: data.url,
                          size: file.size,
                          type: file.type,
                        });
                        toast.success("Pièce jointe ajoutée avec succès");
                      } else {
                        throw new Error(data.error || "Échec du téléversement");
                      }
                    } catch (err: any) {
                      toast.error("Échec du téléversement du fichier", { description: err.message });
                    } finally {
                      setUploadingAttachment(false);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingAttachment}
                  onClick={() => document.getElementById("admin-quick-attachment-file")?.click()}
                >
                  {uploadingAttachment ? "Téléversement..." : "📎 Joindre un document (PDF, image)"}
                </Button>
                {quickAttachment && (
                  <div className="flex items-center gap-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    <span className="max-w-[150px] truncate font-medium">{quickAttachment.name}</span>
                    <button
                      type="button"
                      className="text-rose-600 hover:text-rose-800"
                      onClick={() => setQuickAttachment(null)}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setQuickMessageOpen(false)}>Annuler</Button>
            <Button
              className="bg-blue-700 hover:bg-blue-800 text-white"
              disabled={quickMessageText.replace(/<[^>]+>/g, "").trim().length < 3 || sendMessageMutation.isPending}
              onClick={() => {
                sendMessageMutation.mutate(
                  {
                    sessionToken,
                    candidateId: candidate.id,
                    content: quickMessageText.trim(),
                    attachmentUrl: quickAttachment?.url,
                    attachmentName: quickAttachment?.name,
                    attachmentMimeType: quickAttachment?.type,
                    attachmentSizeBytes: quickAttachment?.size,
                    evisaSnapshots: quickMessageEvisaSnapshots,
                  },
                  {
                    onSuccess: () => {
                      setQuickMessageOpen(false);
                      setQuickMessageText("");
                      setQuickAttachment(null);
                      setQuickMessageEvisaSnapshots([]);
                    },
                  }
                );
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              {sendMessageMutation.isPending ? "Envoi en cours..." : "Envoyer maintenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 sm:col-span-2">
          <div className="flex items-start gap-3">
            <FolderKanban className="mt-0.5 h-5 w-5 text-blue-700" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Prochaine action</p>
              <p className="mt-1 font-semibold text-slate-900">{nextAction.label}</p>
              <p className="mt-1 text-sm text-slate-600">{nextAction.description}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Échéance</p>
          <p className="mt-2 text-sm font-medium text-slate-800">{formatDate(operationalCase.dueAt)}</p>
          <p className="mt-1 text-xs text-slate-500">{PRIORITY_LABELS[operationalCase.priority] ?? operationalCase.priority}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Documents à traiter", data.metrics.pendingDocuments, FileCheck2],
          ["Actions ouvertes", data.metrics.openTasks, ClipboardCheck],
          ["Messages", data.metrics.totalMessages, MessageSquare],
          ["Notifications non lues", data.metrics.unreadNotifications, Bell],
        ].map(([label, value, Icon]: any) => (
          <div key={label} className="rounded-lg border bg-white p-3">
            <Icon className="h-4 w-4 text-blue-700" />
            <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-slate-100 p-1 sm:grid-cols-6">
          <TabsTrigger value="overview" className="text-xs">Vue d’ensemble</TabsTrigger>
          <TabsTrigger value="evaluation" className="text-xs">Évaluation</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">Paiements</TabsTrigger>
          <TabsTrigger value="messages" className="text-xs">Échanges</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <section className="grid gap-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)] lg:p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2"><Badge className="border-blue-200 bg-white text-blue-800">Contexte de la demande</Badge>{data.evaluationContext?.projectType && <Badge variant="secondary">{data.evaluationContext.projectType}</Badge>}</div>
              <h4 className="mt-3 text-lg font-bold text-slate-950">{data.evaluationContext?.destinationCountry || candidate.destinationCountry || "Destination à préciser"} <span className="font-normal text-slate-400">·</span> {data.evaluationContext?.procedureLabel || candidate.projectType || "Procédure à qualifier"}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">Le conseiller retrouve le pays et la procédure sélectionnés lors de l’évaluation afin d’adapter immédiatement la checklist, les liens officiels et les relances.</p>
              {data.evaluationContext?.submittedAt && <p className="mt-2 text-xs text-slate-500">Évaluation transmise le {formatDate(data.evaluationContext.submittedAt)}</p>}
            </div>
            <div className="rounded-xl border border-white/80 bg-white/85 p-4 shadow-sm">
              <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Avancement du dossier</p><p className="mt-1 text-sm font-semibold text-slate-900">{dossierProgress.currentLabel}</p></div><strong className="text-2xl text-blue-700">{dossierProgress.value}%</strong></div>
              <Progress className="mt-3 h-3 bg-blue-100" value={dossierProgress.value} aria-label={`Avancement du dossier : ${dossierProgress.value}%`} />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{dossierProgress.documentsLabel}</span><span>{data.metrics.openTasks} action(s) ouverte(s)</span></div>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex items-start gap-3"><div className="rounded-xl bg-blue-700 p-2.5 text-white"><Gauge className="h-5 w-5" /></div><div><div className="flex flex-wrap items-center gap-2"><h4 className="text-lg font-bold text-slate-950">Pilotage du dossier</h4><StateBadge status={workflowStatus} /><Badge className={priority === "urgent" ? "border-rose-200 bg-rose-50 text-rose-800" : priority === "high" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-700"}>{PRIORITY_LABELS[priority]}</Badge></div><p className="mt-1 max-w-2xl text-sm text-slate-600">Modifiez les paramètres, préparez les relances et enregistrez une seule mise à jour synchronisée pour l’espace candidat.</p></div></div>
              <div className="grid grid-cols-2 gap-2 sm:flex"><Button type="button" variant="outline" onClick={() => setQuickMessageOpen(true)} className="gap-2"><Mail className="h-4 w-4" />Message</Button><Button type="button" variant="outline" disabled={!pendingRequirements.length || documentReminderMutation.isPending} onClick={() => documentReminderMutation.mutate({ sessionToken, candidateId: candidate.id })} className="gap-2"><Bell className="h-4 w-4" />Relancer pièces</Button></div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {quickWorkflowOptions.map((option) => { const Icon = option.icon; const active = workflowStatus === option.value; return <button type="button" key={option.value} onClick={() => setWorkflowStatus(option.value)} className={`min-h-[86px] rounded-xl border p-3 text-left transition-colors ${active ? "border-blue-600 bg-blue-700 text-white shadow-sm" : option.tone}`}><Icon className="h-4 w-4" /><p className="mt-2 text-sm font-semibold">{option.label}</p><p className={`mt-0.5 text-xs ${active ? "text-blue-100" : "opacity-75"}`}>{option.description}</p></button>; })}
            </div>
            <p className="mt-2 text-xs text-slate-500">Les raccourcis préparent l’étape. Cliquez sur « Enregistrer le pilotage » pour appliquer et notifier le candidat.</p>

                            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">

              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div><Label>Étape de traitement</Label><Select value={workflowStatus} onValueChange={setWorkflowStatus}><SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Priorité</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Conseiller responsable</Label><Select value={advisorId} onValueChange={setAdvisorId}><SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">À attribuer</SelectItem>{data.advisors.map((advisor: any) => <SelectItem key={advisor.id} value={String(advisor.id)}>{advisor.fullName} · {advisor.adminType}</SelectItem>)}</SelectContent></Select></div>
                </div>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div><div className="flex items-center gap-2"><Label htmlFor="business-deadline">Échéance métier</Label><Tooltip><TooltipTrigger asChild><button type="button" aria-label="À propos de l’échéance métier" className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">?</button></TooltipTrigger><TooltipContent side="top">Cette date est enregistrée sur le dossier opérationnel. L’alerte passe à « bientôt » dans les 24 dernières heures et à « dépassée » après l’heure fixée.</TooltipContent></Tooltip></div><Input id="business-deadline" className="mt-1 h-11" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} aria-describedby="business-deadline-help" /><p id="business-deadline-help" className="mt-1 text-xs text-slate-500">La date est persistée en UTC puis affichée dans votre fuseau local.</p></div>
                  <div className="flex flex-wrap items-end gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setDueShortcut(24)}>24 h</Button><Button type="button" size="sm" variant="outline" onClick={() => setDueShortcut(72)}>3 j</Button><Button type="button" size="sm" variant="outline" onClick={() => setDueShortcut(168)}>7 j</Button><Button type="button" size="sm" onClick={saveDeadline} disabled={updateDeadlineMutation.isPending} className="bg-blue-700 hover:bg-blue-800">{updateDeadlineMutation.isPending ? "Enregistrement…" : "Enregistrer l’échéance"}</Button></div>
                </div>
                <div><Label>Étiquettes personnalisées</Label><Input className="mt-1 h-11" value={labels} onChange={(event) => setLabels(event.target.value)} placeholder="Ex. prioritaire, Canada, appel requis" /><p className="mt-1 text-xs text-slate-500">Séparez les étiquettes par des virgules pour filtrer et retrouver le dossier plus vite.</p></div>
                <div><Label>Commentaire interne et décision</Label><Textarea className="mt-1 min-h-30" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Précisez l’action effectuée, le blocage rencontré, la décision prise et ce qui est attendu du candidat…" /></div>
                <Button onClick={saveOperationalState} disabled={updateMutation.isPending} className="h-12 w-full bg-blue-700 text-base hover:bg-blue-800"><Save className="mr-2 h-4 w-4" />{updateMutation.isPending ? "Synchronisation en cours…" : "Enregistrer le pilotage et synchroniser"}</Button>
              </div>

              <aside className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-600" /><h5 className="font-semibold text-slate-900">Bureau d’action immédiate</h5></div>
                <div className="rounded-xl border border-blue-100 bg-white p-3"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Prochaine action</p><p className="mt-1 font-semibold text-slate-900">{nextAction.label}</p><p className="mt-1 text-sm text-slate-600">{nextAction.description}</p></div>
                <div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-white p-3"><TimerReset className="h-4 w-4 text-slate-600" /><p className="mt-2 text-xs text-slate-500">Échéance</p><p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(operationalCase.dueAt)}</p></div><div className="rounded-lg bg-white p-3"><UserRoundCheck className="h-4 w-4 text-slate-600" /><p className="mt-2 text-xs text-slate-500">Conseiller</p><p className="mt-1 text-sm font-semibold text-slate-900">{advisorId === "unassigned" ? "À attribuer" : data.advisors.find((advisor: any) => String(advisor.id) === advisorId)?.fullName || "Attribué"}</p></div></div>
                {pendingRequirements.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="flex gap-2"><CircleAlert className="mt-0.5 h-4 w-4 text-amber-700" /><div><p className="font-semibold text-amber-950">{pendingRequirements.length} pièce(s) à suivre</p><p className="mt-1 text-xs text-amber-800">Le candidat peut être relancé depuis ce bureau.</p></div></div></div>}
                <div className="border-t border-slate-200 pt-3"><div className="flex items-center justify-between"><h5 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ClipboardCheck className="h-4 w-4 text-blue-700" />Actions ouvertes</h5><Badge className="border-slate-200 bg-white text-slate-700">{data.metrics.openTasks}</Badge></div><div className="mt-2 space-y-2">{data.tasks.filter((task: any) => task.taskStatus !== "completed" && task.taskStatus !== "cancelled").slice(0, 3).map((task: any) => <div key={task.id} className="rounded-lg border border-slate-200 bg-white p-2.5"><p className="text-sm font-medium text-slate-800">{task.title}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs text-slate-500">{formatDate(task.dueAt)}</span><Button size="sm" variant="outline" onClick={() => completeTaskMutation.mutate({ sessionToken, taskId: task.id })}>Terminer</Button></div></div>) || <p className="rounded-lg bg-white p-3 text-sm text-slate-500">Aucune action ouverte.</p>}</div></div>
                <div className="border-t border-slate-200 pt-3"><Label>Créer une action de suivi</Label><Input className="mt-1 bg-white" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Ex. Appeler le candidat" /><Input className="mt-2 bg-white" type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} /><Button className="mt-2 w-full" size="sm" variant="outline" disabled={!taskTitle.trim() || createTaskMutation.isPending} onClick={() => createTaskMutation.mutate({ sessionToken, candidateId: candidate.id, title: taskTitle.trim(), description: undefined, assignedAdminId: advisorId === "unassigned" ? null : Number(advisorId), dueAt: taskDueAt ? new Date(taskDueAt) : null })}><Plus className="mr-1 h-4 w-4" />Ajouter l’action</Button></div>
              </aside>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-3 pt-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold text-slate-900">Bilan d’évaluation</h4><p className="mt-1 text-sm text-slate-600">Score IFP 3M : <strong>{candidate.scoringTotal ?? "À calculer"}{candidate.scoringTotal !== null ? "/100" : ""}</strong>. Les versions et approbations restent traçables.</p></div>{isOnlineApplication && <Button className="bg-blue-700 hover:bg-blue-800" onClick={() => setEvaluationOpen(true)}><FileText className="mr-2 h-4 w-4" />Ouvrir le bilan</Button>}</div></div>
          {data.evaluationVersions.length ? <div className="space-y-2">{data.evaluationVersions.map((version: any) => <div key={version.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Version {version.versionNumber}</p><p className="text-xs text-slate-500">Créée le {formatDate(version.createdAt)}</p></div><StateBadge status={version.approvalStatus} /></div>)}</div> : <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">Aucun bilan versionné. Préparez l’évaluation lorsque les informations sont complètes.</p>}
        </TabsContent>

        <TabsContent value="documents" className="space-y-3 pt-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"><div className="flex flex-col gap-3"><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-slate-900">Créer une checklist pays et procédure</h4>{data.evaluationContext && <Badge className="border-blue-200 bg-white text-blue-800">Préremplie depuis l’évaluation</Badge>}</div><p className="mt-1 text-sm text-slate-600">Les pièces déjà présentes sont conservées. La destination et la procédure sont reprises automatiquement depuis l’évaluation, puis restent modifiables pour le contrôle humain.</p></div>{data.evaluationContext && <div className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-600"><strong className="text-blue-800">Contexte récupéré :</strong> {data.evaluationContext.destinationCountry || "Destination à préciser"} · {data.evaluationContext.procedureLabel || data.evaluationContext.projectType || "Procédure à qualifier"}</div>}<div className="grid gap-2 sm:grid-cols-2"><Select value={checklistCountry} onValueChange={setChecklistCountry}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="Luxembourg">Luxembourg</SelectItem><SelectItem value="Autre destination">Autre destination</SelectItem></SelectContent></Select><Select value={checklistProcedure} onValueChange={setChecklistProcedure}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="permanent_residence">Résidence permanente</SelectItem><SelectItem value="work_permit">Visa / permis de travail</SelectItem><SelectItem value="study_permit">Études</SelectItem><SelectItem value="visitor_visa">Visite / tourisme</SelectItem><SelectItem value="family_reunification">Regroupement familial</SelectItem><SelectItem value="evisa">e‑Visa / autorisation électronique</SelectItem></SelectContent></Select></div><Textarea value={customChecklistDocuments} onChange={(event) => setCustomChecklistDocuments(event.target.value)} placeholder="Pièces supplémentaires propres à ce dossier, une par ligne (facultatif)" /><Button className="w-full sm:w-auto sm:self-end" disabled={countryChecklistMutation.isPending} onClick={() => countryChecklistMutation.mutate({ sessionToken, candidateId: candidate.id, destination: checklistCountry, procedureType: checklistProcedure as any, customDocuments: customChecklistDocuments.split("\n").map((item) => item.trim()).filter(Boolean) })}><Plus className="mr-1 h-4 w-4" />{countryChecklistMutation.isPending ? "Création…" : "Créer la checklist"}</Button></div></div>
          {pendingRequirements.length > 0 && <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="font-semibold text-amber-950">{pendingRequirements.length} pièce(s) à compléter</h4><p className="mt-1 text-sm text-amber-800">Envoyez une relance claire au candidat avec les documents attendus.</p></div><Button variant="outline" className="border-amber-300 bg-white text-amber-900" disabled={documentReminderMutation.isPending} onClick={() => documentReminderMutation.mutate({ sessionToken, candidateId: candidate.id })}><Send className="mr-2 h-4 w-4" />{documentReminderMutation.isPending ? "Envoi…" : "Relancer le candidat"}</Button></div>}
          <div className="rounded-xl border p-4"><h4 className="font-semibold text-slate-900">Pièces requises et vérification</h4><div className="mt-3 space-y-2">{data.requirements.length ? data.requirements.map((requirement: any) => <div key={requirement.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"><div><p className="text-sm font-medium">{requirement.documentType}</p><p className="text-xs text-slate-500">{requirement.adminComment || "Aucun commentaire"}</p></div><StateBadge status={requirement.status} /></div>) : <p className="text-sm text-slate-500">La checklist documentaire sera créée selon la procédure choisie.</p>}</div></div>
          <div className="rounded-xl border p-4"><h4 className="font-semibold text-slate-900">Documents centralisés</h4><div className="mt-3 space-y-2">{data.documents.length ? data.documents.map((document: any) => <div key={document.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><div><p className="text-sm font-medium">{document.documentType} · {document.fileName}</p><p className="text-xs text-slate-500">Déposé le {formatDate(document.uploadedAt)} · {document.uploadedByRole}</p></div><StateBadge status={document.reviewStatus} /></div>) : <p className="text-sm text-slate-500">Aucun document opérationnel n’est encore centralisé dans ce dossier.</p>}</div></div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-3 pt-4">
          {data.payments.length ? data.payments.map((payment: any, index: number) => <div key={index} className="rounded-xl border p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-700" /><div><p className="font-semibold text-slate-900">Frais de dossier</p><p className="text-sm text-slate-500">{payment.amount?.toLocaleString("fr-FR")} {payment.currency} · {payment.method || "Méthode à préciser"}</p></div></div><StateBadge status={String(payment.status).toLowerCase()} /></div><p className="mt-3 text-sm text-slate-600">Référence : {payment.reference || "Non renseignée"} · Date : {formatDate(payment.paidAt)}</p></div>) : <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">Aucun paiement relié à ce dossier agence.</p>}
        </TabsContent>

        <TabsContent value="messages" className="grid gap-3 pt-4 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:col-span-2">
            <h4 className="flex items-center gap-2 font-semibold text-slate-900"><Send className="h-4 w-4 text-blue-700" />Envoyer une communication au candidat</h4>
            <p className="mt-1 text-sm text-slate-600">Le message est journalisé, visible dans l’espace client et envoyé par e-mail lorsqu’il est disponible.</p>
            <Textarea className="mt-3 bg-white" value={outboundMessage} onChange={(event) => setOutboundMessage(event.target.value)} placeholder="Rédigez une instruction, une décision ou une demande de précision…" maxLength={2000} />
            <div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{outboundMessage.length}/2000 caractères</span><Button size="sm" disabled={outboundMessage.trim().length < 3 || sendMessageMutation.isPending} onClick={() => sendMessageMutation.mutate({ sessionToken, candidateId: candidate.id, content: outboundMessage.trim() })}><Send className="mr-2 h-4 w-4" />{sendMessageMutation.isPending ? "Envoi…" : "Envoyer au candidat"}</Button></div>
          </div>
          <div className="rounded-xl border p-4"><h4 className="flex items-center gap-2 font-semibold"><Bell className="h-4 w-4 text-blue-700" />Notifications client</h4><div className="mt-3 space-y-2">{data.communications.notifications.length ? data.communications.notifications.map((notification: any) => <div key={notification.id} className="rounded-lg bg-slate-50 p-3"><p className="text-sm font-medium">{notification.title}</p><p className="mt-1 text-xs text-slate-600">{notification.body}</p><p className="mt-1 text-xs text-slate-400">{formatDate(notification.createdAt)}</p></div>) : <p className="text-sm text-slate-500">Aucune notification enregistrée.</p>}</div></div>
          <div className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="flex items-center gap-2 font-semibold"><MessageSquare className="h-4 w-4 text-blue-700" />Échanges</h4><CommunicationHistoryPdfButton sessionToken={sessionToken} candidateId={candidate.id} candidateName={candidate.fullName} folderCode={candidate.folderCode} messages={data.communications.messages} notifications={data.communications.notifications} /></div><div className="mt-3 space-y-2">{data.communications.messages.length ? data.communications.messages.map((message: any) => { const snapshot = message.evisaSnapshotJson ? (() => { try { return JSON.parse(message.evisaSnapshotJson); } catch { return null; } })() : null; return <div key={message.id} className="rounded-lg bg-slate-50 p-3"><p className="text-sm font-medium">{message.senderRole === "candidate" ? "Candidat" : "Administration"}</p><p className="mt-1 text-xs text-slate-600 line-clamp-3">{message.content}</p>{snapshot?.items?.length ? <div className="mt-2 rounded border border-cyan-200 bg-cyan-50 p-2 text-xs text-cyan-950"><p className="font-semibold">Instantané e‑Visa partagé</p>{snapshot.items.map((item: any) => <p key={item.destinationId}>{item.country} · vérifié le {item.officialVerifiedAt} · <a className="underline" href={item.officialPortalUrl} target="_blank" rel="noreferrer">portail officiel</a></p>)}</div> : null}<p className="mt-1 text-xs text-slate-400">{formatDate(message.createdAt)}</p></div>; }) : <p className="text-sm text-slate-500">Aucun message dans ce fil.</p>}</div></div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 pt-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="flex items-center gap-2 font-semibold text-slate-950"><History className="h-4 w-4 text-blue-700" />Timeline complète du dossier</h4><p className="mt-1 text-sm text-slate-500">Statuts, échéances et actions sont affichés dans l’ordre de réception depuis les journaux serveur.</p></div><Badge variant="outline">{(data.timeline ?? []).length} événement(s)</Badge></div>
            <div className="mt-5">{data.timeline?.length ? <ol aria-label="Historique détaillé du dossier" className="space-y-0">{data.timeline.map((entry: any, index: number) => <li key={entry.id} className="grid grid-cols-[82px_24px_minmax(0,1fr)] gap-3"><time dateTime={new Date(entry.createdAt).toISOString()} className="pt-1 text-right text-xs text-slate-500">{new Date(entry.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</time><div className="relative flex justify-center"><span className={`z-10 mt-1 h-3 w-3 rounded-full border-2 border-white shadow ${entry.kind === "status" ? "bg-blue-700" : entry.status === "deadline_updated" ? "bg-amber-500" : "bg-slate-500"}`} />{index < data.timeline.length - 1 && <span className="absolute top-4 h-full w-px bg-blue-100" />}</div><div className="pb-5"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold capitalize text-slate-900">{entry.label}</p><Badge variant="outline" className="text-[10px]">{entry.kind === "status" ? "Statut" : entry.status === "deadline_updated" ? "Échéance" : "Activité"}</Badge></div><p className="mt-1 text-sm leading-6 text-slate-600">{entry.comment || "Événement enregistré"}</p><p className="mt-1 text-xs text-slate-400">{entry.actor || "Système"} · {formatDate(entry.createdAt)}</p></div></li>)}</ol> : <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">Aucun événement serveur n’est encore enregistré pour ce dossier.</p>}</div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border p-4"><h4 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-blue-700" />Décisions et notes internes</h4><div className="mt-3 space-y-2">{data.notes.length ? data.notes.slice(0, 12).map((note: any) => <div key={note.id} className="rounded-lg bg-slate-50 p-3"><p className="text-sm text-slate-700">{note.note}</p><p className="mt-1 text-xs text-slate-400">{formatDate(note.createdAt)}</p></div>) : <p className="text-sm text-slate-500">Aucune note interne. Ajoutez une décision dans Vue d’ensemble.</p>}</div></div>
            <div className="rounded-xl border p-4"><h4 className="flex items-center gap-2 font-semibold"><FolderKanban className="h-4 w-4 text-blue-700" />Détails statut serveur</h4><p className="mt-2 text-sm text-slate-600">{data.statusHistory.length} changement(s) de statut conservé(s), relu(s) depuis le dossier opérationnel.</p><p className="mt-1 text-xs text-slate-500">Les transitions restent séparées des notes privées et des tâches.</p></div>
          </div>
        </TabsContent>
      </Tabs>

      {isOnlineApplication && <EvaluationDeliveryEditor sessionToken={sessionToken} sourceRecordId={candidate.internalId} open={evaluationOpen} onOpenChange={setEvaluationOpen} onCompleted={() => void refresh()} />}
    </div>
  );
}
