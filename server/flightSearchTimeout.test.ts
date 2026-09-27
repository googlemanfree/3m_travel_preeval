import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "server/routers/flights.ts"), "utf8");
// Le délai est appliqué par flightProvider (fournisseur principal et secours), utilisé par flights.ts.
const providerSource = readFileSync(resolve(process.cwd(), "server/services/flightProvider.ts"), "utf8");

describe("délai maximal de recherche de vols", () => {
  it("interrompt la source externe avant qu’elle ne bloque le parcours client", () => {
    expect(providerSource).toContain("AbortSignal.timeout(timeoutMs)");
    expect(providerSource).toContain("timeoutMs = deps.timeoutMs ?? 8_000");
    expect(source).toContain("fetchProvider");
    // Au-delà du délai : aucun tarif de remplacement, un message honnête et la panne n'est pas mise en cache.
    expect(source).toContain("NO_LIVE_FARES_NOTICE");
    expect(source).toContain("plutôt qu’un tarif non vérifié");
    expect(source).not.toContain("offres indicatives");
  });
});
