import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BACKGROUND_MAX_RUNS_PER_WINDOW,
  allowBackgroundAnalysis,
  openStructuredEvaluation,
  resetBackgroundAnalysisLimiter,
  runAiDraft,
} from "./services/structuredEvaluationPipeline";
import type { ValidationDeps } from "./services/evaluationValidationCore";
import { CANDIDATE_CONTEXT, FakeMailer, GOOD_SCORES, InMemoryValidationStore } from "./services/evaluationValidationTestkit";
import type { EvaluationRowForDraft } from "./services/structuredEvaluationDraft";

const NOW = new Date("2026-09-21T09:00:00.000Z");

const row = (): EvaluationRowForDraft => ({
  id: 1,
  fullName: "Aïcha Nkolo",
  destinationCountry: "Canada",
  destinationCategory: "canada",
  visaType: "canada_travail",
  projectType: "travail",
  projectDetailsJson: JSON.stringify({ preparatoryAnalysisConsent: true }),
});

const modelOutput = () => ({
  gaps: { blocking: [], reinforceable: [], nonBlocking: [] },
  route: "A",
  alternativeCountries: [],
  scores: GOOD_SCORES,
  strengths: [],
  improvements: [],
  targetJobs: [],
  targetSectors: [],
  riskLevel: "faible",
  profileSummary: "Profil à examiner.",
  actionPlan: [],
  requiredDocuments: [],
});

function setup() {
  const store = new InMemoryValidationStore([CANDIDATE_CONTEXT], () => NOW);
  const deps: ValidationDeps = { store, mailer: new FakeMailer(store.timeline), now: () => NOW, portalUrl: "https://www.3mtravelagency.com/mon-espace" };
  const invoke = vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify(modelOutput()) } }] }) as never);
  return { store, deps, invoke, run: { loadRow: async () => row(), generator: { invoke } } };
}

beforeEach(() => resetBackgroundAnalysisLimiter());

describe("coût maîtrisé : plafond de débit des analyses automatiques", () => {
  it("autorise un nombre borné d'analyses par minute, puis reprend une fois la fenêtre écoulée", () => {
    for (let i = 0; i < BACKGROUND_MAX_RUNS_PER_WINDOW; i += 1) expect(allowBackgroundAnalysis(1_000 + i)).toBe(true);
    expect(allowBackgroundAnalysis(2_000)).toBe(false);
    expect(allowBackgroundAnalysis(60_500)).toBe(false); // les plus anciennes (1 000 à 1 019 ms) sont encore dans la fenêtre de 60 s
    expect(allowBackgroundAnalysis(61_100)).toBe(true); // toutes sont sorties de la fenêtre
  });

  it("au-delà du plafond, la soumission ouvre quand même le dossier mais n'appelle pas le modèle ; un administrateur peut lancer l'analyse", async () => {
    const s = setup();
    for (let i = 0; i < BACKGROUND_MAX_RUNS_PER_WINDOW; i += 1) allowBackgroundAnalysis(NOW.getTime());
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await openStructuredEvaluation(1, { deps: s.deps, run: s.run, background: false });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    expect((await s.store.getLatestCase(1))?.workflowStatus).toBe("dossier_recu");
    expect(s.invoke).not.toHaveBeenCalled();
    // la demande explicite d'un administrateur n'est jamais plafonnée
    const generated = await runAiDraft(s.deps, 1, { ...s.run, explicit: true });
    expect(generated.workflowStatus).toBe("attente_validation_admin");
    expect(s.invoke).toHaveBeenCalledTimes(1);
  });

  it("une analyse refusée pour défaut de consentement ne consomme pas le plafond", async () => {
    const s = setup();
    const noConsent = { ...s.run, loadRow: async () => ({ ...row(), projectDetailsJson: null }) };
    for (let i = 0; i < 3; i += 1) await openStructuredEvaluation(1, { deps: s.deps, run: noConsent, background: false });
    for (let i = 0; i < BACKGROUND_MAX_RUNS_PER_WINDOW; i += 1) expect(allowBackgroundAnalysis(NOW.getTime() + i)).toBe(true);
  });
});

describe("coût maîtrisé : une seule analyse à la fois par évaluation", () => {
  it("deux demandes simultanées (soumission + clic administrateur) partagent une seule analyse et un seul appel au modèle", async () => {
    const s = setup();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const slow = { ...s.run, loadRow: async () => { await gate; return row(); } };
    const first = runAiDraft(s.deps, 1, slow);
    const second = runAiDraft(s.deps, 1, slow);
    expect(second).toBe(first);
    release();
    const [a, b] = await Promise.all([first, second]);
    expect(a.id).toBe(b.id);
    expect(s.invoke).toHaveBeenCalledTimes(1);
    // une fois terminée, une nouvelle demande est traitée normalement (dossier déjà analysé : aucun nouvel appel)
    await runAiDraft(s.deps, 1, s.run);
    expect(s.invoke).toHaveBeenCalledTimes(1);
  });

  it("libère la place même si l'analyse échoue, pour que l'administrateur puisse relancer", async () => {
    const s = setup();
    const failing = { ...s.run, loadRow: async (): Promise<EvaluationRowForDraft | null> => { throw new Error("base indisponible"); } };
    await expect(runAiDraft(s.deps, 1, failing)).rejects.toThrow("base indisponible");
    const retry = await runAiDraft(s.deps, 1, s.run);
    expect(retry.workflowStatus).toBe("attente_validation_admin");
  });
});
