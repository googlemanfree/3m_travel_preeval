/**
 * Catalogue pays dérivé de la bibliothèque PDF (/ressources).
 * Une page publique par pays : /ressources/:slug
 */

import { getAllResources, type PdfResource } from "./pdfResources";
import { getEnrichedProcedureResources, type EnrichedProcedureResource } from "./procedureGuideEnrichment";

const fold = (value: string | null | undefined) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Alias pays catalogue → slug URL + visuel. */
const COUNTRY_SLUG_ALIASES: Record<string, string> = {
  "rep tcheque": "republique-tcheque",
  tcheque: "republique-tcheque",
  "dubai eau": "emirats",
  dubai: "emirats",
  eau: "emirats",
  "emirats arabes unis": "emirats",
  "espace schengen": "schengen",
  schengen: "schengen",
  "etats unis": "etats-unis",
  "royaume uni": "royaume-uni",
  "pays bas": "pays-bas",
  "nouvelle zelande": "nouvelle-zelande",
  "arabie saoudite": "arabie-saoudite",
  "coree du sud": "coree-du-sud",
};

export function countryNameToSlug(country: string): string {
  const key = fold(country.split("/")[0]);
  if (COUNTRY_SLUG_ALIASES[key]) return COUNTRY_SLUG_ALIASES[key];
  return key.replace(/\s+/g, "-");
}

/** Slug visuel premium (photos / manus) — peut différer légèrement du slug URL. */
export function visualSlugForCountry(country: string): string {
  const slug = countryNameToSlug(country);
  const visualAliases: Record<string, string> = {
    "republique-tcheque": "allemagne",
    schengen: "france",
    hongrie: "allemagne",
    estonie: "allemagne",
    lettonie: "allemagne",
    lituanie: "allemagne",
    bulgarie: "allemagne",
    roumanie: "allemagne",
    slovaquie: "allemagne",
    slovenie: "allemagne",
    croatie: "italie",
    chypre: "malte",
    grece: "italie",
    danemark: "norvege",
    finlande: "norvege",
    suede: "norvege",
    islande: "norvege",
    liechtenstein: "suisse",
    armenie: "france",
    kenya: "maroc",
    senegal: "maroc",
    gabon: "maroc",
    maurice: "maroc",
    malaisie: "japon",
  };
  return visualAliases[slug] ?? slug;
}

export type CountryResourcePage = {
  slug: string;
  country: string;
  countryEn: string | null;
  flag: string;
  visualSlug: string;
  path: string;
  resources: EnrichedProcedureResource[];
  categories: Array<"travail" | "etudes" | "visiteur" | "guide" | "formulaire">;
  procedurePaths: string[];
  officialSources: Array<{ label: string; url: string }>;
};

function primaryCountryLabel(resource: PdfResource): string {
  return resource.country.split("/")[0].trim();
}

let cachedPages: CountryResourcePage[] | null = null;

export function listCountryResourcePages(): CountryResourcePage[] {
  if (cachedPages) return cachedPages;
  const enriched = getEnrichedProcedureResources();
  const bySlug = new Map<string, CountryResourcePage>();

  for (const resource of enriched) {
    const country = primaryCountryLabel(resource);
    const slug = countryNameToSlug(country);
    if (!slug) continue;
    let page = bySlug.get(slug);
    if (!page) {
      page = {
        slug,
        country,
        countryEn: resource.countryEn?.split("/")[0].trim() || null,
        flag: resource.flag,
        visualSlug: visualSlugForCountry(country),
        path: `/ressources/${slug}`,
        resources: [],
        categories: [],
        procedurePaths: [],
        officialSources: [],
      };
      bySlug.set(slug, page);
    }
    page.resources.push(resource);
    if (!page.categories.includes(resource.category)) page.categories.push(resource.category);
    if (resource.procedurePath && !page.procedurePaths.includes(resource.procedurePath)) {
      page.procedurePaths.push(resource.procedurePath);
    }
    for (const source of resource.officialSources) {
      if (!page.officialSources.some((item) => item.url === source.url)) {
        page.officialSources.push(source);
      }
    }
    if (!page.countryEn && resource.countryEn) page.countryEn = resource.countryEn.split("/")[0].trim();
  }

  cachedPages = Array.from(bySlug.values()).sort((a, b) => a.country.localeCompare(b.country, "fr"));
  return cachedPages;
}

export function getCountryResourcePage(slugOrCountry: string): CountryResourcePage | null {
  const needle = fold(slugOrCountry).replace(/\s+/g, "-");
  const pages = listCountryResourcePages();
  return (
    pages.find((page) => page.slug === needle)
    || pages.find((page) => countryNameToSlug(page.country) === needle)
    || pages.find((page) => fold(page.country) === fold(slugOrCountry))
    || null
  );
}

/** Chemin bibliothèque pays pour sync admin / candidat (null si aucun PDF). */
export function resourceLibraryPathForCountry(country: string | null | undefined): string | null {
  if (!country?.trim()) return null;
  const page = getCountryResourcePage(country.trim());
  return page?.path ?? null;
}

export function countCountryResourcePages(): number {
  return listCountryResourcePages().length;
}

export function countAllPdfResources(): number {
  return getAllResources().length;
}
