/**
 * Libellés en français des états affichés au candidat. Un dossier peut porter un état de trois vocabulaires
 * (opérationnel 360°, dossier en ligne, dossier d'agence) : tous sont couverts ; une valeur inconnue devient
 * un texte lisible plutôt qu'un identifiant technique.
 */

export function humanizeStatus(status: string): string {
  const spaced = status.replace(/[_-]+/g, " ").trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : "";
}

const CASE_STATUS_LABELS: Record<string, string> = {
  // état opérationnel (espace de travail 360°)
  new: "Dossier créé",
  qualifying: "Évaluation en cours",
  waiting_customer: "Action attendue de votre part",
  documents_review: "Documents à compléter",
  payment_review: "Paiement à confirmer",
  processing: "Dossier en traitement",
  submitted: "Dossier soumis",
  completed: "Dossier approuvé",
  closed: "Dossier clôturé",
  rejected: "Dossier à revoir",
  // dossier en ligne
  nouveau: "Dossier créé",
  en_evaluation: "Évaluation en cours",
  evaluation: "Évaluation en cours",
  evaluation_complete: "Évaluation terminée",
  bilan_envoye: "Bilan disponible",
  en_attente_paiement: "En attente de paiement",
  paye: "Paiement confirmé",
  en_attente_documents: "Documents à compléter",
  documents: "Documents à compléter",
  documents_recus: "Documents reçus",
  traitement: "Dossier en traitement",
  en_cours_traitement: "Dossier en traitement",
  en_cours_recrutement: "Dossier en traitement",
  soumis_agences: "Dossier soumis",
  soumis: "Dossier soumis",
  contrat_obtenu: "Contrat obtenu",
  visa_approuve: "Dossier approuvé",
  approuve: "Dossier approuvé",
  refuse: "Dossier à revoir",
  // dossier d'agence
  en_cours: "Dossier en traitement",
  documents_requis: "Documents à compléter",
  recherche_employeur: "Recherche d’employeur en cours",
  validation_adem: "Validation ADEM en cours",
};

const EVISA_STATUS_LABELS: Record<string, string> = {
  pending: "En attente d’examen",
  processing: "En cours de traitement",
  approved: "Approuvée",
  completed: "Terminée",
  rejected: "Refusée",
  paid: "Paiement confirmé",
  failed: "Paiement échoué",
};

const INSURANCE_STATUS_LABELS: Record<string, string> = {
  new: "Demande reçue",
  contacted: "Demande contactée",
  quote_sent: "Devis envoyé",
  completed: "Terminée",
  cancelled: "Annulée",
};

const labelFrom = (table: Record<string, string>, status: string): string => table[status.trim()] ?? humanizeStatus(status);

export const clientCaseStatusLabel = (status: string): string => labelFrom(CASE_STATUS_LABELS, status);
export const clientEvisaStatusLabel = (status: string): string => labelFrom(EVISA_STATUS_LABELS, status);
export const clientInsuranceStatusLabel = (status: string): string => labelFrom(INSURANCE_STATUS_LABELS, status);
export const KNOWN_CASE_STATUSES: readonly string[] = Object.keys(CASE_STATUS_LABELS);
