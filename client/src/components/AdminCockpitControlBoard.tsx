import { useMemo, useState } from "react";
import { AlertTriangle, Gauge, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatAdminSyncTime } from "@shared/adminSync";

type Category =
  | "email_unverified"
  | "no_evaluation"
  | "payment_pending"
  | "ready_to_activate"
  | "protocol_pending"
  | "documents_pending";

const CATEGORY_ORDER: Category[] = [
  "email_unverified",
  "no_evaluation",
  "payment_pending",
  "ready_to_activate",
  "protocol_pending",
  "documents_pending",
];

const URGENCY_STYLE = {
  high: "border-rose-200 bg-rose-50",
  normal: "border-amber-200 bg-white",
  low: "border-slate-200 bg-white",
} as const;

export default function AdminCockpitControlBoard({
  sessionToken,
  onOpen,
}: {
  sessionToken: string;
  onOpen: (openId: string) => void;
}) {
  const query = trpc.adminCandidateManagement.listCockpitControlBoard.useQuery(
    { sessionToken },
    { enabled: Boolean(sessionToken), refetchInterval: 60_000 },
  );
  const [filter, setFilter] = useState<Category | "all">("all");
  const [visible, setVisible] = useState(16);

  const items = useMemo(() => {
    const rows = query.data?.items ?? [];
    return filter === "all" ? rows : rows.filter((row) => row.category === filter);
  }, [query.data?.items, filter]);

  const counts = query.data?.counts;
  const labels = query.data?.labels;

  return (
    <Card className="border-cyan-100" data-testid="cockpit-control-board">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
              <Gauge className="h-4 w-4 text-cyan-700" />
              Contrôle total — files actionnables
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Chaque ligne attend une action admin précise. Cliquez pour ouvrir le dossier / pré-dossier.
            </p>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              {query.isFetching
                ? "Synchronisation…"
                : query.dataUpdatedAt
                  ? `Dernière sync : ${formatAdminSyncTime(new Date(query.dataUpdatedAt))}`
                  : formatAdminSyncTime(null)}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {query.isLoading ? (
          <p className="text-sm text-slate-500">Analyse du contrôle dossiers…</p>
        ) : query.isError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
            Impossible de charger le tableau de contrôle : {query.error.message}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les files de contrôle">
              <button
                type="button"
                onClick={() => { setFilter("all"); setVisible(16); }}
                aria-pressed={filter === "all"}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${filter === "all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"}`}
              >
                Tout ({counts?.total ?? 0})
                {counts && counts.high > 0 ? <span className="ml-1 text-rose-300">· {counts.high} urgent(s)</span> : null}
              </button>
              {CATEGORY_ORDER.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => { setFilter(category); setVisible(16); }}
                  aria-pressed={filter === category}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${filter === category ? "ring-2 ring-slate-900" : ""} border-cyan-200 bg-cyan-50 text-cyan-950`}
                >
                  {labels?.[category] ?? category} ({counts?.[category] ?? 0})
                </button>
              ))}
            </div>

            {items.length === 0 ? (
              <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">Aucune file actionnable pour ce filtre.</p>
            ) : (
              <ul className="space-y-2">
                {items.slice(0, visible).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(item.openId)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition hover:border-cyan-400 hover:shadow-sm ${URGENCY_STYLE[item.urgency]}`}
                    >
                      <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${item.urgency === "high" ? "text-rose-600" : "text-amber-600"}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{item.fullName}</span>
                          <span className="font-mono text-[11px] text-slate-500">{item.reference}</span>
                          <Badge variant="outline" className="border-cyan-200 bg-white text-cyan-900">{item.categoryLabel}</Badge>
                          <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{item.progressPercent}%</Badge>
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-slate-800">{item.nextActionLabel}</span>
                        <span className="mt-0.5 block text-xs text-slate-600">{item.stageLabel}</span>
                        {item.blockers[0] ? <span className="mt-1 block text-xs text-slate-500">{item.blockers[0]}</span> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {items.length > visible ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setVisible((value) => value + 16)}>
                Afficher plus ({items.length - visible} restants)
              </Button>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
