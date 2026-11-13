import { createHash } from "node:crypto";
import { GRID_V1, GRID_ID, isGridApproved, type GridDef } from "../../../shared/bilanAuto/grid";
import type { ScoreResult } from "../../../shared/bilanAuto/types";
import { decideOutcome, type OutcomeDecision } from "./controls";
import { extractFacts, type ExtractionFile, type ExtractionRunner, type FormAnswers } from "./extraction";
import { buildOrientations, type SourceSearch } from "./orientations";
import { buildReport, checkStrictReportCharter, explainScoreChange, foreignPersonalData, renderHtml, renderText, reportHash, verdictFor } from "./report";
import { checkPdfIntegrity } from "./reportPdf";
import { recomputeScore, scoreFacts } from "./scoring";
import type { BilanAutoStore, BilanReport, InputSnapshot, NewRun, PreviousEvaluationRef, RunMode, RunRecord } from "./types";

export const PROMPT_VERSION = "extraction-v1";

export type PipelineConfig = {
  enabled: boolean;
  mode: RunMode;
  /** Si renseignée : seules ces adresses e-mail sont traitées (activation limitée aux dossiers tests). */
  allowlistEmails: string[] | null;
  maxAttempts: number;
  backoffMs: number[];
  lockTtlMs: number;
  dailyRunLimit: number;
  dailyBudgetEur: number;
  costPerRunEstimateEur: number;
  notificationsEnabled: boolean;
  grid: GridDef;
};

export const DEFAULT_CONFIG: PipelineConfig = {
  enabled: false,
  mode: "validation_admin",
  allowlistEmails: null,
  maxAttempts: 4,
  backoffMs: [60_000, 5 * 60_000, 30 * 60_000],
  lockTtlMs: 10 * 60_000,
  dailyRunLimit: 200,
  dailyBudgetEur: 20,
  costPerRunEstimateEur: 0.05,
  notificationsEnabled: true,
  grid: GRID_V1,
};

/** Variables d'environnement → configuration. Tout est désactivé par défaut. */
export function configFromEnv(env: Record<string, string | undefined> = process.env): PipelineConfig {
  const mode = (["simulation", "validation_admin", "automatique"] as const).find((value) => value === env.BILAN_AUTO_MODE) ?? "validation_admin";
  const list = (env.BILAN_AUTO_ALLOWLIST_EMAILS ?? "").split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  const num = (value: string | undefined, fallback: number) => (value && Number.isFinite(Number(value)) ? Number(value) : fallback);
  return {
    ...DEFAULT_CONFIG,
    enabled: env.BILAN_AUTO_ENABLED === "true",
    mode,
    allowlistEmails: list.length > 0 ? list : null,
    maxAttempts: num(env.BILAN_AUTO_MAX_ATTEMPTS, DEFAULT_CONFIG.maxAttempts),
    dailyRunLimit: num(env.BILAN_AUTO_DAILY_RUN_LIMIT, DEFAULT_CONFIG.dailyRunLimit),
    dailyBudgetEur: num(env.BILAN_AUTO_DAILY_BUDGET_EUR, DEFAULT_CONFIG.dailyBudgetEur),
    costPerRunEstimateEur: num(env.BILAN_AUTO_COST_PER_RUN_EUR, DEFAULT_CONFIG.costPerRunEstimateEur),
    notificationsEnabled: env.BILAN_AUTO_NOTIFICATIONS_ENABLED !== "false",
  };
}

export type EvaluationInputs = {
  evaluationId: number;
  candidateId: number | null;
  email: string;
  fullName: string;
  dossierRef: string | null;
  priorityCountry: string | null;
  /** Évaluation soumise (formulaire finalisé), pas un simple brouillon. */
  submitted: boolean;
  cvConsent: boolean;
  form: FormAnswers;
  cv: { key: string | null; fileName: string | null; sha256: string | null; stored: boolean; attachedToAccount: boolean; text: string | null; file: ExtractionFile | null };
  documents: Array<{ id: string; kind: "diplome" | "attestation_travail" | "test_langue" | "passeport" | "cv" | "autre"; key: string | null; sha256: string | null; text: string | null; file: ExtractionFile | null }>;
};

export interface Publisher {
  /** Publie la version exacte du rapport dans l'espace client (idempotent) ; renvoie une référence. */
  publish(run: RunRecord, report: BilanReport, pdf: { key: string; url: string } | null): Promise<{ reference: string }>;
  /** Demande de complément visible dans l'espace client. */
  requestComplement(run: RunRecord, items: Array<{ id: string; label: string }>): Promise<void>;
}

export interface Mailer {
  send(message: { to: string; subject: string; text: string; html: string }): Promise<{ messageId?: string | null }>;
}

export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;
  constructor(private readonly threshold = 5, private readonly cooldownMs = 5 * 60_000) {}
  isOpen(now: Date): boolean {
    if (this.openedAt === null) return false;
    if (now.getTime() - this.openedAt >= this.cooldownMs) { this.openedAt = null; this.failures = 0; return false; }
    return true;
  }
  success() { this.failures = 0; this.openedAt = null; }
  failure(now: Date) { this.failures += 1; if (this.failures >= this.threshold) this.openedAt = now.getTime(); }
}

export type PipelineDeps = {
  store: BilanAutoStore;
  config: PipelineConfig;
  workerId: string;
  now: () => Date;
  loadInputs: (evaluationId: number) => Promise<EvaluationInputs | null>;
  runExtraction: ExtractionRunner;
  search: SourceSearch | null;
  renderPdf: (report: BilanReport) => Promise<Buffer>;
  storePdf: (key: string, bytes: Buffer) => Promise<{ key: string; url: string }>;
  publisher: Publisher;
  mailer: Mailer;
  portalUrl: string;
  breaker?: CircuitBreaker;
};

// ── Version des entrées et clé d'idempotence ──────────────────────────────

export function snapshotOf(inputs: EvaluationInputs, referenceDate: string, rubricVersion: string): InputSnapshot {
  const form: InputSnapshot["form"] = {};
  for (const [key, value] of Object.entries(inputs.form)) {
    if (key === "completenessFields") continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) form[key] = value as never;
  }
  return {
    form,
    cv: { key: inputs.cv.key, fileName: inputs.cv.fileName, sha256: inputs.cv.sha256 },
    documents: inputs.documents.map((doc) => ({ id: doc.id, kind: doc.kind, key: doc.key, sha256: doc.sha256 })),
    referenceDate,
    rubricVersion,
    promptVersion: PROMPT_VERSION,
  };
}

/** Empreinte des seules entrées qui changent le résultat (la date de référence n'en fait pas partie : un simple jour qui passe ne relance rien). */
export function inputVersionOf(snapshot: InputSnapshot): string {
  const { referenceDate: _ignored, ...stable } = snapshot;
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex").slice(0, 24);
}

export const rubricVersionOf = (grid: GridDef) => `${GRID_ID}-v${grid.version}`;
export const idempotencyKeyOf = (submissionId: string, inputVersion: string, rubricVersion: string) => `${submissionId}:${inputVersion}:${rubricVersion}`;

export function nextBackoff(config: PipelineConfig, attempts: number, now: Date): Date {
  const delay = config.backoffMs[Math.min(attempts - 1, config.backoffMs.length - 1)] ?? 60_000;
  return new Date(now.getTime() + delay);
}

const emptyRunBase = (): Pick<NewRun, "facts" | "scoreResult" | "orientations" | "report" | "reportHash" | "pdfKey" | "complement" | "previous" | "flags" | "reviewStatus" | "validatedBy" | "validatedAt" | "publishedAt" | "notificationState" | "supersededById" | "costEur" | "tokensUsed" | "outcome" | "score" | "scoreMax" | "thresholdReached" | "lockedBy" | "lockedAt" | "lastError" | "nextAttemptAt" | "attempts" | "model"> => ({
  facts: null, scoreResult: null, orientations: null, report: null, reportHash: null, pdfKey: null, complement: null, previous: null, flags: [],
  reviewStatus: "none", validatedBy: null, validatedAt: null, publishedAt: null, notificationState: "none", supersededById: null, costEur: null, tokensUsed: null,
  outcome: null, score: null, scoreMax: null, thresholdReached: null, lockedBy: null, lockedAt: null, lastError: null, nextAttemptAt: null, attempts: 0, model: null,
});

// ── Déclenchement ─────────────────────────────────────────────────────────

export type SubmitResult =
  | { status: "disabled" | "not_allowed" | "not_ready"; reason: string }
  | { status: "reused"; run: RunRecord }
  | { status: "queued"; run: RunRecord; supersededIds: number[] };

/**
 * Appelé APRÈS la finalisation de l'évaluation et le stockage du CV (jamais pour une simple consultation ou un brouillon).
 * Ne fait aucune analyse : il crée (ou retrouve) un traitement en file d'attente ; le worker fait le reste.
 */
export async function submitForAnalysis(deps: PipelineDeps, evaluationId: number, options: { force?: boolean; actor?: string } = {}): Promise<SubmitResult> {
  const { store, config } = deps;
  if (!config.enabled) return { status: "disabled", reason: "Le traitement automatique est désactivé (BILAN_AUTO_ENABLED)." };
  const inputs = await deps.loadInputs(evaluationId);
  if (!inputs) return { status: "not_ready", reason: "Évaluation introuvable." };
  if (config.allowlistEmails && !config.allowlistEmails.includes(inputs.email.trim().toLowerCase())) return { status: "not_allowed", reason: "Dossier hors de la liste de test." };
  if (!inputs.submitted) return { status: "not_ready", reason: "Le formulaire n'est pas finalisé." };
  if (!inputs.cv.stored) return { status: "not_ready", reason: "Le CV n'est pas encore stocké." };
  if (!inputs.cv.attachedToAccount || inputs.candidateId === null) return { status: "not_ready", reason: "Le CV ou l'évaluation n'est pas rattaché à un compte candidat." };

  const now = deps.now();
  const rubricVersion = rubricVersionOf(config.grid);
  const snapshot = snapshotOf(inputs, now.toISOString(), rubricVersion);
  const inputVersion = inputVersionOf(snapshot);
  const submissionId = String(evaluationId);
  let key = idempotencyKeyOf(submissionId, inputVersion, rubricVersion);
  if (options.force) key = `${key}:r${now.getTime()}`;

  const existing = await store.findByIdempotencyKey(key);
  if (existing && existing.state !== "failed" && existing.state !== "superseded") return { status: "reused", run: existing };
  if (existing) key = `${key}:r${now.getTime()}`; // un traitement en échec ou remplacé peut être relancé explicitement

  const created = await store.insertRun({
    ...emptyRunBase(),
    evaluationId,
    candidateId: inputs.candidateId,
    dossierRef: inputs.dossierRef,
    submissionId,
    inputVersion,
    rubricVersion,
    promptVersion: PROMPT_VERSION,
    idempotencyKey: key,
    mode: config.mode,
    state: "queued",
    maxAttempts: config.maxAttempts,
    inputSnapshot: snapshot,
  });
  if (!created) {
    const raced = await store.findByIdempotencyKey(key);
    return raced ? { status: "reused", run: raced } : { status: "not_ready", reason: "Création concurrente : réessayez." };
  }
  // Règle explicite : une nouvelle version remplace les traitements non publiés des versions précédentes (jamais de mélange).
  const supersededIds: number[] = [];
  for (const old of await store.listRuns({ evaluationId, limit: 50 })) {
    if (old.id === created.id || old.state === "published" || old.state === "superseded") continue;
    await store.updateRun(old.id, { state: "superseded", supersededById: created.id, lockedBy: null, lockedAt: null });
    supersededIds.push(old.id);
  }
  await store.addEvent({ runId: created.id, evaluationId, actor: options.actor ?? "systeme", action: "queued", detail: `version ${inputVersion}, barème ${rubricVersion}, mode ${config.mode}${supersededIds.length ? `, remplace ${supersededIds.join(",")}` : ""}`, at: now });
  return { status: "queued", run: created, supersededIds };
}

// ── Traitement ────────────────────────────────────────────────────────────

const startOfUtcDay = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

export async function processNext(deps: PipelineDeps): Promise<RunRecord | null> {
  if (!deps.config.enabled) return null;
  const run = await deps.store.claimNext(deps.workerId, deps.now(), deps.config.lockTtlMs);
  if (!run) return null;
  return processRun(deps, run);
}

async function setState(deps: PipelineDeps, run: RunRecord, state: RunRecord["state"], patch: Partial<RunRecord> = {}): Promise<RunRecord> {
  const updated = await deps.store.updateRun(run.id, { state, ...patch }, { lockedBy: deps.workerId });
  if (!updated) throw new Error("VERROU_PERDU");
  return updated;
}

export async function processRun(deps: PipelineDeps, claimed: RunRecord): Promise<RunRecord> {
  const { store, config } = deps;
  let run = claimed;
  const now = deps.now();
  try {
    // Garde-fous de coût : la reprise est reportée, jamais perdue.
    if ((await store.countRunsSince(startOfUtcDay(now))) > config.dailyRunLimit || (await store.sumCostSince(startOfUtcDay(now))) >= config.dailyBudgetEur) {
      await store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: "systeme", action: "budget_reached", detail: "Plafond quotidien atteint : reprise demain.", at: now });
      return await setState(deps, run, "retry_pending", { nextAttemptAt: new Date(startOfUtcDay(now).getTime() + 24 * 3600_000 + 60_000), lockedBy: null, lockedAt: null });
    }
    if (deps.breaker?.isOpen(now)) {
      await store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: "systeme", action: "circuit_open", detail: "Appels IA suspendus après des échecs répétés.", at: now });
      return await setState(deps, run, "retry_pending", { nextAttemptAt: new Date(now.getTime() + 5 * 60_000), lockedBy: null, lockedAt: null });
    }

    const inputs = await deps.loadInputs(run.evaluationId);
    if (!inputs) throw new Error("Évaluation introuvable pendant le traitement");
    const snapshot = snapshotOf(inputs, run.inputSnapshot.referenceDate, run.rubricVersion);
    if (inputVersionOf(snapshot) !== run.inputVersion) {
      // Le dossier a changé pendant l'attente : ce traitement est dépassé, une nouvelle version est créée.
      run = await setState(deps, run, "superseded", { lockedBy: null, lockedAt: null });
      await store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: "systeme", action: "superseded_input_changed", detail: "Entrées modifiées pendant le traitement.", at: now });
      await submitForAnalysis(deps, run.evaluationId);
      return run;
    }

    // 1. Extraction
    run = await setState(deps, run, "extracting");
    const extraction = await extractFacts(
      {
        form: inputs.form,
        cvText: inputs.cv.text,
        cvFile: inputs.cv.file,
        documents: inputs.documents.filter((doc) => doc.kind !== "cv").map((doc) => ({ id: doc.id, kind: doc.kind, text: doc.text, file: doc.file })),
        targetJob: inputs.form.currentJobTitle ?? null,
        now,
      },
      deps.runExtraction,
    );
    if ("error" in extraction) { deps.breaker?.failure(now); throw new Error(extraction.error); }
    deps.breaker?.success();
    const { facts, injectionSuspected, unreadableDocuments } = extraction.build;

    // 2. Notation (règles déterministes)
    run = await setState(deps, run, "scoring");
    const score = scoreFacts(facts, config.grid);

    // 3. Orientations (la recherche peut échouer sans bloquer)
    run = await setState(deps, run, "researching");
    const orientations = await buildOrientations({ facts, priorityCountry: inputs.priorityCountry ?? undefined, search: deps.search, now });

    // 4. Historique
    const previous = await findPrevious(deps, run, score);

    const gridApproved = isGridApproved(config.grid) || run.mode === "simulation";
    const preconditions = {
      evaluationSubmitted: inputs.submitted,
      cvStored: inputs.cv.stored,
      cvAttachedToAccount: inputs.cv.attachedToAccount,
      cvConsent: inputs.cvConsent,
      cvReadable: extraction.cvReadable,
      technicalError: null,
      gridApproved,
    };
    let decision = decideOutcome({ preconditions, score });
    const flags = [...score.rubrics.flatMap((rubric) => rubric.subCriteria.flatMap((sub) => sub.flags)), ...(injectionSuspected ? ["Consigne détectée dans un contenu du dossier : ignorée"] : []), ...orientations.searchErrors];
    const common = { facts, scoreResult: score, orientations, previous, flags, model: "forge-llm", costEur: config.costPerRunEstimateEur, score: score.calculable ? score.total : null, scoreMax: score.max, thresholdReached: score.calculable ? score.thresholdReached : null };

    if (decision.code === "B") {
      run = await setState(deps, run, "needs_information", { ...common, outcome: "B", complement: decision.complementItems, lastError: null, lockedBy: null, lockedAt: null });
      await store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: "systeme", action: "complement_requested", detail: decision.complementItems.map((item) => item.id).join(","), at: now });
      if (run.mode !== "simulation") {
        await deps.publisher.requestComplement(run, decision.complementItems);
        await queueNotification(deps, run, inputs.email, "complement_demande");
      }
      return run;
    }
    if (decision.code === "C") return await blockRun(deps, run, decision, { ...common, outcome: "C" }, inputs.email);

    // 5. Rédaction + 6. contrôle qualité
    run = await setState(deps, run, "generating", common);
    const referenceDate = run.inputSnapshot.referenceDate;
    const report = buildReport({ candidateName: inputs.fullName, dossierRef: inputs.dossierRef, referenceDate, facts, score, orientations, previous, unreadableDocuments, injectionSuspected });
    run = await setState(deps, run, "quality_check");
    const problems = await qualityProblems(deps, report, score, inputs);
    if (problems.problems.length > 0) {
      decision = { code: "C", reasons: ["Contrôle qualité non réussi"], complementItems: [], adminAlert: `Contrôle qualité : ${problems.problems.join(" ; ")}` };
      return await blockRun(deps, run, decision, { ...common, outcome: "C" }, inputs.email);
    }
    const hash = reportHash(report);
    let pdfKey: string | null = null;
    if (run.mode !== "simulation" && problems.pdf) {
      pdfKey = (await deps.storePdf(`bilan-auto/${run.evaluationId}/bilan-run-${run.id}-${hash.slice(0, 12)}.pdf`, problems.pdf)).key;
    }
    run = await setState(deps, run, "ready_for_review", { ...common, outcome: "A", report, reportHash: hash, pdfKey, reviewStatus: run.mode === "simulation" ? "none" : "pending", complement: null, lastError: null, lockedBy: null, lockedAt: null });
    await store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: "systeme", action: "ready_for_review", detail: `score ${score.total}/${score.max}, empreinte ${hash.slice(0, 12)}`, at: now });

    if (run.mode === "automatique") return (await publishRun(deps, run.id, "systeme")).run;
    return run;
  } catch (error) {
    if ((error as Error).message === "VERROU_PERDU") return (await store.getRun(run.id)) ?? run;
    return await failOrRetry(deps, run, error instanceof Error ? error.message : String(error));
  }
}

async function findPrevious(deps: PipelineDeps, run: RunRecord, score: ScoreResult): Promise<PreviousEvaluationRef | null> {
  if (run.candidateId === null) return null;
  const previousRuns = await deps.store.previousRunsForCandidate(run.candidateId, run.evaluationId, run.id);
  const last = previousRuns[0];
  if (!last || !last.report) return null;
  const sameFile = Boolean(last.inputSnapshot.cv.sha256 && last.inputSnapshot.cv.sha256 === run.inputSnapshot.cv.sha256) || (last.inputSnapshot.cv.key !== null && last.inputSnapshot.cv.key === run.inputSnapshot.cv.key);
  const nature = last.evaluationId !== run.evaluationId ? (sameFile ? "nouvelle évaluation avec le même CV" : "nouvelle évaluation avec un nouveau CV") : sameFile ? "même CV, formulaire complété ou corrigé" : "nouveau CV pour la même évaluation";
  const changes = explainScoreChange(last.scoreResult ? { score: last.score, rubrics: last.scoreResult.rubrics.map((rubric) => ({ key: rubric.key, label: rubric.label, points: rubric.points })) } : null, score);
  return { runId: last.id, date: (last.publishedAt ?? last.createdAt).toISOString(), score: last.score, verdict: verdictFor(last), updateNature: nature, changeExplanations: changes };
}

async function qualityProblems(deps: PipelineDeps, report: BilanReport, score: ScoreResult, inputs: EvaluationInputs): Promise<{ problems: string[]; pdf: Buffer | null }> {
  const problems: string[] = [];
  const sum = score.rubrics.reduce((total, rubric) => total + (rubric.points ?? 0), 0);
  if (sum !== score.total) problems.push("Total différent de la somme des rubriques");
  if (score.max !== 100) problems.push("Maximum différent de 100");
  for (const rubric of score.rubrics) {
    if ((rubric.points ?? 0) > rubric.max) problems.push(`${rubric.label} dépasse son maximum`);
    if (rubric.subCriteria.reduce((total, sub) => total + sub.max, 0) !== rubric.max) problems.push(`${rubric.label} : maxima incohérents`);
  }
  if (report.score !== score.total) problems.push("Score du rapport différent du score calculé");
  problems.push(...checkStrictReportCharter(report));
  const foreign = foreignPersonalData(report, { names: [inputs.fullName], emails: [inputs.email] });
  if (foreign.length > 0) problems.push("Donnée personnelle étrangère au candidat dans le rapport");
  let pdf: Buffer | null = null;
  try {
    pdf = await deps.renderPdf(report);
    problems.push(...checkPdfIntegrity(pdf));
  } catch (error) {
    problems.push(`PDF non généré : ${error instanceof Error ? error.message : "erreur"}`);
  }
  if (renderText(report).length < 200 || renderHtml(report).length < 200) problems.push("Rendu texte ou HTML anormalement court");
  return { problems, pdf };
}

async function blockRun(deps: PipelineDeps, run: RunRecord, decision: OutcomeDecision, patch: Partial<RunRecord>, email: string): Promise<RunRecord> {
  const updated = await setState(deps, run, "failed", { ...patch, lastError: decision.adminAlert, lockedBy: null, lockedAt: null });
  await deps.store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: "systeme", action: "incident_blocking", detail: decision.adminAlert, at: deps.now() });
  if (run.mode !== "simulation") await queueNotification(deps, updated, email, "incident_candidat");
  return updated;
}

async function failOrRetry(deps: PipelineDeps, run: RunRecord, message: string): Promise<RunRecord> {
  const now = deps.now();
  const attempts = run.attempts + 1;
  const safeMessage = message.slice(0, 500);
  await deps.store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: "systeme", action: "attempt_failed", detail: `tentative ${attempts}/${run.maxAttempts} : ${safeMessage}`, at: now });
  if (attempts < run.maxAttempts) {
    const updated = await deps.store.updateRun(run.id, { state: "retry_pending", attempts, lastError: safeMessage, nextAttemptAt: nextBackoff(deps.config, attempts, now), lockedBy: null, lockedAt: null });
    return updated ?? run;
  }
  const failed = await deps.store.updateRun(run.id, { state: "failed", attempts, outcome: "C", lastError: safeMessage, lockedBy: null, lockedAt: null });
  await deps.store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: "systeme", action: "admin_alert", detail: `Incident persistant après ${attempts} tentatives : ${safeMessage}`, at: now });
  return failed ?? run;
}

// ── Publication (validation administrateur ou mode automatique) ───────────

export type PublishResult = { ok: true; run: RunRecord; alreadyPublished: boolean } | { ok: false; error: string; run: RunRecord | null };

export async function publishRun(deps: PipelineDeps, runId: number, actor: string): Promise<PublishResult> {
  const { store, config } = deps;
  const run = await store.getRun(runId);
  if (!run) return { ok: false, error: "Traitement introuvable.", run: null };
  if (run.state === "published") return { ok: true, run, alreadyPublished: true };
  if (run.mode === "simulation") return { ok: false, error: "Un traitement de simulation ne peut pas être publié.", run };
  if (run.state !== "ready_for_review" || !run.report || !run.reportHash) return { ok: false, error: "Le bilan n'est pas prêt à être publié.", run };
  if (!isGridApproved(config.grid)) return { ok: false, error: "La grille de notation n'est pas approuvée : publication impossible.", run };
  if (reportHash(run.report) !== run.reportHash) return { ok: false, error: "Le contenu du bilan a changé depuis sa génération : relancez le contrôle.", run };
  const latest = await store.latestRunForEvaluation(run.evaluationId);
  if (latest && latest.id !== run.id && latest.state !== "superseded") return { ok: false, error: "Une version plus récente existe pour cette évaluation.", run };
  const problems = checkStrictReportCharter(run.report);
  if (problems.length > 0) return { ok: false, error: `Charte éditoriale : ${problems.join(" ; ")}`, run };

  const inputs = await deps.loadInputs(run.evaluationId);
  if (!inputs || inputs.candidateId !== run.candidateId) return { ok: false, error: "Le dossier n'est plus rattaché au même candidat.", run };

  // Verrou de publication : un seul gagnant, même si deux administrateurs cliquent ensemble.
  const claimed = await store.updateRun(run.id, { state: "published", publishedAt: deps.now(), reviewStatus: actor === "systeme" ? run.reviewStatus : run.reviewStatus === "corrected" ? "corrected" : "validated", validatedBy: actor === "systeme" ? null : actor, validatedAt: actor === "systeme" ? null : deps.now() }, { expectedState: "ready_for_review" });
  if (!claimed) return { ok: true, run: (await store.getRun(run.id)) ?? run, alreadyPublished: true };
  try {
    const pdf = run.pdfKey ? { key: run.pdfKey, url: "" } : null;
    await deps.publisher.publish(claimed, claimed.report!, pdf);
  } catch (error) {
    await store.updateRun(run.id, { state: "ready_for_review", publishedAt: null });
    return { ok: false, error: `Publication impossible : ${error instanceof Error ? error.message : "erreur"}`, run };
  }
  await store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor, action: "published", detail: `empreinte ${run.reportHash.slice(0, 12)}`, at: deps.now() });
  if (config.notificationsEnabled) await queueNotification(deps, claimed, inputs.email, "bilan_publie");
  return { ok: true, run: (await store.getRun(run.id)) ?? claimed, alreadyPublished: false };
}

// ── Correction administrateur tracée ──────────────────────────────────────

export type Correction = { rubric: string; subCriterion: string; points: number; justification: string };

export async function correctRun(deps: PipelineDeps, runId: number, admin: string, correction: Correction): Promise<{ ok: true; run: RunRecord } | { ok: false; error: string }> {
  const run = await deps.store.getRun(runId);
  if (!run || !run.scoreResult || !run.facts || !run.orientations) return { ok: false, error: "Traitement introuvable ou incomplet." };
  if (run.state === "published") return { ok: false, error: "Un bilan publié ne se modifie pas : relancez une nouvelle version." };
  if (correction.justification.trim().length < 10) return { ok: false, error: "Une justification d'au moins 10 caractères est obligatoire." };
  const rubric = run.scoreResult.rubrics.find((entry) => entry.key === correction.rubric);
  const sub = rubric?.subCriteria.find((entry) => entry.key === correction.subCriterion);
  if (!rubric || !sub) return { ok: false, error: "Sous-critère inconnu." };
  if (!Number.isInteger(correction.points) || correction.points < 0 || correction.points > sub.max) return { ok: false, error: `Les points doivent être un entier entre 0 et ${sub.max}.` };
  const before = sub.points;
  const next = structuredClone(run.scoreResult);
  const target = next.rubrics.find((entry) => entry.key === correction.rubric)!.subCriteria.find((entry) => entry.key === correction.subCriterion)!;
  target.points = correction.points;
  target.provenance = "verifie";
  target.explanation = `${target.explanation} Ajusté par l'agence (${correction.points}/${sub.max}) : ${correction.justification.trim()}`;
  const recomputed = recomputeScore(next);
  recomputed.missing = recomputed.missing.filter((item) => !(item.rubric === correction.rubric && item.subCriterion === correction.subCriterion));
  const inputs = await deps.loadInputs(run.evaluationId);
  const report = buildReport({ candidateName: inputs?.fullName ?? run.report?.candidateName ?? "", dossierRef: run.dossierRef, referenceDate: run.inputSnapshot.referenceDate, facts: run.facts, score: recomputed, orientations: run.orientations, previous: run.previous, unreadableDocuments: [], injectionSuspected: false });
  const problems = checkStrictReportCharter(report);
  if (problems.length > 0) return { ok: false, error: `Charte éditoriale : ${problems.join(" ; ")}` };
  const updated = await deps.store.updateRun(run.id, { scoreResult: recomputed, score: recomputed.calculable ? recomputed.total : null, thresholdReached: recomputed.calculable ? recomputed.thresholdReached : null, report, reportHash: reportHash(report), reviewStatus: "corrected", state: recomputed.calculable ? "ready_for_review" : run.state, pdfKey: null });
  await deps.store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: admin, action: "correction", detail: `${correction.rubric}.${correction.subCriterion} : ${before ?? "non évaluable"} → ${correction.points} · ${correction.justification.trim()}`, at: deps.now() });
  return { ok: true, run: updated ?? run };
}

// ── Notifications (outbox) ────────────────────────────────────────────────

const OUTBOX_SUBJECT: Record<string, string> = {
  bilan_publie: "Votre bilan d'évaluation est disponible — 3M TRAVEL AGENCY",
  complement_demande: "Un complément est nécessaire pour votre évaluation — 3M TRAVEL AGENCY",
  incident_candidat: "Votre évaluation est en cours de traitement — 3M TRAVEL AGENCY",
};

async function queueNotification(deps: PipelineDeps, run: RunRecord, recipient: string, kind: "bilan_publie" | "complement_demande" | "incident_candidat"): Promise<void> {
  const dedupKey = kind === "bilan_publie" ? `${run.id}:${run.reportHash ?? "-"}:${recipient.toLowerCase()}:email` : `${run.id}:${kind}:${recipient.toLowerCase()}:email`;
  const entry = await deps.store.enqueueOutbox({ runId: run.id, dedupKey, channel: "email", recipient, kind });
  if (entry) await deps.store.updateRun(run.id, { notificationState: "pending" });
}

function emailBody(kind: string, name: string, portalUrl: string): { text: string; html: string } {
  const lines: Record<string, string[]> = {
    bilan_publie: [`Bonjour ${name},`, "", "Votre bilan d'évaluation préliminaire est disponible dans votre espace client sécurisé. Vous pouvez le consulter et télécharger le PDF.", "", `Accéder à mon espace : ${portalUrl}`, "", "Ce message ne contient pas le détail de votre bilan."],
    complement_demande: [`Bonjour ${name},`, "", "Pour poursuivre votre évaluation, nous avons besoin de quelques informations complémentaires. Le détail est indiqué dans votre espace client.", "", `Accéder à mon espace : ${portalUrl}`],
    incident_candidat: [`Bonjour ${name},`, "", "Votre évaluation est bien enregistrée. Son traitement prend plus de temps que prévu ; nous revenons vers vous dès qu'il est terminé. Aucune action n'est nécessaire pour le moment.", "", `Suivre mon dossier : ${portalUrl}`],
  };
  const text = [...lines[kind], "", "3M TRAVEL AGENCY — hello@3mtravelagency.com"].join("\n");
  const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return { text, html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${text.split("\n").map((line) => (line ? `<p>${esc(line)}</p>` : "")).join("")}</div>` };
}

/** Envoie les messages en attente. « Accepté par le fournisseur » n'est pas « délivré » : seul un événement du fournisseur peut le prouver. */
export async function processOutbox(deps: PipelineDeps, limit = 20): Promise<{ sent: number; failed: number }> {
  if (!deps.config.notificationsEnabled) return { sent: 0, failed: 0 };
  let sent = 0;
  let failed = 0;
  for (const entry of await deps.store.claimOutbox(deps.now(), limit)) {
    const run = await deps.store.getRun(entry.runId);
    if (!run) continue;
    const inputs = await deps.loadInputs(run.evaluationId);
    const body = emailBody(entry.kind, inputs?.fullName ?? "", deps.portalUrl);
    try {
      const result = await deps.mailer.send({ to: entry.recipient, subject: OUTBOX_SUBJECT[entry.kind], text: body.text, html: body.html });
      await deps.store.updateOutbox(entry.id, { state: "accepted_by_provider", providerMessageId: result.messageId ?? null, lastError: null });
      await deps.store.updateRun(run.id, { notificationState: "accepted_by_provider" });
      await deps.store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: "systeme", action: "notification_accepted", detail: entry.kind, at: deps.now() });
      sent += 1;
    } catch (error) {
      const message = (error instanceof Error ? error.message : String(error)).slice(0, 300);
      const exhausted = entry.attempts >= 5;
      await deps.store.updateOutbox(entry.id, { state: exhausted ? "failed" : "pending", lastError: message });
      if (exhausted) await deps.store.updateRun(run.id, { notificationState: "failed" });
      failed += 1;
    }
  }
  return { sent, failed };
}

/** Événement du fournisseur d'e-mail (après vérification de signature par l'appelant) : seule voie vers « délivré » ou « rebond ». */
export async function applyDeliveryEvent(deps: Pick<PipelineDeps, "store" | "now">, event: { providerMessageId: string; type: "delivered" | "bounced" | "failed"; eventId: string }, seen: Set<string>): Promise<boolean> {
  if (seen.has(event.eventId)) return false; // événement dupliqué
  seen.add(event.eventId);
  const runs = await deps.store.listRuns({ limit: 500 });
  for (const run of runs) {
    for (const entry of await deps.store.listOutbox(run.id)) {
      if (entry.providerMessageId === event.providerMessageId) {
        await deps.store.updateOutbox(entry.id, { state: event.type });
        await deps.store.updateRun(run.id, { notificationState: event.type });
        await deps.store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: "fournisseur-email", action: `notification_${event.type}`, detail: event.eventId, at: deps.now() });
        return true;
      }
    }
  }
  return false;
}
