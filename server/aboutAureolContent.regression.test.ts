import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("About / Aureol — contenu et mise en forme", () => {
  it("place la marque et Aureol en signal hero", () => {
    const about = read("client/src/pages/About.tsx");
    expect(about).toContain("3M TRAVEL AGENCY");
    expect(about).toContain("Aureol DONFACK");
    expect(about).toContain("Dirigée par Aureol DONFACK");
    expect(about).toContain('id="aureol-fondateur"');
    expect(about).toContain('data-testid="about-founder"');
    expect(about).toContain("min-h-[88svh]");
    expect(about).toContain("PremiumCoverImage");
  });

  it("évite les cartes dans le hero et structure le fondateur", () => {
    const about = read("client/src/pages/About.tsx");
    const heroSlice = about.slice(0, about.indexOf('id="aureol-fondateur"'));
    expect(heroSlice).not.toContain("<Card");
    expect(about).toContain("founder-heading");
    expect(about).toContain("/team/aureol-donfack-fondateur-pdg-3m-group-sarl");
  });

  it("relie Services et Destinations au positionnement 3M / Aureol", () => {
    const services = read("client/src/pages/Services.tsx");
    expect(services).toContain('eyebrow="3M TRAVEL AGENCY"');
    expect(services).toContain("Aureol DONFACK");
    expect(services).toContain('secondaryHref="/about"');

    const destinations = read("client/src/pages/DestinationsHub.tsx");
    expect(destinations).toContain("3M TRAVEL AGENCY");
    expect(destinations).toContain("Destinations d’accompagnement");
    expect(destinations).toContain("min-h-[88svh]");
    expect(destinations).toContain("bg-amber-500");
  });
});
