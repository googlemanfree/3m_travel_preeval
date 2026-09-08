export const PROCEDURE_VISUALS = {
  home: "/manus-storage/3m-home-mobility-hero_f9957244.webp",
  homeMobile: "/manus-storage/3m-home-mobility-hero-mobile_70899b52.webp",
  canada: "/manus-storage/3m-procedure-canada_c60631c6.webp",
  canadaMobile: "/manus-storage/3m-procedure-canada-mobile_83efff00.webp",
  schengen: "/manus-storage/3m-procedure-schengen_c2a9a8b4.webp",
  schengenMobile: "/manus-storage/3m-procedure-schengen-mobile_eb73c9f2.webp",
} as const;

const LOT_1_DESTINATION_VISUALS: Record<string, { desktop: string; mobile: string }> = {
  "canada-travail": {
    desktop: "/manus-storage/destination-canada_5e7dfbae.jpg",
    mobile: "/manus-storage/destination-canada_5e7dfbae.jpg",
  },
  "luxembourg-travail": {
    desktop: "/manus-storage/destination-luxembourg_9822a9b2.jpg",
    mobile: "/manus-storage/destination-luxembourg_9822a9b2.jpg",
  },
  "france-travail": {
    desktop: "/manus-storage/destination-france_dc1778e3.jpg",
    mobile: "/manus-storage/destination-france_dc1778e3.jpg",
  },
  "belgique-etudes": {
    desktop: "/manus-storage/destination-belgium_c2e1640d.jpg",
    mobile: "/manus-storage/destination-belgium_c2e1640d.jpg",
  },
  "allemagne-travail": {
    desktop: "/manus-storage/destination-germany_c58485b6.jpg",
    mobile: "/manus-storage/destination-germany_c58485b6.jpg",
  },
  "suisse-travail": {
    desktop: "/manus-storage/destination-switzerland_8e49fdb0.jpg",
    mobile: "/manus-storage/destination-switzerland_8e49fdb0.jpg",
  },
  "royaume-uni-travail": {
    desktop: "/manus-storage/destination-united-kingdom_f21f95c8.jpg",
    mobile: "/manus-storage/destination-united-kingdom_f21f95c8.jpg",
  },
  "etats-unis-travail": {
    desktop: "/manus-storage/destination-united-states_25c13ad2.jpg",
    mobile: "/manus-storage/destination-united-states_25c13ad2.jpg",
  },
  "australie-travail": {
    desktop: "/manus-storage/destination-australia_8cc2aa45.jpg",
    mobile: "/manus-storage/destination-australia_8cc2aa45.jpg",
  },
  "italie-travail": {
    desktop: "/manus-storage/destination-italy_3756968a.jpg",
    mobile: "/manus-storage/destination-italy_3756968a.jpg",
  },
};

export function getProcedureVisual(country: { id: string; name: string; region: string }) {
  return getProcedureVisualSources(country).desktop;
}

export function getProcedureVisualSources(country: { id: string; name: string; region: string }) {
  const lot1Visual = LOT_1_DESTINATION_VISUALS[country.id];
  if (lot1Visual) return lot1Visual;

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

export const getLot1DestinationVisualIds = () => Object.keys(LOT_1_DESTINATION_VISUALS);
