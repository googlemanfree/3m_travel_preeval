import { useLocation } from "wouter";
import { BarChart3, ClipboardList, FileCheck2, LogOut, ShieldCheck, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

function getAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken") || "";
}

const STATUS_LABELS: Record<string, string> = {
  pending_review: "À traiter",
  assigned: "Affectées",
  needs_info: "Informations requises",
  revalidated: "Revalidées",
  awaiting_payment: "Paiement attendu",
  issued: "Billet émis",
  cancelled: "Annulées",
};

export default function SuperAdminDashboard() {
  const [, navigate] = useLocation();
  const sessionToken = getAdminToken();
  const meQuery = trpc.adminAuth.me.useQuery(undefined, { retry: false });
  const statsQuery = trpc.adminAuth.getGlobalStats.useQuery(
    { sessionToken },
    { enabled: Boolean(sessionToken) && meQuery.data?.authenticated === true, refetchInterval: 30_000, retry: false },
  );

  if (!sessionToken || meQuery.data?.authenticated === false) {
    return <AccessState title="Connexion administrateur requise" description="Connectez-vous avec un compte administrateur autorisé." action={() => navigate("/admin/login")} actionLabel="Se connecter" />;
  }

  if (meQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">Vérification des permissions…</div>;
  }

  if (meQuery.data?.authenticated !== true) {
    return <AccessState title="Accès administrateur requis" description="Ce tableau de bord est accessible à tous les comptes administrateurs actifs." action={() => navigate("/admin/login")} actionLabel="Se connecter" />;
  }

  const stats = statsQuery.data;
  const totalFlightRequests = stats?.flightRequests.total ?? 0;
  const statusRows = Object.entries(stats?.flightRequests.byStatus ?? {}).sort(([, a], [, b]) => b - a);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-slate-950 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-cyan-300" /><Badge className="bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/15">Administrateur</Badge></div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Pilotage global 3M Travel Agency</h1>
            <p className="mt-2 text-sm text-slate-300">Statistiques réelles des opérations, dossiers et demandes de vols.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => navigate("/admin/flight-requests")} className="h-12 rounded-xl bg-white text-slate-950 hover:bg-slate-100"><ClipboardList className="mr-2 h-4 w-4" /> File des vols</Button>
            <Button type="button" variant="outline" onClick={() => navigate("/admin/admins")} className="h-12 rounded-xl border-slate-700 bg-transparent text-white hover:bg-white/10"><UsersRound className="mr-2 h-4 w-4" /> Comptes admin</Button>
          </div>
        </header>

        {statsQuery.isLoading ? <div className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm">Chargement des statistiques globales…</div> : null}
        {statsQuery.error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">Impossible de charger les statistiques : {statsQuery.error.message}</div> : null}

        {stats ? <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs globaux">
            <MetricCard icon={<UsersRound className="h-5 w-5" />} label="Administrateurs actifs" value={`${stats.admins.active}/${stats.admins.total}`} tone="blue" />
            <MetricCard icon={<ShieldCheck className="h-5 w-5" />} label="Administrateurs au rôle commun" value={stats.admins.adminsWithCommonRole} tone="violet" />
            <MetricCard icon={<FileCheck2 className="h-5 w-5" />} label="Évaluations" value={stats.evaluations} tone="amber" />
            <MetricCard icon={<BarChart3 className="h-5 w-5" />} label="Demandes de vols" value={totalFlightRequests} tone="emerald" />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-blue-700" /> Répartition des demandes de vols</CardTitle></CardHeader><CardContent className="space-y-4">
              {statusRows.length ? statusRows.map(([status, total]) => {
                const percentage = totalFlightRequests ? Math.round((total / totalFlightRequests) * 100) : 0;
                return <div key={status} className="space-y-1.5"><div className="flex justify-between text-sm font-semibold text-slate-700"><span>{STATUS_LABELS[status] || status}</span><span>{total} · {percentage}%</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${percentage}%` }} /></div></div>;
              }) : <p className="text-sm text-slate-500">Aucune demande de vol enregistrée.</p>}
            </CardContent></Card>

            <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle className="text-lg">Autres volumes opérationnels</CardTitle></CardHeader><CardContent className="space-y-4"><StatLine label="Demandes d’assurance" value={stats.insuranceRequests} /><StatLine label="Demandes de vols" value={stats.flightRequests.total} /><StatLine label="Comptes administrateurs" value={stats.admins.total} /></CardContent></Card>
          </section>
        </> : null}

        <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => navigate("/admin")} className="h-12 rounded-xl"><LogOut className="mr-2 h-4 w-4" /> Retour au tableau de bord</Button><p className="self-center text-xs text-slate-500">Les données sont recalculées côté serveur et ne sont pas simulées.</p></div>
      </div>
    </main>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone: "blue" | "violet" | "amber" | "emerald" }) {
  const toneClass = { blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700" }[tone];
  return <Card className="rounded-2xl border-0 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className={`rounded-xl p-3 ${toneClass}`}>{icon}</div><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black text-slate-950">{value}</p></div></CardContent></Card>;
}

function StatLine({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm font-semibold text-slate-600">{label}</span><span className="text-xl font-black text-slate-950">{value}</span></div>;
}

function AccessState({ title, description, action, actionLabel }: { title: string; description: string; action: () => void; actionLabel: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><Card className="w-full max-w-md rounded-2xl border-0 text-center shadow-xl"><CardContent className="p-8"><ShieldCheck className="mx-auto h-12 w-12 text-slate-400" /><h1 className="mt-4 text-2xl font-black text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-600">{description}</p><Button type="button" onClick={action} className="mt-6 h-12 w-full rounded-xl bg-blue-700 font-bold text-white">{actionLabel}</Button></CardContent></Card></main>;
}
