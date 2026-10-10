import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDestinationGallerySheet, proofFilterForProcedure } from "../client/src/data/destinationGallery";
import { FEATURED_AFRICA_CARRIERS } from "../client/src/data/flightDiscovery";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("enrichissement visuel complet", () => {
  it("expose une fiche galerie unique par destination cataloguée", () => {
    const france = getDestinationGallerySheet("france-travail");
    expect(france?.slug).toBe("france");
    expect(france?.hero.desktop).toMatch(/^\/(manus-storage|photos-pays)\//);
    expect(france?.gallery.length).toBeGreaterThan(0);
  });

  it("mappe les contextes procédure vers un filtre de preuves", () => {
    expect(proofFilterForProcedure("etudes")).toBe("etudes");
    expect(proofFilterForProcedure("immigration")).toBe("immigration");
    expect(proofFilterForProcedure("visiteur")).toBe("visas");
  });

  it("enrichit les compagnies aériennes avec hub et corridor", () => {
    expect(FEATURED_AFRICA_CARRIERS.length).toBeGreaterThanOrEqual(8);
    for (const carrier of FEATURED_AFRICA_CARRIERS) {
      expect(carrier.hub.length).toBeGreaterThan(2);
      expect(carrier.corridor.length).toBeGreaterThan(2);
      expect(carrier.logo).toContain("http");
    }
  });

  it("branche preuves contextuelles, hero dynamique, tourisme, admin services et SEO", () => {
    const country = read("client/src/pages/CountryDetailPage.tsx");
    const services = read("client/src/pages/Services.tsx");
    const tourism = read("client/src/pages/Tourism.tsx");
    const admin = read("client/src/pages/AdminDestinationMedia.tsx");
    const seo = read("client/src/lib/pageSeo.ts");
    const prerender = read("server/publicPrerender.ts");
    expect(country).toContain("DestinationVisualSheet");
    expect(country).toContain("ProofGallerySection");
    expect(country).toContain("setPageSeo");
    expect(services).toContain("hashchange");
    expect(services).toContain("listPublic");
    expect(tourism).toContain("PremiumCoverImage");
    expect(admin).toContain("admin-media-services-tab");
    expect(admin).toContain("CATALOG_SERVICE_ENTITIES");
    expect(seo).toContain("og:image");
    expect(prerender).toContain("getCataloguedDestinationImage");
    expect(prerender).toContain("getServiceVisual");
  });

  it("enrichit les pages publiques encore pauvres (hero + preuves + SEO)", () => {
    const pages = [
      "client/src/pages/HowItWorks.tsx",
      "client/src/pages/Contact.tsx",
      "client/src/pages/Tarifs.tsx",
      "client/src/pages/About.tsx",
      "client/src/pages/Evisa.tsx",
      "client/src/pages/Evaluation.tsx",
    ];
    for (const path of pages) {
      const source = read(path);
      expect(source, path).toContain("PremiumCoverImage");
      expect(source, path).toContain("getServiceVisual");
      expect(source, path).toContain("setPageSeo");
    }
    for (const path of pages.filter((p) => !p.includes("Evaluation"))) {
      expect(read(path), path).toContain("ProofGallerySection");
    }
  });
});
