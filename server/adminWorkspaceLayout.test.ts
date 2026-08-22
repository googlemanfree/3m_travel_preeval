import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardPath = resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx");
const workspacePath = resolve(process.cwd(), "client/src/components/Candidate360Workspace.tsx");

describe("poste de pilotage administrateur", () => {
  it("ouvre la fiche dossier dans un espace pleine largeur adapté au PC", () => {
    const source = readFileSync(dashboardPath, "utf8");

    expect(source).toContain('w-[calc(100vw-1rem)]');
    expect(source).toContain('max-w-[1920px]');
    expect(source).toContain("Poste de pilotage dossier 360°");
    expect(source).toContain("Décision de procédure");
    expect(source).toContain("Contrôler les documents");
    expect(source).toContain("Valider un paiement");
    expect(source).toContain("Suivre les envois e-mail");
  });

  it("organise les accès rapides en pôles HD plutôt qu’en onglets entassés", () => {
    const source = readFileSync(dashboardPath, "utf8");

    ["Pilotage des dossiers", "Services & catalogue", "Réservations & finance", "Communication & qualité", "Supervision"].forEach((label) => {
      expect(source).toContain(label);
    });
    expect(source).toContain('xl:grid-cols-5');
    expect(source).toContain('aria-label="Poste administratif par pôle opérationnel"');
  });

  it("conserve des raccourcis opérationnels explicites pour actualiser, revenir et retrouver les dossiers", () => {
    const source = readFileSync(dashboardPath, "utf8");
    const shortcuts = readFileSync(resolve(process.cwd(), "client/src/components/AdminNavigationShortcuts.tsx"), "utf8");

    expect(source).toContain("<AdminNavigationShortcuts");
    expect(source).toContain('onRefresh={() => void handleRefresh()}');
    expect(source).toContain('onBack={goBackInsideAdmin}');
    expect(source).toContain('onDossiers={() => changeAdminTab("candidates")}');
    expect(shortcuts).toContain('aria-label="Actualiser manuellement les données du dashboard"');
    expect(shortcuts).toContain('title="Revenir au dernier espace du back-office"');
    expect(shortcuts).toContain('title="Revenir au poste de pilotage des dossiers"');
  });

  it("conserve les six domaines opérationnels de gestion des dossiers", () => {
    const source = readFileSync(workspacePath, "utf8");

    ["Vue d’ensemble", "Évaluation", "Documents", "Paiements", "Échanges", "Historique"].forEach((label) => {
      expect(source).toContain(label);
    });
    ["updateCandidate360Workflow", "createCountryDocumentChecklist", "sendCandidate360DocumentReminder", "sendCandidate360Message"].forEach((procedure) => {
      expect(source).toContain(procedure);
    });
  });

  it("protège la communication et l’historique par une session administrateur côté serveur", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/admin.ts"), "utf8");
    const messageStart = source.indexOf("sendCandidate360Message:");
    const messageBlock = source.slice(messageStart, source.indexOf("}),\n});", messageStart));

    expect(messageBlock).toContain("requireValidAdminSession(input.sessionToken)");
    expect(messageBlock).toContain("caseActivityLogs");
    expect(messageBlock).toContain("candidateMessages");
  });
});
