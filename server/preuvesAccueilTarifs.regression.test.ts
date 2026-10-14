import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("lot preuves, accueil allégé et tarifs chiffrés", () => {
  it("place la triade Études / Travail / Voyage-visa avant les autres services", () => {
    const home = read("client/src/pages/Home.tsx");
    const primary = read("client/src/components/HomePrimaryPathsSection.tsx");
    expect(home).toContain("HomePrimaryPathsSection");
    expect(home.indexOf("<HomePrimaryPathsSection />")).toBeLessThan(home.indexOf("<QuickActionsSection />"));
    expect(primary).toContain('data-testid="home-primary-paths"');
    expect(primary).toContain("Études");
    expect(primary).toContain("Travail");
    expect(primary).toContain("Voyage / visa");
    expect(read("client/src/components/QuickActionsSection.tsx")).toContain("Autres services utiles");
  });

  it("charge les preuves dès que la section est visible (eager + IntersectionObserver)", () => {
    const gallery = read("client/src/components/ProofGallerySection.tsx");
    expect(gallery).toContain("sectionInView");
    expect(gallery).toContain("IntersectionObserver");
    expect(gallery).toContain("<ProofImage photo={photo} priority />");
    expect(gallery).toContain('loading="eager"');
    expect(gallery).not.toContain('loading={priority ? "eager" : "lazy"}');
  });

  it("publie fourchettes et exemple de devis avant les blocs génériques sur /tarifs", () => {
    const tarifs = read("client/src/pages/Tarifs.tsx");
    expect(tarifs.indexOf("tarifs-fee-examples")).toBeLessThan(tarifs.indexOf("tarifs-sample-devis"));
    expect(tarifs.indexOf("tarifs-sample-devis")).toBeLessThan(tarifs.indexOf("tarifs-concrete"));
    expect(tarifs).toContain("65 000 – 150 000 FCFA");
    expect(tarifs).toContain("200 000 – 450 000 FCFA");
    expect(tarifs).toContain("350 000 – 800 000 FCFA");
    expect(tarifs).toContain("<table");
    expect(read("client/public/sw.js")).toContain("3m-travel-pwa-v51-preuves-accueil-tarifs");
  });
});
