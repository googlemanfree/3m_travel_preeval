import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

describe("compteurs de statistiques sans source", () => {
  it.each([
    "client/src/components/CounterStats.tsx",
    "client/src/components/AnimatedCounterStats.tsx",
    "client/src/components/AnimatedCounterStatsWithTooltips.tsx",
  ])("%s reste supprimé : il affichait des pourcentages de réussite non sourcés (89 %, 98 %)", (file) => {
    expect(existsSync(resolve(root, file))).toBe(false);
  });
});
