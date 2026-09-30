export type LanguageTestType = "ielts_general" | "celpip_general" | "pte_core" | "tef_canada" | "tcf_canada";
export type LanguageAbility = "reading" | "writing" | "listening" | "speaking";
export type LanguageScores = Record<LanguageAbility, string>;

type Range = { min: number; max?: number; level: number };

export const LANGUAGE_TEST_OPTIONS: Array<{ value: LanguageTestType; label: string; language: "english" | "french" }> = [
  { value: "ielts_general", label: "IELTS General Training", language: "english" },
  { value: "celpip_general", label: "CELPIP-General", language: "english" },
  { value: "pte_core", label: "PTE Core", language: "english" },
  { value: "tef_canada", label: "TEF Canada — Équivalence ancien score", language: "french" },
  { value: "tcf_canada", label: "TCF Canada", language: "french" },
];

export const LANGUAGE_TEST_SOURCE = "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html";

const ranges = (rows: Array<[number, number | undefined, number]>): Range[] => rows.map(([min, max, level]) => ({ min, max, level }));

const IELTS: Record<LanguageAbility, Range[]> = {
  speaking: ranges([[7.5, 9, 10], [7, 7, 9], [6.5, 6.5, 8], [6, 6, 7], [5.5, 5.5, 6], [5, 5, 5], [4, 4.5, 4]]),
  listening: ranges([[8.5, 9, 10], [8, 8, 9], [7.5, 7.5, 8], [6, 6.5, 7], [5.5, 5.5, 6], [5, 5, 5], [4.5, 4.5, 4]]),
  reading: ranges([[8, 9, 10], [7, 7.5, 9], [6.5, 6.5, 8], [6, 6, 7], [5, 5.5, 6], [4, 4.5, 5], [3.5, 3.5, 4]]),
  writing: ranges([[7.5, 9, 10], [7, 7, 9], [6.5, 6.5, 8], [6, 6, 7], [5.5, 5.5, 6], [5, 5, 5], [4, 4.5, 4]]),
};

const CELPIP: Record<LanguageAbility, Range[]> = Object.fromEntries((['reading', 'writing', 'listening', 'speaking'] as LanguageAbility[]).map((ability) => [ability, ranges([[10, undefined, 10], [9, 9, 9], [8, 8, 8], [7, 7, 7], [6, 6, 6], [5, 5, 5], [4, 4, 4]])])) as Record<LanguageAbility, Range[]>;

const PTE: Record<LanguageAbility, Range[]> = {
  speaking: ranges([[89, undefined, 10], [84, 88, 9], [76, 83, 8], [68, 75, 7], [59, 67, 6], [51, 58, 5], [42, 50, 4]]),
  listening: ranges([[89, undefined, 10], [82, 88, 9], [71, 81, 8], [60, 70, 7], [50, 59, 6], [39, 49, 5], [28, 38, 4]]),
  reading: ranges([[88, undefined, 10], [78, 87, 9], [69, 77, 8], [60, 68, 7], [51, 59, 6], [42, 50, 5], [33, 41, 4]]),
  writing: ranges([[90, undefined, 10], [88, 89, 9], [79, 87, 8], [69, 78, 7], [60, 68, 6], [51, 59, 5], [41, 50, 4]]),
};

const TEF: Record<LanguageAbility, Range[]> = {
  speaking: ranges([[393, undefined, 10], [371, 392, 9], [349, 370, 8], [310, 348, 7], [271, 309, 6], [226, 270, 5], [181, 225, 4]]),
  listening: ranges([[316, undefined, 10], [298, 315, 9], [280, 297, 8], [249, 279, 7], [217, 248, 6], [181, 216, 5], [145, 180, 4]]),
  reading: ranges([[263, undefined, 10], [248, 262, 9], [233, 247, 8], [207, 232, 7], [181, 206, 6], [151, 180, 5], [121, 150, 4]]),
  writing: ranges([[393, undefined, 10], [371, 392, 9], [349, 370, 8], [310, 348, 7], [271, 309, 6], [226, 270, 5], [181, 225, 4]]),
};

const TCF: Record<LanguageAbility, Range[]> = {
  speaking: ranges([[16, undefined, 10], [14, 15, 9], [12, 13, 8], [10, 11, 7], [7, 9, 6], [6, 6, 5], [4, 5, 4]]),
  listening: ranges([[549, undefined, 10], [523, 548, 9], [503, 522, 8], [458, 502, 7], [398, 457, 6], [369, 397, 5], [331, 368, 4]]),
  reading: ranges([[549, undefined, 10], [524, 548, 9], [499, 523, 8], [453, 498, 7], [406, 452, 6], [375, 405, 5], [342, 374, 4]]),
  writing: ranges([[16, undefined, 10], [14, 15, 9], [12, 13, 8], [10, 11, 7], [7, 9, 6], [6, 6, 5], [4, 5, 4]]),
};

const TABLES: Record<LanguageTestType, Record<LanguageAbility, Range[]>> = { ielts_general: IELTS, celpip_general: CELPIP, pte_core: PTE, tef_canada: TEF, tcf_canada: TCF };

export function getLanguageLevel(test: LanguageTestType, ability: LanguageAbility, raw: string | number): number {
  const value = typeof raw === "number" ? raw : Number(String(raw).replace(",", ".").trim());
  if (!Number.isFinite(value)) return 0;
  return TABLES[test][ability].find((range) => value >= range.min && (range.max === undefined || value <= range.max))?.level ?? 0;
}

export function convertLanguageScores(test: LanguageTestType, scores: LanguageScores): Record<LanguageAbility, number> {
  return { reading: getLanguageLevel(test, "reading", scores.reading), writing: getLanguageLevel(test, "writing", scores.writing), listening: getLanguageLevel(test, "listening", scores.listening), speaking: getLanguageLevel(test, "speaking", scores.speaking) };
}

export function isSupportedTestForLanguage(test: LanguageTestType, language: "english" | "french"): boolean {
  return LANGUAGE_TEST_OPTIONS.find((option) => option.value === test)?.language === language;
}
