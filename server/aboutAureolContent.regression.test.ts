import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("About / Aureol — fondateur discret, pas sur l’accueil", () => {
  it("About : marque en hero, fondateur en mention texte sans portrait", () => {
    const about = read("client/src/pages/About.tsx");
    expect(about).toContain("3M TRAVEL AGENCY");
    expect(about).toContain("Qui sommes-nous");
    expect(about).toContain("Aureol DONFACK");
    expect(about).toContain('id="aureol-fondateur"');
    expect(about).toContain('data-testid="about-founder"');
    expect(about).toContain("min-h-[88svh]");
    expect(about).toContain("PremiumCoverImage");
    expect(about).not.toContain("Dirigée par Aureol DONFACK");
    expect(about).not.toContain("/team/aureol-donfack");
    expect(about).not.toContain("<img");
    expect(about).not.toContain("Rencontrer le fondateur");
  });

  it("évite les cartes dans le hero et garde une ancre fondateur", () => {
    const about = read("client/src/pages/About.tsx");
    const heroStart = about.indexOf("{/* Hero plein écran");
    const founderStart = about.indexOf('id="aureol-fondateur"');
    const heroJsx = about.slice(heroStart, founderStart);
    expect(heroJsx).not.toContain("<Card");
    expect(heroJsx).not.toContain("Aureol DONFACK");
    expect(heroJsx).toContain("Qui sommes-nous");
    expect(about).toContain("founder-heading");
  });

  it("Services et Destinations ne mettent pas le fondateur en avant", () => {
    const services = read("client/src/pages/Services.tsx");
    expect(services).toContain('eyebrow="3M TRAVEL AGENCY"');
    expect(services).not.toContain("Aureol DONFACK");
    expect(services).toContain('secondaryHref="/about"');
    expect(services).toContain("À propos de 3M");

    const destinations = read("client/src/pages/DestinationsHub.tsx");
    expect(destinations).toContain("3M TRAVEL AGENCY");
    expect(destinations).not.toContain("Aureol DONFACK");
    expect(destinations).toContain("min-h-[88svh]");

    const home = read("client/src/pages/Home.tsx");
    const hero = read("client/src/components/HeroSectionVIP.tsx");
    expect(home).not.toContain("Aureol DONFACK");
    expect(home).not.toContain("Dirigée par");
    expect(home).not.toContain("/team/aureol-donfack");
    expect(hero).not.toContain("Aureol DONFACK");
    expect(hero).not.toContain("Dirigée par");
  });
});
