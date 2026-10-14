import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PUBLIC_CATALOGUE_STATS,
  PUBLIC_DESTINATION_PAGE_COUNT,
} from "../client/src/lib/publicDestinationCatalog";
import { formatCatalogueComposition, formatCatalogueFichesLabel } from "../shared/procedureCatalogStats";
import { PROOF_PHOTOS } from "../client/src/data/proofPhotos";
import { TARIFS_FEE_EXAMPLES } from "../client/src/data/pageEnrichment";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("cohérence catalogue, médias et tarifs (lot confiance)", () => {
  it("harmonise accueil et /procedures sur les mêmes compteurs (fiches ≠ destinations)", () => {
    expect(PUBLIC_CATALOGUE_STATS.ficheCount).toBe(PUBLIC_DESTINATION_PAGE_COUNT);
    expect(PUBLIC_CATALOGUE_STATS.ficheCount).toBe(107);
    expect(PUBLIC_CATALOGUE_STATS.destinationCount).toBe(58);
    expect(
      PUBLIC_CATALOGUE_STATS.documentedProcedureCount + PUBLIC_CATALOGUE_STATS.evisaFicheCount,
    ).toBe(PUBLIC_CATALOGUE_STATS.ficheCount);

    const home = read("client/src/components/ServicesOverviewSection.tsx");
    const procedures = read("client/src/pages/ProceduresAdvanced.tsx");
    for (const source of [home, procedures]) {
      expect(source).toContain("PUBLIC_CATALOGUE_STATS");
      expect(source).toContain("formatCatalogueFichesLabel");
      expect(source).toContain("CATALOGUE_COMPOSITION");
      expect(source).not.toContain("91 procédures sur 42 destinations");
      expect(source).not.toMatch(/\{PUBLIC_PROCEDURES\.length\} destinations/);
    }
    expect(formatCatalogueFichesLabel(107, 58)).toBe("107 fiches sur 58 destinations");
    expect(formatCatalogueComposition(91, 16, 107)).toBe(
      "91 procédures documentées + 16 fiches e-Visa = 107 fiches au total",
    );
  });

  it("évite les skeletons avis / preuves bloqués indéfiniment", () => {
    const reviews = read("client/src/components/ApprovedReviewsSection.tsx");
    expect(reviews).toContain("REVIEWS_LOAD_TIMEOUT_MS");
    expect(reviews).toContain("loadTimedOut");
    expect(reviews).toContain("isError");
    expect(reviews).toContain("retry: 1");
    expect(reviews).toContain("approved-reviews-loading");
    expect(reviews).toContain("client réel");
    expect(reviews).not.toMatch(/témoignage inventé|fabriqué pour l’affichage/i);

    const gallery = read("client/src/components/ProofGallerySection.tsx");
    expect(gallery).toContain("IntersectionObserver");
    expect(gallery).toContain("sectionInView");
    expect(gallery).toContain('loading="eager"');
    expect(gallery).toContain("naturalWidth");
    expect(gallery).toContain("rootMargin");
  });

  it("chaque preuve locale existe et les fourchettes d’honoraires sont publiées", () => {
    expect(PROOF_PHOTOS.length).toBeGreaterThanOrEqual(19);
    for (const photo of PROOF_PHOTOS) {
      expect(photo.src.startsWith("/proof-photos/")).toBe(true);
      expect(existsSync(resolve(root, "client/public", photo.src.slice(1))), photo.src).toBe(true);
    }
    expect(TARIFS_FEE_EXAMPLES.length).toBeGreaterThanOrEqual(3);
    const tarifs = read("client/src/pages/Tarifs.tsx");
    expect(tarifs).toContain("tarifs-fee-examples");
    expect(tarifs).toContain("tarifs-sample-devis");
    expect(read("client/public/sw.js")).toContain("3m-travel-pwa-v51-preuves-accueil-tarifs");
  });
});
