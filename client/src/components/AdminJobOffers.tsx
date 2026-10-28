import { useMemo, useState, type ReactNode } from "react";
import { Briefcase, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  JOB_APPLICATION_STATUSES,
  JOB_OFFER_STATUS_LABELS,
  JOB_STATUS_LABELS,
  REJECTION_CODES,
  REJECTION_LABELS,
  REPORT_REASON_LABELS,
  SALARY_PERIODS,
  SALARY_PERIOD_LABELS,
  VISA_SPONSORSHIPS,
  VISA_SPONSORSHIP_LABELS,
  scanOfferText,
  type ContractType,
  type JobApplicationStatus,
  type JobOfferStatus,
  type ReportReason,
} from "@shared/jobOffers";
import { WORLD_COUNTRY_ROWS } from "@shared/worldCountries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Offers = inferRouterOutputs<AppRouter>["jobOffers"]["adminOffers"];
type Applications = inferRouterOutputs<AppRouter>["jobOffers"]["adminApplications"];
type Reports = inferRouterOutputs<AppRouter>["jobOffers"]["adminReports"];
const selectClass = "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm";
const Field = ({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) => <label className={`text-xs font-semibold text-slate-700 ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
const OFFER_TONE: Record<JobOfferStatus, string> = { draft: "border-slate-300 bg-slate-100 text-slate-700", in_moderation: "border-amber-300 bg-amber-50 text-amber-900", published: "border-emerald-300 bg-emerald-50 text-emerald-900", closed: "border-slate-300 bg-slate-100 text-slate-600", rejected: "border-rose-200 bg-rose-50 text-rose-800", archived: "border-slate-300 bg-slate-100 text-slate-500" };

const linesToLanguages = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 8).map((line) => {
  const optional = /\(souhait/i.test(line);
  const clean = line.replace(/\(.*?\)/g, "").trim();
  const parts = clean.split(/\s+/);
  const level = parts.length > 1 ? parts.pop()! : "B1";
  return { lang: parts.join(" ") || clean, level, required: !optional };
});
const linesToDiplomas = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 5).map((line) => ({ level: line, required: true }));

/**
 * Offres d'emploi : saisie par l'agence, modération guidée (le texte est analysé : coordonnées et demandes d'argent bloquent la publication),
 * file des candidatures avec motifs de refus codés, et signalements des candidats.
 */
export function AdminJobOffers({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const [view, setView] = useState<"applications" | "offers" | "reports">("applications");
  const offers = trpc.jobOffers.adminOffers.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const applications = trpc.jobOffers.adminApplications.useQuery({ sessionToken }, { enabled: Boolean(sessionToken) && view === "applications", retry: false });
  const reports = trpc.jobOffers.adminReports.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const refresh = () => { void utils.jobOffers.adminOffers.invalidate(); void utils.jobOffers.adminApplications.invalidate(); void utils.jobOffers.adminReports.invalidate(); };
  const error = offers.error?.message || reports.error?.message;
  const openReports = ((reports.data ?? []) as Reports).filter((item) => item.status === "open" || item.status === "reviewing").length;
  const toModerate = ((offers.data ?? []) as Offers).filter((item) => item.status === "in_moderation").length;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="admin-job-offers-title" data-testid="admin-job-offers">
      <div>
        <h2 id="admin-job-offers-title" className="flex items-center gap-2 text-lg font-black text-slate-950"><Briefcase className="h-5 w-5 text-teal-700" aria-hidden="true" />Offres d'emploi et candidatures</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">Aucune offre n'est visible d'un candidat avant votre modération. Aucun employeur ne reçoit le nom, la photo ni les coordonnées d'un candidat à ce stade : la mise en relation passe par l'agence.</p>
        {error ? <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">{error}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sections des offres d'emploi">
        {([["applications", "Candidatures"], ["offers", `Offres${toModerate ? ` (${toModerate} à modérer)` : ""}`], ["reports", `Signalements${openReports ? ` (${openReports})` : ""}`]] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)} className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${view === id ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-700"}`}>{label}</button>
        ))}
      </div>
      {view === "applications" ? <ApplicationsView sessionToken={sessionToken} rows={(applications.data ?? []) as Applications} onChanged={refresh} /> : null}
      {view === "offers" ? <OffersView sessionToken={sessionToken} rows={(offers.data ?? []) as Offers} onChanged={refresh} /> : null}
      {view === "reports" ? <ReportsView sessionToken={sessionToken} rows={(reports.data ?? []) as Reports} onChanged={refresh} /> : null}
    </section>
  );
}

function ApplicationsView({ sessionToken, rows, onChanged }: { sessionToken: string; rows: Applications; onChanged: () => void }) {
  const [filter, setFilter] = useState<JobApplicationStatus | "">("");
  const shown = rows.filter((row) => !filter || row.status === filter);
  return (
    <div data-testid="admin-job-applications">
      <label className="text-xs font-semibold text-slate-700">Étape<select className={`${selectClass} max-w-xs`} value={filter} onChange={(event) => setFilter(event.target.value as JobApplicationStatus | "")} aria-label="Filtrer par étape"><option value="">Toutes</option>{JOB_APPLICATION_STATUSES.map((item) => <option key={item} value={item}>{JOB_STATUS_LABELS[item]}</option>)}</select></label>
      <ul className="mt-3 space-y-2">
        {shown.map((row) => <ApplicationRow key={row.id} sessionToken={sessionToken} row={row} onChanged={onChanged} />)}
        {shown.length === 0 ? <li className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Aucune candidature {filter ? "à cette étape" : "pour le moment"}.</li> : null}
      </ul>
    </div>
  );
}

function ApplicationRow({ sessionToken, row, onChanged }: { sessionToken: string; row: Applications[number]; onChanged: () => void }) {
  const [status, setStatus] = useState<JobApplicationStatus>(row.status as JobApplicationStatus);
  const [rejection, setRejection] = useState<string>(row.rejectionCode ?? "");
  const [note, setNote] = useState(row.adminNote ?? "");
  const [level, setLevel] = useState(String(row.disclosureLevel));
  const save = trpc.jobOffers.adminSetApplicationStatus.useMutation({ onSuccess: () => { toast.success("Candidature mise à jour"); onChanged(); }, onError: (error) => toast.error("Mise à jour impossible", { description: error.message }) });
  const profile = Object.entries(row.profile as Record<string, string | null>).filter(([, value]) => value);
  return (
    <li className="rounded-lg border border-slate-200 p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><p className="font-semibold text-slate-900">{row.candidateName}</p><p className="text-xs text-slate-600">{row.offerReference} · {row.offerTitle}</p><p className="text-xs text-slate-500">{[row.candidateEmail, row.candidatePhone].filter(Boolean).join(" · ")}</p></div>
        <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-900">{JOB_STATUS_LABELS[row.status as JobApplicationStatus]}</span>
      </div>
      {row.precheck.length > 0 ? <p className="mt-1 text-xs text-slate-600">Pré-contrôle : {row.precheck.map((item) => `${item.label} (${item.state === "met" ? "atteint" : item.state === "partial" ? "partiel" : "à préciser"})`).join(" · ")}</p> : null}
      {profile.length > 0 ? <p className="mt-1 text-xs text-slate-600">Profil minimal présenté : {profile.map(([key, value]) => `${key} : ${value}`).join(" · ")}</p> : null}
      {row.coverNote ? <p className="mt-1 text-xs italic text-slate-600">Candidat : « {row.coverNote} »</p> : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        <Field label="Étape"><select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value as JobApplicationStatus)}>{JOB_APPLICATION_STATUSES.map((item) => <option key={item} value={item}>{JOB_STATUS_LABELS[item]}</option>)}</select></Field>
        {status === "rejected" ? <Field label="Motif du refus"><select className={selectClass} value={rejection} onChange={(event) => setRejection(event.target.value)}><option value="">Choisir…</option>{REJECTION_CODES.map((item) => <option key={item} value={item}>{REJECTION_LABELS[item]}</option>)}</select></Field> : <Field label="Niveau de divulgation (1 à 4)"><select className={selectClass} value={level} onChange={(event) => setLevel(event.target.value)}>{[1, 2, 3, 4].map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>}
        <Field label="Note interne" wide><Input className="mt-1" value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} /></Field>
      </div>
      <Button type="button" size="sm" className="mt-2" disabled={save.isPending} onClick={() => save.mutate({ sessionToken, applicationId: row.id, status, rejectionCode: (rejection || null) as (typeof REJECTION_CODES)[number] | null, adminNote: note, disclosureLevel: Number(level), notifyCandidate: true })}><Save className="mr-1 h-4 w-4" aria-hidden="true" />Enregistrer et prévenir le candidat</Button>
    </li>
  );
}

function OffersView({ sessionToken, rows, onChanged }: { sessionToken: string; rows: Offers; onChanged: () => void }) {
  const [creating, setCreating] = useState(false);
  return (
    <div data-testid="admin-job-offer-list">
      <Button type="button" variant="outline" onClick={() => setCreating(!creating)}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Nouvelle offre</Button>
      {creating ? <OfferForm sessionToken={sessionToken} onSaved={() => { setCreating(false); onChanged(); }} /> : null}
      <ul className="mt-3 space-y-3">
        {rows.map((offer) => <OfferRow key={offer.id} sessionToken={sessionToken} offer={offer} onChanged={onChanged} />)}
        {rows.length === 0 ? <li className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Aucune offre. Créez la première.</li> : null}
      </ul>
    </div>
  );
}

function OfferRow({ sessionToken, offer, onChanged }: { sessionToken: string; offer: Offers[number]; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [checks, setChecks] = useState({ noFees: false, noDiscrimination: false, noContact: false, visaCoherent: false });
  const [note, setNote] = useState(offer.moderationNote ?? "");
  const flags = useMemo(() => scanOfferText(`${offer.title}\n${offer.description}\n${offer.requirements ?? ""}`), [offer]);
  const setStatus = trpc.jobOffers.adminSetOfferStatus.useMutation({ onSuccess: () => { toast.success("Statut de l'offre mis à jour"); onChanged(); }, onError: (error) => toast.error("Changement refusé", { description: error.message }) });
  const change = (status: JobOfferStatus, closeReason?: "filled" | "cancelled") => setStatus.mutate({ sessionToken, id: offer.id, status, moderationNote: note, closeReason: closeReason ?? null, checks });
  const label = CONTRACT_TYPE_LABELS[offer.contractType as ContractType];
  return (
    <li className="rounded-xl border border-slate-200 p-4" data-testid={`admin-job-offer-${offer.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><p className="text-base font-black text-slate-950">{offer.title} <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${OFFER_TONE[offer.status as JobOfferStatus]}`}>{JOB_OFFER_STATUS_LABELS[offer.status as JobOfferStatus]}</span></p><p className="text-xs text-slate-600">{offer.reference} · {[offer.employerName, offer.city, offer.countryCode, label].filter(Boolean).join(" · ")} · {offer.applicationsCount} candidature(s)</p></div>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(!editing)}>Modifier</Button>
      </div>
      {flags.contact.length > 0 || flags.money.length > 0 ? (
        <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900" role="alert" data-testid="offer-flags">
          {flags.contact.length > 0 ? `Coordonnées détectées : ${flags.contact.join(", ")}. ` : ""}{flags.money.length > 0 ? `Demande d'argent possible : « ${flags.money.join("», «")} ». ` : ""}À retirer avant publication.
        </p>
      ) : null}
      {editing ? <OfferForm sessionToken={sessionToken} initial={offer} onSaved={() => { setEditing(false); onChanged(); }} /> : null}
      {offer.status !== "published" && offer.status !== "closed" && offer.status !== "archived" ? (
        <fieldset className="mt-3 rounded-lg bg-slate-50 p-3">
          <legend className="px-1 text-xs font-black uppercase tracking-wide text-slate-500">Contrôles avant publication</legend>
          <div className="grid gap-1 text-xs text-slate-800 sm:grid-cols-2">
            {([["noFees", "Aucun frais n'est demandé au candidat"], ["noDiscrimination", "Aucune discrimination (âge, sexe, origine, religion)"], ["noContact", "Aucune coordonnée personnelle dans le texte"], ["visaCoherent", "Le dispositif de visa est cohérent avec le poste"]] as const).map(([key, text]) => (
              <label key={key} className="flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={checks[key]} onChange={(event) => setChecks({ ...checks, [key]: event.target.checked })} />{text}</label>
            ))}
          </div>
          <Field label="Note de modération (obligatoire pour refuser)" wide><Input className="mt-1" value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} /></Field>
          <div className="mt-2 flex flex-wrap gap-2"><Button type="button" size="sm" disabled={setStatus.isPending} onClick={() => change("published")}>Publier</Button><Button type="button" size="sm" variant="outline" disabled={setStatus.isPending} onClick={() => change("in_moderation")}>Mettre en modération</Button><Button type="button" size="sm" variant="outline" className="text-rose-800" disabled={setStatus.isPending} onClick={() => change("rejected")}>Refuser</Button></div>
        </fieldset>
      ) : null}
      {offer.status === "published" ? <div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => change("closed", "filled")}>Clôturer : poste pourvu</Button><Button type="button" size="sm" variant="outline" onClick={() => change("closed", "cancelled")}>Clôturer : offre annulée</Button></div> : null}
    </li>
  );
}

function OfferForm({ sessionToken, initial, onSaved }: { sessionToken: string; initial?: Offers[number]; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: initial?.title ?? "", countryCode: initial?.countryCode ?? "CA", city: initial?.city ?? "", employerName: initial?.employerName ?? "", hideEmployerName: initial?.hideEmployerName ?? false, organizationId: initial?.organizationId ? String(initial.organizationId) : "",
    contractType: (initial?.contractType ?? "cdi") as ContractType, contractMonths: initial?.contractMonths ? String(initial.contractMonths) : "", visaSponsorship: (initial?.visaSponsorship ?? "employer_assists") as (typeof VISA_SPONSORSHIPS)[number],
    salaryMin: initial?.salaryMin ?? "", salaryMax: initial?.salaryMax ?? "", salaryCurrency: initial?.salaryCurrency ?? "", salaryPeriod: (initial?.salaryPeriod ?? "") as "" | (typeof SALARY_PERIODS)[number], salaryVisible: initial?.salaryVisible ?? false,
    benefits: initial?.benefits ?? "", languages: (initial?.languagesJson ?? []).map((item) => `${item.lang} ${item.level}${item.required === false ? " (souhaité)" : ""}`).join("\n"), diplomas: (initial?.diplomasJson ?? []).map((item) => item.level).join("\n"),
    experienceMinYears: initial?.experienceMinYears !== null && initial?.experienceMinYears !== undefined ? String(initial.experienceMinYears) : "", startDate: initial?.startDate ?? "", startFlexible: initial?.startFlexible ?? true, positionsCount: String(initial?.positionsCount ?? 1), applicationDeadline: initial?.applicationDeadline ?? "",
    description: initial?.description ?? "", requirements: initial?.requirements ?? "",
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));
  const save = trpc.jobOffers.adminSaveOffer.useMutation({ onSuccess: () => { toast.success("Offre enregistrée"); onSaved(); }, onError: (error) => toast.error("Offre refusée", { description: error.message }) });
  const number = (value: string) => (value.trim() === "" ? null : Number(value.replace(",", ".")));
  return (
    <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
      <Field label="Titre du poste" wide><Input className="mt-1" value={form.title} maxLength={255} onChange={(event) => set("title", event.target.value)} /></Field>
      <Field label="Pays du poste"><select className={selectClass} value={form.countryCode} onChange={(event) => set("countryCode", event.target.value)}>{WORLD_COUNTRY_ROWS.map((row) => <option key={row[0]} value={row[0]}>{row[1]}</option>)}</select></Field>
      <Field label="Ville"><Input className="mt-1" value={form.city} maxLength={120} onChange={(event) => set("city", event.target.value)} /></Field>
      <Field label="Nom de l'employeur"><Input className="mt-1" value={form.employerName} maxLength={255} onChange={(event) => set("employerName", event.target.value)} /></Field>
      <Field label="N° de l'employeur vérifié (facultatif)"><Input className="mt-1" inputMode="numeric" value={form.organizationId} onChange={(event) => set("organizationId", event.target.value.replace(/\D/g, ""))} /></Field>
      <label className="flex items-start gap-2 text-xs text-slate-700 sm:col-span-2"><input type="checkbox" className="mt-0.5" checked={form.hideEmployerName} onChange={(event) => set("hideEmployerName", event.target.checked)} />Masquer le nom de l'employeur aux candidats</label>
      <Field label="Contrat"><select className={selectClass} value={form.contractType} onChange={(event) => set("contractType", event.target.value as ContractType)}>{CONTRACT_TYPES.map((item) => <option key={item} value={item}>{CONTRACT_TYPE_LABELS[item]}</option>)}</select></Field>
      <Field label="Durée (mois, si CDD)"><Input className="mt-1" inputMode="numeric" value={form.contractMonths} onChange={(event) => set("contractMonths", event.target.value.replace(/\D/g, "").slice(0, 3))} /></Field>
      <Field label="Visa"><select className={selectClass} value={form.visaSponsorship} onChange={(event) => set("visaSponsorship", event.target.value as typeof form.visaSponsorship)}>{VISA_SPONSORSHIPS.map((item) => <option key={item} value={item}>{VISA_SPONSORSHIP_LABELS[item]}</option>)}</select></Field>
      <Field label="Expérience minimale (années)"><Input className="mt-1" inputMode="numeric" value={form.experienceMinYears} onChange={(event) => set("experienceMinYears", event.target.value.replace(/\D/g, "").slice(0, 2))} /></Field>
      <Field label="Salaire minimal"><Input className="mt-1" inputMode="decimal" value={form.salaryMin} onChange={(event) => set("salaryMin", event.target.value.replace(/[^0-9.,]/g, ""))} /></Field>
      <Field label="Salaire maximal"><Input className="mt-1" inputMode="decimal" value={form.salaryMax} onChange={(event) => set("salaryMax", event.target.value.replace(/[^0-9.,]/g, ""))} /></Field>
      <Field label="Devise (EUR, CAD…)"><Input className="mt-1" value={form.salaryCurrency} maxLength={3} onChange={(event) => set("salaryCurrency", event.target.value.toUpperCase())} /></Field>
      <Field label="Période"><select className={selectClass} value={form.salaryPeriod} onChange={(event) => set("salaryPeriod", event.target.value as typeof form.salaryPeriod)}><option value="">Non précisée</option>{SALARY_PERIODS.map((item) => <option key={item} value={item}>{SALARY_PERIOD_LABELS[item]}</option>)}</select></Field>
      <label className="flex items-start gap-2 text-xs text-slate-700 sm:col-span-2"><input type="checkbox" className="mt-0.5" checked={form.salaryVisible} onChange={(event) => set("salaryVisible", event.target.checked)} />Afficher le salaire aux candidats (la fourchette doit être réelle)</label>
      <Field label="Langues exigées (une par ligne : « Anglais B2 », « Français B1 (souhaité) »)" wide><Textarea className="mt-1" rows={2} value={form.languages} onChange={(event) => set("languages", event.target.value)} /></Field>
      <Field label="Diplômes (un par ligne)" wide><Textarea className="mt-1" rows={2} value={form.diplomas} onChange={(event) => set("diplomas", event.target.value)} /></Field>
      <Field label="Début"><Input className="mt-1" type="date" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} /></Field>
      <Field label="Date limite"><Input className="mt-1" type="date" value={form.applicationDeadline} onChange={(event) => set("applicationDeadline", event.target.value)} /></Field>
      <Field label="Postes à pourvoir"><Input className="mt-1" inputMode="numeric" value={form.positionsCount} onChange={(event) => set("positionsCount", event.target.value.replace(/\D/g, "").slice(0, 3))} /></Field>
      <label className="flex items-center gap-2 pt-5 text-xs text-slate-700"><input type="checkbox" checked={form.startFlexible} onChange={(event) => set("startFlexible", event.target.checked)} />Date de début flexible</label>
      <Field label="Description du poste (sans coordonnées ni demande d'argent)" wide><Textarea className="mt-1" rows={5} maxLength={8000} value={form.description} onChange={(event) => set("description", event.target.value)} /></Field>
      <Field label="Profil recherché" wide><Textarea className="mt-1" rows={2} maxLength={4000} value={form.requirements} onChange={(event) => set("requirements", event.target.value)} /></Field>
      <Field label="Avantages (logement, billet, assurance…)" wide><Input className="mt-1" value={form.benefits} maxLength={2000} onChange={(event) => set("benefits", event.target.value)} /></Field>
      <div className="sm:col-span-2"><Button type="button" size="sm" disabled={save.isPending || form.title.trim().length < 3 || form.description.trim().length < 10} onClick={() => save.mutate({
        sessionToken, id: initial?.id, organizationId: form.organizationId ? Number(form.organizationId) : null, employerName: form.employerName, hideEmployerName: form.hideEmployerName, title: form.title, countryCode: form.countryCode, city: form.city, domainId: null, programRef: null,
        visaSponsorship: form.visaSponsorship, contractType: form.contractType, contractMonths: number(form.contractMonths), salaryMin: number(form.salaryMin), salaryMax: number(form.salaryMax), salaryCurrency: form.salaryCurrency || null, salaryPeriod: form.salaryPeriod || null, salaryVisible: form.salaryVisible,
        benefits: form.benefits, languages: linesToLanguages(form.languages), diplomas: linesToDiplomas(form.diplomas), experienceMinYears: number(form.experienceMinYears), startDate: form.startDate || null, startFlexible: form.startFlexible, positionsCount: Number(form.positionsCount) || 1, applicationDeadline: form.applicationDeadline || null, description: form.description, requirements: form.requirements,
      })}><Save className="mr-1 h-4 w-4" aria-hidden="true" />Enregistrer l'offre</Button></div>
    </div>
  );
}

function ReportsView({ sessionToken, rows, onChanged }: { sessionToken: string; rows: Reports; onChanged: () => void }) {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const handle = trpc.jobOffers.adminHandleReport.useMutation({ onSuccess: () => { toast.success("Signalement traité"); onChanged(); }, onError: (error) => toast.error("Décision refusée", { description: error.message }) });
  return (
    <ul className="space-y-2" data-testid="admin-job-reports">
      {rows.map((row) => (
        <li key={row.id} className="rounded-lg border border-slate-200 p-3 text-sm">
          <p className="font-semibold text-slate-900">{row.offerReference} · {row.offerTitle} <span className="font-normal text-slate-500">· {REPORT_REASON_LABELS[row.reason as ReportReason]}</span></p>
          {row.details ? <p className="text-xs italic text-slate-600">« {row.details} »</p> : null}
          <p className="text-xs text-slate-500">Statut du signalement : {row.status} · offre : {JOB_OFFER_STATUS_LABELS[row.offerStatus as JobOfferStatus] ?? row.offerStatus}</p>
          {row.status === "open" || row.status === "reviewing" ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
              <Input value={notes[row.id] ?? ""} maxLength={1000} placeholder="Décision prise" aria-label="Décision prise" onChange={(event) => setNotes({ ...notes, [row.id]: event.target.value })} />
              <Button type="button" size="sm" variant="outline" disabled={handle.isPending} onClick={() => handle.mutate({ sessionToken, id: row.id, status: "reviewing", decisionNote: notes[row.id] ?? null })}>En cours</Button>
              <Button type="button" size="sm" disabled={handle.isPending} onClick={() => handle.mutate({ sessionToken, id: row.id, status: "upheld", decisionNote: notes[row.id] ?? null })}>Fondé : retirer l'offre</Button>
              <Button type="button" size="sm" variant="outline" disabled={handle.isPending} onClick={() => handle.mutate({ sessionToken, id: row.id, status: "dismissed", decisionNote: notes[row.id] ?? null })}>Sans suite</Button>
            </div>
          ) : row.decisionNote ? <p className="mt-1 text-xs text-slate-600">Décision : {row.decisionNote}</p> : null}
        </li>
      ))}
      {rows.length === 0 ? <li className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Aucun signalement.</li> : null}
    </ul>
  );
}
