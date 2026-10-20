import { AlertTriangle, ClipboardList } from "lucide-react";
import { buildClientPlan } from "@shared/dynamicForm";
import { Badge } from "@/components/ui/badge";
import { useFormOverrides } from "@/hooks/useFormOverrides";

type Props = {
  projectType?: string | null;
  country?: string | null;
  details?: Record<string, unknown> | null;
  columns?: Record<string, string>;
};

/**
 * Lecture conseiller du formulaire dynamique : visa ou programme, domaine, complétude, points à clarifier et réponses
 * avec leurs libellés (plus de codes bruts). Les points à clarifier sont des questions à poser, jamais des accusations.
 */
export function AdminDeclaredAnswersPanel({ projectType, country, details, columns }: Props) {
  const overrides = useFormOverrides();
  const plan = buildClientPlan({ projectType, country, details, columns, overrides });
  if (!plan) return null;
  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm" data-testid="admin-declared-answers" aria-labelledby="admin-declared-title">
      <div className="flex flex-wrap items-center gap-2">
        <h4 id="admin-declared-title" className="flex items-center gap-2 text-sm font-black text-slate-950"><ClipboardList className="h-4 w-4 text-emerald-700" aria-hidden="true" />Formulaire d’évaluation — réponses déclarées</h4>
        {plan.countryName && <Badge className="border-sky-200 bg-sky-50 text-sky-900">{plan.countryName}</Badge>}
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-900">{plan.programLabel}</Badge>
        {plan.domainLabel && <Badge className="border-violet-200 bg-violet-50 text-violet-900">{plan.domainLabel}</Badge>}
        <span className="ml-auto text-xs font-semibold text-slate-600" data-testid="admin-declared-completeness">{plan.completeness.answered}/{plan.completeness.total} réponses ({plan.completeness.percent} %)</span>
      </div>
      {plan.completeness.missingRequired.length > 0 && <p className="mt-2 text-xs text-amber-900">Questions obligatoires sans réponse : {plan.completeness.missingRequired.join(" ; ")}.</p>}
      <section className="mt-3" aria-labelledby="admin-declared-followups" data-testid="admin-declared-followups">
        <h5 id="admin-declared-followups" className="text-xs font-black uppercase tracking-wide text-emerald-800">À suivre avec le candidat</h5>
        <ul className="mt-1.5 space-y-1 text-sm text-slate-800">{plan.staffActions.map((action) => <li key={action.id} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden="true" />{action.text}</li>)}</ul>
      </section>
      {plan.flags.length > 0 && (
        <ul className="mt-3 space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" aria-label="Points à clarifier avec le candidat" data-testid="admin-declared-flags">
          {plan.flags.map((flag) => <li key={flag.code} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{flag.message}</span></li>)}
        </ul>
      )}
      {plan.answers.length > 0
        ? <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">{plan.answers.map((answer) => <div key={answer.key}><dt className="text-xs font-semibold text-slate-500">{answer.question}</dt><dd className="text-slate-900">{answer.answer}</dd></div>)}</dl>
        : <p className="mt-3 text-sm text-slate-600">Aucune réponse propre au parcours n’a été renseignée.</p>}
    </section>
  );
}
