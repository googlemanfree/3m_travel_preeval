import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const adminRouter = readFileSync(resolve(projectRoot, "server/routers/admin.ts"), "utf8");
const dashboard = readFileSync(resolve(projectRoot, "client/src/pages/AdminDashboard.tsx"), "utf8");

describe("échéances de traitement par conseiller", () => {
  it("expose une lecture administrateur des échéances de dossiers et tâches", () => {
    expect(adminRouter).toContain("listAdvisorTreatmentDeadlines");
    expect(adminRouter).toContain("requireValidAdminSession(input.sessionToken)");
    expect(adminRouter).toContain("groupAdvisorTreatmentDeadlines");
    expect(adminRouter).toContain("classifyTreatmentDeadline");
    expect(adminRouter).toContain("caseTasks");
  });

  it("présente des indicateurs sans déclencher de transition ou de notification", () => {
    expect(dashboard).toContain("Échéances par conseiller");
    expect(dashboard).toContain("Aucun rappel, changement de statut ou notification n’est déclenché automatiquement");
    expect(dashboard).toContain("Filtrer les échéances par priorité");
    expect(dashboard).toContain("Toutes priorités");
    expect(adminRouter).toContain("Échéance dépassée");
    expect(adminRouter).toContain("À traiter sous 24 h");
  });

  it("affiche une synthèse SMTP sans divulguer les détails sensibles de remise", () => {
    expect(dashboard).toContain("Remises SMTP");
    expect(dashboard).toContain("Taux de réussite");
    expect(dashboard).toContain("Dernières erreurs de remise");
    expect(dashboard).toContain("Les détails sensibles ne sont pas affichés ici.");
    expect(dashboard).toContain("getEmailDeliveryLogs");
  });
});
