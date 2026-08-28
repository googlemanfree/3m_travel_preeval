import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const main = readFileSync(resolve(projectRoot, "client/src/main.tsx"), "utf8");
const errorBoundary = readFileSync(resolve(projectRoot, "client/src/components/ErrorBoundary.tsx"), "utf8");
const serviceWorker = readFileSync(resolve(projectRoot, "client/public/sw.js"), "utf8");

describe("récupération des routes protégées après déploiement", () => {
  it("force les appels tRPC privés à consulter le réseau plutôt qu’un cache navigateur", () => {
    expect(main).toContain('cache: "no-store"');
    expect(main).toContain('credentials: "include"');
  });

  it("interdit au service worker de réutiliser ou de fabriquer une réponse API hors ligne", () => {
    const apiHandler = serviceWorker.slice(serviceWorker.indexOf("if (url.pathname.startsWith('/api/'))"), serviceWorker.indexOf("if (event.request.mode === 'navigate')"));
    expect(apiHandler).toContain("event.respondWith(fetch(event.request))");
    expect(apiHandler).not.toContain("caches.match");
    expect(apiHandler).not.toContain("new Response");
  });

  it("ne prétend pas nettoyer le cache quand l’erreur de rendu n’est pas une erreur de module", () => {
    expect(errorBoundary).toContain("isChunkLoadError(this.state.error)");
    expect(errorBoundary).toContain("Un élément de cette page a rencontré un problème temporaire");
    expect(errorBoundary).toContain("this.setState({ hasError: false, error: null })");
  });
});
