import { GUIDE_COUNTRY_CODES, WORLD_COUNTRY_ROWS } from "./worldCountries";

/**
 * Destinations qu'un candidat peut déclarer : tous les pays du monde (shared/worldCountries.ts).
 *
 * Tous les pays sont sélectionnables ; ce qui varie, c'est la profondeur du service. `hasGuide`
 * indique les pays pour lesquels le site dispose d'un parcours avec source officielle vérifiée
 * (checklist et étapes propres au pays). Pour les autres, le parcours reste générique et un
 * conseiller étudie le projet : l'interface doit le dire honnêtement plutôt que d'afficher des
 * données inventées (voir getDestinationFormProfile).
 *
 * `coarseCategory` sert uniquement à alimenter l'ancien champ `candidates.destination`
 * (catégorie large historique, enum en base) pour compatibilité avec le code existant qui le lit
 * encore. Le pays précis fait foi partout ailleurs (`preferredDestinations`).
 */
export type CoarseDestinationCategory = "canada" | "luxembourg" | "pologne" | "europe" | "golfe" | "autre";

export type CandidateDestinationOption = {
  /** Code ISO 3166-1 alpha-2, ex. « CA ». */
  code: string;
  name: string;
  flag: string;
  region: string;
  coarseCategory: CoarseDestinationCategory;
  hasGuide: boolean;
};

const REGIONAL_INDICATOR_A = 0x1f1e6;

/** « CA » → 🇨🇦 */
export function isoCodeToFlagEmoji(code: string): string {
  return Array.from(code.toUpperCase())
    .map((letter) => String.fromCodePoint(REGIONAL_INDICATOR_A + letter.charCodeAt(0) - 65))
    .join("");
}

const GUIDE_CODES = new Set(GUIDE_COUNTRY_CODES);

function coarseCategoryFor(code: string, region: string): CoarseDestinationCategory {
  if (code === "CA") return "canada";
  if (code === "LU") return "luxembourg";
  if (code === "PL") return "pologne";
  if (region === "Europe") return "europe";
  if (region === "Golfe et Moyen-Orient") return "golfe";
  return "autre";
}

export const CANDIDATE_DESTINATION_OPTIONS: CandidateDestinationOption[] = WORLD_COUNTRY_ROWS.map(([code, name, region]) => ({
  code,
  name,
  flag: isoCodeToFlagEmoji(code),
  region,
  coarseCategory: coarseCategoryFor(code, region),
  hasGuide: GUIDE_CODES.has(code),
}));

/** Pays proposés en un clic, du plus demandé au moins demandé (tous disposent d'un guide). */
export const POPULAR_DESTINATION_NAMES: readonly string[] = [
  "Canada",
  "France",
  "Luxembourg",
  "Belgique",
  "Allemagne",
  "Royaume-Uni",
  "Pologne",
  "États-Unis",
];

/** Régions dans l'ordre d'affichage. */
export const DESTINATION_REGIONS: readonly string[] = [
  "Europe",
  "Amérique du Nord",
  "Afrique",
  "Golfe et Moyen-Orient",
  "Asie",
  "Océanie",
  "Amérique latine et Caraïbes",
];

/**
 * Formes usuelles ou historiques rencontrées dans le site (autres formulaires, données déjà
 * saisies) : elles retrouvent le pays sans erreur de saisie ni valeur « non reconnue ».
 */
const ALIASES_BY_CODE: Record<string, readonly string[]> = {
  AE: ["uae", "uae dubai", "dubai", "emirats", "abu dhabi"],
  US: ["usa", "etats unis", "etats-unis d'amerique", "amerique"],
  GB: ["uk", "angleterre", "grande-bretagne", "royaume uni"],
  NL: ["hollande"],
  CZ: ["republique tcheque"],
  MM: ["birmanie"],
  CD: ["rdc", "republique democratique du congo", "congo rdc", "kinshasa"],
  CG: ["republique du congo", "brazzaville", "congo"],
  CI: ["cote d'ivoire", "ivoire"],
  SZ: ["swaziland"],
  MK: ["macedoine"],
  KR: ["coree"],
  TR: ["turkiye"],
  VA: ["cite du vatican", "saint siege"],
  PS: ["territoires palestiniens", "gaza", "cisjordanie"],
  SA: ["arabie", "ksa"],
  TW: ["formose"],
  CV: ["cabo verde"],
  ST: ["sao tome"],
};

/** Minuscules, sans accents ni ponctuation : « Côte d’Ivoire » et « cote d'ivoire » se valent. */
export function normalizeDestinationText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’‘`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const BY_NORMALIZED_NAME = new Map<string, CandidateDestinationOption>();
const NORMALIZED_NAME_BY_CODE = new Map<string, string>();
const NORMALIZED_ALIASES_BY_CODE = new Map<string, string[]>();
for (const option of CANDIDATE_DESTINATION_OPTIONS) {
  const normalizedName = normalizeDestinationText(option.name);
  BY_NORMALIZED_NAME.set(normalizedName, option);
  NORMALIZED_NAME_BY_CODE.set(option.code, normalizedName);
  const aliases = (ALIASES_BY_CODE[option.code] ?? []).map(normalizeDestinationText);
  NORMALIZED_ALIASES_BY_CODE.set(option.code, aliases);
}
for (const option of CANDIDATE_DESTINATION_OPTIONS) {
  for (const alias of NORMALIZED_ALIASES_BY_CODE.get(option.code) ?? []) {
    if (!BY_NORMALIZED_NAME.has(alias)) BY_NORMALIZED_NAME.set(alias, option);
  }
}

export function isRecognizedCandidateDestination(name: string): boolean {
  return BY_NORMALIZED_NAME.has(normalizeDestinationText(name));
}

export function getCandidateDestinationOption(name: string): CandidateDestinationOption | undefined {
  return BY_NORMALIZED_NAME.get(normalizeDestinationText(name));
}

/**
 * Recherche tolérante : nom, alias puis région. Les correspondances au début du nom ou d'un mot
 * passent avant les simples inclusions ; à égalité, ordre alphabétique français.
 */
export function searchCandidateDestinations(query: string): CandidateDestinationOption[] {
  const q = normalizeDestinationText(query);
  if (!q) return CANDIDATE_DESTINATION_OPTIONS;
  const scored: Array<[number, CandidateDestinationOption]> = [];
  for (const option of CANDIDATE_DESTINATION_OPTIONS) {
    const name = NORMALIZED_NAME_BY_CODE.get(option.code) ?? "";
    const aliases = NORMALIZED_ALIASES_BY_CODE.get(option.code) ?? [];
    let score = -1;
    if (name === q || aliases.includes(q)) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (name.split(" ").some((word) => word.startsWith(q))) score = 2;
    else if (name.includes(q)) score = 3;
    else if (aliases.some((alias) => alias.startsWith(q) || alias.includes(q))) score = 4;
    else if (normalizeDestinationText(option.region).includes(q)) score = 5;
    if (score >= 0) scored.push([score, option]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name, "fr")).map(([, option]) => option);
}

/** Dérive l'ancienne catégorie large à partir du premier pays de préférence déclaré. */
export function coarseCategoryForPreferredDestinations(preferredDestinations: string[]): CoarseDestinationCategory {
  const first = preferredDestinations[0];
  if (!first) return "autre";
  return getCandidateDestinationOption(first)?.coarseCategory ?? "autre";
}

/** Nombre maximal de destinations de préférence qu'un candidat peut déclarer. */
export const MAX_PREFERRED_DESTINATIONS = 3;

/**
 * Remet une liste de destinations à l'orthographe officielle, sans doublon et dans l'ordre reçu
 * (le premier pays reste la destination principale). Les valeurs inconnues sont remontées à part.
 */
export function normalizeCandidateDestinations(names: string[]): { destinations: string[]; unrecognized: string[] } {
  const destinations: string[] = [];
  const unrecognized: string[] = [];
  for (const name of names) {
    const option = getCandidateDestinationOption(name);
    if (!option) unrecognized.push(name);
    else if (!destinations.includes(option.name)) destinations.push(option.name);
  }
  return { destinations, unrecognized };
}

/**
 * Code ISO 3166-1 alpha-2 (minuscules) d'un drapeau emoji, ou null si ce n'est pas un drapeau.
 * Windows n'affiche pas les emoji drapeaux (simples lettres « CA », « FR »...) : ce code permet
 * d'afficher une vraie image de drapeau partout.
 */
export function flagEmojiToIsoCode(flag: string): string | null {
  const points = Array.from(flag).map((char) => char.codePointAt(0) ?? 0);
  if (points.length !== 2 || points.some((point) => point < 0x1f1e6 || point > 0x1f1ff)) return null;
  return points.map((point) => String.fromCharCode(point - 0x1f1e6 + 97)).join("");
}

/** Pays précis enregistrés (JSON en base) ; ne lève jamais, même sur une ancienne valeur illisible. */
export function parsePreferredDestinations(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    return parsePreferredDestinations(JSON.parse(raw));
  } catch {
    return [];
  }
}

/**
 * Destination telle que l'équipe doit la voir : le pays principal précis (« France ») plutôt que la
 * catégorie historique (« europe »), qui ne reste qu'un repli pour les anciens comptes.
 */
export function destinationLabelForStaff(candidate: { preferredDestinations?: string | null; destination?: string | null }): string {
  const first = parsePreferredDestinations(candidate.preferredDestinations)[0];
  if (first) return getCandidateDestinationOption(first)?.name ?? first;
  return candidate.destination || "Non spécifiée";
}

/** Champs de projet que l'inscription peut demander en plus du formulaire de base. */
export type RegistrationProjectField = "visaType" | "educationLevel" | "employmentStatus" | "languageLevel";

/** Types de projet proposés à l'inscription ; ils déterminent les questions qui suivent. */
export const REGISTRATION_PROJECT_TYPES = ["Études", "Travail", "Tourisme / visite", "Regroupement familial", "Autre"] as const;

export type DestinationFormProfile = {
  /** « complet » : pays avec guide, questions adaptées au projet ; « reduit » : formulaire court. */
  level: "complet" | "reduit";
  extraFields: RegistrationProjectField[];
  languageHint: string;
  message: string;
};

const FRENCH_TESTS = new Set(["FR", "BE", "LU", "CH"]);
const ENGLISH_TESTS = new Set(["GB", "IE", "AU", "NZ", "US", "CA", "IN"]);
const GERMAN_TESTS = new Set(["DE", "AT"]);

function languageHintFor(code: string): string {
  if (code === "CA") return "IELTS 7, TEF, TCF…";
  if (FRENCH_TESTS.has(code)) return "DELF B2, TCF, TEF…";
  if (ENGLISH_TESTS.has(code)) return "IELTS 7, TOEFL…";
  if (GERMAN_TESTS.has(code)) return "Goethe B1, TestDaF…";
  return "Test de langue et niveau (IELTS, DELF…)";
}

/** Questions de projet utiles selon le type de projet déclaré (le type lui-même est toujours demandé). */
function projectFieldsFor(projectType: string | null | undefined): RegistrationProjectField[] {
  switch (normalizeDestinationText(projectType ?? "")) {
    case "etudes":
      return ["educationLevel", "languageLevel"];
    case "travail":
      return ["employmentStatus", "educationLevel", "languageLevel"];
    case "tourisme visite":
    case "regroupement familial":
      return [];
    default:
      // type non précisé ou « Autre » : on propose l'ensemble, le candidat garde la main
      return ["educationLevel", "employmentStatus", "languageLevel"];
  }
}

/**
 * Le formulaire d'inscription s'adapte au pays principal ET au type de projet :
 * - pays avec guide détaillé : le type de projet est demandé puis les questions qui le concernent
 *   (études : niveau d'études et langue ; travail : situation, études et langue ; tourisme ou
 *   regroupement familial : rien de plus), car elles préparent directement la liste de documents ;
 * - autre pays : formulaire court (le type de projet seulement), un conseiller étudie le projet.
 * Rien n'est jamais bloquant : ces champs restent optionnels.
 */
export function getDestinationFormProfile(destination: string | null | undefined, projectType?: string | null): DestinationFormProfile {
  const option = destination ? getCandidateDestinationOption(destination) : undefined;
  if (!option) return { level: "reduit", extraFields: [], languageHint: languageHintFor(""), message: "" };
  if (option.hasGuide) {
    return {
      level: "complet",
      extraFields: ["visaType", ...projectFieldsFor(projectType)],
      languageHint: languageHintFor(option.code),
      message: `Nous avons un guide détaillé pour ${option.name} : ces informations, facultatives, préparent directement votre liste de documents.`,
    };
  }
  return {
    level: "reduit",
    extraFields: ["visaType"],
    languageHint: languageHintFor(option.code),
    message: `Pour ${option.name}, un conseiller étudie votre projet avec vous. Vous pourrez compléter votre profil après l’inscription.`,
  };
}
