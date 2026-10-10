/**
 * Index visuel unique : destinations, services et thèmes.
 * Cascade : manus-storage (prod) → photos locales Wikimedia → fallback thématique.
 * Ne pas inventer d’URLs Unsplash ici — réutiliser les assets déjà hébergés.
 */
import { getCountryPhotos } from "@/data/countryPhotos";

export type VisualSources = {
  desktop: string;
  mobile: string;
  /** Fallback local (photos-pays / photos-canada) si manus-storage est indisponible. */
  localFallback?: string;
  alt: string;
};

/** Fallbacks thématiques (mêmes URLs que procedureVisuals — évite un import circulaire). */
const THEME_ASSETS = {
  home: "/manus-storage/3m-home-mobility-hero_f9957244.webp",
  homeMobile: "/manus-storage/3m-home-mobility-hero-mobile_70899b52.webp",
  canada: "/manus-storage/3m-procedure-canada_c60631c6.webp",
  canadaMobile: "/manus-storage/3m-procedure-canada-mobile_83efff00.webp",
  schengen: "/manus-storage/3m-procedure-schengen_c2a9a8b4.webp",
  schengenMobile: "/manus-storage/3m-procedure-schengen-mobile_eb73c9f2.webp",
} as const;

/** Destinations premium déjà présentes dans /manus-storage (showcase + lot 1). */
const DESTINATION_MANUS: Record<string, string> = {
  allemagne: "/manus-storage/destination-germany_c58485b6.jpg",
  autriche: "/manus-storage/destination-austria_570c2da1.jpg",
  suisse: "/manus-storage/destination-switzerland_8e49fdb0.jpg",
  france: "/manus-storage/destination-france_dc1778e3.jpg",
  belgique: "/manus-storage/destination-belgium_c2e1640d.jpg",
  luxembourg: "/manus-storage/destination-luxembourg_9822a9b2.jpg",
  "pays-bas": "/manus-storage/destination-netherlands-pr44_d9aee232.jpg",
  "royaume-uni": "/manus-storage/destination-united-kingdom_f21f95c8.jpg",
  irlande: "/manus-storage/destination-ireland-pr44_7e352a1a.jpg",
  portugal: "/manus-storage/destination-portugal-pr44_6b6ec5c3.jpg",
  espagne: "/manus-storage/destination-spain-pr44_6779444c.jpg",
  italie: "/manus-storage/destination-italy_3756968a.jpg",
  pologne: "/manus-storage/destination-poland-pr44_0429c2fa.jpg",
  malte: "/manus-storage/destination-malta_41841e72.jpg",
  norvege: "/manus-storage/destination-norway_69f4a76c.jpg",
  canada: "/manus-storage/destination-canada_5e7dfbae.jpg",
  australie: "/manus-storage/destination-australia_8cc2aa45.jpg",
  "nouvelle-zelande": "/manus-storage/destination-new-zealand_6e79abf1.jpg",
  emirats: "/manus-storage/destination-uae_2a1c8b60.jpg",
  qatar: "/manus-storage/destination-qatar_7d38f164.jpg",
  "arabie-saoudite": "/manus-storage/destination-saudi-arabia_6b8072dc.jpg",
  "coree-du-sud": "/manus-storage/destination-south-korea_30f632d3.jpg",
  japon: "/manus-storage/destination-japan_e2e870c6.jpg",
  "etats-unis": "/manus-storage/destination-united-states_25c13ad2.jpg",
};

/** Alias anglais / variantes de slug → clé canonique FR. */
const SLUG_ALIASES: Record<string, string> = {
  germany: "allemagne",
  austria: "autriche",
  switzerland: "suisse",
  france: "france",
  belgium: "belgique",
  luxembourg: "luxembourg",
  netherlands: "pays-bas",
  "united-kingdom": "royaume-uni",
  uk: "royaume-uni",
  ireland: "irlande",
  portugal: "portugal",
  spain: "espagne",
  italy: "italie",
  poland: "pologne",
  malta: "malte",
  norway: "norvege",
  canada: "canada",
  australia: "australie",
  "new-zealand": "nouvelle-zelande",
  uae: "emirats",
  "united-arab-emirates": "emirats",
  qatar: "qatar",
  "saudi-arabia": "arabie-saoudite",
  "south-korea": "coree-du-sud",
  korea: "coree-du-sud",
  japan: "japon",
  "united-states": "etats-unis",
  usa: "etats-unis",
  morocco: "maroc",
  maroc: "maroc",
};

const DESTINATION_ALT: Record<string, string> = {
  allemagne: "Allemagne — paysage et cadre de mobilité",
  autriche: "Autriche — destination formation et emploi",
  suisse: "Suisse — formation professionnelle et emploi",
  france: "France — études, travail et visas",
  belgique: "Belgique — mobilité et études",
  luxembourg: "Luxembourg — emploi et apprentissage",
  "pays-bas": "Pays-Bas — formation et emploi qualifié",
  "royaume-uni": "Royaume-Uni — études et travail",
  irlande: "Irlande — études et compétences critiques",
  portugal: "Portugal — emploi et séjour",
  espagne: "Espagne — travail et installation",
  italie: "Italie — quotas et emploi",
  pologne: "Pologne — études et mobilité",
  malte: "Malte — emploi anglophone",
  norvege: "Norvège — métiers en tension",
  canada: "Canada — immigration et études",
  australie: "Australie — visas qualifiés",
  "nouvelle-zelande": "Nouvelle-Zélande — emploi sponsorisé",
  emirats: "Émirats arabes unis — visas et projets",
  qatar: "Qatar — emploi sponsorisé",
  "arabie-saoudite": "Arabie saoudite — Vision 2030",
  "coree-du-sud": "Corée du Sud — programme EPS",
  japon: "Japon — formation et industrie",
  "etats-unis": "États-Unis — études et mobilité",
  maroc: "Maroc — études et mobilité régionale",
};

/**
 * Extrait un slug pays depuis un id procédure (`france-travail`, `allemagne-formation`)
 * ou un slug déjà canonique.
 */
export function normalizeDestinationSlug(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!value) return "";
  if (DESTINATION_MANUS[value] || value in countryPhotoSlugSet()) return value;
  if (SLUG_ALIASES[value]) return SLUG_ALIASES[value];

  const stripped = value
    .replace(/-(travail|etudes|formation|immigration|visite|tourisme|stage)$/i, "")
    .replace(/^(procedure|visa)-/, "");
  if (DESTINATION_MANUS[stripped] || stripped in countryPhotoSlugSet()) return stripped;
  if (SLUG_ALIASES[stripped]) return SLUG_ALIASES[stripped];

  for (const [alias, canonical] of Object.entries(SLUG_ALIASES)) {
    if (value.includes(alias) || stripped.includes(alias)) return canonical;
  }
  for (const slug of Object.keys(DESTINATION_MANUS)) {
    if (value.includes(slug) || stripped.includes(slug)) return slug;
  }
  return stripped;
}

function countryPhotoSlugSet(): Record<string, true> {
  // Lazy via getCountryPhotos known keys — duplicated lightly to avoid circular imports at module eval.
  return {
    canada: true,
    france: true,
    belgique: true,
    allemagne: true,
    pologne: true,
    australie: true,
    "royaume-uni": true,
    "etats-unis": true,
    irlande: true,
    maroc: true,
    "pays-bas": true,
    portugal: true,
    espagne: true,
    italie: true,
    malte: true,
    norvege: true,
    "nouvelle-zelande": true,
    emirats: true,
    qatar: true,
    "arabie-saoudite": true,
    "coree-du-sud": true,
    japon: true,
  };
}

/** Secours local pour destinations manus-only (Autriche, Suisse, Luxembourg…). */
const REGIONAL_LOCAL_FALLBACK: Record<string, string> = {
  autriche: "allemagne",
  suisse: "allemagne",
  luxembourg: "belgique",
};

export function isVisualAssetPathAllowed(path: string | undefined): path is string {
  return Boolean(path && /^(\/manus-storage|\/photos-pays|\/photos-canada)\//.test(path) && !/\.svg(?:$|\?)/i.test(path));
}

export function getDestinationVisual(slugOrId: string): VisualSources | null {
  const slug = normalizeDestinationSlug(slugOrId);
  if (!slug) return null;

  const manus = DESTINATION_MANUS[slug];
  const local = getCountryPhotos(slug)[0]?.src;
  const regionalSlug = REGIONAL_LOCAL_FALLBACK[slug];
  const regionalLocal = regionalSlug ? getCountryPhotos(regionalSlug)[0]?.src : undefined;
  const safeManus = isVisualAssetPathAllowed(manus) ? manus : undefined;
  const desktop = safeManus ?? local ?? regionalLocal;
  if (!desktop) return null;

  const localFallback = (local && local !== desktop ? local : undefined)
    ?? (regionalLocal && regionalLocal !== desktop ? regionalLocal : undefined);

  return {
    desktop,
    mobile: safeManus ?? local ?? regionalLocal ?? desktop,
    localFallback,
    alt: DESTINATION_ALT[slug] ?? `Destination ${slug}`,
  };
}

export function listDestinationVisualSlugs(): string[] {
  return Object.keys(DESTINATION_MANUS).sort();
}

/** Thèmes de service → image évocatrice (destination ou hero métier). */
const SERVICE_THEME_SLUG: Record<string, string> = {
  // Catalogue services
  etudes: "france",
  travail: "allemagne",
  immigration: "canada",
  visas: "france",
  famille: "canada",
  vols: "__mobility__",
  hotels: "emirats",
  vehicules: "emirats",
  assurance: "suisse",
  cni: "maroc",
  evisa: "maroc",
  technologies: "__mobility__",
  formations: "allemagne",
  securite: "__mobility__",
  // Pôles / catégories accueil
  mobilite: "canada",
  travel: "__mobility__",
  services: "maroc",
  "visa-etudes": "france",
  schengen: "__schengen__",
  dossier: "luxembourg",
  recrutement: "luxembourg",
};

const THEME_FALLBACKS: Record<string, VisualSources> = {
  __mobility__: {
    desktop: THEME_ASSETS.home,
    mobile: THEME_ASSETS.homeMobile,
    alt: "Mobilité internationale avec 3M TRAVEL AGENCY",
  },
  __schengen__: {
    desktop: THEME_ASSETS.schengen,
    mobile: THEME_ASSETS.schengenMobile,
    alt: "Espace Schengen — visas et mobilité européenne",
  },
  __canada__: {
    desktop: THEME_ASSETS.canada,
    mobile: THEME_ASSETS.canadaMobile,
    alt: "Canada — immigration et études",
  },
};

export function getServiceVisual(serviceOrPoleId: string): VisualSources {
  const theme = SERVICE_THEME_SLUG[serviceOrPoleId] ?? "__mobility__";
  if (theme.startsWith("__")) {
    return THEME_FALLBACKS[theme] ?? THEME_FALLBACKS.__mobility__;
  }
  return getDestinationVisual(theme) ?? THEME_FALLBACKS.__mobility__;
}

export function getCataloguedDestinationImage(slugOrId: string): string | undefined {
  return getDestinationVisual(slugOrId)?.desktop;
}
