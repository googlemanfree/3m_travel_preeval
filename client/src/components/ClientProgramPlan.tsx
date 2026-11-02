import { AlertCircle, CheckCircle2, Circle, ClipboardList, FileText, ListChecks, Route } from "lucide-react";
import { buildClientPlan } from "@shared/dynamicForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFormOverrides } from "@/hooks/useFormOverrides";

type Props = {
  projectType?: string | null;
  country?: string | null;
  /** Réponses du formulaire d'évaluation (déjà nettoyées côté serveur). */
  projectDetails?: Record<string, unknown> | null;
  /** Colonnes de l'évaluation utiles aux règles (niveau de langue…). */
  columns?: Record<string, string>;
  uploadedDocuments?: Array<{ documentType?: string | null; documentName?: string | null }>;
  /** Lignes de la checklist du dossier (même liste et mêmes états que l'onglet Documents) : évite deux listes qui se contredisent. */
  documentLines?: Array<{ label: string; received: boolean; replace?: boolean }>;
  onOpenDocuments?: () => void;
  onEditEvaluation?: () => void;
};

/**
 * « Votre parcours » dans l'espace client : actions, pièces et réponses propres au pays, au visa ou programme et au domaine
 * que le candidat a choisis dans son évaluation. Uniquement des repères de préparation, confirmés ensuite par un conseiller.
 */
export function ClientProgramPlan({ projectType, country, projectDetails, columns, uploadedDocuments = [], documentLines, onOpenDocuments, onEditEvaluation }: Props) {
  const overrides = useFormOverrides();
  const plan = buildClientPlan({ projectType, country, details: projectDetails, uploaded: uploadedDocuments, columns, overrides });
  if (!plan) return null;
  const documents: Array<{ label: string; received: boolean; replace?: boolean }> = documentLines && documentLines.length > 0 ? documentLines : plan.documents;
  const received = documents.filter((document) => document.received).length;
  return (
    <Card className="border-emerald-200 bg-white p-6 shadow-sm" data-testid="client-program-plan" role="region" aria-labelledby="client-plan-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="client-plan-title" className="flex items-center gap-2 text-lg font-bold text-slate-950"><Route className="h-5 w-5 text-emerald-700" aria-hidden="true" />Votre parcours</h3>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
            {plan.countryName && <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-sky-900">{plan.countryName}</span>}
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-900">{plan.programLabel}</span>
            {plan.domainLabel && <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-violet-900">{plan.domainLabel}</span>}
          </p>
          <p className="mt-2 text-sm text-slate-600">{plan.blurb}</p>
        </div>
        {onEditEvaluation && <Button type="button" variant="outline" size="sm" onClick={onEditEvaluation}>Modifier mon évaluation</Button>}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="client-plan-actions">
          <h4 id="client-plan-actions" className="flex items-center gap-2 text-sm font-black text-slate-900"><ListChecks className="h-4 w-4 text-emerald-700" aria-hidden="true" />Vos prochaines actions</h4>
          <ol className="mt-2 space-y-2" data-testid="client-plan-actions">
            {plan.actions.map((action, index) => (
              <li key={action.id} className="flex gap-2 rounded-lg bg-emerald-50 p-2.5 text-sm text-emerald-950"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-black text-white" aria-hidden="true">{index + 1}</span><span>{action.text}</span></li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="client-plan-documents">
          <h4 id="client-plan-documents" className="flex items-center gap-2 text-sm font-black text-slate-900"><FileText className="h-4 w-4 text-amber-700" aria-hidden="true" />Pièces à préparer pour ce parcours <span className="font-semibold text-slate-500">({received}/{documents.length} reçues)</span></h4>
          <ul className="mt-2 space-y-1.5" data-testid="client-plan-documents">
            {documents.map((document) => (
              <li key={document.label} className="flex items-start gap-2 text-sm text-slate-800">
                {document.received ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Reçue" /> : document.replace ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-label="À remplacer" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-label="À fournir" />}
                <span className={document.received ? "text-slate-500 line-through decoration-slate-300" : ""}>{document.label}{document.replace ? <span className="ml-1 text-xs font-semibold text-rose-700">(à remplacer)</span> : null}</span>
              </li>
            ))}
          </ul>
          {onOpenDocuments && <Button type="button" variant="link" size="sm" className="mt-1 h-auto px-0 text-xs" onClick={onOpenDocuments}>Voir la checklist complète et déposer mes pièces</Button>}
        </section>
      </div>

      {plan.answers.length > 0 && (
        <details className="mt-5 rounded-lg border border-slate-200 p-3 text-sm" data-testid="client-plan-answers">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold text-slate-900"><ClipboardList className="h-4 w-4" aria-hidden="true" />Ce que vous avez déclaré ({plan.answers.length})</summary>
          <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">{plan.answers.map((answer) => <div key={answer.key}><dt className="text-xs font-semibold text-slate-500">{answer.question}</dt><dd className="text-slate-900">{answer.answer}</dd></div>)}</dl>
        </details>
      )}
      <p className="mt-4 text-xs leading-5 text-slate-500">Repères de préparation établis à partir de vos réponses. La liste définitive des pièces et les conditions du pays sont confirmées par votre conseiller à partir de la source officielle ; rien ici ne garantit un visa ni une décision.</p>
    </Card>
  );
}
