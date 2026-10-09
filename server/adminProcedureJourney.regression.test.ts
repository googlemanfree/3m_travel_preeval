import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("admin étapes dynamiques par pays", () => {
  it("enrichit listCandidates avec procedureJourney", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("buildAdminProcedureSnapshot");
    expect(admin).toContain("procedureJourney:");
  });

  it("affiche l’étape pays dans le tableau et le Kanban admin", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('data-testid="admin-procedure-journey"');
    expect(dashboard).toContain("procedureStageLabel");
    expect(dashboard).toContain("ADMIN_OPERATIONAL_STAGES");

    const kanban = read("client/src/components/AdminCandidateKanban.tsx");
    expect(kanban).toContain('data-testid="kanban-country-step"');
    expect(kanban).toContain("Dépôt / soumission");
    expect(kanban).not.toContain('label: "Soumission consulaire"');
  });

  it("évite les faux bouchons paiement / protocole déjà validés en 360°", () => {
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("paymentConfirmed");
    expect(workspace).toContain("protocolSigned");
    expect(workspace).toContain("Confirmé (");
  });
});
