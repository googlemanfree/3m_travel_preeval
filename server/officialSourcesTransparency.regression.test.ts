import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("coordonnées, sources institutionnelles et transparence tarifaire", () => {
  it("définit les coordonnées publiques et légales dans une configuration canonique", () => {
    const config = read("client/src/lib/companyContacts.ts");
    const contact = read("client/src/pages/Contact.tsx");
    expect(config).toContain("COMPANY_PROFILE");
    expect(config).toContain("publicEmail");
    expect(config).toContain("legalIdentifiers");
    expect(config).toContain("cameroon");
    expect(config).toContain("ottawa");
    expect(config).toContain("Heure du Cameroun (WAT)");
    expect(contact).toContain("COMPANY_PROFILE");
    expect(contact).toContain("officeMapEmbedUrl");
  });

  it("expose une page dédiée aux portails institutionnels vérifiés", () => {
    const page = read("client/src/pages/OfficialSources.tsx");
    const router = read("client/src/App.tsx");
    expect(page).toContain("OFFICIAL_CONSULAR_PORTALS");
    expect(page).toContain("Les exigences peuvent changer");
    expect(page).toContain("Canada");
    expect(page).toContain("États-Unis");
    expect(router).toContain('path={"/sources-officielles"}');
  });

  it("propose un filtre, une date vérifiée et un signalement sans modification automatique", () => {
    const page = read("client/src/pages/OfficialSources.tsx");
    expect(page).toContain("setDestination");
    expect(page).toContain("Toutes les destinations");
    expect(page).toContain("Dernière vérification");
    expect(page).toContain("Signalement de source officielle");
    expect(page).toContain("mailto:");
    expect(page).not.toContain("fetch(");
  });

  it("affiche les libellés français de vérification sans provoquer une erreur de rendu", () => {
    const page = read("client/src/pages/OfficialSources.tsx");
    expect(page).toContain("Number.isNaN(parsed.getTime())");
    expect(page).toContain("return value");
  });

  it("clarifie les frais tiers et les limites de remboursement dans une FAQ interactive", () => {
    const tariffs = read("client/src/pages/Tarifs.tsx");
    expect(tariffs).toContain("Accordion");
    expect(tariffs).toContain("Quels frais peuvent être facturés par des tiers");
    expect(tariffs).toContain("Existe-t-il un remboursement automatique");
    expect(tariffs).toContain("ne sont jamais présumés remboursables");
    expect(tariffs).toContain("TooltipProvider");
    expect(tariffs).toContain("frais tiers");
    expect(tariffs).toContain("remboursement");
  });
});
