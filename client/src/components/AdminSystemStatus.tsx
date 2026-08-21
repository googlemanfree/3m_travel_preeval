import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, Mail, RefreshCw, Server, ShieldCheck, Wifi, WifiOff } from "lucide-react";

type StatusTone = "operational" | "degraded" | "unavailable";

const statusStyle: Record<StatusTone, { label: string; className: string }> = {
  operational: { label: "Opérationnel", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  degraded: { label: "Dégradé", className: "border-amber-200 bg-amber-50 text-amber-700" },
  unavailable: { label: "Indisponible", className: "border-red-200 bg-red-50 text-red-700" },
};

function formatUptime(value: number) {
  const totalMinutes = Math.floor(value / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  return hours ? `${hours} h ${totalMinutes % 60} min` : `${Math.max(1, totalMinutes)} min`;
}

export function AdminSystemStatus() {
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine);
  const statusQuery = trpc.monitoring.getConnectivityStatus.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const diagnosis = trpc.monitoring.runConnectivityDiagnostic.useMutation({
    onSuccess: () => void statusQuery.refetch(),
  });

  useEffect(() => {
    const updateNetwork = () => setBrowserOnline(navigator.onLine);
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };
  }, []);

  const status = statusQuery.data;
  const serverTone = status?.server.status ?? "degraded";
  const databaseTone = status?.database.status ?? "unavailable";
  const smtpTone = status?.smtp.status ?? "unavailable";

  return (
    <section aria-labelledby="system-status-title" className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="system-status-title" className="flex items-center gap-2 text-xl font-bold text-slate-900"><Activity className="h-5 w-5 text-blue-700" /> État du système</h2>
          <p className="text-sm text-slate-500">Surveillance administrative de la plateforme, actualisée toutes les 30 secondes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={browserOnline ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
            {browserOnline ? <Wifi className="mr-1 h-3.5 w-3.5" /> : <WifiOff className="mr-1 h-3.5 w-3.5" />}
            {browserOnline ? "Navigateur connecté" : "Navigateur hors ligne"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => diagnosis.mutate()} disabled={diagnosis.isPending} className="gap-2">
            <ShieldCheck className="h-4 w-4" />{diagnosis.isPending ? "Diagnostic…" : "Lancer le diagnostic"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void statusQuery.refetch()} disabled={statusQuery.isFetching} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${statusQuery.isFetching ? "animate-spin" : ""}`} />Actualiser
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Serveur applicatif</CardTitle><Server className="h-4 w-4 text-blue-700" /></CardHeader><CardContent className="space-y-2"><Badge variant="outline" className={statusStyle[serverTone].className}>{statusStyle[serverTone].label}</Badge><p className="text-xs text-slate-500">Réponse interne : {status?.server.latencyMs ?? "—"} ms · Actif depuis {status ? formatUptime(status.server.uptimeMs) : "—"}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Base de données</CardTitle><Database className="h-4 w-4 text-blue-700" /></CardHeader><CardContent className="space-y-2"><Badge variant="outline" className={statusStyle[databaseTone].className}>{statusStyle[databaseTone].label}</Badge><p className="text-xs text-slate-500">{status?.database.message ?? "Contrôle en cours…"}{status?.database.latencyMs !== null && status?.database.latencyMs !== undefined ? ` · ${status.database.latencyMs} ms` : ""}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Messagerie SMTP</CardTitle><Mail className="h-4 w-4 text-blue-700" /></CardHeader><CardContent className="space-y-2"><Badge variant="outline" className={statusStyle[smtpTone].className}>{statusStyle[smtpTone].label}</Badge><p className="text-xs text-slate-500">{status?.smtp.message ?? "Contrôle en cours…"}{status?.smtp.latencyMs !== null && status?.smtp.latencyMs !== undefined ? ` · ${status.smtp.latencyMs} ms` : ""}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Trafic tRPC</CardTitle><Activity className="h-4 w-4 text-blue-700" /></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{status?.traffic.totalRequests ?? "—"}</p><p className="text-xs text-slate-500">Erreurs : {status?.traffic.errorRate ?? "—"} · Délais : {status?.traffic.timeoutRate ?? "—"}</p></CardContent></Card>
      </div>

      {diagnosis.data && <div className={`rounded-xl border p-4 text-sm ${diagnosis.data.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}><p className="font-semibold">Diagnostic {diagnosis.data.ok ? "réussi" : "à examiner"} · {diagnosis.data.durationMs} ms</p><ul className="mt-2 list-disc space-y-1 pl-5">{diagnosis.data.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul></div>}
      {statusQuery.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">La supervision n’a pas pu contacter le serveur : {statusQuery.error.message}</div>}
    </section>
  );
}
