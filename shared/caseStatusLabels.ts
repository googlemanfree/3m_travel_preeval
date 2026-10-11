/**
 * Libellés en français des états affichés au candidat. Un dossier peut porter un état de trois vocabulaires
 * (opérationnel 360°, dossier en ligne, dossier d'agence) : tous se rabattent sur les mêmes phases client
 * (peu nombreuses) pour éviter la saturation.
 */

import { buildClientStatusLabelTable, clientPhaseLabel } from "./clientDossierPhases";

export function humanizeStatus(status: string): string {
  const spaced = status.replace(/[_-]+/g, " ").trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : "";
}

const CASE_STATUS_LABELS: Record<string, string> = {
  ...buildClientStatusLabelTable(),
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

export const clientCaseStatusLabel = (status: string): string => {
  const key = status.trim();
  if (!key) return "";
  if (CASE_STATUS_LABELS[key]) return CASE_STATUS_LABELS[key];
  // Statut inconnu : humanize (tests + filet de sécurité), sauf si la phase le couvre.
  const phase = clientPhaseLabel(key);
  if (phase !== "Suivi en cours") return phase;
  return humanizeStatus(key);
};
export const clientEvisaStatusLabel = (status: string): string => labelFrom(EVISA_STATUS_LABELS, status);
export const clientInsuranceStatusLabel = (status: string): string => labelFrom(INSURANCE_STATUS_LABELS, status);
export const KNOWN_CASE_STATUSES: readonly string[] = Object.keys(CASE_STATUS_LABELS);
