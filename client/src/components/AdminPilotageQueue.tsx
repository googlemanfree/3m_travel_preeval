import { useState } from "react";
import { AlertTriangle, CheckCircle2, FileCheck2, Hourglass, RefreshCw, Rocket } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Category = "ready_to_activate" | "documents_to_review" | "stalled";
type Item = { id: string; category: Category; openId: string; reference: string; fullName: string; title: string; detail: string; ageDays: number; severity: "high" | "medium" | "low"; count: number };

const CATEGORY_META: Record<Category, { label: string; icon: typeof Rocket; tone: string }> = {
  ready_to_activate: { label: "Prêts à activer", icon: Rocket, tone: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  documents_to_review: { label: "Pièces à contrôler", icon: FileCheck2, tone: "border-blue-200 bg-blue-50 text-blue-900" },
  stalled: { label: "Sans mouvement", icon: Hourglass, tone: "border-amber-200 bg-amber-50 text-amber-900" },
};
const SEVERITY_STYLE: Record<Item["severity"], string> = { high: "border-rose-300 bg-rose-50", medium: "border-amber-200 bg-white", low: "border-slate-200 bg-white" };
const SEVERITY_LABEL: Record<Item["severity"], string> = { high: "Urgent", medium: "À traiter", low: "Récent" };
const PAGE = 12;

/** File de pilotage prioritaire : ce qui attend une action de l'équipe, du plus urgent au moins urgent. Rafraîchie toutes les minutes. */
export default function AdminPilotageQueue({ sessionToken, onOpen }: { sessionToken: string; onOpen: (openId: string) => void }) {
  const query = trpc.adminCandidateManagement.getPilotageQueue.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false, refetchInterval: 60_000 });
  const [filter, setFilter] = useState<Category | "all">("all");
  const [visible, setVisible] = useState(PAGE);
  const items = ((query.data?.items ?? []) as Item[]).filter((item) => filter === "all" || item.category === filter);
  const summary = query.data?.summary;

  return (
    <Card className="border-blue-100" data-testid="pilotage-queue">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-950">Priorités de l’équipe</h2>
            <p className="mt-1 text-sm text-slate-600">Ce qui attend une action, du plus urgent au moins urgent. Cliquez sur une ligne pour ouvrir le dossier.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching} className="gap-1.5"><RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />Actualiser</Button>
        </div>

        {query.isLoading ? <p className="text-sm text-slate-500">Analyse des dossiers…</p> : query.error ? (
          <p className="text-sm text-rose-700" role="alert">Impossible de charger les priorités : {query.error.message}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les priorités">
              <button type="button" onClick={() => { setFilter("all"); setVisible(PAGE); }} aria-pressed={filter === "all"} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${filter === "all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"}`}>
                Tout ({summary?.total ?? 0}){summary && summary.high > 0 ? <span className="ml-1 text-rose-300">· {summary.high} urgent(s)</span> : null}
              </button>
              {(Object.keys(CATEGORY_META) as Category[]).map((category) => {
                const meta = CATEGORY_META[category];
                const Icon = meta.icon;
                const count = category === "ready_to_activate" ? summary?.readyToActivate : category === "documents_to_review" ? summary?.documentsToReview : summary?.stalled;
                return (
                  <button key={category} type="button" onClick={() => { setFilter(category); setVisible(PAGE); }} aria-pressed={filter === category} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${filter === category ? "ring-2 ring-slate-900" : ""} ${meta.tone}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />{meta.label} ({count ?? 0})
                  </button>
                );
              })}
            </div>

            {items.length === 0 ? (
              <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Aucune action en attente dans cette file.</p>
            ) : (
              <ul className="space-y-2">
                {items.slice(0, visible).map((item) => {
                  const meta = CATEGORY_META[item.category];
                  const Icon = meta.icon;
                  return (
                    <li key={item.id}>
                      <button type="button" onClick={() => onOpen(item.openId)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition hover:border-blue-400 hover:shadow-sm ${SEVERITY_STYLE[item.severity]}`} data-testid="pilotage-row" data-severity={item.severity} aria-label={`Ouvrir le dossier de ${item.fullName} : ${item.title}`}>
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-900">{item.fullName} <span className="font-mono text-xs font-normal text-slate-500">{item.reference}</span></span>
                          <span className="block text-sm text-slate-800">{item.title}</span>
                          <span className="block text-xs text-slate-600">{item.detail}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <Badge className={item.severity === "high" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700"}>{item.severity === "high" && <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />}{SEVERITY_LABEL[item.severity]}</Badge>
                          <span className="text-[11px] text-slate-500">{item.ageDays === 0 ? "aujourd’hui" : `${item.ageDays} j`}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {items.length > visible && <Button type="button" variant="outline" size="sm" onClick={() => setVisible((current) => current + PAGE)}>Afficher {Math.min(PAGE, items.length - visible)} de plus ({items.length - visible} restants)</Button>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
