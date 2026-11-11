import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

/**
 * Constat du 2026-11-11 : après un déploiement, un navigateur déjà venu affichait l'ancienne version (en-tête sans
 * recherche, ancien marqueur de build). Deux causes : HTML public en « max-age=300 + stale-while-revalidate=86400 »
 * et marqueur de build servi depuis le cache du service worker.
 */
describe("une nouvelle version s'affiche tout de suite après un déploiement", () => {
  it("le HTML public est revalidé à chaque visite : plus de max-age ni de stale-while-revalidate", () => {
    const server = read("server/_core/vite.ts");
    expect(server).toContain('"public, max-age=0, s-maxage=60, must-revalidate"');
    expect(server).not.toContain("stale-while-revalidate");
    expect(server).not.toContain("max-age=300");
  });

  it("les pages privées restent en no-store", () => {
    expect(read("server/_core/vite.ts")).toContain('"private, no-store"');
  });

  it("le service worker ne sert jamais build-commit.json depuis son cache", () => {
    const worker = read("client/public/sw.js").replace(/\r\n/g, "\n");
    const rule = worker.indexOf("url.pathname === '/build-commit.json'");
    expect(rule).toBeGreaterThan(-1);
    expect(worker.slice(rule, rule + 120)).toContain("event.respondWith(fetch(event.request))");
    // La règle précède le dernier cas « cache d'abord » qui servait l'ancien fichier.
    expect(rule).toBeLessThan(worker.indexOf("caches.match(event.request).then((cachedResponse) => {\n      if (cachedResponse) return cachedResponse;\n      return fetch"));
  });
});
