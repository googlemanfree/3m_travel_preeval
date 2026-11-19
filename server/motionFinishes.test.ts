import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, path), "utf8");
const css = read("../client/src/index.css");

describe("finitions de mouvement communes", () => {
  it("les accordéons, les valeurs et les panneaux ont leur animation, uniquement en opacité et transformation", () => {
    for (const keyframes of ["details-content-in", "value-pop", "panel-in"]) {
      const block = css.slice(css.indexOf(`@keyframes ${keyframes}`), css.indexOf("}\n}", css.indexOf(`@keyframes ${keyframes}`)) + 3);
      expect(block, keyframes).toBeTruthy();
      expect(block, `${keyframes} ne doit animer ni taille ni position`).not.toMatch(/\b(width|height|top|left|right|bottom|margin|padding)\s*:/);
    }
  });

  it("respectent « réduire les animations » du système", () => {
    const start = css.indexOf("Mouvement : finitions communes");
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)", start), css.indexOf("html.motion-disabled *,", start));
    expect(reduced).toContain("details[open] > :not(summary)");
    expect(reduced).toContain(".value-pop");
    expect(reduced).toContain(".panel-in");
    expect(reduced).toMatch(/animation:\s*none/);
  });

  it("le réglage « Animations : Désactivé » du site coupe toute durée (garde-fou global conservé)", () => {
    expect(css).toMatch(/html\.motion-disabled \*,[\s\S]*?animation-duration: 0\.01ms !important;/);
  });

  it("les calculatrices animent leurs résultats sans animer le texte lu par les lecteurs d'écran", () => {
    const crs = read("../client/src/components/CrsOfficialCalculator.tsx");
    const fsw = read("../client/src/components/FswGridCalculator.tsx");
    expect(crs).toContain('className="panel-in space-y-4 rounded-2xl border-2 border-blue-300');
    expect(crs).toContain("value-pop text-5xl");
    expect(fsw).toContain("panel-in");
    expect(fsw).toContain("value-pop text-5xl");
    // le total est du texte réel (pas un compteur qui défile) : les lecteurs d'écran lisent toujours la valeur finale
    expect(crs).not.toMatch(/useCountUp|requestAnimationFrame/);
  });
});
