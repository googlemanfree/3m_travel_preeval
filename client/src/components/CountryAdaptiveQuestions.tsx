import { useId } from "react";
import { Globe2 } from "lucide-react";
import { buildCountryAdaptiveFields, describeCountryContext, type CountryAdaptiveField, type CountryAdaptiveProjectType } from "@shared/countryEvaluationProfile";

type Props = {
  projectType: CountryAdaptiveProjectType;
  country: string;
  answers: Record<string, string>;
  onAnswer: (key: string, value: string) => void;
  /** Évite de redemander la langue quand le formulaire la demande déjà pour ce pays (Canada, Allemagne). */
  skipLanguage?: boolean;
};

/** Transforme les réponses en couples question / réponse lisibles, enregistrés avec le dossier d'évaluation. */
export function buildCountryResponses(fields: CountryAdaptiveField[], answers: Record<string, string>): Array<{ question: string; answer: string }> {
  return fields.flatMap((field) => {
    const raw = (answers[field.key] ?? "").trim();
    if (!raw) return [];
    const label = field.options?.find((option) => option.value === raw)?.label ?? raw;
    return [{ question: field.label.slice(0, 260), answer: label.slice(0, 1000) }];
  });
}

export function CountryAdaptiveQuestions({ projectType, country, answers, onAnswer, skipLanguage }: Props) {
  const baseId = useId();
  const fields = buildCountryAdaptiveFields(projectType, country, { skipLanguage });
  if (!fields.length) return null;
  const context = describeCountryContext(country);

  return (
    <section className="md:col-span-2 rounded-2xl border border-sky-200 bg-sky-50 p-4" data-testid="country-adaptive-questions" aria-labelledby={`${baseId}-title`}>
      <div className="flex items-start gap-3">
        <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" aria-hidden="true" />
        <div>
          <h4 id={`${baseId}-title`} className="font-black text-sky-950">Questions adaptées à votre destination : {country}</h4>
          {context.map((line) => <p key={line} className="mt-1 text-sm leading-6 text-sky-950">{line}</p>)}
          <p className="mt-1 text-xs leading-5 text-sky-900">Toutes ces questions sont facultatives : elles permettent à votre conseiller de préparer un dossier plus précis.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {fields.map((field) => {
          const id = `${baseId}-${field.key}`;
          return (
            <div key={field.key}>
              <label htmlFor={id} className="block text-sm font-semibold text-slate-900">{field.label}</label>
              {field.kind === "select" ? (
                <select id={id} value={answers[field.key] ?? ""} onChange={(event) => onAnswer(field.key, event.target.value)} className="mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600">
                  <option value="">Sélectionner</option>
                  {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <input id={id} type="text" value={answers[field.key] ?? ""} onChange={(event) => onAnswer(field.key, event.target.value)} placeholder={field.placeholder} maxLength={200} className="mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-600" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
