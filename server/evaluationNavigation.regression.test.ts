import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("parcours d’évaluation et replis utilisateur", () => {
  const projectRoot = resolve(process.cwd());
  const clientSpace = readFileSync(resolve(projectRoot, "client/src/pages/ClientSpace.tsx"), "utf8");
  const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
  const dashboard = readFileSync(resolve(projectRoot, "client/src/pages/Dashboard.tsx"), "utf8");
  const candidate360 = readFileSync(resolve(projectRoot, "client/src/components/Candidate360Workspace.tsx"), "utf8");

  it("dirige Nouvelle évaluation vers le formulaire authentifié existant", () => {
    expect(clientSpace).toContain("setLocation('/evaluation')");
    expect(clientSpace).not.toContain("setLocation('/evaluation-ia')");
    expect(app).toContain('path={"/evaluation"}');
  });

  it("ouvre la préparation admin pour un dossier candidat interne sans exiger le préfixe online", () => {
    expect(candidate360).toContain("const canPrepareEvaluation = Number.isInteger(candidate.internalId) && candidate.internalId > 0;");
    expect(candidate360).not.toContain("candidate.id.startsWith(\"online_\")");
  });

  it("n’utilise plus le message legacy demandant une actualisation forcée", () => {
    expect(dashboard).not.toContain("Veuillez actualiser la page");
    expect(dashboard).toContain("Réessayer la synchronisation");
  });
});
