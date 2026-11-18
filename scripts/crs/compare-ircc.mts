/**
 * Confronte le calculateur CRS de 3M TRAVEL AGENCY à l'outil OFFICIEL d'IRCC (« Vérifiez votre note », canada.ca) sur une liste de profils de test.
 *
 *   npx tsx scripts/crs/compare-ircc.mts [--out fichier.jsonl] [--workers 4] [--only groupe] [--limit n]
 *
 * Écrit une ligne JSON par profil ({ id, group, label, official, local, diffs }) ; relancé, il reprend où il s'est arrêté.
 * Utilise HTTPS_PROXY s'il est défini (nécessaire dans certains environnements). Lecture seule : rien n'est envoyé à IRCC, le calcul se fait dans la page.
 */
import { createRequire } from "node:module";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { CRS_TEST_BANDS, type CrsAbility, type CrsLanguageTest } from "../../shared/crsLanguageTests";
import { buildCrsProfileFromOfficialAnswers, type CrsOfficialAnswers } from "../../shared/crsOfficialAnswers";
import { computeCrsScore, type CrsBreakdown } from "../../shared/crsScore";
import { buildProfiles, type TestProfile } from "./profiles.mts";

const require = createRequire(import.meta.url);
const { openOfficialCalculator } = require("./ircc-driver.cjs");

type Step = [id: string, text: string, optional?: boolean];

const MARITAL: Record<string, string> = { annulled: "Annulled Marriage", common_law: "Common-Law", divorced: "Divorced / Separated", legally_separated: "Legally Separated", married: "Married", single: "Never Married / Single", widowed: "Widowed" };
const EDUCATION: Record<string, string> = {
  less_than_secondary: "None, or less than secondary", secondary: "Secondary diploma", one_year_postsecondary: "One-year program", two_year_postsecondary: "Two-year program",
  bachelor_or_three_year: "Bachelor's degree", two_or_more_credentials: "Two or more certificates", master_or_professional: "Master's degree", doctoral: "Doctoral level",
};
const TEST_NAME: Record<CrsLanguageTest, string> = { celpip: "CELPIP-G", ielts: "IELTS", pte_core: "PTE Core", tef_canada: "TEF Canada", tcf_canada: "TCF Canada" };
/** Dans la liste « autres résultats » (q5ii), IRCC écrit « PTE » et non « PTE Core ». */
const SECOND_TEST_NAME: Record<CrsLanguageTest, string> = { ...TEST_NAME, pte_core: "PTE" };
const CREDENTIAL: Record<string, string> = { secondary_or_less: "Secondary (high school) or less", one_two_year: "One- or two-year", three_year_or_more: "Degree, diploma or certificate of three years" };
const JOB_OFFER: Record<string, string> = { "2": "at least twice", "1.5": "at least 1.5 times", "1.3": "at least 1.3 times" };
const YEARS_CA = ["None or less than a year", "1 year", "2 years", "3 years", "4 years", "5 years or more"];
const YEARS_FOREIGN = ["None or less than a year", "1 year", "2 years", "3 years or more"];
const ABILITIES: CrsAbility[] = ["speaking", "listening", "reading", "writing"];
const yn = (value: string) => (value === "yes" ? "Yes" : "No");

function bandSteps(prefix: string, test: CrsLanguageTest, bands: Record<CrsAbility, string>): Step[] {
  return ABILITIES.map((ability): Step => [`${prefix}-${ability}`, CRS_TEST_BANDS[test][ability][Number(bands[ability])].label]);
}

/** Traduit les réponses de 3M en suite de réponses à l'outil officiel (même ordre que le formulaire de canada.ca). */
export function officialSteps(a: CrsOfficialAnswers): Step[] {
  const steps: Step[] = [["q1", MARITAL[a.maritalStatus]]];
  if (a.maritalStatus === "married" || a.maritalStatus === "common_law") {
    steps.push(["q2i", yn(a.spouseCitizenOrPr)]);
    if (a.spouseCitizenOrPr === "no") steps.push(["q2ii", yn(a.spouseAccompanies)]);
  }
  steps.push(["q3", `${a.age} years of age`], ["q4", EDUCATION[a.education]], ["q4b", yn(a.canadianCredential)]);
  if (a.canadianCredential === "yes") steps.push(["q4c", CREDENTIAL[a.canadianCredentialLevel]]);
  steps.push(["q5i", yn(a.languageTestRecent)], ["q5i-a", TEST_NAME[a.firstTest as CrsLanguageTest]], ...bandSteps("q5i-b", a.firstTest as CrsLanguageTest, a.firstBands));
  if (a.secondTest && a.secondTest !== "none") steps.push(["q5ii", SECOND_TEST_NAME[a.secondTest as CrsLanguageTest]], ...bandSteps("q5ii-sol", a.secondTest as CrsLanguageTest, a.secondBands));
  else steps.push(["q5ii", "not applicable"]);
  steps.push(["q6i", YEARS_CA[Number(a.canadianWorkYears)]]);
  if (Number(a.canadianWorkYears) > 0 || a.highWageExperience === "yes") steps.push(["q6ii", yn(a.highWageExperience), true]);
  if (a.highWageExperience === "yes") {
    steps.push(["q6iii", yn(a.highWage2x), true]);
    if (a.highWage2x === "no") steps.push(["q6iv", yn(a.highWage15x), true]);
  }
  steps.push(["q6v", YEARS_FOREIGN[Number(a.foreignWorkYears)]], ["q7", yn(a.certificate)], ["q8", yn(a.jobOffer)]);
  if (a.jobOffer === "yes") steps.push(["q8a", JOB_OFFER[a.jobOfferLevel]]);
  steps.push(["q9", yn(a.nomination)], ["q10i", yn(a.sibling)]);
  if (buildCrsProfileFromOfficialAnswers(a).withSpouse) {
    steps.push(["q10", EDUCATION[a.spouseEducation]], ["q11", YEARS_CA[Number(a.spouseCanadianWorkYears)]]);
    if (a.spouseTest && a.spouseTest !== "not_applicable") steps.push(["q12i", TEST_NAME[a.spouseTest as CrsLanguageTest]], ...bandSteps("q12ii-fol", a.spouseTest as CrsLanguageTest, a.spouseBands));
    else steps.push(["q12i", "not applicable"]);
  }
  return steps;
}

const SECTIONS: Array<[RegExp, string]> = [[/^Core\/Human capital factors/i, "core"], [/^Spouse factors/i, "spouse"], [/^Skill transferability factors/i, "transfer"], [/^Additional points/i, "additional"]];
/** Lit le texte de #results en clés « section|libellé » (les libellés répétés reçoivent un rang). */
export function parseOfficial(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  let section = "";
  for (const raw of text.split(/\n+/)) {
    const line = raw.trim();
    const header = SECTIONS.find(([pattern]) => pattern.test(line) && !/=/.test(line));
    if (header) { section = header[1]; continue; }
    const match = line.match(/^(.*?)\s*=\s*(-?\d+)\s*$/);
    if (!match) continue;
    let key = `${section}|${match[1].trim()}`;
    for (let n = 2; key in out; n += 1) key = `${section}|${match[1].trim()}#${n}`;
    out[key] = Number(match[2]);
  }
  return out;
}

/** Correspondance entre les lignes de l'outil officiel et celles du calcul de 3M. */
const FIELD_MAP: Array<[officialKey: string, local: keyof CrsBreakdown]> = [
  ["core|Age", "age"], ["core|Level of education", "education"], ["core|First Official Language", "firstLanguage"], ["core|Second Official Language", "secondLanguage"],
  ["core|Labour market integration factor", "labourMarketIntegration"], ["core|Subtotal - Core/Human capital factors", "coreHumanCapital"],
  ["spouse|Level of education", "spouseEducation"], ["spouse|First Official Languages", "spouseLanguage"], ["spouse|Canadian work experience", "spouseExperience"], ["spouse|Subtotal - Spouse factors", "spouseFactors"],
  ["transfer|A) Official Language proficiency and education", "transferabilityEducationLanguage"], ["transfer|B) Canadian work experience and education", "transferabilityEducationExperience"], ["transfer|Subtotal", "transferabilityEducation"],
  ["transfer|A) Official Language proficiency and foreign work experience", "transferabilityForeignExperienceLanguage"], ["transfer|B) Canadian and foreign work experience", "transferabilityForeignExperienceCanadianExperience"], ["transfer|Subtotal#2", "transferabilityForeignExperience"],
  ["transfer|Certificate of qualification", "transferabilityCertificate"], ["transfer|Subtotal Skill transferability factors", "skillTransferability"],
  ["additional|Provincial nomination", "provincialNomination"], ["additional|Study in Canada", "canadianEducationBonus"], ["additional|Sibling in Canada", "siblingBonus"], ["additional|French-language skills", "frenchBonus"], ["additional|Subtotal Additional points", "additionalPoints"],
  ["additional|Comprehensive Ranking System formula grand total", "total"],
];

export type Row = { id: string; group: string; label: string; official: Record<string, number> | null; officialText?: string; local: Partial<Record<keyof CrsBreakdown, number>> | null; localIncomplete?: string[]; diffs: Array<{ field: string; official: number | null; local: number | null }>; error?: string };

export function diff(official: Record<string, number>, local: CrsBreakdown): Row["diffs"] {
  const out: Row["diffs"] = [];
  // « Subtotal » (études) et « Subtotal#2 » (expérience étrangère) sont dans la section « transfer » ; le total général est lu sans section (hors des quatre blocs).
  const get = (key: string) => official[key] ?? (key.startsWith("additional|Comprehensive") ? official["additional|Comprehensive Ranking System formula grand total"] ?? official["|Comprehensive Ranking System formula grand total"] : undefined);
  for (const [key, field] of FIELD_MAP) {
    const value = get(key);
    if (value === undefined) { if (!key.startsWith("spouse|")) out.push({ field: key, official: null, local: local[field] as number }); continue; }
    if (value !== local[field]) out.push({ field: key, official: value, local: local[field] as number });
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (name: string, fallback: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
  const out = arg("out", "scripts/crs/ircc-results.jsonl");
  const workers = Number(arg("workers", "4"));
  const only = arg("only", "");
  const limit = Number(arg("limit", "0"));
  const done = new Set<string>(existsSync(out) ? readFileSync(out, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line).id) : []);
  let queue: TestProfile[] = buildProfiles().filter((p) => (!only || p.group === only) && !done.has(p.id));
  if (limit) queue = queue.slice(0, limit);
  console.log(`${queue.length} profil(s) à confronter (${done.size} déjà faits).`);

  async function worker(n: number) {
    let tool = await openOfficialCalculator();
    for (let profile = queue.shift(); profile; profile = queue.shift()) {
      const built = buildCrsProfileFromOfficialAnswers(profile.answers);
      const local = built.complete ? computeCrsScore(built.profile) : null;
      let row: Row = { id: profile.id, group: profile.group, label: profile.label, official: null, local, localIncomplete: built.complete ? undefined : built.missing, diffs: [] };
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const result = await tool.score(officialSteps(profile.answers));
          // le total général est hors des quatre blocs : il suit « Additional points »
          row.official = parseOfficial(result.text);
          row.officialText = result.text.slice(result.text.indexOf("Core/Human"));
          if (Object.keys(row.official).length === 0) throw new Error("Aucun résultat lu : " + result.text.slice(0, 200));
          row.diffs = local ? diff(row.official, local) : [];
          delete row.error;
          break;
        } catch (error) {
          row.error = (error as Error).message.slice(0, 400);
          await tool.close().catch(() => undefined);
          tool = await openOfficialCalculator();
        }
      }
      appendFileSync(out, `${JSON.stringify(row)}\n`);
      const total = row.official?.["additional|Comprehensive Ranking System formula grand total"] ?? row.official?.["|Comprehensive Ranking System formula grand total"];
      console.log(`[w${n}] ${row.id} ${row.error ? "ERREUR " + row.error.slice(0, 120) : `3M=${local?.total ?? "—"} IRCC=${total ?? "?"} ${row.diffs.length ? "ÉCART " + row.diffs.map((d) => d.field).join(",") : "ok"}`}`);
    }
    await tool.close().catch(() => undefined);
  }
  await Promise.all(Array.from({ length: workers }, (_, i) => worker(i + 1)));
}

if (process.argv[1]?.endsWith("compare-ircc.mts")) main().catch((error) => { console.error(error); process.exit(1); });
