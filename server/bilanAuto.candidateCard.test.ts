import { describe, expect, it } from "vitest";
import { MemoryBilanAutoStore } from "./services/bilanAuto/memoryStore";
import { latestRunsForEvaluations } from "./routers/adminBilanAuto";
import type { NewRun, RunState } from "./services/bilanAuto/types";

const NOW = new Date("2026-11-15T10:00:00Z");
function run(evaluationId: number, key: string, state: RunState): NewRun {
  return {
    evaluationId, candidateId: 1, submissionId: String(evaluationId), inputVersion: key, rubricVersion: "travail-v1", promptVersion: "p", model: null, idempotencyKey: `${evaluationId}:${key}`, mode: "validation_admin",
    state, attempts: 0, maxAttempts: 4, nextAttemptAt: null, lockedBy: null, lockedAt: null, lastError: null, outcome: null, score: null, scoreMax: null, thresholdReached: null,
    inputSnapshot: { form: {}, cv: { key: null, fileName: null, sha256: null }, documents: [], consents: { cv: true }, referenceDate: NOW.toISOString(), rubricVersion: "travail-v1", promptVersion: "p" },
    facts: null, scoreResult: null, orientations: null, report: null, reportHash: null, pdfKey: null, complement: null, previous: null, flags: [],
    reviewStatus: "none", validatedBy: null, validatedAt: null, publishedAt: null, notificationState: "none", supersededById: null, costEur: null, tokensUsed: null, dossierRef: null,
  } as NewRun;
}

describe("bilan automatisé dans la fiche 360 : choix des traitements affichés", () => {
  it("ne garde que le dernier traitement non remplacé de chaque évaluation, le plus récent d'abord", async () => {
    const store = new MemoryBilanAutoStore(() => NOW);
    await store.insertRun(run(10, "a", "superseded"));
    await store.insertRun(run(10, "b", "ready_for_review"));
    await store.insertRun(run(11, "a", "published"));
    const rows = await latestRunsForEvaluations(store, [10, 11]);
    expect(rows.map((row) => [row.evaluationId, row.state])).toEqual([[11, "published"], [10, "ready_for_review"]]);
  });

  it("renvoie une liste vide sans traitement, et ignore une évaluation entièrement remplacée", async () => {
    const store = new MemoryBilanAutoStore(() => NOW);
    expect(await latestRunsForEvaluations(store, [])).toEqual([]);
    expect(await latestRunsForEvaluations(store, [99])).toEqual([]);
    await store.insertRun(run(12, "a", "superseded"));
    expect(await latestRunsForEvaluations(store, [12])).toEqual([]);
  });

  it("limite à 5 évaluations pour ne pas multiplier les lectures", async () => {
    const store = new MemoryBilanAutoStore(() => NOW);
    for (let id = 1; id <= 8; id += 1) await store.insertRun(run(id, "a", "published"));
    expect(await latestRunsForEvaluations(store, [1, 2, 3, 4, 5, 6, 7, 8])).toHaveLength(5);
  });
});
