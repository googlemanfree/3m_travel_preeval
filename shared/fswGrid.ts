import type { EducationLevel, LanguageAbilities } from "./crsScore";

/**
 * Grille de sélection du Programme des travailleurs qualifiés (fédéral) d'Entrée express : six facteurs, note sur 100, seuil de 67 points.
 * Ces points sont DIFFÉRENTS de ceux du Système de classement global (SCG/CRS) : ils servent à savoir si l'on peut entrer dans le bassin,
 * pas à classer les profils une fois dedans.
 *
 * Source officielle, relue sur canada.ca le 2026-11-18 (aucun outil officiel de calcul de ces points n'existe : la grille est lue telle quelle) :
 *  - https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html
 *    (langue 28, études 25, expérience 15, âge 12, emploi réservé 10, capacité d'adaptation 10 ; seuil 67)
 *  - https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/education-assessment.html
 *    (points d'études du Programme des travailleurs qualifiés (fédéral), tableau « Federal Skilled Worker Program factor points »)
 * Depuis le 3 novembre 2026 : aucune EIMT n'est exigée pour qu'une offre d'emploi compte.
 */
export const FSW_PASS_MARK = 67;
export const FSW_MAX = 100;
export const FSW_SOURCE = {
  organization: "Immigration, Réfugiés et Citoyenneté Canada (IRCC)",
  url: "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/qui-presenter-demande/travailleurs-qualifies-federal.html",
  urlEn: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html",
  verifiedAt: "2026-11-18",
} as const;

export type FswProfile = {
  age: number;
  education: EducationLevel;
  /** Niveaux CLB par compétence dans la première langue officielle. */
  firstLanguage: LanguageAbilities;
  /** Seconde langue officielle ; null si aucun test (« sans objet »). */
  secondLanguage: LanguageAbilities | null;
  /** Années d'expérience de travail qualifié (TEER 0 à 3) au cours des 10 dernières années, au Canada ou à l'étranger. */
  skilledExperienceYears: number;
  arrangedEmployment: boolean;
  hasSpouse: boolean;
  spouseLanguageClb4: boolean;
  ownCanadianStudy: boolean;
  spouseCanadianStudy: boolean;
  ownCanadianWork: boolean;
  spouseCanadianWork: boolean;
  relativeInCanada: boolean;
};

const EDUCATION_POINTS: Record<EducationLevel, number> = {
  less_than_secondary: 0, secondary: 5, one_year_postsecondary: 15, two_year_postsecondary: 19, bachelor_or_three_year: 21, two_or_more_credentials: 22, master_or_professional: 23, doctoral: 25,
};

/** 6 points par compétence à CLB 9 ou plus, 5 à CLB 8, 4 à CLB 7 ; en dessous de CLB 7 : exigence minimale non remplie (0 point). */
export const firstLanguageAbilityPoints = (clb: number): number => (clb >= 9 ? 6 : clb === 8 ? 5 : clb === 7 ? 4 : 0);
/** 4 points seulement si les quatre compétences de la seconde langue sont au moins à CLB 5. */
export const secondLanguagePoints = (abilities: LanguageAbilities | null): number => (abilities && Math.min(abilities.speaking, abilities.listening, abilities.reading, abilities.writing) >= 5 ? 4 : 0);
export const experiencePoints = (years: number): number => (years >= 6 ? 15 : years >= 4 ? 13 : years >= 2 ? 11 : years >= 1 ? 9 : 0);
export const agePoints = (age: number): number => (age < 18 ? 0 : age <= 35 ? 12 : age >= 47 ? 0 : 12 - (age - 35));

export type FswAdaptabilityElement = { key: string; label: string; points: number; earned: boolean };
export type FswBreakdown = {
  language: number;
  firstLanguage: number;
  firstLanguageByAbility: LanguageAbilities;
  secondLanguage: number;
  education: number;
  experience: number;
  age: number;
  arrangedEmployment: number;
  adaptability: number;
  /** Éléments d'adaptabilité obtenus, avant le plafond de 10 points. */
  adaptabilityElements: FswAdaptabilityElement[];
  adaptabilityBeforeCap: number;
  total: number;
  passMark: number;
  meetsPassMark: boolean;
  /** Points manquants pour atteindre 67 (0 si atteint). */
  missingPoints: number;
  /** Exigences minimales liées à la grille : langue (CLB 7 aux quatre compétences) et un an d'expérience qualifiée. */
  minimums: { firstLanguageClb7: boolean; oneYearExperience: boolean };
  meetsMinimums: boolean;
};

export function computeFswScore(profile: FswProfile): FswBreakdown {
  const byAbility: LanguageAbilities = {
    speaking: firstLanguageAbilityPoints(profile.firstLanguage.speaking), listening: firstLanguageAbilityPoints(profile.firstLanguage.listening),
    reading: firstLanguageAbilityPoints(profile.firstLanguage.reading), writing: firstLanguageAbilityPoints(profile.firstLanguage.writing),
  };
  const firstLanguage = byAbility.speaking + byAbility.listening + byAbility.reading + byAbility.writing;
  const secondLanguage = secondLanguagePoints(profile.secondLanguage);
  const arranged = profile.arrangedEmployment ? 10 : 0;
  const spouse = profile.hasSpouse;
  const elements: FswAdaptabilityElement[] = [
    { key: "spouseLanguage", label: "Langue de l’époux ou conjoint de fait (CLB 4 ou plus aux quatre compétences)", points: 5, earned: spouse && profile.spouseLanguageClb4 },
    { key: "ownCanadianStudy", label: "Vos études au Canada (au moins 2 années à temps plein)", points: 5, earned: profile.ownCanadianStudy },
    { key: "spouseCanadianStudy", label: "Études au Canada de l’époux ou conjoint de fait", points: 5, earned: spouse && profile.spouseCanadianStudy },
    { key: "ownCanadianWork", label: "Votre travail au Canada (au moins 1 an à temps plein, TEER 0 à 3)", points: 10, earned: profile.ownCanadianWork },
    { key: "spouseCanadianWork", label: "Travail au Canada de l’époux ou conjoint de fait (au moins 1 an)", points: 5, earned: spouse && profile.spouseCanadianWork },
    { key: "arrangedEmployment", label: "Emploi réservé au Canada", points: 5, earned: profile.arrangedEmployment },
    { key: "relative", label: "Parent au Canada (citoyen ou résident permanent de 18 ans ou plus)", points: 5, earned: profile.relativeInCanada },
  ];
  const adaptabilityBeforeCap = elements.filter((element) => element.earned).reduce((sum, element) => sum + element.points, 0);
  const adaptability = Math.min(10, adaptabilityBeforeCap);
  const education = EDUCATION_POINTS[profile.education];
  const experience = experiencePoints(profile.skilledExperienceYears);
  const age = agePoints(profile.age);
  const total = firstLanguage + secondLanguage + education + experience + age + arranged + adaptability;
  const minimums = { firstLanguageClb7: Math.min(...Object.values(profile.firstLanguage)) >= 7, oneYearExperience: profile.skilledExperienceYears >= 1 };
  return {
    language: firstLanguage + secondLanguage, firstLanguage, firstLanguageByAbility: byAbility, secondLanguage, education, experience, age, arrangedEmployment: arranged, adaptability, adaptabilityElements: elements, adaptabilityBeforeCap,
    total, passMark: FSW_PASS_MARK, meetsPassMark: total >= FSW_PASS_MARK, missingPoints: Math.max(0, FSW_PASS_MARK - total), minimums, meetsMinimums: minimums.firstLanguageClb7 && minimums.oneYearExperience,
  };
}
