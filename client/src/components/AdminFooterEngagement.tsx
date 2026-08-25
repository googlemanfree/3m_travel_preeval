import { useMemo } from "react";
import { BarChart3, Clock3, Link2, MousePointerClick, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EngagementRow = {
  surface: "footer_shortcut" | "footer_social";
  targetKey: string;
  href: string;
  language: "fr" | "en";
  clicks: number;
  lastClickedAt: Date | string | null;
};

const SURFACE_LABEL: Record<EngagementRow["surface"], string> = {
  footer_shortcut: "Raccourci du footer",
  footer_social: "Réseau social",
};

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function AdminFooterEngagement({ sessionToken }: { sessionToken: string }) {
  const summaryQuery = trpc.footerEngagement.getSummary.useQuery(
    { sessionToken, limit: 12 },
    { enabled: Boolean(sessionToken), retry: false, refetchOnWindowFocus: false },
  );
  const rows = (summaryQuery.data ?? []) as EngagementRow[];
  const metrics = useMemo(() => {
    const totalClicks = rows.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
    const shortcutClicks = rows.filter((row) => row.surface === "footer_shortcut").reduce((sum, row) => sum + Number(row.clicks || 0), 0);
    const socialClicks = rows.filter((row) => row.surface === "footer_social").reduce((sum, row) => sum + Number(row.clicks || 0), 0);
    const latest = rows.reduce<Date | string | null>((current, row) => {
      if (!row.lastClickedAt) return current;
      if (!current || new Date(row.lastClickedAt).getTime() > new Date(current).getTime()) return row.lastClickedAt;
      return current;
    }, null);
    return { totalClicks, shortcutClicks, socialClicks, latest, maximum: Math.max(1, ...rows.map((row) => Number(row.clicks || 0))) };
  }, [rows]);

  return (
    <section className="space-y-5" aria-labelledby="footer-engagement-title">
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Navigation publique</p>
          <h2 id="footer-engagement-title" className="mt-1 flex items-center gap-2 text-xl font-black text-slate-950"><BarChart3 className="h-5 w-5 text-blue-700" /> Engagement du footer</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Synthèse agrégée des clics sur les raccourcis et réseaux sociaux. Aucun visiteur, contenu saisi ou dossier client n’est affiché.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void summaryQuery.refetch()} disabled={summaryQuery.isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${summaryQuery.isFetching ? "animate-spin" : ""}`} /> Actualiser
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<MousePointerClick className="h-5 w-5 text-blue-700" />} label="Clics agrégés" value={metrics.totalClicks} tone="blue" />
        <Metric icon={<Link2 className="h-5 w-5 text-violet-700" />} label="Raccourcis" value={metrics.shortcutClicks} tone="violet" />
        <Metric icon={<BarChart3 className="h-5 w-5 text-emerald-700" />} label="Réseaux sociaux" value={metrics.socialClicks} tone="emerald" />
        <Metric icon={<Clock3 className="h-5 w-5 text-amber-700" />} label="Dernier clic agrégé" value={formatDate(metrics.latest)} tone="amber" compact />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base">Raccourcis les plus consultés</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {summaryQuery.isLoading ? <p className="py-8 text-center text-sm text-slate-500">Chargement des statistiques agrégées…</p> : summaryQuery.isError ? <p className="py-8 text-center text-sm text-rose-700">Les statistiques ne sont pas disponibles pour le moment. Actualisez la vue ou vérifiez votre session administrateur.</p> : rows.length ? (
            <div className="space-y-4">
              {rows.map((row) => {
                const clicks = Number(row.clicks || 0);
                const width = Math.max(4, Math.round((clicks / metrics.maximum) * 100));
                return <div key={`${row.surface}-${row.targetKey}-${row.language}`} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px] sm:items-center">
                  <div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><p className="truncate font-bold text-slate-900">{row.targetKey.replace(/_/g, " ")}</p><p className="truncate text-xs text-slate-500">{SURFACE_LABEL[row.surface]} · {row.language.toUpperCase()} · {row.href}</p></div><span className="text-sm font-black text-slate-900">{clicks}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${width}%` }} /></div></div>
                  <p className="text-xs text-slate-500 sm:text-right">{formatDate(row.lastClickedAt)}</p>
                </div>;
              })}
            </div>
          ) : <p className="py-9 text-center text-sm text-slate-500">Aucun clic n’est encore enregistré. Les données apparaîtront ici après des interactions réelles avec le footer public.</p>}
        </CardContent>
      </Card>
    </section>
  );
}

function Metric({ icon, label, value, tone, compact = false }: { icon: React.ReactNode; label: string; value: string | number; tone: "blue" | "violet" | "emerald" | "amber"; compact?: boolean }) {
  const tones = { blue: "border-blue-100 bg-blue-50/70", violet: "border-violet-100 bg-violet-50/70", emerald: "border-emerald-100 bg-emerald-50/70", amber: "border-amber-100 bg-amber-50/70" };
  return <Card className={tones[tone]}><CardContent className="flex items-start gap-3 p-4">{icon}<div className="min-w-0"><p className="text-xs font-bold text-slate-600">{label}</p><p className={`${compact ? "text-sm" : "text-2xl"} mt-1 font-black text-slate-950`}>{value}</p></div></CardContent></Card>;
}
