import { describe, expect, it } from "vitest";
import { EMPTY_FSW_ANSWERS, buildFswProfile, type FswAnswers } from "../shared/fswAnswers";
import { FSW_MAX, FSW_PASS_MARK, agePoints, computeFswScore, experiencePoints, firstLanguageAbilityPoints, secondLanguagePoints, type FswProfile } from "../shared/fswGrid";

/**
 * Grille de sélection du Programme des travailleurs qualifiés (fédéral), relue sur canada.ca le 2026-11-18 : six facteurs, 100 points, seuil 67.
 * Aucun outil officiel de calcul n'existe pour cette grille : les valeurs attendues ci-dessous sont celles des tableaux publiés par IRCC.
 */
const abilities = (clb: number) => ({ speaking: clb, listening: clb, reading: clb, writing: clb });
const base: FswProfile = {
  age: 30, education: "bachelor_or_three_year", firstLanguage: abilities(9), secondLanguage: null, skilledExperienceYears: 3, arrangedEmployment: false,
  hasSpouse: false, spouseLanguageClb4: false, ownCanadianStudy: false, spouseCanadianStudy: false, ownCanadianWork: false, spouseCanadianWork: false, relativeInCanada: false,
};

describe("grille des 67 points : tableaux officiels", () => {
  it("seuil 67 sur 100", () => { expect(FSW_PASS_MARK).toBe(67); expect(FSW_MAX).toBe(100); });

  it("première langue : 6 / 5 / 4 par compétence, rien sous CLB 7", () => {
    expect([10, 9, 8, 7, 6, 5, 0].map(firstLanguageAbilityPoints)).toEqual([6, 6, 5, 4, 0, 0, 0]);
  });
  it("seconde langue : 4 points seulement avec CLB 5 aux quatre compétences", () => {
    expect(secondLanguagePoints(abilities(5))).toBe(4);
    expect(secondLanguagePoints({ speaking: 5, listening: 5, reading: 5, writing: 4 })).toBe(0);
    expect(secondLanguagePoints(null)).toBe(0);
  });
  it("expérience : 1 an 9, 2-3 ans 11, 4-5 ans 13, 6 ans et plus 15", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 9].map(experiencePoints)).toEqual([0, 9, 11, 11, 13, 13, 15, 15]);
  });
  it("âge : 12 de 18 à 35 ans, puis −1 par an jusqu'à 1 point à 46 ans, 0 à 47 ans ou plus et sous 18 ans", () => {
    expect([17, 18, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 60].map(agePoints)).toEqual([0, 12, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0]);
  });
  it("études : 25 / 23 / 23 / 22 / 21 / 19 / 15 / 5 / 0", () => {
    const points = (education: FswProfile["education"]) => computeFswScore({ ...base, education }).education;
    expect(["doctoral", "master_or_professional", "two_or_more_credentials", "bachelor_or_three_year", "two_year_postsecondary", "one_year_postsecondary", "secondary", "less_than_secondary"].map((level) => points(level as FswProfile["education"]))).toEqual([25, 23, 22, 21, 19, 15, 5, 0]);
  });
});

describe("grille des 67 points : adaptabilité (plafond 10) et total", () => {
  it("chaque élément rapporte ses points, le total est plafonné à 10", () => {
    expect(computeFswScore({ ...base, relativeInCanada: true }).adaptability).toBe(5);
    expect(computeFswScore({ ...base, ownCanadianWork: true }).adaptability).toBe(10);
    expect(computeFswScore({ ...base, ownCanadianStudy: true, relativeInCanada: true }).adaptability).toBe(10);
    const capped = computeFswScore({ ...base, ownCanadianWork: true, ownCanadianStudy: true, relativeInCanada: true });
    expect(capped.adaptabilityBeforeCap).toBe(20);
    expect(capped.adaptability).toBe(10);
  });
  it("les éléments du conjoint ne comptent que si le conjoint vous accompagne", () => {
    const without = computeFswScore({ ...base, hasSpouse: false, spouseLanguageClb4: true, spouseCanadianStudy: true, spouseCanadianWork: true });
    expect(without.adaptability).toBe(0);
    const withSpouse = computeFswScore({ ...base, hasSpouse: true, spouseLanguageClb4: true });
    expect(withSpouse.adaptability).toBe(5);
  });
  it("l'emploi réservé rapporte 10 points + 5 en adaptabilité", () => {
    const result = computeFswScore({ ...base, arrangedEmployment: true });
    expect(result.arrangedEmployment).toBe(10);
    expect(result.adaptability).toBe(5);
    expect(result.total).toBe(computeFswScore(base).total + 15);
  });
  it("profil maximal = 100", () => {
    const max = computeFswScore({ ...base, age: 25, education: "doctoral", firstLanguage: abilities(10), secondLanguage: abilities(7), skilledExperienceYears: 8, arrangedEmployment: true, ownCanadianWork: true });
    expect(max).toMatchObject({ total: 100, language: 28, education: 25, experience: 15, age: 12, arrangedEmployment: 10, adaptability: 10, meetsPassMark: true });
  });
  it("exemple : 30 ans, licence, CLB 9, 3 ans = 24 + 21 + 11 + 12 = 68 (seuil atteint)", () => {
    expect(computeFswScore(base)).toMatchObject({ total: 68, meetsPassMark: true, missingPoints: 0, meetsMinimums: true });
  });
  it("exemple : 38 ans, 2 ans d'études, CLB 7, 1 an = 16 + 19 + 9 + 9 = 53 : il manque 14 points", () => {
    const result = computeFswScore({ ...base, age: 38, education: "two_year_postsecondary", firstLanguage: abilities(7), skilledExperienceYears: 1 });
    expect(result).toMatchObject({ total: 53, meetsPassMark: false, missingPoints: 14 });
  });
  it("sous CLB 7 ou sous 1 an d'expérience : les exigences minimales ne sont pas remplies, même avec 67 points", () => {
    const low = computeFswScore({ ...base, firstLanguage: { ...abilities(9), writing: 6 }, education: "doctoral", arrangedEmployment: true });
    expect(low.minimums.firstLanguageClb7).toBe(false);
    expect(low.meetsMinimums).toBe(false);
    const noExperience = computeFswScore({ ...base, skilledExperienceYears: 0 });
    expect(noExperience.minimums.oneYearExperience).toBe(false);
    expect(noExperience.meetsMinimums).toBe(false);
  });
});

describe("grille des 67 points : réponses saisies", () => {
  const bands = (index: string) => ({ speaking: index, listening: index, reading: index, writing: index });
  const complete: FswAnswers = { ...EMPTY_FSW_ANSWERS, age: "30", education: "bachelor_or_three_year", firstTest: "celpip", firstBands: bands("1"), secondTest: "none", experienceYears: "3", arrangedEmployment: "no", hasSpouse: "no", ownCanadianStudy: "no", ownCanadianWork: "no", relativeInCanada: "no" };

  it("réponses complètes : même total que le calcul direct", () => {
    const built = buildFswProfile(complete);
    expect(built.complete).toBe(true);
    if (built.complete !== true) return;
    expect(computeFswScore(built.profile).total).toBe(68);
  });
  it("aucune question vide n'est comptée comme « non » ou « zéro » : elles sont listées", () => {
    const built = buildFswProfile(EMPTY_FSW_ANSWERS);
    expect(built.complete).toBe(false);
    expect(built.missing.length).toBeGreaterThanOrEqual(9);
    expect(buildFswProfile({ ...complete, secondTest: "" }).missing.join(" ")).toContain("Sans objet");
    expect(buildFswProfile({ ...complete, relativeInCanada: "" }).missing.join(" ")).toContain("Parent au Canada");
  });
  it("les questions sur le conjoint ne sont exigées que si le conjoint vous accompagne", () => {
    expect(buildFswProfile({ ...complete, hasSpouse: "yes" }).missing.length).toBe(3);
    expect(buildFswProfile(complete).complete).toBe(true);
  });
  it("la conversion des notes de test suit le tableau officiel (TCF Canada NCLC 9 = 6 points par compétence)", () => {
    const built = buildFswProfile({ ...complete, firstTest: "tcf_canada", firstBands: bands("1") });
    if (built.complete !== true) throw new Error("incomplet");
    expect(computeFswScore(built.profile).firstLanguage).toBe(24);
  });
});
