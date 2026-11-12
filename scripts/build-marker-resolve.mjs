// Détermination du commit publié. Aucune entrée n'est inventée : seul un SHA Git valide (fourni par la plateforme ou lu dans .git)
// peut devenir le marqueur. Un identifiant WebDev, une empreinte de fichiers ou un ancien build-commit.json ne sont JAMAIS des commits.

export const COMMIT_PATTERN = /^[0-9a-f]{7,40}$/i;

/** Variables posées par les plateformes d'intégration / d'hébergement, par ordre de priorité. */
export const PLATFORM_COMMIT_VARIABLES = [
  "PUBLIC_BUILD_COMMIT",
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

  return { commit, source: platform ? platform.key : "git" };
}
