import { describe, expect, it } from "vitest";
import { renderOgImageSvg } from "./seoAssets";
import { renderRobotsTxt, renderSitemapXml } from "./seoRoutes";
import { composePublicPrerender } from "./publicPrerender";

const template = "<!doctype html><html><head><title>old</title><meta name=\"description\" content=\"old\" /></head><body><div id=\"root\"><!--prerender-app--></div></body></html>";

describe("SEO dynamique", () => {
  it("génère une image sociale avec le titre et le chemin demandés, échappés en XML", () => {
    const svg = renderOgImageSvg("Canada & procédures", "/canada");
    expect(svg).toContain("Canada &amp; procédures");
    expect(svg).toContain("/canada");
    expect(svg).toContain('width="1200" height="630"');
  });

  it("génère un sitemap avec les routes indexables et robots avec les espaces privés bloqués", () => {
    const sitemap = renderSitemapXml();
    expect(sitemap).toContain("https://www.3mtravelagency.com/");
    expect(sitemap).toContain("https://www.3mtravelagency.com/procedures");
    expect(sitemap).not.toContain("/admin");
    expect(renderRobotsTxt()).toContain("Sitemap: https://www.3mtravelagency.com/sitemap.xml");
    expect(renderRobotsTxt()).toContain("Disallow: /admin");
  });

  it("expose une FAQPage sur /procedures avec les mêmes questions que la FAQ visible", () => {
    const html = composePublicPrerender(template, "/procedures").html;
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('"@type":"Question"');
    expect(html).toContain("L’évaluation gratuite engage-t-elle une procédure ?");
  });
});
