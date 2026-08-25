import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/AdminDashboard.tsx"), "utf8");

describe("cockpit de pilotage des dossiers", () => {
  it("présente des priorités explicites, des échéances et des actions suivantes sans automatiser les décisions", () => {
    expect(source).toContain("getManualPriorityDeadline");
    expect(source).toContain("manualPriorities");
    expect(source).toContain("Échéances par conseiller");
    expect(source).toContain("Aucun rappel, changement de statut ou notification n’est déclenché automatiquement");
    expect(source).toContain("advisorDeadlinePriorityFilter");
  });

  it("préserve les filtres, le tri et l’actualisation manuelle du poste de pilotage", () => {
    expect(source).toContain("Trier les dossiers");
    expect(source).toContain("Priorités d’abord");
    expect(source).toContain("setLastSyncedAt");
    expect(source).not.toContain("setInterval(");
  });
});
