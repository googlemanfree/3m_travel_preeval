/**
 * Corridors prêts à comparer — seeds localStorage pour /procedures/comparaison.
 * IDs alignés sur procedures107Complete (aucun score inventé hors catalogue).
 */

export type CorridorPack = {
  id: string;
  flag: string;
  title: string;
  subtitle: string;
  /** projet d’évaluation lié */
  project: "travail" | "etudes" | "visiteur";
  hubHref: string;
  procedureIds: string[];
};

export const CORRIDOR_COMPARISON_PACKS: CorridorPack[] = [
  {
    id: "travail-americas-eu",
    flag: "💼",
    title: "Corridor travail · Canada & Europe",
    subtitle: "Canada, Allemagne, Luxembourg — permis et autorisations salariés.",
    project: "travail",
    hubHref: "/travail",
    procedureIds: ["canada-travail", "allemagne-travail", "luxembourg-travail"],
  },
  {
    id: "etudes-priority",
    flag: "🎓",
    title: "Corridor études · destinations prioritaires",
    subtitle: "Canada, France, Allemagne — admission puis visa étudiant.",
    project: "etudes",
    hubHref: "/etudes",
    procedureIds: ["canada-etudes", "france-etudes", "allemagne-etudes"],
  },
  {
    id: "travail-golfe-oceanie",
    flag: "🌍",
    title: "Corridor travail · Golfe & Océanie",
    subtitle: "Qatar, Australie, Royaume-Uni — emploi sponsorisé / skilled.",
    project: "travail",
    hubHref: "/travail",
    procedureIds: ["qatar-travail", "australie-travail", "royaume-uni-travail"],
  },
];

export const FAVORITE_COUNTRIES_STORAGE_KEY = "3m_favorite_countries";

/** Fusionne un pack dans la liste de favoris (déduplique, max 8). */
export function mergeCorridorIntoFavorites(
  currentIds: string[],
  pack: CorridorPack,
  max = 8,
): string[] {
  const merged = [...currentIds];
  for (const id of pack.procedureIds) {
    if (!merged.includes(id)) merged.push(id);
  }
  return merged.slice(0, max);
}
