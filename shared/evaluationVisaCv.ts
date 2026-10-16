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
    // Ordre : études → travail → tourisme (évite que « schengen_travail » tombe en tourisme).
    if (/(etude|study|scolaire|academ|formation|student)/.test(folded)) return "etudes";
    if (/(travail|work|emploi|job|qualified|qualifie|professionnel)/.test(folded)) return "travail";
    if (/(touris|visitor|visiteur|visite|sejour|court)/.test(folded)) return "tourisme";
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

export const STUDIES_REMINDER_SUBJECT_FR =
  "Diplômes et relevés requis pour votre évaluation études — 3M TRAVEL AGENCY";
export const STUDIES_REMINDER_BODY_FR =
  "Bonjour,\n\nVotre projet de visa études nécessite un historique scolaire complet pour l’évaluation préalable : diplômes, relevés de notes, et le cycle d’études que vous visez (licence, master…).\n\nMerci de finaliser ces éléments depuis votre espace candidat 3M TRAVEL AGENCY (formulaire d’évaluation / documents).\n\nSans ces informations, nous ne pourrons pas établir un bilan études adapté.\n\nCordialement,\nL’équipe 3M TRAVEL AGENCY";

export const VISITOR_REMINDER_SUBJECT_FR =
  "Statut et motif requis pour votre évaluation visiteurs — 3M TRAVEL AGENCY";
export const VISITOR_REMINDER_BODY_FR =
  "Bonjour,\n\nPour votre évaluation visa visiteurs, merci d’indiquer votre statut (chef d’entreprise, employé ou particulier) et le motif précis du séjour.\n\nFormulaire simple — connectez-vous à votre espace candidat 3M TRAVEL AGENCY pour compléter ces informations.\n\nCordialement,\nL’équipe 3M TRAVEL AGENCY";

const GENERIC_EVAL_REMINDER_SUBJECT_FR =
  "Finalisez votre évaluation — 3M TRAVEL AGENCY";
const GENERIC_EVAL_REMINDER_BODY_FR =
  "Bonjour,\n\nMerci de finaliser votre évaluation en ligne (critères et pièces demandés selon votre type de visa) depuis votre espace candidat 3M TRAVEL AGENCY.\n\nCordialement,\nL’équipe 3M TRAVEL AGENCY";

/** Relance pièces / critères manquants selon le type de visa (travail, études, visiteurs). */
export function evaluationGapReminder(
  visaOrProject: string | null | undefined,
  fullName?: string | null,
): { subject: string; body: string; kind: EvaluationProjectKind } {
  const kind = resolveEvaluationProjectKind(visaOrProject);
  const greeting = fullName?.trim() ? `Bonjour ${fullName.trim()},` : "Bonjour,";
  if (kind === "etudes") {
    return {
      kind,
      subject: STUDIES_REMINDER_SUBJECT_FR,
      body: STUDIES_REMINDER_BODY_FR.replace("Bonjour,", greeting),
    };
  }
  if (kind === "tourisme") {
    return {
      kind,
      subject: VISITOR_REMINDER_SUBJECT_FR,
      body: VISITOR_REMINDER_BODY_FR.replace("Bonjour,", greeting),
    };
  }
  if (kind === "travail") {
    return {
      kind,
      subject: CV_REMINDER_SUBJECT_FR,
      body: CV_REMINDER_BODY_FR.replace("Bonjour,", greeting),
    };
  }
  return {
    kind: "autre",
    subject: GENERIC_EVAL_REMINDER_SUBJECT_FR,
    body: GENERIC_EVAL_REMINDER_BODY_FR.replace("Bonjour,", greeting),
  };
}
