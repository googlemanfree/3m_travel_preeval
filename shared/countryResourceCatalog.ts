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

/** Slug visuel premium (photos / manus) — proxy régional quand l’asset pays manque. */
export function visualSlugForCountry(country: string): string {
  const slug = countryNameToSlug(country);
  const visualAliases: Record<string, string> = {
    "republique-tcheque": "pologne",
    schengen: "france",
    hongrie: "pologne",
    estonie: "norvege",
    lettonie: "norvege",
    lituanie: "pologne",
    bulgarie: "pologne",
    roumanie: "pologne",
    slovaquie: "pologne",
    slovenie: "italie",
    croatie: "italie",
    chypre: "malte",
    grece: "italie",
    danemark: "norvege",
    finlande: "norvege",
    suede: "norvege",
    islande: "norvege",
    liechtenstein: "suisse",
    armenie: "emirats",
    azerbaidjan: "emirats",
    georgie: "emirats",
    turquie: "emirats",
    kenya: "maroc",
    senegal: "maroc",
    gabon: "maroc",
    maurice: "maroc",
    malaisie: "japon",
    "multi-destinations": "france",
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

const PROJECT_CATEGORIES = ["travail", "etudes", "visiteur"] as const;
export type ResourceEvalProject = (typeof PROJECT_CATEGORIES)[number];

/** Projet d’évaluation prioritaire selon les PDF disponibles sur la page pays. */
export function primaryEvalProjectForPage(page: CountryResourcePage): ResourceEvalProject {
  for (const category of PROJECT_CATEGORIES) {
    if (page.categories.includes(category)) return category;
  }
  return "travail";
}

/** Accroche courte et honnête pour le hero / SEO d’une page pays. */
export function countryResourceLead(
  page: CountryResourcePage,
  language: "fr" | "en" = "fr",
): string {
  const name = language === "en" && page.countryEn ? page.countryEn : page.country;
  const projects = PROJECT_CATEGORIES.filter((category) => page.categories.includes(category));
  const projectLabelsFr: Record<ResourceEvalProject, string> = {
    travail: "travail",
    etudes: "études",
    visiteur: "visite",
  };
  const projectLabelsEn: Record<ResourceEvalProject, string> = {
    travail: "work",
    etudes: "study",
    visiteur: "visit",
  };
  const labels = projects.map((category) =>
    language === "en" ? projectLabelsEn[category] : projectLabelsFr[category],
  );
  const projectLine =
    labels.length === 0
      ? language === "en"
        ? "published procedure sheets"
        : "fiches de procédure publiées"
      : language === "en"
        ? labels.join(", ")
        : labels.join(", ");

  if (page.slug === "canada") {
    return language === "en"
      ? `${page.resources.length} Canada sheets (${projectLine}) — IRCC-aligned preparation, no admission or visa promise.`
      : `${page.resources.length} fiches Canada (${projectLine}) — préparation alignée IRCC, sans promesse d’admission ou de visa.`;
  }
  if (page.slug === "luxembourg") {
    return language === "en"
      ? `${page.resources.length} Luxembourg sheets (${projectLine}) — ADEM / Guichet.lu references to verify before filing.`
      : `${page.resources.length} fiches Luxembourg (${projectLine}) — références ADEM / Guichet.lu à confirmer avant dépôt.`;
  }
  if (page.slug === "france") {
    return language === "en"
      ? `${page.resources.length} France sheets (${projectLine}) — cross-check every requirement on France-Visas.`
      : `${page.resources.length} fiches France (${projectLine}) — chaque exigence reste à confirmer sur France-Visas.`;
  }

  if (projects.length === 1) {
    return language === "en"
      ? `${page.resources.length} published guide(s) for ${name} — ${projectLine} track. Confirm every requirement with the competent authorities.`
      : `${page.resources.length} guide(s) publié(s) pour ${name} — parcours ${projectLine}. Chaque exigence reste à confirmer auprès des autorités compétentes.`;
  }

  return language === "en"
    ? `${page.resources.length} published sheets for ${name} (${projectLine}). Structured preparation with 3M — no admission, job or visa promise.`
    : `${page.resources.length} fiches publiées pour ${name} (${projectLine}). Préparation structurée avec 3M — sans promesse d’admission, d’emploi ou de visa.`;
}

/** Libellés des parcours disponibles (travail / études / visite). */
export function availableProjectLabels(
  page: CountryResourcePage,
  language: "fr" | "en" = "fr",
): string[] {
  const labelsFr: Record<ResourceEvalProject, string> = {
    travail: "Visa travail",
    etudes: "Visa études",
    visiteur: "Visa visiteur",
  };
  const labelsEn: Record<ResourceEvalProject, string> = {
    travail: "Work visa",
    etudes: "Study visa",
    visiteur: "Visitor visa",
  };
  return PROJECT_CATEGORIES.filter((category) => page.categories.includes(category)).map((category) =>
    language === "en" ? labelsEn[category] : labelsFr[category],
  );
}
