import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(__dirname, "..", path), "utf8");

describe("liste des candidats : classement rapide par CV et par évaluation", () => {
  const client = read("client/src/pages/CandidatesManager.tsx");
  it("propose quatre classements à part, avec leur effectif, au-dessus des filtres", () => {
    expect(client).toContain('data-testid="classement-rapide"');
    for (const id of ["tous", "cv-a-traiter", "non-evalues", "evalues"]) expect(client).toContain(`id: "${id}"`);
    expect(client).toContain("data?.tabCounts?.cvToProcess");
    expect(client).toContain("data?.tabCounts?.notEvaluated");
    expect(client).toContain("data?.tabCounts?.evaluated");
  });
  it("chaque classement règle le CV et l'évaluation ensemble, et revient à la première page", () => {
    expect(client).toMatch(/id: "cv-a-traiter"[^}]*cv: "a_traiter", evaluation: "all"/);
    expect(client).toMatch(/id: "non-evalues"[^}]*cv: "all", evaluation: "non_evalue"/);
    expect(client).toMatch(/id: "evalues"[^}]*cv: "all", evaluation: "evalue"/);
    expect(client).toContain("setCvFilter(tab.cv); setEvaluationFilter(tab.evaluation); resetToFirstPage();");
  });
  it("le choix part au serveur et relance la liste", () => {
    expect(client).toContain("evaluationStatus: evaluationFilter,");
    expect(client).toMatch(/cvFilter, evaluationFilter, sortBy, page, pageSize\]\);/);
  });
  it("chaque ligne indique « Évalué » ou « Non évalué »", () => {
    expect(client).toContain('data-testid="evaluation-badge"');
    expect(client).toContain('"Non évalué"');
  });
  it("le serveur accepte le filtre et calcule les effectifs des onglets sans le classement lui-même", () => {
    expect(read("server/routers/adminCandidateManagement.ts")).toContain('evaluationStatus: z.enum(["all", "evalue", "non_evalue"]).default("all")');
    const service = read("server/services/candidateListQuery.ts");
    expect(service).toContain('cvStatus: "all", evaluationStatus: "all"');
    expect(service).toContain("tabCounts");
  });
});
