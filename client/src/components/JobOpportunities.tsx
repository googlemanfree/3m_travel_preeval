import { useMemo, useState } from "react";
import { Briefcase, CheckCircle2, CircleHelp, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  JOB_CONSENT_TEXT,
  MAX_ACTIVE_JOB_APPLICATIONS,
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  SALARY_PERIOD_LABELS,
  VISA_SPONSORSHIP_LABELS,
  type ContractType,
  type ReportReason,
  type VisaSponsorship,
} from "@shared/jobOffers";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const dateLabel = (value: string | null | undefined) => (value ? new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : null);
const stateIcon = (state: string) => (state === "met" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" /> : state === "partial" ? <TriangleAlert className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" /> : <CircleHelp className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />);
const STATE_WORD = { met: "Atteint", partial: "Partiel", unknown: "À préciser" } as const;
const selectClass = "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm";

type Action = { kind: "apply" | "report"; offerId: number; title: string };

/**
 * Visa travail : offres vérifiées du pays, pré-contrôle (informe sans écarter), candidature avec accord explicite et suivi.
 * L'employeur ne reçoit qu'un profil minimal, via l'agence : jamais de nom, de photo ni de coordonnées à ce stade.
 */
export function JobOpportunities({ countryCode, countryName }: { countryCode: string; countryName: string }) {
  const utils = trpc.useUtils();
  const offers = trpc.jobOffers.list.useQuery({ countryCode }, { staleTime: 2 * 60 * 1000, retry: false });
  const mine = trpc.jobOffers.myApplications.useQuery(undefined, { retry: false });
  const [action, setAction] = useState<Action | null>(null);
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState<ReportReason>("fees_requested");
  const [contract, setContract] = useState<ContractType | "">("");
  const [query, setQuery] = useState("");

  const refresh = () => { void utils.jobOffers.myApplications.invalidate(); void utils.jobOffers.list.invalidate(); };
  const close = () => { setAction(null); setConsent(false); setNote(""); };
  const apply = trpc.jobOffers.applyToOffer.useMutation({
    onSuccess: () => { toast.success("Candidature envoyée à votre conseiller"); trackEvent("job_application_submitted", { country: countryName }); close(); refresh(); },
    onError: (error) => toast.error("Candidature impossible", { description: error.message }),
  });
  const withdraw = trpc.jobOffers.withdrawApplication.useMutation({ onSuccess: () => { toast.success("Candidature retirée"); refresh(); }, onError: (error) => toast.error("Retrait impossible", { description: error.message }) });
  const report = trpc.jobOffers.reportOffer.useMutation({
    onSuccess: (result) => { toast.success(result.duplicate ? "Vous avez déjà signalé cette offre" : "Signalement envoyé", { description: "L'agence l'examine. Ne versez jamais d'argent pour obtenir un emploi." }); close(); refresh(); },
    onError: (error) => toast.error("Signalement impossible", { description: error.message }),
  });

  const applications = mine.data ?? [];
  const activeCount = applications.filter((item) => !["rejected", "withdrawn", "hired"].includes(item.status)).length;
  const shown = useMemo(() => (offers.data ?? []).filter((offer) => (!contract || offer.contractType === contract) && (!query.trim() || `${offer.title} ${offer.city ?? ""} ${offer.description}`.toLowerCase().includes(query.trim().toLowerCase()))), [offers.data, contract, query]);

  return (
    <Card className="border border-teal-200 bg-white p-5 shadow-sm" role="region" aria-labelledby="job-opportunities-title" data-testid="job-opportunities">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-teal-100 p-3 text-teal-800"><Briefcase className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-800">Travail · {countryName}</p>
          <h3 id="job-opportunities-title" className="mt-1 text-lg font-black text-slate-950">Offres d'emploi vérifiées</h3>
          <p className="mt-1 text-sm text-slate-600">Chaque offre est contrôlée par l'agence. Aucun employeur ne peut vous demander de frais : signalez toute demande d'argent.</p>

          {applications.length > 0 ? (
            <section className="mt-4" aria-label="Mes candidatures emploi" data-testid="job-my-applications">
              <h4 className="text-sm font-black text-slate-950">Mes candidatures ({activeCount}/{MAX_ACTIVE_JOB_APPLICATIONS} en cours)</h4>
              <ul className="mt-2 space-y-2">
                {applications.map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="font-semibold text-slate-900">{item.title}</p><p className="text-xs text-slate-600">{item.reference} · {item.employer}</p></div><span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-900">{item.statusLabel}</span></div>
                    <p className="mt-1 text-xs text-slate-600">{item.next}</p>
                    {item.canWithdraw ? <Button type="button" variant="ghost" size="sm" className="mt-1 h-auto px-0 text-xs text-rose-700" onClick={() => withdraw.mutate({ applicationId: item.id })} disabled={withdraw.isPending}>Retirer cette candidature</Button> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(offers.data ?? []).length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="job-search">Rechercher<input id="job-search" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-2 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Métier, ville" /></label>
              <label className="text-xs font-semibold text-slate-700" htmlFor="job-contract">Contrat<select id="job-contract" className={selectClass} value={contract} onChange={(event) => setContract(event.target.value as ContractType | "")}><option value="">Tous</option>{CONTRACT_TYPES.map((item) => <option key={item} value={item}>{CONTRACT_TYPE_LABELS[item]}</option>)}</select></label>
            </div>
          ) : null}

          {offers.isLoading ? <p className="mt-4 text-sm text-slate-600" role="status">Chargement des offres…</p> : null}
          {!offers.isLoading && (offers.data ?? []).length === 0 ? <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700" data-testid="job-opportunities-empty">Aucune offre vérifiée n'est ouverte pour {countryName} pour le moment. Votre conseiller vous prévient dès qu'une offre correspond à votre profil.</p> : null}

          <ul className="mt-4 space-y-3">
            {shown.map((offer) => (
              <li key={offer.id} className="rounded-xl border border-slate-200 p-4" data-testid={`job-offer-${offer.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><h4 className="text-base font-black text-slate-950">{offer.title}</h4><p className="text-xs text-slate-600">{[offer.employer, offer.city, CONTRACT_TYPE_LABELS[offer.contractType as ContractType], offer.contractMonths ? `${offer.contractMonths} mois` : null].filter(Boolean).join(" · ")}</p></div>
                  <span className="text-xs font-semibold text-slate-500">{offer.reference}</span>
                </div>
                <p className="mt-2 text-xs text-slate-700">{VISA_SPONSORSHIP_LABELS[offer.visaSponsorship as VisaSponsorship]}{offer.startDate ? ` · début ${dateLabel(offer.startDate)}${offer.startFlexible ? " (flexible)" : ""}` : ""}{offer.applicationDeadline ? ` · candidatures jusqu'au ${dateLabel(offer.applicationDeadline)}` : ""}</p>
                {offer.salary ? <p className="mt-1 text-xs font-semibold text-slate-800">Salaire : {Number(offer.salary.min).toLocaleString("fr-FR")}{offer.salary.max ? ` – ${Number(offer.salary.max).toLocaleString("fr-FR")}` : ""} {offer.salary.currency} {offer.salary.period ? SALARY_PERIOD_LABELS[offer.salary.period as keyof typeof SALARY_PERIOD_LABELS] : ""}</p> : <p className="mt-1 text-xs text-slate-500">Salaire communiqué par votre conseiller.</p>}
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800">{offer.description}</p>
                {offer.requirements ? <p className="mt-1 whitespace-pre-line text-xs text-slate-600">Profil recherché : {offer.requirements}</p> : null}
                {offer.benefits ? <p className="mt-1 text-xs text-slate-600">Avantages : {offer.benefits}</p> : null}
                {offer.precheck.length > 0 ? (
                  <ul className="mt-3 grid gap-1 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-2" aria-label="Pré-contrôle de votre profil">
                    {offer.precheck.map((criterion) => <li key={criterion.key} className="flex items-start gap-1.5" title={criterion.detail}>{stateIcon(criterion.state)}<span><span className="font-semibold text-slate-900">{criterion.label}</span> · {STATE_WORD[criterion.state as keyof typeof STATE_WORD]}</span></li>)}
                    <li className="text-slate-500 sm:col-span-2">Ce pré-contrôle est indicatif : il n'empêche jamais de postuler.</li>
                  </ul>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" disabled={offer.applied || activeCount >= MAX_ACTIVE_JOB_APPLICATIONS} onClick={() => setAction({ kind: "apply", offerId: offer.id, title: offer.title })} data-testid={`job-apply-${offer.id}`}>{offer.applied ? "Déjà postulé" : "Postuler"}</Button>
                  <Button type="button" size="sm" variant="ghost" className="text-slate-600" onClick={() => setAction({ kind: "report", offerId: offer.id, title: offer.title })} data-testid={`job-report-${offer.id}`}>Signaler</Button>
                </div>
              </li>
            ))}
          </ul>
          {(offers.data ?? []).length > 0 && shown.length === 0 ? <p className="mt-3 text-sm text-slate-600">Aucune offre ne correspond à ces filtres.</p> : null}
        </div>
      </div>

      <Dialog open={action?.kind === "apply"} onOpenChange={(open) => { if (!open) close(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Postuler à cette offre</DialogTitle><DialogDescription>{action?.title}</DialogDescription></DialogHeader>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800" htmlFor="job-consent"><input id="job-consent" type="checkbox" className="mt-1 h-4 w-4" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{JOB_CONSENT_TEXT}</span></label>
          <label className="block text-sm font-semibold text-slate-800" htmlFor="job-note">Un mot pour votre conseiller (facultatif)<textarea id="job-note" className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm font-normal" rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} /></label>
          <DialogFooter><Button type="button" variant="outline" onClick={close}>Annuler</Button><Button type="button" disabled={!consent || apply.isPending} onClick={() => action && apply.mutate({ offerId: action.offerId, consent: true, note: note.trim() || null })} data-testid="job-apply-confirm">{apply.isPending ? "Envoi…" : "Envoyer ma candidature"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={action?.kind === "report"} onOpenChange={(open) => { if (!open) close(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Signaler cette offre</DialogTitle><DialogDescription>{action?.title}</DialogDescription></DialogHeader>
          <label className="text-sm font-semibold text-slate-800" htmlFor="job-report-reason">Motif<select id="job-report-reason" className={selectClass} value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>{REPORT_REASONS.map((item) => <option key={item} value={item}>{REPORT_REASON_LABELS[item]}</option>)}</select></label>
          <label className="block text-sm font-semibold text-slate-800" htmlFor="job-report-note">Précisions (facultatif)<textarea id="job-report-note" className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm font-normal" rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} /></label>
          <DialogFooter><Button type="button" variant="outline" onClick={close}>Annuler</Button><Button type="button" disabled={report.isPending} onClick={() => action && report.mutate({ offerId: action.offerId, reason, details: note.trim() || null })} data-testid="job-report-confirm">Envoyer le signalement</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
