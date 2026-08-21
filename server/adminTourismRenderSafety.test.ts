import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/components/AdminTourismRequests.tsx"), "utf8");

describe("résilience du rendu Tourisme administrateur", () => {
  it("protège le rendu contre les données serviceTypesJson invalides", () => {
    expect(source).toContain("function parseServiceTypes");
    expect(source).toContain("Array.isArray(parsed)");
    expect(source).toContain("catch {");
  });

  it("mémorise les entrées tRPC de session pour éviter les boucles de requête", () => {
    expect(source).toContain("const adminInput = useMemo");
    expect(source).toContain("const precheckInput = useMemo");
  });
});
