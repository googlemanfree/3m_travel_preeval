const FALLBACK_BUILD_MARKER = "3m-travel-current";

/**
 * Stable, non-sensitive identifier used only to diagnose which server build
 * produced public HTML. It never contains secrets or candidate data.
 */
export function getPublicBuildMarker() {
  const marker = process.env.PUBLIC_BUILD_MARKER?.trim();
  if (!marker) return FALLBACK_BUILD_MARKER;
  return marker.slice(0, 64).replace(/[^a-zA-Z0-9._-]/g, "-");
}

// Balise posée dans client/index.html et donc présente dans toutes les pages servies,
// pré-rendu compris : c'est le témoin qui dit quel build tourne réellement en ligne.
const BUILD_MARKER_META = /(<meta\s+name="3m-build-marker"\s+content=")[^"]*(")/;
const BUILD_MARKER_VALUE = /<meta\s+name="3m-build-marker"\s+content="([^"]*)"/;
const BUILD_MARKER_FORMAT = /^([0-9a-f]{7,40}|nogit)\.([0-9]{12})$/;
const COMMIT_ONLY = /^[0-9a-f]{7,40}$/;

/** Réduit un identifiant de build aux caractères sûrs pour un attribut HTML. */
export function sanitizeBuildMarker(raw: string) {
  return raw.trim().slice(0, 64).replace(/[^a-zA-Z0-9._-]/g, "-");
}

/** Horodatage UTC compact d'un build : aaaammjjhhmm. */
export function formatBuildStamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`;
}

/**
 * Identifiant de build à la compilation. PUBLIC_BUILD_MARKER s'il est défini ; sinon
 * « <commit>.<aaaammjjhhmm> », avec « nogit » à la place du commit quand git est absent
 * (déploiement construit hors dépôt) : la date de build reste alors lisible en ligne.
 */
export function resolveBuildMarker(
  env: Record<string, string | undefined>,
  readGitCommit: () => string | undefined,
  now: Date = new Date(),
) {
  const fromEnv = env.PUBLIC_BUILD_MARKER?.trim();
  if (fromEnv) return sanitizeBuildMarker(fromEnv);
  let commit: string | undefined;
  try {
    commit = readGitCommit()?.trim();
  } catch {
    commit = undefined;
  }
  const label = commit && COMMIT_ONLY.test(commit) ? commit : "nogit";
  return `${label}.${formatBuildStamp(now)}`;
}

export type ParsedBuildMarker = { commit?: string; builtAt?: Date };

/** Décompose une balise : commit (si git était disponible) et date de build UTC. */
export function parseBuildMarker(marker: string | undefined): ParsedBuildMarker {
  if (!marker) return {};
  const match = marker.match(BUILD_MARKER_FORMAT);
  if (match) {
    const [, label, stamp] = match;
    const [year, month, day, hour, minute] = [stamp.slice(0, 4), stamp.slice(4, 6), stamp.slice(6, 8), stamp.slice(8, 10), stamp.slice(10, 12)].map(Number);
    // Date.UTC « normalise » un mois 13 ou un jour 99 : les plages sont donc vérifiées avant.
    const plausible = month >= 1 && month <= 12 && day >= 1 && day <= 31 && hour <= 23 && minute <= 59;
    return { commit: label === "nogit" ? undefined : label, builtAt: plausible ? new Date(Date.UTC(year, month - 1, day, hour, minute)) : undefined };
  }
  return COMMIT_ONLY.test(marker) ? { commit: marker } : {};
}

/** Remplace la valeur de la balise de build ; sans balise, le HTML est renvoyé tel quel. */
export function injectBuildMarker(html: string, marker: string) {
  return html.replace(BUILD_MARKER_META, (_match, open: string, close: string) => `${open}${sanitizeBuildMarker(marker)}${close}`);
}

/** Lit la valeur de la balise de build dans une page servie. */
export function extractBuildMarker(html: string) {
  return html.match(BUILD_MARKER_VALUE)?.[1];
}
