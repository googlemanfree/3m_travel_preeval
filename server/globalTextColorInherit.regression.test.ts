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

describe("texte lisible sur les bandeaux sombres : les titres, paragraphes et listes héritent de la couleur du conteneur", () => {
  it("la règle globale des paragraphes et listes ne force plus une couleur sombre (gris foncé sur bleu = illisible)", () => {
    const body = ruleBody(".secondary-page-surface p,\n  .secondary-page-surface li {");
    expect(body).toMatch(/color:\s*inherit/);
    expect(body).not.toMatch(/color:\s*#[0-9a-f]{3,8}/i);
  });

  it("la règle globale des titres h1-h3 hérite aussi de la couleur (un titre sans classe sur un bandeau sombre restait bleu nuit)", () => {
    const body = ruleBody(".secondary-page-surface h1,\n  .secondary-page-surface h2,\n  .secondary-page-surface h3 {");
    expect(body).toMatch(/color:\s*inherit/);
  });

  it("le défaut sombre reste posé une seule fois, sur la surface de page", () => {
    expect(ruleBody(".secondary-page-surface {")).toMatch(/color:\s*#10233f/);
  });
});
