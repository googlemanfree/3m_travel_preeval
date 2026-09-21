import { describe, expect, it, vi } from "vitest";
import { defaultPortalUrl, openStructuredEvaluation, runAiDraft } from "./services/structuredEvaluationPipeline";
import type { ValidationDeps } from "./services/evaluationValidationCore";
import { CANDIDATE_CONTEXT, FakeMailer, GOOD_SCORES, InMemoryValidationStore, missingTablesError } from "./services/evaluationValidationTestkit";
import { AI_UNAVAILABLE_MESSAGE, type EvaluationRowForDraft } from "./services/structuredEvaluationDraft";

const NOW = new Date("2026-09-21T09:00:00.000Z");
const CONSENT = JSON.stringify({ preparatoryAnalysisConsent: true });

const row = (overrides: Partial<EvaluationRowForDraft> = {}): EvaluationRowForDraft => ({
  id: 1,
  fullName: "Aïcha Nkolo",
  destinationCountry: "Canada",
  destinationCategory: "canada",
  visaType: "canada_travail",
  projectType: "travail",
  projectDetailsJson: CONSENT,
  ...overrides,
});

const modelOutput = () => ({
  gaps: { blocking: [], reinforceable: [], nonBlocking: [] },
  route: "A",
  alternativeCountries: [],
  scores: GOOD_SCORES,
  strengths: ["Expérience déclarée"],
  improvements: [],
  targetJobs: [],
  targetSectors: [],
  riskLevel: "faible",
  profileSummary: "Profil à examiner.",
  actionPlan: [],
  requiredDocuments: [],
});

function setup(evaluationRow: EvaluationRowForDraft | null = row()) {
  const store = new InMemoryValidationStore([CANDIDATE_CONTEXT], () => NOW);
  const mailer = new FakeMailer(store.timeline);
  const deps: ValidationDeps = { store, mailer, now: () => NOW, portalUrl: "https://www.3mtravelagency.com/evaluation" };
  const invoke = vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify(modelOutput()) } }] }) as never);
  const run = { loadRow: async () => evaluationRow, generator: { invoke } };
  return { store, mailer, deps, invoke, run };
}

describe("lien du portail dans l'e-mail de notification", () => {
  it("pointe vers l'espace candidat protégé (/mon-espace), jamais vers le formulaire d'évaluation (/evaluation)", () => {
    const previous = process.env.SITE_URL;
    try {
      delete process.env.SITE_URL;
      expect(defaultPortalUrl()).toBe("https://www.3mtravelagency.com/mon-espace");
      process.env.SITE_URL = "https://staging.example.org//";
      expect(defaultPortalUrl()).toBe("https://staging.example.org/mon-espace");
    } finally {
      if (previous === undefined) delete process.env.SITE_URL;
      else process.env.SITE_URL = previous;
    }
  });

  it("existe bien comme route protégée par connexion dans l'application (garde-fou contre un lien mort)", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8").replace(/\r\n/g, "\n");
    expect(source).toMatch(/<Route path=\{"\/mon-espace"\}>\s*<AuthGuard[^>]*>\s*<EvaluationSpace \/>/);
  });
});

describe("ouverture du dossier à la soumission", () => {
  it("crée le dossier « DOSSIER REÇU » puis range le brouillon IA en attente de validation, sans rien envoyer", async () => {
    const s = setup();
    await openStructuredEvaluation(1, { deps: s.deps, run: s.run, background: false });
    const record = await s.store.getLatestCase(1);
    expect(record?.workflowStatus).toBe("attente_validation_admin");
    expect(record?.aiDraft?.priorityCountry).toBe("Canada");
    expect(record?.publishedReport).toBeNull();
    expect(s.mailer.sent).toHaveLength(0);
  });

  it("ne bloque pas la soumission : l'analyse tourne en arrière-plan", async () => {
    const s = setup();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const slow = { loadRow: async () => { await gate; return row(); }, generator: s.run.generator };
    await openStructuredEvaluation(1, { deps: s.deps, run: slow });
    expect((await s.store.getLatestCase(1))?.workflowStatus).toBe("dossier_recu");
    expect(s.invoke).not.toHaveBeenCalled();
    release();
    await vi.waitFor(async () => expect((await s.store.getLatestCase(1))?.workflowStatus).toBe("attente_validation_admin"));
  });

  it("sans consentement à l'analyse IA, ouvre le dossier mais n'appelle jamais le modèle", async () => {
    const s = setup(row({ projectDetailsJson: null }));
    await openStructuredEvaluation(1, { deps: s.deps, run: s.run, background: false });
    expect((await s.store.getLatestCase(1))?.workflowStatus).toBe("dossier_recu");
    expect(s.invoke).not.toHaveBeenCalled();
  });

  it("un échec du modèle est enregistré pour l'administrateur au lieu de faire échouer la soumission", async () => {
    const s = setup();
    s.invoke.mockRejectedValueOnce(new Error("Quota dépassé"));
    await expect(openStructuredEvaluation(1, { deps: s.deps, run: s.run, background: false })).resolves.toBeUndefined();
    expect(await s.store.getLatestCase(1)).toMatchObject({ workflowStatus: "attente_validation_admin", aiDraftError: AI_UNAVAILABLE_MESSAGE });
  });

  it("ne lève jamais, même si la base ou les tables sont indisponibles", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const s = setup();
    const broken: ValidationDeps = { ...s.deps, store: Object.assign(Object.create(s.store), { getLatestCase: async () => { throw new Error("connexion perdue"); } }) };
    await expect(openStructuredEvaluation(1, { deps: broken, run: s.run, background: false })).resolves.toBeUndefined();
    const missing: ValidationDeps = { ...s.deps, store: Object.assign(Object.create(s.store), { getLatestCase: async () => { throw missingTablesError(); } }) };
    await expect(openStructuredEvaluation(1, { deps: missing, run: s.run, background: false })).resolves.toBeUndefined();
    await expect(openStructuredEvaluation(1, { deps: null })).resolves.toBeUndefined();
    expect(quiet).toHaveBeenCalledTimes(1); // seule la vraie panne est journalisée, pas la migration manquante
    quiet.mockRestore();
  });

  it("est idempotent : rouvrir un dossier déjà analysé ne rappelle pas le modèle", async () => {
    const s = setup();
    await openStructuredEvaluation(1, { deps: s.deps, run: s.run, background: false });
    await openStructuredEvaluation(1, { deps: s.deps, run: s.run, background: false });
    expect(s.invoke).toHaveBeenCalledTimes(1);
    expect(s.store.cases).toHaveLength(1);
  });

  it("ne relance pas l'analyse d'un dossier déjà en revue ou publié", async () => {
    const s = setup();
    await runAiDraft(s.deps, 1, s.run);
    const current = await s.store.getLatestCase(1);
    await s.store.updateCaseIf(current!.id, "attente_validation_admin", { workflowStatus: "en_revue_admin", aiDraft: null });
    await runAiDraft(s.deps, 1, s.run);
    expect(s.invoke).toHaveBeenCalledTimes(1);
  });
});
