import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "client/public/build-commit.json");
const commitPattern = /^[0-9a-f]{7,40}$/i;

function firstCommitFromEnv() {
  for (const key of [
    "PUBLIC_BUILD_COMMIT",
    "RAILWAY_GIT_COMMIT_SHA",
    "GIT_COMMIT",
    "SOURCE_COMMIT",
    "COMMIT_SHA",
    "BUILD_COMMIT",
    "BUILD_COMMIT_SHA",
    "SOURCE_VERSION",
    "COMMIT_REF",
    "CI_COMMIT_SHA",
    "GITHUB_SHA",
    "MANUS_BUILD_COMMIT",
    "MANUS_COMMIT_SHA",
    "MANUS_VERSION_ID",
    "MANUS_BUILD_ID",
    "WEBDEV_BUILD_COMMIT",
    "WEBDEV_COMMIT_SHA",
    "WEBDEV_VERSION_ID",
    "BUILD_ID",
    "RELEASE_ID",
    "VERCEL_GIT_COMMIT_SHA",
    "RENDER_GIT_COMMIT",
  ]) {
    const value = process.env[key]?.trim();
    if (value && commitPattern.test(value))
      return value.slice(0, 8).toLowerCase();
  }
}

function commitFromGit() {
  try {
    const value = execFileSync("git", ["rev-parse", "--short=8", "HEAD"], {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    })
      .toString()
      .trim();
    return commitPattern.test(value) ? value.toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}

function commitFromExistingMetadata() {
  try {
    const parsed = JSON.parse(readFileSync(output, "utf8"));
    return typeof parsed.commit === "string" &&
      commitPattern.test(parsed.commit)
      ? parsed.commit.slice(0, 8).toLowerCase()
      : undefined;
  } catch {
    return undefined;
  }
}

// WebDev peut construire dans une image sans .git et sans variable de commit.
// Son identifiant de checkpoint est alors injecté dans ce fichier généré.
// Il est utilisé uniquement après les variables de plateforme et Git, jamais
// avant une valeur plus fiable.
function commitFromWebDevMetadata() {
  for (const relativePath of [
    "client/public/__manus__/version.json",
    "__manus__/version.json",
    "version.json",
  ]) {
    try {
      const parsed = JSON.parse(
        readFileSync(resolve(root, relativePath), "utf8")
      );
      if (
        typeof parsed.version === "string" &&
        commitPattern.test(parsed.version)
      )
        return parsed.version.slice(0, 8).toLowerCase();
    } catch {
      // WebDev peut injecter la métadonnée à un emplacement différent selon le builder.
    }
  }
  return undefined;
}

// Dernier recours pour les builders qui retirent .git, les variables et les
// métadonnées ignorées du contexte Docker : l'empreinte du code source reste
// propre à cet arbre et ne peut pas servir accidentellement un ancien fichier.
function commitFromSourceFingerprint() {
  const ignored = new Set([
    ".git",
    "node_modules",
    "dist",
    "coverage",
    ".manus-logs",
    "client/public/build-commit.json",
    "client/public/__manus__/version.json",
  ]);
  const files = [];
  const visit = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = resolve(directory, entry.name);
      const relative = absolute.slice(root.length + 1);
      if (
        [...ignored].some(
          item => relative === item || relative.startsWith(`${item}/`)
        )
      )
        continue;
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(relative);
    }
  };
  visit(root);
  files.sort();
  const hash = createHash("sha256");
  for (const relative of files) {
    hash.update(relative);
    hash.update("\0");
    hash.update(readFileSync(resolve(root, relative)));
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 8);
}

const strictBuild = process.env.BUILD_STRICT_MARKER === "1";
const envCommit = firstCommitFromEnv();
const gitCommit = commitFromGit();
const webDevCommit = commitFromWebDevMetadata();
const sourceFingerprint = commitFromSourceFingerprint();
if (strictBuild && envCommit && gitCommit && envCommit !== gitCommit) {
  console.error(
    `[build-marker] Commit attendu ${envCommit} différent du HEAD Git ${gitCommit}. Publication bloquée.`
  );
  process.exit(1);
}

const commit =
  envCommit ??
  gitCommit ??
  webDevCommit ??
  sourceFingerprint ??
  (strictBuild ? undefined : commitFromExistingMetadata());
if (!commit) {
  const message =
    "[build-marker] Aucun identifiant de build fiable détecté (variables de plateforme, .git ou métadonnées WebDev). Publication bloquée pour éviter un marqueur périmé.";
  if (strictBuild) {
    console.error(message);
    process.exit(1);
  }
  console.warn(
    `${message} Le marqueur existant est conservé en mode non strict.`
  );
  process.exit(0);
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(
  output,
  `${JSON.stringify({ commit, generatedAt: new Date().toISOString() }, null, 2)}\n`
);
console.log(
  `[build-marker] Identifiant de build préparé : ${commit}${
    !envCommit && !gitCommit && !webDevCommit ? " (empreinte source)" : ""
  }`
);
