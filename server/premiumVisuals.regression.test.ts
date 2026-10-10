import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getDestinationVisual,
  getServiceVisual,
  listDestinationVisualSlugs,
  normalizeDestinationSlug,
} from "../client/src/data/premiumVisuals";
import { SERVICE_POLES } from "../client/src/data/serviceCatalog";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("images premium — index intelligent", () => {
  it("couvre les destinations showcase et les procédures courantes", () => {
    const slugs = listDestinationVisualSlugs();
    expect(slugs.length).toBeGreaterThanOrEqual(20);
    for (const slug of ["france", "canada", "japon", "emirats", "luxembourg", "allemagne"]) {
      expect(getDestinationVisual(slug)?.desktop).toMatch(/^\/(manus-storage|photos-pays|photos-canada)\//);
    }
  });

  it("normalise les ids procédure vers un slug pays", () => {
    expect(normalizeDestinationSlug("france-travail")).toBe("france");
    expect(normalizeDestinationSlug("allemagne-formation")).toBe("allemagne");
    expect(normalizeDestinationSlug("united-kingdom")).toBe("royaume-uni");
    expect(normalizeDestinationSlug("japon-travail")).toBe("japon");
  });

  it("associe chaque service du catalogue à un visuel thématique", () => {
    for (const pole of SERVICE_POLES) {
      expect(getServiceVisual(pole.id).desktop).toBeTruthy();
      for (const service of pole.services) {
        const visual = getServiceVisual(service.id);
        expect(visual.desktop, service.id).toMatch(/^\/(manus-storage|photos-pays|photos-canada)\//);
        expect(visual.alt.length).toBeGreaterThan(8);
      }
    }
  });

  it("branche les pages services, destinations, visas et shells sur l’index", () => {
    const services = read("client/src/pages/Services.tsx");
    const hub = read("client/src/pages/DestinationsHub.tsx");
    const visa = read("client/src/pages/VisaEtudes.tsx");
    const shell = read("client/src/components/ServicePageShell.tsx");
    const overview = read("client/src/components/ServicesOverviewSection.tsx");
    expect(services).toContain("getServiceVisual");
    expect(services).toContain("PremiumCoverImage");
    expect(hub).toContain("getDestinationVisual");
    expect(visa).toContain("getDestinationVisual");
    expect(shell).toContain("heroVisual");
    expect(overview).toContain("getServiceVisual");
  });
});
