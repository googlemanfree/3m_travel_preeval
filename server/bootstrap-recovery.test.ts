import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const indexHtml = readFileSync(
  resolve(import.meta.dirname, "../client/index.html"),
  "utf8",
);

describe("static bootstrap recovery contract", () => {
  it("keeps a React-independent 15-second recovery deadline", () => {
    expect(indexHtml).toContain("Filet de sécurité indépendant de React");
    expect(indexHtml).toContain("var BOOT_TIMEOUT_MS = 15000");
    expect(indexHtml).toContain("window.setTimeout");
    expect(indexHtml).toContain("3m_boot_timeout_reload_attempted");
    expect(indexHtml).toContain('root.querySelector(".boot-fallback")');
  });

  it("reloads once and then exposes a manual retry instead of looping forever", () => {
    expect(indexHtml).toContain("window.location.reload()");
    expect(indexHtml).toContain("sessionStorage.setItem(RELOAD_FLAG_KEY, \"1\")");
    expect(indexHtml).toContain("Le chargement rencontre un problème persistant.");
    expect(indexHtml).toContain("Réessayer");
    expect(indexHtml).toContain("Bureau d\\'Ottawa — WhatsApp");
  });
});
