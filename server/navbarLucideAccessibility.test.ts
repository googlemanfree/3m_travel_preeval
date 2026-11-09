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
});
