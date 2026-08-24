import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const reviewsPage = readFileSync(resolve(projectRoot, "client/src/pages/Avis.tsx"), "utf8");
const socialSection = readFileSync(resolve(projectRoot, "client/src/components/FacebookFeedSection.tsx"), "utf8");
const footer = readFileSync(resolve(projectRoot, "client/src/components/Footer.tsx"), "utf8");
const hero = readFileSync(resolve(projectRoot, "client/src/components/HeroSectionVIP.tsx"), "utf8");

describe("page publique des avis", () => {
  it("ne fabrique ni témoignage, ni note, ni statistique attribuée à des clients", () => {
    expect(reviewsPage).toContain("Nous ne publions pas de notes, statistiques ou témoignages attribués à des clients sans source vérifiable");
    expect(reviewsPage).not.toContain("const testimonials");
    expect(reviewsPage).not.toContain("const stats");
    expect(reviewsPage).not.toContain("Aminata Diallo");
    expect(reviewsPage).not.toContain("Taux de Succès");
  });

  it("n’affiche pas de fil social, newsletter ou satisfaction simulés", () => {
    expect(socialSection).not.toContain("MOCK_FB_POSTS");
    expect(socialSection).not.toContain("FACEBOOK_REVIEWS");
    expect(socialSection).not.toContain("Avis Vérifiés");
    expect(footer).not.toContain("Inscription reussie !");
    expect(footer).not.toContain("new Promise(resolve => setTimeout(resolve, 1000))");
    expect(hero).not.toContain("Clients Satisfaits");
    expect(hero).not.toContain("Dossiers Traités avec Succès");
  });
});
