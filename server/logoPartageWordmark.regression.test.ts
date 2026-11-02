import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { renderOgImageSvg } from "./seoAssets";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const publicFile = (name: string) => resolve(root, "client/public", name);

describe("logo partage + wordmark", () => {
  it("embarque le badge circulaire dans l’image OG SVG", () => {
    const svg = renderOgImageSvg("Visa Canada", "/canada");
    expect(svg).toContain("data:image/png;base64,");
    expect(svg).toContain("<image ");
    expect(svg).toContain("Visa Canada");
    expect(existsSync(publicFile("logo-3m-og-badge.png"))).toBe(true);
    expect(statSync(publicFile("logo-3m-og-badge.png")).size).toBeGreaterThan(5_000);
  });

  it("expose un wordmark asset et le câble dans la navbar", () => {
    expect(existsSync(publicFile("logo-3m-wordmark.webp"))).toBe(true);
    expect(statSync(publicFile("logo-3m-wordmark.webp")).size).toBeLessThan(80 * 1024);
    const nav = read("client/src/components/Navbar.tsx");
    expect(nav).toContain("navbar-brand-wordmark");
    expect(nav).toContain("3M TRAVEL");
    expect(read("client/public/sw.js")).toContain("3m-travel-pwa-v60-logo-partage-wordmark");
    expect(read("client/index.html")).toContain("2026-10-15-logo-partage-wordmark-v60");
  });
});
