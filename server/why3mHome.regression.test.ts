import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const home = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
const company = readFileSync(resolve(root, "client/src/lib/companyContacts.ts"), "utf8");

describe("accueil : bloc Pourquoi 3M basé sur des faits vérifiables", () => {
  it("présente quatre preuves concrètes avec liens utiles", () => {
    expect(home).toContain('data-testid="why-3m-section"');
    expect(home).toContain("Des preuves concrètes, pas des promesses vagues");
    expect(home).toContain("Agence physique à Yaoundé");
    expect(home).toContain("Dossiers réellement traités");
    expect(home).toContain("Sources officielles");
    expect(home).toContain("Suivi dans votre espace");
    expect(home).toContain('href: "#proof-gallery-title"');
    expect(home).toContain('href: "/sources-officielles"');
    expect(home).toContain('href: "/login"');
    expect(home).toContain('href: "/contact"');

  });

  it("s’appuie sur le profil légal réel de l’agence, sans taux de succès inventé", () => {
    expect(home).toContain("COMPANY_PROFILE");
    expect(home).toContain("legalIdentifiers.registration");
    expect(company).toContain("RC/YAO/2019/A/2567");
    expect(home).not.toContain("Expertise réglementée");
    expect(home).not.toContain("Taux de succès");
    expect(home).not.toContain("98%");
    expect(home).toContain("la décision finale reste celle des autorités compétentes");
  });
});
