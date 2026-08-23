import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboard = readFileSync(resolve(import.meta.dirname, "../client/src/pages/AdminDashboard.tsx"), "utf8");

describe("file de priorités manuelle administrateur", () => {
  it("expose les alertes sans automatiser de décision ou de notification", () => {
    expect(dashboard).toContain("File de priorités");
    expect(dashboard).toContain("Indicateurs de travail à ouvrir manuellement par un conseiller");
    expect(dashboard).toContain("Aucune décision ni notification n’est déclenchée automatiquement");
    expect(dashboard).toContain("Évaluations externes à confirmer");
    expect(dashboard).toContain("Paiements à contrôler");
    expect(dashboard).toContain("Réservations vol à traiter");
  });

  it("oriente vers les modules existants plutôt que de modifier les dossiers", () => {
    expect(dashboard).toContain('tab: "pre-dossiers"');
    expect(dashboard).toContain('tab: "payments"');
    expect(dashboard).toContain('tab: "flights"');
    expect(dashboard).toContain("setActiveAdminTab(priority.tab)");
  });
});
