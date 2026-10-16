import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const form = readFileSync(resolve(root, "client/src/components/SimpleMultiProjectForm.tsx"), "utf8");
const candidateSpace = readFileSync(resolve(root, "client/src/pages/EvaluationSpace.tsx"), "utf8");
const adminDashboard = readFileSync(resolve(root, "client/src/pages/AdminDashboard.tsx"), "utf8");
const adminShortcuts = readFileSync(resolve(root, "client/src/components/AdminNavigationShortcuts.tsx"), "utf8");
const hero = readFileSync(resolve(root, "client/src/components/HeroSectionVIP.tsx"), "utf8");
const brand = readFileSync(resolve(root, "client/src/data/internationalBrand.ts"), "utf8");

describe("expérience candidat et navigation admin", () => {
  it("affiche un état de chargement neutre et protecteur", () => {
    expect(form).toContain("Préparation personnalisée en cours");
    expect(form).toContain("Vos pièces jointes ne sont pas concernées");
    expect(form).not.toContain("Gemini prépare votre brouillon d’orientation");
    expect(form).toContain('role="status"');
  });

  it("présente le statut d’évaluation et une checklist de documents au candidat connecté", () => {
    expect(candidateSpace).toContain("Évaluation reçue — examen en cours");
    expect(candidateSpace).toContain("Documents à compléter");
    expect(candidateSpace).toContain("DossierDocumentChecklist");
  });

  it("offre un fil d’Ariane et des raccourcis admin avec repères accessibles", () => {
    expect(adminDashboard).toContain('aria-label="Fil d’Ariane du pilotage admin"');
    expect(adminDashboard).toContain('aria-current="page"');
    expect(adminShortcuts).toContain('aria-label="Actions rapides de navigation admin"');
    expect(adminShortcuts).toContain("focus-visible:ring-2");
  });

  it("renforce la hiérarchie typographique du hero", () => {
    expect(hero).toContain('data-testid="hero-logo"');
    expect(hero).toContain("h-[6.5rem] w-[6.5rem] overflow-hidden rounded-full");
    expect(hero).toContain("sm:h-[7.5rem] sm:w-[7.5rem] md:h-[8.5rem] md:w-[8.5rem] lg:h-[9.5rem] lg:w-[9.5rem]");
    expect(hero).toContain("text-5xl font-extrabold uppercase tracking-tight");
    expect(hero).toContain("sm:text-6xl md:text-7xl lg:text-8xl xl:text-[6.25rem]");
    expect(hero).toContain("text-3xl font-black tracking-tight");
    expect(hero).toContain("sm:text-4xl md:text-5xl lg:text-6xl");
    expect(hero).toContain("INTERNATIONAL_BRAND.publicName");
    expect(hero).toContain("INTERNATIONAL_BRAND.slogan");
    expect(brand).toContain("L’Afrique vers le monde.");
  });

});
