import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, Clock3, MailCheck, Play, RefreshCw, ShieldAlert } from "lucide-react";

const modeStyles = {
  off: "border-slate-300 bg-slate-100 text-slate-700",
  "dry-run": "border-amber-300 bg-amber-50 text-amber-800",
  live: "border-rose-300 bg-rose-50 text-rose-800",
} as const;

const modeLabels = { off: "Désactivé", "dry-run": "Dry-run · aucun envoi", live: "Live · envois actifs" } as const;

type SchedulerMode = keyof typeof modeLabels;

export function SchedulerModeBadge({ compact = false }: { compact?: boolean }) {
  const statusQuery = trpc.schedulerAdmin.getStatus.useQuery(undefined, { refetchOnWindowFocus: true });
  const mode = (statusQuery.data?.mode ?? "off") as SchedulerMode;
  return (
    <Badge variant="outline" className={`gap-1.5 ${modeStyles[mode]}`} title="Mode du planificateur interne">
      {mode === "live" ? <MailCheck className="h-3.5 w-3.5" /> : mode === "dry-run" ? <ShieldAlert className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
      {statusQuery.isLoading ? "Planificateur…" : compact ? modeLabels[mode] : `Planificateur : ${modeLabels[mode]}`}
    </Badge>
  );
}

export function AdminSchedulerPanel() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const statusQuery = trpc.schedulerAdmin.getStatus.useQuery(undefined, { refetchOnWindowFocus: true });
  const utils = trpc.useUtils();
  const runMutation = trpc.schedulerAdmin.runDocumentRemindersDryRun.useMutation({
    onSuccess: () => void utils.schedulerAdmin.getStatus.invalidate(),
  });
  const mode = (statusQuery.data?.mode ?? "off") as SchedulerMode;
  const history = statusQuery.data?.history ?? [];

  const refresh = async () => {
    setIsRefreshing(true);
    try { await statusQuery.refetch(); } finally { setIsRefreshing(false); }
  };

  return (
    <section aria-labelledby="scheduler-panel-title" className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 id="scheduler-panel-title" className="flex items-center gap-2 text-xl font-black text-slate-950"><Activity className="h-5 w-5 text-blue-700" /> Planificateur interne</h2>
          <p className="mt-1 text-sm text-slate-600">Déclenchement contrôlé des relances documentaires et historique des exécutions récentes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SchedulerModeBadge />
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={isRefreshing || statusQuery.isFetching} className="gap-2" aria-label="Actualiser l’état du planificateur">
            <RefreshCw className={`h-4 w-4 ${isRefreshing || statusQuery.isFetching ? "animate-spin" : ""}`} /> Actualiser
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200"><CardHeader className="pb-2"><CardTitle className="text-sm">Mode actif</CardTitle></CardHeader><CardContent><SchedulerModeBadge /><p className="mt-2 text-xs text-slate-500">{statusQuery.data?.scheduledJobsCount ?? "—"} tâche(s) configurée(s).</p></CardContent></Card>
        <Card className="border-amber-200 bg-amber-50/50"><CardHeader className="pb-2"><CardTitle className="text-sm">Test immédiat</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs text-amber-900">Relances documents uniquement, sans e-mail en mode dry-run.</p><Button type="button" className="w-full gap-2 bg-amber-700 text-white hover:bg-amber-800" disabled={mode !== "dry-run" || runMutation.isPending} onClick={() => runMutation.mutate()} title={mode === "dry-run" ? "Simuler les relances sans envoyer d’e-mail" : "Le test manuel est disponible uniquement en dry-run"}><Play className="h-4 w-4" />{runMutation.isPending ? "Simulation…" : "Tester les relances"}</Button>{mode !== "dry-run" && <p className="text-xs font-semibold text-amber-800">Passez le serveur en dry-run pour activer ce test.</p>}{runMutation.data && <p role="status" className="text-xs font-semibold text-emerald-800">{runMutation.data.message}</p>}{runMutation.error && <p role="alert" className="text-xs font-semibold text-rose-800">{runMutation.error.message}</p>}</CardContent></Card>
        <Card className="border-blue-200 bg-blue-50/50"><CardHeader className="pb-2"><CardTitle className="text-sm">Dernière exécution</CardTitle></CardHeader><CardContent>{history[0] ? <><p className="text-lg font-black text-blue-950">{history[0].planned} simulée(s) · {history[0].sent} envoyée(s)</p><p className="mt-1 text-xs text-blue-800">{new Date(history[0].finishedAt).toLocaleString("fr-FR")}</p></> : <p className="text-sm text-blue-800">Aucune exécution enregistrée depuis le démarrage.</p>}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4 text-blue-700" /> Historique des dernières exécutions</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">L’historique apparaîtra après un test manuel ou une exécution planifiée.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-2">Date</th><th className="px-3 py-2">Origine</th><th className="px-3 py-2">Mode</th><th className="px-3 py-2 text-right">Simulées</th><th className="px-3 py-2 text-right">Envoyées</th><th className="px-3 py-2 text-right">Échecs</th><th className="px-3 py-2">État</th></tr></thead><tbody className="divide-y divide-slate-100">{history.map((entry) => <tr key={entry.id}><td className="px-3 py-3 text-slate-700">{new Date(entry.finishedAt).toLocaleString("fr-FR")}</td><td className="px-3 py-3">{entry.source === "manual" ? "Manuel" : "Automatique"}</td><td className="px-3 py-3"><Badge variant="outline" className={modeStyles[entry.mode]}>{modeLabels[entry.mode]}</Badge></td><td className="px-3 py-3 text-right font-semibold">{entry.planned}</td><td className="px-3 py-3 text-right font-semibold">{entry.sent}</td><td className="px-3 py-3 text-right">{entry.failed}</td><td className="px-3 py-3">{entry.status === "success" ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Réussi</span> : <span className="text-rose-700">Échec</span>}</td></tr>)}</tbody></table></div>}
        </CardContent>
      </Card>
    </section>
  );
}
