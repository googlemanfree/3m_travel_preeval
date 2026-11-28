/**
 * Type de procédure canonique, partagé par le parcours candidat, le protocole d'accord et le reçu.
 *
 * Avant ce module, chaque document devinait la procédure à sa façon : « Canada RP », « canada_rp » ou
 * « Résidence / installation » tombaient sur le texte « travail » (protocole, reçu) ou sur les étapes
 * « visiteur » (parcours). Ici, un seul résolveur lit le libellé libre, le code d'évaluation ou le libellé catalogue.
 */

export type ProcedureKind = "travail" | "etudes" | "visiteur" | "famille" | "residence" | "evisa" | "autre";

function fold(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Résidence permanente / installation : jetons forts (« RP », « PR », Entrée Express, PNP, Arrima, PEQ…).
const STRONG_RESIDENCE = /(^| )(rp|pr)( |$)|permanent|express entry|entree express|(^| )express( |$)|(^| )pnp( |$)|arrima|(^| )peq( |$)|installation|residence permanente|permanent resident/;
const STUDY = /etud|study|student|academ|admission|formation|ausbildung|apprentissage|(^| )dli( |$)/;
const FAMILY = /famill|family|regroupement|conjoint|spouse|parrainage|sponsor/;
const WORK = /travail|work|emploi|worker|lmia|eimt|travailleur|salarie|qualified|qualifie|contrat|recrutement|(^| )job( |$)/;
const EVISA = /e ?visa|electroni|(^| )eta( |$)|(^| )ave( |$)|(^| )esta( |$)|autorisation de voyage|travel authori/;
const VISITOR = /visiteur|visitor|touris|visite|court sejour|loisirs|schengen|voyage/;
const WEAK_RESIDENCE = /residence|resident|titre de sejour|carte de sejour/;

export function resolveProcedureKind(...labels: Array<string | null | undefined>): ProcedureKind {
  const key = fold(labels.filter(Boolean).join(" "));
  if (!key) return "autre";
  if (STRONG_RESIDENCE.test(key)) return "residence";
  if (STUDY.test(key)) return "etudes";
  if (FAMILY.test(key)) return "famille";
  if (WORK.test(key)) return "travail";
  if (EVISA.test(key)) return "evisa";
  if (WEAK_RESIDENCE.test(key)) return "residence";
  if (VISITOR.test(key)) return "visiteur";
  return "autre";
}

/** Libellé lisible du type de procédure (pour les écrans admin et les repères de document). */
export function procedureKindLabel(kind: ProcedureKind): string {
  switch (kind) {
    case "travail": return "Travail";
    case "etudes": return "Études";
    case "visiteur": return "Visiteur / séjour temporaire";
    case "famille": return "Regroupement familial";
    case "residence": return "Résidence permanente / installation";
    case "evisa": return "e-Visa / autorisation électronique";
    default: return "Procédure à qualifier";
  }
}

/** Date à partir de laquelle le reçu et le protocole suivent la procédure choisie (résidence, e-Visa, étapes, nature du versement). */
export const PROCEDURE_ADAPTED_SINCE = "2026-11-28T00:00:00.000Z";

/**
 * Un lot reçu + protocole envoyé avant cette date pour une procédure alors mal gérée (résidence permanente, e-Visa, procédure non
 * qualifiée : texte « travail ») est à revoir : l'administrateur ouvre l'éditeur (texte par défaut mis à jour) puis renvoie.
 * Un protocole déjà signé n'est jamais réécrit automatiquement : le renvoi reste une décision de l'administrateur.
 */
export function needsProcedureRefresh(kind: ProcedureKind, packageSentAt: string | null | undefined): boolean {
  if (!packageSentAt) return false;
  if (kind !== "residence" && kind !== "evisa" && kind !== "autre") return false;
  return new Date(packageSentAt).getTime() < new Date(PROCEDURE_ADAPTED_SINCE).getTime();
}
