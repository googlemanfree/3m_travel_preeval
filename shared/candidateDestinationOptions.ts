/**
 * Liste des destinations qu'un candidat peut déclarer comme préférence à l'inscription.
 * Volontairement limitée aux pays déjà couverts par du contenu réel et vérifié
 * (client/src/data/destinations20.ts) : un candidat ne doit jamais pouvoir choisir un pays
 * pour lequel le site n'a ensuite aucune donnée concrète (checklist, score, procédures).
 *
 * `coarseCategory` sert uniquement à alimenter l'ancien champ `candidates.destination`
 * (catégorie large historique) pour compatibilité avec le code existant qui le lit encore.
 */
export type CoarseDestinationCategory = "canada" | "luxembourg" | "pologne" | "europe" | "golfe" | "autre";

export type CandidateDestinationOption = {
  name: string;
  flag: string;
  region: string;
  coarseCategory: CoarseDestinationCategory;
};

export const CANDIDATE_DESTINATION_OPTIONS: CandidateDestinationOption[] = [
  { name: "Pays-Bas", flag: "🇳🇱", region: "Europe", coarseCategory: "europe" },
  { name: "Luxembourg", flag: "🇱🇺", region: "Europe", coarseCategory: "luxembourg" },
  { name: "Belgique", flag: "🇧🇪", region: "Europe", coarseCategory: "europe" },
  { name: "France", flag: "🇫🇷", region: "Europe", coarseCategory: "europe" },
  { name: "Royaume-Uni", flag: "🇬🇧", region: "Europe", coarseCategory: "europe" },
  { name: "Irlande", flag: "🇮🇪", region: "Europe", coarseCategory: "europe" },
  { name: "Portugal", flag: "🇵🇹", region: "Europe", coarseCategory: "europe" },
  { name: "Espagne", flag: "🇪🇸", region: "Europe", coarseCategory: "europe" },
  { name: "Italie", flag: "🇮🇹", region: "Europe", coarseCategory: "europe" },
  { name: "Pologne", flag: "🇵🇱", region: "Europe", coarseCategory: "pologne" },
  { name: "Malte", flag: "🇲🇹", region: "Europe", coarseCategory: "europe" },
  { name: "Norvège", flag: "🇳🇴", region: "Europe", coarseCategory: "europe" },
  { name: "Canada", flag: "🇨🇦", region: "Amérique du Nord", coarseCategory: "canada" },
  { name: "Australie", flag: "🇦🇺", region: "Océanie", coarseCategory: "autre" },
  { name: "Nouvelle-Zélande", flag: "🇳🇿", region: "Océanie", coarseCategory: "autre" },
  { name: "Émirats Arabes Unis", flag: "🇦🇪", region: "Golfe et Moyen-Orient", coarseCategory: "golfe" },
  { name: "Qatar", flag: "🇶🇦", region: "Golfe et Moyen-Orient", coarseCategory: "golfe" },
  { name: "Arabie Saoudite", flag: "🇸🇦", region: "Golfe et Moyen-Orient", coarseCategory: "golfe" },
  { name: "Corée du Sud", flag: "🇰🇷", region: "Asie", coarseCategory: "autre" },
  { name: "Japon", flag: "🇯🇵", region: "Asie", coarseCategory: "autre" },
];

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const BY_NORMALIZED_NAME = new Map(CANDIDATE_DESTINATION_OPTIONS.map((option) => [normalize(option.name), option]));

export function isRecognizedCandidateDestination(name: string): boolean {
  return BY_NORMALIZED_NAME.has(normalize(name));
}

export function getCandidateDestinationOption(name: string): CandidateDestinationOption | undefined {
  return BY_NORMALIZED_NAME.get(normalize(name));
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
