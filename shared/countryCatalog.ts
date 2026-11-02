/**
 * Catalogue mondial des parcours (travail, études, visiteur) : un pays × un parcours = une fiche.
 *
 * Règle de contenu : une fiche n'est jamais visible d'un candidat tant qu'un administrateur n'a pas ouvert la
 * page officielle et enregistré son adresse et la date de vérification. Les noms de dispositifs du jeu de départ
 * (`countryCatalogSeed.ts`) sont des points de départ « À confirmer » : ils ne contiennent ni seuil, ni délai, ni frais.
 */
import { WORLD_COUNTRY_ROWS, type WorldCountryRow } from "./worldCountries";
import { COUNTRY_CATALOG_SEED, SCHENGEN_COUNTRY_CODES } from "./countryCatalogSeed";

export const PATHWAYS = ["work", "study", "visit"] as const;
export type Pathway = (typeof PATHWAYS)[number];
export const PATHWAY_LABELS: Record<Pathway, string> = { work: "Travail", study: "Études", visit: "Visiteur" };

export const CATALOG_STATUSES = ["draft", "needs_review", "published", "retired"] as const;
export type CatalogStatus = (typeof CATALOG_STATUSES)[number];
export const CATALOG_STATUS_LABELS: Record<CatalogStatus, string> = { draft: "Brouillon", needs_review: "À confirmer", published: "Publiée", retired: "Retirée" };

/** `named` : dispositifs nommés dans le jeu de départ ; `to_document` : à documenter ; `not_offered` : le pays ne propose pas ce parcours. */
export const COVERAGES = ["named", "to_document", "not_offered"] as const;
export type Coverage = (typeof COVERAGES)[number];
export const COVERAGE_LABELS: Record<Coverage, string> = { named: "Dispositifs nommés", to_document: "À documenter", not_offered: "Non proposé" };

export const ROUTE_TYPES = ["employer", "qualified", "transfer", "seasonal", "jobseeker", "quota", "points"] as const;
export type RouteType = (typeof ROUTE_TYPES)[number];
export const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  employer: "Lié à un employeur",
  qualified: "Profils qualifiés",
  transfer: "Transfert intra-entreprise",
  seasonal: "Saisonnier ou agricole",
  jobseeker: "Recherche d'emploi (sans contrat)",
  quota: "Quota ou liste de métiers",
  points: "Système à points",
};

export const OFFER_REQUIREMENTS = ["yes", "no", "depends"] as const;
export type OfferRequirement = (typeof OFFER_REQUIREMENTS)[number];
export const OFFER_REQUIREMENT_LABELS: Record<OfferRequirement, string> = { yes: "Offre exigée", no: "Sans offre", depends: "Selon le cas" };

export const STEP_ACTORS = ["employer", "candidate", "authority", "agency", "institution"] as const;
export type StepActor = (typeof STEP_ACTORS)[number];
export const STEP_ACTOR_LABELS: Record<StepActor, string> = { employer: "Employeur", candidate: "Candidat", authority: "Administration", agency: "Agence", institution: "Établissement" };

export const SOURCE_AUTHORITIES = ["immigration", "embassy", "ministry", "education", "employment", "other"] as const;
export type SourceAuthority = (typeof SOURCE_AUTHORITIES)[number];
export const SOURCE_AUTHORITY_LABELS: Record<SourceAuthority, string> = { immigration: "Immigration", embassy: "Ambassade ou consulat", ministry: "Ministère", education: "Éducation", employment: "Emploi", other: "Autre" };

export const SOURCE_STATUSES = ["verified", "needs_review", "missing"] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];

/** Au-delà de ce délai sans relecture, une valeur repasse en « à reconfirmer ». */
export const CATALOG_STALE_DAYS = 365;

export type CountrySeedEntry = {
  code: string;
  work: ReadonlyArray<readonly [label: string, route: RouteType]>;
  study: string;
  visit: string;
};

export type SeedPathway = { countryCode: string; pathway: Pathway; coverage: Coverage; summary: string | null; status: CatalogStatus };
export type SeedProgram = {
  countryCode: string;
  pathway: Pathway;
  officialName: string;
  routeType: RouteType | null;
  offerRequired: OfferRequirement | null;
  status: CatalogStatus;
};

const OFFER_BY_ROUTE: Record<RouteType, OfferRequirement> = {
  employer: "yes",
  qualified: "depends",
  transfer: "yes",
  seasonal: "yes",
  jobseeker: "no",
  quota: "depends",
  points: "no",
};

const TO_DOCUMENT_SUMMARY: Record<Pathway, string> = {
  work: "Permis de travail national : dispositif à documenter à partir de la source officielle.",
  study: "Visa ou permis d'études : dispositif à documenter à partir de la source officielle.",
  visit: "Visa, autorisation de voyage ou exemption : à documenter à partir de la source officielle.",
};

const seedByCode = new Map<string, CountrySeedEntry>(COUNTRY_CATALOG_SEED.map((entry) => [entry.code, entry]));
const isSchengen = (code: string) => (SCHENGEN_COUNTRY_CODES as readonly string[]).includes(code);

export function isSchengenCountry(code: string): boolean {
  return isSchengen(code);
}

export function getCountrySeed(code: string): CountrySeedEntry | null {
  return seedByCode.get(code) ?? null;
}

/** Une fiche par pays et par parcours : 196 × 3. Toutes en « À confirmer » (jamais « Publiée » au départ). */
export function buildSeedPathways(rows: readonly WorldCountryRow[] = WORLD_COUNTRY_ROWS): SeedPathway[] {
  const out: SeedPathway[] = [];
  for (const [code] of rows) {
    const seed = seedByCode.get(code);
    for (const pathway of PATHWAYS) {
      const named = Boolean(seed) || (pathway === "visit" && isSchengen(code));
      out.push({
        countryCode: code,
        pathway,
        coverage: named ? "named" : "to_document",
        summary: named ? null : TO_DOCUMENT_SUMMARY[pathway],
        status: "needs_review",
      });
    }
  }
  return out;
}

/** Dispositifs nommés du jeu de départ. Le visa Schengen est ajouté aux États de l'espace Schengen qui n'ont pas de fiche détaillée. */
export function buildSeedPrograms(rows: readonly WorldCountryRow[] = WORLD_COUNTRY_ROWS): SeedProgram[] {
  const out: SeedProgram[] = [];
  for (const [code] of rows) {
    const seed = seedByCode.get(code);
    if (seed) {
      for (const [label, route] of seed.work) out.push({ countryCode: code, pathway: "work", officialName: label, routeType: route, offerRequired: OFFER_BY_ROUTE[route], status: "needs_review" });
      out.push({ countryCode: code, pathway: "study", officialName: seed.study, routeType: null, offerRequired: null, status: "needs_review" });
      out.push({ countryCode: code, pathway: "visit", officialName: seed.visit, routeType: null, offerRequired: null, status: "needs_review" });
    } else if (isSchengen(code)) {
      out.push({ countryCode: code, pathway: "visit", officialName: "Visa Schengen de court séjour", routeType: null, offerRequired: null, status: "needs_review" });
    }
  }
  return out;
}

export function isOfficialUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password && /\.[a-z]{2,}$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export type Freshness = "fresh" | "stale" | "never";

export function freshness(checkedAt: Date | string | null | undefined, now: Date = new Date(), maxDays: number = CATALOG_STALE_DAYS): Freshness {
  if (!checkedAt) return "never";
  const time = new Date(checkedAt).getTime();
  if (!Number.isFinite(time)) return "never";
  return now.getTime() - time > maxDays * 86_400_000 ? "stale" : "fresh";
}

export type PublishCheckInput = {
  summary: string | null | undefined;
  coverage: Coverage;
  programCount: number;
  sources: ReadonlyArray<{ url: string | null | undefined; status: string; checkedAt: Date | string | null | undefined }>;
  now?: Date;
};

/**
 * Une fiche ne devient visible du candidat que si elle est décrite et appuyée par au moins une source officielle relue :
 * adresse https, statut « vérifiée », date de vérification récente. « Non proposé » n'exige qu'une source.
 */
export function publishBlockers(input: PublishCheckInput): string[] {
  const reasons: string[] = [];
  const now = input.now ?? new Date();
  const goodSources = input.sources.filter((source) => isOfficialUrl(source.url) && source.status === "verified" && freshness(source.checkedAt, now) === "fresh");
  if (goodSources.length === 0) reasons.push("Aucune source officielle vérifiée récemment (adresse https, statut « vérifiée », date de vérification).");
  if (input.coverage === "named" && input.programCount === 0) reasons.push("Aucun dispositif enregistré pour ce parcours.");
  if (input.coverage !== "not_offered" && !String(input.summary ?? "").trim() && input.programCount === 0) reasons.push("La fiche n'a ni résumé ni dispositif.");
  return reasons;
}
