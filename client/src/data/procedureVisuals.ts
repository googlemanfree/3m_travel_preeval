export const PROCEDURE_VISUALS = {
  home: "/manus-storage/3m-home-mobility-hero_18fe431f.jpg",
  canada: "/manus-storage/3m-procedure-canada_de649ae7.jpg",
  schengen: "/manus-storage/3m-procedure-schengen_8b6b05c1.jpg",
} as const;

export function getProcedureVisual(country: { id: string; name: string; region: string }) {
  const haystack = `${country.id} ${country.name} ${country.region}`.toLowerCase();
  if (haystack.includes("canada")) return PROCEDURE_VISUALS.canada;
  if (haystack.includes("chine") || haystack.includes("china")) return PROCEDURE_VISUALS.home;
  if (haystack.includes("europe") || haystack.includes("schengen") || haystack.includes("france") || haystack.includes("allemagne") || haystack.includes("belgique") || haystack.includes("suisse") || haystack.includes("italie") || haystack.includes("espagne")) {
    return PROCEDURE_VISUALS.schengen;
  }
  return PROCEDURE_VISUALS.home;
}

export function getProcedureRegionBadges(country: { id: string; name: string; region: string }) {
  const haystack = `${country.id} ${country.name} ${country.region}`.toLowerCase();
  if (haystack.includes("canada")) return ["🇨🇦", "Canada — Priorité N°1"];
  if (haystack.includes("chine") || haystack.includes("china")) return ["🇨🇳", "Chine — Affaires & Études"];
  if (haystack.includes("europe") || haystack.includes("schengen") || haystack.includes("france") || haystack.includes("allemagne") || haystack.includes("belgique") || haystack.includes("suisse") || haystack.includes("italie") || haystack.includes("espagne")) return ["🇪🇺", "Espace Schengen"];
  if (haystack.includes("etats-unis") || haystack.includes("usa") || haystack.includes("united states")) return ["🇺🇸", "États-Unis"];
  if (haystack.includes("royaume-uni") || haystack.includes("uk") || haystack.includes("united kingdom")) return ["🇬🇧", "Royaume-Uni"];
  return ["🌍", "Mobilité internationale"];
}
