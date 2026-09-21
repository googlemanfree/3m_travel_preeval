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
// pré-rendu compris : c'est le témoin qui dit quel commit tourne réellement en ligne.
const BUILD_MARKER_META = /(<meta\s+name="3m-build-marker"\s+content=")[^"]*(")/;
const BUILD_MARKER_VALUE = /<meta\s+name="3m-build-marker"\s+content="([^"]*)"/;

/** Réduit un identifiant de build aux caractères sûrs pour un attribut HTML. */
export function sanitizeBuildMarker(raw: string) {
  return raw.trim().slice(0, 64).replace(/[^a-zA-Z0-9._-]/g, "-");
}

/**
 * Identifiant de build à la compilation : PUBLIC_BUILD_MARKER s'il est défini, sinon le
 * commit courant. Renvoie undefined quand aucun n'est exploitable (pas de git, sortie
 * inattendue) : la balise reste alors inchangée plutôt que de recevoir une valeur fausse.
 */
export function resolveBuildMarker(env: Record<string, string | undefined>, readGitCommit: () => string | undefined) {
  const fromEnv = env.PUBLIC_BUILD_MARKER?.trim();
  if (fromEnv) return sanitizeBuildMarker(fromEnv);
  let commit: string | undefined;
  try {
    commit = readGitCommit()?.trim();
  } catch {
    commit = undefined;
  }
  return commit && /^[0-9a-f]{7,40}$/.test(commit) ? commit : undefined;
}

/** Remplace la valeur de la balise de build ; sans balise, le HTML est renvoyé tel quel. */
export function injectBuildMarker(html: string, marker: string) {
  return html.replace(BUILD_MARKER_META, (_match, open: string, close: string) => `${open}${sanitizeBuildMarker(marker)}${close}`);
}

/** Lit la valeur de la balise de build dans une page servie. */
export function extractBuildMarker(html: string) {
  return html.match(BUILD_MARKER_VALUE)?.[1];
}
