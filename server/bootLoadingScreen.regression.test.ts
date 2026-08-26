import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

describe("Global boot loading screen", () => {
  it("uses the complete 3M logo instead of the small monogram", () => {
    expect(indexHtml).toContain('src="/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg"');
    expect(indexHtml).toContain('alt="Logo 3M Travel &amp; Services"');
    expect(indexHtml).not.toContain('class="boot-fallback__brand" aria-hidden="true">3M</span>');
  });

  it("exposes an accessible premium loading progress indicator", () => {
    expect(indexHtml).toContain('class="boot-fallback__progress" role="progressbar"');
    expect(indexHtml).toContain('aria-label="Progression du chargement"');
    expect(indexHtml).toContain("boot-progress");
    expect(indexHtml).toContain("prefers-reduced-motion: reduce");
  });
});
