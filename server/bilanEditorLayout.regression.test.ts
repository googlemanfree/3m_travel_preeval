import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(__dirname, "../client/src/components/EvaluationDeliveryEditor.tsx"), "utf8");

describe("éditeur de bilan : mise en page aérée", () => {
  it("la zone « Bilan » garde une vraie hauteur (avant : écrasée à une ligne par les blocs au-dessus)", () => {
    const input = source.slice(source.indexOf('id="bilan-input"'), source.indexOf('id="bilan-input"') + 400);
    expect(input).toContain("min-h-[320px]");
    expect(input).not.toContain("min-h-0");
  });
  it("les informations du dossier sont repliées par défaut avec un récapitulatif et un lien « Modifier »", () => {
    const meta = source.slice(source.indexOf('data-testid="bilan-meta"') - 140, source.indexOf('data-testid="bilan-meta"') + 20);
    expect(meta).not.toMatch(/<details open/);
    expect(source).toContain('data-testid="bilan-meta-recap"');
    expect(source).toContain(">Modifier</span>");
  });
  it("les blocs ne se rétrécissent pas sous le titre « Bilan » (pas de chevauchement)", () => {
    expect(source).toMatch(/<Label htmlFor="bilan-input" className="[^"]*shrink-0/);
  });
});
