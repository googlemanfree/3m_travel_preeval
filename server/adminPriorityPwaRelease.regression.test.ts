import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const indexHtml = readFileSync(resolve(import.meta.dirname, "../client/index.html"), "utf8");
const serviceWorker = readFileSync(resolve(import.meta.dirname, "../client/public/sw.js"), "utf8");

describe("révision PWA du poste administrateur", () => {
  it("enregistre une révision de service worker distincte pour évacuer les bundles périmés", () => {
    expect(indexHtml).toContain("2026-08-26-route-hotfix-c6a2c54a");
    expect(indexHtml).toContain("/sw.js?revision=");
    expect(indexHtml).toContain("updateViaCache: 'none'");
  });

  it("préserve le réseau d’abord pour les navigations et purge les anciens caches", () => {
    expect(serviceWorker).toContain("3m-travel-pwa-v34-premium-hover-interactions-static");
    expect(serviceWorker).toContain("keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))");
    expect(serviceWorker).toContain("if (event.request.mode === 'navigate')");
    expect(serviceWorker).toContain("fetch(event.request)");
  });
});
