import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { DOCUMENT_VAULT_POLICY } from "../shared/documentVaultPolicy";
import { INTERNATIONAL_BRAND } from "../client/src/data/internationalBrand";
import { tryCanonicalAureolAnswer } from "../shared/aureolSiteKnowledge";

const root = resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

describe("lot publish complet — demandes regroupées", () => {
  it("Aureol répond correctement sur le bureau Canada", () => {
    const a = tryCanonicalAureolAnswer("vous n'avez pas de bureau au canada ?");
    expect(a).toMatch(/Ottawa/i);
    expect(a?.toLowerCase()).not.toMatch(/unique agence|pas de bureau/);
  });

  it("voix panafricaine (pas Yaoundé-only)", () => {
    expect(INTERNATIONAL_BRAND.corridor).toMatch(/Afrique/i);
    expect(INTERNATIONAL_BRAND.audienceLine.fr).toMatch(/à distance/i);
    expect(INTERNATIONAL_BRAND.heroBody.fr).toMatch(/candidats et projets africains/i);
    const footer = read("client/src/components/Footer.tsx");
    expect(footer).toContain("de l’Afrique vers le monde");
    expect(footer).not.toContain("de Yaoundé vers le monde");
  });

  it("coffre : politique accès / conservation / notifications exposée", () => {
    expect(DOCUMENT_VAULT_POLICY.title).toBe("Coffre-fort documentaire");
    const panel = read("client/src/components/CaseDocumentsPanel.tsx");
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(panel).toContain("coffre-policy-summary");
    expect(panel).toContain("DOCUMENT_VAULT_POLICY");
    expect(space).toContain("client-coffre-hero");
    expect(space).toContain("coffre-fort documentaire");
    expect(space).toContain("Ouvrir le coffre documentaire");
  });

  it("logo premium HD TRAVEL AGENCY sur surfaces publiques", () => {
    expect(existsSync(resolve(root, "client/public/logo-3m.webp"))).toBe(true);
    expect(existsSync(resolve(root, "client/public/logo-3m-hd.webp"))).toBe(true);
    expect(read("client/src/components/HeroSectionVIP.tsx")).toContain("/logo-3m-hd.webp");
    expect(read("client/src/pages/Home.tsx")).toContain("/logo-3m-hd.webp");
    expect(read("client/src/components/Navbar.tsx")).toContain("/logo-3m.webp");
    expect(read("client/public/sw.js")).toContain("3m-travel-pwa-v49-suite-suivante");
  });
});

