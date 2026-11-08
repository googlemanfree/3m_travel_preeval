import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const css = read("client/src/index.css");
const block = css.slice(css.indexOf("Traits de liaison entre les étapes du parcours"));

describe("traits de liaison du parcours", () => {
  it("n'existent que sur la grille à 5 colonnes, sont décoratifs (pseudo-élément) et n'effacent jamais le texte", () => {
    expect(block).toMatch(/@media \(min-width: 1024px\) \{\s*\.journey-connectors > li \{ position: relative; \}/);
    expect(block).toContain("::after");
    expect(block).toContain("pointer-events: none");
    expect(block).not.toMatch(/opacity\s*:/);
  });

  it("le reflet n'est animé que sous prefers-reduced-motion: no-preference, coupé par le réglage du site, absent à l'impression", () => {
    expect(block).toMatch(/@media \(min-width: 1024px\) and \(prefers-reduced-motion: no-preference\) \{[\s\S]*animation: journey-glow/);
    expect(block).toContain("html.motion-disabled .journey-connectors");
    expect(block).toContain("@media print");
  });

  it("l'accueil applique la classe sur la liste des étapes et le bouton d'aide passe devant le filet", () => {
    const home = read("client/src/pages/Home.tsx");
    expect(home.match(/journey-connectors/g)?.length).toBe(1);
    expect(home).toMatch(/relative z-\[2\] inline-flex min-h-11 min-w-11[^"]*bg-white/);
  });

  it("les bandeaux défilants sont montés sur Procédures (actualités + preuves) et Destinations (procédures + preuves)", () => {
    expect(read("client/src/pages/ProceduresAdvanced.tsx")).toContain('<HomeLiveStrips bands={["news", "proofs"]} proofsHref="/#preuves-dossiers" />');
    expect(read("client/src/pages/DestinationsHub.tsx")).toContain('<HomeLiveStrips bands={["procedures", "proofs"]} proofsHref="/#preuves-dossiers" />');
  });
});
