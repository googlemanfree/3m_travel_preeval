import fs from "node:fs";
import path from "node:path";

const FALLBACK_BUILD_MARKER = "3m-travel-current";
let compiledMarker: string | undefined;

/**
 * Stable, non-sensitive identifier used only to diagnose which server build
 * produced public HTML. It never contains secrets or candidate data.
 */
export function getPublicBuildMarker() {
  const marker = process.env.PUBLIC_BUILD_MARKER?.trim();
  if (marker) return sanitizeBuildMarker(marker);
  if (process.env.NODE_ENV !== "test" && compiledMarker) return compiledMarker;
  // Le serveur peut démarrer sans git en production. Dans ce cas, relire la
  // balise déjà injectée dans l’index compilé garantit que l’API et les
  // en-têtes annoncent exactement le même build que le HTML public.
  if (process.env.NODE_ENV === "test") return FALLBACK_BUILD_MARKER;
  for (const candidate of [
    path.resolve(process.cwd(), "dist/public/index.html"),
    path.resolve(process.cwd(), "public/index.html"),
  ]) {
    try {
      const html = fs.readFileSync(candidate, "utf8");
      const value = extractBuildMarker(html);
      if (value) {
        compiledMarker = sanitizeBuildMarker(value);
        return compiledMarker;
      }
    } catch {
      // Un chemin absent est normal selon le mode (Vite ou production).
    }
  }
  return FALLBACK_BUILD_MARKER;
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

const FULL_SHA = /^[0-9a-f]{40}$/;

/**
 * Commit lu directement dans le dossier .git, sans exécutable git : un déploiement construit
 * dans un conteneur sans git donnait « nogit » alors que le dépôt était bien là.
 * Gère HEAD détaché, branche (fichier de référence puis packed-refs) et worktree (.git = fichier).
 */
export function readCommitFromGitFiles(root: string, fsApi: { existsSync(p: string): boolean; readFileSync(p: string, enc: "utf8"): string; statSync(p: string): { isDirectory(): boolean } }, join: (...parts: string[]) => string): string | undefined {
  try {
    let gitDir = join(root, ".git");
    if (!fsApi.existsSync(gitDir)) return undefined;
    if (!fsApi.statSync(gitDir).isDirectory()) {
      const pointer = fsApi.readFileSync(gitDir, "utf8").match(/^gitdir:\s*(.+)$/m)?.[1]?.trim();
      if (!pointer) return undefined;
      gitDir = /^([a-zA-Z]:|\/)/.test(pointer) ? pointer : join(root, pointer);
    }
    const head = fsApi.readFileSync(join(gitDir, "HEAD"), "utf8").trim();
    if (FULL_SHA.test(head)) return head.slice(0, 8);
    const ref = head.match(/^ref:\s*(\S+)$/)?.[1];
    if (!ref || ref.includes("..")) return undefined;
    const refFile = join(gitDir, ref);
    if (fsApi.existsSync(refFile)) {
      const sha = fsApi.readFileSync(refFile, "utf8").trim();
      return FULL_SHA.test(sha) ? sha.slice(0, 8) : undefined;
    }
    const packed = join(gitDir, "packed-refs");
    if (!fsApi.existsSync(packed)) return undefined;
    const line = fsApi.readFileSync(packed, "utf8").split(/\r?\n/).find((item) => item.endsWith(` ${ref}`));
    const sha = line?.split(" ")[0];
    return sha && FULL_SHA.test(sha) ? sha.slice(0, 8) : undefined;
  } catch {
    return undefined;
  }
}

/** Commit fourni par la plateforme de déploiement, quand elle l'expose dans l'environnement. */
export function commitFromEnv(env: Record<string, string | undefined>): string | undefined {
  for (const key of ["GIT_COMMIT", "SOURCE_COMMIT", "COMMIT_SHA", "GITHUB_SHA", "VERCEL_GIT_COMMIT_SHA", "RENDER_GIT_COMMIT"]) {
    const value = env[key]?.trim();
    if (value && COMMIT_ONLY.test(value)) return value.slice(0, 8);
  }
  return undefined;
}

/** Commit préparé avant Vite quand le build WebDev ne fournit pas .git. */
export function readCommitFromBuildMetadata(
  root: string,
  fsApi: { readFileSync(p: string, enc: "utf8"): string },
  join: (...parts: string[]) => string,
): string | undefined {
  try {
    const raw = JSON.parse(fsApi.readFileSync(join(root, "client", "public", "build-commit.json"), "utf8"));
    const commit = typeof raw?.commit === "string" ? raw.commit.trim() : "";
    return COMMIT_ONLY.test(commit) ? commit.slice(0, 8) : undefined;
  } catch {
    return undefined;
  }
}

export type ParsedBuildMarker ={ commit?: string; builtAt?: Date };

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
