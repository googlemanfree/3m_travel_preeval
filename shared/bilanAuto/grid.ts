/**
 * Grille de notation du bilan automatisé — profil TRAVAIL (version 1, EN ATTENTE D'APPROBATION des sous-critères).
 *
 * Les sept rubriques et leur total (100) sont validés. Les sous-critères ci-dessous sont une PROPOSITION : la grille reste
 * désactivée tant que `GRID_V1.approvedAt` est vide (voir `isGridApproved`). Le moteur de règles lit cette structure ;
 * l'IA ne fixe jamais un point : elle extrait des faits, le moteur attribue les points.
 *
 * Principes (cahier des charges) :
 * - une information ABSENTE n'est ni une fausse déclaration ni une compétence inexistante : elle est « non renseignée » ;
 * - un sous-critère « de contenu » essentiel non renseigné rend la rubrique NON CALCULABLE (demande de complément, jamais un refus) ;
 * - un sous-critère « de preuve » sans pièce vaut 0 point et est signalé « non justifié » ;
 * - aucune donnée de photo, de sexe, d'origine ou de situation familiale n'entre dans la notation.
 */

export const GRID_ID = "travail";
export const INTERNAL_THRESHOLD = 65;
export const TOTAL_MAX = 100;

export const RUBRIC_KEYS = ["formation", "experience", "competences", "langues", "projet", "administratif", "justificatifs"] as const;
export type RubricKey = (typeof RUBRIC_KEYS)[number];

/**
 * « essential » : le contenu manquant bloque le calcul de la rubrique (→ complément demandé).
 * « optional » : l'absence vaut 0 point, annotée « non renseigné », sans bloquer.
 * « proof » : mesure la présence/cohérence des pièces ; l'absence de pièce vaut 0 point, « non justifié ».
 * « system » : calculé par le système depuis des données de l'application (jamais par l'IA).
 */
export type SubCriterionKind = "essential" | "optional" | "proof" | "system";

export type SubCriterionDef = { key: string; label: string; max: number; kind: SubCriterionKind; rule: string };
export type RubricDef = { key: RubricKey; label: string; max: number; subCriteria: SubCriterionDef[] };

export type GridDef = {
  id: string;
  version: number;
  /** Renseigné uniquement après approbation écrite du propriétaire : le pipeline refuse de publier sinon. */
  approvedAt: string | null;
  approvedBy: string | null;
  threshold: number;
  rubrics: RubricDef[];
};

export const GRID_V1: GridDef = {
  id: GRID_ID,
  version: 1,
  approvedAt: null,
  approvedBy: null,
  threshold: INTERNAL_THRESHOLD,
  rubrics: [
    {
      key: "formation",
      label: "Formation",
      max: 15,
      subCriteria: [
        { key: "niveau", label: "Niveau de diplôme", max: 6, kind: "essential", rule: "Bac+5 et plus 6 · Bac+3/4 5 · Bac+2 (BTS, DUT) 4 · Baccalauréat 2 · inférieur 1" },
        { key: "pertinence", label: "Pertinence pour le métier et le pays visés", max: 5, kind: "essential", rule: "Alignée 5 · proche 3 · éloignée 1" },
        { key: "preuve", label: "Diplôme présent dans une pièce", max: 4, kind: "proof", rule: "Pièce examinée 4 · déclaré seulement 1 · non renseigné 0 · contradictoire 0" },
      ],
    },
    {
      key: "experience",
      label: "Expérience",
      max: 20,
      subCriteria: [
        { key: "duree", label: "Durée d’expérience pertinente", max: 8, kind: "essential", rule: "≥10 ans 8 · 6–9 ans 7 · 3–5 ans 5 · 1–2 ans 3 · <1 an 1" },
        { key: "responsabilite", label: "Niveau de responsabilité", max: 6, kind: "essential", rule: "Encadrement 6 · autonomie 4 · exécution 2" },
        { key: "chronologie", label: "Cohérence chronologique", max: 3, kind: "optional", rule: "Cohérente 3 · lacunes expliquées 2 · non renseignée 0 · incohérente 0 (signalée)" },
        { key: "preuve", label: "Expérience présente dans une pièce", max: 3, kind: "proof", rule: "Pièce examinée 3 · déclarée seulement 1 · sinon 0" },
      ],
    },
    {
      key: "competences",
      label: "Compétences",
      max: 20,
      subCriteria: [
        { key: "techniques", label: "Compétences techniques alignées au métier visé", max: 10, kind: "essential", rule: "Fort 10 · partiel 6 · faible 2" },
        { key: "certifications", label: "Certifications et outils", max: 5, kind: "optional", rule: "≥3 : 5 · 2 : 4 · 1 : 3 · aucune renseignée 0" },
        { key: "transferables", label: "Compétences transférables", max: 5, kind: "optional", rule: "≥4 : 5 · 3 : 4 · 2 : 3 · 1 : 2 · aucune renseignée 0" },
      ],
    },
    {
      key: "langues",
      label: "Langues",
      max: 15,
      subCriteria: [
        { key: "langue_travail", label: "Langue de travail du pays visé", max: 8, kind: "essential", rule: "C1 et plus 8 · B2 6 · B1 4 · A2 2 · A1 ou débutant 0" },
        { key: "autre_langue", label: "Autre langue utile (anglais…)", max: 4, kind: "optional", rule: "B2 et plus 4 · B1 3 · A2 2 · sinon 0" },
        { key: "preuve", label: "Preuve ou test de langue", max: 3, kind: "proof", rule: "Pièce examinée 3 · déclaré seulement 1 · sinon 0" },
      ],
    },
    {
      key: "projet",
      label: "Préparation du projet",
      max: 10,
      subCriteria: [
        { key: "cible", label: "Métier et pays ciblés clairement", max: 4, kind: "essential", rule: "Métier et pays précisés 4 · l’un des deux 2" },
        { key: "plan", label: "Plan et calendrier de préparation", max: 3, kind: "optional", rule: "Plan et calendrier 3 · plan sans calendrier 2 · intention seule 1 · non renseigné 0" },
        { key: "coherence", label: "Cohérence avec le parcours", max: 3, kind: "optional", rule: "Cohérent 3 · partiel 2 · incohérent 0 (signalé) · non renseigné 0" },
      ],
    },
    {
      key: "administratif",
      label: "Informations administratives",
      max: 10,
      subCriteria: [
        { key: "identite", label: "Identité cohérente", max: 3, kind: "system", rule: "Cohérente entre formulaire, CV et pièces 3 · non vérifiable 2 · contradictoire 0 (bloquant)" },
        { key: "coordonnees", label: "Coordonnées et passeport déclarés", max: 3, kind: "system", rule: "Coordonnées et passeport 3 · coordonnées seules 2 · partiel 1" },
        { key: "formulaire", label: "Formulaire complet", max: 4, kind: "system", rule: "≥90 % des champs 4 · ≥75 % 3 · ≥50 % 2 · sinon 1" },
      ],
    },
    {
      key: "justificatifs",
      label: "Justificatifs examinés",
      max: 10,
      subCriteria: [
        { key: "pieces", label: "Pièces reçues et lisibles", max: 5, kind: "proof", rule: "0 pièce 0 · 1 : 2 · 2 : 3 · 3 : 4 · ≥4 : 5 (pièces lisibles uniquement)" },
        { key: "coherence", label: "Cohérence des pièces avec le déclaré", max: 5, kind: "proof", rule: "Cohérentes 5 · partiellement 3 · contradictoires 0 (signalé) · aucune pièce examinée 0" },
      ],
    },
  ],
};

export function isGridApproved(grid: GridDef): boolean {
  return Boolean(grid.approvedAt && grid.approvedBy);
}

/** Contrôle d'intégrité : somme des sous-critères = rubrique, somme des rubriques = 100. */
export function validateGrid(grid: GridDef): string[] {
  const problems: string[] = [];
  let total = 0;
  for (const rubric of grid.rubrics) {
    const sum = rubric.subCriteria.reduce((acc, sub) => acc + sub.max, 0);
    if (sum !== rubric.max) problems.push(`${rubric.label} : sous-critères ${sum} ≠ ${rubric.max}`);
    total += rubric.max;
  }
  if (total !== TOTAL_MAX) problems.push(`Total ${total} ≠ ${TOTAL_MAX}`);
  const keys = grid.rubrics.map((rubric) => rubric.key);
  if (new Set(keys).size !== keys.length) problems.push("Rubrique en double");
  return problems;
}

/** Champs qui ne doivent JAMAIS entrer dans la notation (cahier des charges, section « équité »). */
export const FORBIDDEN_SCORING_FIELDS = ["photo", "avatar", "portrait", "sexe", "sex", "gender", "genre", "origine", "ethnie", "nationality", "nationalite", "maritalStatus", "situationFamiliale", "numberOfDependents", "religion"] as const;
