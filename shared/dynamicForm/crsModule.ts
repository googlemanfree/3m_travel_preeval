import { computeCrsScore, CRS_SOURCE, CRS_TOTAL_MAX, type CrsBreakdown, type CrsProfile, type EducationLevel, type ExperienceYears, type HighWageLevel } from "../crsScore";
import { opts, sel, when, YES_NO } from "./fieldKit";
import type { ProgramFamily } from "./programs";
import type { DynamicField } from "./types";

/**
 * Calculateur de score CRS (Entrée express) intégré à l'évaluation « Canada, résidence permanente ».
 * Le candidat qui vise la résidence permanente au Canada passe obligatoirement par ces questions ; le score est TOUJOURS recalculé
 * côté serveur et côté administration à partir des réponses brutes (jamais un total envoyé par le navigateur), avec la grille
 * officielle de `shared/crsScore.ts`. C'est une estimation d'après les déclarations du candidat, pas une décision d'IRCC.
 */
export const CRS_FAMILIES: ReadonlySet<ProgramFamily> = new Set<ProgramFamily>(["work_points", "imm_points", "imm_regional", "imm_employer", "generic_immigration"]);

/** Le calculateur est-il obligatoire pour ce pays et ce programme ? */
export const usesCrs = (countryCode: string | null | undefined, family: ProgramFamily): boolean => countryCode === "CA" && CRS_FAMILIES.has(family);

const AGE_OPTIONS = [
  ...Array.from({ length: 29 }, (_, index) => 17 + index).map((age): [string, string] => [String(age), age === 17 ? "17 ans ou moins" : `${age} ans`]),
  ["46", "46 ans ou plus"] as [string, string],
];
const EDUCATION_OPTIONS = opts(
  ["less_than_secondary", "Moins que le secondaire (diplôme d’études secondaires non obtenu)"],
  ["secondary", "Diplôme d’études secondaires"],
  ["one_year_postsecondary", "Diplôme ou certificat d’un an après le secondaire"],
  ["two_year_postsecondary", "Diplôme de deux ans après le secondaire"],
  ["bachelor_or_three_year", "Licence (bachelor) ou diplôme de trois ans ou plus"],
  ["two_or_more_credentials", "Deux diplômes ou plus, dont un de trois ans ou plus"],
  ["master_or_professional", "Master ou diplôme professionnel (médecine, droit, etc.)"],
  ["doctoral", "Doctorat"],
);
const CLB_OPTIONS = opts(["0", "Aucun test, ou résultat inférieur à NCLC/CLB 4"], ["4", "NCLC/CLB 4"], ["5", "NCLC/CLB 5"], ["6", "NCLC/CLB 6"], ["7", "NCLC/CLB 7"], ["8", "NCLC/CLB 8"], ["9", "NCLC/CLB 9"], ["10", "NCLC/CLB 10 ou plus"]);
const YEARS_OPTIONS = opts(["0", "Aucune"], ["1", "1 an"], ["2", "2 ans"], ["3", "3 ans"], ["4", "4 ans"], ["5", "5 ans ou plus"]);
const HIGH_WAGE_OPTIONS = opts(["none", "Non, ou moins d’un an"], ["2", "Salaire au moins 2 fois supérieur au salaire médian"], ["1.5", "Salaire au moins 1,5 fois supérieur (mais moins de 2 fois)"], ["1.3", "Salaire au moins 1,3 fois supérieur (mais moins de 1,5 fois)"]);
const JOB_OFFER_OPTIONS = opts(["none", "Aucune offre d’emploi valide"], ["2", "Offre dans une profession à salaire au moins 2 fois supérieur au médian"], ["1.5", "Offre dans une profession à salaire au moins 1,5 fois supérieur (mais moins de 2 fois)"], ["1.3", "Offre dans une profession à salaire au moins 1,3 fois supérieur (mais moins de 1,5 fois)"]);
const WAGE_VALUES = new Set(["none", "1.3", "1.5", "2"]);

export function crsFields(): DynamicField[] {
  return [
    sel("crs_age", "Votre âge", opts(...AGE_OPTIONS), { required: true }),
    sel("crs_marital", "Situation familiale", opts(["without_spouse", "Célibataire, ou conjoint(e) qui ne vous accompagne pas"], ["with_spouse", "Marié(e) ou conjoint(e) de fait qui vous accompagne"]), { required: true }),
    sel("crs_education", "Niveau d’études le plus élevé", EDUCATION_OPTIONS, { required: true }),
    sel("crs_french", "Niveau en français (résultat d’un test officiel, NCLC)", CLB_OPTIONS, { required: true, help: "Le même niveau est appliqué aux quatre compétences pour l’estimation ; votre conseiller affinera avec vos résultats réels." }),
    sel("crs_english", "Niveau en anglais (résultat d’un test officiel, CLB)", CLB_OPTIONS, { required: true }),
    sel("crs_canadian_exp", "Expérience de travail qualifié AU CANADA", YEARS_OPTIONS, { required: true }),
    sel("crs_highwage", "Au moins 1 an d’expérience au Canada dans une profession à salaire élevé (liste d’IRCC) : à quel niveau de salaire ?", HIGH_WAGE_OPTIONS, { required: true, help: "Nouveau depuis le 3 novembre 2026 : ces points s’ajoutent à ceux de la durée d’expérience." }),
    sel("crs_joboffer", "Offre d’emploi valide dans une profession à salaire élevé (aucune EIMT exigée) : à quel niveau de salaire ?", JOB_OFFER_OPTIONS, { required: true, help: "IRCC retient le plus avantageux entre l’expérience canadienne et l’offre d’emploi, jamais les deux." }),
    sel("crs_foreign_exp", "Expérience de travail qualifié HORS du Canada", YEARS_OPTIONS, { required: true }),
    sel("crs_trade_cert", "Certificat de qualification dans un métier spécialisé (délivré par une province ou un territoire du Canada)", YES_NO, { required: true }),
    sel("crs_canadian_edu", "Études faites au Canada", opts(["none", "Aucune"], ["one_or_two_years", "Programme d’un ou deux ans"], ["three_years_or_more", "Programme de trois ans ou plus (ou diplôme avancé)"]), { required: true }),
    sel("crs_sibling", "Frère ou sœur citoyen(ne) ou résident(e) permanent(e) du Canada", YES_NO, { required: true }),
    sel("crs_pnp", "Nomination d’une province ou d’un territoire (PNP) déjà obtenue", YES_NO, { required: true }),
    sel("crs_spouse_education", "Niveau d’études de votre conjoint(e)", EDUCATION_OPTIONS, { required: true, showIf: when("crs_marital", "with_spouse") }),
    sel("crs_spouse_clb", "Niveau de langue de votre conjoint(e) (NCLC/CLB, première langue officielle)", CLB_OPTIONS, { required: true, showIf: when("crs_marital", "with_spouse") }),
    sel("crs_spouse_canadian_exp", "Expérience de travail de votre conjoint(e) au Canada", YEARS_OPTIONS, { required: true, showIf: when("crs_marital", "with_spouse") }),
  ];
}

const EDUCATION_VALUES = new Set<string>(EDUCATION_OPTIONS.map((option) => option.value));
const text = (values: Record<string, unknown>, key: string) => (typeof values[key] === "string" ? (values[key] as string).trim() : "");
const years = (value: string): ExperienceYears | null => (/^[0-5]$/.test(value) ? (Number(value) as ExperienceYears) : null);
const clb = (value: string): number | null => (/^(0|[4-9]|10)$/.test(value) ? Number(value) : null);

/** Profil CRS construit à partir des réponses brutes du formulaire ; null tant qu'une réponse obligatoire manque ou est invalide. */
export function crsProfileFromAnswers(values: Record<string, unknown>): CrsProfile | null {
  const age = /^\d{2}$/.test(text(values, "crs_age")) ? Number(text(values, "crs_age")) : null;
  const marital = text(values, "crs_marital");
  const education = text(values, "crs_education");
  const french = clb(text(values, "crs_french"));
  const english = clb(text(values, "crs_english"));
  const canadianExp = years(text(values, "crs_canadian_exp"));
  const foreignExp = years(text(values, "crs_foreign_exp"));
  const canadianEdu = text(values, "crs_canadian_edu");
  const yesNo = (key: string) => (text(values, key) === "oui" ? true : text(values, key) === "non" ? false : null);
  const trade = yesNo("crs_trade_cert");
  const sibling = yesNo("crs_sibling");
  const pnp = yesNo("crs_pnp");
  if (age === null || (marital !== "with_spouse" && marital !== "without_spouse") || !EDUCATION_VALUES.has(education)) return null;
  if (french === null || english === null || canadianExp === null || foreignExp === null) return null;
  if (!["none", "one_or_two_years", "three_years_or_more"].includes(canadianEdu) || trade === null || sibling === null || pnp === null) return null;
  let spouse: CrsProfile["spouse"] = null;
  if (marital === "with_spouse") {
    const spouseEducation = text(values, "crs_spouse_education");
    const spouseClb = clb(text(values, "crs_spouse_clb"));
    const spouseExp = years(text(values, "crs_spouse_canadian_exp"));
    if (!EDUCATION_VALUES.has(spouseEducation) || spouseClb === null || spouseExp === null) return null;
    spouse = { education: spouseEducation as EducationLevel, firstLanguageClb: spouseClb, canadianExperienceYears: spouseExp };
  }
  // Anciennes évaluations (avant le 3 novembre 2026) : ces deux réponses n'existaient pas ; elles valent « aucune » plutôt que de bloquer le calcul.
  const wage = (key: string): HighWageLevel => (WAGE_VALUES.has(text(values, key)) ? (text(values, key) as HighWageLevel) : "none");
  return {
    age,
    highWageExperience: wage("crs_highwage"),
    jobOffer: wage("crs_joboffer"),
    maritalStatus: marital,
    education: education as EducationLevel,
    frenchClb: french,
    englishClb: english,
    canadianExperienceYears: canadianExp,
    foreignExperienceYears: foreignExp,
    hasTradeCertificate: trade,
    canadianEducation: canadianEdu as CrsProfile["canadianEducation"],
    hasSiblingInCanada: sibling,
    hasProvincialNomination: pnp,
    spouse,
  };
}

export type CrsSummary = { total: number; max: 1270; breakdown: CrsBreakdown; sourceNote: string; verifiedAt: string; declaredFrench: number; declaredEnglish: number };

/** Score CRS estimé, recalculé à partir des réponses (null si le calculateur n'est pas rempli en entier). */
export function crsSummaryFromAnswers(values: Record<string, unknown> | null | undefined): CrsSummary | null {
  const profile = values ? crsProfileFromAnswers(values) : null;
  if (!profile) return null;
  const breakdown = computeCrsScore(profile);
  return { total: breakdown.total, max: CRS_TOTAL_MAX, breakdown, sourceNote: CRS_SOURCE.note, verifiedAt: CRS_SOURCE.verifiedAt, declaredFrench: profile.frenchClb, declaredEnglish: profile.englishClb };
}

/** Lignes de détail pour l'administration : valeurs recalculées, regroupées comme la grille officielle. */
export function crsBreakdownLines(summary: CrsSummary): Array<{ label: string; points: number }> {
  const b = summary.breakdown;
  return [
    { label: "Capital humain de base (âge, études, langues, intégration au marché du travail)", points: b.coreHumanCapital },
    { label: "Facteurs du conjoint", points: b.spouseFactors },
    { label: "Transférabilité des compétences", points: b.skillTransferability },
    { label: "Points additionnels (études au Canada, français, fratrie, nomination)", points: b.additionalPoints },
  ];
}
