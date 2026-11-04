import { CRS_ABILITIES, CRS_TEST_LANGUAGE, clbForBand, type CrsAbility, type CrsLanguageTest } from "./crsLanguageTests";
import type { CanadianEducationLevel, CrsProfile, EducationLevel, ExperienceYears, HighWageLevel, LanguageAbilities } from "./crsScore";

/**
 * Réponses saisies dans la calculatrice « comme canada.ca » : mêmes questions, même ordre et mêmes conditions que l'outil officiel d'IRCC
 * « Vérifiez votre note ». Les valeurs sont des chaînes (valeurs des listes déroulantes) ; ce module les traduit en profil de calcul.
 */
export const MARITAL_OPTIONS = [
  { value: "annulled", label: "Mariage annulé" },
  { value: "common_law", label: "Conjoint de fait" },
  { value: "divorced", label: "Divorcé/séparé" },
  { value: "legally_separated", label: "Séparé légalement" },
  { value: "married", label: "Marié" },
  { value: "single", label: "Jamais marié/célibataire" },
  { value: "widowed", label: "Veuf" },
] as const;

export type CrsOfficialAnswers = {
  maritalStatus: string;
  /** Question 2 i : l'époux ou conjoint de fait est-il citoyen ou résident permanent du Canada ? « yes » | « no ». */
  spouseCitizenOrPr: string;
  /** Question 2 ii : vous accompagnera-t-il au Canada ? */
  spouseAccompanies: string;
  age: string;
  education: string;
  canadianCredential: string;
  canadianCredentialLevel: string;
  languageTestRecent: string;
  firstTest: string;
  firstBands: Record<CrsAbility, string>;
  secondTest: string;
  secondBands: Record<CrsAbility, string>;
  canadianWorkYears: string;
  highWageExperience: string;
  highWage2x: string;
  highWage15x: string;
  foreignWorkYears: string;
  certificate: string;
  jobOffer: string;
  jobOfferLevel: string;
  nomination: string;
  sibling: string;
  spouseEducation: string;
  spouseCanadianWorkYears: string;
  spouseTest: string;
  spouseBands: Record<CrsAbility, string>;
};

const emptyBands = (): Record<CrsAbility, string> => ({ speaking: "", listening: "", reading: "", writing: "" });

export const EMPTY_CRS_ANSWERS: CrsOfficialAnswers = {
  maritalStatus: "", spouseCitizenOrPr: "", spouseAccompanies: "", age: "", education: "", canadianCredential: "", canadianCredentialLevel: "",
  languageTestRecent: "", firstTest: "", firstBands: emptyBands(), secondTest: "", secondBands: emptyBands(),
  canadianWorkYears: "", highWageExperience: "", highWage2x: "", highWage15x: "", foreignWorkYears: "", certificate: "", jobOffer: "", jobOfferLevel: "",
  nomination: "", sibling: "", spouseEducation: "", spouseCanadianWorkYears: "", spouseTest: "", spouseBands: emptyBands(),
};

export const isMarried = (maritalStatus: string): boolean => maritalStatus === "married" || maritalStatus === "common_law";

/** Le barème « avec conjoint » ne s'applique que si le conjoint n'est ni citoyen ni résident permanent ET vous accompagne (règle IRCC). */
export function countsAsWithSpouse(answers: Pick<CrsOfficialAnswers, "maritalStatus" | "spouseCitizenOrPr" | "spouseAccompanies">): boolean {
  return isMarried(answers.maritalStatus) && answers.spouseCitizenOrPr === "no" && answers.spouseAccompanies === "yes";
}

const EDUCATION_VALUES = new Set<string>(["less_than_secondary", "secondary", "one_year_postsecondary", "two_year_postsecondary", "bachelor_or_three_year", "two_or_more_credentials", "master_or_professional", "doctoral"]);
const isTest = (value: string): value is CrsLanguageTest => value in CRS_TEST_LANGUAGE;

/** Niveaux CLB par compétence d'un test ; null tant qu'une des quatre compétences n'est pas renseignée. */
export function abilitiesFromBands(test: string, bands: Record<CrsAbility, string>): LanguageAbilities | null {
  if (!isTest(test)) return null;
  const result: Partial<LanguageAbilities> = {};
  for (const { key } of CRS_ABILITIES) {
    const index = bands[key] === "" ? NaN : Number(bands[key]);
    const clb = Number.isInteger(index) ? clbForBand(test, key, index) : null;
    if (clb === null) return null;
    result[key] = clb;
  }
  return result as LanguageAbilities;
}

const ZERO_ABILITIES: LanguageAbilities = { speaking: 0, listening: 0, reading: 0, writing: 0 };
const minOf = (abilities: LanguageAbilities) => Math.min(...Object.values(abilities));

export type CrsOfficialResult =
  | { complete: true; missing: []; profile: CrsProfile; withSpouse: boolean; languageNote: string | null }
  | { complete: false; missing: string[]; profile: null; withSpouse: boolean; languageNote: string | null };

/** Construit le profil de calcul ; liste les questions encore sans réponse (dans l'ordre de l'outil officiel). */
export function buildCrsProfileFromOfficialAnswers(a: CrsOfficialAnswers): CrsOfficialResult {
  const missing: string[] = [];
  const need = (ok: boolean, label: string) => { if (!ok) missing.push(label); };
  const withSpouse = countsAsWithSpouse(a);

  need(a.maritalStatus !== "", "1) État matrimonial");
  if (isMarried(a.maritalStatus)) {
    need(a.spouseCitizenOrPr !== "", "2 i) Votre époux ou conjoint de fait est-il citoyen ou résident permanent du Canada ?");
    if (a.spouseCitizenOrPr === "no") need(a.spouseAccompanies !== "", "2 ii) Votre époux ou conjoint de fait vous accompagnera-t-il au Canada ?");
  }
  need(/^\d+$/.test(a.age), "3) Âge");
  need(EDUCATION_VALUES.has(a.education), "4) Niveau d’études");
  need(a.canadianCredential !== "", "4b) Certificat, grade ou diplôme canadien");
  if (a.canadianCredential === "yes") need(a.canadianCredentialLevel !== "", "4c) Niveau du diplôme canadien");
  need(a.languageTestRecent !== "", "5 i) Résultats de test de langue de moins de deux ans");

  let first: LanguageAbilities | null = null;
  let second: LanguageAbilities | null = null;
  let languageNote: string | null = null;
  if (a.languageTestRecent === "yes") {
    need(isTest(a.firstTest), "5 ii) Test de langue de la première langue officielle");
    first = abilitiesFromBands(a.firstTest, a.firstBands);
    if (isTest(a.firstTest) && !first) need(false, "5 ii) Notes des quatre compétences (première langue)");
    if (isTest(a.secondTest)) {
      second = abilitiesFromBands(a.secondTest, a.secondBands);
      if (!second) need(false, "5 iii) Notes des quatre compétences (seconde langue)");
    }
  } else if (a.languageTestRecent === "no") {
    // IRCC exige des résultats de moins de deux ans pour tous les programmes d'Entrée express : sans eux, aucune note n'est annoncée.
    languageNote = "IRCC exige des résultats de test de langue de moins de deux ans pour tous les programmes d’Entrée express, même si l’anglais ou le français est votre langue maternelle. Passez un test reconnu, puis revenez calculer votre note.";
    need(false, "5 i) Des résultats de test de langue de moins de deux ans sont nécessaires");
  }

  need(/^[0-5]$/.test(a.canadianWorkYears), "6 i) Expérience de travail qualifié au Canada");
  need(a.highWageExperience !== "", "6 ii) Expérience au Canada dans une profession à salaire élevé");
  if (a.highWageExperience === "yes") {
    need(a.highWage2x !== "", "6 iii) Salaire au moins 2 fois supérieur au salaire médian");
    if (a.highWage2x === "no") need(a.highWage15x !== "", "6 iv) Salaire au moins 1,5 fois supérieur au salaire médian");
  }
  need(/^[0-3]$/.test(a.foreignWorkYears), "6 v) Expérience de travail qualifié à l’étranger");
  need(a.certificate !== "", "7) Certificat de compétence");
  need(a.jobOffer !== "", "8) Offre d’emploi valide dans une profession à salaire élevé");
  if (a.jobOffer === "yes") need(["2", "1.5", "1.3"].includes(a.jobOfferLevel), "8a) Niveau de la profession à salaire élevé");
  need(a.nomination !== "", "9) Certificat de désignation d’une province ou d’un territoire");
  need(a.sibling !== "", "10) Frère ou sœur au Canada");

  let spouse: CrsProfile["spouse"] = null;
  if (withSpouse) {
    need(EDUCATION_VALUES.has(a.spouseEducation), "11) Niveau d’études de l’époux ou conjoint de fait");
    need(/^[0-5]$/.test(a.spouseCanadianWorkYears), "12) Expérience de travail de l’époux ou conjoint de fait au Canada");
    need(a.spouseTest !== "", "13) Test de langue de l’époux ou conjoint de fait");
    const spouseAbilities = isTest(a.spouseTest) ? abilitiesFromBands(a.spouseTest, a.spouseBands) : ZERO_ABILITIES;
    if (isTest(a.spouseTest) && !spouseAbilities) need(false, "13) Notes des quatre compétences de l’époux ou conjoint de fait");
    if (EDUCATION_VALUES.has(a.spouseEducation) && /^[0-5]$/.test(a.spouseCanadianWorkYears) && spouseAbilities) {
      spouse = { education: a.spouseEducation as EducationLevel, firstLanguageClb: minOf(spouseAbilities), firstLanguageAbilities: spouseAbilities, canadianExperienceYears: Number(a.spouseCanadianWorkYears) as ExperienceYears };
    }
  }

  if (missing.length > 0) return { complete: false, missing, profile: null, withSpouse, languageNote };

  const firstAbilities = first ?? ZERO_ABILITIES;
  const secondAbilities = second ?? ZERO_ABILITIES;
  const firstIsFrench = isTest(a.firstTest) && CRS_TEST_LANGUAGE[a.firstTest] === "french";
  const french = firstIsFrench ? firstAbilities : second && isTest(a.secondTest) && CRS_TEST_LANGUAGE[a.secondTest] === "french" ? secondAbilities : ZERO_ABILITIES;
  const english = !firstIsFrench ? firstAbilities : second ? secondAbilities : ZERO_ABILITIES;
  const level = (value: string): HighWageLevel => (value === "2" || value === "1.5" || value === "1.3" ? value : "none");
  const highWageExperience: HighWageLevel = a.highWageExperience === "yes" ? (a.highWage2x === "yes" ? "2" : a.highWage15x === "yes" ? "1.5" : "1.3") : "none";
  const canadianEducation: CanadianEducationLevel = a.canadianCredential === "yes" ? (a.canadianCredentialLevel === "three_year_or_more" ? "three_years_or_more" : a.canadianCredentialLevel === "one_two_year" ? "one_or_two_years" : "none") : "none";

  const profile: CrsProfile = {
    age: Number(a.age),
    maritalStatus: withSpouse ? "with_spouse" : "without_spouse",
    education: a.education as EducationLevel,
    frenchClb: minOf(french),
    englishClb: minOf(english),
    firstLanguageAbilities: firstAbilities,
    secondLanguageAbilities: secondAbilities,
    firstOfficialLanguage: firstIsFrench ? "french" : "english",
    canadianExperienceYears: Number(a.canadianWorkYears) as ExperienceYears,
    highWageExperience,
    jobOffer: a.jobOffer === "yes" ? level(a.jobOfferLevel) : "none",
    foreignExperienceYears: Number(a.foreignWorkYears) as ExperienceYears,
    hasTradeCertificate: a.certificate === "yes",
    canadianEducation,
    hasSiblingInCanada: a.sibling === "yes",
    hasProvincialNomination: a.nomination === "yes",
    spouse,
  };
  return { complete: true, missing: [], profile, withSpouse, languageNote };
}
