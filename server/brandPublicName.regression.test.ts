import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const contacts = read("client/src/lib/companyContacts.ts");
const prerender = read("server/publicPrerender.ts");
const flights = read("client/src/pages/Flights.tsx");
const footer = read("client/src/components/Footer.tsx");
const og = read("server/seoAssets.ts");
const manifest = read("client/public/manifest.json");
const sw = read("client/public/sw.js");
const brand = read("client/src/data/internationalBrand.ts");
const procedureData = read("shared/procedureData.ts");

describe("marque publique 3M TRAVEL AGENCY", () => {
  it("centralise BRAND_PUBLIC_NAME = 3M TRAVEL AGENCY", () => {
    expect(contacts).toContain('export const BRAND_PUBLIC_NAME = "3M TRAVEL AGENCY"');
    expect(contacts).toContain("publicName: BRAND_PUBLIC_NAME");
  });

  it("utilise la marque dans le SEO public (og:site_name)", () => {
    expect(prerender).toContain("BRAND_PUBLIC_NAME");
    expect(prerender).toContain("const SITE = BRAND_PUBLIC_NAME");
    expect(prerender).not.toContain('const SITE = "3M TRAVEL AGENCY"');
    expect(prerender).toContain("Billets d'avion internationaux");
  });

  it("affiche 3M TRAVEL AGENCY sur /flights et le footer", () => {
    expect(flights).toContain('data-testid="flights-hero-brand"');
    expect(flights).toMatch(/3M TRAVEL AGENCY/);
    expect(flights).not.toContain("3M Travel & Services");
    expect(footer).toContain("3M TRAVEL AGENCY");
    expect(footer).toContain("COMPANY_PROFILE.publicName");
  });

  it("retire Travel & Services des surfaces publiques prioritaires (OG, PWA, SW, fiches, hero)", () => {
    expect(og).toContain("3M TRAVEL AGENCY");
    expect(og).not.toContain("TRAVEL &amp; SERVICES");
    expect(og).not.toContain("Travel &amp; Services");
    expect(manifest).toContain('"name": "3M TRAVEL AGENCY"');
    expect(manifest).not.toContain("Travel & Services");
    expect(sw).toContain("3M TRAVEL AGENCY");
    expect(sw).not.toContain("Travel & Services");
    expect(brand).toContain("3M TRAVEL AGENCY vous accompagne");
    expect(brand).not.toContain("3M Travel Agency vous accompagne");
    expect(procedureData).not.toContain("3M Travel & Services");
    expect(procedureData).not.toContain("3M TRAVEL & SERVICES");
  });

  it("conserve la dénomination juridique dans le profil société", () => {
    expect(contacts).toContain('legalName: "3M Travel Agency SARL"');
    expect(contacts).toContain("3M Group SARL");
  });
});
