import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const contacts = readFileSync(resolve(root, "client/src/lib/companyContacts.ts"), "utf8");
const prerender = readFileSync(resolve(root, "server/publicPrerender.ts"), "utf8");
const flights = readFileSync(resolve(root, "client/src/pages/Flights.tsx"), "utf8");
const footer = readFileSync(resolve(root, "client/src/components/Footer.tsx"), "utf8");

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
});
