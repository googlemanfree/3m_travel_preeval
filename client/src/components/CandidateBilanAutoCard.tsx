import { Bot, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

/**
 * Bilan automatisé du candidat, dans l'onglet « Évaluation » de la fiche 360°.
 * Requête dédiée, lancée seulement quand l'onglet est ouvert : la fiche elle-même n'en est pas alourdie.
 * Invisible si le bilan automatisé n'est pas activé ou si le candidat n'a aucun traitement.
 */
export function bilanTone(row: { state: string; reviewStatus: string }): string {
  if (row.state === "ready_for_review") return "border-amber-300 bg-amber-50 text-amber-950";
  if (row.state === "failed" || row.state === "retry_pending") return "border-rose-200 bg-rose-50 text-rose-900";
  if (row.state === "needs_information") return "border-indigo-200 bg-indigo-50 text-indigo-900";
  if (row.state === "published") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

export default function CandidateBilanAutoCard({ sessionToken, email, active }: { sessionToken: string; email: string; active: boolean }) {
  const query = trpc.adminBilanAuto.forCandidate.useQuery(
    { sessionToken, email },
    { enabled: Boolean(active && sessionToken && email), retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
  );
  if (!query.data || !query.data.enabled || query.data.rows.length === 0) return null;
  const href = `/admin/bilans?q=${encodeURIComponent(email)}`;
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4" data-testid="candidate360-bilan-auto">
      <h4 className="flex items-center gap-2 font-semibold text-emerald-950"><Bot className="h-4 w-4 text-emerald-700" />Bilan automatisé</h4>
      <ul className="mt-3 space-y-2">
        {query.data.rows.map((row) => (
          <li key={row.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${bilanTone(row)}`} data-testid="candidate360-bilan-auto-row">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-white/70">{row.stateLabel}</Badge>
              {row.score !== null && row.scoreMax ? <span className="font-semibold">{row.score}/{row.scoreMax}{row.thresholdReached === null ? "" : row.thresholdReached ? " · seuil atteint" : " · seuil non atteint"}</span> : null}
              {row.complementCount > 0 ? <span>{row.complementCount} complément(s) demandé(s)</span> : null}
              {row.flagCount > 0 ? <span>{row.flagCount} point(s) à vérifier</span> : null}
              {row.state === "failed" && row.lastError ? <span className="text-xs">{row.lastError.slice(0, 120)}</span> : null}
            </div>
            <a href={href} className="inline-flex items-center gap-1 text-xs font-bold underline" data-testid="candidate360-bilan-auto-open">
              {row.state === "ready_for_review" ? "Relire et valider" : "Ouvrir dans la supervision"}<ExternalLink className="h-3 w-3" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
