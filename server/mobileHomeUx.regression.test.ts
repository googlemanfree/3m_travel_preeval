import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const navbar = read("client/src/components/Navbar.tsx");
const hero = read("client/src/components/HeroSectionVIP.tsx");
const themeToggle = read("client/src/components/ThemeToggle.tsx");
const styles = read("client/src/index.css");
const indexHtml = read("client/index.html");
const floating = read("client/src/components/FloatingActionMenu.tsx");
const home = read("client/src/pages/Home.tsx");
const quickActions = read("client/src/components/QuickActionsSection.tsx");
const reviews = read("client/src/components/ApprovedReviewsSection.tsx");

describe("UX mobile accueil — navigation, hero et zones tactiles", () => {
  it("garde un header téléphone compact sur une seule ligne", () => {
    expect(navbar).toContain("flex-nowrap items-center gap-x-2");
    expect(navbar).toContain("order-2 ml-auto flex shrink-0 items-center");
    expect(navbar).toContain("<select value={language}");
    expect(navbar).toContain("min-h-10 max-w-[8.5rem]");
    expect(navbar).toContain("FR · Français");
    expect(navbar).toContain("mobile-scroll-region max-h-[min(70dvh,calc(100dvh-4.5rem))]");
    expect(navbar).toContain("min-h-14 items-center gap-3");
    expect(themeToggle).toContain('compact ? "touch-target h-11 w-11"');
    expect(styles).toContain("min-height: 3.75rem");
  });

  it("adapte le hero au viewport téléphone sans perdre la hiérarchie de marque", () => {
    expect(hero).toContain("min-h-[78vh]");
    expect(hero).toContain("sm:min-h-[84vh]");
    expect(hero).toContain("text-3xl font-black tracking-tight");
    expect(hero).toContain("sm:text-4xl md:text-5xl lg:text-6xl");
    expect(hero).toContain('data-testid="hero-support"');
    expect(hero).toContain('data-testid="hero-tagline"');
    expect(hero).toContain("bottom-3");
    expect(hero).toContain("sm:bottom-4");
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

  it("affiche une barre CTA sticky mobile (Évaluer seul) hors du formulaire ; WhatsApp reste en pastille", () => {
    expect(home).toContain('data-testid="home-sticky-cta"');
    expect(home).toContain("showStickyCta");
    expect(home).toContain("Évaluer mon projet — gratuit");
    expect(home).toContain("md:hidden");
    expect(home).toContain("Action rapide d’évaluation");
    expect(home).not.toContain('home-sticky-cta"\n          role="region"\n          aria-label="Actions rapides');
    expect(styles).toContain('body:has([data-testid="home-sticky-cta"]) .safe-bottom-floating-whatsapp');
  });

  it("n’empile pas Aureol / vols sur l’accueil (WhatsApp seul + sticky)", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain("isHomeRoute");
    expect(app).toContain("{!isHomeRoute && <AiCopilotWidgetEnhanced />}");
    expect(app).toContain("{!isHomeRoute && <SmartFlightAssistant />}");
  });

  it("affiche une progression de défilement et des transitions accessibles", () => {
    expect(home).toContain('data-testid="mobile-scroll-progress"');
    expect(home).toContain("aria-valuenow={Math.round(scrollProgress)}");
    expect(home).toContain("mobile-section-transition");
    expect(styles).toContain(".mobile-section-transition");
    expect(styles).toContain("opacity: 1 !important");
  });

  it("rend les ressources prioritaires directement visibles sur mobile sans doublon Évaluer", () => {
    expect(home).toContain('id="mobile-home-nav"');
    expect(home).toContain("Accès rapides mobile");
    expect(home).toContain('href="/procedures"');
    expect(home).toContain("sm:hidden");
    expect(home).toContain("touch-target inline-flex");
    const navBlock = home.slice(home.indexOf('id="mobile-home-nav"'), home.indexOf("home-talent-corridor"));
    expect(navBlock).not.toContain('href="#evaluation-multi"');
  });

  it("précharge le détourage hero adapté au viewport", () => {
    expect(indexHtml).toContain('rel="preload" as="image"');
    expect(indexHtml).toContain("hero-people-cutout-mobile.webp");
    expect(indexHtml).toContain("hero-people-cutout.webp");
    expect(indexHtml).toContain('media="(max-width: 767px)"');
    expect(indexHtml).toContain('fetchpriority="high"');
  });

  it("permet de partager rapidement un témoignage approuvé", () => {
    expect(reviews).toContain("navigator.share");
    expect(reviews).toContain("https://wa.me/?text=");
    expect(reviews).toContain("Partager le témoignage");
    expect(reviews).toContain("min-h-11");
  });
});
