import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const markerPath = resolve(root, "client/public/build-commit.json");
const commitPattern = /^[0-9a-f]{7,40}$/i;

function expectedCommit() {
  for (const key of ["EXPECTED_BUILD_COMMIT", "PUBLIC_BUILD_COMMIT", "GIT_COMMIT", "SOURCE_COMMIT", "COMMIT_SHA", "GITHUB_SHA"]) {
    const value = process.env[key]?.trim();
    if (value && commitPattern.test(value)) return value.slice(0, 8).toLowerCase();
  }
  return undefined;
}

let marker;
try {
  marker = JSON.parse(readFileSync(markerPath, "utf8")).commit;
} catch {
  console.error(`[build-marker] Fichier absent ou JSON invalide : ${markerPath}`);
  process.exit(1);
}

if (typeof marker !== "string" || !commitPattern.test(marker) || marker.toLowerCase() === "nogit") {
  console.error(`[build-marker] Marqueur invalide : ${String(marker)}`);
  process.exit(1);
}

const expected = expectedCommit();
if (expected && marker.slice(0, 8).toLowerCase() !== expected) {
  console.error(`[build-marker] Marqueur ${marker} différent du commit attendu ${expected}. Publication bloquée.`);
  process.exit(1);
}

console.log(`[build-marker] Validation OK : ${marker.slice(0, 8).toLowerCase()}${expected ? ` (attendu ${expected})` : ""}`);
