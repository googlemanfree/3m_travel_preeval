/**
 * Mises à jour éditoriales du site, vérifiées par l'équipe (règles d'IRCC lues sur canada.ca, outils comparés à l'outil officiel). Elles complètent
 * celles que l'équipe publie depuis l'administration : la page « Quoi de neuf » affiche les deux, de la plus récente à la plus ancienne.
 */
export type SiteUpdate = { id: string | number; publishedAt: string; title: string; summary: string; pagePath: string };

export const SITE_UPDATES: SiteUpdate[] = [
  { id: "afrique-centrale", publishedAt: "2026-11-19", title: "Nouvelle page : mobilité internationale depuis l’Afrique centrale", summary: "Ce que fait 3M pour les candidats du Cameroun, du Gabon, du Congo, de la RDC et du Tchad : parcours en cinq étapes, pièces à anticiper, destinations et réponses clés.", pagePath: "/afrique-centrale" },
  { id: "grille-67-points", publishedAt: "2026-11-18", title: "Grille des 67 points (Programme des travailleurs qualifiés fédéral)", summary: "Calculez les six facteurs de la grille de sélection d’IRCC (langues, études, expérience, âge, emploi réservé, adaptabilité) et voyez s’il vous manque des points pour atteindre 67 sur 100. Grille lue sur canada.ca le 18 novembre 2026.", pagePath: "/canada/crs#grille-67-points" },
  { id: "crs-valide", publishedAt: "2026-11-18", title: "Calculatrice CRS : vérifiée contre l’outil officiel d’IRCC", summary: "229 profils de test saisis dans l’outil officiel d’IRCC donnent exactement les mêmes points que notre calculatrice. Nouveau : le mode « Comparer deux scénarios » pour mesurer l’effet d’un seul changement (par exemple une note de test de langue).", pagePath: "/canada/crs#calculatrice-crs" },
  { id: "express-entry-offres", publishedAt: "2026-11-03", title: "Entrée express : nouvelle grille CRS sur 1 270 et offres d’emploi sans EIMT", summary: "Depuis le 3 novembre 2026, l’expérience canadienne devient le « facteur d’intégration sur le marché du travail », ou, à la place, une offre d’emploi valide dans une profession à salaire élevé (IRCC retient le plus avantageux). Aucune EIMT n’est exigée pour que l’offre compte.", pagePath: "/canada/crs" },
];
