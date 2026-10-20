import { useState } from "react";
import { Compass } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

type Filters = { country: string; programFamily: string; domainId: string; flaggedOnly: boolean; incompleteOnly: boolean };
const emptyFilters: Filters = { country: "", programFamily: "", domainId: "", flaggedOnly: false, incompleteOnly: false };

function Bars({ title, rows, selected, onPick }: { title: string; rows: Array<{ key: string; label: string; count: number }>; selected: string; onPick: (key: string) => void }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section aria-label={title} className="rounded-xl border border-slate-200 p-3">
      <h3 className="text-xs font-black uppercase tracking-wide text-slate-600">{title}</h3>
      <ul className="mt-2 space-y-1">
        {rows.length === 0 && <li className="text-sm text-slate-500">Aucune donnée.</li>}
        {rows.slice(0, 8).map((row) => (
          <li key={row.key}>
            <button type="button" onClick={() => onPick(selected === row.key ? "" : row.key)} aria-pressed={selected === row.key} className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm ${selected === row.key ? "bg-sky-100 font-bold text-sky-950" : "hover:bg-slate-50"}`}>
              <span className="min-w-0 flex-1 truncate">{row.label}</span>
              <span className="h-2 w-16 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><span className="block h-full rounded-full bg-sky-600" style={{ width: `${Math.round((row.count / max) * 100)}%` }} /></span>
              <span className="w-7 text-right tabular-nums text-xs text-slate-600">{row.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Pilotage des évaluations par parcours : où en sont les dossiers pays par pays, visa par visa et domaine par domaine. */
export function AdminEvaluationJourneyBoard({ sessionToken }: { sessionToken: string }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const overview = trpc.evaluationJourneys.adminOverview.useQuery({
    sessionToken,
    country: filters.country || undefined,
    programFamily: filters.programFamily || undefined,
    domainId: filters.domainId || undefined,
    flaggedOnly: filters.flaggedOnly || undefined,
    incompleteOnly: filters.incompleteOnly || undefined,
  }, { enabled: Boolean(sessionToken), retry: false });
  const data = overview.data;
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((current) => ({ ...current, [key]: value }));
  const active = Object.values(filters).some(Boolean);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="admin-journeys-title" data-testid="admin-evaluation-journeys">
      <h2 id="admin-journeys-title" className="flex items-center gap-2 text-lg font-black text-slate-950"><Compass className="h-5 w-5 text-sky-700" aria-hidden="true" />Pilotage des évaluations par parcours</h2>
      <p className="mt-1 text-sm text-slate-600">Pays, visa ou programme, domaine, complétude et points à clarifier des évaluations reçues. Cliquez sur une ligne pour filtrer.</p>
      {overview.error && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{overview.error.message}</p>}
      {data && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5" data-testid="journey-kpis">
            {[
              ["Évaluations dynamiques", data.dynamicCount],
              ["Ancien formulaire", data.legacyCount],
              ["Complétude moyenne", `${data.averageCompleteness} %`],
              ["Points à clarifier", data.flaggedCount],
              ["Questions obligatoires manquantes", data.incompleteCount],
            ].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-3"><dt className="text-[11px] font-semibold text-slate-600">{label}</dt><dd className="text-xl font-black text-slate-950 tabular-nums">{value}</dd></div>)}
          </dl>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <Bars title="Par pays" rows={data.byCountry} selected={filters.country} onPick={(key) => set("country", key)} />
            <Bars title="Par visa ou programme" rows={data.byProgram} selected={filters.programFamily} onPick={(key) => set("programFamily", key)} />
            <Bars title="Par domaine" rows={data.byDomain} selected={filters.domainId} onPick={(key) => set("domainId", key)} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.flaggedOnly} onChange={(event) => set("flaggedOnly", event.target.checked)} />Avec points à clarifier</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.incompleteOnly} onChange={(event) => set("incompleteOnly", event.target.checked)} />Questions obligatoires manquantes</label>
            {active && <Button type="button" size="sm" variant="outline" onClick={() => setFilters(emptyFilters)}>Réinitialiser les filtres</Button>}
            <span className="ml-auto text-xs text-slate-600" aria-live="polite" data-testid="journey-matching">{data.matching} évaluation(s) correspondante(s)</span>
          </div>
          <ul className="mt-3 space-y-2" data-testid="journey-items">
            {data.items.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-slate-950">{item.fullName}</strong>
                  <span className="text-xs text-slate-500">{item.reference ?? `EVAL-${item.id}`}</span>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-900">{item.country ?? "Pays à préciser"}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">{item.programLabel}</span>
                  {item.domainLabel && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-900">{item.domainLabel}</span>}
                  <span className="ml-auto text-xs font-semibold tabular-nums text-slate-700">{item.completeness} % complété{item.missingRequired > 0 ? ` · ${item.missingRequired} obligatoire(s) manquante(s)` : ""}</span>
                </div>
                {item.flags.length > 0 && <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-amber-900">{item.flags.map((flag) => <li key={flag}>{flag}</li>)}</ul>}
                {item.firstAction && <p className="mt-1.5 text-xs text-slate-600">À suivre : {item.firstAction}</p>}
              </li>
            ))}
            {!overview.isLoading && data.items.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aucune évaluation ne correspond à ces filtres.</li>}
          </ul>
        </>
      )}
    </section>
  );
}
