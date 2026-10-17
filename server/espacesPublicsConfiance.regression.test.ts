import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("espaces publics — confiance (audit candidat / partenaires)", () => {
  it("exige le consentement portrait et le WhatsApp à l’inscription candidat", () => {
    const register = read("client/src/pages/Register.tsx");
    expect(register).toContain('data-testid="portrait-consent"');
    expect(register).toContain("/politique-confidentialite");
    expect(register).toContain("portraitConsent");
    expect(register).toContain("un numéro WhatsApp avec indicatif");
    expect(register).not.toContain("register-facebook-coming-soon");
    expect(read("server/routers/candidate.ts")).toContain('phone: z.string().trim().min(8');
  });

  it("propose le choix de profil sur la page de connexion et un titre Connexion", () => {
    const login = read("client/src/pages/Login.tsx");
    const prerender = read("server/publicPrerender.ts");
    expect(login).toContain('data-testid="login-profile-choice"');
    expect(login).toContain("CORRIDOR_ROUTES.agenciesLogin");
    expect(login).toContain("CORRIDOR_ROUTES.employersLogin");
    expect(login).toContain('Connexion | 3M TRAVEL AGENCY');
    expect(login).not.toContain("facebook-coming-soon");
    expect(prerender).toContain('"/login": { title: `Connexion | ${SITE}`');
  });

  it("rend la licence et la charte obligatoires pour les agences, avec formulaires séparés", () => {
    const form = read("client/src/components/B2bPartnerRegistrationForm.tsx");
    const agency = read("client/src/pages/PlacementPartnerPortal.tsx");
    const employer = read("client/src/pages/EmployerPortal.tsx");
    expect(form).toContain("acknowledgeCharter");
    expect(form).toContain("requiresLicence");
    expect(form).toContain("b2b-access-terms");
    expect(agency).toContain("lockOrganizationType");
    expect(agency).toContain("agency-access-terms");
    expect(employer).toContain("lockOrganizationType");
    expect(employer).toContain("partner-access-terms");
  });

  it("assouplit le vocabulaire hub et montre une fiche anonymisée type", () => {
    const hub = read("client/src/pages/PartnersHub.tsx");
    expect(hub).toContain("Nos règles de partage");
    expect(hub).not.toContain("Règles de crédibilité pour les pubs internationales");
    expect(hub).not.toContain("Protocole N°02");
    expect(hub).toContain("anonymised-profile-sample");
    expect(hub).toContain("PRF-3M-4821");
    expect(hub).toContain("partners-access-terms");
  });
});
