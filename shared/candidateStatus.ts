/**
 * Statuts d'un compte candidat : une seule définition de « dossier activé ».
 * « nouveau » (compte créé) et « evaluation » (CV déposé, bilan à préparer) sont des PRÉ-DOSSIERS : rien n'est ouvert, rien n'est payé.
 * Seuls les statuts suivants désignent un dossier activé, donc payé : documents, traitement, soumis, approuvé, refusé.
 * Comparer avec « !== nouveau » est une erreur : tout candidat qui dépose son CV passe à « evaluation » et serait pris pour un dossier payé.
 */
export const PRE_DOSSIER_STATUSES = ["nouveau", "evaluation"] as const;
export const ACTIVATED_STATUSES = ["documents", "traitement", "soumis", "approuve", "refuse"] as const;

const normalize = (status: unknown): string => String(status ?? "").trim().toLowerCase();

export function isPreDossierStatus(status: unknown): boolean {
  const value = normalize(status);
  return value === "" || (PRE_DOSSIER_STATUSES as readonly string[]).includes(value);
}

export function isActivatedStatus(status: unknown): boolean {
  return (ACTIVATED_STATUSES as readonly string[]).includes(normalize(status));
}
