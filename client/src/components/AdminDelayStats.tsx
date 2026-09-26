import { useState } from "react";
import { ChevronDown, ChevronRight, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { MIN_RELIABLE_SAMPLE, formatHours, stageLabel } from "@shared/delayStats";

/**
 * Délais réels de traitement : tenue de l'échéance des bilans et durée médiane entre deux étapes. Chiffres calculés depuis les dates
 * enregistrées (jamais estimés) ; sous 5 cas, une médiane n'est qu'un ordre de grandeur et l'affichage le dit.
 */
export default function AdminDelayStats({ sessionToken }: { sessionToken: string }) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(180);
  const query = trpc.delayStats.get.useQuery({ sessionToken, days }, { enabled: Boolean(sessionToken), staleTime: 5 * 60_000, retry: 1 });
  const data = query.data;
  const bilans = data?.bilans;
  const withDeadline = bilans ? bilans.onTime + bilans.late : 0;
  const rate = withDeadline > 0 && bilans ? Math.round((bilans.onTime / withDeadline) * 100) : null;

  return (
    <Card className="border-slate-200 p-5" data-testid="delay-stats">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h2 className="flex items-center gap-2 text-base font-black text-slate-950"><Timer className="h-4 w-4 text-blue-700" aria-hidden="true" />Délais réels de traitement</h2>
          <p className="mt-1 text-sm text-slate-600">
            {query.isLoading ? "Chargement…" : query.error ? "Statistiques indisponibles pour le moment." : bilans && bilans.overduePending > 0 ? `${bilans.overduePending} bilan${bilans.overduePending > 1 ? "s" : ""} sans réponse après l’échéance.` : rate !== null ? `${rate}% des bilans envoyés dans le délai sur ${days} jours.` : "Pas encore assez de bilans avec échéance pour calculer un taux."}
          </p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
      </button>

      {open && data && bilans && (
        <div className="mt-4 space-y-5">
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="delay-period" className="font-semibold text-slate-700">Période</label>
            <select id="delay-period" value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded-md border border-slate-300 bg-white px-2 py-1">
              {[30, 90, 180, 365].map((value) => <option key={value} value={value}>{value} jours</option>)}
            </select>
          </div>

          <section aria-label="Bilans d’évaluation" data-testid="bilan-delays">
            <h3 className="text-sm font-black text-slate-900">Bilans d’évaluation</h3>
            <dl className="mt-2 grid gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-[11px] font-semibold text-slate-500">Réponses envoyées</dt><dd className="text-xl font-black text-slate-950">{bilans.answered}</dd></div>
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-[11px] font-semibold text-slate-500">Délai médian de réponse</dt><dd className="text-xl font-black text-slate-950">{bilans.medianHours === null ? "—" : formatHours(bilans.medianHours)}</dd></div>
              <div className="rounded-xl bg-emerald-50 p-3"><dt className="text-[11px] font-semibold text-emerald-700">Dans le délai</dt><dd className="text-xl font-black text-emerald-900">{bilans.onTime}<span className="ml-1 text-sm font-bold text-emerald-700">{rate !== null ? `(${rate}%)` : ""}</span></dd></div>
              <div className={`rounded-xl p-3 ${bilans.late + bilans.overduePending > 0 ? "bg-rose-50" : "bg-slate-50"}`}><dt className="text-[11px] font-semibold text-rose-700">En retard ou sans réponse</dt><dd className="text-xl font-black text-rose-900">{bilans.late} <span className="text-sm font-bold">+ {bilans.overduePending} en attente</span></dd></div>
            </dl>
            {bilans.noDeadline > 0 && <p className="mt-1 text-[11px] text-slate-500">{bilans.noDeadline} réponse{bilans.noDeadline > 1 ? "s" : ""} envoyée{bilans.noDeadline > 1 ? "s" : ""} sans échéance enregistrée, non comptée{bilans.noDeadline > 1 ? "s" : ""} dans le taux.</p>}
          </section>

          <section aria-label="Durée entre les étapes" data-testid="stage-delays">
            <h3 className="text-sm font-black text-slate-900">Durée médiane entre deux étapes</h3>
            {data.stages.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">Aucun changement d’étape enregistré sur la période.</p>
            ) : (
              <table className="mt-2 w-full text-sm">
                <thead><tr className="border-b border-slate-200 text-left text-xs text-slate-500"><th className="py-1.5 pr-3 font-semibold">Passage</th><th className="py-1.5 pr-3 text-right font-semibold">Durée médiane</th><th className="py-1.5 text-right font-semibold">Dossiers</th></tr></thead>
                <tbody>
                  {data.stages.map((stage) => (
                    <tr key={`${stage.from}-${stage.to}`} className="border-b border-slate-100" data-testid="stage-row">
                      <td className="py-1.5 pr-3 text-slate-800">{stageLabel(stage.from)} → {stageLabel(stage.to)}</td>
                      <td className="py-1.5 pr-3 text-right font-bold text-slate-950">{String(stage.medianDays).replace(".", ",")} j</td>
                      <td className="py-1.5 text-right text-slate-600">{stage.count}{stage.count < MIN_RELIABLE_SAMPLE ? <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-900" title="Échantillon trop petit : ordre de grandeur seulement">indicatif</span> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </Card>
  );
}
