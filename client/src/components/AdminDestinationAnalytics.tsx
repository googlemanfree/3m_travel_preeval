import { BarChart3, MapPinned, RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DestinationMetric = {
  destination: string;
  total: number;
  pending: number;
  reviewed: number;
  contacted: number;
  closed: number;
};

export function AdminDestinationAnalytics({ sessionToken }: { sessionToken: string }) {
  const analyticsQuery = trpc.admin.getEvaluationsByDestination.useQuery(
    { sessionToken },
    { enabled: Boolean(sessionToken), refetchOnWindowFocus: false },
  );

  const destinations = ((analyticsQuery.data?.destinations ?? []) as DestinationMetric[])
    .filter((item) => item.destination && item.destination !== "Non spécifiée")
    .sort((left, right) => right.total - left.total || left.destination.localeCompare(right.destination, "fr"));
  const chartData = destinations.slice(0, 10);
  const totalDemand = destinations.reduce((sum, item) => sum + item.total, 0);
  const topDestination = destinations[0];

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-blue-700" />Tendances des destinations demandées</CardTitle><p className="mt-1 text-sm text-slate-500">Données réelles des évaluations reçues. Les entrées sans destination ne sont pas incluses dans le classement.</p></div>
          <Button type="button" size="sm" variant="outline" onClick={() => void analyticsQuery.refetch()} disabled={analyticsQuery.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${analyticsQuery.isFetching ? "animate-spin" : ""}`} />Actualiser</Button>
        </CardHeader>
        <CardContent>
          {analyticsQuery.isLoading ? <div className="py-16 text-center text-sm text-slate-500">Calcul des tendances…</div> : analyticsQuery.error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Les statistiques ne peuvent pas être chargées. Réessayez après avoir vérifié votre session administrateur.</div> : !destinations.length ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center"><MapPinned className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-medium text-slate-700">Aucune destination exploitable pour le moment</p><p className="mt-1 text-sm text-slate-500">Le tableau se renseignera dès que les évaluations comporteront une destination.</p></div> : <>
            <div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Demandes qualifiées</p><p className="mt-2 text-3xl font-black text-blue-950">{totalDemand}</p></div><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Destination la plus demandée</p><p className="mt-2 truncate text-xl font-black text-emerald-950">{topDestination?.destination}</p><p className="mt-1 text-sm text-emerald-800">{topDestination?.total} évaluation(s)</p></div><div className="rounded-xl border border-violet-100 bg-violet-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Destinations actives</p><p className="mt-2 text-3xl font-black text-violet-950">{destinations.length}</p></div></div>
            <div className="h-[320px] w-full" aria-label="Graphique des destinations les plus demandées"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 12, right: 8, left: -20, bottom: 48 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="destination" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} formatter={(value: number) => [`${value} évaluation(s)`, "Demandes"]} /><Bar dataKey="total" name="Demandes" fill="#2563eb" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
            <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Destination</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2 text-right">À traiter</th><th className="px-3 py-2 text-right">Contactées</th><th className="px-3 py-2 text-right">Clôturées</th></tr></thead><tbody>{destinations.slice(0, 15).map((item) => <tr key={item.destination} className="border-b border-slate-100"><td className="px-3 py-3 font-medium text-slate-800">{item.destination}</td><td className="px-3 py-3 text-right font-semibold">{item.total}</td><td className="px-3 py-3 text-right text-amber-700">{item.pending + item.reviewed}</td><td className="px-3 py-3 text-right text-blue-700">{item.contacted}</td><td className="px-3 py-3 text-right text-emerald-700">{item.closed}</td></tr>)}</tbody></table></div>
          </>}
        </CardContent>
      </Card>
    </div>
  );
}
