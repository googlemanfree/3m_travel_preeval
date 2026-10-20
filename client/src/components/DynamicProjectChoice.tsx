import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ListChecks, Wand2 } from "lucide-react";
import { DOMAINS, diffForms, type FormChange, type ProgramDef, type ProjectKind, type ResolvedForm } from "@shared/dynamicForm";
import { Label } from "@/components/ui/label";

const KIND_CHOICES: Array<{ kind: ProjectKind; label: string; hint: string }> = [
  { kind: "travail", label: "Travailler", hint: "Emploi, recherche d’emploi, formation en entreprise, activité à créer" },
  { kind: "etudes", label: "Étudier ou se former", hint: "Études supérieures, formation professionnelle, langue, recherche" },
  { kind: "tourisme", label: "Séjour temporaire", hint: "Tourisme, visite à un proche, affaires, soins, transit" },
  { kind: "evisa", label: "e-Visa", hint: "Visa en ligne ou autorisation électronique de voyage" },
  { kind: "immigration", label: "S’installer", hint: "Résidence, regroupement familial, retraite" },
];

type Props = {
  /** Le formulaire public choisit déjà le type de projet : le sélecteur de type peut être masqué. */
  showKind?: boolean;
  form: ResolvedForm;
  projectKind: ProjectKind;
  programId: string;
  domainId: string;
  onKind: (kind: ProjectKind) => void;
  onProgram: (programId: string) => void;
  onDomain: (domainId: string) => void;
};

function describeChange(change: FormChange): string | null {
  if (!change.addedFields && !change.removedFields && !change.addedSections.length && !change.removedSections.length) return null;
  const parts: string[] = [];
  if (change.addedFields) parts.push(`${change.addedFields} question(s) ajoutée(s)`);
  if (change.removedFields) parts.push(`${change.removedFields} question(s) retirée(s)`);
  const sections = change.addedSections.length ? ` Nouveau : ${change.addedSections.join(", ")}.` : "";
  return `Formulaire adapté à votre choix : ${parts.join(", ")}.${sections}`;
}

/**
 * Le choix qui pilote tout le formulaire : type de projet, visa ou programme, domaine métier. Chaque changement recompose les
 * sections en dessous ; le résultat est annoncé (région « status ») pour les lecteurs d'écran.
 */
export function DynamicProjectChoice({ form, projectKind, programId, domainId, onKind, onProgram, onDomain, showKind = true }: Props) {
  const previous = useRef<ResolvedForm | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const signature = `${form.program.id}|${form.domain?.id ?? ""}|${form.countryCode ?? form.countryName ?? ""}`;
  useEffect(() => {
    const message = previous.current ? describeChange(diffForms(previous.current, form)) : null;
    if (message) setAnnouncement(message);
    previous.current = form;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <section className="space-y-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 md:p-5" aria-labelledby="dyn-project-title" data-testid="dynamic-project-choice">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Étape 1 — votre projet</p>
        <h2 id="dyn-project-title" className="mt-1 text-lg font-bold text-slate-900">Choisissez votre projet : le formulaire s’adapte à chaque choix</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">Le pays, le visa ou programme et votre domaine changent les questions posées. Rien n’est confirmé à ce stade : un conseiller vérifie chaque dossier avec les sources officielles.</p>
      </div>

      {showKind && <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-800">Que souhaitez-vous faire ? *</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Type de projet">
          {KIND_CHOICES.map((choice) => {
            const selected = projectKind === choice.kind;
            return (
              <label key={choice.kind} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm transition focus-within:ring-2 focus-within:ring-blue-500 ${selected ? "border-blue-600 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-300"}`}>
                <input type="radio" name="project-kind" value={choice.kind} checked={selected} onChange={() => onKind(choice.kind)} className="mt-1 h-4 w-4 accent-blue-700" />
                <span><strong className="block text-slate-900">{choice.label}</strong><span className="text-xs leading-5 text-slate-600">{choice.hint}</span></span>
              </label>
            );
          })}
        </div>
      </fieldset>}

      <fieldset id="dyn-program" tabIndex={-1} className="focus:outline-none">
        <legend className="mb-2 text-sm font-semibold text-slate-800">Quel visa ou programme vous correspond ? *</legend>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Visa ou programme">
          {form.programs.map((program: ProgramDef) => {
            const selected = programId === program.id;
            return (
              <label key={program.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm transition focus-within:ring-2 focus-within:ring-emerald-500 ${selected ? "border-emerald-600 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
                <input type="radio" name="project-program" value={program.id} checked={selected} onChange={() => onProgram(program.id)} className="mt-1 h-4 w-4 accent-emerald-700" />
                <span><strong className="block text-slate-900">{program.label}</strong><span className="text-xs leading-5 text-slate-600">{program.who}</span></span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">Un même pays ne propose pas tous les programmes sous ces noms : la disponibilité se confirme sur la source officielle.</p>
      </fieldset>

      {form.domains.length > 0 && (
        <div>
          <Label htmlFor="dyn-domain">Dans quel domaine ? <span className="font-normal text-slate-500">(les questions s’adaptent à votre métier)</span></Label>
          <select id="dyn-domain" value={domainId} onChange={(event) => onDomain(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Je choisirai plus tard</option>
            {DOMAINS.map((domain) => <option key={domain.id} value={domain.id}>{domain.label}</option>)}
          </select>
          {form.domain && <p className="mt-1 text-xs text-slate-600">{form.domain.hint}</p>}
        </div>
      )}

      <div className="rounded-xl border border-emerald-200 bg-white p-3 text-sm" data-testid="dynamic-summary">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900"><Wand2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />Formulaire adapté à :
          {form.countryName && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-900">{form.countryName}</span>}
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">{form.program.id.endsWith("-orientation") ? "Orientation générale" : form.program.label}</span>
          {form.domain && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-900">{form.domain.label}</span>}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{form.blurb}</p>
        <p className="sr-only" role="status" aria-live="polite" data-testid="dynamic-announcement">{announcement ?? ""}</p>
        {announcement && <p aria-hidden="true" className="mt-2 flex items-start gap-1.5 text-xs font-medium text-emerald-800"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{announcement}</p>}
      </div>
    </section>
  );
}

/** Pièces souvent utiles pour le programme et le domaine choisis : un repère de préparation, confirmé ensuite par un conseiller. */
export function DynamicDocumentsHint({ form }: { form: ResolvedForm }) {
  if (form.documents.length === 0) return null;
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4" aria-labelledby="dyn-documents-title" data-testid="dynamic-documents">
      <h2 id="dyn-documents-title" className="flex items-center gap-2 text-base font-bold text-amber-950"><ListChecks className="h-4 w-4" aria-hidden="true" />Pièces à préparer pour ce parcours</h2>
      <p className="mt-1 text-xs leading-5 text-amber-950">Repères généraux, adaptés à votre visa ou programme{form.domain ? ` et à votre domaine (${form.domain.label})` : ""}. La liste définitive est confirmée par un conseiller à partir de la source officielle du pays.</p>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-amber-950">{form.documents.map((line) => <li key={line}>{line}</li>)}</ul>
    </section>
  );
}
