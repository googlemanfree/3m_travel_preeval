import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { composePublicPrerender } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const template = "<!doctype html><html lang=\"fr\"><head><title>x</title></head><body><div id=\"root\"><!--prerender-app--></div></body></html>";

describe("page /canada — anti page blanche", () => {
  it("ne masque le pré-rendu qu’après app-ready (pas dès js-enabled)", () => {
    const html = read("client/index.html");
    const main = read("client/src/main.tsx");
    expect(html).toContain("html.app-ready .seo-prerender");
    expect(html).not.toContain("html.js-enabled .seo-prerender");
    expect(html).toContain("app-boot-slow");
    expect(main).toContain('classList.add("app-ready")');
  });

  it("charge la page Canada de façon synchrone dans App", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('import Canada from "./pages/Canada"');
    expect(app).not.toMatch(/const Canada = lazyWithTimeout\(\(\) => import\("\.\/pages\/Canada"\)\)/);
  });

  it("évite de mettre en cache les réponses d’assets non OK dans le SW", () => {
    const sw = read("client/public/sw.js");
    expect(sw).toContain("isCacheableResponse");
    expect(sw).toContain("url.pathname.startsWith('/assets/')");
    expect(sw).toMatch(/3m-travel-pwa-v\d+/);
    expect(sw).toContain("response.ok && response.status === 200");
  });

  it("enrichit le fallback pré-rendu Canada avec score, CRS et voies", () => {
    const rendered = composePublicPrerender(template, "/canada");
    expect(rendered.status).toBe(200);
    expect(rendered.html).toContain("Évaluez votre score et construisez votre stratégie Canada");
    expect(rendered.html).toContain("/canada/crs");
    expect(rendered.html).toContain("/evaluation?destination=canada");
    expect(rendered.html).toContain("Entrée express");
  });
});
