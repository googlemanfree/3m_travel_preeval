import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "server/routers/flights.ts"), "utf8");

describe("délai maximal de recherche de vols", () => {
  it("interrompt la source externe avant qu’elle ne bloque le parcours client", () => {
    expect(source).toContain("AbortSignal.timeout(8_000)");
    expect(source).toContain("offres indicatives");
  });
});
