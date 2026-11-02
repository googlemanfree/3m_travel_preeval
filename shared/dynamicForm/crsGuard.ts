import { usesCrs } from "./crsModule";
import type { FormOverride } from "./overrides";
import { missingRequiredFields, resolveDynamicForm } from "./resolve";
import { PROJECT_KINDS, type FormValues, type ProjectKind } from "./types";

export const CRS_REQUIRED_MESSAGE = "Le calculateur de score CRS est obligatoire pour une demande de résidence permanente au Canada. Complétez toutes ses questions pour envoyer votre évaluation.";

/**
 * Questions du calculateur CRS encore sans réponse pour cette évaluation (liste vide : rien à exiger ou tout est rempli).
 * Respecte les règles de l'administration : une question masquée n'est jamais exigée.
 */
export function missingCrsAnswers(input: { country?: string | null; projectType?: string | null; details?: Record<string, unknown> | null; overrides?: FormOverride[] }): string[] {
  if (!input.details || !(PROJECT_KINDS as readonly string[]).includes(String(input.projectType))) return [];
  const strings: FormValues = {};
  for (const [key, value] of Object.entries(input.details)) if (typeof value === "string") strings[key] = value.trim();
  const form = resolveDynamicForm({ country: input.country, projectType: input.projectType as ProjectKind, programId: strings.programId, domainId: strings.domainId, overrides: input.overrides });
  if (!usesCrs(form.countryCode, form.family)) return [];
  return missingRequiredFields(form, strings).filter((field) => field.key.startsWith("crs_")).map((field) => field.label);
}
