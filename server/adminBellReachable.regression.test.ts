import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");

describe("cloche de notifications administrateur", () => {
  it("est rendue hors du conteneur de page, sous l'en-tête fixe, donc cliquable", () => {
    const guard = read("client/src/components/AdminGuard.tsx");
    const css = read("client/src/index.css");
    // Le conteneur de page isole son empilement : une cloche « fixed » à l'intérieur reste sous l'en-tête (z-50).
    expect(css).toMatch(/\.page-transition-shell\s*\{[^}]*isolation:\s*isolate/);
    expect(guard).toContain("createPortal(");
    expect(guard).toContain("document.body");
    expect(guard).toContain("top-[8.75rem]");
    expect(guard).toContain('data-testid="admin-floating-bell"');
  });

  it("n'est pas dupliquée sur le tableau de bord, dont le bandeau sombre a une cloche à icône claire", () => {
    const guard = read("client/src/components/AdminGuard.tsx");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    const bell = read("client/src/components/AdminNotificationBell.tsx");
    expect(guard).toContain('!== "/admin"');
    expect(dashboard).toContain('<AdminNotificationBell tone="dark" />');
    expect(bell).toContain('tone === "dark" ? "text-white" : "text-gray-600"');
  });
});
