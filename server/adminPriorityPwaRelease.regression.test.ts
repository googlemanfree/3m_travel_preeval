import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const indexHtml = readFileSync(resolve(import.meta.dirname, "../client/index.html"), "utf8");
const serviceWorker = readFileSync(resolve(import.meta.dirname, "../client/public/sw.js"), "utf8");

describe("révision PWA du poste administrateur", () => {
  it("enregistre une révision de service worker distincte pour évacuer les bundles périmés", () => {
    expect(indexHtml).toContain("2026-09-04-admin-bilan-online-reference-v1");
    expect(indexHtml).toContain("/sw.js?revision=");
    expect(indexHtml).toContain("updateViaCache: 'none'");
  });

  it("préserve le réseau d’abord pour les navigations et purge les anciens caches", () => {
    expect(serviceWorker).toContain("3m-travel-pwa-v38-admin-bilan-online-reference");
    expect(serviceWorker).toContain("keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))");
    expect(serviceWorker).toContain("if (event.request.mode === 'navigate')");
    expect(serviceWorker).toContain("fetch(event.request)");
    expect(serviceWorker).not.toContain("cache.put(event.request, responseClone)");
    expect(serviceWorker).not.toContain("Mode hors ligne - Données chargées depuis le cache local.");
  });
});
