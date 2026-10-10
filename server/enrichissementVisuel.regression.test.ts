import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDestinationGallerySheet, proofFilterForProcedure } from "../client/src/data/destinationGallery";
import { FEATURED_AFRICA_CARRIERS } from "../client/src/data/flightDiscovery";
import { filterProofPhotos, PROOF_PHOTOS, proofFilterCounts } from "../client/src/data/proofPhotos";
import { isVisualAssetPathAllowed } from "../client/src/data/premiumVisuals";

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

  it("publie des preuves dédiées pour immigration et placements", () => {
    expect(filterProofPhotos(PROOF_PHOTOS, "immigration").length).toBeGreaterThan(0);
    expect(filterProofPhotos(PROOF_PHOTOS, "placements").length).toBeGreaterThan(0);
    expect(filterProofPhotos(PROOF_PHOTOS, "placements").every((photo) => photo.kind === "context")).toBe(true);
    expect(proofFilterCounts(PROOF_PHOTOS).map((entry) => entry.filter)).toEqual(
      expect.arrayContaining(["immigration", "placements"]),
    );
  });

  it("refuse les placeholders SVG dans les mappings visuels", () => {
    const visuals = read("client/src/data/premiumVisuals.ts");
    expect(visuals).not.toMatch(/\/manus-storage\/[^"']+\.svg(?:["'?])/i);
    expect(isVisualAssetPathAllowed("/manus-storage/real-photo.jpg")).toBe(true);
    expect(isVisualAssetPathAllowed("/manus-storage/placeholder.svg")).toBe(false);
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
    const gallery = read("client/src/components/ProofGallerySection.tsx");
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
    expect(gallery).toContain("proof-image-loading");
    expect(gallery).toContain("group-hover:scale-105");
    expect(gallery).toContain("Illustration contextuelle");
  });
});
