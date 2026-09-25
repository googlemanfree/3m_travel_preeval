import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");
const hero = read("client/src/components/HeroSectionVIP.tsx");
const app = read("client/src/App.tsx");

describe("hero : lisibilité et hiérarchie", () => {
  it("le logo est compact et sans halo : il ne recouvre plus les visages de l'image de fond", () => {
    expect(hero).toContain("w-16 h-16 md:w-24 md:h-24");
    expect(hero).not.toContain("w-36 h-36");
    expect(hero).not.toContain("from-blue-500 via-indigo-500 to-sky-400 opacity-60 blur-md");
  });

  it("le voile sombre couvre le centre du visuel (texte blanc lisible)", () => {
    expect(hero).toContain("from-[#07162c]/75");
    expect(hero).toContain("bg-[radial-gradient(ellipse_at_center,rgba(7,22,44,.55)_0%,transparent_70%)]");
  });

  it("le badge n'a qu'une étoile et la description est un slogan court suivi de repères à icônes", () => {
    expect(hero).not.toContain("⭐");
    expect(hero).toContain("Nous préparons votre dossier, de la demande jusqu'au suivi.");
    expect(hero).not.toContain("Immigration et visas</strong> (Canada, Europe Schengen, États-Unis)");
    expect(hero).toContain('data-testid="hero-offers"');
  });

  it("chaque repère renvoie vers une page existante du site", () => {
    const block = hero.slice(hero.indexOf("const HERO_OFFERS"), hero.indexOf("];", hero.indexOf("const HERO_OFFERS")));
    const hrefs = Array.from(block.matchAll(/href: "([^"]+)"/g)).map((match) => match[1].split("#")[0]);
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
    for (const href of hrefs) expect(app.includes(`path={"${href}"}`) || app.includes(`path="${href}"`), href).toBe(true);
  });

  it("le bouton principal d'évaluation gratuite reste le premier appel à l'action, en orange contrasté", () => {
    const cta = hero.indexOf("<PublicEvaluationCTA");
    expect(cta).toBeGreaterThan(hero.indexOf("Nous préparons votre dossier"));
    expect(cta).toBeLessThan(hero.indexOf("Discuter avec un Expert"));
    expect(hero.slice(cta, cta + 600)).toContain("from-orange-400");
  });
});
