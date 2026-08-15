import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("actions de dossier candidat", () => {
  it("sécurise le lien entre une pièce requise et le candidat connecté", () => {
    const router = read("server/routers/caseTracking.ts");
    expect(router).toContain("submitMyRequirementDocument");
    expect(router).toContain("eq(cases.candidateId, ctx.candidate.id)");
    expect(router).toContain("documentRequirements.status");
    expect(router).toContain('uploadedByRole: "candidate"');
    expect(router).toContain('actionType: "document_submitted"');
  });

  it("renvoie un historique de statut au candidat sans exposer le contrôle administratif", () => {
    const candidateRouter = read("server/routers/candidate.ts");
    expect(candidateRouter).toContain("applicationStatusHistory");
    expect(candidateRouter).toContain("statusHistory,");
    expect(candidateRouter).toContain("Dossier créé et enregistré.");
  });

  it("propose le dépôt direct, la chronologie datée et le contact d’assistance dans le dashboard", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain("Pièces à compléter");
    expect(dashboard).toContain("handleRequirementUpload");
    expect(dashboard).toContain("Historique du dossier");
    expect(dashboard).toContain("Chronologie des changements de statut");
    expect(dashboard).toContain("Contacter l’assistance");
    expect(dashboard).toContain("https://wa.me/");
  });
});
