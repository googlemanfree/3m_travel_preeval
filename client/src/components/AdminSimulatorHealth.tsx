import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Filter, Loader2, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

type Props = { sessionToken: string };

const statusStyle = {
  normal: { label: "Aucune erreur signalée", icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  recovered: { label: "Incident ancien", icon: Clock3, className: "border-blue-200 bg-blue-50 text-blue-900" },
  degraded: { label: "À surveiller", icon: AlertTriangle, className: "border-amber-200 bg-amber-50 text-amber-950" },
  attention: { label: "Intervention requise", icon: ShieldAlert, className: "border-rose-200 bg-rose-50 text-rose-950" },
  unknown: { label: "État indisponible", icon: Activity, className: "border-slate-200 bg-slate-50 text-slate-800" },
} as const;

function formatDate(value: Date | string | null) {
  return value ? new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "Aucun incident enregistré";
}

export function AdminSimulatorHealth({ sessionToken }: Props) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data, isLoading, refetch, isFetching } = trpc.adminNotifications.simulatorHealth.useQuery(
    { sessionToken },
    { enabled: Boolean(sessionToken) },
  );
  const incidents = useMemo(
    () => (data?.incidents ?? []).filter((incident) => filter === "all" || !incident.isRead),
    [data?.incidents, filter],
  );

  if (!sessionToken) return null;

  return (
    <section aria-labelledby="simulator-health-title" className="space-y-5">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Supervision sans données candidat</p>
          <h2 id="simulator-health-title" className="mt-1 text-xl font-black text-slate-950">Santé des simulateurs</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Les incidents recensent uniquement le module, la route et l’horodatage. Ils ne contiennent aucune réponse de formulaire.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching} className="min-h-11 border-slate-300 font-bold">
          {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Activity className="mr-2 h-4 w-4" aria-hidden="true" />} Actualiser
        </Button>
      </header>

      {isLoading ? <div role="status" className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-sm font-semibold text-blue-900">Chargement de l’état des simulateurs…</div> : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {(data?.simulators ?? []).map((simulator) => {
              const status = statusStyle[simulator.status as keyof typeof statusStyle] ?? statusStyle.unknown;
              const Icon = status.icon;
              return <article key={simulator.key} className={`rounded-2xl border p-5 ${status.className}`}>
                <div className="flex items-start justify-between gap-3"><Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span className="text-xs font-black uppercase tracking-wide">{status.label}</span></div>
                <h3 className="mt-5 font-black">{simulator.label}</h3>
                <p className="mt-1 text-sm">{simulator.incidents24h} incident(s) sur 24 h</p>
                <p className="mt-3 border-t border-current/15 pt-3 text-xs font-medium">{formatDate(simulator.lastIncidentAt)}</p>
              </article>;
            })}
          </div>

          <section aria-labelledby="simulator-incidents-title" className="rounded-2xl border border-slate-200 bg-white">
            <header className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 id="simulator-incidents-title" className="font-black text-slate-950">Historique des incidents</h3><p className="mt-1 text-sm text-slate-600">Les alertes répétées sont regroupées côté serveur pendant 15 minutes.</p></div>
              <label className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700"><Filter className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Filtrer les incidents</span><select value={filter} onChange={(event) => setFilter(event.target.value as "all" | "unread")} className="bg-transparent outline-none"><option value="all">Tous</option><option value="unread">Non lus</option></select></label>
            </header>
            {incidents.length === 0 ? <p className="p-6 text-sm text-slate-600">Aucun incident de chargement ne correspond au filtre.</p> : <ol className="divide-y divide-slate-100">{incidents.map((incident) => <li key={incident.id} className="flex gap-3 p-5"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" /><div><p className="text-sm font-bold text-slate-900">{incident.message}</p><p className="mt-1 text-xs text-slate-500">{formatDate(incident.createdAt)} · {incident.isRead ? "Lu" : "Non lu"}</p></div></li>)}</ol>}
          </section>
        </>
      )}
    </section>
  );
}
