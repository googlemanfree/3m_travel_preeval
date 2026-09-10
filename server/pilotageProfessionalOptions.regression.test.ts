import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const candidate360 = readFileSync(resolve(process.cwd(), "client/src/components/Candidate360Workspace.tsx"), "utf8");
const dashboard = readFileSync(resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx"), "utf8");

 describe("options professionnelles du Pilotage", () => {
  it("affiche l’action suivante et les prérequis de cohérence", () => {
    expect(candidate360).toContain("Action suivante");
    expect(candidate360).toContain("Contrôle de cohérence avant action");
    expect(candidate360).toContain("Ouvrir l’espace concerné");
    expect(candidate360).toContain("nextActionTarget");
    for (const label of ["CV exploitable", "Évaluation validée", "Paiement confirmé", "Protocole", "Pièces requises"]) {
      expect(candidate360).toContain(label);
    }
  });

  it("affiche les échéances et le journal directement dans Candidate360", () => {
    expect(candidate360).toContain("Échéance de traitement");
    expect(candidate360).toContain("En retard");
    expect(candidate360).toContain("Journal d’activité");
    expect(candidate360).toContain("Dernières actions du dossier");
  });

  it("propose des filtres rapides par étape dans la liste des dossiers", () => {
    expect(dashboard).toContain("Filtres rapides par étape");
    for (const label of ["Évaluations à traiter", "Bilans / paiement", "Documents", "Soumission", "Visa accordé"]) {
      expect(dashboard).toContain(label);
    }
  });
});
