import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("admin — CV d’évaluation visible sans creuser la validation", () => {
  it("expose cvFileUrl / cvFileName dans le dashboard unifié des évaluations", () => {
    const router = read("server/routers/aiEvaluationManagement.ts");
    expect(router).toContain("cvFileUrl: e.cvFileUrl ?? null");
    expect(router).toContain("cvFileName: e.cvFileName ?? null");
    expect(router).toContain("cvFileUrl: c.cvFileUrl ?? null");
  });

  it("affiche un lien Ouvrir le CV sur la liste admin des évaluations", () => {
    const dashboard = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(dashboard).toContain("isOpenableStoredUrl");
    expect(dashboard).toContain("evaluation-cv-open-link");
    expect(dashboard).toContain("href={item.cvFileUrl!}");
    expect(dashboard).toContain('target="_blank"');
    expect(dashboard).toContain('rel="noopener noreferrer"');
    expect(dashboard).toContain("Ouvrir le CV");
    expect(dashboard).toContain("evaluation-cv-missing-badge");
  });

  it("retombe sur le CV d’évaluation dans Candidate360 et le pré-dossier", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("evaluation-cv-${latestEvaluation.id}");
    expect(admin).toContain("cvFileUrl: latestEvaluation.cvFileUrl ?? null");

    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("evaluationContext?.cvFileUrl");
    expect(workspace).toContain("candidate360-cv-open");
    expect(workspace).toContain('target="_blank"');
    expect(workspace).toContain('rel="noopener noreferrer"');
    expect(workspace).toContain("Soumis à l’évaluation");

    const predossierRouter = read("server/routers/adminCandidateManagement.ts");
    expect(predossierRouter).toContain("cvFileUrl: fileCv?.url ?? evalCv?.url ?? null");
    expect(predossierRouter).toContain("cvFileName: fileCv?.fileName ?? evalCv?.fileName ?? null");

    const predossierUi = read("client/src/components/AdminPreDossierAccountsPanel.tsx");
    expect(predossierUi).toContain("predossier-cv-open-");
    expect(predossierUi).toContain('target="_blank"');
    expect(predossierUi).toContain('rel="noopener noreferrer"');
    expect(predossierUi).toContain("Ouvrir le CV");
  });
});
