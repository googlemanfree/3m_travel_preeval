import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import {
  INSTITUTION_TYPE_LABELS,
  INTAKE_AVAILABILITY_LABELS,
  MAX_ACTIVE_STUDY_APPLICATIONS,
  STUDY_CONSENT_TEXT,
  STUDY_LEVEL_LABELS,
  STUDY_MODE_LABELS,
  type InstitutionType,
  type IntakeAvailability,
  type StudyLevel,
} from "@shared/studyCatalog";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const dateLabel = (value: string | null | undefined) => (value ? new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : null);
const AVAILABILITY_TONE: Record<IntakeAvailability, string> = {
  open: "border-emerald-300 bg-emerald-50 text-emerald-900",
  closing_soon: "border-amber-300 bg-amber-50 text-amber-900",
  waitlist: "border-sky-300 bg-sky-50 text-sky-900",
  closed: "border-slate-300 bg-slate-100 text-slate-600",
};

type Pending = { intakeId: number; label: string };

/**
 * Études : écoles, programmes, dates de rentrée et scolarités du pays choisi, et candidature via l'agence (3 vœux au plus).
 * Le candidat ne dépose pas lui-même : l'agence contrôle les pièces avant l'envoi à l'établissement.
 */
export function StudyOpportunities({ countryCode, countryName }: { countryCode: string; countryName: string }) {
  const utils = trpc.useUtils();
  const schools = trpc.studyCatalog.schools.useQuery({ countryCode }, { staleTime: 5 * 60 * 1000, retry: false });
  const mine = trpc.studyCatalog.myApplications.useQuery(undefined, { retry: false });
  const [pending, setPending] = useState<Pending | null>(null);
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState("");

  const refresh = () => { void utils.studyCatalog.myApplications.invalidate(); };
  const apply = trpc.studyCatalog.applyToIntake.useMutation({
    onSuccess: () => {
      toast.success("Candidature envoyée à votre conseiller");
      trackEvent("study_application_submitted", { country: countryName });
      setPending(null); setConsent(false); setNote("");
      refresh();
    },
    onError: (error) => toast.error("Candidature impossible", { description: error.message }),
  });
  const withdraw = trpc.studyCatalog.withdraw.useMutation({ onSuccess: () => { toast.success("Candidature retirée"); refresh(); }, onError: (error) => toast.error("Retrait impossible", { description: error.message }) });

  const applications = mine.data ?? [];
  const appliedIntakeLabels = new Set(applications.filter((item) => item.status !== "withdrawn").map((item) => `${item.institutionName}|${item.programName}|${item.intakeLabel}`));
  const activeCount = applications.filter((item) => item.status !== "withdrawn" && item.status !== "rejected").length;
  const list = schools.data ?? [];

  return (
    <Card className="border border-indigo-200 bg-white p-5 shadow-sm" role="region" aria-labelledby="study-opportunities-title" data-testid="study-opportunities">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-indigo-100 p-3 text-indigo-800"><GraduationCap className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-800">Études · {countryName}</p>
          <h3 id="study-opportunities-title" className="mt-1 text-lg font-black text-slate-950">Écoles, rentrées et scolarités</h3>
          <p className="mt-1 text-sm text-slate-600">Choisissez jusqu'à {MAX_ACTIVE_STUDY_APPLICATIONS} vœux. Votre conseiller vérifie vos pièces puis dépose la candidature auprès de l'établissement.</p>

          {applications.length > 0 ? (
            <section className="mt-4" aria-label="Mes candidatures études" data-testid="study-my-applications">
              <h4 className="text-sm font-black text-slate-950">Mes candidatures ({activeCount}/{MAX_ACTIVE_STUDY_APPLICATIONS} en cours)</h4>
              <ul className="mt-2 space-y-2">
                {applications.map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0"><p className="font-semibold text-slate-900">Vœu {item.rank} · {item.institutionName}</p><p className="text-xs text-slate-600">{item.programName} · {item.intakeLabel}</p></div>
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-900">{item.statusLabel}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{item.next}</p>
                    {item.canWithdraw ? <Button type="button" variant="ghost" size="sm" className="mt-1 h-auto px-0 text-xs text-rose-700" onClick={() => withdraw.mutate({ applicationId: item.id })} disabled={withdraw.isPending}>Retirer cette candidature</Button> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {schools.isLoading ? <p className="mt-4 text-sm text-slate-600" role="status">Chargement des écoles…</p> : null}
          {!schools.isLoading && list.length === 0 ? (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700" data-testid="study-opportunities-empty">Aucune école n'est encore publiée pour {countryName}. Votre conseiller peut vous proposer des établissements adaptés à votre profil.</p>
          ) : null}

          <ul className="mt-4 space-y-3">
            {list.map((school) => (
              <li key={school.id}>
                <details className="rounded-xl border border-slate-200 p-4" data-testid={`study-school-${school.id}`}>
                  <summary className="cursor-pointer list-none">
                    <span className="block text-base font-black text-slate-950">{school.name}</span>
                    <span className="block text-xs text-slate-600">{[school.city, INSTITUTION_TYPE_LABELS[school.institutionType as InstitutionType], school.publicPrivate === "public" ? "Public" : school.publicPrivate === "private" ? "Privé" : null, school.agencyRelation === "partner" ? "Partenaire de l'agence" : null].filter(Boolean).join(" · ")}</span>
                  </summary>
                  {school.accreditationNote ? <p className="mt-2 text-xs text-slate-600">{school.accreditationNote}</p> : null}
                  <div className="mt-3 space-y-3">
                    {school.programs.map((program) => (
                      <article key={program.id} className="rounded-lg bg-slate-50 p-3">
                        <h4 className="text-sm font-black text-slate-950">{program.name}</h4>
                        <p className="text-xs text-slate-600">{[STUDY_LEVEL_LABELS[program.level as StudyLevel], program.field, program.teachingLanguage ? `cours en ${program.teachingLanguage}` : null, program.durationMonths ? `${program.durationMonths} mois` : null, STUDY_MODE_LABELS[program.mode as "on_site" | "hybrid"]].filter(Boolean).join(" · ")}</p>
                        {program.admissionNote ? <p className="mt-1 text-xs text-slate-700">Admission : {program.admissionNote}</p> : null}
                        {program.languageNote ? <p className="text-xs text-slate-700">Langue : {program.languageNote}</p> : null}
                        {program.fees.length > 0 ? (
                          <ul className="mt-2 space-y-0.5 text-xs text-slate-800" aria-label="Scolarité">
                            {program.fees.map((fee) => <li key={fee.id}>Scolarité {fee.studentCategory === "international" ? "internationale" : "locale"} : {fee.label}{fee.applicationFee ? ` · frais de dossier ${Number(fee.applicationFee).toLocaleString("fr-FR")}` : ""}{fee.extraNote ? ` · ${fee.extraNote}` : ""}</li>)}
                          </ul>
                        ) : <p className="mt-2 text-xs text-slate-500">Scolarité : votre conseiller vous la communique.</p>}
                        <ul className="mt-2 space-y-2">
                          {program.intakes.length === 0 ? <li className="text-xs text-slate-500">Dates de rentrée à venir.</li> : null}
                          {program.intakes.map((intake) => {
                            const already = appliedIntakeLabels.has(`${school.name}|${program.name}|${intake.label}`);
                            const disabled = !intake.canApply || already || activeCount >= MAX_ACTIVE_STUDY_APPLICATIONS;
                            return (
                              <li key={intake.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-2 text-xs">
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900">{intake.label} · début {dateLabel(intake.startDate)}</p>
                                  <p className="text-slate-600">{intake.applicationDeadline ? `Candidatures jusqu'au ${dateLabel(intake.applicationDeadline)}` : "Date limite à confirmer"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`rounded-full border px-2 py-0.5 font-bold ${AVAILABILITY_TONE[intake.availability as IntakeAvailability]}`}>{INTAKE_AVAILABILITY_LABELS[intake.availability as IntakeAvailability]}</span>
                                  <Button type="button" size="sm" disabled={disabled} onClick={() => setPending({ intakeId: intake.id, label: `${school.name} · ${program.name} · ${intake.label}` })} data-testid={`study-apply-${intake.id}`}>{already ? "Déjà demandée" : "Postuler via l'agence"}</Button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </article>
                    ))}
                  </div>
                </details>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Montants indicatifs, exprimés dans la devise et pour l'année indiquées. Aucune admission n'est garantie : la décision appartient à l'établissement.</p>
        </div>
      </div>

      <Dialog open={Boolean(pending)} onOpenChange={(open) => { if (!open) { setPending(null); setConsent(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Postuler via l'agence</DialogTitle>
            <DialogDescription>{pending?.label}</DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800" htmlFor="study-consent">
            <input id="study-consent" type="checkbox" className="mt-1 h-4 w-4" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>{STUDY_CONSENT_TEXT}</span>
          </label>
          <label className="block text-sm font-semibold text-slate-800" htmlFor="study-note">Un mot pour votre conseiller (facultatif)
            <textarea id="study-note" className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm font-normal" rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setPending(null); setConsent(false); }}>Annuler</Button>
            <Button type="button" disabled={!consent || apply.isPending} onClick={() => pending && apply.mutate({ intakeId: pending.intakeId, consent: true, note: note.trim() || null })} data-testid="study-apply-confirm">{apply.isPending ? "Envoi…" : "Envoyer ma candidature"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
