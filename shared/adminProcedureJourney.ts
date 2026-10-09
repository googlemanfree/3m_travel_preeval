/**
 * Étapes de pilotage admin alignées sur le parcours réel du pays / de la procédure.
 * Les 5 stages opérationnels restent stables pour Kanban & mutations, mais leurs
 * libellés et l’étape affichée viennent du catalogue de parcours (comme l’espace client).
 */

import { getEnrichedCandidateJourney } from "./candidateJourneyCatalog";
import { describeDossierProgress } from "./dossierProgress";

export type AdminOperationalStage =
  | "PENDING_48H"
  | "PUBLISHED"
  | "DOCUMENTS_CHECK"
  | "SUBMITTED"
  | "APPROVED";

export const ADMIN_OPERATIONAL_STAGES: AdminOperationalStage[] = [
  "PENDING_48H",
  "PUBLISHED",
  "DOCUMENTS_CHECK",
  "SUBMITTED",
  "APPROVED",
];

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function pickStepLabel(
  steps: Array<{ id: string; label: string }>,
  patterns: RegExp[],
  fallback: string,
  preferFromIndex = 0,
): string {
  const slice = steps.slice(preferFromIndex);
  for (const pattern of patterns) {
    const found = slice.find(
      (step) => pattern.test(fold(step.label)) || pattern.test(fold(step.id)),
    );
    if (found) return found.label;
  }
  return fallback;
}

/** Libellés des 5 stages admin, adaptés au pays et au type de visa. */
export function adminOperationalStageLabels(
  destination?: string | null,
  visaType?: string | null,
  procedureLabel?: string | null,
): Record<AdminOperationalStage, string> {
  const journey = getEnrichedCandidateJourney(destination, visaType, procedureLabel ?? visaType);
  const steps = journey.steps;
  const countryFold = fold(journey.country || destination || "");
  const submissionFallback = /luxembourg/.test(countryFold)
    ? "Soumission ADEM / partenaires"
    : /canada/.test(countryFold)
      ? "Soumission IRCC / partenaires"
      : "Dépôt / soumission officielle";

  return {
    PENDING_48H: pickStepLabel(
      steps,
      [/evaluation/, /qualification/, /cv_submission/, /cv_review/, /profile_treatment/],
      "Évaluation / qualification",
    ),
    PUBLISHED: pickStepLabel(
      steps,
      [/bilan/, /confirmation/, /paiement/, /opening_payment/, /candidate_confirmation/],
      "Bilan & paiement d’ouverture",
    ),
    DOCUMENTS_CHECK: pickStepLabel(
      steps,
      [/document/, /piece/, /justificatif/, /supporting/],
      "Documents de la procédure",
    ),
    SUBMITTED: pickStepLabel(
      steps,
      [/soumis/, /consul/, /adem/, /portail/, /depot/, /rendez/, /partenaire/, /partner/, /autorisation/, /ircc/],
      submissionFallback,
      8,
    ),
    APPROVED: pickStepLabel(
      steps,
      [/decision/, /approuv/, /visa/, /residence/, /autoris/],
      steps[steps.length - 1]?.label ?? "Décision finale",
      Math.max(0, steps.length - 4),
    ),
  };
}

export type AdminProcedureSnapshot = {
  journeyTitle: string;
  country: string;
  visaType: string;
  stepNumber: number | null;
  stepCount: number;
  stepLabel: string | null;
  nextStepLabel: string | null;
  percent: number;
  stageLabels: Record<AdminOperationalStage, string>;
};

const PAID = new Set(["SUCCESS", "success", "completed", "paye", "paid"]);

export function buildAdminProcedureSnapshot(input: {
  destination?: string | null;
  visaType?: string | null;
  procedureLabel?: string | null;
  internalStatus?: string | null;
  paymentStatus?: string | null;
  evaluationStatus?: string | null;
  evaluationClientConfirmed?: boolean;
  activationRequested?: boolean;
}): AdminProcedureSnapshot {
  const journey = getEnrichedCandidateJourney(
    input.destination,
    input.visaType,
    input.procedureLabel ?? input.visaType,
  );
  const statusFold = fold(String(input.internalStatus || ""));
  const paymentConfirmed = PAID.has(String(input.paymentStatus || ""));
  // Si le dossier a déjà avancé (paiement, documents, soumission…), l’évaluation
  // ne doit plus bloquer l’affichage à l’étape 0 — bouchon fréquent côté admin.
  const advancedPastEvaluation = paymentConfirmed
    || ["paye", "document", "soumis", "approuve", "en_cours", "visa", "contrat", "recrut"].some((token) => statusFold.includes(token));
  const evaluationStatus =
    input.evaluationStatus === "validated"
    || input.evaluationStatus === "published"
    || advancedPastEvaluation
      ? "validated"
      : "pending";

  const progress = describeDossierProgress({
    destination: input.destination,
    visaType: input.visaType,
    procedureLabel: input.procedureLabel ?? input.visaType,
    dossierStatus: input.internalStatus,
    evaluationStatus,
    milestones: {
      paymentConfirmed,
      evaluationClientConfirmed: Boolean(input.evaluationClientConfirmed),
      activationRequested: Boolean(input.activationRequested),
    },
  });

  return {
    journeyTitle: journey.title,
    country: journey.country,
    visaType: journey.visaType,
    stepNumber: progress.stepNumber,
    stepCount: progress.stepCount,
    stepLabel: progress.stepLabel,
    nextStepLabel: progress.nextStepLabel,
    percent: progress.percent,
    stageLabels: adminOperationalStageLabels(
      input.destination,
      input.visaType,
      input.procedureLabel ?? input.visaType,
    ),
  };
}
