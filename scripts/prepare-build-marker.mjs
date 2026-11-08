import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "client/public/build-commit.json");
const commitPattern = /^[0-9a-f]{7,40}$/i;

function firstCommitFromEnv() {
  for (const key of [
    "PUBLIC_BUILD_COMMIT",
    "GIT_COMMIT",
    "SOURCE_COMMIT",
    "COMMIT_SHA",
    "GITHUB_SHA",
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

const strictBuild = process.env.BUILD_STRICT_MARKER === "1";
const envCommit = firstCommitFromEnv();
const gitCommit = commitFromGit();
if (strictBuild && envCommit && gitCommit && envCommit !== gitCommit) {
  console.error(
    `[build-marker] Commit attendu ${envCommit} différent du HEAD Git ${gitCommit}. Publication bloquée.`
  );
  process.exit(1);
}

const commit =
  envCommit ??
  gitCommit ??
  (strictBuild ? undefined : commitFromExistingMetadata());
if (!commit) {
  const message =
    "[build-marker] Aucun commit fiable détecté (PUBLIC_BUILD_COMMIT/GIT_COMMIT ou .git). Publication bloquée pour éviter un marqueur périmé.";
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
console.log(`[build-marker] Commit préparé : ${commit}`);
