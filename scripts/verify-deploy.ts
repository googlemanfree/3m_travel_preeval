/**
 * Vérifie ce qui tourne réellement en ligne, sans se fier au statut annoncé par la publication :
 * balise de build (commit et date de compilation), sitemap complet et routes témoins.
 *
 *   pnpm run verify:deploy -- --expect <sha ou référence git>   le commit est-il en ligne ?
 *   pnpm run verify:deploy                                      état courant, sans commit attendu
 *
 * Options : --base <url> (défaut https://www.3mtravelagency.com) · --sitemap-count <n>
 * Code de sortie : 0 conforme · 1 écart constaté · 2 non concluant (commit en ligne inconnu localement,
 * faire un `git fetch` puis relancer).
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractBuildMarker, parseBuildMarker } from "../server/publicBuildMarker";

export type Witness = { path: string; status: number; location?: string };
export type MarkerVerdict = "exact" | "descendant" | "older" | "built-after" | "built-before" | "unknown" | "no-marker";
export type VerifyOptions = { base: string; expect?: string; sitemapCount?: number };

export const DEFAULT_BASE_URL = "https://www.3mtravelagency.com";

// Routes dont la réponse dépend de correctifs déjà publiés : un écart signale un ancien build ou une régression.
export const DEFAULT_WITNESSES: Witness[] = [
  { path: "/", status: 200 },
  { path: "/forgot-password", status: 200 },
  { path: "/communaute", status: 301, location: "/3m-digital" },
  { path: "/evaluation-canada?fbclid=x", status: 301, location: "/evaluation?source=facebook&campaign=Canada&fbclid=x" },
  { path: "/evisa/kenya", status: 200 },
  { path: "/evisa/inconnu-xyz", status: 404 },
  { path: "/route-inconnue", status: 404 },
];

const isHexCommit = (value: string) => /^[0-9a-f]{7,40}$/.test(value);

export function evaluateWitness(witness: Witness, actual: { status: number; location: string | null }) {
  if (actual.status !== witness.status) return { ok: false, detail: `${actual.status} au lieu de ${witness.status}` };
  if (witness.location !== undefined && actual.location !== witness.location) {
    return { ok: false, detail: `Location ${actual.location ?? "absente"} au lieu de ${witness.location}` };
  }
  return { ok: true, detail: `${actual.status}${witness.location ? ` vers ${witness.location}` : ""}` };
}

/**
 * Compare la balise lue en ligne au commit attendu. « descendant » : le build en ligne vient d'un
 * commit qui contient le commit attendu (typique d'un commit « Checkpoint » de Manus par-dessus).
 */
export function compareMarker(
  marker: string | undefined,
  expected: string,
  isAncestor: (ancestor: string, descendant: string) => boolean | undefined,
  commitTime: () => Date | undefined = () => undefined,
): MarkerVerdict {
  const parsed = parseBuildMarker(marker);
  if (!parsed.commit) {
    if (!parsed.builtAt) return "no-marker";
    // Build sans git : seule la date est connue (précision d'une minute), donc la preuve est
    // « probable » et non exacte : un build daté après le commit peut encore venir d'un état plus ancien.
    const committedAt = commitTime();
    if (!committedAt) return "unknown";
    return parsed.builtAt.getTime() >= committedAt.getTime() - 60_000 ? "built-after" : "built-before";
  }
  const liveCommit = parsed.commit;
  const shared = Math.min(liveCommit.length, expected.length);
  if (liveCommit.slice(0, shared) === expected.slice(0, shared)) return "exact";
  const contained = isAncestor(expected, liveCommit);
  if (contained === true) return "descendant";
  if (contained === false) return "older";
  return "unknown";
}

export function gitIsAncestor(ancestor: string, descendant: string): boolean | undefined {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { stdio: "ignore" });
    return true;
  } catch (error) {
    // Statut 1 : pas un ancêtre. Autre statut : commit inconnu localement, donc indéterminé.
    return (error as { status?: number }).status === 1 ? false : undefined;
  }
}

export function gitCommitTime(reference: string): Date | undefined {
  try {
    const iso = execFileSync("git", ["show", "-s", "--format=%cI", reference], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

function resolveExpected(reference: string) {
  const lowered = reference.toLowerCase();
  if (isHexCommit(lowered)) return lowered;
  return execFileSync("git", ["rev-parse", "--verify", reference], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

export function parseArgs(argv: string[]): VerifyOptions {
  const options: VerifyOptions = { base: DEFAULT_BASE_URL };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === "--base" && value) {
      let base = value;
      while (base.endsWith("/")) base = base.slice(0, -1);
      options.base = base;
      index += 1;
    } else if (flag === "--expect" && value) {
      options.expect = value;
      index += 1;
    } else if (flag === "--sitemap-count" && value) {
      options.sitemapCount = Number(value);
      index += 1;
    }
  }
  return options;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Réessaie sur erreur réseau ou 5xx : un poste dont le DNS flanche ne doit pas passer pour une panne du site.
async function get(url: string, attempts = 4) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(40_000) });
      if (response.status >= 500 && attempt < attempts) {
        await sleep(3000);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(3000);
    }
  }
  throw lastError;
}

// Une réponse tronquée ne compte jamais : on exige la balise de fin du document.
async function getComplete(url: string, endMarker: string) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await get(url);
    const body = await response.text();
    const complete = response.status === 200 && body.includes(endMarker);
    if (complete || attempt === 4) return { status: response.status, body, complete };
    await sleep(3000);
  }
  throw new Error("réponse introuvable");
}

export async function runVerification(options: VerifyOptions) {
  const lines: string[] = [];
  let failures = 0;
  let inconclusive = false;
  const cacheBuster = `cb=${Date.now()}`;
  const record = (ok: boolean, label: string, detail: string) => {
    lines.push(`${ok ? "OK    " : "ECART "} ${label} : ${detail}`);
    if (!ok) failures += 1;
  };

  const home = await getComplete(`${options.base}/?${cacheBuster}`, "</html>");
  const marker = extractBuildMarker(home.body);
  if (!home.complete) record(false, "page d'accueil", `réponse incomplète (statut ${home.status})`);
  else if (!options.expect) lines.push(`INFO   balise de build : ${marker ?? "absente"}`);
  else {
    const expected = resolveExpected(options.expect);
    const verdict = compareMarker(marker, expected, gitIsAncestor, () => gitCommitTime(expected));
    const label = `commit ${expected.slice(0, 8)}`;
    if (verdict === "exact") record(true, label, `en ligne (balise ${marker})`);
    else if (verdict === "descendant") record(true, label, `en ligne, contenu dans le build ${marker}`);
    else if (verdict === "older") record(false, label, `absent du build en ligne (${marker}) : publication non effective`);
    else if (verdict === "built-after") record(true, label, `probable : build sans git daté du ${marker}, postérieur au commit (à recouper avec les routes témoins)`);
    else if (verdict === "built-before") record(false, label, `le build en ligne (${marker}) est antérieur au commit : publication non effective`);
    else if (verdict === "no-marker") record(false, label, `la balise en ligne (${marker ?? "absente"}) n'identifie aucun build : ancien build, antérieur à la balise`);
    else {
      inconclusive = true;
      lines.push(`????   ${label} : le build en ligne (${marker}) est inconnu localement, faire git fetch puis relancer`);
    }
  }

  const sitemap = await getComplete(`${options.base}/sitemap.xml?${cacheBuster}`, "</urlset>");
  const urlCount = sitemap.body.split("<loc>").length - 1;
  if (!sitemap.complete) record(false, "sitemap", `réponse incomplète (statut ${sitemap.status})`);
  else if (options.sitemapCount !== undefined) record(urlCount === options.sitemapCount, "sitemap", `${urlCount} URL (attendu ${options.sitemapCount})`);
  else lines.push(`INFO   sitemap complet : ${urlCount} URL`);

  for (const witness of DEFAULT_WITNESSES) {
    const response = await get(`${options.base}${witness.path}`);
    const result = evaluateWitness(witness, { status: response.status, location: response.headers.get("location") });
    record(result.ok, witness.path, result.detail);
  }

  return { lines, failures, inconclusive, exitCode: failures > 0 ? 1 : inconclusive ? 2 : 0 };
}

const invokedDirectly = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  runVerification(parseArgs(process.argv.slice(2)))
    .then((result) => {
      console.log(result.lines.join("\n"));
      console.log(result.exitCode === 0 ? "=> conforme" : result.exitCode === 1 ? `=> ${result.failures} écart(s)` : "=> non concluant");
      process.exitCode = result.exitCode;
    })
    .catch((error) => {
      console.error("Vérification impossible :", error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
