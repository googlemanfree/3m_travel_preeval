import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const dashboard = readFileSync(resolve(projectRoot, "client/src/pages/AdminDashboard.tsx"), "utf8");

describe("synchronisation du poste administrateur", () => {
  it("horodate le chargement dès que le registre principal est disponible", () => {
    expect(dashboard).toContain("if (!isLoading && data !== undefined && !lastSyncedAt)");
    expect(dashboard).not.toContain("!isLoadingCountryDistribution && !isLoadingFaqSatisfaction");
  });
});
