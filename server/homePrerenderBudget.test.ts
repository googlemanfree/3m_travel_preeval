import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { composePublicPrerender } from "./publicPrerender";

const shell = readFileSync(resolve(import.meta.dirname, "../client/index.html"), "utf8");

describe("budget du prérendu de l'accueil", () => {
  it("reste sous 15 000 octets tout en conservant les repères essentiels", () => {
    const rendered = composePublicPrerender(shell, "/");
    expect(Buffer.byteLength(rendered.html, "utf8")).toBeLessThan(15_000);
    expect(rendered.html).toContain("Preuve d’enregistrement vérifiable");
    expect(rendered.html).toContain('name="description"');
    expect(rendered.html).toContain('type="application/ld+json"');
  });
});
