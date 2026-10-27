import { useMemo, useState } from "react";
import { BookMarked, ChevronRight, Database, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import {
  CATALOG_STATUSES,
  CATALOG_STATUS_LABELS,
  COVERAGES,
  COVERAGE_LABELS,
  OFFER_REQUIREMENTS,
  OFFER_REQUIREMENT_LABELS,
  PATHWAYS,
  PATHWAY_LABELS,
  ROUTE_TYPES,
  ROUTE_TYPE_LABELS,
  SOURCE_AUTHORITIES,
  SOURCE_AUTHORITY_LABELS,
  STEP_ACTORS,
  STEP_ACTOR_LABELS,
  freshness,
  type CatalogStatus,
  type Pathway,
} from "@shared/countryCatalog";
import { WORLD_COUNTRY_ROWS } from "@shared/worldCountries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const selectClass = "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm";
const STATUS_CLASS: Record<CatalogStatus, string> = {
  draft: "border-slate-300 bg-slate-100 text-slate-700",
  needs_review: "border-amber-300 bg-amber-50 text-amber-900",
  published: "border-emerald-300 bg-emerald-50 text-emerald-900",
  retired: "border-rose-200 bg-rose-50 text-rose-800",
};
const COUNTRY_NAME = new Map(WORLD_COUNTRY_ROWS.map((row) => [row[0], row[1]]));
const REGIONS = Array.from(new Set(WORLD_COUNTRY_ROWS.map((row) => row[2]))).sort();

type MatrixRow = { countryCode: string; pathway: Pathway; coverage: string; status: CatalogStatus; checkedAt: string | null; programCount: number; sourceCount: number; verifiedSourceCount: number };

function StatusChip({ status }: { status: CatalogStatus }) {
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-bold ${STATUS_CLASS[status]}`}>{CATALOG_STATUS_LABELS[status]}</span>;
}

/**
 * Catalogue mondial des parcours : travail, études et visiteur pour les 196 pays. Une fiche ne devient visible d'un candidat
 * qu'une fois « publiée », ce que le serveur n'accepte que si une source officielle a été relue récemment.
 */
export function AdminCountryCatalog({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const matrix = trpc.countryCatalog.adminMatrix.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const refresh = () => { void utils.countryCatalog.adminMatrix.invalidate(); void utils.countryCatalog.adminCountry.invalidate(); };
  const seed = trpc.countryCatalog.adminSeed.useMutation({
    onSuccess: (result) => { toast.success("Catalogue initialisé", { description: `${result.pathways} fiches, ${result.programsAdded} dispositif(s) ajouté(s).` }); refresh(); },
    onError: (error) => toast.error("Initialisation impossible", { description: error.message }),
  });

  const rows = (matrix.data ?? []) as MatrixRow[];
  const byCountry = useMemo(() => {
    const map = new Map<string, Partial<Record<Pathway, MatrixRow>>>();
    for (const row of rows) map.set(row.countryCode, { ...(map.get(row.countryCode) ?? {}), [row.pathway]: row });
    return map;
  }, [rows]);
  const counts = useMemo(() => {
    const total: Record<CatalogStatus, number> = { draft: 0, needs_review: 0, published: 0, retired: 0 };
    for (const row of rows) total[row.status] += 1;
    return total;
  }, [rows]);

  const visible = WORLD_COUNTRY_ROWS.filter(([code, name, regionName]) => {
    if (region && regionName !== region) return false;
    if (query && !`${name} ${code}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
    if (statusFilter) {
      const entry = byCountry.get(code);
      if (!entry || !PATHWAYS.some((pathway) => entry[pathway]?.status === statusFilter)) return false;
    }
    return true;
  });
  const error = matrix.error?.message;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="admin-country-catalog-title" data-testid="admin-country-catalog">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="admin-country-catalog-title" className="flex items-center gap-2 text-lg font-black text-slate-950"><BookMarked className="h-5 w-5 text-sky-700" aria-hidden="true" />Catalogue des parcours : 196 pays</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Travail, études et visiteur pour chaque pays. Une fiche reste « À confirmer » tant que vous n'avez pas ouvert la page officielle et enregistré son adresse. Elle n'est alors pas visible des candidats.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => seed.mutate({ sessionToken })} disabled={seed.isPending}><Database className="mr-2 h-4 w-4" aria-hidden="true" />{rows.length === 0 ? "Initialiser les 196 pays" : "Compléter le catalogue"}</Button>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
        {CATALOG_STATUSES.map((status) => <span key={status} className={`rounded-full border px-3 py-1 ${STATUS_CLASS[status]}`}>{CATALOG_STATUS_LABELS[status]} : {counts[status]}</span>)}
        <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-slate-700">{rows.length} fiches sur 588</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700">Pays<Input className="mt-1" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom ou code" /></label>
        <label className="text-sm font-semibold text-slate-700">Région<select className={selectClass} value={region} onChange={(event) => setRegion(event.target.value)}><option value="">Toutes</option>{REGIONS.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700">Statut d'une fiche<select className={selectClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tous</option>{CATALOG_STATUSES.map((status) => <option key={status} value={status}>{CATALOG_STATUS_LABELS[status]}</option>)}</select></label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="max-h-[560px] overflow-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-2">Pays</th>{PATHWAYS.map((pathway) => <th key={pathway} className="p-2">{PATHWAY_LABELS[pathway]}</th>)}</tr></thead>
            <tbody>
              {visible.map(([code, name]) => {
                const entry = byCountry.get(code);
                return (
                  <tr key={code} className={`border-t border-slate-100 ${selected === code ? "bg-sky-50" : ""}`}>
                    <td className="p-2"><button type="button" className="flex items-center gap-1 text-left font-semibold text-blue-900 hover:underline" onClick={() => setSelected(code)} aria-label={`Ouvrir la fiche ${name}`}>{name}<ChevronRight className="h-3 w-3" aria-hidden="true" /></button><span className="text-xs text-slate-500">{code}</span></td>
                    {PATHWAYS.map((pathway) => <td key={pathway} className="p-2">{entry?.[pathway] ? <StatusChip status={entry[pathway]!.status} /> : <span className="text-xs text-slate-400">—</span>}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 ? <p className="p-4 text-sm text-slate-500">Aucun pays ne correspond.</p> : null}
        </div>
        <div>{selected ? <CountryDetail key={selected} sessionToken={sessionToken} countryCode={selected} onChanged={refresh} /> : <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">Choisissez un pays pour voir et modifier ses fiches.</p>}</div>
      </div>
    </section>
  );
}

type Detail = inferRouterOutputs<AppRouter>["countryCatalog"]["adminCountry"];

function CountryDetail({ sessionToken, countryCode, onChanged }: { sessionToken: string; countryCode: string; onChanged: () => void }) {
  const detail = trpc.countryCatalog.adminCountry.useQuery({ sessionToken, countryCode }, { retry: false });
  const [pathway, setPathway] = useState<Pathway>("work");
  const changed = () => { void detail.refetch(); onChanged(); };
  const fail = (title: string) => (error: { message: string }) => toast.error(title, { description: error.message });
  const data = detail.data as Detail | undefined;

  return (
    <div className="rounded-lg border border-slate-200 p-4" data-testid="admin-country-catalog-detail">
      <h3 className="text-base font-black text-slate-950">{COUNTRY_NAME.get(countryCode) ?? countryCode} <span className="text-xs font-semibold text-slate-500">{countryCode}</span></h3>
      <div className="mt-3 flex gap-2" role="tablist" aria-label="Parcours">
        {PATHWAYS.map((item) => <button key={item} type="button" role="tab" aria-selected={pathway === item} onClick={() => setPathway(item)} className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${pathway === item ? "border-blue-800 bg-blue-800 text-white" : "border-slate-300 bg-white text-slate-700"}`}>{PATHWAY_LABELS[item]}</button>)}
      </div>
      {detail.isLoading ? <p className="mt-4 text-sm text-slate-500">Chargement…</p> : null}
      {detail.error ? <p className="mt-4 text-sm text-rose-700" role="alert">{detail.error.message}</p> : null}
      {data ? (
        <details className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3" open data-testid="admin-country-all-sources">
          <summary className="cursor-pointer text-sm font-black text-sky-950">Toutes les sources officielles de ce pays ({data.sources.length}) · visibles uniquement ici</summary>
          <p className="mt-1 text-xs text-sky-900">Les candidats ne voient aucun lien officiel : ils lisent le détail et lancent leur procédure avec l'agence.</p>
          {data.sources.length === 0 ? <p className="mt-2 text-sm text-slate-600">Aucune source enregistrée.</p> : (
            <ul className="mt-2 space-y-1 text-sm">
              {data.sources.map((source) => (
                <li key={source.id} className="break-words">
                  <span className="font-semibold text-slate-900">{PATHWAY_LABELS[source.pathway]}</span> · {source.label} · <a className="text-blue-800 underline" href={source.url} target="_blank" rel="noreferrer">{source.url}</a>
                  <span className="text-xs text-slate-500"> · {source.status === "verified" ? "vérifiée" : "à confirmer"} · {freshness(source.checkedAt) === "never" ? "jamais relue" : freshness(source.checkedAt) === "stale" ? "à reconfirmer" : `relue le ${new Date(source.checkedAt as unknown as string).toLocaleDateString("fr-FR")}`}</span>
                </li>
              ))}
            </ul>
          )}
        </details>
      ) : null}
      {data ? <PathwayEditor key={pathway} sessionToken={sessionToken} data={data} pathway={pathway} onChanged={changed} fail={fail} /> : null}
    </div>
  );
}

function PathwayEditor({ sessionToken, data, pathway, onChanged, fail }: { sessionToken: string; data: Detail; pathway: Pathway; onChanged: () => void; fail: (title: string) => (error: { message: string }) => void }) {
  const row = data.pathways.find((item) => item.pathway === pathway);
  const programs = data.programs.filter((program) => program.pathway === pathway);
  const sources = data.sources.filter((source) => source.pathway === pathway);
  const [coverage, setCoverage] = useState<string>(row?.coverage ?? "to_document");
  const [summary, setSummary] = useState(row?.summary ?? "");
  const [status, setStatus] = useState<CatalogStatus>((row?.status as CatalogStatus) ?? "needs_review");
  const [markChecked, setMarkChecked] = useState(false);

  const savePathway = trpc.countryCatalog.adminSavePathway.useMutation({ onSuccess: () => { toast.success("Fiche enregistrée"); onChanged(); }, onError: fail("Fiche refusée") });
  const staleLabel = (date: string | Date | null | undefined) => (freshness(date) === "never" ? "jamais relue" : freshness(date) === "stale" ? "à reconfirmer" : `relue le ${new Date(date as string).toLocaleDateString("fr-FR")}`);

  return (
    <div className="mt-4 space-y-5">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Couverture<select className={selectClass} value={coverage} onChange={(event) => setCoverage(event.target.value)}>{COVERAGES.map((item) => <option key={item} value={item}>{COVERAGE_LABELS[item]}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">Statut<select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value as CatalogStatus)}>{CATALOG_STATUSES.map((item) => <option key={item} value={item}>{CATALOG_STATUS_LABELS[item]}</option>)}</select></label>
        </div>
        <label className="block text-sm font-semibold text-slate-700">Résumé affiché au candidat<Textarea className="mt-1" rows={3} maxLength={1500} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Ce que le candidat doit comprendre en une phrase, sans chiffre non sourcé." /></label>
        <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-1" checked={markChecked} onChange={(event) => setMarkChecked(event.target.checked)} />J'ai relu les pages officielles de cette fiche aujourd'hui.</label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => savePathway.mutate({ sessionToken, countryCode: data.countryCode, pathway, coverage: coverage as (typeof COVERAGES)[number], summary, status, markChecked })} disabled={savePathway.isPending}><Save className="mr-2 h-4 w-4" aria-hidden="true" />Enregistrer la fiche</Button>
          <span className="text-xs text-slate-500">{row ? staleLabel(row.checkedAt) : "fiche absente : utilisez « Compléter le catalogue »"}</span>
        </div>
        {status === "published" ? <p className="text-xs text-slate-500">La publication exige au moins une source vérifiée récemment, une adresse https et un dispositif ou un résumé.</p> : null}
      </div>

      <ProgramsEditor sessionToken={sessionToken} data={data} pathway={pathway} programs={programs} onChanged={onChanged} fail={fail} />
      <SourcesEditor sessionToken={sessionToken} data={data} pathway={pathway} sources={sources} onChanged={onChanged} fail={fail} staleLabel={staleLabel} />
    </div>
  );
}

function ProgramsEditor({ sessionToken, data, pathway, programs, onChanged, fail }: { sessionToken: string; data: Detail; pathway: Pathway; programs: Detail["programs"]; onChanged: () => void; fail: (title: string) => (error: { message: string }) => void }) {
  const [draft, setDraft] = useState({ officialName: "", routeType: "", offerRequired: "", note: "" });
  const save = trpc.countryCatalog.adminSaveProgram.useMutation({ onSuccess: () => { toast.success("Dispositif enregistré"); setDraft({ officialName: "", routeType: "", offerRequired: "", note: "" }); onChanged(); }, onError: fail("Dispositif refusé") });
  const remove = trpc.countryCatalog.adminDeleteProgram.useMutation({ onSuccess: onChanged, onError: fail("Suppression impossible") });
  const setProgramStatus = (program: Detail["programs"][number], next: CatalogStatus) => save.mutate({
    sessionToken, id: program.id, countryCode: data.countryCode, pathway, officialName: program.officialName, nameFr: program.nameFr, programRef: program.programRef, legalBasis: program.legalBasis,
    routeType: program.routeType, offerRequired: program.offerRequired, sponsorLicenceRequired: program.sponsorLicenceRequired, labourMarketTest: program.labourMarketTest,
    salaryNote: program.salaryNote, durationNote: program.durationNote, renewable: program.renewable, familyAllowed: program.familyAllowed, residencePathNote: program.residencePathNote,
    feesNote: program.feesNote, processingNote: program.processingNote, status: next,
  });

  return (
    <div>
      <h4 className="text-sm font-black text-slate-950">Dispositifs ({programs.length})</h4>
      <ul className="mt-2 space-y-2">
        {programs.map((program) => (
          <li key={program.id} className="rounded-md border border-slate-200 p-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0"><p className="font-semibold text-slate-900">{program.officialName}</p><p className="text-xs text-slate-500">{[program.routeType ? ROUTE_TYPE_LABELS[program.routeType] : null, program.offerRequired ? OFFER_REQUIREMENT_LABELS[program.offerRequired] : null].filter(Boolean).join(" · ") || "Type à préciser"}</p></div>
              <div className="flex items-center gap-2">
                <select aria-label="Statut du dispositif" className="h-8 rounded-md border border-slate-300 bg-white px-1 text-xs" value={program.status} onChange={(event) => setProgramStatus(program, event.target.value as CatalogStatus)}>{CATALOG_STATUSES.map((item) => <option key={item} value={item}>{CATALOG_STATUS_LABELS[item]}</option>)}</select>
                <Button type="button" variant="ghost" size="sm" aria-label={`Supprimer ${program.officialName}`} onClick={() => remove.mutate({ sessionToken, id: program.id })}><Trash2 className="h-4 w-4 text-rose-700" aria-hidden="true" /></Button>
              </div>
            </div>
            <StepsEditor sessionToken={sessionToken} program={program} steps={data.steps.filter((step) => step.programId === program.id)} onChanged={onChanged} fail={fail} />
          </li>
        ))}
        {programs.length === 0 ? <li className="text-sm text-slate-500">Aucun dispositif enregistré.</li> : null}
      </ul>
      <div className="mt-3 grid gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Nom officiel du dispositif<Input className="mt-1" value={draft.officialName} onChange={(event) => setDraft({ ...draft, officialName: event.target.value })} maxLength={200} /></label>
        {pathway === "work" ? (
          <>
            <label className="text-xs font-semibold text-slate-700">Type de route<select className={selectClass} value={draft.routeType} onChange={(event) => setDraft({ ...draft, routeType: event.target.value })}><option value="">À préciser</option>{ROUTE_TYPES.map((item) => <option key={item} value={item}>{ROUTE_TYPE_LABELS[item]}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-700">Offre d'emploi<select className={selectClass} value={draft.offerRequired} onChange={(event) => setDraft({ ...draft, offerRequired: event.target.value })}><option value="">À préciser</option>{OFFER_REQUIREMENTS.map((item) => <option key={item} value={item}>{OFFER_REQUIREMENT_LABELS[item]}</option>)}</select></label>
          </>
        ) : null}
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Délais et frais indicatifs, avec leur source<Textarea className="mt-1" rows={2} maxLength={1500} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} /></label>
        <div className="sm:col-span-2"><Button type="button" size="sm" disabled={save.isPending || draft.officialName.trim().length < 2} onClick={() => save.mutate({ sessionToken, countryCode: data.countryCode, pathway, officialName: draft.officialName, routeType: (draft.routeType || null) as (typeof ROUTE_TYPES)[number] | null, offerRequired: (draft.offerRequired || null) as (typeof OFFER_REQUIREMENTS)[number] | null, processingNote: draft.note, status: "needs_review" })}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Ajouter le dispositif</Button></div>
      </div>
    </div>
  );
}

function StepsEditor({ sessionToken, program, steps, onChanged, fail }: { sessionToken: string; program: Detail["programs"][number]; steps: Detail["steps"]; onChanged: () => void; fail: (title: string) => (error: { message: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ actor: "candidate", title: "", description: "", delayNote: "", feeNote: "", officialUrl: "" });
  const save = trpc.countryCatalog.adminSaveStep.useMutation({ onSuccess: () => { toast.success("Étape enregistrée"); setDraft({ actor: "candidate", title: "", description: "", delayNote: "", feeNote: "", officialUrl: "" }); onChanged(); }, onError: fail("Étape refusée") });
  const remove = trpc.countryCatalog.adminDeleteStep.useMutation({ onSuccess: onChanged, onError: fail("Suppression impossible") });
  const nextNo = steps.reduce((max, step) => Math.max(max, step.stepNo), 0) + 1;

  return (
    <div className="mt-2">
      <button type="button" className="text-xs font-semibold text-blue-800 underline underline-offset-2" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Masquer les étapes" : `Étapes (${steps.length})`}</button>
      {open ? (
        <div className="mt-2 space-y-2">
          <ol className="space-y-1">
            {steps.map((step) => (
              <li key={step.id} className="flex items-start justify-between gap-2 rounded bg-white p-2 text-xs ring-1 ring-slate-200">
                <div className="min-w-0"><p><span className="font-bold">{step.stepNo}. {STEP_ACTOR_LABELS[step.actor]}</span> · {step.title}</p>{step.description ? <p className="text-slate-600">{step.description}</p> : null}{step.officialUrl ? <a className="inline-flex items-center gap-1 text-blue-800 underline" href={step.officialUrl} target="_blank" rel="noreferrer">Source<ExternalLink className="h-3 w-3" aria-hidden="true" /></a> : null}</div>
                <Button type="button" variant="ghost" size="sm" aria-label={`Supprimer l'étape ${step.stepNo}`} onClick={() => remove.mutate({ sessionToken, id: step.id })}><Trash2 className="h-3 w-3 text-rose-700" aria-hidden="true" /></Button>
              </li>
            ))}
          </ol>
          <div className="grid gap-2 rounded bg-white p-2 ring-1 ring-slate-200 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">Qui<select className={selectClass} value={draft.actor} onChange={(event) => setDraft({ ...draft, actor: event.target.value })}>{STEP_ACTORS.map((item) => <option key={item} value={item}>{STEP_ACTOR_LABELS[item]}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-700">Étape<Input className="mt-1" maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Détail<Textarea className="mt-1" rows={2} maxLength={2000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-700">Délai indicatif<Input className="mt-1" maxLength={300} value={draft.delayNote} onChange={(event) => setDraft({ ...draft, delayNote: event.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-700">Frais indicatifs<Input className="mt-1" maxLength={300} value={draft.feeNote} onChange={(event) => setDraft({ ...draft, feeNote: event.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Lien officiel (https)<Input className="mt-1" maxLength={600} value={draft.officialUrl} onChange={(event) => setDraft({ ...draft, officialUrl: event.target.value })} placeholder="https://" /></label>
            <div className="sm:col-span-2"><Button type="button" size="sm" disabled={save.isPending || draft.title.trim().length < 2} onClick={() => save.mutate({ sessionToken, programId: program.id, stepNo: nextNo, actor: draft.actor as (typeof STEP_ACTORS)[number], title: draft.title, description: draft.description, delayNote: draft.delayNote, feeNote: draft.feeNote, officialUrl: draft.officialUrl || null, status: "needs_review" })}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Ajouter l'étape {nextNo}</Button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SourcesEditor({ sessionToken, data, pathway, sources, onChanged, fail, staleLabel }: { sessionToken: string; data: Detail; pathway: Pathway; sources: Detail["sources"]; onChanged: () => void; fail: (title: string) => (error: { message: string }) => void; staleLabel: (date: string | Date | null | undefined) => string }) {
  const [draft, setDraft] = useState({ label: "", url: "", authority: "immigration", verified: false });
  const save = trpc.countryCatalog.adminSaveSource.useMutation({ onSuccess: () => { toast.success("Source enregistrée"); setDraft({ label: "", url: "", authority: "immigration", verified: false }); onChanged(); }, onError: fail("Source refusée") });
  const remove = trpc.countryCatalog.adminDeleteSource.useMutation({ onSuccess: onChanged, onError: fail("Suppression impossible") });

  return (
    <div>
      <h4 className="text-sm font-black text-slate-950">Sources officielles ({sources.length})</h4>
      <ul className="mt-2 space-y-2">
        {sources.map((source) => (
          <li key={source.id} className="flex items-start justify-between gap-2 rounded-md border border-slate-200 p-3 text-sm">
            <div className="min-w-0"><p className="font-semibold text-slate-900">{source.label}</p><a className="inline-flex items-center gap-1 break-all text-xs text-blue-800 underline" href={source.url} target="_blank" rel="noreferrer">{source.url}<ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" /></a><p className="text-xs text-slate-500">{SOURCE_AUTHORITY_LABELS[source.authority]} · {source.status === "verified" ? "vérifiée" : "à confirmer"} · {staleLabel(source.checkedAt)}</p></div>
            <Button type="button" variant="ghost" size="sm" aria-label={`Supprimer ${source.label}`} onClick={() => remove.mutate({ sessionToken, id: source.id })}><Trash2 className="h-4 w-4 text-rose-700" aria-hidden="true" /></Button>
          </li>
        ))}
        {sources.length === 0 ? <li className="text-sm text-slate-500">Aucune source : la fiche ne peut pas être publiée.</li> : null}
      </ul>
      <div className="mt-3 grid gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700">Nom de la page<Input className="mt-1" maxLength={200} value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} /></label>
        <label className="text-xs font-semibold text-slate-700">Autorité<select className={selectClass} value={draft.authority} onChange={(event) => setDraft({ ...draft, authority: event.target.value })}>{SOURCE_AUTHORITIES.map((item) => <option key={item} value={item}>{SOURCE_AUTHORITY_LABELS[item]}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Adresse officielle (https)<Input className="mt-1" maxLength={600} value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="https://" /></label>
        <label className="flex items-start gap-2 text-xs text-slate-700 sm:col-span-2"><input type="checkbox" className="mt-0.5" checked={draft.verified} onChange={(event) => setDraft({ ...draft, verified: event.target.checked })} />J'ai ouvert cette page aujourd'hui et son contenu correspond à la fiche.</label>
        <div className="sm:col-span-2"><Button type="button" size="sm" disabled={save.isPending || draft.label.trim().length < 2 || !draft.url.trim()} onClick={() => save.mutate({ sessionToken, countryCode: data.countryCode, pathway, label: draft.label, url: draft.url, authority: draft.authority as (typeof SOURCE_AUTHORITIES)[number], markVerified: draft.verified })}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Ajouter la source</Button></div>
      </div>
    </div>
  );
}
