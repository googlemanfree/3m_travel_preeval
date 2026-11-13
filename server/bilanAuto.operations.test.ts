import { describe, expect, it } from "vitest";
import { PROPOSED_RETENTION_POLICY, isRetentionApproved, planRetention } from "../shared/bilanAuto/retention";
import { GRID_V1 } from "../shared/bilanAuto/grid";
import { MemoryBilanAutoStore } from "./services/bilanAuto/memoryStore";
import { DEFAULT_CONFIG, configFromEnv, eraseBilanData, pdfKeyForCandidate, snapshotOf, inputVersionOf, type EvaluationInputs } from "./services/bilanAuto/pipeline";
import { matchesFilter, summarize } from "./routers/adminBilanAuto";
import type { NewRun, RunRecord } from "./services/bilanAuto/types";

const NOW = new Date("2026-11-13T10:00:00Z");
const day = 86_400_000;

function run(over: Partial<RunRecord> & { evaluationId: number; candidateId: number }): NewRun {
  return {
    submissionId: String(over.evaluationId), inputVersion: "v", rubricVersion: "travail-v1", promptVersion: "p", model: null, idempotencyKey: `k${over.evaluationId}${over.candidateId}`, mode: "validation_admin",
    state: "published", attempts: 0, maxAttempts: 4, nextAttemptAt: null, lockedBy: null, lockedAt: null, lastError: null, outcome: "A", score: 70, scoreMax: 100, thresholdReached: true,
    inputSnapshot: { form: {}, cv: { key: "k", fileName: "cv.pdf", sha256: null }, documents: [], consents: { cv: true }, referenceDate: NOW.toISOString(), rubricVersion: "travail-v1", promptVersion: "p" },
    facts: null, scoreResult: null, orientations: null, report: null, reportHash: null, pdfKey: `bilan-auto/${over.evaluationId}/b.pdf`, complement: null, previous: null, flags: [],
    reviewStatus: "validated", validatedBy: "admin", validatedAt: NOW, publishedAt: NOW, notificationState: "accepted_by_provider", supersededById: null, costEur: null, tokensUsed: null, dossierRef: null, ...over,
  } as NewRun;
}


describe("conservation et suppression", () => {
  it("la politique proposée n'est pas approuvée : aucune purge exécutable", () => {
    expect(isRetentionApproved(PROPOSED_RETENTION_POLICY)).toBe(false);
    const plan = planRetention([{ kind: "cv_justificatifs", id: "1", referenceDate: new Date(NOW.getTime() - 800 * day) }], PROPOSED_RETENTION_POLICY, NOW);
    expect(plan.executable).toBe(false);
    expect(plan.due).toHaveLength(1); // listé en simulation seulement
    expect(plan.reason).toMatch(/simulation uniquement/);
  });

  it("annonce les suppressions à venir avant l'échéance (préavis)", () => {
    const plan = planRetention([{ kind: "dossiers_inactifs", id: "2", referenceDate: new Date(NOW.getTime() - 345 * day) }, { kind: "dossiers_inactifs", id: "3", referenceDate: new Date(NOW.getTime() - 100 * day) }], PROPOSED_RETENTION_POLICY, NOW);
    expect(plan.notice.map((entry) => entry.item.id)).toEqual(["2"]);
    expect(plan.due).toHaveLength(0);
  });

  it("n'inclut aucune durée pour les dossiers actifs (tant que la finalité existe) et couvre les six catégories", () => {
    expect(PROPOSED_RETENTION_POLICY.rules.map((rule) => rule.category).sort()).toEqual(["bilans_historique", "cv_justificatifs", "dossiers_actifs", "dossiers_inactifs", "journaux_techniques", "sauvegardes"]);
    expect(planRetention([{ kind: "dossiers_actifs", id: "x", referenceDate: new Date(0) }], PROPOSED_RETENTION_POLICY, NOW).due).toHaveLength(0);
  });

  it("la suppression efface les données du candidat visé et seulement les siennes", async () => {
    const store = new MemoryBilanAutoStore(() => NOW);
    const mine = (await store.insertRun(run({ evaluationId: 1, candidateId: 7 })))!;
    const other = (await store.insertRun(run({ evaluationId: 2, candidateId: 8 })))!;
    await store.enqueueOutbox({ runId: mine.id, dedupKey: "a", channel: "email", recipient: "a@b.c", kind: "bilan_publie" });
    const result = await eraseBilanData({ store, now: () => NOW }, 7, "admin@3m.test");
    expect(result).toEqual({ runs: 1, pdfKeys: ["bilan-auto/1/b.pdf"] });
    expect(await store.getRun(mine.id)).toBeNull();
    expect(await store.listOutbox(mine.id)).toHaveLength(0);
    expect(await store.getRun(other.id)).not.toBeNull();
  });

  it("un candidat ne peut pas obtenir le PDF d'un autre candidat", async () => {
    const store = new MemoryBilanAutoStore(() => NOW);
    const mine = (await store.insertRun(run({ evaluationId: 1, candidateId: 7 })))!;
    expect(pdfKeyForCandidate(mine, 7)).toBe("bilan-auto/1/b.pdf");
    expect(pdfKeyForCandidate(mine, 8)).toBeNull();
    expect(pdfKeyForCandidate({ ...mine, state: "ready_for_review" }, 7)).toBeNull(); // pas avant publication
    expect(pdfKeyForCandidate(undefined, 7)).toBeNull();
  });
});

describe("filtre « bilan prêt » et supervision", () => {
  it("« prêt » = bilan prêt à valider, hors simulation et hors versions remplacées", () => {
    expect(matchesFilter({ state: "ready_for_review", mode: "validation_admin" }, "pret")).toBe(true);
    expect(matchesFilter({ state: "ready_for_review", mode: "simulation" }, "pret")).toBe(false);
    expect(matchesFilter({ state: "published", mode: "validation_admin" }, "pret")).toBe(false);
    expect(matchesFilter({ state: "superseded", mode: "validation_admin" }, "tous")).toBe(false);
    expect(matchesFilter({ state: "needs_information", mode: "validation_admin" }, "complement")).toBe(true);
    expect(matchesFilter({ state: "failed", mode: "validation_admin" }, "incident")).toBe(true);
    expect(matchesFilter({ state: "retry_pending", mode: "validation_admin" }, "incident")).toBe(true);
  });

  it("le résumé n'expose ni faits ni texte du CV", async () => {
    const store = new MemoryBilanAutoStore(() => NOW);
    const created = (await store.insertRun(run({ evaluationId: 1, candidateId: 7 })))!;
    const summary = summarize(created, { fullName: "Awa Ndiaye", email: "awa@example.org" });
    expect(Object.keys(summary)).not.toContain("facts");
    expect(summary.stateLabel).toBe("Bilan publié");
  });
});

describe("configuration et sécurité d'exploitation", () => {
  it("tout est désactivé par défaut, en validation administrateur, sans liste ni coût engagé", () => {
    const config = configFromEnv({});
    expect(config.enabled).toBe(false);
    expect(config.mode).toBe("validation_admin");
    expect(config.allowlistEmails).toBeNull();
    expect(DEFAULT_CONFIG.grid.approvedAt).toBeNull();
  });

  it("lit les variables d'exploitation sans jamais exposer de clé", () => {
    const config = configFromEnv({ BILAN_AUTO_ENABLED: "true", BILAN_AUTO_MODE: "simulation", BILAN_AUTO_ALLOWLIST_EMAILS: "A@x.test, b@x.test", BILAN_AUTO_DAILY_BUDGET_EUR: "5", BILAN_AUTO_NOTIFICATIONS_ENABLED: "false" });
    expect(config).toMatchObject({ enabled: true, mode: "simulation", allowlistEmails: ["a@x.test", "b@x.test"], dailyBudgetEur: 5, notificationsEnabled: false });
    const { grid: _grid, ...visible } = config;
    expect(JSON.stringify(visible)).not.toMatch(/KEY|SECRET|TOKEN|PASS/i);
  });

  it("une valeur de mode inconnue retombe sur la validation administrateur (jamais sur l'automatique)", () => {
    expect(configFromEnv({ BILAN_AUTO_ENABLED: "true", BILAN_AUTO_MODE: "n'importe quoi" }).mode).toBe("validation_admin");
  });

  it("la version des entrées ne dépend ni de la date du jour ni des empreintes lues plus tard", () => {
    const inputs = { evaluationId: 1, candidateId: 7, email: "a@b.c", fullName: "A", dossierRef: null, priorityCountry: null, submitted: true, projectIsWork: true, cvConsent: true, form: { fullName: "A" }, cv: { key: "k", fileName: "cv.pdf", sha256: null, stored: true, attachedToAccount: true, text: null, file: null }, documents: [] } as EvaluationInputs;
    const a = inputVersionOf(snapshotOf(inputs, "2026-11-13T00:00:00Z", "travail-v1"));
    const b = inputVersionOf(snapshotOf({ ...inputs, cv: { ...inputs.cv, sha256: "abc" } }, "2026-12-01T00:00:00Z", "travail-v1"));
    const c = inputVersionOf(snapshotOf({ ...inputs, cv: { ...inputs.cv, key: "autre" } }, "2026-11-13T00:00:00Z", "travail-v1"));
    const d = inputVersionOf(snapshotOf(inputs, "2026-11-13T00:00:00Z", "travail-v2"));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
    expect(GRID_V1.version).toBe(1);
  });
});
