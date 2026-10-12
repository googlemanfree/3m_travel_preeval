import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8").replace(/\r\n/g, "\n");

function ruleBody(selector: string): string {
  const start = css.indexOf(selector);
  expect(start, `règle « ${selector} » introuvable`).toBeGreaterThan(-1);
  const open = css.indexOf("{", start);
  return css.slice(open + 1, css.indexOf("}", open));
}

describe("texte lisible sur les bandeaux sombres : aucune couleur forcée sur titres, paragraphes et listes", () => {
  it("la règle globale des paragraphes et listes ne déclare AUCUNE couleur (même `inherit` bat les classes de la couche components comme .premium-copy-on-dark)", () => {
    const body = ruleBody(".secondary-page-surface p,\n  .secondary-page-surface li {");
    expect(body).not.toMatch(/(^|[;\s])color\s*:/);
    expect(body).toMatch(/line-height/);
  });

  it("la règle globale des titres h1-h3 ne déclare aucune couleur non plus", () => {
    const body = ruleBody(".secondary-page-surface h1,\n  .secondary-page-surface h2,\n  .secondary-page-surface h3 {");
    expect(body).not.toMatch(/(^|[;\s])color\s*:/);
  });

  it("le défaut sombre reste posé une seule fois, sur la surface de page", () => {
    expect(ruleBody(".secondary-page-surface {")).toMatch(/color:\s*#10233f/);
  });

  it("un lien sans classe de couleur dans un bandeau clair-sur-sombre reprend la couleur du texte et se souligne", () => {
    expect(css).toMatch(/\.secondary-page-surface :is\(\s*\[class~="text-white"\]/);
    const start = css.indexOf('.secondary-page-surface :is(\n    [class~="text-white"]');
    expect(start).toBeGreaterThan(-1);
    const body = css.slice(css.indexOf(') a:not([class*="text-"]) {', start));
    expect(body).toMatch(/color:\s*inherit/);
    expect(body).toMatch(/text-decoration:\s*underline/);
  });
});
