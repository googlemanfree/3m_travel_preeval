import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, Clock3, Eye, Gauge, Inbox, MessageSquare, RefreshCw, Send, UserRoundCheck, Users } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  application: "Dossier", evaluation: "Évaluation", consultation: "Consultation", flight: "Vol", insurance: "Assurance", translation: "Traduction", contact: "Contact", agency_dossier: "Agence",
};

const WORKFLOW_OPTIONS = [
  ["new", "Nouvelle demande"], ["qualifying", "À qualifier"], ["waiting_customer", "En attente du client"], ["documents_review", "Documents à vérifier"], ["payment_review", "Paiement à vérifier"], ["processing", "En traitement"], ["submitted", "Transmise"], ["completed", "Terminée"], ["closed", "Clôturée"], ["rejected", "Rejetée"],
] as const;

function slaPresentation(value: string) {
  if (value === "overdue") return { label: "SLA dépassé", className: "border-red-200 bg-red-50 text-red-700" };
  if (value === "warning") return { label: "À surveiller", className: "border-amber-200 bg-amber-50 text-amber-800" };
  if (value === "closed") return { label: "Clôturée", className: "border-slate-200 bg-slate-50 text-slate-600" };
  return { label: "Dans le délai", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
}

function statusClass(status: string) {
  if (["rejected", "closed"].includes(status)) return "bg-slate-100 text-slate-700";
  if (["completed", "submitted"].includes(status)) return "bg-emerald-100 text-emerald-800";
  if (["payment_review", "documents_review", "waiting_customer"].includes(status)) return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
}

export function UnifiedRequestInbox({ sessionToken }: { sessionToken: string }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState("all");
  const [workflowStatus, setWorkflowStatus] = useState("all");
  const [sla, setSla] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [comment, setComment] = useState("");
  const input = useMemo(() => ({
    sessionToken,
    search: search || undefined,
    sourceType: sourceType === "all" ? undefined : sourceType as any,
    workflowStatus: workflowStatus === "all" ? undefined : workflowStatus as any,
    sla: sla === "all" ? undefined : sla as any,
  }), [sessionToken, search, sourceType, workflowStatus, sla]);
  const { data, isLoading, refetch, isRefetching } = trpc.unifiedRequests.list.useQuery(input, { enabled: !!sessionToken });
  const { data: dashboard } = trpc.unifiedRequests.dashboard.useQuery({ sessionToken }, { enabled: !!sessionToken });
  const selectedInput = useMemo(() => selected ? { sessionToken, sourceType: selected.sourceType as any, sourceRecordId: selected.sourceRecordId } : undefined, [sessionToken, selected]);
  const { data: detail, isLoading: isDetailLoading } = trpc.unifiedRequests.getCustomer360.useQuery(selectedInput!, { enabled: !!selectedInput });
  const assignMutation = trpc.unifiedRequests.assign.useMutation({ onSuccess: () => { void utils.unifiedRequests.list.invalidate(); void utils.unifiedRequests.dashboard.invalidate(); toast({ title: "Attribution enregistrée" }); }, onError: (error) => toast({ title: "Attribution impossible", description: error.message, variant: "destructive" }) });
  const workflowMutation = trpc.unifiedRequests.updateWorkflow.useMutation({ onSuccess: () => { void utils.unifiedRequests.list.invalidate(); void utils.unifiedRequests.dashboard.invalidate(); toast({ title: "Cycle de traitement mis à jour" }); }, onError: (error) => toast({ title: "Mise à jour impossible", description: error.message, variant: "destructive" }) });
  const commentMutation = trpc.unifiedRequests.addInternalComment.useMutation({ onSuccess: () => { setComment(""); void utils.unifiedRequests.getCustomer360.invalidate(); void utils.unifiedRequests.list.invalidate(); toast({ title: "Commentaire interne ajouté" }); }, onError: (error) => toast({ title: "Commentaire impossible", description: error.message, variant: "destructive" }) });
  const publishBilanMutation = trpc.evaluationAdmin.publishBilan.useMutation({
    onSuccess: (result) => {
      setSelected((current: any) => current ? { ...current, sourceStatus: "bilan_envoye", workflowStatus: "processing", workflowLabel: "En traitement" } : current);
      void utils.unifiedRequests.list.invalidate();
      void utils.unifiedRequests.dashboard.invalidate();
      void utils.unifiedRequests.getCustomer360.invalidate();
      toast({ title: "Bilan envoyé immédiatement", description: result.message });
    },
    onError: (error) => toast({ title: "Envoi du bilan impossible", description: error.message, variant: "destructive" }),
  });

  useEffect(() => { if (selected) setComment(""); }, [selected]);
  const rows = data?.rows ?? [];
  const totals = dashboard?.totals;

  const setRequestStatus = (value: string) => {
    if (!selected) return;
    const requiresComment = ["waiting_customer", "rejected"].includes(value);
    if (requiresComment && comment.trim().length < 2) {
      toast({ title: "Commentaire requis", description: "Indiquez la prochaine action ou le motif avant de modifier ce statut." });
      return;
    }
    setSelected({ ...selected, workflowStatus: value, workflowLabel: WORKFLOW_OPTIONS.find(([status]) => status === value)?.[1] ?? value });
    workflowMutation.mutate({ sessionToken, sourceType: selected.sourceType, sourceRecordId: selected.sourceRecordId, workflowStatus: value as any, comment: requiresComment ? comment.trim() : undefined });
  };

  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Card className="border-slate-200"><CardContent className="flex items-center gap-3 p-4"><Inbox className="h-8 w-8 text-blue-600" /><div><p className="text-xs text-slate-500">Demandes suivies</p><p className="text-2xl font-bold text-slate-900">{data?.total ?? 0}</p></div></CardContent></Card>
      <Card className="border-slate-200"><CardContent className="flex items-center gap-3 p-4"><Gauge className="h-8 w-8 text-indigo-600" /><div><p className="text-xs text-slate-500">En traitement</p><p className="text-2xl font-bold text-slate-900">{totals?.active ?? 0}</p></div></CardContent></Card>
      <Card className="border-slate-200"><CardContent className="flex items-center gap-3 p-4"><Users className="h-8 w-8 text-amber-600" /><div><p className="text-xs text-slate-500">Sans conseiller</p><p className="text-2xl font-bold text-slate-900">{totals?.unassigned ?? rows.filter((row: any) => !row.assignedAdminAccountId).length}</p></div></CardContent></Card>
      <Card className="border-red-100"><CardContent className="flex items-center gap-3 p-4"><AlertTriangle className="h-8 w-8 text-red-600" /><div><p className="text-xs text-slate-500">SLA dépassé</p><p className="text-2xl font-bold text-red-700">{rows.filter((row: any) => row.sla === "overdue").length}</p></div></CardContent></Card>
      <Card className="border-emerald-100"><CardContent className="flex items-center gap-3 p-4"><UserRoundCheck className="h-8 w-8 text-emerald-600" /><div><p className="text-xs text-slate-500">Conversion suivie</p><p className="text-2xl font-bold text-emerald-700">{totals?.conversionRate ?? 0}%</p></div></CardContent></Card>
      <Card className="border-violet-100"><CardContent className="flex items-center gap-3 p-4"><Clock3 className="h-8 w-8 text-violet-600" /><div><p className="text-xs text-slate-500">Délai moyen</p><p className="text-2xl font-bold text-violet-700">{totals?.averageProcessingHours ?? 0} h</p></div></CardContent></Card>
    </div>

    {(rows.filter((row: any) => row.sla === "overdue").length > 0) && <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /><div><strong>{rows.filter((row: any) => row.sla === "overdue").length} demande(s) ont dépassé le délai de prise en charge.</strong><p className="mt-1 text-red-700">Filtrez sur « SLA dépassé » pour attribuer un conseiller ou définir la prochaine action immédiatement.</p></div></div>}

    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-indigo-950"><Gauge className="h-5 w-5 text-indigo-600" /> Tableau de pilotage des demandes</CardTitle><p className="text-sm text-slate-600">Volumes par service, délai moyen sur les demandes clôturées et conversion des évaluations, consultations et dossiers vers un traitement actif.</p></CardHeader><CardContent className="grid gap-5 lg:grid-cols-[1.45fr_0.55fr]"><div className="space-y-3">{(dashboard?.bySource ?? []).map((item: any) => { const maximum = Math.max(1, ...(dashboard?.bySource ?? []).map((value: any) => value.total)); return <div key={item.sourceType} className="grid grid-cols-[120px_minmax(0,1fr)_42px] items-center gap-3 text-sm"><span className="font-medium text-slate-700">{SOURCE_LABELS[item.sourceType]}</span><div className="h-2.5 overflow-hidden rounded-full bg-indigo-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${(item.total / maximum) * 100}%` }} /></div><span className="text-right font-semibold text-slate-800">{item.total}</span></div>; })}</div><div className="grid grid-cols-2 gap-3 lg:grid-cols-1"><div className="rounded-lg border border-white bg-white/80 p-3"><p className="text-xs text-slate-500">Nouvelles demandes non attribuées</p><p className="mt-1 text-2xl font-bold text-amber-700">{totals?.unassigned ?? 0}</p></div><div className="rounded-lg border border-white bg-white/80 p-3"><p className="text-xs text-slate-500">Demandes actives</p><p className="mt-1 text-2xl font-bold text-indigo-700">{totals?.active ?? 0}</p></div></div></CardContent></Card>

    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0"><div><CardTitle className="flex items-center gap-2 text-lg"><Inbox className="h-5 w-5 text-blue-700" /> Boîte de réception unifiée</CardTitle><p className="mt-1 text-sm text-slate-500">Toutes les demandes client sont centralisées sans modifier leur source d’origine.</p></div><Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isRefetching}><RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />Actualiser</Button></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,0.8fr)]"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, e-mail, référence ou destination…" aria-label="Rechercher une demande" /><Select value={sourceType} onValueChange={setSourceType}><SelectTrigger><SelectValue placeholder="Toutes les sources" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les sources</SelectItem>{Object.entries(SOURCE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={workflowStatus} onValueChange={setWorkflowStatus}><SelectTrigger><SelectValue placeholder="Tous les statuts" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem>{WORKFLOW_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={sla} onValueChange={setSla}><SelectTrigger><SelectValue placeholder="Tous les SLA" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les SLA</SelectItem><SelectItem value="on_track">Dans le délai</SelectItem><SelectItem value="warning">À surveiller</SelectItem><SelectItem value="overdue">SLA dépassé</SelectItem></SelectContent></Select></div>
        {isLoading ? <div className="py-12 text-center text-sm text-slate-500">Chargement des demandes…</div> : <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[1060px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Demande</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Cycle</th><th className="px-4 py-3">Conseiller</th><th className="px-4 py-3">SLA</th><th className="px-4 py-3">Dernière activité</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Aucune demande ne correspond aux filtres.</td></tr> : rows.map((row: any) => { const slaInfo = slaPresentation(row.sla); return <tr key={`${row.sourceType}-${row.sourceRecordId}`} className="hover:bg-blue-50/40"><td className="px-4 py-3"><div className="font-semibold text-slate-900">{row.displayReference}</div><div className="mt-1 flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{SOURCE_LABELS[row.sourceType]}</Badge><span className="text-xs text-slate-500">{row.requestTypeLabel}</span></div></td><td className="px-4 py-3"><div className="font-medium text-slate-800">{row.fullName}</div><div className="text-xs text-slate-500">{row.email}</div><div className="text-xs text-slate-500">{row.destination || "Destination à préciser"}</div></td><td className="px-4 py-3"><Badge className={statusClass(row.workflowStatus)}>{row.workflowLabel}</Badge><div className="mt-1 text-xs capitalize text-slate-500">Priorité : {row.priority}</div></td><td className="px-4 py-3">{row.assignedAdvisor ? <div><div className="font-medium text-slate-800">{row.assignedAdvisor.fullName}</div><div className="text-xs text-slate-500">{row.assignedAdvisor.email}</div></div> : <span className="text-sm font-medium text-amber-700">À attribuer</span>}</td><td className="px-4 py-3"><Badge variant="outline" className={slaInfo.className}>{slaInfo.label}</Badge></td><td className="px-4 py-3 text-xs text-slate-500">{new Date(row.lastActivityAt).toLocaleString("fr-FR")}</td><td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => setSelected(row)}><Eye className="mr-1 h-4 w-4" />Ouvrir</Button></td></tr>; })}</tbody></table></div>}
      </CardContent>
    </Card>

    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>Fiche client 360°</DialogTitle><DialogDescription>{selected?.fullName} · {selected?.displayReference} · {selected?.requestTypeLabel}</DialogDescription></DialogHeader>{isDetailLoading || !detail ? <div className="py-12 text-center text-sm text-slate-500">Chargement de la fiche client…</div> : <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3"><Card className="bg-slate-50"><CardContent className="p-4"><p className="text-xs text-slate-500">Contact</p><p className="mt-1 font-semibold">{selected.fullName}</p><p className="text-sm text-slate-600">{selected.email}</p><p className="text-sm text-slate-600">{selected.phone || "Téléphone non renseigné"}</p></CardContent></Card><Card className="bg-slate-50"><CardContent className="p-4"><p className="text-xs text-slate-500">SLA & échéance</p><p className="mt-1 font-semibold">{slaPresentation(selected.sla).label}</p><p className="text-sm text-slate-600">Échéance : {selected.dueAt ? new Date(selected.dueAt).toLocaleString("fr-FR") : "À planifier"}</p></CardContent></Card><Card className="bg-slate-50"><CardContent className="p-4"><p className="text-xs text-slate-500">Parcours</p><p className="mt-1 font-semibold">{detail.dossiers.length} dossier(s) · {detail.evaluations.length} évaluation(s)</p><p className="text-sm text-slate-600">{detail.documents.length} document(s) · {detail.messages.length} message(s)</p></CardContent></Card></div>
        <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-base">Traitement de la demande</CardTitle></CardHeader><CardContent className="space-y-4">{selected.sourceType === "application" && ["nouveau", "en_evaluation"].includes(selected.sourceStatus) && <div className="rounded-lg border border-blue-200 bg-blue-50 p-3"><p className="font-medium text-blue-950">Bilan prêt avant l’échéance ?</p><p className="mt-1 text-sm text-blue-800">L’administrateur peut le valider et l’envoyer maintenant. Le délai de 48 heures reste seulement un envoi automatique de secours.</p><Button className="mt-3" size="sm" onClick={() => publishBilanMutation.mutate({ dossierNumber: selected.displayReference, adminNote: comment.trim() || undefined })} disabled={publishBilanMutation.isPending}><Send className="mr-1 h-4 w-4" />{publishBilanMutation.isPending ? "Envoi immédiat…" : "Valider et envoyer maintenant"}</Button></div>}<div><Label>Cycle de traitement</Label><Select value={selected.workflowStatus} onValueChange={setRequestStatus}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{WORKFLOW_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label>Conseiller responsable</Label><Select value={selected.assignedAdminAccountId ? String(selected.assignedAdminAccountId) : "unassigned"} onValueChange={(value) => assignMutation.mutate({ sessionToken, sourceType: selected.sourceType, sourceRecordId: selected.sourceRecordId, assignedAdminAccountId: value === "unassigned" ? null : Number(value) })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Non attribué</SelectItem>{(data?.advisors ?? []).map((advisor: any) => <SelectItem key={advisor.id} value={String(advisor.id)}>{advisor.fullName}</SelectItem>)}</SelectContent></Select></div><div><Label>Priorité</Label><Select value={selected.priority} onValueChange={(value) => assignMutation.mutate({ sessionToken, sourceType: selected.sourceType, sourceRecordId: selected.sourceRecordId, assignedAdminAccountId: selected.assignedAdminAccountId ?? null, priority: value as any })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Basse</SelectItem><SelectItem value="normal">Normale</SelectItem><SelectItem value="high">Haute</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent></Select></div><div><Label htmlFor="unified-request-note">Commentaire interne</Label><Textarea id="unified-request-note" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Consigne, décision, prochaine action…" className="mt-1" /><Button className="mt-2" size="sm" disabled={commentMutation.isPending || comment.trim().length < 2} onClick={() => commentMutation.mutate({ sessionToken, sourceType: selected.sourceType, sourceRecordId: selected.sourceRecordId, comment })}><MessageSquare className="mr-1 h-4 w-4" />Ajouter au journal</Button></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Demandes et opérations liées</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="rounded-md border p-3"><p className="font-medium">Dossiers</p>{detail.dossiers.length ? detail.dossiers.map((item: any) => <p key={item.id} className="mt-1 text-slate-600">{item.dossierNumber} · {item.destination} · {item.dossierStatus} · paiement {item.paymentStatus}</p>) : <p className="mt-1 text-slate-500">Aucun dossier relié à cet e-mail.</p>}</div><div className="rounded-md border p-3"><p className="font-medium">Services associés</p><p className="mt-1 text-slate-600">Vols : {detail.flights.length} · Assurances : {detail.insurance.length} · Traductions : {detail.translations.length} · Consultations : {detail.consultations.length}</p></div><div className="rounded-md border p-3"><p className="font-medium">Dernières pièces et échanges</p><p className="mt-1 text-slate-600">{detail.documents.slice(0, 3).map((item: any) => item.fileName).join(" · ") || "Aucune pièce candidate liée"}</p></div></CardContent></Card></div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" /> Journal de traitement</CardTitle></CardHeader><CardContent>{detail.history.length ? <ol className="space-y-3 border-l border-slate-200 pl-4">{detail.history.map((item: any) => <li key={item.id} className="relative text-sm"><span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" /><p className="font-medium text-slate-800">{item.actionType.replaceAll("_", " ")}</p><p className="text-slate-600">{item.comment || `${item.previousValue || ""} → ${item.newValue || ""}`}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("fr-FR")}</p></li>)}</ol> : <p className="text-sm text-slate-500">Le journal sera créé à la première action de traitement.</p>}</CardContent></Card>
      </div>}</DialogContent>
    </Dialog>
  </div>;
}
