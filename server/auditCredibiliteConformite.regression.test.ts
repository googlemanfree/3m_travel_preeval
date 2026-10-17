import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COMPANY_PROFILE } from "../client/src/lib/companyContacts";
import { PROOF_PHOTOS } from "../client/src/data/proofPhotos";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("audit crédibilité / conformité (17 oct 2026)", () => {
  it("expose une page Mentions légales et y redirige le pied de page", () => {
    const app = read("client/src/App.tsx");
    const footer = read("client/src/components/Footer.tsx");
    const page = read("client/src/pages/MentionsLegales.tsx");
    expect(app).toContain('path={"/mentions-legales"}');
    expect(app).toContain("MentionsLegales");
    expect(footer).toContain('href: "/mentions-legales"');
    expect(footer).not.toMatch(/useful_terms[\s\S]*Mentions légales[\s\S]*conditions-utilisation/);
    expect(page).toContain("Directeur de la publication");
    expect(page).toContain("Hébergeur");
    expect(page).toContain("legalIdentifiers.registration");
    expect(page).toContain("legalIdentifiers.taxpayerId");
  });

  it("affiche raison sociale + enseigne + rôle de la société mère", () => {
    expect(COMPANY_PROFILE.legalName).toBe("3M Travel Agency SARL");
    expect(COMPANY_PROFILE.legalDisplayName).toContain("enseigne 3M TRAVEL AGENCY");
    expect(COMPANY_PROFILE.groupRole).toContain("3M Group SARL");
    expect(read("client/src/pages/Contact.tsx")).toContain("legalDisplayName");
    expect(read("client/src/pages/ConditionsUtilisation.tsx")).toContain("legalDisplayName");
  });

  it("aligne les horaires Yaoundé sur lun–sam 8h–18h", () => {
    expect(COMPANY_PROFILE.offices.cameroon.openingHours.join(" ")).toMatch(/Lun–sam/);
    expect(COMPANY_PROFILE.offices.cameroon.openingHours.join(" ")).toMatch(/08 h 00 – 18 h 00/);
    expect(COMPANY_PROFILE.offices.cameroon.openingHours.join(" ")).not.toMatch(/20 h/);
  });

  it("retire l’illustration placements des preuves et exige le consentement", () => {
    expect(PROOF_PHOTOS.some((photo) => photo.kind === "context")).toBe(false);
    expect(PROOF_PHOTOS.some((photo) => photo.category === "placements")).toBe(false);
    expect(read("client/src/components/ProofGallerySection.tsx")).toContain("consentement écrit");
  });

  it("allège le menu candidat et place le corridor B2B après les preuves", () => {
    const navbar = read("client/src/components/Navbar.tsx");
    expect(navbar).not.toContain('href: "/partenaires"');
    expect(navbar).not.toContain('href: "/guide-procedures"');
    const home = read("client/src/pages/Home.tsx");
    const proofsIdx = home.indexOf("<ProofGallerySection");
    const corridorIdx = home.indexOf('id="home-talent-corridor"');
    expect(proofsIdx).toBeGreaterThan(0);
    expect(corridorIdx).toBeGreaterThan(proofsIdx);
  });

  it("redirige 3mtravelagency.click vers le .com en 301", () => {
    const server = read("server/_core/index.ts");
    expect(server).toContain("3mtravelagency.click");
    expect(server).toContain("res.redirect(301");
    expect(server).toContain("www.3mtravelagency.com");
  });
});
