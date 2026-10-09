import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ADMIN_DOSSIER_POLL_MS } from "../shared/adminSync";

const projectRoot = resolve(import.meta.dirname, "..");
const dashboard = readFileSync(resolve(projectRoot, "client/src/pages/AdminDashboard.tsx"), "utf8");

describe("synchronisation du poste administrateur", () => {
  it("horodate le registre dossiers à chaque rafraîchissement réussi", () => {
    expect(dashboard).toContain("if (dataUpdatedAt)");
    expect(dashboard).toContain("setLastSyncedAt(new Date(dataUpdatedAt))");
    expect(dashboard).not.toContain("!isLoadingCountryDistribution && !isLoadingFaqSatisfaction");
  });

  it("rafraîchit la liste des dossiers toutes les 30 s sans poller en arrière-plan", () => {
    expect(ADMIN_DOSSIER_POLL_MS).toBe(30_000);
    expect(dashboard).toContain("adminDossierPolling(ADMIN_DOSSIER_POLL_MS)");
    expect(dashboard).toContain("determineAdminListNextAction");
    expect(dashboard).toContain("Prochaine action");
  });
});
