/**
 * Transparence d’avancement : phase agence (13 étapes) vs phase pays/visa,
 * partagée admin / client pour un même dossier.
 */

import type { CandidateJourney } from "./candidateJourneyCatalog";
import type { PublishedGuideSummary } from "./publishedGuideSummaries";

export const AGENCY_PHASE_STEP_COUNT = 13;

export type DossierPhaseId = "agence" | "pays_visa" | "termine";

export type DossierPhaseTransparency = {
  country: string;
  visaLabel: string;
  journeyTitle: string;
  agencyTotal: number;
  countryTotal: number;
  agencyDone: number;
  countryDone: number;
  totalDone: number;
  totalSteps: number;
  percent: number;
  phase: DossierPhaseId;
  phaseLabel: string;
  currentStepLabel: string | null;
  currentStepDescription: string | null;
  nextStepLabel: string | null;
  /** Index 0-based de l’étape courante (clampée). */
  currentIndex: number;
};

export function buildDossierPhaseTransparency(input: {
  journey: CandidateJourney;
  /** Nombre d’étapes considérées faites (0..steps.length). */
  completedStepCount: number;
  guideSummary?: PublishedGuideSummary | null;
}): DossierPhaseTransparency {
  const { journey } = input;
  const totalSteps = journey.steps.length;
  const agencyTotal = Math.min(AGENCY_PHASE_STEP_COUNT, totalSteps);
  const countryTotal = Math.max(0, totalSteps - agencyTotal);
  const totalDone = Math.max(0, Math.min(totalSteps, input.completedStepCount));
  const agencyDone = Math.min(agencyTotal, totalDone);
  const countryDone = Math.max(0, totalDone - agencyTotal);
  const currentIndex = totalDone >= totalSteps ? Math.max(0, totalSteps - 1) : totalDone;
  const finished = totalSteps > 0 && totalDone >= totalSteps;
  const inCountry = !finished && totalDone >= agencyTotal;
  const phase: DossierPhaseId = finished ? "termine" : inCountry ? "pays_visa" : "agence";
  const phaseLabel =
    phase === "termine"
      ? "Parcours terminé"
      : phase === "pays_visa"
        ? `Phase pays / visa · ${journey.country}`
        : "Phase agence 3M (préparation dossier)";
  const current = finished ? null : journey.steps[currentIndex] ?? null;
  const next = finished ? null : journey.steps[currentIndex + 1] ?? null;
  const visaLabel = input.guideSummary?.visaLabel || journey.visaType;

  return {
    country: journey.country,
    visaLabel,
    journeyTitle: journey.title,
    agencyTotal,
    countryTotal,
    agencyDone,
    countryDone,
    totalDone,
    totalSteps,
    percent: totalSteps ? Math.round((totalDone / totalSteps) * 100) : 0,
    phase,
    phaseLabel,
    currentStepLabel: current?.label ?? (finished ? "Toutes les étapes validées" : null),
    currentStepDescription: current?.description ?? null,
    nextStepLabel: next?.label ?? null,
    currentIndex,
  };
}
