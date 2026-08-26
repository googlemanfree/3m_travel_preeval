import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const form = readFileSync(resolve(root, "client/src/components/SimpleMultiProjectForm.tsx"), "utf8");
const candidateSpace = readFileSync(resolve(root, "client/src/pages/EvaluationSpace.tsx"), "utf8");
const adminDashboard = readFileSync(resolve(root, "client/src/pages/AdminDashboard.tsx"), "utf8");
const adminShortcuts = readFileSync(resolve(root, "client/src/components/AdminNavigationShortcuts.tsx"), "utf8");
const hero = readFileSync(resolve(root, "client/src/components/HeroSectionVIP.tsx"), "utf8");

describe("expérience candidat et navigation admin", () => {
  it("affiche un état de chargement Gemini explicite et protecteur", () => {
    expect(form).toContain("Gemini prépare votre brouillon d’orientation");
    expect(form).toContain("Vos fichiers joints ne sont pas transmis à Gemini");
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
    expect(hero).toContain("text-5xl sm:text-6xl md:text-7xl lg:text-8xl");
    expect(hero).toContain("text-2xl md:text-3xl");
    expect(hero).toContain("text-lg md:text-xl");
  });
});
