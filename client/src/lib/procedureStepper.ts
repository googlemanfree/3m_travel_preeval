/**
 * Frise d'avancement de la procédure (vue administrateur) : ce qui est fait, l'étape en cours, ce qui vient ensuite.
 * Logique pure : la vue n'affiche que ce calcul, et les actions passent par les mêmes procédures que l'ancien écran.
 */

export type StepState = "completed" | "current" | "locked";

export type ProcedureStep = {
  id: string;
  index: number;
  label: string;
  description?: string | null;
  state: StepState | string;
  sourceUrl?: string | null;
};

export type StepGroup = { id: "internal" | "country"; title: string; steps: ProcedureStep[]; done: number };

export type StepperView = {
  total: number;
  done: number;
  percent: number;
  /** Numéro (à partir de 1) de l'étape en cours, ou `total` quand tout est terminé. */
  position: number;
  finished: boolean;
  current: ProcedureStep | null;
  upcoming: ProcedureStep[];
  groups: StepGroup[];
};

export const INTERNAL_GROUP_TITLE = "Traitement interne 3M";
export const COUNTRY_GROUP_TITLE = "Étapes officielles du pays";
export const UPCOMING_LIMIT = 3;

const normalizeState = (state: unknown): StepState => (state === "completed" ? "completed" : state === "current" ? "current" : "locked");

export function buildStepperView(input: { steps: readonly ProcedureStep[]; currentStepIndex: number; internalCount: number }): StepperView {
  const steps = [...input.steps].sort((a, b) => a.index - b.index).map((step) => ({ ...step, state: normalizeState(step.state) }));
  const total = steps.length;
  const done = steps.filter((step) => step.state === "completed").length;
  const current = steps.find((step) => step.state === "current") ?? null;
  const upcoming = steps.filter((step) => step.state === "locked" && (!current || step.index > current.index)).slice(0, UPCOMING_LIMIT);
  const internal = steps.filter((step) => step.index < input.internalCount);
  const country = steps.filter((step) => step.index >= input.internalCount);
  const groups: StepGroup[] = [];
  if (internal.length) groups.push({ id: "internal", title: INTERNAL_GROUP_TITLE, steps: internal, done: internal.filter((step) => step.state === "completed").length });
  if (country.length) groups.push({ id: "country", title: COUNTRY_GROUP_TITLE, steps: country, done: country.filter((step) => step.state === "completed").length });
  return {
    total,
    done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    position: total === 0 ? 0 : Math.min(Math.max(0, input.currentStepIndex) + 1, total),
    finished: total > 0 && done === total,
    current,
    upcoming,
    groups,
  };
}

/** Ce qui empêche une étape verrouillée d'avancer : message affiché à l'administrateur. */
export function lockedReason(step: ProcedureStep, currentStepIndex: number): string {
  return step.index > currentStepIndex ? "L’étape précédente doit être validée avant de poursuivre." : "Les prérequis de cette étape ne sont pas encore réunis.";
}
