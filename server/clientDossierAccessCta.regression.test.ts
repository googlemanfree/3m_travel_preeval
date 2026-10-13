import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const navbarSource = readFileSync(resolve(import.meta.dirname, "../client/src/components/Navbar.tsx"), "utf8");
const heroSource = readFileSync(resolve(import.meta.dirname, "../client/src/components/HeroSectionVIP.tsx"), "utf8");
const clientNavigationSource = readFileSync(resolve(import.meta.dirname, "../client/src/components/ClientSpaceNavigation.tsx"), "utf8");

describe("CTA public et accès direct au dossier connecté", () => {
  it("retire le suivi de dossier de la navigation publique principale", () => {
    const menuItemsSource = navbarSource.slice(navbarSource.indexOf("const menuItems"), navbarSource.indexOf("const NAV_COPY"));
    expect(menuItemsSource).not.toContain('href: "/mon-espace"');
    expect(menuItemsSource).not.toContain("Suivi de dossier");
  });

  it("conserve le raccourci de dossier dans l’espace client sans nouvelle authentification", () => {
    expect(clientNavigationSource).toContain('href: "/mon-espace?section=dossier"');
    expect(clientNavigationSource).toContain("Suivre votre dossier actif et ses étapes");
  });

  it("renforce la taille du titre et du texte d’introduction du hero", () => {
    expect(heroSource).toContain("text-3xl font-black tracking-tight");
    expect(heroSource).toContain("sm:text-4xl md:text-5xl lg:text-6xl");
    expect(heroSource).toContain("text-xl font-bold tracking-tight");
    expect(heroSource).toContain("sm:text-2xl md:text-3xl");
    expect(heroSource).toContain("INTERNATIONAL_BRAND.slogan");
  });

});
