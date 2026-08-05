/**
 * Moteur de scoring — Évaluation d'éligibilité Luxembourg
 * Grille de points fixe (algorithme déclaratif, pas d'IA), telle que
 * spécifiée par 3M Travel & Services.
 */

export type EducationLevel = "master_dual" | "licence_cert" | "bac_cqp";
export type FrenchLevel = "natif_c2" | "b2" | "b1";
export type EnglishLevel = "b2_plus" | "b1_b2" | "moins_b1" | "absent";
export type SkillsLevel = "excellentes" | "bonnes" | "basiques";
export type Sector =
  | "sante" | "documentation" | "education" | "finance" | "technologie"
  | "administration" | "rh" | "metiers_mecanique" | "autre";

export interface ScoringInput {
  yearsExperience: number;
  sector: Sector;
  educationLevel: EducationLevel;
  frenchLevel: FrenchLevel;
  englishLevel: EnglishLevel;
  skillsLevel: SkillsLevel;
  softSkills: string[]; // sous-ensemble de: leadership, gestion_stress, adaptabilite, communication
}

export interface ScoringResult {
  scoreFormation: number;
  scoreExperience: number;
  scoreFrancais: number;
  scoreAnglais: number;
  scoreSecteur: number;
  scoreCompetences: number;
  scoreBonus: number;
  scoreTotal: number;
  eligibilityStatus: "tres_eligible" | "eligible" | "moderement_eligible" | "non_eligible";
  statusLabel: string;
  recommendationText: string;
}

const SECTORS_FORTE_DEMANDE: Sector[] = ["sante", "technologie", "finance"];
const SECTORS_MODERE: Sector[] = ["administration", "rh", "documentation", "metiers_mecanique"];

function scoreFormation(level: EducationLevel): number {
  switch (level) {
    case "master_dual": return 15;
    case "licence_cert": return 11;
    case "bac_cqp": return 6;
  }
}

function scoreExperience(years: number): number {
  if (years >= 8) return 14;
  if (years >= 4) return 11;
  if (years >= 1) return 5;
  return 0;
}

function scoreFrancais(level: FrenchLevel): number {
  switch (level) {
    case "natif_c2": return 15;
    case "b2": return 11;
    case "b1": return 6;
  }
}

function scoreAnglais(level: EnglishLevel): number {
  switch (level) {
    case "b2_plus": return 14;
    case "b1_b2": return 10;
    case "moins_b1": return 5;
    case "absent": return 2;
  }
}

function scoreSecteur(sector: Sector): number {
  if (SECTORS_FORTE_DEMANDE.includes(sector)) return 15;
  if (SECTORS_MODERE.includes(sector)) return 10;
  return 8; // éducation, autre
}

function scoreCompetences(level: SkillsLevel): number {
  switch (level) {
    case "excellentes": return 14;
    case "bonnes": return 10;
    case "basiques": return 5;
  }
}

function scoreBonus(softSkills: string[]): number {
  const points: Record<string, number> = {
    leadership: 3,
    gestion_stress: 2,
    adaptabilite: 2,
    communication: 2,
  };
  const total = softSkills.reduce((sum, skill) => sum + (points[skill] ?? 0), 0);
  return Math.min(total, 10);
}

export function computeLuxembourgScore(input: ScoringInput): ScoringResult {
  const formation = scoreFormation(input.educationLevel);
  const experience = scoreExperience(input.yearsExperience);
  const francais = scoreFrancais(input.frenchLevel);
  const anglais = scoreAnglais(input.englishLevel);
  const secteur = scoreSecteur(input.sector);
  const competences = scoreCompetences(input.skillsLevel);
  const bonus = scoreBonus(input.softSkills);

  const total = formation + experience + francais + anglais + secteur + competences + bonus;

  let eligibilityStatus: ScoringResult["eligibilityStatus"];
  let statusLabel: string;
  let recommendationText: string;

  if (total >= 80) {
    eligibilityStatus = "tres_eligible";
    statusLabel = "✅✅✅ TRÈS ÉLIGIBLE Luxembourg";
    recommendationText = "Profil Excellent — Votre profil est très attractif pour le Luxembourg. Placement immédiat recommandé avec frais d'ouverture de 65 000 FCFA.";
  } else if (total >= 70) {
    eligibilityStatus = "eligible";
    statusLabel = "✅✅ ÉLIGIBLE Luxembourg";
    recommendationText = "Profil Solide — Viable pour le Luxembourg. Quelques optimisations recommandées (formation, certification).";
  } else if (total >= 60) {
    eligibilityStatus = "moderement_eligible";
    statusLabel = "🟡 MODÉRÉMENT ÉLIGIBLE Luxembourg";
    recommendationText = "Points à Renforcer — Score modéré. Points critiques à adresser. Formations recommandées : IELTS, certifications.";
  } else {
    eligibilityStatus = "non_eligible";
    statusLabel = "🔴 NON-ÉLIGIBLE Luxembourg";
    recommendationText = "Redirection Recommandée — Score faible pour le Luxembourg, mais excellentes opportunités en Belgique, France ou Canada. Profil très attractif pour ces destinations.";
  }

  return {
    scoreFormation: formation,
    scoreExperience: experience,
    scoreFrancais: francais,
    scoreAnglais: anglais,
    scoreSecteur: secteur,
    scoreCompetences: competences,
    scoreBonus: bonus,
    scoreTotal: total,
    eligibilityStatus,
    statusLabel,
    recommendationText,
  };
}

/** Destinations alternatives proposées si le score Luxembourg est < 60. */
export interface AlternativeDestination {
  name: string;
  estimatedScore: number;
  salaryRange: string;
  timeline: string;
  advantage: string;
}

export function getAlternativeDestinations(luxembourgScore: number): AlternativeDestination[] {
  return [
    {
      name: "Belgique",
      estimatedScore: Math.min(100, luxembourgScore + 18),
      salaryRange: "€2 600 – €3 800/mois",
      timeline: "14-16 semaines",
      advantage: "Francophone, secteur en expansion",
    },
    {
      name: "France",
      estimatedScore: Math.min(100, luxembourgScore + 16),
      salaryRange: "€2 400 – €3 600/mois",
      timeline: "16-18 semaines",
      advantage: "Marché stable, mobilité UE",
    },
    {
      name: "Canada (Québec)",
      estimatedScore: Math.min(100, luxembourgScore + 25),
      salaryRange: "55 000 – 80 000 CAD/an (~€3 800-5 500/mois)",
      timeline: "18-24 semaines",
      advantage: "Pénurie critique, placement facilité",
    },
    {
      name: "Suisse",
      estimatedScore: Math.min(100, luxembourgScore + 25),
      salaryRange: "€4 500 – €6 500/mois",
      timeline: "24-30 mois (2 phases, après 2 ans UE)",
      advantage: "Salaires plus élevés",
    },
  ];
}
