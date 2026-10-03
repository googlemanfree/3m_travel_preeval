import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PUBLIC_PAGES, composePublicPrerender } from "./publicPrerender";

const source = readFileSync(new URL("../client/src/pages/CanadaCrsPage.tsx", import.meta.url), "utf8");
const shell = '<!doctype html><html><head><title>t</title></head><body><div id="root"><!--prerender-app--></div></body></html>';

describe("/canada/crs — contenu éditorial autour de la calculatrice", () => {
  it("explique le barème CRS par grande famille de facteurs, sans dupliquer la calculatrice", () => {
    expect(source).toContain("Comment fonctionne le barème CRS ?");
    expect(source).toContain("Facteurs liés au capital humain");
    expect(source).toContain("Compétences linguistiques, par compétence");
    expect(source).toContain("Transférabilité des compétences");
    expect(source).toContain("plus accordés depuis le 25 mars 2025");
  });

  it("donne des leviers concrets si le score est sous le seuil, avec un lien vers les parcours détaillés", () => {
    expect(source).toContain("Score sous le seuil : les leviers les plus courants");
    expect(source).toContain('href="/canada#voies-canada"');
  });

  it("répond aux questions les plus probables dans une FAQ dédiée", () => {
    expect(source).toContain("Questions fréquentes sur le score CRS");
    expect(source).toContain("Le score calculé ici est-il exactement celui d’IRCC ?");
    expect(source).toContain("chaque compétence linguistique séparément");
  });

  it("reste une page publique indexable après l'ajout du contenu éditorial", () => {
    const meta = PUBLIC_PAGES["/canada/crs"];
    expect(meta).toBeDefined();
    expect(meta.noindex).not.toBe(true);
    const rendered = composePublicPrerender(shell, "/canada/crs");
    expect(rendered.status).toBe(200);
    expect(rendered.noindex).toBe(false);
  });
});
