import { CEFR_LEVELS, EDUCATION_RANK, type CandidateFacts } from "../../../shared/bilanAuto/types";

/**
 * Orientations du bilan : Luxembourg prioritaire, au moins quatre alternatives, et le Canada dès que le candidat a au moins
 * un BTS (bac+2) et moins de 40 ans (règle métier du propriétaire).
 *
 * Règles d'honnêteté (cahier des charges) :
 * - OFFRE REPÉRÉE : exige une source (adresse + date de consultation) ; sinon l'élément devient « poste à cibler » ;
 * - POSTE À CIBLER : piste de métier, jamais présentée comme une offre ;
 * - REPÈRE SALARIAL : exige une source datée ; sinon « salaire à documenter » — aucun montant n'est jamais inventé ;
 * - une proposition n'est pas une promesse d'admission, d'embauche ni de visa : chaque pays porte ses réserves.
 */

export type SourceRef = { url: string; title: string; consultedAt: string };

export type OrientationItem =
  | { kind: "offre_reperee"; title: string; employer: string; city?: string; remote: "confirmee" | "non_confirmee"; source: SourceRef }
  | { kind: "poste_a_cibler"; title: string; missions: string[] }
  | { kind: "repere_salarial"; label: string; amount: string; period: string; source: SourceRef };

export type DestinationProposal = {
  country: string;
  role: "prioritaire" | "alternative" | "regle_canada";
  rationale: string;
  cities: string[];
  items: OrientationItem[];
  /** « À documenter » tant qu'aucun repère salarial sourcé n'existe. */
  salary: string;
  conditions: string[];
  reserves: string[];
  sources: SourceRef[];
};

export type DestinationReference = { country: string; languages: string[]; englishWorkable: boolean; cities: string[] };

export const DESTINATIONS: Record<string, DestinationReference> = {
  Luxembourg: { country: "Luxembourg", languages: ["français", "allemand", "luxembourgeois"], englishWorkable: true, cities: ["Luxembourg-Ville", "Esch-sur-Alzette"] },
  Lituanie: { country: "Lituanie", languages: ["lituanien", "anglais"], englishWorkable: true, cities: ["Vilnius", "Kaunas"] },
  Pologne: { country: "Pologne", languages: ["polonais", "anglais"], englishWorkable: true, cities: ["Varsovie", "Cracovie", "Wrocław"] },
  Italie: { country: "Italie", languages: ["italien"], englishWorkable: false, cities: ["Milan", "Turin", "Bologne"] },
  Serbie: { country: "Serbie", languages: ["serbe", "anglais"], englishWorkable: true, cities: ["Belgrade", "Novi Sad"] },
  Grèce: { country: "Grèce", languages: ["grec", "anglais"], englishWorkable: true, cities: ["Athènes", "Thessalonique"] },
  Canada: { country: "Canada", languages: ["français", "anglais"], englishWorkable: true, cities: ["Montréal", "Québec", "Toronto"] },
};

export const ALTERNATIVE_COUNTRIES = ["Lituanie", "Pologne", "Italie", "Serbie", "Grèce"] as const;
export const MIN_ALTERNATIVES = 4;

const GENERAL_CONDITIONS = [
  "Les conditions d'entrée, de séjour et d'accès à l'emploi sont fixées par les autorités du pays : elles sont à vérifier auprès des sources officielles avant toute démarche.",
  "La reconnaissance du diplôme ou de la qualification peut être exigée selon le métier (professions réglementées).",
];

// ── Règle « Canada » ──────────────────────────────────────────────────────

export type CanadaRule = { applies: boolean; undecidable: string[]; reason: string };

/**
 * Canada proposé si diplôme ≥ BTS (bac+2) ET âge < 40 ans. Si le diplôme ou l'âge est inconnu, la règle ne s'applique pas
 * automatiquement : on le dit (« à vérifier ») au lieu de deviner. L'âge ne sert JAMAIS à la note, uniquement à cette règle.
 */
export function evaluateCanadaRule(facts: Pick<CandidateFacts, "ageAns"> & { formation: Pick<CandidateFacts["formation"], "niveau"> }): CanadaRule {
  const undecidable: string[] = [];
  const level = facts.formation.niveau;
  const hasLevel = level.value !== null && level.provenance !== "non_renseigne";
  if (!hasLevel) undecidable.push("niveau de diplôme");
  if (facts.ageAns === null || !Number.isFinite(facts.ageAns)) undecidable.push("âge");
  if (undecidable.length > 0) return { applies: false, undecidable, reason: `Règle Canada non évaluable : ${undecidable.join(" et ")} à confirmer.` };
  const rank = EDUCATION_RANK[level.value!];
  const bts = rank >= EDUCATION_RANK.bac_plus_2;
  const young = (facts.ageAns as number) < 40;
  if (bts && young) return { applies: true, undecidable: [], reason: "Diplôme de niveau BTS (bac+2) ou supérieur et moins de 40 ans : le Canada est proposé comme destination à étudier." };
  return { applies: false, undecidable: [], reason: !bts ? "Diplôme inférieur au BTS : Canada non proposé automatiquement." : "Âge de 40 ans ou plus : Canada non proposé automatiquement." };
}

/** Âge en années depuis une date de naissance (AAAA-MM-JJ ou JJ/MM/AAAA) ; null si illisible ou invraisemblable. */
export function ageFromBirthDate(raw: string | null | undefined, now: Date): number | null {
  if (!raw) return null;
  const value = raw.trim();
  let year: number, month: number, day: number;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value);
  if (match) [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value))) [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  let age = now.getUTCFullYear() - year;
  if (now.getUTCMonth() + 1 < month || (now.getUTCMonth() + 1 === month && now.getUTCDate() < day)) age -= 1;
  return age >= 14 && age <= 90 ? age : null;
}

// ── Sources et éléments ───────────────────────────────────────────────────

export type SearchResult = { offers: Array<{ title: string; employer: string; city?: string; remote?: "confirmee" | "non_confirmee"; source: SourceRef }>; salaries: Array<{ label: string; amount: string; period: string; source: SourceRef }> };
/** Recherche de sources (offres, repères salariaux). Peut échouer : le bilan est alors produit avec « à documenter ». */
export type SourceSearch = (input: { country: string; jobTitle: string | null }) => Promise<SearchResult>;

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
const isHttps = (value: string) => /^https:\/\/[^\s]+$/i.test(value);
export const isValidSource = (source: SourceRef | undefined | null): source is SourceRef =>
  Boolean(source && isHttps(source.url) && source.title.trim().length > 0 && isIsoDate(source.consultedAt));

/** Applique les règles d'honnêteté : une offre ou un repère sans source valide n'est jamais publié comme tel. */
export const DEFAULT_MAX_SOURCE_AGE_DAYS = 180;

/** Politique de fraîcheur configurable : une source consultée il y a plus de `maxAgeDays` n'est pas présentée (elle est écartée, pas rajeunie). */
export function isFreshSource(source: SourceRef, now: Date, maxAgeDays = DEFAULT_MAX_SOURCE_AGE_DAYS): boolean {
  const consulted = Date.parse(source.consultedAt);
  if (Number.isNaN(consulted) || consulted > now.getTime() + 86_400_000) return false; // date future : invraisemblable
  return now.getTime() - consulted <= maxAgeDays * 86_400_000;
}

export function sanitizeSearchResult(result: SearchResult | null | undefined, options: { now?: Date; maxAgeDays?: number } = {}): SearchResult {
  const now = options.now ?? new Date();
  const usable = (source: SourceRef) => isValidSource(source) && isFreshSource(source, now, options.maxAgeDays);
  const offers = (result?.offers ?? []).filter((offer) => offer.title.trim() && offer.employer.trim() && usable(offer.source));
  const salaries = (result?.salaries ?? []).filter((salary) => salary.label.trim() && salary.amount.trim() && salary.period.trim() && usable(salary.source));
  return { offers, salaries };
}

function languageFit(country: string, facts: CandidateFacts): number {
  const ref = DESTINATIONS[country];
  let fit = 0;
  const english = facts.langues.autreLangue.value;
  if (ref.englishWorkable && english && CEFR_LEVELS.indexOf(english) >= CEFR_LEVELS.indexOf("B1")) fit += 2;
  if (!ref.englishWorkable) fit -= 1;
  return fit;
}

function rankAlternatives(facts: CandidateFacts): string[] {
  const base = [...ALTERNATIVE_COUNTRIES];
  return base
    .map((country, index) => ({ country, score: languageFit(country, facts) * 10 - index }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.country);
}

export type OrientationOutcome = {
  proposals: DestinationProposal[];
  canadaRule: CanadaRule;
  /** Vrai si la recherche de sources a échoué ou renvoyé des éléments rejetés : mention « sources à compléter ». */
  sourcesIncomplete: boolean;
  searchErrors: string[];
};

export async function buildOrientations(input: { facts: CandidateFacts; priorityCountry?: string; search?: SourceSearch | null; now?: Date; maxSourceAgeDays?: number }): Promise<OrientationOutcome> {
  const { facts } = input;
  const priority = input.priorityCountry && DESTINATIONS[input.priorityCountry] ? input.priorityCountry : "Luxembourg";
  const canadaRule = evaluateCanadaRule(facts);
  const alternatives = rankAlternatives(facts).filter((country) => country !== priority);
  const countries: Array<{ country: string; role: DestinationProposal["role"] }> = [
    { country: priority, role: "prioritaire" },
    ...alternatives.map((country) => ({ country, role: "alternative" as const })),
  ];
  if (canadaRule.applies && !countries.some((entry) => entry.country === "Canada")) countries.push({ country: "Canada", role: "regle_canada" });
  else if (canadaRule.applies) countries.find((entry) => entry.country === "Canada")!.role = "regle_canada";

  const searchErrors: string[] = [];
  let sourcesIncomplete = !input.search;
  const proposals: DestinationProposal[] = [];
  for (const { country, role } of countries) {
    const ref = DESTINATIONS[country];
    let found: SearchResult = { offers: [], salaries: [] };
    if (input.search) {
      try {
        const raw = await input.search({ country, jobTitle: facts.metierVise });
        found = sanitizeSearchResult(raw, { now: input.now, maxAgeDays: input.maxSourceAgeDays });
        const rejected = raw.offers.length + raw.salaries.length - found.offers.length - found.salaries.length;
        if (rejected > 0) sourcesIncomplete = true;
      } catch (error) {
        sourcesIncomplete = true;
        searchErrors.push(`${country} : ${error instanceof Error ? error.message : "recherche indisponible"}`);
      }
    }
    const items: OrientationItem[] = [
      ...found.offers.map((offer): OrientationItem => ({ kind: "offre_reperee", ...offer, remote: offer.remote ?? "non_confirmee" })),
      {
        kind: "poste_a_cibler",
        title: facts.metierVise ?? "Poste à préciser avec votre conseiller",
        missions: facts.missionsVisees.slice(0, 5),
      },
      ...found.salaries.map((salary): OrientationItem => ({ kind: "repere_salarial", ...salary })),
    ];
    const sources = [...found.offers.map((offer) => offer.source), ...found.salaries.map((salary) => salary.source)];
    const hasSalary = found.salaries.length > 0;
    proposals.push({
      country,
      role,
      rationale:
        role === "prioritaire"
          ? `${country} est la destination prioritaire retenue pour ce bilan.`
          : role === "regle_canada"
            ? canadaRule.reason
            : `${country} est une piste complémentaire à étudier au regard de votre profil et des langues de travail (${ref.languages.join(", ")}).`,
      cities: ref.cities,
      items,
      salary: hasSalary ? "Repère salarial sourcé ci-dessous (à confirmer auprès de l'employeur)." : "Salaire à documenter : aucun repère sourcé disponible à ce jour.",
      conditions: GENERAL_CONDITIONS,
      reserves: [
        "Cette piste est une proposition d'étude, non une promesse d'admission, d'embauche ou de visa.",
        ...(found.offers.length === 0 ? ["Aucune offre précise n'a été repérée : les postes indiqués sont des métiers à cibler."] : []),
      ],
      sources,
    });
  }
  return { proposals, canadaRule, sourcesIncomplete, searchErrors };
}
