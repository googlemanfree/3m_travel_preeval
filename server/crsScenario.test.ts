import { describe, expect, it } from "vitest";
import { CRS_TEST_BANDS, type CrsAbility } from "../shared/crsLanguageTests";
import { EMPTY_CRS_ANSWERS, type CrsOfficialAnswers } from "../shared/crsOfficialAnswers";
import { changedAnswerFields, compareScenarios } from "../client/src/lib/crsScenario";

/**
 * Mode « Comparer deux scénarios » : le scénario B part du profil A et n'en change que quelques réponses. Les totaux des scénarios A, B1 et B2
 * ci-dessous ont aussi été saisis dans l'outil officiel d'IRCC (voir docs/CRS_VALIDATION.md) : la différence affichée est celle que donne IRCC.
 */
const rank = (speaking: number, listening: number, reading: number, writing: number): Record<CrsAbility, string> => ({ speaking: String(speaking), listening: String(listening), reading: String(reading), writing: String(writing) });
const profileA: CrsOfficialAnswers = {
  ...EMPTY_CRS_ANSWERS, maritalStatus: "single", age: "29", education: "master_or_professional", canadianCredential: "no", languageTestRecent: "yes", firstTest: "tcf_canada", firstBands: rank(1, 1, 1, 1),
  secondTest: "none", canadianWorkYears: "0", foreignWorkYears: "0", certificate: "no", jobOffer: "no", nomination: "no", sibling: "no",
};
const withSpeaking = (index: number): CrsOfficialAnswers => ({ ...profileA, firstBands: { ...profileA.firstBands, speaking: String(index) } });

describe("comparer deux scénarios", () => {
  it("ne changer que l'expression orale du TCF Canada : nouveau total, écart et rubriques modifiées", () => {
    expect(CRS_TEST_BANDS.tcf_canada.speaking[1].label).toBe("14-15");
    expect(CRS_TEST_BANDS.tcf_canada.speaking[0].label).toBe("16-20");
    const comparison = compareScenarios(profileA, withSpeaking(0));
    expect(comparison.ok).toBe(true);
    if (comparison.ok !== true) return;
    // totaux de l'outil officiel : A = 444, B1 (oral NCLC 10) = 447
    expect(comparison.totalA).toBe(444);
    expect(comparison.totalB).toBe(447);
    expect(comparison.delta).toBe(3);
    expect(comparison.changedFields).toEqual(["firstBands.speaking"]);
    // seule la rubrique « première langue officielle » (et le sous-total qui la contient) bouge : la transférabilité était déjà au plafond de 50
    expect(comparison.changedLines.map((line) => line.label)).toEqual(expect.arrayContaining(["Langues officielles", "Première langue officielle"]));
    expect(comparison.changedLines.every((line) => line.delta !== 0)).toBe(true);
    const core = comparison.sections[0];
    expect(core.delta).toBe(comparison.delta);
  });

  it("une baisse donne un écart négatif et ne touche pas les rubriques non concernées", () => {
    const comparison = compareScenarios(profileA, withSpeaking(3));
    if (comparison.ok !== true) throw new Error("scénario incomplet");
    // outil officiel : B2 (oral NCLC 7) = 405, soit −39 : la langue, la transférabilité (études + langue) et le bonus français baissent ensemble
    expect(comparison.totalB).toBe(405);
    expect(comparison.delta).toBe(-39);
    expect(comparison.sections[1].delta).toBe(0); // conjoint
  });

  it("deux scénarios identiques : écart nul, aucune réponse modifiée, aucune rubrique modifiée", () => {
    const comparison = compareScenarios(profileA, { ...profileA, firstBands: { ...profileA.firstBands } });
    if (comparison.ok !== true) throw new Error("scénario incomplet");
    expect(comparison).toMatchObject({ delta: 0, identical: true, changedFields: [], changedLines: [] });
  });

  it("une réponse qui ne change pas les points (même tranche, plafond atteint) donne un écart de 0 sans rubrique modifiée", () => {
    // NCLC 10 → NCLC 10 sur un autre test serait identique ; ici on change l'âge de 29 à 28 (même palier de 110 points)
    const comparison = compareScenarios(profileA, { ...profileA, age: "28" });
    if (comparison.ok !== true) throw new Error("scénario incomplet");
    expect(comparison.changedFields).toEqual(["age"]);
    expect(comparison.delta).toBe(0);
    expect(comparison.changedLines).toEqual([]);
  });

  it("un scénario B incomplet n'est jamais calculé avec des zéros : on liste les réponses manquantes", () => {
    const comparison = compareScenarios(profileA, { ...profileA, firstBands: { ...profileA.firstBands, speaking: "" } });
    expect(comparison.ok).toBe(false);
    if (comparison.ok !== false) return;
    expect(comparison.reason).toBe("b_incomplete");
    expect(comparison.missing.join(" ")).toContain("quatre compétences");
  });

  it("un profil A incomplet est signalé comme tel", () => {
    const comparison = compareScenarios({ ...profileA, education: "" }, profileA);
    expect(comparison.ok).toBe(false);
    if (comparison.ok !== false) return;
    expect(comparison.reason).toBe("a_incomplete");
  });

  it("changedAnswerFields décrit les réponses par compétence", () => {
    expect(changedAnswerFields(profileA, { ...profileA, firstTest: "ielts", firstBands: rank(1, 1, 2, 1) })).toEqual(["firstTest", "firstBands.reading"]);
  });
});
