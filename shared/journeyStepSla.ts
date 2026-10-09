/**
 * SLA indicatifs par étape du parcours pays/procédure et par stage admin.
 * Sert au pilotage (échéances suggérées) sans remplacer une échéance déjà saisie.
 */

import type { AdminOperationalStage } from "./adminProcedureJourney";
import { getEnrichedCandidateJourney } from "./candidateJourneyCatalog";
import { describeDossierProgress } from "./dossierProgress";

export type SlaTone = "ok" | "soon" | "overdue" | "unset";

export type JourneyStepSlaSnapshot = {
  stepId: string | null;
  stepLabel: string | null;
  stepNumber: number | null;
  stepCount: number;
  slaDays: number;
  dueAt: Date | null;
  remainingHours: number | null;
  tone: SlaTone;
  label: string;
  explanation: string;
  suggestedFromNow: Date;
};

/** Délais métier par famille d’étape (jours ouvrés indicatifs). */
export const JOURNEY_STEP_SLA_DAYS: Record<string, number> = {
  cv_submission: 2,
  cv_review: 2,
  profile_treatment: 3,
  evaluation: 2,
  evaluation_delivery: 2,
  candidate_confirmation: 3,
  opening_payment: 5,
  supporting_documents: 10,
  documents: 10,
  identity: 7,
  funds: 7,
  profile_processing: 5,
  partner_submission: 7,
  contract_wait: 21,
  admin_processing: 7,
  consular_submission: 14,
  application: 14,
  biometrics: 14,
  national_visa: 21,
  decision: 30,
  arrival_registration: 7,
};

export const ADMIN_STAGE_SLA_DAYS: Record<AdminOperationalStage, number> = {
  PENDING_48H: 2,
  PUBLISHED: 5,
  DOCUMENTS_CHECK: 10,
  SUBMITTED: 21,
  APPROVED: 30,
};

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function slaDaysForJourneyStep(stepId?: string | null, stepLabel?: string | null): number {
  const id = fold(String(stepId || ""));
  if (id && JOURNEY_STEP_SLA_DAYS[id] != null) return JOURNEY_STEP_SLA_DAYS[id];
  for (const [key, days] of Object.entries(JOURNEY_STEP_SLA_DAYS)) {
    if (id.includes(key) || fold(String(stepLabel || "")).includes(key.replaceAll("_", " "))) return days;
  }
  if (/document|piece|justificatif/.test(fold(String(stepLabel || "")))) return 10;
  if (/soumis|consul|depot|visa/.test(fold(String(stepLabel || "")))) return 14;
  if (/decision|approuv/.test(fold(String(stepLabel || "")))) return 30;
  return 7;
}

export function classifySlaTone(dueAt: Date | null | undefined, now: Date = new Date()): SlaTone {
  if (!dueAt || Number.isNaN(dueAt.getTime())) return "unset";
  const remainingMs = dueAt.getTime() - now.getTime();
  if (remainingMs < 0) return "overdue";
  if (remainingMs <= 24 * 60 * 60 * 1000) return "soon";
  return "ok";
}

export function buildJourneyStepSla(input: {
  destination?: string | null;
  visaType?: string | null;
  procedureLabel?: string | null;
  internalStatus?: string | null;
  paymentConfirmed?: boolean;
  evaluationStatus?: string | null;
  /** Date d’entrée dans l’étape courante ; à défaut, maintenant. */
  stepEnteredAt?: Date | string | null;
  /** Échéance métier déjà fixée par le conseiller (prioritaire). */
  dueAtOverride?: Date | string | null;
  now?: Date;
}): JourneyStepSlaSnapshot {
  const now = input.now ?? new Date();
  const journey = getEnrichedCandidateJourney(
    input.destination,
    input.visaType,
    input.procedureLabel ?? input.visaType,
  );
  const progress = describeDossierProgress({
    destination: input.destination,
    visaType: input.visaType,
    procedureLabel: input.procedureLabel ?? input.visaType,
    dossierStatus: input.internalStatus,
    evaluationStatus: input.evaluationStatus ?? "validated",
    milestones: { paymentConfirmed: Boolean(input.paymentConfirmed) },
  });
  const index = progress.stepNumber ? progress.stepNumber - 1 : 0;
  const step = journey.steps[index];
  const slaDays = slaDaysForJourneyStep(step?.id, step?.label ?? progress.stepLabel);
  const entered = input.stepEnteredAt ? new Date(input.stepEnteredAt) : now;
  const suggestedFromNow = new Date(now.getTime() + slaDays * 24 * 60 * 60 * 1000);
  const computedDue = Number.isNaN(entered.getTime())
    ? suggestedFromNow
    : new Date(entered.getTime() + slaDays * 24 * 60 * 60 * 1000);
  const override = input.dueAtOverride ? new Date(input.dueAtOverride) : null;
  const dueAt = override && !Number.isNaN(override.getTime()) ? override : computedDue;
  const remainingHours = Math.round((dueAt.getTime() - now.getTime()) / (60 * 60 * 1000));
  const tone = classifySlaTone(dueAt, now);
  const label =
    tone === "overdue"
      ? `SLA dépassé · ${step?.label ?? progress.stepLabel ?? "étape"}`
      : tone === "soon"
        ? `SLA < 24 h · ${step?.label ?? progress.stepLabel ?? "étape"}`
        : `SLA ${slaDays} j · ${step?.label ?? progress.stepLabel ?? "étape"}`;

  return {
    stepId: step?.id ?? null,
    stepLabel: step?.label ?? progress.stepLabel,
    stepNumber: progress.stepNumber,
    stepCount: progress.stepCount,
    slaDays,
    dueAt,
    remainingHours,
    tone,
    label,
    explanation: `Délai indicatif de ${slaDays} jour(s) pour l’étape « ${step?.label ?? progress.stepLabel ?? "courante"} » du parcours ${journey.title}. Une échéance conseiller saisie manuellement prime sur ce calcul.`,
    suggestedFromNow,
  };
}

export function suggestedDueAtForAdminStage(stage: AdminOperationalStage, from: Date = new Date()): Date {
  const days = ADMIN_STAGE_SLA_DAYS[stage] ?? 7;
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}
