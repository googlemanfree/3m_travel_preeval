import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("cache-busting des préchargements frontend", () => {
  it("versionne les routes avec le marqueur de build et désactive le cache HTTP", () => {
    const source = read("client/src/lib/navigationCache.ts");
    expect(source).toContain('meta[name="3m-build-marker"]');
    expect(source).toContain("__3m_build");
    expect(source).toContain('cache: "no-store"');
    expect(source).toContain('"X-3M-Build"');
  });
});
