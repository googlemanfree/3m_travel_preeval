import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, ShieldCheck, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

type Props = { sessionToken: string };

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" });
}

function outcomeClass(outcome: string) {
  return outcome === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200";
}

export default function AdminAuditLogPanel({ sessionToken }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [category, setCategory] = useState<"all" | "auth" | "mutation" | "access" | "security">("all");
  const [outcome, setOutcome] = useState<"all" | "success" | "failure">("all");

  const input = useMemo(() => ({ sessionToken, page, pageSize, search, action, category, outcome }), [sessionToken, page, pageSize, search, action, category, outcome]);
  const query = trpc.adminAudit.list.useQuery(input, { enabled: Boolean(sessionToken), staleTime: 10_000 });
  const rows = query.data?.rows ?? [];

  const resetFilters = () => {
    setSearch("");
    setAction("all");
    setCategory("all");
    setOutcome("all");
    setPage(1);
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-slate-50/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ShieldCheck className="h-5 w-5 text-blue-700" /> Journal d’audit administrateur
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">Connexions, déconnexions et mutations sensibles, avec horodatage serveur et résultat.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching} className="gap-2 self-start lg:self-auto">
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Rechercher admin, action ou ressource" className="pl-9" />
          </div>
          <select value={category} onChange={(event) => { setCategory(event.target.value as typeof category); setPage(1); }} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
            <option value="all">Toutes les catégories</option>
            <option value="auth">Authentification</option>
            <option value="mutation">Modifications</option>
            <option value="access">Consultation</option>
            <option value="security">Sécurité</option>
          </select>
          <select value={outcome} onChange={(event) => { setOutcome(event.target.value as typeof outcome); setPage(1); }} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
            <option value="all">Tous les résultats</option>
            <option value="success">Réussites</option>
            <option value="failure">Échecs</option>
          </select>
          <div className="flex gap-2">
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <Button variant="ghost" size="icon" onClick={resetFilters} aria-label="Réinitialiser les filtres" title="Réinitialiser les filtres">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {query.isLoading ? (
          <div className="flex min-h-40 items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Chargement du journal…</div>
        ) : query.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Impossible de charger le journal. Vérifiez votre session administrateur et réessayez.</div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Aucun événement ne correspond aux filtres actuels.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Administrateur</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Ressource</th>
                  <th className="px-3 py-3">Résultat</th>
                  <th className="px-3 py-3">Origine</th>
                  <th className="px-3 py-3">Détails sûrs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{formatDate(row.createdAt)}</td>
                    <td className="px-3 py-3 font-medium text-slate-800">{row.adminEmail}</td>
                    <td className="max-w-[260px] break-all px-3 py-3 font-mono text-xs text-slate-700">{row.action}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{row.resourceType ? `${row.resourceType}${row.resourceId ? ` #${row.resourceId}` : ""}` : "—"}</td>
                    <td className="px-3 py-3"><Badge variant="outline" className={outcomeClass(row.outcome)}>{row.outcome === "success" ? "Réussi" : "Échec"}</Badge></td>
                    <td className="px-3 py-3 text-xs text-slate-500">{row.ipAddress || "—"}</td>
                    <td className="max-w-[260px] break-words px-3 py-3 text-xs text-slate-500">{row.details || "—"}<br /><span className="text-[10px] text-slate-400">{row.userAgent ? row.userAgent.slice(0, 80) : ""}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{query.data?.total ?? 0} événement(s) · page {query.data?.page ?? page} / {query.data?.pages ?? 1}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || query.isFetching} className="gap-1"><ChevronLeft className="h-4 w-4" /> Précédente</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.min(query.data?.pages ?? value, value + 1))} disabled={page >= (query.data?.pages ?? 1) || query.isFetching} className="gap-1">Suivante <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
