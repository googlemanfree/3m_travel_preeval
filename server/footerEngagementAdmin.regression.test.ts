import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("Statistiques d’engagement du footer", () => {
  it("protège la lecture agrégée par une session administrateur valide", () => {
    const source = read("server/routers/footerEngagement.ts");
    expect(source).toContain("requireValidAdminSession(input.sessionToken)");
    expect(source).toContain("groupBy");
    expect(source).toContain("count(*)");
    expect(source).not.toContain("ipAddress");
  });

  it("offre une vue admin avec état vide et actualisation manuelle", () => {
    const source = read("client/src/components/AdminFooterEngagement.tsx");
    expect(source).toContain("footerEngagement.getSummary.useQuery");
    expect(source).toContain("sessionToken");
    expect(source).toContain("Aucun clic n’est encore enregistré");
    expect(source).toContain("Actualiser");
  });

  it("centralise les synonymes de recherche et les libellés du menu bilingue", () => {
    const sitemap = read("client/src/pages/Sitemap.tsx");
    const navbar = read("client/src/components/Navbar.tsx");
    expect(sitemap).toContain("SITEMAP_SYNONYMS");
    expect(sitemap).toContain("flight");
    expect(sitemap).toContain("whatsapp");
    expect(navbar).toContain("NAV_COPY");
    expect(navbar).toContain('en: "Home"');
    expect(navbar).toContain('en: "Quick assessment"');
  });
});
