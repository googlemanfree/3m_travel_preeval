import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(__dirname, "..", path), "utf8");

describe("dossiers avec CV : prioritaires pour le traitement du bilan", () => {
  it("liste principale du tableau de bord : le tri « priorité » met d'abord les CV à traiter, repère et bandeau à l'écran", () => {
    const router = read("server/routers/admin.ts");
    expect(router).toContain("if (candidate.cvToProcess) return 0;");
    expect(router).toContain("cvToProcessCount: allCandidates.filter((candidate) => candidate.cvToProcess).length");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('data-testid="cv-to-process-badge"');
    expect(dashboard).toContain('data-testid="cv-to-process-banner"');
    expect(dashboard).toContain('href="/admin/candidates"');
  });
  it("file de pilotage : catégorie « CV reçu — bilan à traiter » en tête, présente à l'écran", () => {
    const queue = read("server/services/pilotageQueue.ts");
    expect(queue).toContain('"cv_to_process"');
    expect(queue).toContain("isCvFirst");
    const panel = read("client/src/components/AdminPilotageQueue.tsx");
    expect(panel).toContain('cv_to_process: { label: "CV reçu — bilan à traiter"');
    expect(panel).toContain("summary?.cvToProcess");
  });
  it("liste des candidats : tri « priorité » par défaut, CV à traiter d'abord (en base comme dans l'ancien calcul)", () => {
    expect(read("client/src/lib/adminCandidatePagination.ts")).toContain('readText(params, "sort", "priorite")');
    expect(read("client/src/pages/CandidatesManager.tsx")).toContain("Priorité : CV à traiter d’abord");
    expect(read("server/services/candidateListQuery.ts")).toContain('filter.sortBy === "priorite"');
    expect(read("server/routers/adminCandidateManagement.ts")).toContain('z.enum(["createdAt", "fullName", "score", "priorite"])');
  });
  it("l'activation automatique ne touche que la file « prêts à activer » (la nouvelle file ne déclenche rien)", () => {
    expect(read("server/services/autoActivatePreDossier.ts")).toContain('item.category === "ready_to_activate"');
  });
});
