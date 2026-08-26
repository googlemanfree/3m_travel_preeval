import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("récupération globale des chunks et du cache client", () => {
  it("nettoie les service workers et Cache Storage avant le rechargement", () => {
    const helper = read("client/src/lib/lazyWithTimeout.ts");
    const boundary = read("client/src/components/ErrorBoundary.tsx");
    const bootstrap = read("client/src/main.tsx");

    expect(helper).toContain("export async function clearStaleClientCaches");
    expect(helper).toContain("serviceWorker?.getRegistrations?.()");
    expect(helper).toContain("caches.keys()");
    expect(boundary).toContain("await clearStaleClientCaches()");
    expect(bootstrap).toContain("clearStaleClientCaches().finally(() => window.location.reload())");
  });

  it("n’affiche plus un diagnostic trompeur de mise à jour obligatoire", () => {
    const boundary = read("client/src/components/ErrorBoundary.tsx");
    expect(boundary).toContain("Cette page n’a pas pu être chargée");
    expect(boundary).not.toContain("Oups, une mise à jour est requise");
  });
});

export {};

