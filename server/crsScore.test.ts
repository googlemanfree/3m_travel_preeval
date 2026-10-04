import { describe, expect, it } from "vitest";
import {
  agePoints, canadianExperiencePoints, computeCrsScore, educationPoints, firstLanguagePoints, firstLanguagePointsByAbility,
  frenchBonusPoints, secondLanguagePoints, skillTransferabilityPoints, spouseFactorPoints,
  type CrsProfile, type EducationLevel, type LanguageAbilities,
} from "../shared/crsScore";

// Chiffres recoupés le 2026-09-27 sur deux pages officielles distinctes de canada.ca (voir shared/crsScore.ts) :
// - .../criteria-comprehensive-ranking-system/grid.htm
// - .../express-entry/check-score/crs-criteria.html
// Les deux donnent des valeurs identiques pour chaque table testée ici.

describe("âge (table officielle complète, avec et sans conjoint)", () => {
  it("chaque âge de la grille officielle, un par un", () => {
    const rows: Array<[number, number, number]> = [
      [17, 0, 0], [18, 90, 99], [19, 95, 105], [20, 100, 110], [25, 100, 110], [29, 100, 110],
      [30, 95, 105], [31, 90, 99], [32, 85, 94], [33, 80, 88], [34, 75, 83], [35, 70, 77],
      [36, 65, 72], [37, 60, 66], [38, 55, 61], [39, 50, 55], [40, 45, 50], [41, 35, 39],
      [42, 25, 28], [43, 15, 17], [44, 5, 6], [45, 0, 0],
    ];
    for (const [age, withSpouse, withoutSpouse] of rows) {
      expect(agePoints(age, true), `âge ${age} avec conjoint`).toBe(withSpouse);
      expect(agePoints(age, false), `âge ${age} sans conjoint`).toBe(withoutSpouse);
    }
  });

  it("au-delà de 45 ans et en dessous de 18 ans : toujours 0, jamais un nombre négatif ou inventé", () => {
    expect(agePoints(46, true)).toBe(0);
    expect(agePoints(80, false)).toBe(0);
    expect(agePoints(16, true)).toBe(0);
    expect(agePoints(0, false)).toBe(0);
    expect(agePoints(Number.NaN, true)).toBe(0);
  });

  it("un âge non entier est ramené à l'année pleine (44,9 ans = toujours 44 ans)", () => {
    expect(agePoints(44.9, true)).toBe(agePoints(44, true));
  });
});

describe("études (8 niveaux exacts de la grille officielle)", () => {
  it("chaque niveau, avec et sans conjoint", () => {
    const rows: Array<[EducationLevel, number, number]> = [
      ["less_than_secondary", 0, 0], ["secondary", 28, 30], ["one_year_postsecondary", 84, 90],
      ["two_year_postsecondary", 91, 98], ["bachelor_or_three_year", 112, 120],
      ["two_or_more_credentials", 119, 128], ["master_or_professional", 126, 135], ["doctoral", 140, 150],
    ];
    for (const [level, withSpouse, withoutSpouse] of rows) {
      expect(educationPoints(level, true), level).toBe(withSpouse);
      expect(educationPoints(level, false), level).toBe(withoutSpouse);
    }
  });
});

describe("première langue officielle (CLB uniforme × 4 compétences, plafonné)", () => {
  it("chaque palier CLB, avec et sans conjoint", () => {
    const rows: Array<[number, number, number]> = [
      [3, 0, 0], [4, 24, 24], [5, 24, 24], [6, 32, 36], [7, 64, 68], [8, 88, 92], [9, 116, 124], [10, 128, 136],
    ];
    for (const [clb, withSpouse, withoutSpouse] of rows) {
      expect(firstLanguagePoints(clb, true), `CLB ${clb} avec conjoint`).toBe(withSpouse);
      expect(firstLanguagePoints(clb, false), `CLB ${clb} sans conjoint`).toBe(withoutSpouse);
    }
  });

  it("le plafond de section (128 avec conjoint / 136 sans) est un filet de sécurité qui vaut exactement le maximum de la grille officielle, jamais un chiffre choisi au hasard", () => {
    expect(firstLanguagePoints(10, true)).toBe(128);
    expect(firstLanguagePoints(10, false)).toBe(136);
  });
});

describe("seconde langue officielle", () => {
  it("chaque palier, plafonné à 22 (avec conjoint) / 24 (sans)", () => {
    expect(secondLanguagePoints(4, false)).toBe(0);
    expect(secondLanguagePoints(5, false)).toBe(4);
    expect(secondLanguagePoints(6, false)).toBe(4);
    expect(secondLanguagePoints(7, false)).toBe(12);
    expect(secondLanguagePoints(8, false)).toBe(12);
    expect(secondLanguagePoints(9, true)).toBe(22); // 6×4=24, plafonné à 22 avec conjoint
    expect(secondLanguagePoints(9, false)).toBe(24);
  });
});

describe("compétences linguistiques distinctes selon la calculatrice IRCC", () => {
  it("additionne les points par habileté au lieu d'appliquer un niveau uniforme", () => {
    const abilities: LanguageAbilities = { reading: 10, writing: 9, listening: 8, speaking: 7 };
    expect(firstLanguagePointsByAbility(abilities, false)).toBe(34 + 31 + 23 + 17);
    expect(firstLanguagePointsByAbility(abilities, true)).toBe(32 + 29 + 22 + 16);
  });

  it("plafonne la deuxième langue à 24 sans conjoint et 22 avec conjoint", () => {
    const abilities: LanguageAbilities = { reading: 10, writing: 10, listening: 10, speaking: 10 };
    const profile = {
      age: 30, maritalStatus: "without_spouse" as const, education: "bachelor_or_three_year" as const,
      frenchClb: 0, englishClb: 10, firstLanguageAbilities: abilities,
      secondLanguageAbilities: abilities, firstOfficialLanguage: "english" as const,
      canadianExperienceYears: 0 as const, foreignExperienceYears: 0 as const,
      hasTradeCertificate: false, canadianEducation: "none" as const, hasSiblingInCanada: false,
      hasProvincialNomination: false, spouse: null,
    } satisfies CrsProfile;
    expect(computeCrsScore(profile).secondLanguage).toBe(24);
  });
});

describe("expérience professionnelle au Canada", () => {
  it("chaque durée, avec et sans conjoint", () => {
    const rows: Array<[0 | 1 | 2 | 3 | 4 | 5, number, number]> = [[0, 0, 0], [1, 35, 40], [2, 46, 53], [3, 56, 64], [4, 63, 72], [5, 70, 80]];
    for (const [years, withSpouse, withoutSpouse] of rows) {
      expect(canadianExperiencePoints(years, true), `${years} an(s) avec conjoint`).toBe(withSpouse);
      expect(canadianExperiencePoints(years, false), `${years} an(s) sans conjoint`).toBe(withoutSpouse);
    }
  });
});

describe("facteurs du conjoint (plafond 40)", () => {
  it("études, langue (×4 compétences) et expérience, chacun à son plafond propre", () => {
    expect(spouseFactorPoints(null)).toEqual({ education: 0, language: 0, experience: 0, total: 0 });
    expect(spouseFactorPoints({ education: "doctoral", firstLanguageClb: 9, canadianExperienceYears: 5 })).toEqual({ education: 10, language: 20, experience: 10, total: 40 });
    expect(spouseFactorPoints({ education: "secondary", firstLanguageClb: 6, canadianExperienceYears: 2 })).toEqual({ education: 2, language: 4, experience: 7, total: 13 });
    expect(spouseFactorPoints({ education: "less_than_secondary", firstLanguageClb: 0, canadianExperienceYears: 0 })).toEqual({ education: 0, language: 0, experience: 0, total: 0 });
  });
});

describe("transférabilité des compétences (plafond 100 au total, 50 par sous-facteur)", () => {
  const base = { education: "bachelor_or_three_year" as EducationLevel, frenchClb: 0, englishClb: 0, canadianExperienceYears: 0 as const, foreignExperienceYears: 0 as const, hasTradeCertificate: false };

  it("études + langue : rien sous CLB 7, la moitié à CLB 7-8, le maximum à CLB 9+", () => {
    expect(skillTransferabilityPoints({ ...base, englishClb: 6 }).educationLanguage).toBe(0);
    expect(skillTransferabilityPoints({ ...base, englishClb: 7 }).educationLanguage).toBe(25);
    expect(skillTransferabilityPoints({ ...base, englishClb: 9 }).educationLanguage).toBe(50);
    expect(skillTransferabilityPoints({ ...base, education: "secondary", englishClb: 9 }).educationLanguage).toBe(0);
    expect(skillTransferabilityPoints({ ...base, education: "one_year_postsecondary", englishClb: 7 }).educationLanguage).toBe(13);
    expect(skillTransferabilityPoints({ ...base, education: "one_year_postsecondary", englishClb: 9 }).educationLanguage).toBe(25);
  });

  it("études + expérience canadienne : rien sans expérience, la moitié à 1 an, le maximum à 2 ans et plus", () => {
    expect(skillTransferabilityPoints({ ...base, canadianExperienceYears: 0 }).educationExperience).toBe(0);
    expect(skillTransferabilityPoints({ ...base, canadianExperienceYears: 1 }).educationExperience).toBe(25);
    expect(skillTransferabilityPoints({ ...base, canadianExperienceYears: 2 }).educationExperience).toBe(50);
    expect(skillTransferabilityPoints({ ...base, canadianExperienceYears: 5 }).educationExperience).toBe(50);
  });

  it("expérience étrangère + langue, et expérience étrangère + expérience canadienne : mêmes paliers (1-2 ans / 3 ans et plus)", () => {
    expect(skillTransferabilityPoints({ ...base, foreignExperienceYears: 1, englishClb: 7 }).foreignExperienceLanguage).toBe(13);
    expect(skillTransferabilityPoints({ ...base, foreignExperienceYears: 3, englishClb: 7 }).foreignExperienceLanguage).toBe(25);
    expect(skillTransferabilityPoints({ ...base, foreignExperienceYears: 3, englishClb: 9 }).foreignExperienceLanguage).toBe(50);
    expect(skillTransferabilityPoints({ ...base, foreignExperienceYears: 1, canadianExperienceYears: 1 }).foreignExperienceCanadianExperience).toBe(13);
    expect(skillTransferabilityPoints({ ...base, foreignExperienceYears: 3, canadianExperienceYears: 2 }).foreignExperienceCanadianExperience).toBe(50);
  });

  it("certificat de qualification + langue : rien sans certificat, rien sous CLB 5, la moitié à CLB 5-6, le maximum à CLB 7+", () => {
    expect(skillTransferabilityPoints({ ...base, hasTradeCertificate: true, englishClb: 4 }).certificate).toBe(0);
    expect(skillTransferabilityPoints({ ...base, hasTradeCertificate: false, englishClb: 9 }).certificate).toBe(0);
    expect(skillTransferabilityPoints({ ...base, hasTradeCertificate: true, englishClb: 5 }).certificate).toBe(25);
    expect(skillTransferabilityPoints({ ...base, hasTradeCertificate: true, englishClb: 7 }).certificate).toBe(50);
  });

  it("le total ne dépasse jamais 100, même si un profil cumule tous les sous-facteurs au maximum", () => {
    const maxed = skillTransferabilityPoints({ education: "doctoral", frenchClb: 10, englishClb: 10, canadianExperienceYears: 5, foreignExperienceYears: 5, hasTradeCertificate: true });
    expect(maxed.total).toBe(100);
    expect(maxed.educationLanguage + maxed.educationExperience + maxed.foreignExperienceLanguage + maxed.foreignExperienceCanadianExperience + maxed.certificate).toBeGreaterThan(100);
  });

  it("prend le meilleur des deux langues (français ou anglais), jamais une moyenne inventée", () => {
    expect(skillTransferabilityPoints({ ...base, frenchClb: 9, englishClb: 2 }).educationLanguage).toBe(50);
    expect(skillTransferabilityPoints({ ...base, frenchClb: 2, englishClb: 9 }).educationLanguage).toBe(50);
  });
});

describe("bonus francophone", () => {
  it("rien sous NCLC 7 ; 25 points si anglais CLB 4 ou moins ; 50 points si anglais CLB 5+", () => {
    expect(frenchBonusPoints(6, 0)).toBe(0);
    expect(frenchBonusPoints(7, 4)).toBe(25);
    expect(frenchBonusPoints(7, 0)).toBe(25);
    expect(frenchBonusPoints(9, 5)).toBe(50);
    expect(frenchBonusPoints(10, 10)).toBe(50);
  });
});

describe("score total (computeCrsScore) : cohérence de bout en bout", () => {
  const profile = (overrides: Partial<CrsProfile> = {}): CrsProfile => ({
    age: 30, maritalStatus: "without_spouse", education: "bachelor_or_three_year", frenchClb: 0, englishClb: 9,
    canadianExperienceYears: 0, foreignExperienceYears: 0, hasTradeCertificate: false, canadianEducation: "none",
    hasSiblingInCanada: false, hasProvincialNomination: false, spouse: null, ...overrides,
  });

  it("le plafond du capital humain de base est bien 500 sans conjoint et 460 avec conjoint (vérifié : somme des maximums officiels de chaque sous-facteur)", () => {
    const withoutSpouseMax = computeCrsScore(profile({ age: 25, education: "doctoral", frenchClb: 10, englishClb: 10, canadianExperienceYears: 5 }));
    expect(withoutSpouseMax.coreHumanCapitalMax).toBe(500);
    expect(withoutSpouseMax.coreHumanCapital).toBe(500);
    const withSpouseMax = computeCrsScore(profile({ age: 25, education: "doctoral", frenchClb: 10, englishClb: 10, canadianExperienceYears: 5, maritalStatus: "with_spouse", spouse: { education: "doctoral", firstLanguageClb: 10, canadianExperienceYears: 5 } }));
    expect(withSpouseMax.coreHumanCapitalMax).toBe(460);
    expect(withSpouseMax.coreHumanCapital).toBe(460);
  });

  it("un profil déclaré « avec conjoint » sans données de conjoint saisies retombe sur le barème sans conjoint (jamais de 0 injustifié)", () => {
    const result = computeCrsScore(profile({ maritalStatus: "with_spouse", spouse: null, age: 30 }));
    expect(result.coreHumanCapitalMax).toBe(500);
    expect(result.spouseFactors).toBe(0);
  });

  it("la nomination provinciale ajoute exactement 600 points, jamais un bonus arrondi ou approximatif", () => {
    const without = computeCrsScore(profile());
    const withNomination = computeCrsScore(profile({ hasProvincialNomination: true }));
    expect(withNomination.total - without.total).toBe(600);
    expect(withNomination.provincialNomination).toBe(600);
  });

  it("le score total ne dépasse jamais 1200, même pour un profil maximal sur tous les facteurs", () => {
    const maxed = computeCrsScore({
      age: 25, maritalStatus: "with_spouse", education: "doctoral", frenchClb: 10, englishClb: 10,
      canadianExperienceYears: 5, foreignExperienceYears: 5, hasTradeCertificate: true, canadianEducation: "three_years_or_more",
      hasSiblingInCanada: true, hasProvincialNomination: true, spouse: { education: "doctoral", firstLanguageClb: 10, canadianExperienceYears: 5 },
    });
    expect(maxed.total).toBe(1200);
  });

  it("un profil faible (âge élevé, aucune langue testée, aucune expérience) obtient un score bas, sans plancher artificiel", () => {
    const weak = computeCrsScore(profile({ age: 50, education: "less_than_secondary", englishClb: 0 }));
    expect(weak.total).toBe(0);
  });

  it("aucun point d'emploi réservé (« arranged employment ») : IRCC les a retirés le 25 mars 2025, ce calcul ne doit jamais en inventer", () => {
    const result = computeCrsScore(profile({ hasProvincialNomination: false }));
    expect(Object.keys(result)).not.toContain("arrangedEmployment");
    expect(Object.keys(result)).not.toContain("jobOffer");
  });

  it("le détail retourné se recompose exactement en le total (aucun point ne se perd ni n'apparaît de nulle part)", () => {
    const result = computeCrsScore(profile({ hasProvincialNomination: true, hasSiblingInCanada: true, canadianEducation: "one_or_two_years", frenchClb: 8 }));
    expect(result.coreHumanCapital + result.spouseFactors + result.skillTransferability + result.additionalPoints).toBe(result.total);
    expect(result.canadianEducationBonus + result.frenchBonus + result.siblingBonus + result.provincialNomination).toBe(result.additionalPoints);
  });
});
