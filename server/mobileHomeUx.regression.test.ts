import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const navbar = read("client/src/components/Navbar.tsx");
const hero = read("client/src/components/HeroSectionVIP.tsx");
const themeToggle = read("client/src/components/ThemeToggle.tsx");
const styles = read("client/src/index.css");
const floating = read("client/src/components/FloatingActionMenu.tsx");
const home = read("client/src/pages/Home.tsx");
const quickActions = read("client/src/components/QuickActionsSection.tsx");

describe("UX mobile accueil — navigation, hero et zones tactiles", () => {
  it("garde un header téléphone compact sur une seule ligne", () => {
    expect(navbar).toContain("flex-nowrap items-center gap-x-2");
    expect(navbar).toContain("order-2 ml-auto flex shrink-0 items-center");
    expect(navbar).toContain("touch-target lang-chip");
    expect(navbar).toContain("mobile-scroll-region max-h-[min(70dvh,calc(100dvh-4.5rem))]");
    expect(navbar).toContain("min-h-14 items-center gap-3");
    expect(themeToggle).toContain('compact ? "touch-target h-11 w-11"');
    expect(styles).toContain(".touch-target.lang-chip");
    expect(styles).toContain("min-height: 3.75rem");
  });

  it("adapte le hero au viewport téléphone sans perdre la hiérarchie de marque", () => {
    expect(hero).toContain("min-h-[72vh]");
    expect(hero).toContain("sm:min-h-[78vh]");
    expect(hero).toContain("text-4xl font-extrabold tracking-tight");
    expect(hero).toContain("sm:text-5xl md:mb-6 md:text-6xl lg:text-7xl xl:text-[6.5rem]");
    expect(hero).toContain("text-base font-medium");
    expect(hero).toContain("bottom-6");
    expect(hero).toContain("sm:bottom-10");
    expect(hero).toContain('data-testid="hero-scroll-cue"');
    expect(hero).toContain('const heroButtonSize = "w-full max-w-[22rem] min-h-14 sm:w-[300px]";');
  });

  it("préserve les cibles tactiles des CTA flottants, actions rapides et CTA final", () => {
    expect(floating).toContain("touch-target");
    expect(floating).toContain("safe-bottom-floating-whatsapp");
    expect(quickActions).toContain("min-h-14");
    expect(home).toContain("bottom-[max(1.5rem,env(safe-area-inset-bottom))]");
    expect(home).toContain("w-full max-w-[22rem] sm:w-auto");
    expect(home).toContain("min-h-12 w-full");
  });
});
