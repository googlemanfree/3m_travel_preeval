import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicFile = (name: string) => resolve(root, "client/public", name);

describe("logo premium HD 3M TRAVEL AGENCY", () => {
  it("conserve le badge circulaire d’origine en WebP HD + version légère", () => {
    expect(existsSync(publicFile("logo-3m.webp"))).toBe(true);
    expect(existsSync(publicFile("logo-3m-hd.webp"))).toBe(true);
    expect(existsSync(publicFile("logo-3m-travel-agency-hd.png"))).toBe(true);
    expect(statSync(publicFile("logo-3m.webp")).size).toBeLessThan(40 * 1024);
    expect(statSync(publicFile("logo-3m-hd.webp")).size).toBeGreaterThan(30 * 1024);
    expect(statSync(publicFile("logo-3m-travel-agency-hd.png")).size).toBeGreaterThan(100 * 1024);
  });

  it("le hero utilise la version HD ; nav/footer la version légère", () => {
    const hero = readFileSync(resolve(root, "client/src/components/HeroSectionVIP.tsx"), "utf8");
    const nav = readFileSync(resolve(root, "client/src/components/Navbar.tsx"), "utf8");
    const footer = readFileSync(resolve(root, "client/src/components/Footer.tsx"), "utf8");
    expect(hero).toContain('logoUrl = "/logo-3m-hd.webp"');
    expect(nav).toContain('src="/logo-3m.webp"');
    expect(footer).toContain('src="/logo-3m.webp"');
    expect(hero).not.toContain("logo-3m-travel-agency.svg");
  });
});
