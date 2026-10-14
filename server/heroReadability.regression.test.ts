import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");
const hero = read("client/src/components/HeroSectionVIP.tsx");
const brand = read("client/src/data/internationalBrand.ts");

describe("hero : lisibilité et hiérarchie", () => {
  it("affiche la composition maquette : marque, slogan Afrique, catégories, deux CTA", () => {
    expect(hero).toContain("3M TRAVEL AGENCY");
    expect(hero).toContain("INTERNATIONAL_BRAND");
    expect(hero).toContain('data-testid="hero-logo"');
    expect(hero).toContain("logoUrl");
    expect(hero).toContain("h-20 w-20 rounded-full");
    expect(hero).toContain("lg:h-32 lg:w-32");
    expect(hero).toContain("text-4xl font-extrabold uppercase tracking-tight text-white");
    expect(hero).toContain("slogan");
    expect(hero).toContain("headline");
    expect(hero).toContain("categories");
    expect(hero).toContain("heroBody");
    expect(hero).toContain("heroTrust");
    expect(hero).toContain('data-testid="hero-cta-group"');
    expect(hero).toContain('data-testid="hero-title"');
    expect(hero).toContain('data-testid="hero-tagline"');
    expect(hero).toContain('data-testid="hero-support"');
    expect(hero).toContain('data-testid="hero-corridor"');
    expect(brand).toContain("L’Afrique vers le monde.");
    expect(brand).toContain("Votre projet international commence ici.");
    expect(hero).not.toContain("HERO_OFFERS");
    expect(hero).not.toContain("Évaluation Gratuite en 24h");
    expect(hero).not.toContain("Simulateur CRS Canada");
    expect(hero).not.toContain("Se connecter");
    expect(hero).not.toContain("Inscription");
  });

  it("le bouton principal d'évaluation gratuite reste le premier appel à l'action, en orange contrasté", () => {
    const cta = hero.indexOf("<PublicEvaluationCTA");
    expect(cta).toBeGreaterThan(hero.indexOf('data-testid="hero-tagline"'));
    expect(cta).toBeLessThan(hero.indexOf("cta.advisor"));
    expect(hero.slice(cta, cta + 900)).toContain("from-orange-400");
    expect(hero).toContain("cta.evaluate");
    expect(hero).not.toContain("ÉVALUER MON PROJET — GRATUIT");
    expect(hero).not.toContain("PARLER À UN CONSEILLER");
  });

  it("est bilingue FR/EN via useLanguage et INTERNATIONAL_BRAND", () => {
    expect(hero).toContain("useLanguage");
    expect(hero).toContain("INTERNATIONAL_BRAND.slogan.fr");
    expect(hero).toContain("INTERNATIONAL_BRAND.slogan.en");
    expect(hero).toContain("INTERNATIONAL_BRAND.cta.evaluate");
    expect(hero).toContain("INTERNATIONAL_BRAND.cta.advisor");
  });

  it("anime l’apparition en fondu, renforce le survol des CTA et propose un indicateur de défilement", () => {
    expect(hero).toContain("const fadeIn");
    expect(hero).toContain('data-testid="hero-title"');
    expect(hero).toContain("hover:-translate-y-1.5 hover:scale-[1.04]");
    expect(hero).toContain("group-hover:translate-x-full");
    expect(hero).toContain('data-testid="hero-scroll-cue"');
    expect(hero).toContain('href="#home-talent-corridor"');
    expect(hero).toContain("animate-bounce motion-reduce:animate-none");
    expect(hero).not.toContain("repeat: Infinity");
  });

  it("laisse la photo occuper le hero et garde le texte lisible sans carte blanche", () => {
    expect(hero).not.toContain("bg-[#f5f5f5]");
    expect(hero).toContain("text-white drop-shadow-");
    expect(hero).toContain('data-testid="hero-background-image"');
    expect(hero).toContain("3m-hero-real-woman-man_f9790b0e.webp");
    expect(hero).toContain("3m-hero-real-woman-man-mobile_335e606e.webp");
    expect(hero).not.toContain("from-[#07162c]/75");
  });
});
