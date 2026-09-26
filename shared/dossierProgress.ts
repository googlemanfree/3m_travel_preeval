import { getEnrichedCandidateJourney, journeyStepIndex, type JourneyMilestones } from "./candidateJourneyCatalog";

/**
 * Source unique de ce que le client lit sur l'avancement de son dossier : l'espace client, les notifications et les e-mails
 * utilisent ces mêmes libellés et ce même calcul d'étape (le parcours par destination), pour ne jamais se contredire.
 */

/** Libellé de statut lu par le client, pour tous les statuts internes (dossiers en ligne et dossiers ouverts en agence). */
export const CLIENT_DOSSIER_STATUS_LABELS: Record<string, string> = {
  nouveau: "Dossier créé",
  evaluation: "Évaluation en cours",
  en_evaluation: "Évaluation en cours",
  bilan_envoye: "Bilan d’évaluation disponible",
  en_attente_paiement: "Paiement des frais d’ouverture attendu",
  paye: "Paiement confirmé",
  documents: "Documents à compléter",
  documents_requis: "Documents à compléter",
  en_attente_documents: "Documents à compléter",
  documents_recus: "Documents reçus, en cours de contrôle",
  en_cours: "Traitement en cours",
  soumis: "Dossier transmis",
  soumis_agences: "Dossier transmis",
  en_cours_recrutement: "Accompagnement en cours",
  contrat_obtenu: "Contrat obtenu",
  approuve: "Visa approuvé",
  visa_approuve: "Visa approuvé",
  refuse: "Décision défavorable",
};

export const clientStatusLabel = (status: string | null | undefined): string => CLIENT_DOSSIER_STATUS_LABELS[String(status ?? "")] ?? "Suivi en cours";

/** Les cinq étapes de pilotage de l'administration, ramenées au statut interne d'un dossier en ligne puis d'un dossier agence. */
export const ADMIN_STAGE_TO_ONLINE_STATUS: Record<string, string> = { PENDING_48H: "en_evaluation", PUBLISHED: "bilan_envoye", DOCUMENTS_CHECK: "en_attente_documents", SUBMITTED: "soumis_agences", APPROVED: "visa_approuve" };
export const ADMIN_STAGE_TO_AGENCY_STATUS: Record<string, string> = { PENDING_48H: "nouveau", PUBLISHED: "en_cours", DOCUMENTS_CHECK: "documents_requis", SUBMITTED: "soumis", APPROVED: "approuve" };

export type DossierProgress = {
  statusLabel: string;
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
  dossierStatus?: string | null;
  /** Par défaut « validated » : un dossier dont l'administrateur fait avancer le statut a déjà son évaluation validée. */
  evaluationStatus?: string | null;
  milestones?: JourneyMilestones;
};

export function describeDossierProgress(input: DossierProgressInput): DossierProgress {
  const journey = getEnrichedCandidateJourney(input.destination, input.visaType, input.visaType);
  const statusLabel = clientStatusLabel(input.dossierStatus);
  const stepCount = journey.steps.length;
  if (input.dossierStatus === "refuse") {
    return { statusLabel, stepNumber: null, stepCount, stepLabel: null, stepDescription: null, nextStepLabel: null, percent: 0, refused: true };
  }
  const index = Math.min(Math.max(0, journeyStepIndex(journey, input.dossierStatus, input.evaluationStatus ?? "validated", input.milestones)), Math.max(0, stepCount - 1));
  const step = journey.steps[index];
  const next = journey.steps[index + 1];
  return {
    statusLabel,
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
