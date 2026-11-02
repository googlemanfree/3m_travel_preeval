import { useState, type ReactNode } from "react";
import { Compass, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import {
  STAY_CATEGORIES,
  STAY_CATEGORY_LABELS,
  STAY_REQUEST_LABELS,
  STAY_REQUEST_STATUSES,
  STAY_STATUSES,
  stayPriceFresh,
  type StayRequestStatus,
} from "@shared/stayPrograms";
import { scanOfferText } from "@shared/jobOffers";
import { CATALOG_STATUS_LABELS } from "@shared/countryCatalog";
import { WORLD_COUNTRY_ROWS } from "@shared/worldCountries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Programs = inferRouterOutputs<AppRouter>["stayPrograms"]["adminPrograms"];
type Requests = inferRouterOutputs<AppRouter>["stayPrograms"]["adminRequests"];
type Draft = {
  id?: number; countryCode: string; city: string; title: string; category: (typeof STAY_CATEGORIES)[number]; summary: string; description: string;
  durationDaysMin: string; durationDaysMax: string; seasonNote: string; includedNote: string; visaNote: string;
  priceFrom: string; priceCurrency: string; priceBasis: string; priceSourceNote: string; providerNote: string;
  status: (typeof STAY_STATUSES)[number]; reviewedToday: boolean; priceReviewedToday: boolean;
};
const emptyDraft: Draft = { countryCode: "FR", city: "", title: "", category: "discovery", summary: "", description: "", durationDaysMin: "", durationDaysMax: "", seasonNote: "", includedNote: "", visaNote: "", priceFrom: "", priceCurrency: "", priceBasis: "par personne", priceSourceNote: "", providerNote: "", status: "needs_review", reviewedToday: false, priceReviewedToday: false };
const selectClass = "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm";
const Field = ({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) => <label className={`text-xs font-semibold text-slate-700 ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
const toNumber = (value: string) => { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : null; };

/** Séjours visiteurs : catalogue modéré (prix avec provenance relue) et file des demandes de devis. */
export function AdminStayPrograms({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const [view, setView] = useState<"programs" | "requests">("programs");
  const [draft, setDraft] = useState<Draft | null>(null);
  const programs = trpc.stayPrograms.adminPrograms.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const requests = trpc.stayPrograms.adminRequests.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const refresh = () => { void utils.stayPrograms.adminPrograms.invalidate(); void utils.stayPrograms.adminRequests.invalidate(); };
  const save = trpc.stayPrograms.adminSaveProgram.useMutation({ onSuccess: () => { toast.success("Séjour enregistré"); setDraft(null); refresh(); }, onError: (error) => toast.error("Enregistrement impossible", { description: error.message }) });
  const remove = trpc.stayPrograms.adminDeleteProgram.useMutation({ onSuccess: (result) => { toast.success(result.retired ? "Séjour retiré (des demandes existent)" : "Séjour supprimé"); refresh(); }, onError: (error) => toast.error("Suppression impossible", { description: error.message }) });
  const setStatus = trpc.stayPrograms.adminSetRequestStatus.useMutation({ onSuccess: () => { toast.success("Demande mise à jour"); refresh(); }, onError: (error) => toast.error("Mise à jour impossible", { description: error.message }) });

  const rows = (programs.data ?? []) as Programs;
  const queue = (requests.data ?? []) as Requests;
  const error = programs.error?.message ?? requests.error?.message;
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => (current ? { ...current, [key]: value } : current));

  const edit = (row: Programs[number]) => setDraft({
    id: row.id, countryCode: row.countryCode, city: row.city ?? "", title: row.title, category: row.category, summary: row.summary, description: row.description,
    durationDaysMin: row.durationDaysMin ? String(row.durationDaysMin) : "", durationDaysMax: row.durationDaysMax ? String(row.durationDaysMax) : "", seasonNote: row.seasonNote ?? "", includedNote: row.includedNote ?? "", visaNote: row.visaNote ?? "",
    priceFrom: row.priceFrom ?? "", priceCurrency: row.priceCurrency ?? "", priceBasis: row.priceBasis ?? "par personne", priceSourceNote: row.priceSourceNote ?? "", providerNote: row.providerNote ?? "",
    status: row.status, reviewedToday: false, priceReviewedToday: false,
  });
  const submit = () => {
    if (!draft) return;
    save.mutate({
      sessionToken, id: draft.id, countryCode: draft.countryCode, city: draft.city || null, title: draft.title, category: draft.category, summary: draft.summary, description: draft.description,
      durationDaysMin: toNumber(draft.durationDaysMin), durationDaysMax: toNumber(draft.durationDaysMax), seasonNote: draft.seasonNote || null, includedNote: draft.includedNote || null, visaNote: draft.visaNote || null,
      priceFrom: draft.priceFrom || null, priceCurrency: draft.priceCurrency || null, priceBasis: draft.priceBasis || null, priceSourceNote: draft.priceSourceNote || null, providerNote: draft.providerNote || null,
      status: draft.status, reviewedToday: draft.reviewedToday, priceReviewedToday: draft.priceReviewedToday,
    });
  };
  const flags = draft ? scanOfferText(`${draft.title}\n${draft.summary}\n${draft.description}\n${draft.visaNote}\n${draft.includedNote}`) : null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="admin-stay-title" data-testid="admin-stay-programs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="admin-stay-title" className="flex items-center gap-2 text-lg font-black text-slate-950"><Compass className="h-5 w-5 text-teal-700" aria-hidden="true" />Séjours visiteurs et tourisme</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Programmes visibles dans l'espace client des candidats « visiteur ou tourisme ». Un prix n'est affiché que complet, avec sa provenance relue il y a moins de 180 jours.</p>
        </div>
        <div role="tablist" aria-label="Séjours" className="flex gap-2">
          <Button type="button" role="tab" aria-selected={view === "programs"} variant={view === "programs" ? "default" : "outline"} size="sm" onClick={() => setView("programs")}>Séjours</Button>
          <Button type="button" role="tab" aria-selected={view === "requests"} variant={view === "requests" ? "default" : "outline"} size="sm" onClick={() => setView("requests")}>Demandes ({queue.filter((item) => item.status === "requested").length})</Button>
        </div>
      </div>
      {error ? <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">{error}</p> : null}

      {view === "programs" ? (
        <div className="mt-4 space-y-3">
          <Button type="button" variant="outline" size="sm" onClick={() => setDraft({ ...emptyDraft })}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Nouveau séjour</Button>
          {draft ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4" data-testid="stay-form">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Pays"><select className={selectClass} value={draft.countryCode} onChange={(event) => set("countryCode", event.target.value)}>{WORLD_COUNTRY_ROWS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></Field>
                <Field label="Ville"><Input value={draft.city} onChange={(event) => set("city", event.target.value)} maxLength={120} /></Field>
                <Field label="Titre" wide><Input value={draft.title} onChange={(event) => set("title", event.target.value)} maxLength={255} /></Field>
                <Field label="Catégorie"><select className={selectClass} value={draft.category} onChange={(event) => set("category", event.target.value as Draft["category"])}>{STAY_CATEGORIES.map((item) => <option key={item} value={item}>{STAY_CATEGORY_LABELS[item]}</option>)}</select></Field>
                <Field label="Statut"><select className={selectClass} value={draft.status} onChange={(event) => set("status", event.target.value as Draft["status"])}>{STAY_STATUSES.map((item) => <option key={item} value={item}>{CATALOG_STATUS_LABELS[item]}</option>)}</select></Field>
                <Field label="Résumé (visible)" wide><Input value={draft.summary} onChange={(event) => set("summary", event.target.value)} maxLength={500} /></Field>
                <Field label="Description détaillée (visible)" wide><Textarea rows={5} value={draft.description} onChange={(event) => set("description", event.target.value)} /></Field>
                <Field label="Durée minimale (jours)"><Input inputMode="numeric" value={draft.durationDaysMin} onChange={(event) => set("durationDaysMin", event.target.value)} /></Field>
                <Field label="Durée maximale (jours)"><Input inputMode="numeric" value={draft.durationDaysMax} onChange={(event) => set("durationDaysMax", event.target.value)} /></Field>
                <Field label="Saison conseillée"><Input value={draft.seasonNote} onChange={(event) => set("seasonNote", event.target.value)} maxLength={300} /></Field>
                <Field label="Ce que l'agence organise"><Input value={draft.includedNote} onChange={(event) => set("includedNote", event.target.value)} maxLength={1000} /></Field>
                <Field label="Visa et formalités (sans lien officiel)" wide><Textarea rows={2} value={draft.visaNote} onChange={(event) => set("visaNote", event.target.value)} /></Field>
                <Field label="Prix à partir de"><Input inputMode="decimal" value={draft.priceFrom} onChange={(event) => set("priceFrom", event.target.value)} placeholder="laisser vide si inconnu" /></Field>
                <Field label="Devise (EUR, CAD…)"><Input value={draft.priceCurrency} onChange={(event) => set("priceCurrency", event.target.value.toUpperCase())} maxLength={3} /></Field>
                <Field label="Base du prix"><Input value={draft.priceBasis} onChange={(event) => set("priceBasis", event.target.value)} maxLength={80} /></Field>
                <Field label="Provenance du prix (admin seulement)"><Input value={draft.priceSourceNote} onChange={(event) => set("priceSourceNote", event.target.value)} maxLength={500} /></Field>
                <Field label="Prestataire ou partenaire (admin seulement)" wide><Input value={draft.providerNote} onChange={(event) => set("providerNote", event.target.value)} maxLength={500} /></Field>
              </div>
              {flags && (flags.contact.length > 0 || flags.money.length > 0) ? <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900" role="status" data-testid="stay-flags">{flags.contact.length ? `Coordonnées ou lien détectés : ${flags.contact.join(", ")}. ` : ""}{flags.money.length ? "Demande d'argent possible dans le texte." : ""}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-800">
                <label className="flex items-center gap-2"><input type="checkbox" checked={draft.reviewedToday} onChange={(event) => set("reviewedToday", event.target.checked)} />Séjour relu aujourd'hui</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={draft.priceReviewedToday} onChange={(event) => set("priceReviewedToday", event.target.checked)} />Prix relu aujourd'hui</label>
              </div>
              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={submit} disabled={save.isPending}><Save className="mr-1 h-4 w-4" aria-hidden="true" />Enregistrer</Button>
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>Fermer</Button>
              </div>
            </div>
          ) : null}
          {rows.length === 0 && !error ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Aucun séjour pour le moment.</p> : null}
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id} className="rounded-lg border border-slate-200 p-3 text-sm" data-testid={`admin-stay-${row.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><p className="font-semibold text-slate-900">{row.title}</p><p className="text-xs text-slate-600">{row.countryCode} · {STAY_CATEGORY_LABELS[row.category]} · {CATALOG_STATUS_LABELS[row.status]} · {row.requestsCount} demande(s){row.priceFrom ? (stayPriceFresh(row.priceCheckedAt) ? " · prix affiché" : " · prix à relire (non affiché)") : ""}</p></div>
                  <div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => edit(row)}>Modifier</Button><Button type="button" size="sm" variant="ghost" className="text-rose-700" onClick={() => remove.mutate({ sessionToken, id: row.id })} disabled={remove.isPending}>{row.requestsCount > 0 ? "Retirer" : "Supprimer"}</Button></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4" data-testid="admin-stay-requests">
          {queue.length === 0 ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Aucune demande de séjour.</p> : null}
          <ul className="space-y-3">
            {queue.map((item) => <RequestRow key={item.id} item={item} pending={setStatus.isPending} onSave={(status, adminNote, notifyCandidate) => setStatus.mutate({ sessionToken, requestId: item.id, status, adminNote: adminNote || null, notifyCandidate })} />)}
          </ul>
        </div>
      )}
    </section>
  );
}

function RequestRow({ item, pending, onSave }: { item: Requests[number]; pending: boolean; onSave: (status: StayRequestStatus, note: string, notify: boolean) => void }) {
  const [status, setStatus] = useState<StayRequestStatus>(item.status);
  const [note, setNote] = useState(item.adminNote ?? "");
  const [notify, setNotify] = useState(true);
  return (
    <li className="rounded-lg border border-slate-200 p-3 text-sm" data-testid={`admin-stay-request-${item.id}`}>
      <p className="font-semibold text-slate-900">{item.candidateName} · {item.programTitle}</p>
      <p className="text-xs text-slate-600">{[item.candidateEmail, item.candidatePhone, `${item.travelers} voyageur(s)`, item.preferredStart ? `début souhaité ${item.preferredStart}` : null].filter(Boolean).join(" · ")}</p>
      {item.candidateNote ? <p className="mt-1 text-xs text-slate-700">Message : {item.candidateNote}</p> : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700">Étape<select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value as StayRequestStatus)}>{STAY_REQUEST_STATUSES.map((value) => <option key={value} value={value}>{STAY_REQUEST_LABELS[value]}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-700">Note interne<Input value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} /></label>
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-slate-800"><input type="checkbox" checked={notify} onChange={(event) => setNotify(event.target.checked)} />Prévenir le candidat</label>
      <Button type="button" size="sm" className="mt-2" disabled={pending} onClick={() => onSave(status, note, notify)}>Enregistrer</Button>
    </li>
  );
}
