export type EvaluationSourceType = "application" | "candidate" | "agency";

/**
 * Nature de l'enregistrement derrière un candidat de l'administration : un compte seul (pas encore de demande), un dossier
 * d'agence physique ou une demande classique. L'éditeur de bilan en a besoin pour ouvrir le bon dossier ; sans lui, un compte
 * seul tombait sur « application » et le bilan restait impossible à préparer.
 */
export function evaluationSourceTypeOf(candidate: { id?: string | null; source?: string | null; folderCode?: string | null } | null | undefined): EvaluationSourceType {
  if (!candidate) return "application";
  if (candidate.source === "ACCOUNT_ONLY" || String(candidate.id ?? "").startsWith("account_")) return "candidate";
  if (candidate.source === "AGENCY_PHYSICAL" || String(candidate.folderCode ?? "").startsWith("EVAL-AG-")) return "agency";
  return "application";
}
