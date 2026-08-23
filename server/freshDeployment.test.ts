import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

describe("Chargement frais après déploiement", () => {
  it("force la recherche d’un nouveau service worker sans attendre le cache HTTP", () => {
    const source = fs.readFileSync(path.join(projectRoot, "client/index.html"), "utf8");
    const worker = fs.readFileSync(path.join(projectRoot, "client/public/sw.js"), "utf8");
    const versionedWorker = fs.readFileSync(path.join(projectRoot, "client/public/sw-v7.js"), "utf8");

    expect(source).toContain("updateViaCache: 'none'");
    expect(source).toContain("registration.update()");
    expect(source).toContain("controllerchange");
    expect(source).toContain("isPreviewHost");
    expect(source).toContain("registration.unregister()");
    expect(worker).toContain("3m-travel-pwa-v6-jinko-booking-flow");
    expect(source).toContain("SW_REVISION");
    expect(source).toContain("/sw-v7.js?revision=");
    expect(versionedWorker).toContain("3m-travel-pwa-v7-admin-priority-release");
    expect(worker).toContain("IS_PREVIEW_HOST");
    expect(worker).toContain("SKIP_WAITING");
  });

  it("rend 3M Booking visible dès le haut de la page Billets", () => {
    const source = fs.readFileSync(path.join(projectRoot, "client/src/pages/Flights.tsx"), "utf8");

    expect(source).toContain('href="#3m-booking"');
    expect(source).toContain("3M Booking — Hôtels & séjours");
    expect(source).toContain('id="3m-booking"');
  });
});
