// Détermination du commit publié. Aucune entrée n'est inventée : seul un SHA Git valide (fourni par la plateforme ou lu dans .git)
// peut devenir le marqueur. Un identifiant WebDev, une empreinte de fichiers ou un ancien build-commit.json ne sont JAMAIS des commits.

export const COMMIT_PATTERN = /^[0-9a-f]{7,40}$/i;

/**
 * Variables posées PAR les plateformes d'intégration / d'hébergement à chaque build, par ordre de priorité.
 * `PUBLIC_BUILD_COMMIT` n'en fait volontairement pas partie : c'est une variable posée à la main (et persistante sur WebDev),
 * elle reste figée sur un ancien commit et bloquait toute publication. Elle ne peut plus ni primer sur Git ni bloquer le build.
 */
export const PLATFORM_COMMIT_VARIABLES = [
  "RAILWAY_GIT_COMMIT_SHA",
  "GIT_COMMIT",
  "SOURCE_COMMIT",
  "COMMIT_SHA",
  "GITHUB_SHA",
  "VERCEL_GIT_COMMIT_SHA",
  "RENDER_GIT_COMMIT",
];

export class BuildMarkerError extends Error {}

/** Réduit un SHA valide à 8 caractères minuscules ; toute autre valeur (id WebDev, texte libre, vide) est ignorée. */
export function normalizeSha(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return COMMIT_PATTERN.test(text) ? text.slice(0, 8).toLowerCase() : undefined;
}

/** Variable posée à la main, jamais fiable : lue seulement pour être signalée, jamais utilisée comme commit. */
export const MANUAL_COMMIT_VARIABLE = "PUBLIC_BUILD_COMMIT";

export function commitFromPlatform(env) {
  for (const key of PLATFORM_COMMIT_VARIABLES) {
    const sha = normalizeSha(env[key]);
    if (sha) return { sha, key };
  }
  return undefined;
}

/**
 * Règles : SHA de la plateforme, sinon HEAD Git, sinon échec.
 * - Plateforme et Git présents mais différents : échec en mode strict (le build n'est pas celui du dépôt).
 * - `expected` (EXPECTED_BUILD_COMMIT) présent : le commit résolu doit lui correspondre, en mode strict.
 * - Sans SHA : échec en mode strict ; en mode non strict le marqueur devient « nogit » (jamais l'ancien fichier).
 */
export function resolveBuildCommit({ env = {}, gitCommit, strict = false } = {}) {
  const platform = commitFromPlatform(env);
  const git = normalizeSha(gitCommit);
  const expected = normalizeSha(env.EXPECTED_BUILD_COMMIT);

  if (platform && git && platform.sha !== git) {
    const message = `Commit de la plateforme (${platform.key}=${platform.sha}) différent du HEAD Git (${git}).`;
    if (strict) throw new BuildMarkerError(`${message} Publication bloquée.`);
  }

  const commit = platform?.sha ?? git;
  const manual = normalizeSha(env[MANUAL_COMMIT_VARIABLE]);
  if (!commit && manual) {
    // Ni Git ni variable de plateforme : la valeur posée à la main n'est pas vérifiable (elle reste figée d'un build à l'autre).
    // Le build passe, mais le marqueur est « nogit » : jamais un ancien commit présenté comme le commit publié.
    return { commit: "nogit", source: "nogit", ignored: { key: MANUAL_COMMIT_VARIABLE, sha: manual } };
  }
  if (!commit) {
    if (strict) {
      throw new BuildMarkerError(
        "Aucun SHA Git fiable (variables de la plateforme ou .git). Publication bloquée : un identifiant WebDev, une empreinte de fichiers ou un ancien marqueur ne sont pas des commits."
      );
    }
    return { commit: "nogit", source: "nogit" };
  }

  if (strict && expected && expected !== commit) {
    throw new BuildMarkerError(`Commit attendu ${expected} différent du commit construit ${commit}. Publication bloquée.`);
  }

  const result = { commit, source: platform ? platform.key : "git" };
  // Valeur posée à la main différente du commit réel : ignorée (et signalée), elle ne bloque plus la publication.
  if (manual && manual !== commit) result.ignored = { key: MANUAL_COMMIT_VARIABLE, sha: manual };
  return result;
}
