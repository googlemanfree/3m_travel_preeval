/**
 * Calcul du score CRS (Comprehensive Ranking System) d'Entrée express, aussi fidèle que possible à la grille officielle
 * d'IRCC. Chaque barème ci-dessous vient de deux pages officielles de canada.ca, recoupées le 2026-09-27 (les deux
 * donnent des chiffres identiques) :
 *  - https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.htm
 *  - https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html
 * Les points d'emploi réservé (« arranged employment ») ont été retirés par IRCC le 25 mars 2025 : ils n'existent plus
 * dans ce calcul, volontairement. Rien ici n'est un chiffre estimé ou arrondi « à vue d'œil » : une valeur absente de la
 * grille officielle n'est jamais complétée par une supposition.
 */

export type MaritalStatus = "with_spouse" | "without_spouse";
export type EducationLevel = "less_than_secondary" | "secondary" | "one_year_postsecondary" | "two_year_postsecondary" | "bachelor_or_three_year" | "two_or_more_credentials" | "master_or_professional" | "doctoral";
export type ExperienceYears = 0 | 1 | 2 | 3 | 4 | 5;
export type CanadianEducationLevel = "none" | "one_or_two_years" | "three_years_or_more";

export type SpouseProfile = {
  education: EducationLevel;
  /** CLB de la première langue officielle du conjoint, appliqué uniformément à l'oral, l'écrit, la lecture et l'écoute. */
  firstLanguageClb: number;
  canadianExperienceYears: ExperienceYears;
};

export type LanguageAbilities = {
  reading: number;
  writing: number;
  listening: number;
  speaking: number;
};

export type CrsProfile = {
  age: number;
  maritalStatus: MaritalStatus;
  education: EducationLevel;
  /** CLB en français, appliqué uniformément aux quatre compétences (simplification affichée à l'utilisateur : le vrai test peut varier par compétence). */
  frenchClb: number;
  /** CLB en anglais, même simplification. */
  englishClb: number;
  /** Niveaux CLB/NCLC distincts pour la première langue officielle. */
  firstLanguageAbilities?: LanguageAbilities;
  /** Niveaux CLB/NCLC distincts pour la deuxième langue officielle. */
  secondLanguageAbilities?: LanguageAbilities;
  firstOfficialLanguage?: "english" | "french";
  canadianExperienceYears: ExperienceYears;
  /** Expérience professionnelle ACQUISE HORS DU CANADA, pour la transférabilité des compétences (jamais comptée comme expérience canadienne). */
  foreignExperienceYears: ExperienceYears;
  hasTradeCertificate: boolean;
  canadianEducation: CanadianEducationLevel;
  hasSiblingInCanada: boolean;
  hasProvincialNomination: boolean;
  spouse: SpouseProfile | null;
};

export type CrsBreakdown = {
  age: number;
  education: number;
  firstLanguage: number;
  secondLanguage: number;
  canadianExperience: number;
  coreHumanCapital: number;
  coreHumanCapitalMax: number;
  spouseEducation: number;
  spouseLanguage: number;
  spouseExperience: number;
  spouseFactors: number;
  transferabilityEducationLanguage: number;
  transferabilityEducationExperience: number;
  transferabilityForeignExperienceLanguage: number;
  transferabilityForeignExperienceCanadianExperience: number;
  transferabilityCertificate: number;
  skillTransferability: number;
  canadianEducationBonus: number;
  frenchBonus: number;
  siblingBonus: number;
  provincialNomination: number;
  additionalPoints: number;
  total: number;
};

const cap = (value: number, max: number): number => Math.max(0, Math.min(max, value));

// ─── Facteurs de base (capital humain) ────────────────────────────────────────────────────────────────────────────

const AGE_TABLE: Array<{ age: number; withSpouse: number; withoutSpouse: number }> = [
  { age: 17, withSpouse: 0, withoutSpouse: 0 },
  { age: 18, withSpouse: 90, withoutSpouse: 99 },
  { age: 19, withSpouse: 95, withoutSpouse: 105 },
  { age: 20, withSpouse: 100, withoutSpouse: 110 },
  { age: 29, withSpouse: 100, withoutSpouse: 110 },
  { age: 30, withSpouse: 95, withoutSpouse: 105 },
  { age: 31, withSpouse: 90, withoutSpouse: 99 },
  { age: 32, withSpouse: 85, withoutSpouse: 94 },
  { age: 33, withSpouse: 80, withoutSpouse: 88 },
  { age: 34, withSpouse: 75, withoutSpouse: 83 },
  { age: 35, withSpouse: 70, withoutSpouse: 77 },
  { age: 36, withSpouse: 65, withoutSpouse: 72 },
  { age: 37, withSpouse: 60, withoutSpouse: 66 },
  { age: 38, withSpouse: 55, withoutSpouse: 61 },
  { age: 39, withSpouse: 50, withoutSpouse: 55 },
  { age: 40, withSpouse: 45, withoutSpouse: 50 },
  { age: 41, withSpouse: 35, withoutSpouse: 39 },
  { age: 42, withSpouse: 25, withoutSpouse: 28 },
  { age: 43, withSpouse: 15, withoutSpouse: 17 },
  { age: 44, withSpouse: 5, withoutSpouse: 6 },
  { age: 45, withSpouse: 0, withoutSpouse: 0 },
];

/** Table triée par âge croissant : au-delà de 20-29 (points constants), on prend la première ligne à l'âge ou en dessous. */
export function agePoints(rawAge: number, withSpouse: boolean): number {
  if (!Number.isFinite(rawAge)) return 0;
  const age = Math.floor(rawAge);
  if (age <= 17) return 0;
  if (age >= 45) return 0;
  const row = [...AGE_TABLE].reverse().find((entry) => age >= entry.age);
  return row ? (withSpouse ? row.withSpouse : row.withoutSpouse) : 0;
}

const EDUCATION_TABLE: Record<EducationLevel, { withSpouse: number; withoutSpouse: number }> = {
  less_than_secondary: { withSpouse: 0, withoutSpouse: 0 },
  secondary: { withSpouse: 28, withoutSpouse: 30 },
  one_year_postsecondary: { withSpouse: 84, withoutSpouse: 90 },
  two_year_postsecondary: { withSpouse: 91, withoutSpouse: 98 },
  bachelor_or_three_year: { withSpouse: 112, withoutSpouse: 120 },
  two_or_more_credentials: { withSpouse: 119, withoutSpouse: 128 },
  master_or_professional: { withSpouse: 126, withoutSpouse: 135 },
  doctoral: { withSpouse: 140, withoutSpouse: 150 },
};

export function educationPoints(level: EducationLevel, withSpouse: boolean): number {
  const row = EDUCATION_TABLE[level];
  return withSpouse ? row.withSpouse : row.withoutSpouse;
}

/** CLB → points pour une compétence (lecture, écriture, écoute OU expression orale), première langue officielle. */
const FIRST_LANGUAGE_PER_ABILITY: Array<{ minClb: number; withSpouse: number; withoutSpouse: number }> = [
  { minClb: 10, withSpouse: 32, withoutSpouse: 34 },
  { minClb: 9, withSpouse: 29, withoutSpouse: 31 },
  { minClb: 8, withSpouse: 22, withoutSpouse: 23 },
  { minClb: 7, withSpouse: 16, withoutSpouse: 17 },
  { minClb: 6, withSpouse: 8, withoutSpouse: 9 },
  { minClb: 4, withSpouse: 6, withoutSpouse: 6 },
  { minClb: 0, withSpouse: 0, withoutSpouse: 0 },
];

/** Points pour UNE compétence de la première langue officielle. */
export function firstLanguageAbilityPoints(clb: number, withSpouse: boolean): number {
  const row = FIRST_LANGUAGE_PER_ABILITY.find((entry) => clb >= entry.minClb) ?? FIRST_LANGUAGE_PER_ABILITY.at(-1)!;
  return withSpouse ? row.withSpouse : row.withoutSpouse;
}

/** Total sur les quatre compétences (simplification : même CLB appliqué aux quatre), plafonné par la grille officielle. */
export function firstLanguagePoints(clb: number, withSpouse: boolean): number {
  return cap(firstLanguageAbilityPoints(clb, withSpouse) * 4, withSpouse ? 128 : 136);
}

export function firstLanguagePointsByAbility(abilities: LanguageAbilities, withSpouse: boolean): number {
  return cap(Object.values(abilities).reduce((total, clb) => total + firstLanguageAbilityPoints(clb, withSpouse), 0), withSpouse ? 128 : 136);
}

const SECOND_LANGUAGE_PER_ABILITY: Array<{ minClb: number; points: number }> = [
  { minClb: 9, points: 6 },
  { minClb: 7, points: 3 },
  { minClb: 5, points: 1 },
  { minClb: 0, points: 0 },
];

export function secondLanguageAbilityPoints(clb: number): number {
  const row = SECOND_LANGUAGE_PER_ABILITY.find((entry) => clb >= entry.minClb) ?? SECOND_LANGUAGE_PER_ABILITY.at(-1)!;
  return row.points;
}

export function secondLanguagePoints(clb: number, withSpouse: boolean): number {
  return cap(secondLanguageAbilityPoints(clb) * 4, withSpouse ? 22 : 24);
}

export function secondLanguagePointsByAbility(abilities: LanguageAbilities, withSpouse: boolean): number {
  return cap(Object.values(abilities).reduce((total, clb) => total + secondLanguageAbilityPoints(clb), 0), withSpouse ? 22 : 24);
}

const CANADIAN_EXPERIENCE_TABLE: Record<ExperienceYears, { withSpouse: number; withoutSpouse: number }> = {
  0: { withSpouse: 0, withoutSpouse: 0 },
  1: { withSpouse: 35, withoutSpouse: 40 },
  2: { withSpouse: 46, withoutSpouse: 53 },
  3: { withSpouse: 56, withoutSpouse: 64 },
  4: { withSpouse: 63, withoutSpouse: 72 },
  5: { withSpouse: 70, withoutSpouse: 80 },
};

export function canadianExperiencePoints(years: ExperienceYears, withSpouse: boolean): number {
  const row = CANADIAN_EXPERIENCE_TABLE[years];
  return withSpouse ? row.withSpouse : row.withoutSpouse;
}

// ─── Facteurs du conjoint (max 40, seulement si maritalStatus = with_spouse) ─────────────────────────────────────

const SPOUSE_EDUCATION_TABLE: Record<EducationLevel, number> = {
  less_than_secondary: 0,
  secondary: 2,
  one_year_postsecondary: 6,
  two_year_postsecondary: 7,
  bachelor_or_three_year: 8,
  two_or_more_credentials: 9,
  master_or_professional: 10,
  doctoral: 10,
};

const SPOUSE_LANGUAGE_PER_ABILITY: Array<{ minClb: number; points: number }> = [
  { minClb: 9, points: 5 },
  { minClb: 7, points: 3 },
  { minClb: 5, points: 1 },
  { minClb: 0, points: 0 },
];

const SPOUSE_EXPERIENCE_TABLE: Record<ExperienceYears, number> = { 0: 0, 1: 5, 2: 7, 3: 8, 4: 9, 5: 10 };

export function spouseFactorPoints(spouse: SpouseProfile | null): { education: number; language: number; experience: number; total: number } {
  if (!spouse) return { education: 0, language: 0, experience: 0, total: 0 };
  const education = SPOUSE_EDUCATION_TABLE[spouse.education];
  const abilityRow = SPOUSE_LANGUAGE_PER_ABILITY.find((entry) => spouse.firstLanguageClb >= entry.minClb) ?? SPOUSE_LANGUAGE_PER_ABILITY.at(-1)!;
  const language = cap(abilityRow.points * 4, 20);
  const experience = SPOUSE_EXPERIENCE_TABLE[spouse.canadianExperienceYears];
  return { education, language, experience, total: cap(education + language + experience, 40) };
}

// ─── Transférabilité des compétences (max 100 au total, identique avec ou sans conjoint) ────────────────────────

const HIGH_TRANSFERABILITY_EDUCATION = new Set<EducationLevel>(["two_or_more_credentials", "bachelor_or_three_year", "master_or_professional", "doctoral"]);
const isPostSecondaryOneOrTwoYears = (level: EducationLevel) => level === "one_year_postsecondary" || level === "two_year_postsecondary";

/** Éducation + bonne maîtrise linguistique (CLB 7+ requis pour tout point ; CLB 9+ sur les quatre compétences double le montant). */
export function transferabilityEducationLanguage(education: EducationLevel, bestClb: number): number {
  if (bestClb < 7) return 0;
  if (education === "less_than_secondary" || education === "secondary") return 0;
  const high = bestClb >= 9;
  if (isPostSecondaryOneOrTwoYears(education)) return high ? 25 : 13;
  if (HIGH_TRANSFERABILITY_EDUCATION.has(education)) return high ? 50 : 25;
  return 0;
}

/** Éducation + expérience canadienne (1 an ou 2 ans et plus). */
export function transferabilityEducationExperience(education: EducationLevel, canadianExperienceYears: ExperienceYears): number {
  if (canadianExperienceYears < 1) return 0;
  if (education === "less_than_secondary" || education === "secondary") return 0;
  const high = canadianExperienceYears >= 2;
  if (isPostSecondaryOneOrTwoYears(education)) return high ? 25 : 13;
  if (HIGH_TRANSFERABILITY_EDUCATION.has(education)) return high ? 50 : 25;
  return 0;
}

/** Expérience étrangère + bonne maîtrise linguistique. */
export function transferabilityForeignExperienceLanguage(foreignExperienceYears: ExperienceYears, bestClb: number): number {
  if (bestClb < 7 || foreignExperienceYears < 1) return 0;
  const high = bestClb >= 9;
  return foreignExperienceYears >= 3 ? (high ? 50 : 25) : high ? 25 : 13;
}

/** Expérience étrangère + expérience canadienne. */
export function transferabilityForeignExperienceCanadianExperience(foreignExperienceYears: ExperienceYears, canadianExperienceYears: ExperienceYears): number {
  if (canadianExperienceYears < 1 || foreignExperienceYears < 1) return 0;
  const high = canadianExperienceYears >= 2;
  return foreignExperienceYears >= 3 ? (high ? 50 : 25) : high ? 25 : 13;
}

/** Certificat de qualification (métier réglementé) + maîtrise linguistique. */
export function transferabilityCertificate(hasTradeCertificate: boolean, bestClb: number): number {
  if (!hasTradeCertificate || bestClb < 5) return 0;
  return bestClb >= 7 ? 50 : 25;
}

export type SkillTransferability = { educationLanguage: number; educationExperience: number; foreignExperienceLanguage: number; foreignExperienceCanadianExperience: number; certificate: number; total: number };

export function skillTransferabilityPoints(profile: Pick<CrsProfile, "education" | "frenchClb" | "englishClb" | "canadianExperienceYears" | "foreignExperienceYears" | "hasTradeCertificate"> & Pick<CrsProfile, "firstLanguageAbilities">): SkillTransferability {
  const bestClb = profile.firstLanguageAbilities
    ? Math.min(...Object.values(profile.firstLanguageAbilities))
    : Math.max(profile.frenchClb, profile.englishClb);
  const educationLanguage = cap(transferabilityEducationLanguage(profile.education, bestClb), 50);
  const educationExperience = cap(transferabilityEducationExperience(profile.education, profile.canadianExperienceYears), 50);
  const foreignExperienceLanguage = cap(transferabilityForeignExperienceLanguage(profile.foreignExperienceYears, bestClb), 50);
  const foreignExperienceCanadianExperience = cap(transferabilityForeignExperienceCanadianExperience(profile.foreignExperienceYears, profile.canadianExperienceYears), 50);
  const certificate = cap(transferabilityCertificate(profile.hasTradeCertificate, bestClb), 50);
  const total = cap(educationLanguage + educationExperience + foreignExperienceLanguage + foreignExperienceCanadianExperience + certificate, 100);
  return { educationLanguage, educationExperience, foreignExperienceLanguage, foreignExperienceCanadianExperience, certificate, total };
}

// ─── Points additionnels (max 600, dominé par la nomination provinciale) ─────────────────────────────────────────

const CANADIAN_EDUCATION_BONUS: Record<CanadianEducationLevel, number> = { none: 0, one_or_two_years: 15, three_years_or_more: 30 };

/** Bonus francophone : NCLC/CLB 7+ dans les deux langues officielles double le bonus (50 au lieu de 25). Jamais estimé : dérivé des CLB saisis. */
export function frenchBonusPoints(frenchClb: number, englishClb: number): number {
  if (frenchClb < 7) return 0;
  return englishClb >= 5 ? 50 : 25;
}

export function frenchBonusPointsByAbility(french: LanguageAbilities, english: LanguageAbilities): number {
  if (!Object.values(french).every((clb) => clb >= 7)) return 0;
  return Object.values(english).every((clb) => clb >= 5) ? 50 : 25;
}

export function computeCrsScore(profile: CrsProfile): CrsBreakdown {
  const withSpouse = profile.maritalStatus === "with_spouse" && Boolean(profile.spouse);
  const age = agePoints(profile.age, withSpouse);
  const education = educationPoints(profile.education, withSpouse);
  const firstLanguage = profile.firstLanguageAbilities
    ? firstLanguagePointsByAbility(profile.firstLanguageAbilities, withSpouse)
    : firstLanguagePoints(Math.max(profile.frenchClb, profile.englishClb), withSpouse);
  const secondLanguage = profile.secondLanguageAbilities
    ? secondLanguagePointsByAbility(profile.secondLanguageAbilities, withSpouse)
    : secondLanguagePoints(Math.min(profile.frenchClb, profile.englishClb), withSpouse);
  const canadianExperience = canadianExperiencePoints(profile.canadianExperienceYears, withSpouse);
  const coreHumanCapitalMax = withSpouse ? 460 : 500;
  const coreHumanCapital = cap(age + education + firstLanguage + secondLanguage + canadianExperience, coreHumanCapitalMax);

  const spouse = spouseFactorPoints(withSpouse ? profile.spouse : null);
  const transferability = skillTransferabilityPoints(profile);
  const canadianEducationBonus = CANADIAN_EDUCATION_BONUS[profile.canadianEducation];
  const frenchBonus = profile.firstLanguageAbilities && profile.secondLanguageAbilities && profile.firstOfficialLanguage
    ? profile.firstOfficialLanguage === "french"
      ? frenchBonusPointsByAbility(profile.firstLanguageAbilities, profile.secondLanguageAbilities)
      : frenchBonusPointsByAbility(profile.secondLanguageAbilities, profile.firstLanguageAbilities)
    : frenchBonusPoints(profile.frenchClb, profile.englishClb);
  const siblingBonus = profile.hasSiblingInCanada ? 15 : 0;
  const provincialNomination = profile.hasProvincialNomination ? 600 : 0;
  const additionalPoints = canadianEducationBonus + frenchBonus + siblingBonus + provincialNomination;

  const total = cap(coreHumanCapital + spouse.total + transferability.total + additionalPoints, 1200);

  return {
    age, education, firstLanguage, secondLanguage, canadianExperience, coreHumanCapital, coreHumanCapitalMax,
    spouseEducation: spouse.education, spouseLanguage: spouse.language, spouseExperience: spouse.experience, spouseFactors: spouse.total,
    transferabilityEducationLanguage: transferability.educationLanguage,
    transferabilityEducationExperience: transferability.educationExperience,
    transferabilityForeignExperienceLanguage: transferability.foreignExperienceLanguage,
    transferabilityForeignExperienceCanadianExperience: transferability.foreignExperienceCanadianExperience,
    transferabilityCertificate: transferability.certificate,
    skillTransferability: transferability.total,
    canadianEducationBonus, frenchBonus, siblingBonus, provincialNomination, additionalPoints,
    total,
  };
}

export const CRS_SOURCE = {
  organization: "Immigration, Réfugiés et Citoyenneté Canada (IRCC)",
  url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.htm",
  verifiedAt: "2026-09-27",
  note: "Les points d'emploi réservé ont été retirés par IRCC le 25 mars 2025 ; ce calcul ne les inclut plus.",
} as const;
