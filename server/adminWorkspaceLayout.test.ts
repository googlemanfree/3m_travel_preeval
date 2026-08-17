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
    const messageBlock = source.slice(source.indexOf("sendCandidate360Message:"), source.indexOf("sendCandidate360Message:") + 3_500);

    expect(messageBlock).toContain("requireValidAdminSession(input.sessionToken)");
    expect(messageBlock).toContain("caseActivityLogs");
    expect(messageBlock).toContain("candidateMessages");
  });
});
