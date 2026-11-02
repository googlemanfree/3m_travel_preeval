import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Briefcase, Globe2, GraduationCap, Sparkles, UserRound } from "lucide-react";
import type { DynamicField, DynamicSection, FormLayer, FormValues } from "@shared/dynamicForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const LAYER_STYLE: Record<FormLayer, { box: string; chip: string; icon: typeof UserRound }> = {
  profil: { box: "border-slate-200 bg-white", chip: "bg-slate-100 text-slate-700", icon: UserRound },
  programme: { box: "border-emerald-200 bg-emerald-50/50", chip: "bg-emerald-100 text-emerald-900", icon: GraduationCap },
  domaine: { box: "border-violet-200 bg-violet-50/50", chip: "bg-violet-100 text-violet-900", icon: Briefcase },
  pays: { box: "border-sky-200 bg-sky-50/50", chip: "bg-sky-100 text-sky-900", icon: Globe2 },
};

const selectClass = "mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

type Props = {
  sections: DynamicSection[];
  values: FormValues;
  onChange: (key: string, value: string) => void;
  /** Champs pré-remplis depuis le CV (colonnes de l'évaluation) : mis en évidence pour que le candidat les vérifie. */
  autoFilled?: Set<string>;
  idPrefix?: string;
  /** Identifiants (`dyn-<clé>`) des champs refusés à la validation : marqués aria-invalid. */
  invalid?: Set<string>;
};

function FieldControl({ field, value, onChange, prefilled, idPrefix, invalid }: { field: DynamicField; value: string; onChange: (value: string) => void; prefilled: boolean; idPrefix: string; invalid: boolean }) {
  const id = `${idPrefix}-${field.key}`;
  const helpId = field.help ? `${id}-help` : undefined;
  const ring = prefilled ? " border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200" : "";
  return (
    <div className={field.wide || field.kind === "textarea" ? "sm:col-span-2" : ""} data-field={field.key}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor={id}>{field.label}{field.required ? <span aria-hidden="true"> *</span> : null}</Label>
        {prefilled && <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800"><Sparkles className="h-3 w-3" aria-hidden="true" />Pré-rempli depuis le CV</span>}
      </div>
      {field.kind === "select" ? (
        <select id={id} value={value} aria-invalid={invalid || undefined} aria-required={field.required || undefined} aria-describedby={helpId} onChange={(event) => onChange(event.target.value)} className={selectClass + ring}>
          <option value="">Sélectionner…</option>
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.kind === "textarea" ? (
        <Textarea id={id} value={value} aria-invalid={invalid || undefined} aria-required={field.required || undefined} aria-describedby={helpId} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} rows={3} maxLength={field.maxLength ?? 1000} className={"mt-1 bg-white" + ring} />
      ) : (
        <Input id={id} type={field.kind === "date" ? "date" : "text"} value={value} aria-invalid={invalid || undefined} aria-required={field.required || undefined} aria-describedby={helpId} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} maxLength={field.maxLength ?? 255} className={"mt-1 bg-white" + ring} />
      )}
      {field.help && <p id={helpId} className="mt-1 text-xs leading-5 text-slate-600">{field.help}</p>}
    </div>
  );
}

/**
 * Affiche les sections calculées par le moteur de formulaire. Quand le candidat change de pays, de visa ou de domaine,
 * des sections apparaissent et d'autres disparaissent : chaque section dit d'où elle vient (« Ajouté pour : … »).
 */
export function DynamicFormSections({ sections, values, onChange, autoFilled, idPrefix = "dyn", invalid }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="space-y-5" data-testid="dynamic-form-sections">
      <AnimatePresence initial={false}>
        {sections.map((section) => {
          const style = LAYER_STYLE[section.layer];
          const Icon = style.icon;
          return (
            <motion.section
              key={section.id}
              layout={reduceMotion ? false : "position"}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
              className={`rounded-2xl border p-4 md:p-5 ${style.box}`}
              aria-labelledby={`${idPrefix}-${section.id}-title`}
              data-section={section.id}
              data-layer={section.layer}
            >
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  <h2 id={`${idPrefix}-${section.id}-title`} className="text-lg font-bold text-blue-900">{section.title}</h2>
                  {section.chip && <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${style.chip}`}>Ajouté pour : {section.chip.replace(/^[^:]+ : /, "")}</span>}
                </div>
                {section.intro && <p className="mt-1 text-sm leading-6 text-slate-600">{section.intro}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <FieldControl key={field.key} field={field} value={values[field.key] ?? ""} onChange={(value) => onChange(field.key, value)} prefilled={Boolean(autoFilled?.has(field.key))} idPrefix={idPrefix} invalid={Boolean(invalid?.has(`${idPrefix}-${field.key}`))} />
                ))}
              </div>
            </motion.section>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
