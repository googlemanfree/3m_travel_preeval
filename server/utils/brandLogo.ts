import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BRAND } from "../../shared/brandLetterhead";

export type BrandLogo = { dataUri: string; format: "PNG" | "JPEG" };

let cached: BrandLogo | null | undefined;

/**
 * Logo officiel pour les PDF et documents générés côté serveur : fichier local d'abord (aucun accès réseau), puis le site.
 * Mis en cache ; `null` si indisponible (le papier à en-tête dessine alors un monogramme et le document reste produit).
 */
export async function loadBrandLogo(): Promise<BrandLogo | null> {
  if (cached !== undefined) return cached;
  try {
    const candidates = [
      resolve(import.meta.dirname, "../../client/public/logo-3m-travel-agency-hd.png"),
      resolve(import.meta.dirname, "../public/logo-3m-travel-agency-hd.png"),
      resolve(process.cwd(), "client/public/logo-3m-travel-agency-hd.png"),
      resolve(process.cwd(), "dist/public/logo-3m-travel-agency-hd.png"),
    ];
    for (const path of candidates) {
      if (!existsSync(path)) continue;
      cached = { dataUri: `data:image/png;base64,${readFileSync(path).toString("base64")}`, format: "PNG" };
      return cached;
    }
    const response = await fetch(BRAND.logoUrl, { signal: AbortSignal.timeout(7000) });
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "image/png";
      const bytes = Buffer.from(await response.arrayBuffer());
      cached = { dataUri: `data:${contentType};base64,${bytes.toString("base64")}`, format: contentType.includes("png") ? "PNG" : "JPEG" };
      return cached;
    }
  } catch (error) {
    console.warn("[Brand] Logo indisponible : monogramme utilisé.", error);
  }
  cached = null;
  return null;
}

/** Variante synchrone (lecture du fichier local uniquement) pour les générateurs de PDF qui ne sont pas asynchrones. */
export function loadBrandLogoSync(): BrandLogo | null {
  if (cached) return cached;
  for (const path of [
    resolve(import.meta.dirname, "../../client/public/logo-3m-travel-agency-hd.png"),
    resolve(import.meta.dirname, "../public/logo-3m-travel-agency-hd.png"),
    resolve(process.cwd(), "client/public/logo-3m-travel-agency-hd.png"),
    resolve(process.cwd(), "dist/public/logo-3m-travel-agency-hd.png"),
  ]) {
    try {
      if (!existsSync(path)) continue;
      cached = { dataUri: `data:image/png;base64,${readFileSync(path).toString("base64")}`, format: "PNG" };
      return cached;
    } catch {
      /* essai suivant */
    }
  }
  return null;
}
