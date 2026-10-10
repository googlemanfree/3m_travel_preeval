import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");
const hero = read("client/src/components/HeroSectionVIP.tsx");

describe("hero : lisibilité et hiérarchie", () => {
  it("le logo est compact et sans halo : il ne recouvre plus les visages de l'image de fond", () => {
    expect(hero).toContain("h-16 w-16");
    expect(hero).toContain("md:h-24 md:w-24");
    expect(hero).not.toContain("w-36 h-36");
    expect(hero).not.toContain("from-blue-500 via-indigo-500 to-sky-400 opacity-60 blur-md");
  });

  it("le voile est allégé pour laisser voir l’image de fond", () => {
    expect(hero).toContain("from-[#07162c]/45");
    expect(hero).toContain("via-[#0a1d3a]/35");
    expect(hero).toContain("to-[#07162c]/72");
    expect(hero).toContain("bg-[radial-gradient(ellipse_at_center,rgba(7,22,44,.28)_0%,transparent_72%)]");
    expect(hero).not.toContain("from-[#07162c]/75");
    expect(hero).not.toContain("rounded-2xl bg-[#020C3B]/45");
  });

  it("conserve une composition courte : marque, une phrase, deux CTA", () => {
    expect(hero).toContain("3M TRAVEL AGENCY");
    expect(hero).toContain("3M prépare et suit votre dossier — études, travail, visas.");
    expect(hero).toContain('data-testid="hero-cta-group"');
    expect(hero).toContain('data-testid="hero-tagline"');
    expect(hero).not.toContain("HERO_OFFERS");
    expect(hero).not.toContain("Évaluation Gratuite en 24h");
    expect(hero).not.toContain("Simulateur CRS Canada");
    expect(hero).not.toContain("Se connecter");
    expect(hero).not.toContain("Inscription");
  });

  it("le bouton principal d'évaluation gratuite reste le premier appel à l'action, en orange contrasté", () => {
    const cta = hero.indexOf("<PublicEvaluationCTA");
    expect(cta).toBeGreaterThan(hero.indexOf("3M prépare et suit votre dossier"));
    expect(cta).toBeLessThan(hero.indexOf("Parler à un conseiller"));
    expect(hero.slice(cta, cta + 900)).toContain("from-orange-400");
    expect(hero).toContain("Évaluer mon projet — gratuit");
    expect(hero).not.toContain("ÉVALUER MON PROJET — GRATUIT");
    expect(hero).not.toContain("PARLER À UN CONSEILLER");
  });

  it("est bilingue FR/EN via useLanguage", () => {
    expect(hero).toContain("useLanguage");
    expect(hero).toContain("3M prepares and follows your file — studies, work, visas.");
    expect(hero).toContain("Evaluate my project — free");
    expect(hero).toContain("Talk to an advisor");
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
});
