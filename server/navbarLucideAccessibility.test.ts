import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "client/src/components/Navbar.tsx"),
  "utf8"
);

describe("Navbar avec icônes Lucide", () => {
  it("utilise des composants Lucide plutôt que des emojis pour les destinations", () => {
    expect(source).toContain('from "lucide-react"');
    expect(source).toContain("icon: Home");
    expect(source).toContain("icon: Plane");
    expect(source).toContain("icon: FileText");
    expect(source).not.toContain('icon: "🏠"');
    expect(source).not.toContain('icon: "✈️"');
  });

  it("préserve les contrôles tactiles et les libellés accessibles", () => {
    expect(source).toContain("min-h-11");
    expect(source).toContain("touch-target");
    expect(source).toContain(
      'mainNav: { fr: "Navigation principale", en: "Main navigation" }'
    );
    expect(source).toContain(
      'mobileNav: { fr: "Navigation mobile", en: "Mobile navigation" }'
    );
    expect(source).toContain("aria-label={copy(NAV_COPY.mainNav)}");
    expect(source).toContain("aria-label={copy(NAV_COPY.mobileNav)}");
  });

  it("intègre une recherche de destinations dans les menus desktop et mobile", () => {
    expect(source).toContain('id="desktop-nav-search"');
    expect(source).toContain('id="mobile-nav-search"');
    expect(source).toMatch(/action="\/destinations"\s+method="get"/);
    expect(source).toContain("destinationQuickLinks");
    expect(source).toContain("matchingDestinations");
  });

  it("préserve les interactions premium accessibles des boutons de recherche", () => {
    expect(source).toContain("hover:-translate-y-0.5");
    expect(source).toContain("active:scale-95");
    expect(source).toContain('aria-live="polite"');
  });

  it("place la recherche sur la ligne d’actions et prend en charge le raccourci slash", () => {
    expect(source).toContain('aria-keyshortcuts="/"');
    expect(source).toContain("desktopNavSearchRef.current?.focus()");
    expect(source).toContain("mobileNavSearchRef.current?.focus()");
    expect(source).toContain('item.href !== "/evisas"');
    expect(source).toContain('href="/evisas"');
  });

  it("propose des destinations populaires en autocomplétion", () => {
    expect(source).toContain("desktopSuggestions");
    expect(source).toContain('role="listbox"');
    expect(source).toContain('role="option"');
    expect(source).toContain("popularDestinations");
  });

  it("anime le ciblage slash et distingue visuellement E-Visa au survol", () => {
    expect(source).toContain("searchShortcutActive");
    expect(source).toContain("rgba(195,146,49,0.18)");
    expect(source).toContain("hover:scale-[1.03]");
    expect(source).toContain("group-hover:rotate-6");
  });

  it("permet de parcourir les suggestions au clavier et de valider avec Entrée", () => {
    expect(source).toContain('event.key === "ArrowDown"');
    expect(source).toContain('event.key === "ArrowUp"');
    expect(source).toContain('event.key === "Enter"');
    expect(source).toContain("activeSuggestionIndex");
    expect(source).toContain("aria-activedescendant");
  });

  it("mémorise les recherches récentes sans bloquer le navigateur", () => {
    expect(source).toContain("3m-recent-destination-searches");
    expect(source).toContain("localStorage.setItem");
    expect(source).toContain("recentSearches");
    expect(source).toContain("rememberSearch");
  });

  it("affiche une inscription directement dans la barre mobile", () => {
    expect(source).toContain('href="/register"');
    expect(source).toContain("aria-label={copy(NAV_COPY.register)}");
    expect(source).toContain("sm:text-xs");
  });
});
