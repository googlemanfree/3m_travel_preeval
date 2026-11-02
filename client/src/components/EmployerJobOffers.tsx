import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { CONTRACT_TYPES, CONTRACT_TYPE_LABELS, JOB_OFFER_STATUS_LABELS, SALARY_PERIODS, SALARY_PERIOD_LABELS, VISA_SPONSORSHIPS, VISA_SPONSORSHIP_LABELS, type JobOfferStatus } from "@shared/jobOffers";
import { WORLD_COUNTRY_ROWS } from "@shared/worldCountries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Offers = inferRouterOutputs<AppRouter>["employerOffers"]["myOffers"];
type Draft = {
  id?: number; title: string; countryCode: string; city: string; contractType: (typeof CONTRACT_TYPES)[number]; contractMonths: string; visaSponsorship: (typeof VISA_SPONSORSHIPS)[number];
  salaryMin: string; salaryMax: string; salaryCurrency: string; salaryPeriod: (typeof SALARY_PERIODS)[number]; salaryVisible: boolean; positionsCount: string; applicationDeadline: string;
  startDate: string; experienceMinYears: string; hideEmployerName: boolean; description: string; requirements: string; benefits: string;
};
const emptyDraft: Draft = { title: "", countryCode: "CA", city: "", contractType: "cdi", contractMonths: "", visaSponsorship: "employer_assists", salaryMin: "", salaryMax: "", salaryCurrency: "", salaryPeriod: "month", salaryVisible: false, positionsCount: "1", applicationDeadline: "", startDate: "", experienceMinYears: "", hideEmployerName: false, description: "", requirements: "", benefits: "" };
const selectClass = "mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base";
const Field = ({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) => <label className={`text-sm font-semibold text-slate-800 ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
const TONE: Record<JobOfferStatus, string> = { draft: "border-slate-300 bg-slate-100 text-slate-700", in_moderation: "border-amber-300 bg-amber-50 text-amber-900", published: "border-emerald-300 bg-emerald-50 text-emerald-900", closed: "border-slate-300 bg-slate-100 text-slate-600", rejected: "border-rose-200 bg-rose-50 text-rose-800", archived: "border-slate-300 bg-slate-100 text-slate-500" };
const num = (value: string) => { const n = Number(value); return value.trim() !== "" && Number.isFinite(n) ? n : null; };

/**
 * Offres de l'employeur : dépôt, brouillon, envoi à la modération et clôture. L'employeur ne publie jamais lui-même et ne voit que
 * le nombre de candidatures : l'agence présente les candidats, avec leur accord.
 */
export function EmployerJobOffers({ sessionToken, canManage }: { sessionToken: string; canManage: boolean }) {
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<Draft | null>(null);
  const offers = trpc.employerOffers.myOffers.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const refresh = () => { void utils.employerOffers.myOffers.invalidate(); };
  const save = trpc.employerOffers.saveOffer.useMutation({
    onSuccess: (result) => { toast.success(result.submitted ? "Offre envoyée à l'agence pour relecture" : "Brouillon enregistré"); setDraft(null); refresh(); },
    onError: (error) => toast.error("Enregistrement impossible", { description: error.message }),
  });
  const close = trpc.employerOffers.closeOffer.useMutation({ onSuccess: () => { toast.success("Offre clôturée"); refresh(); }, onError: (error) => toast.error("Clôture impossible", { description: error.message }) });

  const rows = (offers.data ?? []) as Offers;
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => (current ? { ...current, [key]: value } : current));
  const edit = (row: Offers[number]) => setDraft({
    id: row.id, title: row.title, countryCode: row.countryCode, city: row.city ?? "", contractType: row.contractType, contractMonths: row.contractMonths ? String(row.contractMonths) : "", visaSponsorship: row.visaSponsorship,
    salaryMin: row.salaryMin ?? "", salaryMax: row.salaryMax ?? "", salaryCurrency: row.salaryCurrency ?? "", salaryPeriod: row.salaryPeriod ?? "month", salaryVisible: row.salaryVisible, positionsCount: String(row.positionsCount),
    applicationDeadline: row.applicationDeadline ?? "", startDate: row.startDate ?? "", experienceMinYears: row.experienceMinYears != null ? String(row.experienceMinYears) : "", hideEmployerName: row.hideEmployerName,
    description: row.description, requirements: row.requirements ?? "", benefits: row.benefits ?? "",
  });
  const submit = (send: boolean) => {
    if (!draft) return;
    const hasSalary = draft.salaryMin.trim() !== "" || draft.salaryMax.trim() !== "";
    save.mutate({
      sessionToken, id: draft.id, title: draft.title, countryCode: draft.countryCode, city: draft.city || null, contractType: draft.contractType, contractMonths: num(draft.contractMonths), visaSponsorship: draft.visaSponsorship,
      salaryMin: num(draft.salaryMin), salaryMax: num(draft.salaryMax), salaryCurrency: hasSalary ? draft.salaryCurrency || null : null, salaryPeriod: hasSalary ? draft.salaryPeriod : null, salaryVisible: draft.salaryVisible && hasSalary,
      benefits: draft.benefits || null, languages: [], diplomas: [], experienceMinYears: num(draft.experienceMinYears), startDate: draft.startDate || null, startFlexible: !draft.startDate,
      positionsCount: Math.max(1, Math.round(num(draft.positionsCount) ?? 1)), applicationDeadline: draft.applicationDeadline || null, hideEmployerName: draft.hideEmployerName, description: draft.description, requirements: draft.requirements || null, submit: send,
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="employer-offers-title" data-testid="employer-job-offers">
      <h2 id="employer-offers-title" className="text-lg font-black text-slate-950">Mes offres d'emploi</h2>
      <p className="mt-1 text-sm text-slate-600">Déposez vos offres : l'agence les relit avant publication et vous indique les corrections éventuelles. Elle présente ensuite des candidats qui ont donné leur accord ; vous ne voyez ici que le nombre de candidatures.</p>
      {offers.error ? <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">{offers.error.message}</p> : null}
      {canManage ? <Button type="button" variant="outline" className="mt-3" onClick={() => setDraft({ ...emptyDraft })} data-testid="employer-offer-new"><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Nouvelle offre</Button> : <p className="mt-3 text-sm text-slate-600">Votre rôle est « lecteur » : un gestionnaire de l'organisation dépose et modifie les offres.</p>}

      {draft ? (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4" data-testid="employer-offer-form">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Intitulé du poste" wide><Input value={draft.title} onChange={(event) => set("title", event.target.value)} maxLength={255} /></Field>
            <Field label="Pays"><select className={selectClass} value={draft.countryCode} onChange={(event) => set("countryCode", event.target.value)}>{WORLD_COUNTRY_ROWS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></Field>
            <Field label="Ville"><Input value={draft.city} onChange={(event) => set("city", event.target.value)} maxLength={120} /></Field>
            <Field label="Contrat"><select className={selectClass} value={draft.contractType} onChange={(event) => set("contractType", event.target.value as Draft["contractType"])}>{CONTRACT_TYPES.map((item) => <option key={item} value={item}>{CONTRACT_TYPE_LABELS[item]}</option>)}</select></Field>
            <Field label="Durée en mois (contrats à durée limitée)"><Input inputMode="numeric" value={draft.contractMonths} onChange={(event) => set("contractMonths", event.target.value)} /></Field>
            <Field label="Visa de travail" wide><select className={selectClass} value={draft.visaSponsorship} onChange={(event) => set("visaSponsorship", event.target.value as Draft["visaSponsorship"])}>{VISA_SPONSORSHIPS.map((item) => <option key={item} value={item}>{VISA_SPONSORSHIP_LABELS[item]}</option>)}</select></Field>
            <Field label="Nombre de postes"><Input inputMode="numeric" value={draft.positionsCount} onChange={(event) => set("positionsCount", event.target.value)} /></Field>
            <Field label="Expérience minimale (années)"><Input inputMode="numeric" value={draft.experienceMinYears} onChange={(event) => set("experienceMinYears", event.target.value)} /></Field>
            <Field label="Date limite de candidature"><Input type="date" value={draft.applicationDeadline} onChange={(event) => set("applicationDeadline", event.target.value)} /></Field>
            <Field label="Début souhaité"><Input type="date" value={draft.startDate} onChange={(event) => set("startDate", event.target.value)} /></Field>
            <Field label="Salaire minimal (facultatif)"><Input inputMode="decimal" value={draft.salaryMin} onChange={(event) => set("salaryMin", event.target.value)} /></Field>
            <Field label="Salaire maximal (facultatif)"><Input inputMode="decimal" value={draft.salaryMax} onChange={(event) => set("salaryMax", event.target.value)} /></Field>
            <Field label="Devise (EUR, CAD…)"><Input value={draft.salaryCurrency} onChange={(event) => set("salaryCurrency", event.target.value.toUpperCase())} maxLength={3} /></Field>
            <Field label="Période du salaire"><select className={selectClass} value={draft.salaryPeriod} onChange={(event) => set("salaryPeriod", event.target.value as Draft["salaryPeriod"])}>{SALARY_PERIODS.map((item) => <option key={item} value={item}>{SALARY_PERIOD_LABELS[item]}</option>)}</select></Field>
            <Field label="Description du poste (80 caractères au moins)" wide><Textarea rows={6} value={draft.description} onChange={(event) => set("description", event.target.value)} /></Field>
            <Field label="Profil recherché" wide><Textarea rows={3} value={draft.requirements} onChange={(event) => set("requirements", event.target.value)} /></Field>
            <Field label="Avantages (logement, transport…)" wide><Input value={draft.benefits} onChange={(event) => set("benefits", event.target.value)} maxLength={2000} /></Field>
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-800">
            <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={draft.salaryVisible} onChange={(event) => set("salaryVisible", event.target.checked)} />Afficher le salaire aux candidats</label>
            <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={draft.hideEmployerName} onChange={(event) => set("hideEmployerName", event.target.checked)} />Masquer le nom de mon entreprise (« employeur vérifié par l'agence »)</label>
          </div>
          <p className="mt-2 text-xs text-slate-600">N'écrivez ni adresse e-mail, ni numéro, ni lien, ni demande d'argent : la mise en relation passe par l'agence et aucun frais n'est admis pour le candidat.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={() => submit(true)} disabled={save.isPending} data-testid="employer-offer-submit">Envoyer à l'agence</Button>
            <Button type="button" variant="outline" onClick={() => submit(false)} disabled={save.isPending} data-testid="employer-offer-draft">Enregistrer en brouillon</Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)}>Fermer</Button>
          </div>
        </div>
      ) : null}

      {!offers.isLoading && rows.length === 0 && !offers.error ? <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700" data-testid="employer-offers-empty">Aucune offre pour le moment.</p> : null}
      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-lg border border-slate-200 p-3 text-sm" data-testid={`employer-offer-${row.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0"><p className="font-semibold text-slate-900">{row.title}</p><p className="text-xs text-slate-600">{row.reference} · {row.countryCode}{row.city ? ` · ${row.city}` : ""} · {row.applicationsCount} candidature(s)</p></div>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${TONE[row.status]}`}>{JOB_OFFER_STATUS_LABELS[row.status]}</span>
            </div>
            {row.moderationNote && (row.status === "rejected" || row.status === "draft") ? <p className="mt-2 rounded-md bg-rose-50 p-2 text-xs text-rose-900" data-testid={`employer-offer-note-${row.id}`}>Remarque de l'agence : {row.moderationNote}</p> : null}
            {canManage && row.status !== "closed" && row.status !== "archived" ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => edit(row)}>Modifier</Button>
                <Button type="button" size="sm" variant="ghost" className="text-rose-700" onClick={() => close.mutate({ sessionToken, id: row.id, reason: "cancelled" })} disabled={close.isPending}>Clôturer (annulée)</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => close.mutate({ sessionToken, id: row.id, reason: "filled" })} disabled={close.isPending}>Clôturer (pourvue)</Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
