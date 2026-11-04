/**
 * Tests de langue acceptés par Entrée express et leur conversion en niveaux CLB / NCLC, compétence par compétence.
 * Les tranches de notes sont reprises une à une de l'outil officiel d'IRCC « Vérifiez votre note » (relu le 2026-11-04) :
 * https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/verifier-note.html
 * Un niveau 0 signifie « inférieur au CLB 4 » (aucun point). Aucune tranche n'est estimée : seules celles de l'outil existent ici.
 */
export type CrsLanguageTest = "celpip" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada";
export type CrsAbility = "speaking" | "listening" | "reading" | "writing";

export const CRS_ABILITIES: ReadonlyArray<{ key: CrsAbility; label: string }> = [
  { key: "speaking", label: "Expression orale" },
  { key: "listening", label: "Compréhension de l’oral" },
  { key: "reading", label: "Compréhension de l’écrit" },
  { key: "writing", label: "Expression écrite" },
];

export const CRS_TEST_LABELS: Record<CrsLanguageTest, string> = {
  celpip: "CELPIP-G",
  ielts: "IELTS",
  pte_core: "PTE Core",
  tef_canada: "TEF Canada",
  tcf_canada: "TCF Canada",
};

/** Langue évaluée par chaque test : TEF et TCF Canada évaluent le français, les trois autres l'anglais. */
export const CRS_TEST_LANGUAGE: Record<CrsLanguageTest, "english" | "french"> = {
  celpip: "english",
  ielts: "english",
  pte_core: "english",
  tef_canada: "french",
  tcf_canada: "french",
};

export type ScoreBand = { label: string; clb: number };

const band = (clb: number, label: string): ScoreBand => ({ clb, label });
/** Les huit niveaux de l'outil officiel, du plus élevé au plus bas : CLB 10 ou plus, 9, 8, 7, 6, 5, 4, puis « moins de 4 ». */
const bands = (...labels: string[]): ScoreBand[] => labels.map((label, index) => band(index === 7 ? 0 : 10 - index, label));

const CELPIP = bands("10 - 12", "9", "8", "7", "6", "5", "4", "M, 0 - 3");
const IELTS_SPEAKING_WRITING = bands("7.5 - 9.0", "7.0", "6.5", "6.0", "5.5", "5.0", "4.0 - 4.5", "0 - 3.5");
const TEF_SPEAKING_WRITING = bands("393-450", "371-392", "349-370", "310-348", "271-309", "226-270", "181-225", "0 - 180");
const TCF_SPEAKING_WRITING = bands("16-20", "14-15", "12-13", "10-11", "7-9", "6", "4-5", "0-3");

export const CRS_TEST_BANDS: Record<CrsLanguageTest, Record<CrsAbility, ScoreBand[]>> = {
  celpip: { speaking: CELPIP, listening: CELPIP, reading: CELPIP, writing: CELPIP },
  ielts: {
    speaking: IELTS_SPEAKING_WRITING,
    listening: bands("8.5 - 9.0", "8.0", "7.5", "6.0 - 7.0", "5.5", "5.0", "4.5", "0 - 4.0"),
    reading: bands("8.0 - 9.0", "7.0 - 7.5", "6.5", "6.0", "5.0 - 5.5", "4.0 - 4.5", "3.5", "0 - 3.0"),
    writing: IELTS_SPEAKING_WRITING,
  },
  pte_core: {
    speaking: bands("89 - 90", "84 - 88", "76 - 83", "68 - 75", "59 - 67", "51 - 58", "42 - 50", "0 - 41"),
    listening: bands("89 - 90", "82 - 88", "71 - 81", "60 - 70", "50 - 59", "39 - 49", "28 - 38", "0 - 27"),
    reading: bands("88 - 90", "78 - 87", "69 - 77", "60 - 68", "51 - 59", "42 - 50", "33 - 41", "0 - 32"),
    writing: bands("90", "88 - 89", "79 - 87", "69 - 78", "60 - 68", "51 - 59", "41 - 50", "0 - 40"),
  },
  tef_canada: {
    speaking: TEF_SPEAKING_WRITING,
    listening: bands("316-360", "298-315", "280-297", "249-279", "217-248", "181-216", "145-180", "0 - 144"),
    reading: bands("263-300", "248-262", "233-247", "207-232", "181-206", "151-180", "121-150", "0 - 120"),
    writing: TEF_SPEAKING_WRITING,
  },
  tcf_canada: {
    speaking: TCF_SPEAKING_WRITING,
    listening: bands("549-699", "523-548", "503-522", "458-502", "398-457", "369-397", "331-368", "0-330"),
    reading: bands("549-699", "524-548", "499-523", "453-498", "406-452", "375-405", "342-374", "0-341"),
    writing: TCF_SPEAKING_WRITING,
  },
};

/** Tests proposables pour la seconde langue officielle : ceux de l'autre langue que le premier test (comme l'outil officiel). */
export function secondLanguageTests(first: CrsLanguageTest | null): CrsLanguageTest[] {
  if (!first) return [];
  const other = CRS_TEST_LANGUAGE[first] === "english" ? "french" : "english";
  return (Object.keys(CRS_TEST_LABELS) as CrsLanguageTest[]).filter((test) => CRS_TEST_LANGUAGE[test] === other);
}

export const ALL_CRS_TESTS = Object.keys(CRS_TEST_LABELS) as CrsLanguageTest[];

/** Niveau CLB d'une tranche choisie (index dans la liste officielle) ; null si le choix n'existe pas. */
export function clbForBand(test: CrsLanguageTest, ability: CrsAbility, bandIndex: number): number | null {
  return CRS_TEST_BANDS[test][ability][bandIndex]?.clb ?? null;
}

/** Retrouve la tranche officielle qui contient une note numérique (utile pour les tests et l'import) ; null hors des tranches. */
export function clbForScore(test: CrsLanguageTest, ability: CrsAbility, score: number): number | null {
  for (const entry of CRS_TEST_BANDS[test][ability]) {
    const numbers = entry.label.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (numbers.length === 0) continue;
    const low = Math.min(...numbers);
    const high = Math.max(...numbers);
    if (score >= low && score <= high) return entry.clb;
  }
  return null;
}
