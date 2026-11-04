import { describe, expect, it } from "vitest";
import { CRS_ABILITIES, CRS_TEST_BANDS, clbForScore, secondLanguageTests, type CrsAbility, type CrsLanguageTest } from "../shared/crsLanguageTests";
import { EMPTY_CRS_ANSWERS, buildCrsProfileFromOfficialAnswers, countsAsWithSpouse, type CrsOfficialAnswers } from "../shared/crsOfficialAnswers";
import { CRS_TOTAL_MAX, computeCrsScore, labourMarketIntegration } from "../shared/crsScore";

/**
 * Cas de référence : chaque profil a été saisi dans l'outil officiel d'IRCC « Vérifiez votre note » (canada.ca, grille du 3 novembre 2026)
 * et les totaux ci-dessous sont ceux qu'il a affichés le 2026-11-04. La calculatrice du site doit donner exactement les mêmes nombres.
 */
const band = (test: CrsLanguageTest, ability: CrsAbility, label: string): string => {
  const index = CRS_TEST_BANDS[test][ability].findIndex((entry) => entry.label === label);
  if (index < 0) throw new Error(`Tranche inconnue ${test}/${ability}/${label}`);
  return String(index);
};
const bandsOf = (test: CrsLanguageTest, labels: [string, string, string, string]): Record<CrsAbility, string> => ({
  speaking: band(test, "speaking", labels[0]), listening: band(test, "listening", labels[1]), reading: band(test, "reading", labels[2]), writing: band(test, "writing", labels[3]),
});

const base = (patch: Partial<CrsOfficialAnswers>): CrsOfficialAnswers => ({
  ...EMPTY_CRS_ANSWERS, maritalStatus: "single", canadianCredential: "no", languageTestRecent: "yes", canadianWorkYears: "0", highWageExperience: "no", foreignWorkYears: "0",
  certificate: "no", jobOffer: "no", nomination: "no", sibling: "no", ...patch,
});
const celpip = (level: string) => ({ firstTest: "celpip", firstBands: bandsOf("celpip", [level, level, level, level]) });

function score(answers: CrsOfficialAnswers) {
  const result = buildCrsProfileFromOfficialAnswers(answers);
  if (!result.complete) throw new Error(`Réponses incomplètes : ${result.missing.join(" | ")}`);
  return computeCrsScore(result.profile);
}

describe("calculatrice CRS = outil officiel d'IRCC (grille du 3 novembre 2026)", () => {
  it("profil 1 : célibataire 29 ans, maîtrise, IELTS CLB 9/9/9/9, 3 ans d'expérience étrangère = 469", () => {
    const b = score(base({ age: "29", education: "master_or_professional", firstTest: "ielts", firstBands: bandsOf("ielts", ["7.0", "8.0", "7.0 - 7.5", "7.0"]), foreignWorkYears: "3" }));
    expect(b).toMatchObject({ age: 110, education: 135, firstLanguage: 124, secondLanguage: 0, labourMarketIntegration: 0, coreHumanCapital: 369, spouseFactors: 0, skillTransferability: 100, additionalPoints: 0, total: 469 });
    expect(b.transferabilityEducation).toBe(50);
    expect(b.transferabilityForeignExperience).toBe(50);
  });

  it("profil 2 : une licence seule avec CLB 9 ne vaut que 25 en transférabilité (et non 50) = 346", () => {
    const b = score(base({ age: "35", education: "bachelor_or_three_year", ...celpip("9") }));
    expect(b).toMatchObject({ age: 77, education: 120, firstLanguage: 124, coreHumanCapital: 321, skillTransferability: 25, total: 346 });
  });

  it("profil 3 : licence + 2 ans d'expérience canadienne (sans salaire élevé) = 424", () => {
    const b = score(base({ age: "35", education: "bachelor_or_three_year", canadianWorkYears: "2", ...celpip("9") }));
    expect(b).toMatchObject({ labourMarketIntegration: 53, coreHumanCapital: 374, skillTransferability: 50, total: 424 });
    expect(b.transferabilityEducationLanguage).toBe(25);
    expect(b.transferabilityEducationExperience).toBe(25);
  });

  const secondary29 = { age: "29", education: "secondary", ...celpip("7") };

  it("profil 4 : 5 ans au Canada + salaire élevé (2 ×) l'emporte sur une offre à 70 points : facteur 150 = 358", () => {
    const b = score(base({ ...secondary29, canadianWorkYears: "5", highWageExperience: "yes", highWage2x: "yes", jobOffer: "yes", jobOfferLevel: "1.5" }));
    expect(b).toMatchObject({ labourMarketIntegration: 150, labourMarketSource: "work", coreHumanCapital: 358, total: 358 });
  });

  it("profil 5 : offre d'emploi à salaire élevé (2 ×) seule : facteur 100 = 308", () => {
    const b = score(base({ ...secondary29, jobOffer: "yes", jobOfferLevel: "2" }));
    expect(b).toMatchObject({ labourMarketIntegration: 100, labourMarketSource: "job_offer", total: 308 });
  });

  it("profil 6 : 1 an au Canada (40) contre une offre à 1,5 × (70) : IRCC retient 70, jamais la somme = 278", () => {
    const b = score(base({ ...secondary29, canadianWorkYears: "1", jobOffer: "yes", jobOfferLevel: "1.5" }));
    expect(b).toMatchObject({ labourMarketIntegration: 70, labourMarketSource: "job_offer", total: 278 });
  });

  it("profils 7 et 8 : points de salaire élevé 1,5 × (+40) et 1,3 × (+20) après 3 ans au Canada = 312 et 292", () => {
    expect(score(base({ ...secondary29, canadianWorkYears: "3", highWageExperience: "yes", highWage2x: "no", highWage15x: "yes" }))).toMatchObject({ labourMarketIntegration: 104, total: 312 });
    expect(score(base({ ...secondary29, canadianWorkYears: "3", highWageExperience: "yes", highWage2x: "no", highWage15x: "no" }))).toMatchObject({ labourMarketIntegration: 84, total: 292 });
  });

  it("profil 9 : couple, deux langues, études au Canada, certificat, fratrie, bonus français = 626, ligne par ligne", () => {
    const answers = base({
      maritalStatus: "married", spouseCitizenOrPr: "no", spouseAccompanies: "yes", age: "33", education: "master_or_professional",
      canadianCredential: "yes", canadianCredentialLevel: "three_year_or_more",
      firstTest: "ielts", firstBands: bandsOf("ielts", ["6.5", "6.0 - 7.0", "6.5", "6.5"]),
      secondTest: "tef_canada", secondBands: bandsOf("tef_canada", ["310-348", "249-279", "207-232", "310-348"]),
      canadianWorkYears: "3", highWageExperience: "yes", highWage2x: "no", highWage15x: "yes", foreignWorkYears: "2", certificate: "yes", sibling: "yes",
      spouseEducation: "master_or_professional", spouseCanadianWorkYears: "1", spouseTest: "ielts", spouseBands: bandsOf("ielts", ["7.0", "8.0", "7.0 - 7.5", "7.0"]),
    });
    expect(countsAsWithSpouse(answers)).toBe(true);
    const b = score(answers);
    expect(b).toMatchObject({
      age: 80, education: 126, firstLanguage: 82, secondLanguage: 12, labourMarketIntegration: 96, coreHumanCapital: 396,
      spouseEducation: 10, spouseLanguage: 20, spouseExperience: 5, spouseFactors: 35,
      transferabilityEducation: 50, transferabilityForeignExperience: 38, transferabilityCertificate: 50, skillTransferability: 100,
      canadianEducationBonus: 30, siblingBonus: 15, frenchBonus: 50, provincialNomination: 0, additionalPoints: 95, total: 626,
    });
  });
});

describe("plafond des points supplémentaires (outil officiel)", () => {
  it("profil 10 : désignation 600 + études au Canada 30 + fratrie 15 + français 25 = 670, plafonné à 600 ; total 1 161", () => {
    const answers = base({
      age: "29", education: "master_or_professional", canadianCredential: "yes", canadianCredentialLevel: "three_year_or_more",
      firstTest: "tef_canada", firstBands: bandsOf("tef_canada", ["393-450", "316-360", "263-300", "393-450"]), secondTest: "none",
      canadianWorkYears: "5", foreignWorkYears: "3", certificate: "yes", nomination: "yes", sibling: "yes",
    });
    const b = score(answers);
    expect(b).toMatchObject({
      age: 110, education: 135, firstLanguage: 136, labourMarketIntegration: 80, coreHumanCapital: 461,
      transferabilityEducation: 50, transferabilityForeignExperience: 50, transferabilityCertificate: 50, skillTransferability: 100,
      provincialNomination: 600, canadianEducationBonus: 30, siblingBonus: 15, frenchBonus: 25, additionalPoints: 600, total: 1161,
    });
  });
});

describe("règles de l'outil officiel", () => {
  it("un conjoint citoyen ou résident permanent, ou qui ne vous accompagne pas, donne le barème « sans conjoint »", () => {
    expect(countsAsWithSpouse(base({ maritalStatus: "married", spouseCitizenOrPr: "yes" }))).toBe(false);
    expect(countsAsWithSpouse(base({ maritalStatus: "common_law", spouseCitizenOrPr: "no", spouseAccompanies: "no" }))).toBe(false);
    expect(countsAsWithSpouse(base({ maritalStatus: "common_law", spouseCitizenOrPr: "no", spouseAccompanies: "yes" }))).toBe(true);
    expect(countsAsWithSpouse(base({ maritalStatus: "single" }))).toBe(false);
  });

  it("maxima officiels : 570 sans conjoint, 530 avec, 1 270 au total", () => {
    const best = score(base({
      age: "25", education: "doctoral", firstTest: "ielts", firstBands: bandsOf("ielts", ["7.5 - 9.0", "8.5 - 9.0", "8.0 - 9.0", "7.5 - 9.0"]),
      secondTest: "tef_canada", secondBands: bandsOf("tef_canada", ["393-450", "316-360", "263-300", "393-450"]),
      canadianWorkYears: "5", highWageExperience: "yes", highWage2x: "yes", foreignWorkYears: "3", certificate: "yes", canadianCredential: "yes", canadianCredentialLevel: "three_year_or_more", sibling: "yes", nomination: "yes",
    }));
    expect(best.coreHumanCapital).toBe(570);
    expect(best.skillTransferability).toBe(100);
    expect(best.total).toBe(CRS_TOTAL_MAX);
    expect(CRS_TOTAL_MAX).toBe(1270);
  });

  it("facteur d'intégration : durée + salaire élevé OU offre d'emploi, jamais les deux", () => {
    expect(labourMarketIntegration({ canadianExperienceYears: 5, highWageExperience: "2", jobOffer: "2" }, false)).toMatchObject({ total: 150, source: "work" });
    expect(labourMarketIntegration({ canadianExperienceYears: 5, highWageExperience: "2", jobOffer: "2" }, true).total).toBe(140);
    expect(labourMarketIntegration({ canadianExperienceYears: 0, highWageExperience: "none", jobOffer: "1.3" }, true)).toMatchObject({ total: 50, source: "job_offer" });
    expect(labourMarketIntegration({ canadianExperienceYears: 0, highWageExperience: "none", jobOffer: "none" }, false)).toMatchObject({ total: 0, source: "none" });
  });

  it("sans résultats de test de moins de deux ans, aucune note n'est annoncée", () => {
    const result = buildCrsProfileFromOfficialAnswers(base({ age: "29", education: "master_or_professional", languageTestRecent: "no" }));
    expect(result.complete).toBe(false);
    expect(result.languageNote).toContain("moins de deux ans");
  });

  it("liste les questions sans réponse dans l'ordre de l'outil", () => {
    const result = buildCrsProfileFromOfficialAnswers(EMPTY_CRS_ANSWERS);
    expect(result.complete).toBe(false);
    expect(result.missing[0]).toContain("1)");
    expect(result.missing.some((entry) => entry.startsWith("3)"))).toBe(true);
  });

  it("la seconde langue est celle de l'autre langue que le premier test", () => {
    expect(secondLanguageTests("ielts")).toEqual(["tef_canada", "tcf_canada"]);
    expect(secondLanguageTests("tcf_canada")).toEqual(["celpip", "ielts", "pte_core"]);
    expect(secondLanguageTests(null)).toEqual([]);
  });

  it("conversions de notes officielles (échantillon des cinq tests)", () => {
    expect(clbForScore("ielts", "listening", 6.5)).toBe(7);
    expect(clbForScore("ielts", "reading", 7.5)).toBe(9);
    expect(clbForScore("ielts", "speaking", 7.5)).toBe(10);
    expect(clbForScore("celpip", "writing", 12)).toBe(10);
    expect(clbForScore("pte_core", "writing", 89)).toBe(9);
    expect(clbForScore("pte_core", "listening", 60)).toBe(7);
    expect(clbForScore("tef_canada", "speaking", 349)).toBe(8);
    expect(clbForScore("tef_canada", "listening", 144)).toBe(0);
    expect(clbForScore("tcf_canada", "speaking", 10)).toBe(7);
    expect(clbForScore("tcf_canada", "reading", 549)).toBe(10);
    for (const { key } of CRS_ABILITIES) for (const test of Object.keys(CRS_TEST_BANDS) as CrsLanguageTest[]) expect(CRS_TEST_BANDS[test][key]).toHaveLength(8);
  });
});
