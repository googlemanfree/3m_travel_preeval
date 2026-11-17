import { describe, expect, it } from "vitest";
import { MemoryBilanAutoStore } from "./services/bilanAuto/memoryStore";
import { pickNextRun } from "./services/bilanAuto/types";
import { snapshotHasCv } from "./services/bilanAuto/drizzleStore";
import { orderForReview } from "./routers/adminBilanAuto";
import type { NewRun } from "./services/bilanAuto/types";

const NOW = new Date("2026-11-17T10:00:00Z");
function run(evaluationId: number, cvKey: string | null): NewRun {
  return {
    evaluationId, candidateId: evaluationId, submissionId: String(evaluationId), inputVersion: "v", rubricVersion: "travail-v1", promptVersion: "p", model: null, idempotencyKey: `k${evaluationId}`, mode: "validation_admin",
    state: "queued", attempts: 0, maxAttempts: 4, nextAttemptAt: null, lockedBy: null, lockedAt: null, lastError: null, outcome: null, score: null, scoreMax: null, thresholdReached: null,
    inputSnapshot: { form: {}, cv: { key: cvKey, fileName: cvKey ? "cv.pdf" : null, sha256: null }, documents: [], consents: { cv: true }, referenceDate: NOW.toISOString(), rubricVersion: "travail-v1", promptVersion: "p" },
    facts: null, scoreResult: null, orientations: null, report: null, reportHash: null, pdfKey: null, complement: null, previous: null, flags: [],
    reviewStatus: "none", validatedBy: null, validatedAt: null, publishedAt: null, notificationState: "none", supersededById: null, costEur: null, tokensUsed: null, dossierRef: null,
  } as NewRun;
}

describe("bilans automatisés : les dossiers avec CV passent d'abord", () => {
  it("choisit le plus ancien avec CV avant un plus ancien sans CV", () => {
    expect(pickNextRun([{ id: 1, hasCv: false }, { id: 2, hasCv: false }, { id: 5, hasCv: true }, { id: 3, hasCv: true }])).toEqual({ id: 3 });
    expect(pickNextRun([{ id: 4, hasCv: false }, { id: 2, hasCv: false }])).toEqual({ id: 2 });
    expect(pickNextRun([])).toBeUndefined();
  });
  it("la file en mémoire réserve d'abord les dossiers avec CV, puis les autres dans l'ordre d'arrivée", async () => {
    const store = new MemoryBilanAutoStore(() => NOW);
    await store.insertRun(run(1, null));
    await store.insertRun(run(2, "cv/2.pdf"));
    await store.insertRun(run(3, null));
    await store.insertRun(run(4, "cv/4.pdf"));
    const order: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const next = await store.claimNext("w", NOW, 60_000);
      if (!next) break;
      order.push(next.evaluationId);
      await store.updateRun(next.id, { state: "published" });
    }
    expect(order).toEqual([2, 4, 1, 3]);
  });
  it("lit la présence d'un CV dans l'instantané enregistré, et tolère un instantané illisible", () => {
    expect(snapshotHasCv(JSON.stringify({ cv: { key: "k" } }))).toBe(true);
    expect(snapshotHasCv(JSON.stringify({ cv: { key: null } }))).toBe(false);
    expect(snapshotHasCv("{pas du json")).toBe(false);
    expect(snapshotHasCv(null)).toBe(false);
  });
  it("la liste « prêts à valider » montre le plus ancien d'abord ; les autres filtres ne bougent pas", () => {
    const rows = [{ id: 9 }, { id: 3 }, { id: 6 }];
    expect(orderForReview(rows, "pret").map((r) => r.id)).toEqual([3, 6, 9]);
    expect(orderForReview(rows, "incident").map((r) => r.id)).toEqual([9, 3, 6]);
  });
});
