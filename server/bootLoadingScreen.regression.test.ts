import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

describe("Global boot loading screen", () => {
  it("retient une racine prerendue et le module d’amorçage principal", () => {
    expect(indexHtml).toContain('<div id="root"><!--prerender-app--></div>');
    expect(indexHtml).toContain('<script type="module" src="/src/main.tsx"></script>');
    expect(indexHtml).not.toContain("boot-fallback");
  });

  it("nettoie les caches de prévisualisation sans écran de secours obsolète", () => {
    expect(indexHtml).toContain("isPreviewHost");
    expect(indexHtml).toContain("getRegistrations");
    expect(indexHtml).toContain("caches.delete");
    expect(indexHtml).not.toContain("aria-label=\"Progression du chargement\"");
  });
});
