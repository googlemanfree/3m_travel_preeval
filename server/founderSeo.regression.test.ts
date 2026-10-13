import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  COMPANY_FOUNDER,
  COMPANY_PROFILE,
  GROUP_LEGAL_NAME,
} from "../client/src/lib/companyContacts";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("SEO fondateur — Aureol DONFACK / 3M Group SARL", () => {
  it("centralise le fondateur et le nom de groupe dans companyContacts", () => {
    expect(GROUP_LEGAL_NAME).toBe("3M Group SARL");
    expect(COMPANY_PROFILE.groupLegalName).toBe("3M Group SARL");
    expect(COMPANY_PROFILE.legalName).toBe("3M Travel Agency SARL");
    expect(COMPANY_FOUNDER.name).toBe("Aureol DONFACK");
    expect(COMPANY_FOUNDER.organization).toBe("3M Group SARL");
    expect(COMPANY_FOUNDER.aboutPath).toBe("/about");
  });

  it("la page About conserve le SEO fondateur côté SPA (titre, photo, JSON-LD)", () => {
    const about = read("client/src/pages/About.tsx");
    expect(about).toContain("COMPANY_FOUNDER");
    expect(about).toContain("GROUP_LEGAL_NAME");
    expect(about).toContain("fondateur et PDG de {GROUP_LEGAL_NAME}");
    expect(about).toContain("setPageSeo");
    expect(about).toContain("FOUNDER.imageHd");
    expect(about).toContain('"@type": "Person"');
    expect(about).toContain("about#aureol-donfack");
    expect(about).toContain("legalName: GROUP_LEGAL_NAME");
  });

  it("le footer cite le fondateur et le groupe", () => {
    const footer = read("client/src/components/Footer.tsx");
    expect(footer).toContain("COMPANY_FOUNDER");
    expect(footer).toContain("GROUP_LEGAL_NAME");
    expect(footer).toContain("/about#aureol-donfack");
  });
});
