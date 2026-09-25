import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "server/routers/flights.ts"), "utf8");

describe("délai maximal de recherche de vols", () => {
  it("interrompt la source externe avant qu’elle ne bloque le parcours client", () => {
    expect(source).toContain("AbortSignal.timeout(8_000)");
    // Au-delà du délai : aucun tarif de remplacement, un message honnête et la panne n'est pas mise en cache.
    expect(source).toContain("NO_LIVE_FARES_NOTICE");
    expect(source).toContain("plutôt qu’un tarif non vérifié");
    expect(source).not.toContain("offres indicatives");
  });
});
