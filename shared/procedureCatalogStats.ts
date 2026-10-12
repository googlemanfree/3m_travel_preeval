/**
 * Compteurs catalogue procédures — source unique pour éviter 23 / 42 / 107 contradictoires.
 * Les libellés publics doivent parler de préparation de dossier, pas gonfler le volume.
 */

export function countUniqueDestinations(procedureIds: readonly string[]): number {
  return new Set(
    procedureIds.map((id) => id.replace(/-(travail|etudes|visiteur|formation)$/, "")),
  ).size;
}

export function formatProcedureCatalogLabel(procedureCount: number): string {
  return `Voir le catalogue des procédures (${procedureCount}) →`;
}
