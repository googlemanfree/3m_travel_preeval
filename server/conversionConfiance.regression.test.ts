import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { composePublicPrerender } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const template =
  '<!doctype html><html lang="fr"><head><title>x</title></head><body><div id="root"><!--prerender-app--></div></body></html>';

describe("conversion & confiance publique", () => {
  it("corrige HowItWorks : évaluation publique, pas open-dossier ni taux de succès", () => {
    const page = read("client/src/pages/HowItWorks.tsx");
    expect(page).toContain("/?project=travail#evaluation-multi");
    expect(page).not.toContain("/open-dossier");
    expect(page).not.toMatch(/taux de succès/i);
    expect(page).not.toMatch(/obtenir votre visa/i);
    expect(page).toContain("how-it-works-eval-cta");
  });

  it("oriente les hubs études/travail vers l’évaluation publique", () => {
    expect(read("client/src/pages/VisaEtudes.tsx")).toContain("/?project=etudes#evaluation-multi");
    expect(read("client/src/pages/VisaEtudes.tsx")).not.toContain("/evaluation?destination=etudes");
    expect(read("client/src/pages/VisaTravail.tsx")).toContain("WhatsApp conseiller");
    expect(read("client/src/pages/Ressources.tsx")).toContain("WhatsApp conseiller");
  });

  it("renforce le hero et l’empty-state avis avec preuves réelles", () => {
    expect(read("client/src/components/HeroSectionVIP.tsx")).toContain("hero-trust-strip");
    expect(read("client/src/components/HeroSectionVIP.tsx")).toContain('href="#evaluation-multi"');
    const reviews = read("client/src/components/ApprovedReviewsSection.tsx");
    expect(reviews).toContain("ProofGallerySection");
    expect(reviews).toContain("En attendant les avis publiés");
  });

  it("pré-rend how-it-works sans promesse de visa", () => {
    const result = composePublicPrerender(template, "/how-it-works");
    expect(result.status).toBe(200);
    expect(result.html).toMatch(/sans promesse de visa|autorités/i);
  });
});
