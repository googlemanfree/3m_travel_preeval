import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("lisibilité premium site-wide", () => {
  it("charge Manrope + Sora (pas Inter) et renforce le corps de texte", () => {
    const html = read("client/index.html");
    const css = read("client/src/index.css");
    expect(html).toContain("family=Manrope");
    expect(html).toContain("family=Sora");
    expect(html).not.toContain("family=Inter");
    expect(css).toContain('font-family: "Manrope"');
    expect(css).toContain('font-family: "Sora"');
    expect(css).toContain(".premium-copy");
    expect(css).toContain(".premium-copy-on-dark");
    expect(css).toContain(".premium-section-lead");
    expect(css).toContain("line-height: 1.65");
    expect(css).toContain("color: rgb(51 65 85 / var(--tw-text-opacity, 1)); /* slate-700 */");
    expect(css).toContain(".text-\\[10px\\]");
  });

  it("rend le hero et /flights avec un contraste lisible", () => {
    const hero = read("client/src/components/HeroSectionVIP.tsx");
    const flights = read("client/src/pages/Flights.tsx");
    expect(hero).toContain("text-white drop-shadow");
    expect(hero).toContain("!text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.75)]");
    expect(hero).toContain("from-[#07162c]/45");
    expect(hero).not.toContain("text-transparent");
    expect(hero).toContain("premium-copy-on-dark");
    expect(flights).toContain("premium-copy-on-dark");
  });

  it("remonte le contraste des textes secondaires du pied de page", () => {
    const footer = read("client/src/components/Footer.tsx");
    expect(footer).toContain("text-base leading-relaxed text-slate-200");
    expect(footer).toContain("text-sm leading-relaxed text-slate-300");
    expect(footer).not.toContain("text-xs leading-relaxed text-slate-400");
  });

  it("applique la typo premium au shell de pages services et à l’accueil", () => {
    const shell = read("client/src/components/ServicePageShell.tsx");
    const home = read("client/src/pages/Home.tsx");
    expect(shell).toContain("premium-copy-on-dark");
    expect(shell).toContain("premium-section-lead");
    expect(home).toContain("premium-section-title");
    expect(home).toContain("premium-copy-on-dark");
  });
});
