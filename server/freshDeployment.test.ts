import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

describe("Chargement frais après déploiement", () => {
  it("force la recherche d’un nouveau service worker sans attendre le cache HTTP", () => {
    const source = fs.readFileSync(path.join(projectRoot, "client/index.html"), "utf8");
    const worker = fs.readFileSync(path.join(projectRoot, "client/public/sw.js"), "utf8");

    expect(source).toContain("updateViaCache: 'none'");
    expect(source).toContain("registration.update()");
    expect(source).toContain("controllerchange");
    expect(source).toContain("isPreviewHost");
    expect(source).toContain("registration.unregister()");
    expect(worker).toMatch(/const CACHE_NAME = '3m-travel-pwa-v\d+[a-z0-9-]*'/);
    expect(source).toContain("SW_REVISION");
    expect(source).toMatch(/const SW_REVISION = '\d{4}-\d{2}-\d{2}-[a-z0-9-]+'/);
    expect(source).toContain("/sw.js?revision=");
    expect(worker).toContain("IS_PREVIEW_HOST");
    expect(worker).toContain("SKIP_WAITING");
  });

  it("rend 3M Booking visible dès le haut de la page Billets", () => {
    const source = fs.readFileSync(path.join(projectRoot, "client/src/pages/Flights.tsx"), "utf8");

    const tabs = fs.readFileSync(path.join(projectRoot, "client/src/data/flightDiscovery.ts"), "utf8");

    // Le lien « Hôtels » des onglets de services mène à la section 3M Booking de la page ; /3m-booking y redirige.
    expect(tabs).toContain('href: "#3m-booking"');
    expect(source).toContain("3M Booking — Hôtels et séjours");
    expect(source).toContain('id="3m-booking"');
  });
});
