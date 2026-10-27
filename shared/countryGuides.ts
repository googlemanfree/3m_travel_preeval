/**
 * Adresses des guides par pays : /pays/<slug>. Le slug dérive du nom français du pays (catalogue mondial de 196 pays).
 * Un pays inconnu n'a pas d'adresse : l'URL répond alors « page introuvable » au lieu d'une page vide.
 */
import { WORLD_COUNTRY_ROWS } from "./worldCountries";

export function countrySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_TO_CODE = new Map<string, string>(WORLD_COUNTRY_ROWS.map((row) => [countrySlug(row[1]), row[0]]));
const CODE_TO_ROW = new Map(WORLD_COUNTRY_ROWS.map((row) => [row[0], row] as const));

export function guideCodeForSlug(slug: string): string | null {
  return SLUG_TO_CODE.get(slug) ?? null;
}

export function guideSlugForCode(code: string): string | null {
  const row = CODE_TO_ROW.get(code);
  return row ? countrySlug(row[1]) : null;
}

export function guideCountryName(code: string): string | null {
  return CODE_TO_ROW.get(code)?.[1] ?? null;
}

export const GUIDES_INDEX_PATH = "/pays";
export const guidePath = (slug: string) => `${GUIDES_INDEX_PATH}/${slug}`;
