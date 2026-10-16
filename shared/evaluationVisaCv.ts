/**
 * Règles CV selon le type de visa / projet d’évaluation.
 * Visa travail → CV obligatoire (sinon relancer le client).
 * Autres visas (études, tourisme, famille…) → évaluation possible sans CV.
 */

export type EvaluationProjectKind = "travail" | "etudes" | "tourisme" | "autre";

function foldVisaLabel(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Visa / projet explicitement non professionnel. */
export function isNonWorkEvaluationVisa(visaOrProject: string | null | undefined): boolean {
  const value = foldVisaLabel(visaOrProject);
  if (!value) return false;
  return /(etude|study|scolaire|touris|visitor|visiteur|sejour|famille|family|residence|affaires|business)/.test(value);
}

/** Visa / projet de type travail (y compris codes canada_travail, schengen_travail). */
export function isWorkEvaluationVisa(visaOrProject: string | null | undefined): boolean {
  const value = foldVisaLabel(visaOrProject);
  if (!value) return false;
  if (isNonWorkEvaluationVisa(value)) return false;
  return /(travail|work|emploi|job|qualified|qualifie|professionnel)/.test(value);
}

/** Normalise le type de projet pour bilans, parcours et checklists. */
export function resolveEvaluationProjectKind(
  ...values: Array<string | null | undefined>
): EvaluationProjectKind {
  for (const value of values) {
    const folded = foldVisaLabel(value);
    if (!folded) continue;
    if (/(etude|study|scolaire|academ|formation|student)/.test(folded)) return "etudes";
    if (/(touris|visitor|visiteur|sejour|schengen|court)/.test(folded)) return "tourisme";
    if (/(travail|work|emploi|job|qualified|qualifie|professionnel)/.test(folded)) return "travail";
  }
  return "autre";
}

/**
 * Le CV est exigé uniquement pour le visa travail.
 * Si le type est inconnu, on n’impose pas le CV (évaluation intelligente sur le formulaire).
 */
export function evaluationRequiresCv(
  visaType?: string | null,
  projectType?: string | null,
): boolean {
  if (isWorkEvaluationVisa(visaType) || isWorkEvaluationVisa(projectType)) return true;
  if (isNonWorkEvaluationVisa(visaType) || isNonWorkEvaluationVisa(projectType)) return false;
  return false;
}

export const CV_REMINDER_SUBJECT_FR = "Votre CV est requis pour finaliser l’évaluation — 3M TRAVEL AGENCY";
export const CV_REMINDER_BODY_FR =
  "Bonjour,\n\nVotre projet de visa travail nécessite un CV à jour pour que notre équipe puisse finaliser votre évaluation.\n\nMerci de déposer votre CV (PDF, JPG ou PNG, 5 Mo max) depuis votre espace candidat 3M TRAVEL AGENCY, rubrique documents / évaluation.\n\nSans ce document, nous ne pourrons pas valider votre bilan de mobilité.\n\nCordialement,\nL’équipe 3M TRAVEL AGENCY";
