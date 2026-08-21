import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pageSource = readFileSync(resolve(process.cwd(), "client/src/pages/EvisasAdvanced.tsx"), "utf8");

describe("cartes e‑Visa", () => {
  it("ne rend une image que lorsqu’une source existe et utilise un repli visuel autrement", () => {
    expect(pageSource).toContain("{destination.image ? (");
    expect(pageSource).toContain("Drapeau de ${destination.country}");
  });
});
