import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_DOSSIER_POLL_MS, adminDossierPolling } from "../shared/adminSync";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("gestion des dossiers côté admin (sans mutation des données client)", () => {
  it("expose un helper de polling admin dossier partagé", () => {
    expect(ADMIN_DOSSIER_POLL_MS).toBe(30_000);
    expect(adminDossierPolling()).toEqual({
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    });
  });

  it("poll la fiche 360° et affiche la sync de référence", () => {
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("adminDossierPolling(ADMIN_DOSSIER_POLL_MS)");
    expect(workspace).toContain('data-testid="candidate360-sync"');
    expect(workspace).toContain("candidate.folderCode");
  });

  it("poll le pilotage et les pré-dossiers avec horodatage", () => {
    const pilotage = read("client/src/components/AdminPilotageQueue.tsx");
    expect(pilotage).toContain("adminDossierPolling(ADMIN_DOSSIER_POLL_MS)");
    expect(pilotage).toContain('data-testid="pilotage-sync"');
    expect(pilotage).not.toContain("refetchInterval: 60_000");

    const predossier = read("client/src/components/AdminPreDossierAccountsPanel.tsx");
    expect(predossier).toContain("adminDossierPolling(ADMIN_DOSSIER_POLL_MS)");
    expect(predossier).toContain('data-testid="predossier-sync"');
  });

  it("affiche la prochaine action sur le Kanban sans écrire côté client", () => {
    const kanban = read("client/src/components/AdminCandidateKanban.tsx");
    expect(kanban).toContain("determineAdminListNextAction");
    expect(kanban).toContain('data-testid="kanban-next-action"');
    expect(kanban).not.toContain("mutate(");
  });

  it("propose un filtre rapide, un tri et un code couleur pour les actions prioritaires", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("nextActionFilter");
    expect(dashboard).toContain("nextActionSort");
    expect(dashboard).toContain("Critiques / en retard");
    expect(dashboard).toContain("Urgents d’abord");
    expect(dashboard).toContain("ADMIN_NEXT_ACTION_URGENCY_CLASS[next.urgency]");
  });

  it("affiche un skeleton accessible pendant l’ouverture de la fiche 360°", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('data-testid="candidate360-loading-skeleton"');
    expect(dashboard).toContain("Synchronisation de la fiche 360°");
    expect(dashboard).toContain("transition-opacity duration-200");
  });
});
