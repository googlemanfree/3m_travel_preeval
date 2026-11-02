import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const html = readFileSync(resolve(import.meta.dirname, "..", "client", "index.html"), "utf8").replace(/\r/g, "");

describe("démarrage : pas de pré-rendu brut visible avant le premier rendu React", () => {
  it("masque le pré-rendu à l'écran (sans le retirer du DOM) tant que React n'a pas démarré et que le démarrage n'est pas lent", () => {
    expect(html).toContain("html.js-enabled:not(.app-ready):not(.app-boot-slow) .seo-prerender { visibility: hidden; height: 0; overflow: hidden; }");
    // Jamais display:none à ce stade : le contenu reste dans le DOM pour les moteurs de recherche.
    const rule = html.split("\n").find((line) => line.includes("html.js-enabled:not(.app-ready):not(.app-boot-slow) .seo-prerender"))!;
    expect(rule).not.toContain("display: none");
  });

  it("affiche un indicateur de chargement à la place, et le retire dès app-ready", () => {
    expect(html).toContain("html.js-enabled:not(.app-ready):not(.app-boot-slow) #root::before");
    expect(html).toContain("@keyframes boot-spin");
    expect(html).toContain("prefers-reduced-motion: reduce");
  });

  it("garde-fous existants intacts : visible sans JS, visible si le démarrage est lent, masqué après app-ready", () => {
    expect(html).toContain("html.app-ready .seo-prerender { display: none !important; }");
    expect(html).toContain("html.app-boot-slow:not(.app-ready) .seo-prerender { display: block !important; }");
    expect(html).not.toContain("html.js-enabled .seo-prerender");
    // Le masquage ne s'applique que si js-enabled : sans JavaScript, le pré-rendu reste lisible.
    const hideRules = html.split("\n").filter((line) => line.includes(".seo-prerender") && line.includes("visibility: hidden"));
    expect(hideRules.every((line) => line.includes("html.js-enabled"))).toBe(true);
  });
});
