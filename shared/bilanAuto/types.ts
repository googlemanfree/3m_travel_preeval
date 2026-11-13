import type { RubricKey } from "./grid";

/**
 * Provenance d'une information. Distingue ce que dit le candidat, ce qu'une pièce montre, et ce qu'un humain a vérifié :
 * lire un document n'équivaut jamais à l'authentifier.
 * - declare : affirmé dans le formulaire ou le CV, sans pièce à l'appui ;
 * - piece : retrouvé dans une pièce déposée (lue, NON authentifiée) ;
 * - verifie : confirmé par un administrateur (jamais posé par l'automatisation) ;
 * - non_renseigne : aucune information (≠ fausse déclaration, ≠ compétence inexistante) ;
 * - contradictoire : deux sources se contredisent.
 */
export const PROVENANCES = ["declare", "piece", "verifie", "non_renseigne", "contradictoire"] as const;
export type Provenance = (typeof PROVENANCES)[number];

export type SourceName = "formulaire" | "cv" | "piece" | "historique";

export type Fact<T> = {
  value: T | null;
  provenance: Provenance;
  sources: SourceName[];
  /** Extrait court qui justifie la valeur (jamais une consigne exécutée). */
  evidence?: string;
};

export const absent = <T>(): Fact<T> => ({ value: null, provenance: "non_renseigne", sources: [] });

export const EDUCATION_LEVELS = ["aucun", "inferieur_bac", "bac", "bac_plus_2", "bac_plus_3_4", "bac_plus_5_plus"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];
export const EDUCATION_RANK: Record<EducationLevel, number> = { aucun: 0, inferieur_bac: 1, bac: 2, bac_plus_2: 3, bac_plus_3_4: 4, bac_plus_5_plus: 5 };

export const CEFR_LEVELS = ["debutant", "A1", "A2", "B1", "B2", "C1", "C2", "natif"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export type Relevance = "alignee" | "proche" | "eloignee";
export type Responsibility = "execution" | "autonomie" | "encadrement";
export type Match = "fort" | "partiel" | "faible";
export type Chronology = "coherente" | "lacunes_expliquees" | "incoherente";
export type PlanLevel = "plan_calendrier" | "plan_seul" | "intention";
export type Coherence = "coherent" | "partiel" | "incoherent";

/** Pièce examinée (lecture, pas authentification). */
export type DocumentReview = {
  id: string;
  kind: "diplome" | "attestation_travail" | "test_langue" | "passeport" | "cv" | "autre";
  readable: boolean;
  /** Cohérence avec les informations déclarées. */
  consistency: "coherente" | "partielle" | "contradictoire" | "non_evaluee";
  note?: string;
};

/**
 * Faits extraits : AUCUN champ de photo, sexe, origine, nationalité ni situation familiale (voir FORBIDDEN_SCORING_FIELDS).
 * L'âge n'y figure pas non plus : il n'intervient que dans la règle d'orientation « Canada » (voir orientations.ts).
 */
export type CandidateFacts = {
  formation: {
    niveau: Fact<EducationLevel>;
    pertinence: Fact<Relevance>;
    diplomeEnPiece: Fact<boolean>;
  };
  experience: {
    dureeAnnees: Fact<number>;
    responsabilite: Fact<Responsibility>;
    chronologie: Fact<Chronology>;
    enPiece: Fact<boolean>;
  };
  competences: {
    techniques: Fact<Match>;
    certifications: Fact<number>;
    transferables: Fact<number>;
  };
  langues: {
    langueTravail: Fact<CefrLevel>;
    autreLangue: Fact<CefrLevel>;
    preuve: Fact<boolean>;
  };
  projet: {
    metierPrecise: Fact<boolean>;
    paysPrecise: Fact<boolean>;
    plan: Fact<PlanLevel>;
    coherence: Fact<Coherence>;
  };
  administratif: {
    identite: Fact<"coherente" | "non_verifiable" | "contradictoire">;
    coordonneesDeclarees: Fact<boolean>;
    passeportDeclare: Fact<boolean>;
    /** Part de champs du formulaire renseignés (0–1), calculée par le système. */
    completudeFormulaire: number;
  };
  documents: DocumentReview[];
  /** Métier visé et secteurs, pour les orientations (jamais pour la note). */
  metierVise: string | null;
  secteurs: string[];
  /** Missions typiques du métier visé (pistes générales, jamais présentées comme des offres). */
  missionsVisees: string[];
  /** Âge en années si connu (utilisé UNIQUEMENT par la règle d'orientation Canada). */
  ageAns: number | null;
};

export type SubCriterionResult = {
  key: string;
  label: string;
  max: number;
  /** null = non calculable (information essentielle absente). */
  points: number | null;
  kind: string;
  provenance: Provenance | "systeme";
  /** Explication lisible : pourquoi ce nombre de points. */
  explanation: string;
  /** Anomalies à signaler (contradiction, pièce illisible…). */
  flags: string[];
};

export type RubricResult = {
  key: RubricKey;
  label: string;
  max: number;
  points: number | null;
  calculable: boolean;
  subCriteria: SubCriterionResult[];
};

export type ScoreResult = {
  gridId: string;
  gridVersion: number;
  rubrics: RubricResult[];
  /** Somme calculée par le système (jamais saisie par l'IA). */
  total: number;
  max: number;
  threshold: number;
  thresholdReached: boolean;
  /** Éléments essentiels manquants : un complément est à demander (issue B). */
  missing: Array<{ rubric: RubricKey; subCriterion: string; label: string }>;
  /** Contradictions bloquantes (issue C). */
  blockingContradictions: string[];
  calculable: boolean;
};
