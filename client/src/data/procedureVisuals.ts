export const PROCEDURE_VISUALS = {
  home: "/manus-storage/3m-home-mobility-hero_f9957244.webp",
  homeMobile: "/manus-storage/3m-home-mobility-hero-mobile_70899b52.webp",
  canada: "/manus-storage/3m-procedure-canada_c60631c6.webp",
  canadaMobile: "/manus-storage/3m-procedure-canada-mobile_83efff00.webp",
  schengen: "/manus-storage/3m-procedure-schengen_c2a9a8b4.webp",
  schengenMobile: "/manus-storage/3m-procedure-schengen-mobile_eb73c9f2.webp",
} as const;

export function getProcedureVisual(country: { id: string; name: string; region: string }) {
  const haystack = `${country.id} ${country.name} ${country.region}`.toLowerCase();
  if (haystack.includes("canada")) return PROCEDURE_VISUALS.canada;
  if (haystack.includes("chine") || haystack.includes("china")) return PROCEDURE_VISUALS.home;
  if (
    haystack.includes("europe") ||
    haystack.includes("schengen") ||
    haystack.includes("france") ||
    haystack.includes("allemagne") ||
    haystack.includes("belgique") ||
    haystack.includes("suisse") ||
    haystack.includes("italie") ||
    haystack.includes("espagne")
  ) {
    return PROCEDURE_VISUALS.schengen;
  }
  return PROCEDURE_VISUALS.home;
}

export function getProcedureVisualSources(country: { id: string; name: string; region: string }) {
  const haystack = `${country.id} ${country.name} ${country.region}`.toLowerCase();
  if (haystack.includes("canada")) {
    return { desktop: PROCEDURE_VISUALS.canada, mobile: PROCEDURE_VISUALS.canadaMobile };
  }
  if (haystack.includes("chine") || haystack.includes("china")) {
    return { desktop: PROCEDURE_VISUALS.home, mobile: PROCEDURE_VISUALS.homeMobile };
  }
  if (
    haystack.includes("europe") ||
    haystack.includes("schengen") ||
    haystack.includes("france") ||
    haystack.includes("allemagne") ||
    haystack.includes("belgique") ||
    haystack.includes("suisse") ||
    haystack.includes("italie") ||
    haystack.includes("espagne")
  ) {
    return { desktop: PROCEDURE_VISUALS.schengen, mobile: PROCEDURE_VISUALS.schengenMobile };
  }
  return { desktop: PROCEDURE_VISUALS.home, mobile: PROCEDURE_VISUALS.homeMobile };
}

export function getProcedureRegionBadges(country: { id: string; name: string; region: string }) {
  const haystack = `${country.id} ${country.name} ${country.region}`.toLowerCase();
  if (haystack.includes("canada")) return ["🇨🇦", "Canada — Priorité N°1"];
  if (haystack.includes("chine") || haystack.includes("china")) return ["🇨🇳", "Chine — Affaires & Études"];
  if (
    haystack.includes("europe") ||
    haystack.includes("schengen") ||
    haystack.includes("france") ||
    haystack.includes("allemagne") ||
    haystack.includes("belgique") ||
    haystack.includes("suisse") ||
    haystack.includes("italie") ||
    haystack.includes("espagne")
  ) return ["🇪🇺", "Espace Schengen"];
  if (haystack.includes("etats-unis") || haystack.includes("usa") || haystack.includes("united states")) return ["🇺🇸", "États-Unis"];
  if (haystack.includes("royaume-uni") || haystack.includes("uk") || haystack.includes("united kingdom")) return ["🇬🇧", "Royaume-Uni"];
  return ["🌍", "Mobilité internationale"];
}
