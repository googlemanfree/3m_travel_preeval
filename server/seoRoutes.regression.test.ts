import { describe, expect, it } from "vitest";
import { renderOgImageSvg } from "./seoAssets";
import { buildShareUrls } from "@/components/SocialShareButtons";
import { renderRobotsTxt, renderSitemapXml } from "./seoRoutes";
import { composePublicPrerender, getIndexablePublicPaths } from "./publicPrerender";

const template = "<!doctype html><html><head><title>old</title><meta name=\"description\" content=\"old\" /></head><body><div id=\"root\"><!--prerender-app--></div></body></html>";

describe("SEO dynamique", () => {
  it("génère une image sociale avec le titre et le chemin demandés, échappés en XML", () => {
    const svg = renderOgImageSvg("Canada & procédures", "/canada");
    expect(svg).toContain("Canada &amp; procédures");
    expect(svg).toContain("/canada");
    expect(svg).toContain('width="1200" height="630"');
    expect(renderOgImageSvg("")).toContain("3M Travel Agency");
  });

  it("génère un sitemap avec les routes indexables et robots avec les espaces privés bloqués", () => {
    const sitemap = renderSitemapXml();
    expect(sitemap).toContain("https://www.3mtravelagency.com/");
    expect(sitemap).toContain("https://www.3mtravelagency.com/procedures");
    expect(sitemap).toContain("https://www.3mtravelagency.com/procedures/allemagne-travail");
    expect(getIndexablePublicPaths().filter((path) => path.startsWith("/procedures/")).length).toBeGreaterThanOrEqual(107);
    expect(sitemap).not.toContain("/admin");
    expect(renderRobotsTxt()).toContain("Sitemap: https://www.3mtravelagency.com/sitemap.xml");
    expect(renderRobotsTxt()).toContain("Disallow: /admin");
  });

  it("génère un BlogPosting pour la page éditoriale Blog", () => {
    const html = composePublicPrerender(template, "/blog").html;
    expect(html).toContain('"@type":"BlogPosting"');
    expect(html).toContain('"headline":"Ressources mobilité internationale | 3M Travel & Services"');
  });

  it("construit des URL de partage encodées pour les trois réseaux", () => {
    const urls = buildShareUrls("https://www.3mtravelagency.com/blog?topic=visa&lang=fr", "Guide Canada & Schengen");
    expect(urls.facebook).toContain("%26lang%3Dfr");
    expect(urls.twitter).toContain("Guide%20Canada%20%26%20Schengen");
    expect(urls.linkedin).toContain("share-offsite");
  });

  it("ajoute un BreadcrumbList aux sous-pages publiques indexables", () => {
    for (const path of ["/canada", "/contact", "/procedures"]) {
      const html = composePublicPrerender(template, path).html;
      expect(html).toContain('"@type":"BreadcrumbList"');
      expect(html).toContain('"name":"Accueil"');
      expect(html).toContain(`"item":"https://www.3mtravelagency.com${path}"`);
    }
  });

  it("expose une FAQPage sur /procedures avec les mêmes questions que la FAQ visible", () => {
    const html = composePublicPrerender(template, "/procedures").html;
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"@type":"Question"');
    expect(html).toContain("L’évaluation gratuite engage-t-elle une procédure ?");
    expect(html).toContain("Questions fréquentes");
    expect(html).toContain("Oui. Créez d’abord votre compte");
  });

  it("ne sert pas le placeholder de maintenance sur la route d’évaluation protégée", () => {
    const html = composePublicPrerender(template, "/evaluation").html;
    expect(html).toContain("Évaluation préalable de votre projet");
    expect(html).toContain("Connectez-vous pour compléter votre évaluation");
    expect(html).not.toContain("This site is under maintenance");
    expect(html).not.toContain("Site under maintenance");
  });

  it("pré-rend un contenu réel propre à chaque page publique prioritaire", () => {
    const contact = composePublicPrerender(template, "/contact").html;
    const sources = composePublicPrerender(template, "/sources-officielles").html;
    const procedures = composePublicPrerender(template, "/procedures").html;
    const evisas = composePublicPrerender(template, "/evisas").html;
    const pricing = composePublicPrerender(template, "/tarifs").html;
    const sitemap = composePublicPrerender(template, "/plan-du-site").html;

    expect(contact).toContain("+237 698 104 832");
    expect(contact).toContain("hello@3mtravelagency.com");
    expect(sources).toContain("Immigration, Réfugiés et Citoyenneté Canada");
    expect(sources).toContain("Ouvrir la source officielle");
    expect(procedures).toContain("107 procédures par destination");
    expect(procedures).toContain("/procedures/allemagne-visiteur");
    expect(evisas).toContain("Annuaire des procédures e-Visa");
    expect(evisas).toContain("Kenya");
    expect(pricing).toContain("Comprendre les tarifs avant de vous engager");
    expect(sitemap).toContain("Accéder rapidement aux services 3M Travel");
  });
});
