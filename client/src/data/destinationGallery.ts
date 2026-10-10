/**
 * Fiche visuelle unique par destination : hero + galerie créditée.
 * Réutilisée par hub, procédures, visa études et SEO.
 */
import { getCountryPhotos, type CountryPhoto } from "@/data/countryPhotos";
import { getDestinationVisual, normalizeDestinationSlug, type VisualSources } from "@/data/premiumVisuals";

export type DestinationGallerySheet = {
  slug: string;
  hero: VisualSources;
  gallery: CountryPhoto[];
};

export function getDestinationGallerySheet(slugOrId: string): DestinationGallerySheet | null {
  const slug = normalizeDestinationSlug(slugOrId);
  if (!slug) return null;
  const hero = getDestinationVisual(slug);
  if (!hero) return null;
  const gallery = getCountryPhotos(slug);
  return { slug, hero, gallery };
}

/** Catégorie de preuves adaptée au type de procédure / page. */
export function proofFilterForProcedure(visaTypeOrContext: string): "visas" | "etudes" | "immigration" | "placements" {
  const value = visaTypeOrContext.toLowerCase();
  if (value.includes("etud") || value.includes("study") || value.includes("formation")) return "etudes";
  if (value.includes("immig") || value.includes("canada") || value.includes("express")) return "immigration";
  if (value.includes("placement") || value.includes("emploi") || value.includes("travail")) return "visas";
  return "visas";
}
