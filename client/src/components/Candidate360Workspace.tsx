import { useEffect, useMemo, useState } from "react";
import {
  Bell, CalendarClock, CheckCircle2, ClipboardCheck, CreditCard, FileCheck2, FileText,
  FolderKanban, History, Mail, MessageSquare, Plus, Save, Send, ShieldAlert, UserCheck,
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
import { toast } from "sonner";
import { EvaluationDeliveryEditor } from "@/components/EvaluationDeliveryEditor";

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
  const [quickAttachment, setQuickAttachment] = useState<{ name: string; url: string; size?: number; type?: string } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const { data, isLoading, error } = trpc.admin.getCandidate360.useQuery(
    { sessionToken, candidateId: candidate.id },
    { enabled: Boolean(sessionToken && candidate.id) },
  );

  useEffect(() => {
    if (!data?.operationalCase) return;
    setWorkflowStatus(data.operationalCase.currentStatus);
    setPriority(data.operationalCase.priority);
    setAdvisorId(data.operationalCase.assignedAdminId ? String(data.operationalCase.assignedAdminId) : "unassigned");
    setLabels((data.operationalCase.labels ?? []).join(", "));
    setDueAt(data.operationalCase.dueAt ? new Date(data.operationalCase.dueAt).toISOString().slice(0, 16) : "");
  }, [data]);

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
        <DialogContent className="sm:max-w-md">
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
            <div>
              <Label>Message personnalisé</Label>
              <Textarea
                className="mt-1 h-28"
                value={quickMessageText}
                onChange={(e) => setQuickMessageText(e.target.value)}
                placeholder="Rédigez votre message ici..."
                maxLength={2000}
              />
              <p className="mt-1 text-xs text-slate-500">{quickMessageText.length}/2000 caractères</p>
            </div>
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
              disabled={quickMessageText.trim().length < 3 || sendMessageMutation.isPending}
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
                  },
                  {
                    onSuccess: () => {
                      setQuickMessageOpen(false);
                      setQuickMessageText("");
                      setQuickAttachment(null);
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <h4 className="flex items-center gap-2 font-semibold text-slate-900"><UserCheck className="h-4 w-4 text-blue-700" />Pilotage du dossier</h4>
              <div className="mt-3 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Étape de traitement</Label><Select value={workflowStatus} onValueChange={setWorkflowStatus}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Priorité</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Conseiller responsable</Label><Select value={advisorId} onValueChange={setAdvisorId}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">À attribuer</SelectItem>{data.advisors.map((advisor: any) => <SelectItem key={advisor.id} value={String(advisor.id)}>{advisor.fullName} · {advisor.adminType}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Échéance / relance</Label><Input className="mt-1" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></div>
                </div>
                <div><Label>Étiquettes personnalisées</Label><Input className="mt-1" value={labels} onChange={(event) => setLabels(event.target.value)} placeholder="Ex. prioritaire, Canada, appel requis" /><p className="mt-1 text-xs text-slate-500">Séparez les étiquettes par des virgules.</p></div>
                <div><Label>Commentaire interne</Label><Textarea className="mt-1" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Précisez l’action, le blocage ou la décision prise…" /></div>
                <Button onClick={saveOperationalState} disabled={updateMutation.isPending} className="bg-blue-700 hover:bg-blue-800"><Save className="mr-2 h-4 w-4" />{updateMutation.isPending ? "Synchronisation…" : "Enregistrer le pilotage"}</Button>
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <h4 className="flex items-center gap-2 font-semibold text-slate-900"><ClipboardCheck className="h-4 w-4 text-blue-700" />Actions à réaliser</h4>
              <div className="mt-3 space-y-2">
                {data.tasks.filter((task: any) => task.taskStatus !== "completed" && task.taskStatus !== "cancelled").length ? data.tasks.filter((task: any) => task.taskStatus !== "completed" && task.taskStatus !== "cancelled").map((task: any) => <div key={task.id} className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 p-3"><div><p className="text-sm font-medium text-slate-800">{task.title}</p><p className="text-xs text-slate-500">Échéance : {formatDate(task.dueAt)}</p></div><Button size="sm" variant="outline" onClick={() => completeTaskMutation.mutate({ sessionToken, taskId: task.id })}>Terminer</Button></div>) : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Aucune action ouverte.</p>}
                <div className="border-t pt-3"><Label>Nouvelle action</Label><Input className="mt-1" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Ex. Appeler le candidat pour compléter le passeport" /><Input className="mt-2" type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} /><Button className="mt-2" size="sm" variant="outline" disabled={!taskTitle.trim() || createTaskMutation.isPending} onClick={() => createTaskMutation.mutate({ sessionToken, candidateId: candidate.id, title: taskTitle.trim(), description: undefined, assignedAdminId: advisorId === "unassigned" ? null : Number(advisorId), dueAt: taskDueAt ? new Date(taskDueAt) : null })}><Plus className="mr-1 h-4 w-4" />Ajouter</Button></div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-3 pt-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold text-slate-900">Bilan d’évaluation</h4><p className="mt-1 text-sm text-slate-600">Score IFP 3M : <strong>{candidate.scoringTotal ?? "À calculer"}{candidate.scoringTotal !== null ? "/100" : ""}</strong>. Les versions et approbations restent traçables.</p></div>{isOnlineApplication && <Button className="bg-blue-700 hover:bg-blue-800" onClick={() => setEvaluationOpen(true)}><FileText className="mr-2 h-4 w-4" />Ouvrir le bilan</Button>}</div></div>
          {data.evaluationVersions.length ? <div className="space-y-2">{data.evaluationVersions.map((version: any) => <div key={version.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Version {version.versionNumber}</p><p className="text-xs text-slate-500">Créée le {formatDate(version.createdAt)}</p></div><StateBadge status={version.approvalStatus} /></div>)}</div> : <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">Aucun bilan versionné. Préparez l’évaluation lorsque les informations sont complètes.</p>}
        </TabsContent>

        <TabsContent value="documents" className="space-y-3 pt-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"><div className="flex flex-col gap-3"><div><h4 className="font-semibold text-slate-900">Créer une checklist pays et procédure</h4><p className="mt-1 text-sm text-slate-600">Les pièces déjà présentes sont conservées. Sélectionnez la procédure et ajoutez, si nécessaire, des exigences propres au dossier.</p></div><div className="grid gap-2 sm:grid-cols-2"><Select value={checklistCountry} onValueChange={setChecklistCountry}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="Luxembourg">Luxembourg</SelectItem><SelectItem value="Autre destination">Autre destination</SelectItem></SelectContent></Select><Select value={checklistProcedure} onValueChange={setChecklistProcedure}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="permanent_residence">Résidence permanente</SelectItem><SelectItem value="work_permit">Visa / permis de travail</SelectItem><SelectItem value="study_permit">Études</SelectItem><SelectItem value="visitor_visa">Visite / tourisme</SelectItem><SelectItem value="family_reunification">Regroupement familial</SelectItem><SelectItem value="evisa">e‑Visa / autorisation électronique</SelectItem></SelectContent></Select></div><Textarea value={customChecklistDocuments} onChange={(event) => setCustomChecklistDocuments(event.target.value)} placeholder="Pièces supplémentaires propres à ce dossier, une par ligne (facultatif)" /><Button className="w-full sm:w-auto sm:self-end" disabled={countryChecklistMutation.isPending} onClick={() => countryChecklistMutation.mutate({ sessionToken, candidateId: candidate.id, destination: checklistCountry, procedureType: checklistProcedure as any, customDocuments: customChecklistDocuments.split("\n").map((item) => item.trim()).filter(Boolean) })}><Plus className="mr-1 h-4 w-4" />{countryChecklistMutation.isPending ? "Création…" : "Créer la checklist"}</Button></div></div>
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
          <div className="rounded-xl border p-4"><h4 className="flex items-center gap-2 font-semibold"><MessageSquare className="h-4 w-4 text-blue-700" />Échanges</h4><div className="mt-3 space-y-2">{data.communications.messages.length ? data.communications.messages.map((message: any) => <div key={message.id} className="rounded-lg bg-slate-50 p-3"><p className="text-sm font-medium">{message.senderRole === "candidate" ? "Candidat" : "Administration"}</p><p className="mt-1 text-xs text-slate-600 line-clamp-3">{message.content}</p><p className="mt-1 text-xs text-slate-400">{formatDate(message.createdAt)}</p></div>) : <p className="text-sm text-slate-500">Aucun message dans ce fil.</p>}</div></div>
        </TabsContent>

        <TabsContent value="history" className="space-y-3 pt-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border p-4"><h4 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-blue-700" />Décisions et notes internes</h4><div className="mt-3 space-y-2">{data.notes.length ? data.notes.slice(0, 12).map((note: any) => <div key={note.id} className="rounded-lg bg-slate-50 p-3"><p className="text-sm text-slate-700">{note.note}</p><p className="mt-1 text-xs text-slate-400">{formatDate(note.createdAt)}</p></div>) : <p className="text-sm text-slate-500">Aucune note interne. Ajoutez une décision dans Vue d’ensemble.</p>}</div></div>
            <div className="rounded-xl border p-4"><h4 className="flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-blue-700" />Changements de procédure</h4><div className="mt-3 space-y-2">{data.statusHistory.length ? data.statusHistory.slice(0, 12).map((entry: any) => <div key={entry.id} className="rounded-lg bg-slate-50 p-3"><p className="text-sm font-medium text-slate-700">{STATUS_LABELS[entry.oldStatus] ?? entry.oldStatus} → {STATUS_LABELS[entry.newStatus] ?? entry.newStatus}</p><p className="mt-1 text-xs text-slate-600">{entry.comment || "Statut actualisé"}</p><p className="mt-1 text-xs text-slate-400">{formatDate(entry.createdAt)}</p></div>) : <p className="text-sm text-slate-500">Les changements de statut apparaîtront ici.</p>}</div></div>
          </div>
          <div className="rounded-xl border p-4"><h4 className="flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-blue-700" />Frise chronologique du dossier</h4><p className="mt-1 text-sm text-slate-500">Chaque jalon est daté et attribué pour visualiser rapidement l’évolution globale.</p><div className="mt-5 space-y-0">{data.activity.length ? data.activity.map((activity: any, index: number) => <div key={`${activity.type}-${index}`} className="grid grid-cols-[92px_24px_minmax(0,1fr)] gap-3"><p className="pt-1 text-right text-xs text-slate-500">{new Date(activity.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</p><div className="relative flex justify-center"><span className="z-10 mt-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600 shadow" />{index < data.activity.length - 1 && <span className="absolute top-4 h-full w-px bg-blue-100" />}</div><div className="pb-5"><p className="text-sm font-semibold capitalize text-slate-800">{String(activity.type).replaceAll("_", " ")}</p><p className="mt-1 text-sm text-slate-600">{activity.description || "Action enregistrée"}</p><p className="mt-1 text-xs text-slate-400">{activity.actor} · {formatDate(activity.createdAt)}</p></div></div>) : <p className="text-sm text-slate-500">L’historique s’alimentera au fil des actions de traitement.</p>}</div></div>
        </TabsContent>
      </Tabs>

      {isOnlineApplication && <EvaluationDeliveryEditor sessionToken={sessionToken} sourceRecordId={candidate.internalId} open={evaluationOpen} onOpenChange={setEvaluationOpen} onCompleted={() => void refresh()} />}
    </div>
  );
}
