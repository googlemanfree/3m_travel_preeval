import { CRS_TEST_LANGUAGE, type CrsAbility } from "./crsLanguageTests";
import { abilitiesFromBands } from "./crsOfficialAnswers";
import type { EducationLevel, LanguageAbilities } from "./crsScore";
import type { FswProfile } from "./fswGrid";

/**
 * Réponses saisies pour la grille des 67 points. Chaque question doit recevoir une réponse : une question vide n'est jamais comptée comme
 * « non » ou « zéro » (elle est listée parmi les réponses manquantes).
 */
export type FswAnswers = {
  age: string;
  education: string;
  firstTest: string;
  firstBands: Record<CrsAbility, string>;
  /** « none » = pas de test dans l'autre langue officielle (réponse « sans objet »). */
  secondTest: string;
  secondBands: Record<CrsAbility, string>;
  /** Années d'expérience de travail qualifié : « 0 » (moins d'un an) à « 6 » (6 ans ou plus). */
  experienceYears: string;
  arrangedEmployment: string;
  hasSpouse: string;
  spouseLanguageClb4: string;
  spouseCanadianStudy: string;
  spouseCanadianWork: string;
  ownCanadianStudy: string;
  ownCanadianWork: string;
  relativeInCanada: string;
};

const emptyBands = (): Record<CrsAbility, string> => ({ speaking: "", listening: "", reading: "", writing: "" });
export const EMPTY_FSW_ANSWERS: FswAnswers = {
  age: "", education: "", firstTest: "", firstBands: emptyBands(), secondTest: "", secondBands: emptyBands(), experienceYears: "", arrangedEmployment: "", hasSpouse: "",
  spouseLanguageClb4: "", spouseCanadianStudy: "", spouseCanadianWork: "", ownCanadianStudy: "", ownCanadianWork: "", relativeInCanada: "",
};

const EDUCATION_VALUES = new Set<string>(["less_than_secondary", "secondary", "one_year_postsecondary", "two_year_postsecondary", "bachelor_or_three_year", "two_or_more_credentials", "master_or_professional", "doctoral"]);
const isTest = (value: string) => value in CRS_TEST_LANGUAGE;

export type FswResult = { complete: true; missing: []; profile: FswProfile } | { complete: false; missing: string[]; profile: null };

export function buildFswProfile(a: FswAnswers): FswResult {
  const missing: string[] = [];
  const need = (ok: boolean, label: string) => { if (!ok) missing.push(label); };
  const yes = (value: string) => value === "yes";
  const answered = (value: string) => value === "yes" || value === "no";

  need(/^\d+$/.test(a.age), "1) Âge");
  need(EDUCATION_VALUES.has(a.education), "2) Niveau d’études");
  need(isTest(a.firstTest), "3) Test de langue de la première langue officielle");
  const first = isTest(a.firstTest) ? abilitiesFromBands(a.firstTest, a.firstBands) : null;
  if (isTest(a.firstTest) && !first) need(false, "3) Notes des quatre compétences (première langue)");
  need(a.secondTest !== "", "4) Test de la seconde langue officielle : choisissez un test ou « Sans objet »");
  const second: LanguageAbilities | null = isTest(a.secondTest) ? abilitiesFromBands(a.secondTest, a.secondBands) : null;
  if (isTest(a.secondTest) && !second) need(false, "4) Notes des quatre compétences (seconde langue)");
  need(/^[0-6]$/.test(a.experienceYears), "5) Années d’expérience de travail qualifié");
  need(answered(a.arrangedEmployment), "6) Offre d’emploi réservé au Canada");
  need(answered(a.hasSpouse), "7) Époux ou conjoint de fait qui vous accompagne");
  if (yes(a.hasSpouse)) {
    need(answered(a.spouseLanguageClb4), "7 a) Langue de l’époux ou conjoint de fait");
    need(answered(a.spouseCanadianStudy), "7 b) Études au Canada de l’époux ou conjoint de fait");
    need(answered(a.spouseCanadianWork), "7 c) Travail au Canada de l’époux ou conjoint de fait");
  }
  need(answered(a.ownCanadianStudy), "8) Vos études au Canada");
  need(answered(a.ownCanadianWork), "9) Votre travail au Canada");
  need(answered(a.relativeInCanada), "10) Parent au Canada");

  if (missing.length > 0 || !first) return { complete: false, missing, profile: null };
  const spouse = yes(a.hasSpouse);
  return {
    complete: true, missing: [],
    profile: {
      age: Number(a.age), education: a.education as EducationLevel, firstLanguage: first, secondLanguage: second, skilledExperienceYears: Number(a.experienceYears),
      arrangedEmployment: yes(a.arrangedEmployment), hasSpouse: spouse, spouseLanguageClb4: spouse && yes(a.spouseLanguageClb4), ownCanadianStudy: yes(a.ownCanadianStudy),
      spouseCanadianStudy: spouse && yes(a.spouseCanadianStudy), ownCanadianWork: yes(a.ownCanadianWork), spouseCanadianWork: spouse && yes(a.spouseCanadianWork), relativeInCanada: yes(a.relativeInCanada),
    },
  };
}
