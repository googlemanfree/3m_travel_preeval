import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("supervision de connectivité administrateur", () => {
  const source = readFileSync(new URL("./routers/monitoring.ts", import.meta.url), "utf8");

  it("réserve le statut et le diagnostic aux administrateurs", () => {
    expect(source).toMatch(/getConnectivityStatus:\s*adminProcedure/);
    expect(source).toMatch(/runConnectivityDiagnostic:\s*adminProcedure/);
  });

  it("n’expose que des contrôles internes de disponibilité", () => {
    expect(source).toContain("SELECT 1");
    expect(source).toContain("databaseLatencyMs");
    expect(source).not.toContain("DATABASE_URL");
  });
});
