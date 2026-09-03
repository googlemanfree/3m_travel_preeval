import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const home = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
const canada = readFileSync(resolve(root, "client/src/pages/Canada.tsx"), "utf8");

describe("accueil allégé et accès CRS", () => {
  it("conserve le hero, l’évaluation principale et les accès rapides", () => {
    expect(home).toContain("<HeroSectionVIP");
    expect(home).toContain('id="evaluation-multi"');
    expect(home).toContain("Choisissez votre prochaine étape");
    expect(home).toContain('href="/procedures"');
    expect(home).toContain('href="/ressources"');
  });

  it("pointe explicitement vers le simulateur CRS de la page Canada", () => {
    expect(home).toContain('href="/canada#simulateur-crs-canada"');
    expect(home).toContain("Ouvrir le simulateur CRS Canada");
    expect(canada).toContain('id="simulateur-crs-canada"');
  });

  it("retire les widgets lourds détaillés de l’accueil au profit du hub compact", () => {
    expect(home).not.toContain("<EmbassyNewsWidget />");
    expect(home).not.toContain("<CurrencyConverterWidget />");
    expect(home).not.toContain("<TravelSearchHero />");
    expect(home).not.toContain("<FacebookFeedSection />");
  });
});
