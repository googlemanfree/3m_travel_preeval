import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const indexHtml = readFileSync(
  resolve(import.meta.dirname, "../client/index.html"),
  "utf8",
);

describe("static bootstrap recovery contract", () => {
  it("does not leave the initial boot fallback without a deadline", () => {
    expect(indexHtml).toContain('id="boot-countdown"');
    expect(indexHtml).toContain('id="boot-progress-bar"');
    expect(indexHtml).toContain('id="boot-retry"');
    expect(indexHtml).toContain("const timeoutMs = 15000");
    expect(indexHtml).toContain("3m_boot_reload_attempted");
  });

  it("detects a failed module script and explains the automatic recovery", () => {
    expect(indexHtml).toContain("target instanceof HTMLScriptElement");
    expect(indexHtml).toContain('target.type === "module"');
    expect(indexHtml).toContain("Problème réseau détecté");
    expect(indexHtml).toContain("Rechargement automatique en cours");
  });
});
