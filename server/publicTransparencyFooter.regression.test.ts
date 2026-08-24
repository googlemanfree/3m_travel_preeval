import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("transparence publique et footer consolidé", () => {
  it("retire les chiffres, garanties, certifications et témoignages non étayés de la page À propos", () => {
    const about = read("client/src/pages/About.tsx");
    expect(about).not.toContain("500+");
    expect(about).not.toContain("98%");
    expect(about).not.toContain("Résultats garantis");
    expect(about).not.toContain("ISO 9001");
    expect(about).not.toContain("Agréé ONU");
    expect(about).not.toContain("Alain Fouda");
    expect(about).toContain("notre mode d’accompagnement, et non des résultats garantis");
  });

  it("retire les garanties tarifaires non documentées et explique les frais tiers", () => {
    const tarifs = read("client/src/pages/Tarifs.tsx");
    expect(tarifs).not.toContain("50% des frais");
    expect(tarifs).not.toContain("Permis Garanti");
    expect(tarifs).not.toContain("Garantie satisfaction");
    expect(tarifs).toContain("frais gouvernementaux, consulaires, médicaux, biométriques");
    expect(tarifs).toContain("Aucune garantie générale de");
    expect(tarifs).toContain('TechnicalTerm label="remboursement"');
  });

  it("conserve un seul footer partagé sur l’accueil", () => {
    const home = read("client/src/pages/Home.tsx");
    const legalFooter = read("client/src/components/FooterLegal.tsx");
    expect(home).toContain("<FooterLegal />");
    expect(home).not.toContain('<footer id="contact"');
    expect((home.match(/<FooterLegal\s*\/>/g) ?? [])).toHaveLength(1);
    expect(legalFooter).toContain("return <Footer />");
  });
});
