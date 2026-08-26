import { describe, expect, it } from "vitest";
import { composePublicPrerender } from "./publicPrerender";

const template = "<!doctype html><html lang=\"fr\"><head><title>Ancien titre</title><meta name=\"description\" content=\"ancienne description\" /><link rel=\"canonical\" href=\"https://www.3mtravelagency.com/\" /></head><body><div id=\"root\"><!--prerender-app--></div><script type=\"module\" src=\"/src/main.tsx\"></script></body></html>";

describe("pré-rendu public indexable", () => {
  it("produit un contenu initial, un titre et une canonical propres pour une page publique", () => {
    const rendered = composePublicPrerender(template, "/procedures");
    expect(rendered.status).toBe(200);
    expect(rendered.html).toContain("<h1>Procédures par destination</h1>");
    expect(rendered.html).toContain("RC/YAO/2019/A/2567 · NIU M112417203369H");
    expect(rendered.html).toContain('<link rel="canonical" href="https://www.3mtravelagency.com/procedures" />');
    expect((rendered.html.match(/<title>/g) ?? []).length).toBe(1);
  });

  it("respecte les plafonds SEO stricts de la page d’accueil", () => {
    const rendered = composePublicPrerender(template, "/");
    const title = rendered.html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    const description = rendered.html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    const keywords = rendered.html.match(/<meta name="keywords" content="([^"]*)"/)?.[1].split(", ") ?? [];
    const heading = rendered.html.match(/<h2>([^<]*)<\/h2>/)?.[1] ?? "";
    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(keywords.length).toBeGreaterThanOrEqual(3);
    expect(keywords.length).toBeLessThanOrEqual(8);
    expect(heading.length).toBeLessThanOrEqual(80);
    expect(rendered.html).toContain("3M Travel Agency | Mobilité internationale en confiance");
    expect(rendered.html).toContain("<h2>Informations vérifiables avant toute démarche</h2>");
  });

  it("garde toutes les routes de l’incident en shell 200 non indexable", () => {
    for (const path of ["/admin", "/document-upload", "/mes-vols-favoris", "/flights", "/mon-espace?section=profile"]) {
      const privatePage = composePublicPrerender(template, path);
      expect(privatePage.status, path).toBe(200);
      expect(privatePage.html, path).toContain('name="robots" content="noindex,follow"');
      expect(privatePage.html, path).toContain('data-prerendered="true"');
    }
  });

  it("renvoie une vraie 404 pour une page inconnue", () => {
    const missingPage = composePublicPrerender(template, "/route-inconnue");
    expect(missingPage.status).toBe(404);
    expect(missingPage.html).toContain("Page introuvable");
  });
});
