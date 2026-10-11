import { getEnrichedCandidateJourney, journeyStepIndex, type JourneyMilestones } from "./candidateJourneyCatalog";
import { buildClientStatusLabelTable, clientPhaseLabel, describeClientDossierPhase } from "./clientDossierPhases";

/**
 * Source unique de ce que le client lit sur l'avancement de son dossier : l'espace client, les notifications et les e-mails
 * utilisent ces mêmes libellés et ce même calcul d'étape (le parcours par destination), pour ne jamais se contredire.
 *
 * Les libellés de statut sont volontairement peu nombreux (phases) : les détails d’étape viennent du parcours
 * (stepLabel / nextStepLabel), pas d’une liste saturée de micro-statuts.
 */

/** Libellés client : tous les statuts internes connus, rabattus sur les phases stables. */
export const CLIENT_DOSSIER_STATUS_LABELS: Record<string, string> = buildClientStatusLabelTable();

export const clientStatusLabel = (status: string | null | undefined): string => clientPhaseLabel(status);

/** Les cinq étapes de pilotage de l'administration, ramenées au statut interne d'un dossier en ligne puis d'un dossier agence. */
export const ADMIN_STAGE_TO_ONLINE_STATUS: Record<string, string> = { PENDING_48H: "en_evaluation", PUBLISHED: "bilan_envoye", DOCUMENTS_CHECK: "en_attente_documents", SUBMITTED: "soumis_agences", APPROVED: "visa_approuve" };
export const ADMIN_STAGE_TO_AGENCY_STATUS: Record<string, string> = { PENDING_48H: "nouveau", PUBLISHED: "en_cours", DOCUMENTS_CHECK: "documents_requis", SUBMITTED: "soumis", APPROVED: "approuve" };

export type DossierProgress = {
  statusLabel: string;
  /** Phrase courte de la phase (sans jargon admin). */
  statusDetail: string;
  phase: string;
  /** Numéro (à partir de 1) de l'étape en cours ; null quand le dossier est clos par une décision défavorable. */
  stepNumber: number | null;
  stepCount: number;
  stepLabel: string | null;
  stepDescription: string | null;
  nextStepLabel: string | null;
  percent: number;
  refused: boolean;
};

export type DossierProgressInput = {
  destination?: string | null;
  visaType?: string | null;
  /** Libellé de la procédure : le parcours affiché à l'écran est choisi avec lui (comme dans l'espace client). */
  procedureLabel?: string | null;
  dossierStatus?: string | null;
  /** Par défaut « validated » : un dossier dont l'administrateur fait avancer le statut a déjà son évaluation validée. */
  evaluationStatus?: string | null;
  milestones?: JourneyMilestones;
};

export function describeDossierProgress(input: DossierProgressInput): DossierProgress {
  const journey = getEnrichedCandidateJourney(input.destination, input.visaType, input.procedureLabel ?? input.visaType);
  const phaseInfo = describeClientDossierPhase(input.dossierStatus);
  const statusLabel = phaseInfo.label;
  const stepCount = journey.steps.length;
  // Seul le statut métier « refuse » coupe la jauge ; les synonymes de phase
  // (rejected / closed) gardent un libellé « décision » sans casser le calcul d’étape.
  if (String(input.dossierStatus) === "refuse") {
    return {
      statusLabel,
      statusDetail: phaseInfo.detail,
      phase: phaseInfo.phase,
      stepNumber: null,
      stepCount,
      stepLabel: null,
      stepDescription: null,
      nextStepLabel: null,
      percent: 0,
      refused: true,
    };
  }
  const index = Math.min(Math.max(0, journeyStepIndex(journey, input.dossierStatus, input.evaluationStatus ?? "validated", input.milestones)), Math.max(0, stepCount - 1));
  const step = journey.steps[index];
  const next = journey.steps[index + 1];
  return {
    statusLabel,
    statusDetail: phaseInfo.detail,
    phase: phaseInfo.phase,
    stepNumber: step ? index + 1 : null,
    stepCount,
    stepLabel: step?.label ?? null,
    stepDescription: step?.description ?? null,
    nextStepLabel: next?.label ?? null,
    // Étapes terminées (celles qui précèdent l'étape en cours), comme la jauge de l'espace client.
    percent: stepCount > 0 && step ? Math.round((index / stepCount) * 100) : 0,
    refused: false,
  };
}

/** Texte brut pour les notifications de l'espace client et les messages : même formulation que l'e-mail. */
export function progressText(progress: DossierProgress): string {
  if (progress.refused || progress.stepNumber === null) return `Statut : ${progress.statusLabel}`;
  return `Statut : ${progress.statusLabel}\nÉtape ${progress.stepNumber} sur ${progress.stepCount} : ${progress.stepLabel}${progress.nextStepLabel ? `\nÉtape suivante : ${progress.nextStepLabel}` : ""}`;
}
