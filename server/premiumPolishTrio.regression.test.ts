import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("premium polish trio — navbar, pages secondaires, motion", () => {
  it("rend la navbar plus lisible (liens sm, langue sans opacity-60)", () => {
    const navbar = read("client/src/components/Navbar.tsx");
    expect(navbar).toContain("text-sm font-bold text-[#0a2540]");
    expect(navbar).toContain("text-sm font-black");
    expect(navbar).toContain("text-[13px]");
    expect(navbar).not.toContain('opacity-60');
  });

  it("renforce labels et champs de formulaire", () => {
    const label = read("client/src/components/ui/label.tsx");
    const input = read("client/src/components/ui/input.tsx");
    const form = read("client/src/components/SimpleMultiProjectForm.tsx");
    const css = read("client/src/index.css");
    expect(label).toContain("font-semibold");
    expect(label).toContain("text-slate-800");
    expect(input).toContain("placeholder:text-slate-500");
    expect(input).toContain("text-base text-slate-900");
    expect(form).toContain("premium-form-surface");
    expect(css).toContain(".premium-form-surface");
  });

  it("aère le shell de pages services et Tarifs / Schengen / e-Visa", () => {
    const shell = read("client/src/components/ServicePageShell.tsx");
    const tarifs = read("client/src/pages/Tarifs.tsx");
    const schengen = read("client/src/pages/Schengen.tsx");
    const evisa = read("client/src/pages/Evisa.tsx");
    expect(shell).toContain("PremiumReveal");
    expect(shell).toContain("py-16 sm:px-6 sm:py-20");
    expect(shell).toContain("!text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]");
    expect(shell).toContain("bg-[#020C3B]/35");
    expect(tarifs).toContain("PremiumReveal");
    expect(tarifs).toContain("premium-section-title");
    expect(schengen).toContain("premium-copy");
    expect(evisa).toContain("useReducedMotion");
    expect(evisa).toContain("premium-section-title");
  });

  it("centralise la motion PremiumReveal avec reduced-motion", () => {
    const reveal = read("client/src/components/PremiumReveal.tsx");
    expect(reveal).toContain("useReducedMotion");
    expect(reveal).toContain("whileInView");
    expect(reveal).toContain("once: true");
  });

  it("applique le contraste translucide et l’apparition progressive au texte du hero", () => {
    const hero = read("client/src/components/HeroSectionVIP.tsx");
    expect(hero).toContain("premium-copy-on-dark");
    expect(hero).toContain("from-[#07162c]/45");
    expect(hero).toContain("!text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.75)]");
    expect(hero).toContain("variants={fadeIn}");
  });
});
