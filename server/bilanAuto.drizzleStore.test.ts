import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import type { NewRun } from "./services/bilanAuto/types";

/**
 * Test d'intégration MySQL/MariaDB réel : schéma, clé d'idempotence unique, réservation atomique entre deux workers, déduplication de
 * l'outbox, suppression. Exécuté seulement si BILAN_AUTO_TEST_DATABASE_URL pointe vers une base JETABLE (jamais la production).
 */
const URL = process.env.BILAN_AUTO_TEST_DATABASE_URL;
const NOW = new Date("2026-11-13T10:00:00Z");

const base = (key: string, evaluationId = 1, candidateId = 7): NewRun => ({
  evaluationId, candidateId, dossierRef: "3M-1", submissionId: String(evaluationId), inputVersion: "v1", rubricVersion: "travail-v1", promptVersion: "p1", model: null,
  idempotencyKey: key, mode: "validation_admin", state: "queued", attempts: 0, maxAttempts: 4, nextAttemptAt: null, lockedBy: null, lockedAt: null, lastError: null,
  outcome: null, score: null, scoreMax: null, thresholdReached: null,
  inputSnapshot: { form: { a: 1 }, cv: { key: "k", fileName: "cv.pdf", sha256: null }, documents: [], consents: { cv: true }, referenceDate: NOW.toISOString(), rubricVersion: "travail-v1", promptVersion: "p1" },
  facts: null, scoreResult: null, orientations: null, report: null, reportHash: null, pdfKey: null, complement: null, previous: null, flags: [],
  reviewStatus: "none", validatedBy: null, validatedAt: null, publishedAt: null, notificationState: "none", supersededById: null, costEur: null, tokensUsed: null,
});

describe.skipIf(!URL)("store MySQL du bilan automatisé", () => {
  let store: import("./services/bilanAuto/drizzleStore").DrizzleBilanAutoStore;
  let db: NonNullable<Awaited<ReturnType<typeof import("./db").getDb>>>;

  beforeAll(async () => {
    process.env.DATABASE_URL = URL;
    const dbModule = await import("./db");
    db = (await dbModule.getDb())!;
    const guard = await import("./services/bilanAuto/schemaGuard");
    for (const table of ["bilan_auto_versions", "bilan_auto_sources", "bilan_auto_outbox", "bilan_auto_events", "bilan_auto_runs"]) await db.execute(sql.raw(`DROP TABLE IF EXISTS ${table}`));
    guard.resetBilanAutoSchemaGuardForTests();
    expect(await guard.ensureBilanAutoTables()).toBe(true);
    expect(await guard.ensureBilanAutoTables()).toBe(true); // idempotent
    const { DrizzleBilanAutoStore } = await import("./services/bilanAuto/drizzleStore");
    store = new DrizzleBilanAutoStore(db);
  });
  afterAll(async () => { for (const table of ["bilan_auto_versions", "bilan_auto_sources", "bilan_auto_outbox", "bilan_auto_events", "bilan_auto_runs"]) await db.execute(sql.raw(`DROP TABLE IF EXISTS ${table}`)); });

  it("insère, relit avec les JSON, et refuse une seconde insertion de la même clé d'idempotence", async () => {
    const first = await store.insertRun({ ...base("k-1"), facts: { ok: true } as never, flags: ["a"] });
    expect(first?.id).toBeGreaterThan(0);
    expect(first?.flags).toEqual(["a"]);
    expect(first?.inputSnapshot.cv.fileName).toBe("cv.pdf");
    expect(await store.insertRun(base("k-1"))).toBeNull();
    expect((await store.findByIdempotencyKey("k-1"))?.id).toBe(first!.id);
  });

  it("deux workers simultanés : un seul réserve le traitement", async () => {
    await store.insertRun(base("k-claim", 2));
    const results = await Promise.all([store.claimNext("w1", new Date(), 600_000), store.claimNext("w2", new Date(), 600_000), store.claimNext("w3", new Date(), 600_000)]);
    const claimed = results.filter((run) => run && run.evaluationId === 2);
    expect(claimed).toHaveLength(1);
  });

  it("le verrou expiré peut être repris, un verrou valide non", async () => {
    const run = (await store.insertRun(base("k-lock", 3)))!;
    await db.execute(sql.raw(`UPDATE bilan_auto_runs SET state='failed' WHERE id <> ${run.id}`)); // isole ce traitement
    const t0 = new Date();
    await store.updateRun(run.id, { lockedBy: "wX", lockedAt: t0, state: "queued" });
    expect(await store.claimNext("w2", new Date(t0.getTime() + 1000), 600_000)).toBeNull();
    const later = await store.claimNext("w2", new Date(t0.getTime() + 700_000), 600_000);
    expect(later?.id).toBe(run.id);
    expect(later?.lockedBy).toBe("w2");
  });

  it("la mise à jour gardée refuse un worker qui n'a plus le verrou ou un état inattendu", async () => {
    const run = (await store.insertRun(base("k-guard", 4)))!;
    await store.updateRun(run.id, { lockedBy: "w1" });
    expect(await store.updateRun(run.id, { state: "extracting" }, { lockedBy: "w2" })).toBeNull();
    expect((await store.updateRun(run.id, { state: "extracting" }, { lockedBy: "w1" }))?.state).toBe("extracting");
    expect(await store.updateRun(run.id, { state: "published" }, { expectedState: "queued" })).toBeNull();
  });

  it("l'outbox déduplique et un seul processus réserve un message", async () => {
    const run = (await store.insertRun(base("k-out", 5)))!;
    const entry = { runId: run.id, dedupKey: "dk-1", channel: "email" as const, recipient: "a@b.c", kind: "bilan_publie" as const };
    expect(await store.enqueueOutbox(entry)).not.toBeNull();
    expect(await store.enqueueOutbox(entry)).toBeNull();
    const claims = await Promise.all([store.claimOutbox(new Date(), 10), store.claimOutbox(new Date(), 10)]);
    expect(claims.flat().filter((c) => c.dedupKey === "dk-1")).toHaveLength(1);
  });

  it("comptabilise coûts et traitements, journalise et supprime les données d'un candidat", async () => {
    const run = (await store.insertRun({ ...base("k-cost", 6, 99), costEur: 0.123, pdfKey: "bilan-auto/6/x.pdf" }))!;
    expect(await store.sumCostSince(new Date(Date.now() - 60_000))).toBeGreaterThanOrEqual(0.123);
    expect(await store.countRunsSince(new Date(Date.now() - 60_000))).toBeGreaterThan(0);
    await store.addEvent({ runId: run.id, evaluationId: 6, actor: "t", action: "x", detail: "d", at: new Date() });
    expect(await store.listEvents(run.id)).toHaveLength(1);
    expect(await store.eraseCandidate(99)).toEqual({ runs: 1, pdfKeys: ["bilan-auto/6/x.pdf"] });
    expect(await store.getRun(run.id)).toBeNull();
    expect(await store.listEvents(run.id)).toHaveLength(0);
  });

  it("référentiel de sources : création, filtre par pays et activation, suppression", async () => {
    const { DrizzleSourcesStore, SourceInputSchema, makeReferentialSearch } = await import("./services/bilanAuto/sources");
    const sources = new DrizzleSourcesStore(db);
    const parsed = SourceInputSchema.parse({ country: "Luxembourg", kind: "salaire", occupation: "Technicien de maintenance", amountMin: 3000, amountMax: 3500, currency: "EUR", period: "mois", grossOrNet: "brut", url: "https://example.org/s", title: "Observatoire", observedAt: new Date().toISOString().slice(0, 10) });
    const created = await sources.create({ ...parsed, createdBy: "admin@3m.test" });
    expect(created.id).toBeGreaterThan(0);
    expect(created.active).toBe(true);
    expect((await sources.list({ country: "Pologne" })).length).toBe(0);
    const found = await makeReferentialSearch(sources)({ country: "Luxembourg", jobTitle: "Technicienne de maintenance" });
    expect(found.salaries[0].amount).toMatch(/brut/);
    await sources.setActive(created.id, false);
    expect((await makeReferentialSearch(sources)({ country: "Luxembourg", jobTitle: "Technicienne de maintenance" })).salaries).toHaveLength(0);
    await sources.remove(created.id);
    expect(await sources.list()).toHaveLength(0);
  });

  it("versions du bilan : numéros uniques par traitement, ordre, mise à jour gardée par statut, suppression avec le candidat", async () => {
    const run = (await store.insertRun({ ...base("k-versions", 8, 55) }))!;
    const report = { candidateName: "A", dossierRef: null, referenceDate: NOW.toISOString(), gridVersion: 1, score: 70, scoreMax: 100, threshold: 65, thresholdReached: true, verdictLabel: "v", sections: [{ id: "profil", title: "3", paragraphs: ["p"], bullets: [] }], disclaimer: "d" };
    const input = { runId: run.id, evaluationId: 8, versionNumber: 1, authorKind: "systeme" as const, author: "systeme", reason: "Proposition", status: "brouillon" as const, baseVersion: null, report, scoreResult: null, sources: [{ url: "https://example.org", title: "t", consultedAt: "2026-11-13" }], reportHash: "h1", pdfKey: null, publishedAt: null, publishedBy: null, notifiedAt: null };
    const v1 = await store.addVersion(input);
    expect(v1?.versionNumber).toBe(1);
    expect(await store.addVersion(input)).toBeNull(); // numéro déjà pris
    const v2 = await store.addVersion({ ...input, versionNumber: 2, authorKind: "admin", author: "admin@3m.test", baseVersion: 1, reportHash: "h2" });
    expect((await store.listVersions(run.id)).map((v) => v.versionNumber)).toEqual([1, 2]);
    expect((await store.listVersions(run.id))[0].sources[0].url).toBe("https://example.org");
    expect((await store.updateVersion(v2!.id, { status: "publiee", pdfKey: "k/pdf", publishedAt: new Date(), publishedBy: "admin@3m.test" }, { expectedStatus: "brouillon" }))?.status).toBe("publiee");
    expect(await store.updateVersion(v2!.id, { status: "publiee" }, { expectedStatus: "brouillon" })).toBeNull(); // déjà publiée : un second clic n'écrase rien
    expect((await store.eraseCandidate(55)).runs).toBe(1);
    expect(await store.listVersions(run.id)).toHaveLength(0);
  });
});
