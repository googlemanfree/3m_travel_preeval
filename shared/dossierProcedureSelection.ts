/**
 * Normalise pays + type de visa pour toute création / activation de dossier admin.
 * Garantit que le parcours, la checklist et le pilotage dynamiques partent
 * de libellés catalogue (ex. « Canada » + « Études ») plutôt que d’enums grossiers.
 */

import {
  coarseCategoryForPreferredDestinations,
  getCandidateDestinationOption,
  normalizeCandidateDestinations,
  REGISTRATION_PROJECT_TYPES,
  type CoarseDestinationCategory,
} from "./candidateDestinationOptions";
import { resolveProcedureChecklistKey } from "./countryProcedureChecklist";

export const ADMIN_PROCEDURE_TYPES = [
  ...REGISTRATION_PROJECT_TYPES,
  "e-Visa / autorisation électronique",
  "Résidence / installation",
] as const;

export type AdminProcedureType = (typeof ADMIN_PROCEDURE_TYPES)[number];

export type ResolvedDossierProcedure = {
  /** Nom officiel du pays (ex. « Canada »). */
  destination: string;
  /** Libellé procédure catalogue (ex. « Études »). */
  visaType: string;
  /** Clé checklist (study_permit, work_permit, …) si reconnue. */
  checklistKey: string | null;
  /** Catégorie historique pour `candidates.destination`. */
  coarseCategory: CoarseDestinationCategory;
  /** Destinations précises à persister dans preferredDestinations. */
  preferredDestinations: string[];
  recognized: boolean;
};

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Mappe les libellés historiques / libres vers un type de procédure admin. */
export function normalizeAdminProcedureType(raw?: string | null): string {
  const key = fold(String(raw || ""));
  if (!key) return "Autre";
  const compact = key.replace(/\s+/g, "");
  if (compact.includes("evisa") || key.includes("electronique") || compact.includes("eta") || key.includes("autorisation")) {
    return "e-Visa / autorisation électronique";
  }
  if (key.includes("permanent") || key.includes("residence") || key.includes("installation") || key.includes("arrima") || key.includes("express entry")) {
    return "Résidence / installation";
  }
  if (key.includes("famille") || key.includes("family") || key.includes("regroupement") || key.includes("conjoint")) {
    return "Regroupement familial";
  }
  if (key.includes("touris") || key.includes("visite") || key.includes("visitor") || key.includes("schengen court")) {
    return "Tourisme / visite";
  }
  if (key.includes("travail") || key.includes("work") || key.includes("emploi") || key.includes("worker") || key.includes("job")) {
    return "Travail";
  }
  if (
    key.includes("etude")
    || key.includes("etudiant")
    || key.includes("study")
    || key.includes("student")
    || key.includes("academ")
    || key.includes("formation")
    || key.includes("ausbildung")
  ) {
    return "Études";
  }
  const exact = ADMIN_PROCEDURE_TYPES.find((item) => fold(item) === key);
  return exact ?? (raw?.trim() || "Autre");
}

/**
 * Résout une sélection admin (pays + visa) en valeurs persistables pour
 * agencyDossiers / candidates / cases / checklist.
 */
export function resolveDossierProcedureSelection(input: {
  destination?: string | null;
  visaType?: string | null;
}): ResolvedDossierProcedure {
  const rawDestination = String(input.destination || "").trim();
  const option = getCandidateDestinationOption(rawDestination);
  const normalizedList = normalizeCandidateDestinations(rawDestination ? [rawDestination] : []).destinations;
  const destination = option?.name ?? normalizedList[0] ?? rawDestination;
  const recognized = Boolean(option || normalizedList[0]);
  const visaType = normalizeAdminProcedureType(input.visaType);
  const preferredDestinations = destination ? [destination] : [];
  const coarseCategory = coarseCategoryForPreferredDestinations(preferredDestinations);
  const checklistKey = resolveProcedureChecklistKey(visaType) ?? null;
  return {
    destination,
    visaType,
    checklistKey,
    coarseCategory,
    preferredDestinations,
    recognized,
  };
}
