// Empreinte du code source embarqué dans un build, écrite à côté du commit dans build-commit.json (champ « sourceHash »).
// Ce n'est PAS un commit : c'est une preuve indépendante des variables de la plateforme. Deux builds du même code donnent la même
// empreinte ; la comparer à celle d'un dépôt local (`node scripts/source-hash.mjs`) montre si le site en ligne contient bien ce code.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const DIRS = ["client/src", "server", "shared", "drizzle"];
const FILES = ["package.json", "pnpm-lock.yaml"];
const EXTENSIONS = /\.(ts|tsx|json|css|sql)$/;
const SKIP = new Set(["node_modules", "dist", ".git"]);

function walk(root, dir, out) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir).sort()) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(root, full, out);
    else if (EXTENSIONS.test(name)) out.push(relative(root, full).split("\\").join("/"));
  }
}

export function computeSourceHash(root) {
  const files = [];
  for (const dir of DIRS) walk(root, join(root, dir), files);
  for (const file of FILES) if (existsSync(join(root, file))) files.push(file);
  files.sort();
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(`${file}\0`);
    hash.update(readFileSync(join(root, file)));
    hash.update("\0");
  }
  return `${hash.digest("hex").slice(0, 16)}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(computeSourceHash(resolve(import.meta.dirname, "..")));
}
