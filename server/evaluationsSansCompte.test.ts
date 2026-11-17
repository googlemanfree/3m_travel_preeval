import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { attachSiblingProcedures, retainSiblingGroupsInFilteredList } from "../shared/clientMultiDossier";
import { dossierStageOf, dossierStatusLabel } from "../shared/dossierStages";

const read = (path: string) => readFileSync(resolve(__dirname, "..", path), "utf8");

describe("évaluations faites sans compte ni dossier : visibles dans les listes", () => {
  it("les statuts d'évaluation ont une étape et un libellé lisible", () => {
    expect(dossierStageOf("pending")).toBe("nouveau");
    expect(dossierStageOf("reviewed")).toBe("evaluation");
    expect(dossierStageOf("contacted")).toBe("evaluation");
    expect(dossierStageOf("closed")).toBe("traitement");
    expect(dossierStatusLabel("pending")).toBe("Évaluation reçue");
    expect(dossierStatusLabel("closed")).toBe("Évaluation clôturée");
  });
  it("une évaluation seule n'a ni procédures sœurs ni n'entraîne d'autres lignes dans un filtre", () => {
    const rows = [
      { id: "evaluation_1", email: "a@x.org", folderCode: "EVAL-00001", projectType: "travail", destinationCountry: "Canada", source: "EVALUATION_ONLY", status: "PENDING_48H" },
      { id: "online_2", email: "a@x.org", folderCode: "3M-2", projectType: "travail", destinationCountry: "Canada", source: "WEB", status: "PENDING_48H" },
    ];
    const attached = attachSiblingProcedures(rows);
    expect(attached[0]).toMatchObject({ siblingCount: 0, siblingProcedures: [] });
    expect(attached[1].siblingProcedures).toEqual([]); // la ligne « évaluation seule » n'est pas comptée comme procédure sœur
    expect(retainSiblingGroupsInFilteredList([rows[0]], rows).map((row) => row.id)).toEqual(["evaluation_1"]);
  });
  it("le tableau de bord les liste (source « Évaluation seule »), sans fiche 360° : ouverture dans le tableau des évaluations", () => {
    const router = read("server/routers/admin.ts");
    expect(router).toContain('source: "EVALUATION_ONLY" as const');
    expect(router).toContain('"EVALUATION_ONLY"]).optional()');
    expect(router).toContain("row.status !== \"closed\"");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('EVALUATION_ONLY: {');
    expect(dashboard).toContain('selectedCandidateId?.startsWith("evaluation_")');
    expect(dashboard).toContain("/admin/ai-evaluations?q=");
  });
  it("la liste des candidats les affiche avec un repère et les ouvre dans le tableau des évaluations", () => {
    const manager = read("client/src/pages/CandidatesManager.tsx");
    expect(manager).toContain('data-testid="evaluation-only-badge"');
    expect(manager).toContain("/admin/ai-evaluations?q=");
    expect(read("server/services/candidateListQuery.ts")).toContain('evaluation: "evaluation"');
  });
  it("le tableau des évaluations accepte « ?q= » et retrouve une évaluation par son numéro", () => {
    const hub = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(hub).toContain('new URLSearchParams(window.location.search).get("q")');
    expect(hub).toContain("/^evaluation_(\\d+)$/");
  });
});

describe("index recommandés pour la base", () => {
  const create = read("scripts/sql/indexes-recommandes.sql");
  const drop = read("scripts/sql/indexes-recommandes-retour.sql");
  it("chaque index créé a son retour arrière, et inversement", () => {
    const created = Array.from(create.matchAll(/CREATE INDEX (\w+) ON (\w+)/g)).map((m) => `${m[1]}@${m[2]}`).sort();
    const dropped = Array.from(drop.matchAll(/DROP INDEX (\w+) ON (\w+)/g)).map((m) => `${m[1]}@${m[2]}`).sort();
    expect(created.length).toBeGreaterThanOrEqual(10);
    expect(dropped).toEqual(created);
  });
  it("ne touche à aucune donnée : uniquement des instructions d'index", () => {
    const statements = (create + drop).split("\n").filter((line) => line.trim() && !line.trim().startsWith("--"));
    expect(statements.every((line) => /^(CREATE INDEX|DROP INDEX)\b/.test(line.trim()))).toBe(true);
  });
  it("la documentation décrit chaque index", () => {
    const doc = read("docs/INDEX_BASE_DE_DONNEES.md");
    for (const match of create.matchAll(/CREATE INDEX (\w+)/g)) expect(doc).toContain(match[1]);
  });
});
