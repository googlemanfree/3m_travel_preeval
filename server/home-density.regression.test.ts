import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const home = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
const canada = readFileSync(resolve(root, "client/src/pages/Canada.tsx"), "utf8");

describe("accueil allégé et accès CRS", () => {
  it("conserve le hero, l’évaluation principale et les accès rapides", () => {
    expect(home).toContain("<HeroSectionVIP");
    expect(home).toContain('href="/canada#simulateur-crs-canada"');
    expect(home).toContain('aria-label="Retour en haut de la page"');
    expect(home).toContain('window.scrollTo({ top: 0, behavior: "smooth" })');
    expect(home).toContain('hover:-translate-y-1 hover:border-blue-500');
    expect(home).toContain('initial={{ opacity: 0, y: 18 }}');
    expect(home).toContain('whileInView={{ opacity: 1, y: 0 }}');
    expect(home).toContain('id="evaluation-multi"');
    expect(home).toContain("Choisissez votre prochaine étape");
    expect(home).toContain('href="/procedures"');
    expect(home).toContain('href="/ressources"');
  });

  it("pointe explicitement vers le simulateur CRS de la page Canada", () => {
    expect(home).toContain('href="/canada#simulateur-crs-canada"');
    expect(home).toContain("Ouvrir le simulateur CRS Canada");
    expect(canada).toContain('id="simulateur-crs-canada"');
    const hero = readFileSync(resolve(root, "client/src/components/HeroSectionVIP.tsx"), "utf8");
    expect(hero).toContain("Simulateur CRS Canada");
    expect(hero).toContain('const heroButtonSize = "w-full max-w-[22rem] min-h-14 sm:w-[300px]";');
    expect(hero).toContain(">Populaire</span>");
    expect(hero).toContain("items-center gap-3 sm:flex-row");
  });

  it("retire les widgets lourds détaillés de l’accueil au profit du hub compact", () => {
    expect(home).not.toContain("<EmbassyNewsWidget />");
    expect(home).not.toContain("<CurrencyConverterWidget />");
    expect(home).not.toContain("<TravelSearchHero />");
    expect(home).not.toContain("<FacebookFeedSection />");
  });
});
