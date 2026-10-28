import { useState, type ReactNode } from "react";
import { GraduationCap, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import {
  CATALOG_STATUSES,
  INSTITUTION_TYPES,
  INSTITUTION_TYPE_LABELS,
  INTAKE_AVAILABILITIES,
  INTAKE_AVAILABILITY_LABELS,
  STUDENT_CATEGORIES,
  STUDY_APPLICATION_STATUSES,
  STUDY_LEVELS,
  STUDY_LEVEL_LABELS,
  STUDY_MODES,
  STUDY_MODE_LABELS,
  STUDY_STATUS_LABELS,
  TUITION_PERIODS,
  TUITION_PERIOD_LABELS,
  tuitionFreshness,
  type StudyApplicationStatus,
  type StudyCatalogStatus,
} from "@shared/studyCatalog";
import { WORLD_COUNTRY_ROWS } from "@shared/worldCountries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Tree = inferRouterOutputs<AppRouter>["studyCatalog"]["adminTree"];
type Applications = inferRouterOutputs<AppRouter>["studyCatalog"]["adminApplications"];
const STATUS_LABELS: Record<StudyCatalogStatus, string> = { draft: "Brouillon", needs_review: "À confirmer", published: "Publié", retired: "Retiré" };
const STATUS_CLASS: Record<StudyCatalogStatus, string> = { draft: "border-slate-300 bg-slate-100 text-slate-700", needs_review: "border-amber-300 bg-amber-50 text-amber-900", published: "border-emerald-300 bg-emerald-50 text-emerald-900", retired: "border-rose-200 bg-rose-50 text-rose-800" };
const selectClass = "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm";
const COUNTRY_NAME = new Map(WORLD_COUNTRY_ROWS.map((row) => [row[0], row[1]]));

const Chip = ({ status }: { status: StudyCatalogStatus }) => <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-bold ${STATUS_CLASS[status]}`}>{STATUS_LABELS[status]}</span>;
const Field = ({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) => <label className={`text-xs font-semibold text-slate-700 ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
const StatusSelect = ({ value, onChange }: { value: StudyCatalogStatus; onChange: (value: StudyCatalogStatus) => void }) => (
  <Field label="Statut"><select className={selectClass} value={value} onChange={(event) => onChange(event.target.value as StudyCatalogStatus)}>{CATALOG_STATUSES.map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}</select></Field>
);

/**
 * Écoles, programmes, rentrées, scolarités et candidatures études. Rien n'est visible du candidat avant publication :
 * un établissement et une scolarité exigent une relecture du jour ; les provenances et sites restent côté administration.
 */
export function AdminStudyCatalog({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const [country, setCountry] = useState("CA");
  const tree = trpc.studyCatalog.adminTree.useQuery({ sessionToken, countryCode: country }, { enabled: Boolean(sessionToken), retry: false });
  const applications = trpc.studyCatalog.adminApplications.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const refresh = () => { void utils.studyCatalog.adminTree.invalidate(); void utils.studyCatalog.adminApplications.invalidate(); };
  const fail = (title: string) => (error: { message: string }) => toast.error(title, { description: error.message });
  const remove = trpc.studyCatalog.adminDelete.useMutation({ onSuccess: () => { toast.success("Supprimé"); refresh(); }, onError: fail("Suppression impossible") });
  const [creating, setCreating] = useState(false);

  const data = tree.data as Tree | undefined;
  const queue = (applications.data ?? []) as Applications;
  const error = tree.error?.message || applications.error?.message;

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="admin-study-catalog-title" data-testid="admin-study-catalog">
      <div>
        <h2 id="admin-study-catalog-title" className="flex items-center gap-2 text-lg font-black text-slate-950"><GraduationCap className="h-5 w-5 text-indigo-700" aria-hidden="true" />Écoles, rentrées et candidatures études</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">Saisissez les établissements, leurs programmes, leurs rentrées et leurs scolarités. Chaque candidature arrive dans la file ci-dessous : l'agence contrôle les pièces puis dépose auprès de l'établissement.</p>
        {error ? <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">{error}</p> : null}
      </div>

      <ApplicationsQueue sessionToken={sessionToken} rows={queue} onChanged={refresh} />

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="text-sm font-semibold text-slate-700">Pays<select className={`${selectClass} min-w-56`} value={country} onChange={(event) => setCountry(event.target.value)} aria-label="Pays du catalogue études">{WORLD_COUNTRY_ROWS.map((row) => <option key={row[0]} value={row[0]}>{row[1]}</option>)}</select></label>
          <Button type="button" onClick={() => setCreating(!creating)} variant="outline"><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Nouvel établissement</Button>
        </div>
        {creating ? <InstitutionForm sessionToken={sessionToken} countryCode={country} onSaved={() => { setCreating(false); refresh(); }} /> : null}

        <ul className="mt-4 space-y-3">
          {(data?.institutions ?? []).map((institution) => (
            <li key={institution.id} className="rounded-xl border border-slate-200 p-4" data-testid={`admin-study-institution-${institution.id}`}>
              <InstitutionBlock sessionToken={sessionToken} institution={institution} programs={data!.programs.filter((program) => program.institutionId === institution.id)} intakes={data!.intakes} fees={data!.fees} onChanged={refresh} onDelete={(kind, id) => remove.mutate({ sessionToken, kind, id })} />
            </li>
          ))}
          {data && data.institutions.length === 0 ? <li className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Aucun établissement pour {COUNTRY_NAME.get(country) ?? country}. Ajoutez-en un.</li> : null}
        </ul>
      </div>
    </section>
  );
}

function ApplicationsQueue({ sessionToken, rows, onChanged }: { sessionToken: string; rows: Applications; onChanged: () => void }) {
  const [filter, setFilter] = useState<StudyApplicationStatus | "">("");
  const shown = rows.filter((row) => !filter || row.status === filter);
  const open = rows.filter((row) => !["rejected", "withdrawn", "visa_phase"].includes(row.status)).length;
  return (
    <div data-testid="admin-study-applications">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="text-base font-black text-slate-950">Candidatures études à traiter <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-900">{open}</span></h3>
        <label className="text-xs font-semibold text-slate-700">Étape<select className={selectClass} value={filter} onChange={(event) => setFilter(event.target.value as StudyApplicationStatus | "")} aria-label="Filtrer par étape"><option value="">Toutes</option>{STUDY_APPLICATION_STATUSES.map((item) => <option key={item} value={item}>{STUDY_STATUS_LABELS[item]}</option>)}</select></label>
      </div>
      <ul className="mt-3 space-y-2">
        {shown.map((row) => <ApplicationRow key={row.id} sessionToken={sessionToken} row={row} onChanged={onChanged} />)}
        {shown.length === 0 ? <li className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Aucune candidature {filter ? "à cette étape" : "pour le moment"}.</li> : null}
      </ul>
    </div>
  );
}

function ApplicationRow({ sessionToken, row, onChanged }: { sessionToken: string; row: Applications[number]; onChanged: () => void }) {
  const [status, setStatus] = useState<StudyApplicationStatus>(row.status as StudyApplicationStatus);
  const [adminNote, setAdminNote] = useState(row.adminNote ?? "");
  const [reference, setReference] = useState(row.institutionReference ?? "");
  const save = trpc.studyCatalog.adminSetApplicationStatus.useMutation({ onSuccess: () => { toast.success("Candidature mise à jour"); onChanged(); }, onError: (error) => toast.error("Mise à jour impossible", { description: error.message }) });
  return (
    <li className="rounded-lg border border-slate-200 p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><p className="font-semibold text-slate-900">{row.candidateName} <span className="font-normal text-slate-500">· vœu {row.rank}</span></p><p className="text-xs text-slate-600">{row.institutionName} · {row.programName} · {row.intakeLabel}{row.applicationDeadline ? ` · limite ${row.applicationDeadline}` : ""}</p><p className="text-xs text-slate-500">{[row.candidateEmail, row.candidatePhone].filter(Boolean).join(" · ")}</p></div>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-900">{STUDY_STATUS_LABELS[row.status as StudyApplicationStatus]}</span>
      </div>
      {row.candidateNote ? <p className="mt-1 text-xs italic text-slate-600">Candidat : « {row.candidateNote} »</p> : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <Field label="Étape"><select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value as StudyApplicationStatus)}>{STUDY_APPLICATION_STATUSES.map((item) => <option key={item} value={item}>{STUDY_STATUS_LABELS[item]}</option>)}</select></Field>
        <Field label="Référence chez l'établissement"><Input className="mt-1" value={reference} maxLength={120} onChange={(event) => setReference(event.target.value)} /></Field>
        <Field label="Note interne"><Input className="mt-1" value={adminNote} maxLength={2000} onChange={(event) => setAdminNote(event.target.value)} /></Field>
      </div>
      <Button type="button" size="sm" className="mt-2" disabled={save.isPending} onClick={() => save.mutate({ sessionToken, applicationId: row.id, status, adminNote, institutionReference: reference, notifyCandidate: true })}><Save className="mr-1 h-4 w-4" aria-hidden="true" />Enregistrer et prévenir le candidat</Button>
    </li>
  );
}

function InstitutionForm({ sessionToken, countryCode, initial, onSaved }: { sessionToken: string; countryCode: string; initial?: Tree["institutions"][number]; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "", city: initial?.city ?? "", institutionType: initial?.institutionType ?? "university", publicPrivate: initial?.publicPrivate ?? "",
    accreditationNote: initial?.accreditationNote ?? "", adminWebsite: initial?.adminWebsite ?? "", agencyRelation: initial?.agencyRelation ?? "listed",
    status: (initial?.status ?? "needs_review") as StudyCatalogStatus, markChecked: false,
  });
  const save = trpc.studyCatalog.adminSaveInstitution.useMutation({ onSuccess: () => { toast.success("Établissement enregistré"); onSaved(); }, onError: (error) => toast.error("Établissement refusé", { description: error.message }) });
  return (
    <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
      <Field label="Nom de l'établissement" wide><Input className="mt-1" value={form.name} maxLength={255} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
      <Field label="Ville"><Input className="mt-1" value={form.city} maxLength={120} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field>
      <Field label="Type"><select className={selectClass} value={form.institutionType} onChange={(event) => setForm({ ...form, institutionType: event.target.value as typeof form.institutionType })}>{INSTITUTION_TYPES.map((item) => <option key={item} value={item}>{INSTITUTION_TYPE_LABELS[item]}</option>)}</select></Field>
      <Field label="Public ou privé"><select className={selectClass} value={form.publicPrivate} onChange={(event) => setForm({ ...form, publicPrivate: event.target.value as typeof form.publicPrivate })}><option value="">Non précisé</option><option value="public">Public</option><option value="private">Privé</option></select></Field>
      <Field label="Relation avec l'agence"><select className={selectClass} value={form.agencyRelation} onChange={(event) => setForm({ ...form, agencyRelation: event.target.value as typeof form.agencyRelation })}><option value="listed">Référencé</option><option value="partner">Partenaire</option></select></Field>
      <Field label="Accréditation ou reconnaissance (affichée au candidat)" wide><Input className="mt-1" value={form.accreditationNote} maxLength={500} onChange={(event) => setForm({ ...form, accreditationNote: event.target.value })} /></Field>
      <Field label="Site de l'établissement (administration seulement)" wide><Input className="mt-1" value={form.adminWebsite} maxLength={600} placeholder="https://" onChange={(event) => setForm({ ...form, adminWebsite: event.target.value })} /></Field>
      <StatusSelect value={form.status} onChange={(status) => setForm({ ...form, status })} />
      <label className="flex items-start gap-2 text-xs text-slate-700 sm:col-span-2"><input type="checkbox" className="mt-0.5" checked={form.markChecked} onChange={(event) => setForm({ ...form, markChecked: event.target.checked })} />J'ai relu les informations de cet établissement aujourd'hui (obligatoire pour publier).</label>
      <div className="sm:col-span-2"><Button type="button" size="sm" disabled={save.isPending || form.name.trim().length < 2} onClick={() => save.mutate({ sessionToken, id: initial?.id, countryCode: (initial?.countryCode ?? countryCode), city: form.city, name: form.name, institutionType: form.institutionType, publicPrivate: (form.publicPrivate || null) as "public" | "private" | null, accreditationNote: form.accreditationNote, adminWebsite: form.adminWebsite, agencyRelation: form.agencyRelation, status: form.status, markChecked: form.markChecked })}><Save className="mr-1 h-4 w-4" aria-hidden="true" />Enregistrer l'établissement</Button></div>
    </div>
  );
}

function InstitutionBlock({ sessionToken, institution, programs, intakes, fees, onChanged, onDelete }: { sessionToken: string; institution: Tree["institutions"][number]; programs: Tree["programs"]; intakes: Tree["intakes"]; fees: Tree["fees"]; onChanged: () => void; onDelete: (kind: "institution" | "program" | "intake" | "fee", id: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [addingProgram, setAddingProgram] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><p className="text-base font-black text-slate-950">{institution.name} <Chip status={institution.status as StudyCatalogStatus} /></p><p className="text-xs text-slate-600">{[institution.city, INSTITUTION_TYPE_LABELS[institution.institutionType as keyof typeof INSTITUTION_TYPE_LABELS], institution.agencyRelation === "partner" ? "Partenaire" : "Référencé"].filter(Boolean).join(" · ")}</p>{institution.adminWebsite ? <a href={institution.adminWebsite} target="_blank" rel="noreferrer" className="break-all text-xs text-blue-800 underline">{institution.adminWebsite}</a> : null}</div>
        <div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setEditing(!editing)}>Modifier</Button><Button type="button" size="sm" variant="ghost" aria-label={`Supprimer ${institution.name}`} onClick={() => onDelete("institution", institution.id)}><Trash2 className="h-4 w-4 text-rose-700" aria-hidden="true" /></Button></div>
      </div>
      {editing ? <InstitutionForm sessionToken={sessionToken} countryCode={institution.countryCode} initial={institution} onSaved={() => { setEditing(false); onChanged(); }} /> : null}
      <div className="mt-3 space-y-3">
        {programs.map((program) => <ProgramBlock key={program.id} sessionToken={sessionToken} program={program} intakes={intakes.filter((item) => item.programId === program.id)} fees={fees.filter((item) => item.programId === program.id)} onChanged={onChanged} onDelete={onDelete} />)}
      </div>
      <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => setAddingProgram(!addingProgram)}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Ajouter un programme</Button>
      {addingProgram ? <ProgramForm sessionToken={sessionToken} institutionId={institution.id} onSaved={() => { setAddingProgram(false); onChanged(); }} /> : null}
    </div>
  );
}

function ProgramForm({ sessionToken, institutionId, initial, onSaved }: { sessionToken: string; institutionId: number; initial?: Tree["programs"][number]; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "", level: initial?.level ?? "bachelor", field: initial?.field ?? "", teachingLanguage: initial?.teachingLanguage ?? "", durationMonths: initial?.durationMonths ? String(initial.durationMonths) : "",
    mode: initial?.mode ?? "on_site", admissionNote: initial?.admissionNote ?? "", languageNote: initial?.languageNote ?? "", status: (initial?.status ?? "needs_review") as StudyCatalogStatus,
  });
  const save = trpc.studyCatalog.adminSaveProgram.useMutation({ onSuccess: () => { toast.success("Programme enregistré"); onSaved(); }, onError: (error) => toast.error("Programme refusé", { description: error.message }) });
  return (
    <div className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
      <Field label="Nom du programme" wide><Input className="mt-1" value={form.name} maxLength={255} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
      <Field label="Niveau"><select className={selectClass} value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value as typeof form.level })}>{STUDY_LEVELS.map((item) => <option key={item} value={item}>{STUDY_LEVEL_LABELS[item]}</option>)}</select></Field>
      <Field label="Domaine"><Input className="mt-1" value={form.field} maxLength={160} onChange={(event) => setForm({ ...form, field: event.target.value })} /></Field>
      <Field label="Langue des cours"><Input className="mt-1" value={form.teachingLanguage} maxLength={80} onChange={(event) => setForm({ ...form, teachingLanguage: event.target.value })} /></Field>
      <Field label="Durée (mois)"><Input className="mt-1" inputMode="numeric" value={form.durationMonths} onChange={(event) => setForm({ ...form, durationMonths: event.target.value.replace(/\D/g, "").slice(0, 3) })} /></Field>
      <Field label="Mode"><select className={selectClass} value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value as typeof form.mode })}>{STUDY_MODES.map((item) => <option key={item} value={item}>{STUDY_MODE_LABELS[item]}</option>)}</select></Field>
      <Field label="Conditions d'admission déclarées par l'école" wide><Textarea className="mt-1" rows={2} maxLength={3000} value={form.admissionNote} onChange={(event) => setForm({ ...form, admissionNote: event.target.value })} /></Field>
      <Field label="Exigence de langue"><Input className="mt-1" value={form.languageNote} maxLength={500} onChange={(event) => setForm({ ...form, languageNote: event.target.value })} /></Field>
      <StatusSelect value={form.status} onChange={(status) => setForm({ ...form, status })} />
      <div className="sm:col-span-2"><Button type="button" size="sm" disabled={save.isPending || form.name.trim().length < 2} onClick={() => save.mutate({ sessionToken, id: initial?.id, institutionId, name: form.name, level: form.level, field: form.field, teachingLanguage: form.teachingLanguage, durationMonths: form.durationMonths ? Number(form.durationMonths) : null, mode: form.mode, admissionNote: form.admissionNote, languageNote: form.languageNote, status: form.status, markChecked: true })}><Save className="mr-1 h-4 w-4" aria-hidden="true" />Enregistrer le programme</Button></div>
    </div>
  );
}

function ProgramBlock({ sessionToken, program, intakes, fees, onChanged, onDelete }: { sessionToken: string; program: Tree["programs"][number]; intakes: Tree["intakes"]; fees: Tree["fees"]; onChanged: () => void; onDelete: (kind: "institution" | "program" | "intake" | "fee", id: number) => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <article className="rounded-lg border border-slate-200 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><p className="text-sm font-black text-slate-900">{program.name} <Chip status={program.status as StudyCatalogStatus} /></p><p className="text-xs text-slate-600">{[STUDY_LEVEL_LABELS[program.level as keyof typeof STUDY_LEVEL_LABELS], program.field, program.teachingLanguage].filter(Boolean).join(" · ")}</p></div>
        <div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setEditing(!editing)}>Modifier</Button><Button type="button" size="sm" variant="ghost" aria-label={`Supprimer ${program.name}`} onClick={() => onDelete("program", program.id)}><Trash2 className="h-4 w-4 text-rose-700" aria-hidden="true" /></Button></div>
      </div>
      {editing ? <ProgramForm sessionToken={sessionToken} institutionId={program.institutionId} initial={program} onSaved={() => { setEditing(false); onChanged(); }} /> : null}
      <IntakesEditor sessionToken={sessionToken} programId={program.id} intakes={intakes} onChanged={onChanged} onDelete={onDelete} />
      <FeesEditor sessionToken={sessionToken} programId={program.id} fees={fees} onChanged={onChanged} onDelete={onDelete} />
    </article>
  );
}

function IntakesEditor({ sessionToken, programId, intakes, onChanged, onDelete }: { sessionToken: string; programId: number; intakes: Tree["intakes"]; onChanged: () => void; onDelete: (kind: "intake", id: number) => void }) {
  const [draft, setDraft] = useState({ label: "", startDate: "", applicationsOpenAt: "", applicationDeadline: "", availability: "open" as (typeof INTAKE_AVAILABILITIES)[number], status: "needs_review" as StudyCatalogStatus });
  const save = trpc.studyCatalog.adminSaveIntake.useMutation({ onSuccess: () => { toast.success("Rentrée enregistrée"); setDraft({ ...draft, label: "", startDate: "", applicationDeadline: "", applicationsOpenAt: "" }); onChanged(); }, onError: (error) => toast.error("Rentrée refusée", { description: error.message }) });
  const setStatus = (intake: Tree["intakes"][number], next: StudyCatalogStatus) => save.mutate({ sessionToken, id: intake.id, programId, label: intake.label, startDate: intake.startDate, applicationsOpenAt: intake.applicationsOpenAt, applicationDeadline: intake.applicationDeadline, documentsDeadline: intake.documentsDeadline, availability: intake.availability, status: next });
  return (
    <div className="mt-3">
      <h5 className="text-xs font-black uppercase tracking-wide text-slate-500">Rentrées ({intakes.length})</h5>
      <ul className="mt-1 space-y-1">
        {intakes.map((intake) => (
          <li key={intake.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><span><strong>{intake.label}</strong> · début {intake.startDate}{intake.applicationDeadline ? ` · limite ${intake.applicationDeadline}` : ""} · {INTAKE_AVAILABILITY_LABELS[intake.availability as keyof typeof INTAKE_AVAILABILITY_LABELS]}</span>
            <span className="flex items-center gap-1"><select aria-label="Statut de la rentrée" className="h-8 rounded-md border border-slate-300 bg-white px-1 text-xs" value={intake.status} onChange={(event) => setStatus(intake, event.target.value as StudyCatalogStatus)}>{CATALOG_STATUSES.map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}</select><Button type="button" variant="ghost" size="sm" aria-label={`Supprimer la rentrée ${intake.label}`} onClick={() => onDelete("intake", intake.id)}><Trash2 className="h-3 w-3 text-rose-700" aria-hidden="true" /></Button></span></li>
        ))}
      </ul>
      <div className="mt-2 grid gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-3">
        <Field label="Intitulé (ex. Automne 2027)"><Input className="mt-1" value={draft.label} maxLength={120} onChange={(event) => setDraft({ ...draft, label: event.target.value })} /></Field>
        <Field label="Début des cours"><Input className="mt-1" type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} /></Field>
        <Field label="Ouverture des candidatures"><Input className="mt-1" type="date" value={draft.applicationsOpenAt} onChange={(event) => setDraft({ ...draft, applicationsOpenAt: event.target.value })} /></Field>
        <Field label="Date limite"><Input className="mt-1" type="date" value={draft.applicationDeadline} onChange={(event) => setDraft({ ...draft, applicationDeadline: event.target.value })} /></Field>
        <Field label="Disponibilité"><select className={selectClass} value={draft.availability} onChange={(event) => setDraft({ ...draft, availability: event.target.value as typeof draft.availability })}>{INTAKE_AVAILABILITIES.map((item) => <option key={item} value={item}>{INTAKE_AVAILABILITY_LABELS[item]}</option>)}</select></Field>
        <StatusSelect value={draft.status} onChange={(status) => setDraft({ ...draft, status })} />
        <div className="sm:col-span-3"><Button type="button" size="sm" disabled={save.isPending || draft.label.trim().length < 2 || !draft.startDate} onClick={() => save.mutate({ sessionToken, programId, label: draft.label, startDate: draft.startDate, applicationsOpenAt: draft.applicationsOpenAt || null, applicationDeadline: draft.applicationDeadline || null, documentsDeadline: null, availability: draft.availability, status: draft.status })}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Ajouter la rentrée</Button></div>
      </div>
    </div>
  );
}

function FeesEditor({ sessionToken, programId, fees, onChanged, onDelete }: { sessionToken: string; programId: number; fees: Tree["fees"]; onChanged: () => void; onDelete: (kind: "fee", id: number) => void }) {
  const [draft, setDraft] = useState({ academicYear: "", studentCategory: "international" as (typeof STUDENT_CATEGORIES)[number], amount: "", currency: "", period: "year" as (typeof TUITION_PERIODS)[number], applicationFee: "", sourceNote: "", status: "needs_review" as StudyCatalogStatus, markChecked: false });
  const save = trpc.studyCatalog.adminSaveFee.useMutation({ onSuccess: () => { toast.success("Scolarité enregistrée"); setDraft({ ...draft, amount: "", applicationFee: "", sourceNote: "", markChecked: false }); onChanged(); }, onError: (error) => toast.error("Scolarité refusée", { description: error.message }) });
  return (
    <div className="mt-3">
      <h5 className="text-xs font-black uppercase tracking-wide text-slate-500">Scolarités ({fees.length})</h5>
      <ul className="mt-1 space-y-1">
        {fees.map((fee) => (
          <li key={fee.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>{fee.academicYear} · {fee.studentCategory === "international" ? "internationale" : "locale"} · <strong>{Number(fee.amount).toLocaleString("fr-FR")} {fee.currency}</strong> {TUITION_PERIOD_LABELS[fee.period as keyof typeof TUITION_PERIOD_LABELS]} · <Chip status={fee.status as StudyCatalogStatus} /> · {tuitionFreshness(fee.checkedAt) === "fresh" ? "relue" : "à reconfirmer"}{fee.sourceNote ? ` · source : ${fee.sourceNote}` : ""}</span>
            <Button type="button" variant="ghost" size="sm" aria-label={`Supprimer la scolarité ${fee.academicYear}`} onClick={() => onDelete("fee", fee.id)}><Trash2 className="h-3 w-3 text-rose-700" aria-hidden="true" /></Button></li>
        ))}
      </ul>
      <div className="mt-2 grid gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-3">
        <Field label="Année académique (2026-2027)"><Input className="mt-1" value={draft.academicYear} maxLength={9} onChange={(event) => setDraft({ ...draft, academicYear: event.target.value })} /></Field>
        <Field label="Montant"><Input className="mt-1" inputMode="decimal" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value.replace(",", ".").replace(/[^0-9.]/g, "") })} /></Field>
        <Field label="Devise (EUR, CAD…)"><Input className="mt-1" value={draft.currency} maxLength={3} onChange={(event) => setDraft({ ...draft, currency: event.target.value.toUpperCase() })} /></Field>
        <Field label="Période"><select className={selectClass} value={draft.period} onChange={(event) => setDraft({ ...draft, period: event.target.value as typeof draft.period })}>{TUITION_PERIODS.map((item) => <option key={item} value={item}>{TUITION_PERIOD_LABELS[item]}</option>)}</select></Field>
        <Field label="Catégorie"><select className={selectClass} value={draft.studentCategory} onChange={(event) => setDraft({ ...draft, studentCategory: event.target.value as typeof draft.studentCategory })}>{STUDENT_CATEGORIES.map((item) => <option key={item} value={item}>{item === "international" ? "Internationale" : "Locale"}</option>)}</select></Field>
        <Field label="Frais de dossier (facultatif)"><Input className="mt-1" inputMode="decimal" value={draft.applicationFee} onChange={(event) => setDraft({ ...draft, applicationFee: event.target.value.replace(",", ".").replace(/[^0-9.]/g, "") })} /></Field>
        <Field label="Provenance du montant (administration seulement)" wide><Input className="mt-1" value={draft.sourceNote} maxLength={500} onChange={(event) => setDraft({ ...draft, sourceNote: event.target.value })} /></Field>
        <StatusSelect value={draft.status} onChange={(status) => setDraft({ ...draft, status })} />
        <label className="flex items-start gap-2 text-xs text-slate-700 sm:col-span-3"><input type="checkbox" className="mt-0.5" checked={draft.markChecked} onChange={(event) => setDraft({ ...draft, markChecked: event.target.checked })} />J'ai relu ce montant aujourd'hui (obligatoire pour publier).</label>
        <div className="sm:col-span-3"><Button type="button" size="sm" disabled={save.isPending || !draft.amount || draft.currency.length !== 3} onClick={() => save.mutate({ sessionToken, programId, academicYear: draft.academicYear, studentCategory: draft.studentCategory, amount: Number(draft.amount), currency: draft.currency, period: draft.period, applicationFee: draft.applicationFee ? Number(draft.applicationFee) : null, sourceNote: draft.sourceNote, status: draft.status, markChecked: draft.markChecked })}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Ajouter la scolarité</Button></div>
      </div>
    </div>
  );
}
