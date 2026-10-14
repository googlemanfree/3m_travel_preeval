/**
 * Compteurs catalogue procédures — source unique pour éviter 23 / 42 / 107 contradictoires.
 * Les libellés publics doivent parler de préparation de dossier, pas gonfler le volume.
 *
 * Vocabulaire public :
 * - fiche = une page procédure (travail / études / visiteur / e-Visa)
 * - destination = un pays couvert (plusieurs fiches possibles par pays)
 */

export function countUniqueDestinations(procedureIds: readonly string[]): number {
  return new Set(
    procedureIds.map((id) => id.replace(/-(travail|etudes|visiteur|formation|evisa)$/, "")),
  ).size;
}

export function formatProcedureCatalogLabel(procedureCount: number): string {
  return `Voir le catalogue des procédures (${procedureCount}) →`;
}

/** Libellé court pour titres (accueil / hub procédures). */
export function formatCatalogueFichesLabel(ficheCount: number, destinationCount: number): string {
  return `${ficheCount} fiches sur ${destinationCount} destinations`;
}

/** Précision affichée sous les titres : composition du catalogue. */
export function formatCatalogueComposition(
  documentedCount: number,
  evisaCount: number,
  ficheCount: number,
): string {
  return `${documentedCount} procédures documentées + ${evisaCount} fiches e-Visa = ${ficheCount} fiches au total`;
}
