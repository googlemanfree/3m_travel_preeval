import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(__dirname, "..", path), "utf8");

describe("liste principale du tableau de bord : pagination côté serveur", () => {
  const router = read("server/routers/admin.ts");
  const dashboard = read("client/src/pages/AdminDashboard.tsx");
  it("le serveur ne renvoie que la page demandée et calcule les compteurs sur toute la liste", () => {
    expect(router).toContain("candidates: allCandidates.slice((page - 1) * pageSize, page * pageSize),");
    expect(router).toContain("summary,");
    expect(router).toContain("attentionRows: [...externalEvaluation, ...agencyPhysical].slice(0, 8)");
    expect(router).not.toMatch(/candidates: allCandidates,\n/);
  });
  it("ne lit que les colonnes utilisées (plus de select() des 70 colonnes de chaque dossier)", () => {
    expect(router).toContain(".select(adminListOnlineColumns)");
    expect(router).toContain(".select(adminListAgencyColumns)");
    const procedure = router.slice(router.indexOf("  listCandidates: publicProcedure"), router.indexOf("  listCandidates: publicProcedure") + 4000);
    expect(procedure).not.toMatch(/\.select\(\)\s*\.from\(applications\)/);
    expect(procedure).not.toMatch(/\.select\(\)\s*\.from\(agencyDossiers\)/);
  });
  it("l'écran envoie la page et la taille, revient à la première page quand un filtre change, et affiche les contrôles", () => {
    expect(dashboard).toContain("page: candidatePage,");
    expect(dashboard).toContain("pageSize: candidatePageSize,");
    expect(dashboard).toContain("setCandidatePage(1);");
    for (const id of ["candidate-pagination", "candidate-page-prev", "candidate-page-next", "candidate-page-size", "candidate-page-indicator"]) expect(dashboard).toContain(`data-testid="${id}"`);
  });
  it("les compteurs de l'écran viennent du serveur, pas des lignes reçues", () => {
    expect(dashboard).toContain("listSummary?.stats.pending");
    expect(dashboard).not.toContain('candidates.filter((c) => c.status === "PENDING_48H").length');
    expect(dashboard).toContain("attentionRows.map(");
  });
});

describe("comptes à ouvrir : CV et documents de l'évaluation", () => {
  const router = read("server/routers/adminCandidateManagement.ts");
  const panel = read("client/src/components/AdminPreDossierAccountsPanel.tsx");
  it("les lectures de pièces, de CV et de documents sont limitées aux comptes affichés (plus de plafond global qui en masque)", () => {
    const start = router.indexOf("listPreDossierAccounts: publicProcedure");
    const procedure = router.slice(start, start + 9000);
    expect(procedure).toContain("inArray(candidateFiles.candidateId, accountIds)");
    expect(procedure).toContain("clientDocuments");
    expect(procedure).not.toContain(".from(candidateFiles).limit(5000)");
    expect(procedure).not.toContain(".from(evaluations).limit(10000)");
  });
  it("la fiche du pré-dossier liste les documents déposés à l'évaluation avec un lien pour chacun", () => {
    expect(panel).toContain('data-testid="predossier-evaluation-documents"');
    expect(panel).toContain("predossier-evaluation-document-");
  });
});
