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
    const app = read("client/src/App.tsx");
    const home = read("client/src/pages/Home.tsx");
    const legalFooter = read("client/src/components/FooterLegal.tsx");
    expect(app).toContain("{showPublicFooter && <FooterLegal />}");
    expect(app).toContain('const showPublicFooter = !location.startsWith("/admin")');
    expect(home).not.toContain("<FooterLegal />");
    expect(home).not.toContain('<footer id="contact"');
    expect(legalFooter).toContain("return <Footer />");
    const footer = read("client/src/components/Footer.tsx");
    expect(footer).toContain("MINI_SITE_MAP");
    expect(footer).toContain("Mini-plan du site");
    expect(footer).toContain('href: "/sources-officielles"');
    expect(footer).toContain("FOOTER_SHORTCUT_CLASS");
    expect(footer).toContain("hover:translate-x-1");
    expect(footer).toContain("focus-visible:ring-2");
    expect(footer).toContain("motion-reduce:transition-none");
    expect(footer).toContain('role="tooltip"');
    expect(footer).toContain("aria-describedby");
    expect(footer).toContain("useReducedMotion");
    expect(footer).toContain("enableSocialMotion");
    expect(footer).toContain("useLanguage");
    expect(footer).toContain("footerEngagement.record.useMutation");
    expect(footer).toContain("surface: \"footer_shortcut\"");
    expect(footer).toContain("surface: \"footer_social\"");
    const sitemap = read("client/src/pages/Sitemap.tsx");
    expect(sitemap).toContain("SITE_SECTIONS");
    expect(sitemap).toContain("Plan du site 3M Travel & Services");
    expect(sitemap).toContain('href: "/sources-officielles"');
    expect(sitemap).toContain('id="sitemap-search"');
    expect(sitemap).toContain("setLanguage(item)");
    expect(sitemap).toContain("noResultsTitle");
    const engagementRouter = read("server/routers/footerEngagement.ts");
    expect(engagementRouter).toContain("footerEngagementEvents");
    expect(engagementRouter).toContain("requireValidAdminSession");
    expect(app).toContain('path={"/plan-du-site"} component={Sitemap}');
  });
});
