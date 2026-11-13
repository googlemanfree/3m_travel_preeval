import { describe, expect, it } from "vitest";
import { MemoryBilanAutoStore } from "./services/bilanAuto/memoryStore";
import { sendAdminDigest } from "./services/bilanAuto/adminDigest";
import type { NewRun } from "./services/bilanAuto/types";

const T0 = new Date("2026-11-13T10:00:00Z");
const base = (evaluationId: number, over: Partial<NewRun> = {}): NewRun => ({
  evaluationId, candidateId: evaluationId, dossierRef: null, submissionId: String(evaluationId), inputVersion: "v", rubricVersion: "r", promptVersion: "p", model: null, idempotencyKey: `k${evaluationId}`,
  mode: "validation_admin", state: "ready_for_review", attempts: 0, maxAttempts: 4, nextAttemptAt: null, lockedBy: null, lockedAt: null, lastError: null, outcome: "A", score: 70, scoreMax: 100, thresholdReached: true,
  inputSnapshot: { form: {}, cv: { key: null, fileName: null, sha256: null }, documents: [], consents: { cv: true }, referenceDate: T0.toISOString(), rubricVersion: "r", promptVersion: "p" },
  facts: null, scoreResult: null, orientations: null, report: null, reportHash: null, pdfKey: null, complement: null, previous: null, flags: [], reviewStatus: "pending", validatedBy: null, validatedAt: null,
  publishedAt: null, notificationState: "none", supersededById: null, costEur: null, tokensUsed: null, ...over,
});

function setup() {
  const clock = { now: T0.getTime() };
  const store = new MemoryBilanAutoStore(() => new Date(clock.now));
  const mails: Array<{ to: string; subject: string; text: string }> = [];
  const deps = { store, mailer: { send: async (m: any) => { mails.push(m); return {}; } }, now: () => new Date(clock.now), adminEmail: "admin@3m.test", adminUrl: "https://x.test/admin/bilans" };
  return { clock, store, mails, deps };
}

describe("alerte administrateur", () => {
  it("un seul e-mail récapitulatif pour plusieurs bilans prêts, sans nom de candidat, jamais renvoyé", async () => {
    const { store, mails, deps } = setup();
    await store.insertRun(base(1)); await store.insertRun(base(2));
    const first = await sendAdminDigest(deps);
    expect(first).toMatchObject({ sent: true, counts: { ready: 2, overdue: 0, incidents: 0 } });
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toBe("admin@3m.test");
    expect(mails[0].text).toMatch(/2 nouveau\(x\) bilan\(s\) prêt\(s\)/);
    expect(mails[0].text).toContain("https://x.test/admin/bilans");
    expect((await sendAdminDigest(deps)).sent).toBe(false);
    expect(mails).toHaveLength(1);
  });

  it("relance un bilan resté plus de 24 h sans validation, puis au plus une fois par 24 h", async () => {
    const { store, mails, deps, clock } = setup();
    await store.insertRun(base(1));
    await sendAdminDigest(deps);
    clock.now += 25 * 3600_000;
    const overdue = await sendAdminDigest(deps);
    expect(overdue.counts.overdue).toBe(1);
    expect(mails[1].text).toMatch(/plus de 24 h/);
    clock.now += 3600_000;
    expect((await sendAdminDigest(deps)).sent).toBe(false);
    clock.now += 24 * 3600_000;
    expect((await sendAdminDigest(deps)).counts.overdue).toBe(1);
  });

  it("signale un incident persistant une seule fois, et ignore simulation, publiés et versions remplacées", async () => {
    const { store, mails, deps } = setup();
    await store.insertRun(base(1, { state: "failed" }));
    await store.insertRun(base(2, { mode: "simulation" }));
    await store.insertRun(base(3, { state: "published" }));
    await store.insertRun(base(4, { state: "superseded" }));
    const result = await sendAdminDigest(deps);
    expect(result.counts).toEqual({ ready: 0, overdue: 0, incidents: 1 });
    expect(mails[0].text).toMatch(/1 incident/);
    expect((await sendAdminDigest(deps)).sent).toBe(false);
  });

  it("si l'e-mail échoue, rien n'est marqué envoyé : nouvelle tentative au cycle suivant", async () => {
    const { store, deps } = setup();
    await store.insertRun(base(1));
    const failing = await sendAdminDigest({ ...deps, mailer: { send: async () => { throw new Error("SMTP down"); } } });
    expect(failing.sent).toBe(false);
    expect(failing.error).toMatch(/SMTP down/);
    expect((await sendAdminDigest(deps)).sent).toBe(true);
  });

  it("aucun e-mail quand il n'y a rien à signaler", async () => {
    const { mails, deps } = setup();
    expect((await sendAdminDigest(deps)).sent).toBe(false);
    expect(mails).toHaveLength(0);
  });
});
