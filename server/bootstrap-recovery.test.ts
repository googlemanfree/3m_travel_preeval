import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const indexHtml = readFileSync(
  resolve(import.meta.dirname, "../client/index.html"),
  "utf8",
);

describe("static bootstrap recovery contract", () => {
  it("retient un bootstrap indépendant du service worker en prévisualisation", () => {
    expect(indexHtml).toContain('<div id="root"><!--prerender-app--></div>');
    expect(indexHtml).toContain('<script type="module" src="/src/main.tsx"></script>');
    expect(indexHtml).toContain("isPreviewHost");
    expect(indexHtml).toContain("navigator.serviceWorker.getRegistrations()");
  });

  it("évite de conserver un cache de prévisualisation obsolète", () => {
    expect(indexHtml).toContain("caches.keys()");
    expect(indexHtml).toContain("caches.delete(key)");
    expect(indexHtml).not.toContain("3m_boot_timeout_reload_attempted");
    expect(indexHtml).not.toContain("boot-fallback");
  });
});
