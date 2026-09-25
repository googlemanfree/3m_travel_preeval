import React from "react";
import { Check, ChevronDown, LockKeyhole, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { buildStepperView, lockedReason, type ProcedureStep, type StepGroup } from "@/lib/procedureStepper";

type Props = {
  title: string;
  steps: ProcedureStep[];
  currentStepIndex: number;
  internalCount: number;
  officialSources?: string[];
  busy?: boolean;
  onValidate: (step: ProcedureStep) => void;
  onUnlock: (step: ProcedureStep) => void;
  onUndo: (step: ProcedureStep) => void;
};

function StepRow({ step, currentStepIndex, busy, onUnlock, onUndo }: { step: ProcedureStep; currentStepIndex: number; busy?: boolean; onUnlock: (step: ProcedureStep) => void; onUndo: (step: ProcedureStep) => void }) {
  const done = step.state === "completed";
  const current = step.state === "current";
  return (
    <li className="flex items-center gap-3 px-3 py-2" data-testid={`stepper-row-${step.index}`} data-state={step.state} title={step.description ?? undefined}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${done ? "bg-emerald-600 text-white" : current ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-500"}`} aria-hidden="true">
        {done ? <Check className="h-3.5 w-3.5" /> : current ? <Play className="h-3 w-3" /> : <LockKeyhole className="h-3 w-3" />}
      </span>
      <span className={`min-w-0 flex-1 truncate text-sm ${current ? "font-semibold text-slate-900" : done ? "text-slate-700" : "text-slate-500"}`}>{step.index + 1}. {step.label}</span>
      {step.state === "locked" && <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Verrouillé</span>}
      {done && <button type="button" disabled={busy} onClick={() => onUndo(step)} className="text-xs font-semibold text-rose-700 hover:underline disabled:opacity-50" aria-label={`Annuler la validation de l’étape ${step.index + 1}`}>Annuler</button>}
      {step.state === "locked" && <button type="button" disabled={busy} onClick={() => onUnlock(step)} title={`Étape bloquée : ${lockedReason(step, currentStepIndex)}`} className="text-xs font-semibold text-amber-700 hover:underline disabled:opacity-50" aria-label={`Déverrouiller l’étape ${step.index + 1} hors séquence`}>Déverrouiller</button>}
    </li>
  );
}

function Group({ group, currentStepIndex, busy, onUnlock, onUndo }: { group: StepGroup; currentStepIndex: number; busy?: boolean; onUnlock: (step: ProcedureStep) => void; onUndo: (step: ProcedureStep) => void }) {
  return (
    <div>
      <p className="bg-slate-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">{group.title} · {group.done}/{group.steps.length}</p>
      <ul className="divide-y">{group.steps.map((step) => <StepRow key={step.id} step={step} currentStepIndex={currentStepIndex} busy={busy} onUnlock={onUnlock} onUndo={onUndo} />)}</ul>
    </div>
  );
}

/** Parcours du dossier : l'étape en cours en grand, les suivantes en une ligne, la liste complète repliée. */
export default function ProcedureStepper({ title, steps, currentStepIndex, internalCount, officialSources, busy, onValidate, onUnlock, onUndo }: Props) {
  const view = buildStepperView({ steps, currentStepIndex, internalCount });
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5" aria-labelledby="stepper-title" data-testid="procedure-stepper">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Parcours du dossier</p>
          <h4 id="stepper-title" className="mt-0.5 text-lg font-bold text-slate-950">{title}</h4>
          <p className="mt-0.5 text-xs text-slate-500">Même séquence que dans l’espace candidat : chaque validation y est synchronisée.</p>
        </div>
        <div className="w-full sm:w-56">
          <p className="flex items-baseline justify-between text-sm font-semibold text-slate-900" data-testid="stepper-position"><span>{view.finished ? "Parcours terminé" : `Étape ${view.position} sur ${view.total}`}</span><span className="text-blue-700">{view.percent}%</span></p>
          <Progress className="mt-1.5 h-2 bg-blue-100" value={view.percent} aria-label={`Avancement du parcours : ${view.percent}%`} />
        </div>
      </div>

      {view.current ? (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4" data-testid="stepper-current">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Étape en cours</p>
          <p className="mt-1 text-base font-bold text-slate-950">{view.current.index + 1}. {view.current.label}</p>
          {view.current.description && <p className="mt-1 text-sm leading-6 text-slate-700">{view.current.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" size="sm" className="bg-blue-700 hover:bg-blue-800" disabled={busy} onClick={() => onValidate(view.current as ProcedureStep)}>{busy ? "Validation…" : "Marquer l’étape comme faite"}</Button>
            {view.current.sourceUrl && <a href={view.current.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 underline">Source officielle</a>}
          </div>
        </div>
      ) : view.finished ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900" data-testid="stepper-finished">Toutes les étapes du parcours sont validées.</p>
      ) : null}

      {view.upcoming.length > 0 && (
        <div className="mt-3" data-testid="stepper-upcoming">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ensuite</p>
          <ul className="mt-1 space-y-0.5">{view.upcoming.map((step) => <li key={step.id} className="truncate text-sm text-slate-600">{step.index + 1}. {step.label}</li>)}</ul>
          <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-amber-700" data-testid="stepper-blocked-note"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>Progression indisponible : {lockedReason(view.upcoming[0], currentStepIndex)}</span></p>
        </div>
      )}

      <details className="group mt-4 rounded-xl border" data-testid="stepper-all">
        <summary className="flex cursor-pointer select-none items-center justify-between p-3 text-sm font-semibold text-slate-800">Toutes les étapes ({view.done}/{view.total} validées)<ChevronDown className="h-4 w-4 text-slate-500 transition group-open:rotate-180" aria-hidden="true" /></summary>
        <div className="divide-y border-t">
          {view.groups.map((group) => <Group key={group.id} group={group} currentStepIndex={currentStepIndex} busy={busy} onUnlock={onUnlock} onUndo={onUndo} />)}
        </div>
      </details>

      <p className={`mt-3 text-xs ${officialSources && officialSources.length ? "text-slate-500" : "font-medium text-amber-700"}`}>
        {officialSources && officialSources.length ? `Sources institutionnelles : ${officialSources.join(" · ")}` : "Source institutionnelle à vérifier avant toute étape spécifique."}
      </p>
    </section>
  );
}
