import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, FileText, Inbox, MessageSquare, Plane, RefreshCw, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/use-toast";

const STATUS_LABELS = {
  pending_review: "À traiter",
  assigned: "Affectée",
  needs_info: "Informations requises",
  revalidated: "Tarif revalidé",
  awaiting_payment: "En attente de paiement",
  issued: "Billet émis",
  cancelled: "Annulée",
} as const;

type RequestStatus = keyof typeof STATUS_LABELS;

function getAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken") || "";
}

function displayJson(value: unknown) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export default function FlightAgentDashboard() {
  const { toast } = useToast();
  const sessionToken = getAdminToken();
  const [statusFilter, setStatusFilter] = useState<"ALL" | RequestStatus>("ALL");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [agentEmail, setAgentEmail] = useState("");
  const [note, setNote] = useState("");

  const summaryQuery = trpc.flightBooking.getQueueSummary.useQuery(
    { sessionToken },
    { enabled: Boolean(sessionToken), refetchInterval: 30_000, retry: false },
  );
  const queueQuery = trpc.flightBooking.getQueue.useQuery(
    { sessionToken, status: statusFilter, limit: 50, offset: 0 },
    { enabled: Boolean(sessionToken), refetchInterval: 30_000, retry: false },
  );
  const detailQuery = trpc.flightBooking.getRequest.useQuery(
    { sessionToken, requestId: selectedRequestId ?? 0 },
    { enabled: Boolean(sessionToken) && Boolean(selectedRequestId), retry: false },
  );
  const utils = trpc.useUtils();
  const statusMutation = trpc.flightBooking.updateStatus.useMutation({
    onSuccess: () => {
      toast({ title: "Statut mis à jour", description: "La file agent a été actualisée." });
      void utils.flightBooking.getQueue.invalidate();
      void utils.flightBooking.getQueueSummary.invalidate();
      void utils.flightBooking.getRequest.invalidate();
    },
    onError: (error) => toast({ title: "Mise à jour impossible", description: error.message, variant: "destructive" }),
  });
  const assignMutation = trpc.flightBooking.assignRequest.useMutation({
    onSuccess: () => {
      toast({ title: "Demande affectée", description: "L'agent assigné est maintenant visible dans le dossier." });
      void utils.flightBooking.getQueue.invalidate();
      void utils.flightBooking.getRequest.invalidate();
    },
    onError: (error) => toast({ title: "Affectation impossible", description: error.message, variant: "destructive" }),
  });
  const noteMutation = trpc.flightBooking.addNote.useMutation({
    onSuccess: () => {
      setNote("");
      toast({ title: "Note enregistrée", description: "La note interne a été ajoutée à l'historique." });
      void utils.flightBooking.getRequest.invalidate();
      void utils.flightBooking.getQueue.invalidate();
    },
    onError: (error) => toast({ title: "Note non enregistrée", description: error.message, variant: "destructive" }),
  });

  const selectedRequest = useMemo(() => queueQuery.data?.requests.find((request) => request.id === selectedRequestId), [queueQuery.data?.requests, selectedRequestId]);
  const isBusy = statusMutation.isPending || assignMutation.isPending || noteMutation.isPending;

  if (!sessionToken) {
    return <div className="min-h-screen bg-slate-50 p-6 text-center text-slate-700">Session administrateur absente. Veuillez vous reconnecter.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-blue-950 via-blue-800 to-sky-700 p-6 text-white shadow-xl md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-200">Opérations vols</p>
            <h1 className="mt-2 text-2xl font-black md:text-3xl">Tableau de bord agents</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">Suivez les demandes en attente, assignez un conseiller et revalidez chaque tarif avant toute émission.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => { void queueQuery.refetch(); void summaryQuery.refetch(); }} className="h-12 rounded-xl border-white/30 bg-white/10 font-bold text-white hover:bg-white/20">
            <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Résumé de la file">
          {([
            ["pending_review", "À traiter", Inbox, "text-amber-700 bg-amber-50"],
            ["assigned", "Affectées", UserRound, "text-blue-700 bg-blue-50"],
            ["revalidated", "Revalidées", CheckCircle2, "text-emerald-700 bg-emerald-50"],
            ["needs_info", "Infos requises", AlertCircle, "text-red-700 bg-red-50"],
          ] as const).map(([key, label, Icon, tone]) => (
            <Card key={key} className="border-0 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3"><span className={`rounded-xl p-2 ${tone}`}><Icon className="h-5 w-5" /></span><span className="text-3xl font-black text-slate-900">{summaryQuery.data?.[key] ?? 0}</span></div>
              <p className="mt-3 text-sm font-bold text-slate-600">{label}</p>
            </Card>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="flex items-center gap-2 text-lg font-black text-slate-900"><Plane className="h-5 w-5 text-blue-600" /> Demandes de réservation</h2><p className="mt-1 text-xs text-slate-500">{queueQuery.data?.total ?? 0} dossier(s) correspondant au filtre</p></div>
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><select aria-label="Filtrer par statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | RequestStatus)} className="h-12 min-w-52 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"><option value="ALL">Tous les statuts</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Référence</th><th className="px-5 py-3">Client</th><th className="px-5 py-3">Vol</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Créée</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {queueQuery.isLoading && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500"><Clock3 className="mx-auto mb-2 h-5 w-5 animate-pulse" />Chargement de la file…</td></tr>}
                  {!queueQuery.isLoading && !queueQuery.data?.requests.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Aucune demande pour ce filtre.</td></tr>}
                  {queueQuery.data?.requests.map((request) => <tr key={request.id} onClick={() => { setSelectedRequestId(request.id); setAgentEmail(request.assignedAgentEmail || ""); setNote(request.agentNotes || ""); }} className={`cursor-pointer transition hover:bg-blue-50 ${selectedRequestId === request.id ? "bg-blue-50" : ""}`}><td className="px-5 py-4 font-mono font-bold text-blue-700">{request.requestRef}</td><td className="px-5 py-4"><span className="block font-bold text-slate-900">{request.candidateEmail}</span><span className="text-xs text-slate-500">Candidat #{request.candidateId}</span></td><td className="px-5 py-4"><span className="block font-bold text-slate-900">{request.flightId}</span><span className="text-xs text-slate-500">Voir détails</span></td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{STATUS_LABELS[request.status as RequestStatus] || request.status}</span></td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{new Date(request.createdAt).toLocaleString("fr-FR")}</td></tr>)}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-0 p-5 shadow-sm">
            {!selectedRequestId ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center text-slate-500"><FileText className="mb-3 h-10 w-10 text-slate-300" /><p className="font-bold text-slate-700">Sélectionnez une demande</p><p className="mt-1 max-w-xs text-xs">Les passagers, le vol choisi et l'historique apparaîtront ici pour traitement.</p></div>
            ) : detailQuery.isLoading ? <div className="py-12 text-center text-slate-500">Chargement du dossier…</div> : detailQuery.data ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-blue-600">Dossier {detailQuery.data.request.requestRef}</p><h2 className="mt-1 text-xl font-black text-slate-900">Détails de la demande</h2></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{STATUS_LABELS[detailQuery.data.request.status as RequestStatus]}</span></div>
                <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase text-slate-500">Client</p><p className="mt-1 break-all text-sm font-bold text-slate-900">{detailQuery.data.request.candidateEmail}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase text-slate-500">Vol sélectionné</p><p className="mt-1 text-sm font-bold text-slate-900">{detailQuery.data.request.flightId}</p></div></div>
                <details className="rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-bold text-slate-800">Voir les données du vol</summary><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11px] text-slate-600">{displayJson(detailQuery.data.request.flightData)}</pre></details>
                <details className="rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-bold text-slate-800">Voir les passagers et passeports</summary><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11px] text-slate-600">{displayJson(detailQuery.data.request.passengerData)}</pre></details>
                <div className="space-y-2"><Label htmlFor="agent-email">Affecter à un agent</Label><div className="flex gap-2"><Input id="agent-email" type="email" value={agentEmail} onChange={(event) => setAgentEmail(event.target.value)} placeholder="agent@3mtravelagency.com" className="h-12 rounded-xl" /><Button type="button" disabled={isBusy || !agentEmail} onClick={() => assignMutation.mutate({ sessionToken, requestId: selectedRequestId, assignedAgentEmail: agentEmail })} className="h-12 rounded-xl bg-blue-700 font-bold text-white">Affecter</Button></div></div>
                <div className="space-y-2"><Label htmlFor="request-status">Statut opérationnel</Label><select id="request-status" value={detailQuery.data.request.status} disabled={isBusy} onChange={(event) => statusMutation.mutate({ sessionToken, requestId: selectedRequestId, status: event.target.value as RequestStatus, details: note || undefined })} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"><option value="pending_review">À traiter</option>{Object.entries(STATUS_LABELS).filter(([value]) => value !== "pending_review").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <div className="space-y-2"><Label htmlFor="agent-note">Note interne</Label><Textarea id="agent-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ex. tarif revalidé auprès du GDS, bagage à confirmer…" className="min-h-24 rounded-xl" /><Button type="button" disabled={isBusy || !note.trim()} onClick={() => noteMutation.mutate({ sessionToken, requestId: selectedRequestId, note: note.trim() })} className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white"><MessageSquare className="mr-2 h-4 w-4" /> Enregistrer la note</Button></div>
                <div><p className="mb-2 text-sm font-black text-slate-900">Historique</p><div className="max-h-40 space-y-2 overflow-auto">{detailQuery.data.history.map((entry) => <div key={entry.id} className="rounded-lg bg-slate-50 p-2 text-xs"><span className="font-bold text-slate-800">{entry.action}</span><span className="ml-2 text-slate-500">{entry.changedBy} · {new Date(entry.createdAt).toLocaleString("fr-FR")}</span>{entry.details && <p className="mt-1 text-slate-600">{entry.details}</p>}</div>)}</div></div>
              </div>
            ) : <div className="py-12 text-center text-red-600">Demande introuvable.</div>}
          </Card>
        </div>
      </div>
    </main>
  );
}
