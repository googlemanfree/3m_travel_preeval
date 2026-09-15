/**
 * Moteur de scoring automatique 3M Travel Agency
 * Calcule un score d'éligibilité sur 100 points selon 5 critères.
 */

import { DESTINATIONS_20 } from "@/data/destinations20";

export interface ScoringInput {
  academicLevel: string;    // "doctorat" | "master" | "licence" | "bts" | "bac"
  experienceYears: number;  // Années d'expérience
  languageLevel: string;    // "bilingue" | "francais_anglais_inter" | "mono"
  jobSector: string;        // "sante" | "education" | "electro" | "soudure" | "it" | "commerce" | "gestion" | "logistique" | "assurance" | "autre"
  age: number;              // Âge du candidat
  /** Nom de la destination visée (ex: "Canada", "Royaume-Uni"). Optionnel : sans elle, le critère
   * secteur reste générique comme avant. Avec elle, il reflète les secteurs réellement en demande
   * pour ce pays (destinations20.ts), plutôt qu'une liste identique pour toutes les destinations. */
  destination?: string;
}

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Mots-clés (issus des libellés réels de destinations20.ts) associés à chaque secteur du formulaire. */
const SECTOR_DEMAND_KEYWORDS: Record<string, string[]> = {
  sante: ["sante", "soins"],
  education: ["education", "formation"],
  it: ["technologie", "informatique", "numerique", "it"],
  electro: ["ingenierie", "technique", "industrie"],
  soudure: ["industrie", "construction", "metiers specialises", "metiers manuels qualifies", "artisanat technique", "manufacturiere"],
  commerce: ["commerce", "services"],
  gestion: ["finance", "services"],
  logistique: ["logistique"],
  assurance: ["finance"],
  btp: ["construction", "ingenierie"],
};

/** Vrai si le secteur choisi figure réellement parmi les secteurs en demande de cette destination. */
function isSectorInDemandForDestination(sector: string, destinationName: string): boolean | null {
  const destination = DESTINATIONS_20.find((entry) => normalizeForMatch(entry.name) === normalizeForMatch(destinationName));
  if (!destination) return null; // Pas de données vérifiées pour cette destination : rester neutre.
  const keywords = SECTOR_DEMAND_KEYWORDS[sector];
  if (!keywords?.length) return false;
  const normalizedSecteurs = destination.secteurs.map(normalizeForMatch);
  return keywords.some((keyword) => normalizedSecteurs.some((label) => label.includes(keyword)));
}

export interface ScoringResult {
  total: number;            // Score total sur 100
  badge: "eligible" | "admissible" | "faible";
  details: {
    education: number;      // Max 25
    experience: number;     // Max 25
    language: number;       // Max 20
    sector: number;         // Max 20
    age: number;            // Max 10
  };
  label: string;            // Libellé du badge
  color: string;            // Couleur CSS
  description: string;      // Description du résultat
}

/** Critère 1 : Formation & Diplômes (Max 25 points) */
function scoreEducation(level: string): number {
  switch (level) {
    case "doctorat": return 25;
    case "master":   return 20;
    case "licence":  return 15;
    case "bts":      return 10;
    case "bac":      return 5;
    default:         return 0;
  }
}

/** Critère 2 : Expérience professionnelle (Max 25 points) */
function scoreExperience(years: number): number {
  if (years > 8)  return 25;
  if (years >= 5) return 20;
  if (years >= 3) return 15;
  if (years >= 1) return 10;
  return 0;
}

/** Critère 3 : Compétences linguistiques (Max 20 points) */
function scoreLanguage(level: string): number {
  switch (level) {
    case "bilingue":              return 20;
    case "francais_anglais_inter": return 15;
    case "mono":                  return 10;
    default:                      return 10;
  }
}

/** Critère 4 : Secteur d'activité (Max 20 points)
 * Quand une destination est fournie et couverte par des données réelles (destinations20.ts),
 * le score reflète si ce secteur y est effectivement en demande plutôt qu'une liste générique
 * identique pour tous les pays. Sans destination reconnue, le comportement générique d'origine
 * est conservé à l'identique. */
function scoreSector(sector: string, destination?: string): number {
  const prioritaires = ["sante", "education", "electro", "soudure", "chaudronnerie", "it", "informatique"];
  const secondaires  = ["commerce", "assurance", "gestion", "logistique"];
  const genericScore = prioritaires.includes(sector) ? 20 : secondaires.includes(sector) ? 12 : 5;

  if (destination) {
    const inDemand = isSectorInDemandForDestination(sector, destination);
    if (inDemand === true) return 20;
    if (inDemand === false) return Math.min(genericScore, 10);
  }
  return genericScore;
}

/** Critère 5 : Âge & Adaptabilité (Max 10 points) */
function scoreAge(age: number): number {
  if (age >= 20 && age <= 35) return 10;
  if (age >= 36 && age <= 45) return 5;
  return 2;
}

/** Calcul complet du score */
export function calculateScore(input: ScoringInput): ScoringResult {
  const details = {
    education:  scoreEducation(input.academicLevel),
    experience: scoreExperience(input.experienceYears),
    language:   scoreLanguage(input.languageLevel),
    sector:     scoreSector(input.jobSector, input.destination),
    age:        scoreAge(input.age),
  };

  const total = details.education + details.experience + details.language + details.sector + details.age;

  let badge: "eligible" | "admissible" | "faible";
  let label: string;
  let color: string;
  let description: string;

  if (total >= 70) {
    badge = "eligible";
    label = "Profil Très Favorable";
    color = "text-green-600";
    description = "Votre profil présente une forte éligibilité. Nos conseillers peuvent ouvrir votre dossier immédiatement.";
  } else if (total >= 50) {
    badge = "admissible";
    label = "Profil Admissible";
    color = "text-yellow-600";
    description = "Votre profil est admissible avec quelques ajustements de dossier conseillés par nos experts.";
  } else {
    badge = "faible";
    label = "Profil à Renforcer";
    color = "text-red-600";
    description = "Votre profil nécessite un entretien approfondi avec nos conseillers pour identifier les meilleures options.";
  }

  return { total, badge, label, color, description, details };
}

/** Libellés des niveaux académiques */
export const ACADEMIC_LEVELS = [
  { value: "doctorat", label: "Doctorat / PhD", points: 25 },
  { value: "master",   label: "Master / Ingénieur (Bac+5)", points: 20 },
  { value: "licence",  label: "Licence / Bachelor (Bac+3)", points: 15 },
  { value: "bts",      label: "BTS / DUT / Certifications (Bac+2)", points: 10 },
  { value: "bac",      label: "Baccalauréat", points: 5 },
];

/** Libellés des niveaux linguistiques */
export const LANGUAGE_LEVELS = [
  { value: "bilingue",              label: "Bilingue accompli (Français + Anglais courant)", points: 20 },
  { value: "francais_anglais_inter", label: "Français excellent + Anglais intermédiaire", points: 15 },
  { value: "mono",                  label: "Français uniquement ou Anglais uniquement", points: 10 },
];

/** Libellés des secteurs d'activité */
export const JOB_SECTORS = [
  { value: "sante",        label: "Santé (médecin, infirmier, pharmacien...)", category: "prioritaire" },
  { value: "education",    label: "Éducation (enseignant, formateur...)", category: "prioritaire" },
  { value: "it",           label: "Informatique / IT (développeur, data, cybersécurité...)", category: "prioritaire" },
  { value: "electro",      label: "Électrotechnique / Électricité", category: "prioritaire" },
  { value: "soudure",      label: "Soudure / Chaudronnerie / Métallurgie", category: "prioritaire" },
  { value: "commerce",     label: "Commerce / Vente / Marketing", category: "secondaire" },
  { value: "gestion",      label: "Gestion / Finance / Comptabilité", category: "secondaire" },
  { value: "logistique",   label: "Logistique / Transport / Supply Chain", category: "secondaire" },
  { value: "assurance",    label: "Assurances / Banque", category: "secondaire" },
  { value: "btp",          label: "BTP / Architecture / Génie Civil", category: "secondaire" },
  { value: "autre",        label: "Autre secteur", category: "autre" },
];
