import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { BuildMarkerError, normalizeSha, resolveBuildCommit } from "./build-marker-resolve.mjs";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "client/public/build-commit.json");

function commitFromGit() {
  try {
    return execFileSync("git", ["rev-parse", "--short=8", "HEAD"], {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

const strict = process.env.BUILD_STRICT_MARKER === "1";

let resolved;
try {
  resolved = resolveBuildCommit({ env: process.env, gitCommit: commitFromGit(), strict });
} catch (error) {
  if (error instanceof BuildMarkerError) {
    console.error(`[build-marker] ${error.message}`);
    process.exit(1);
  }
  throw error;
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(
  output,
  `${JSON.stringify({ commit: resolved.commit, generatedAt: new Date().toISOString() }, null, 2)}\n`
);

// Relecture : le fichier écrit doit contenir exactement le commit résolu (ou « nogit » hors mode strict).
const written = JSON.parse(readFileSync(output, "utf8")).commit;
const matches = resolved.commit === "nogit" ? written === "nogit" : normalizeSha(written) === resolved.commit;
if (!matches) {
  console.error(`[build-marker] Le marqueur écrit (${written}) ne correspond pas au commit résolu (${resolved.commit}). Publication bloquée.`);
  process.exit(1);
}

console.log(`[build-marker] Commit préparé : ${resolved.commit} (source : ${resolved.source})`);
