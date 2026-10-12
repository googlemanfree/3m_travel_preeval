/**
 * Enrichissement du Guide des procédures (/guide-procedures) :
 * rattache chaque PDF publié aux fiches procédures et aux portails officiels.
 */

import { procedures107Complete } from "../client/src/data/procedures107Complete";
import { OFFICIAL_SOURCE_CATALOG } from "./officialSourceCatalog";
import { getAllResources, type PdfResource } from "./pdfResources";

const fold = (value: string | null | undefined) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type EnrichedProcedureResource = PdfResource & {
  procedurePath: string | null;
  procedureId: string | null;
  officialSources: Array<{ label: string; url: string }>;
  verificationStatus: "verified" | "partial" | "unverified" | null;
};

function countryKeyFromResource(resource: PdfResource): string {
  return fold(resource.country.split("/")[0].trim());
}

function pickOfficialSources(
  official: { sources: Array<{ label: string; url: string }> } | null,
  category: PdfResource["category"],
): Array<{ label: string; url: string }> {
  const sources = official?.sources ?? [];
  if (!sources.length) return [];
  const ranked = [...sources].sort((a, b) => {
    const score = (source: { label: string; url: string }) => {
      const key = fold(`${source.label} ${source.url}`);
      if (category === "etudes" && /etud|study|student/.test(key)) return 0;
      if (category === "travail" && /travail|work|emploi|salarie|adem|eimt/.test(key)) return 0;
      if (category === "visiteur" && /visit|touris|court sejour|schengen/.test(key)) return 0;
      return 1;
    };
    return score(a) - score(b);
  });
  return ranked.slice(0, 3);
}

function findProcedureForResource(resource: PdfResource): { id: string; path: string } | null {
  const country = countryKeyFromResource(resource);
  const kind = resource.category === "etudes" || resource.category === "visiteur" || resource.category === "travail"
    ? resource.category
    : /etud/i.test(resource.title)
      ? "etudes"
      : /visit|touris/i.test(resource.title)
        ? "visiteur"
        : /travail|contrat|emploi|work/i.test(resource.title)
          ? "travail"
          : null;
  if (!kind) {
    const any = procedures107Complete.find((item) => fold(item.name) === country);
    return any ? { id: any.id, path: `/procedures/${any.id}` } : null;
  }
  const match = procedures107Complete.find(
    (item) => fold(item.name) === country && item.visaType === kind,
  );
  return match ? { id: match.id, path: `/procedures/${match.id}` } : null;
}

function officialRecordForCountry(country: string) {
  const key = fold(country);
  const entry = Object.entries(OFFICIAL_SOURCE_CATALOG).find(
    ([slug, record]) => key.includes(slug) || fold(record.country) === key,
  );
  return entry?.[1] ?? null;
}

/** Ressources PDF enrichies (fiche procédure + sources officielles). */
export function getEnrichedProcedureResources(): EnrichedProcedureResource[] {
  return getAllResources().map((resource) => {
    const procedure = findProcedureForResource(resource);
    const official = officialRecordForCountry(resource.country.split("/")[0]);
    return {
      ...resource,
      procedurePath: procedure?.path ?? null,
      procedureId: procedure?.id ?? null,
      officialSources: pickOfficialSources(official, resource.category),
      verificationStatus: official?.verificationStatus ?? null,
    };
  });
}

export const FEATURED_GUIDE_COUNTRIES = [
  "Canada",
  "Luxembourg",
  "France",
  "Allemagne",
  "Belgique",
  "Pays-Bas",
  "Suisse",
  "Italie",
] as const;

export function featuredResourcesForCountry(country: string): EnrichedProcedureResource[] {
  const key = fold(country);
  return getEnrichedProcedureResources().filter((resource) => countryKeyFromResource(resource) === key);
}

export function countResourcesByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const resource of getAllResources()) {
    counts[resource.category] = (counts[resource.category] || 0) + 1;
  }
  return counts;
}
