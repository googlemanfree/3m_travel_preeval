import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("restauration de scroll côté client", () => {
  it("désactive la restauration automatique et traite les ancres après le rendu", () => {
    const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

    expect(app).toContain('window.history.scrollRestoration = "manual"');
    expect(app).toContain("window.addEventListener(\"hashchange\", scrollToTarget)");
    expect(app).toContain("document.getElementById(targetId)");
    expect(app).toContain("window.scrollTo({ top: 0, left: 0, behavior: \"auto\" })");
    expect(app).toContain("window.requestAnimationFrame");
  });
});
