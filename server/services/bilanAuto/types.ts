import type { CandidateFacts, ScoreResult } from "../../../shared/bilanAuto/types";
import type { OrientationOutcome } from "./orientations";
import type { OutcomeCode } from "./controls";

/** Machine à états du traitement (noms du cahier des charges, plus `ready_for_review` pour la validation administrateur). */
export const RUN_STATES = [
  "received",
  "queued",
  "extracting",
  "needs_information",
  "researching",
  "scoring",
  "generating",
  "quality_check",
  "ready_for_review",
  "published",
  "retry_pending",
  "failed",
  "superseded",
] as const;
export type RunState = (typeof RUN_STATES)[number];

export const RUN_STATE_LABELS: Record<RunState, string> = {
  received: "Soumission reçue",
  queued: "En file d'attente",
  extracting: "Analyse en cours",
  needs_information: "Complément demandé",
  researching: "Analyse en cours",
  scoring: "Analyse en cours",
  generating: "Analyse en cours",
  quality_check: "Analyse en cours",
  ready_for_review: "Bilan prêt à valider",
  published: "Bilan publié",
  retry_pending: "Reprise automatique prévue",
  failed: "Incident à reprendre",
  superseded: "Remplacé par une version plus récente",
};

/** États qui ne bougent plus tout seuls. */
export const TERMINAL_STATES: ReadonlyArray<RunState> = ["needs_information", "ready_for_review", "published", "failed", "superseded"];

export type NotificationState = "none" | "pending" | "accepted_by_provider" | "delivered" | "bounced" | "failed" | "unknown";

/** Mode d'exploitation (variable BILAN_AUTO_MODE). */
export const RUN_MODES = ["simulation", "validation_admin", "automatique"] as const;
export type RunMode = (typeof RUN_MODES)[number];

export type ReportSection = {
  id: string; title: string; paragraphs: string[]; bullets: string[]; table?: Array<[string, string]>;
  /** Section calculée (verdict, note, rubriques) : jamais éditable en texte libre, régénérée depuis la notation. */
  locked?: boolean;
};
export type BilanReport = {
  candidateName: string;
  dossierRef: string | null;
  referenceDate: string;
  gridVersion: number;
  score: number | null;
  scoreMax: number;
  threshold: number;
  thresholdReached: boolean | null;
  verdictLabel: string;
  sections: ReportSection[];
  disclaimer: string;
};

export type InputSnapshot = {
  /** Réponses du formulaire (sans pièce jointe). */
  form: Record<string, string | number | boolean | null>;
  cv: { key: string | null; fileName: string | null; sha256: string | null };
  documents: Array<{ id: string; kind: string; key: string | null; sha256: string | null }>;
  consents: { cv: boolean };
  referenceDate: string;
  rubricVersion: string;
  promptVersion: string;
};

export type PreviousEvaluationRef = {
  runId: number;
  date: string;
  score: number | null;
  verdict: string;
  updateNature: string;
  changeExplanations: string[];
};

export type RunRecord = {
  id: number;
  evaluationId: number;
  candidateId: number | null;
  dossierRef: string | null;
  submissionId: string;
  inputVersion: string;
  rubricVersion: string;
  promptVersion: string;
  model: string | null;
  idempotencyKey: string;
  mode: RunMode;
  state: RunState;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date | null;
  lockedBy: string | null;
  lockedAt: Date | null;
  lastError: string | null;
  outcome: OutcomeCode | null;
  score: number | null;
  scoreMax: number | null;
  thresholdReached: boolean | null;
  inputSnapshot: InputSnapshot;
  facts: CandidateFacts | null;
  scoreResult: ScoreResult | null;
  orientations: OrientationOutcome | null;
  report: BilanReport | null;
  reportHash: string | null;
  pdfKey: string | null;
  complement: Array<{ id: string; label: string }> | null;
  previous: PreviousEvaluationRef | null;
  flags: string[];
  reviewStatus: "none" | "pending" | "validated" | "corrected";
  validatedBy: string | null;
  validatedAt: Date | null;
  publishedAt: Date | null;
  notificationState: NotificationState;
  supersededById: number | null;
  costEur: number | null;
  tokensUsed: number | null;
  createdAt: Date;
  updatedAt: Date;
};
export type NewRun = Omit<RunRecord, "id" | "createdAt" | "updatedAt">;
export type RunPatch = Partial<Omit<RunRecord, "id" | "createdAt" | "updatedAt" | "evaluationId" | "idempotencyKey">>;

export type AuditEvent = { runId: number | null; evaluationId: number; actor: string; action: string; detail: string | null; at: Date };

export type OutboxEntry = {
  id: number;
  runId: number;
  dedupKey: string;
  channel: "email" | "whatsapp";
  recipient: string;
  kind: "bilan_publie" | "bilan_mis_a_jour" | "complement_demande" | "incident_candidat";
  state: NotificationState;
  attempts: number;
  providerMessageId: string | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VersionStatus = "brouillon" | "publiee" | "remplacee";
export type VersionRecord = {
  id: number; runId: number; evaluationId: number; versionNumber: number;
  authorKind: "systeme" | "admin"; author: string; reason: string | null; status: VersionStatus; baseVersion: number | null;
  report: BilanReport; scoreResult: ScoreResult | null;
  /** Sources (offres, repères salariaux) citées par cette version : une ligne éditée ne garde jamais une source qui ne la soutient plus. */
  sources: Array<{ url: string; title: string; consultedAt: string }>;
  reportHash: string; pdfKey: string | null;
  publishedAt: Date | null; publishedBy: string | null; notifiedAt: Date | null; createdAt: Date; updatedAt: Date;
};
export type NewVersion = Omit<VersionRecord, "id" | "createdAt" | "updatedAt">;
export type VersionPatch = Partial<Omit<VersionRecord, "id" | "runId" | "evaluationId" | "versionNumber" | "createdAt" | "updatedAt">>;

export type RunFilter = { states?: RunState[]; reviewStatus?: RunRecord["reviewStatus"]; evaluationId?: number; candidateId?: number; limit?: number };

/** Accès aux données : implémentation mémoire (tests, simulation) et MySQL (production). */
export interface BilanAutoStore {
  findByIdempotencyKey(key: string): Promise<RunRecord | null>;
  insertRun(run: NewRun): Promise<RunRecord | null>;
  getRun(id: number): Promise<RunRecord | null>;
  listRuns(filter: RunFilter): Promise<RunRecord[]>;
  latestRunForEvaluation(evaluationId: number): Promise<RunRecord | null>;
  previousRunsForCandidate(candidateId: number, evaluationId: number, excludeRunId: number): Promise<RunRecord[]>;
  /** Réserve un traitement échu ; renvoie null si aucun, ou si un autre worker le détient. Atomique. */
  claimNext(workerId: string, now: Date, lockTtlMs: number): Promise<RunRecord | null>;
  /** Applique le patch seulement si le verrou appartient encore à `workerId` (ou si `workerId` est null). */
  updateRun(id: number, patch: RunPatch, guard?: { lockedBy?: string; expectedState?: RunState }): Promise<RunRecord | null>;
  countRunsSince(since: Date): Promise<number>;
  sumCostSince(since: Date): Promise<number>;
  addEvent(event: AuditEvent): Promise<void>;
  listEvents(runId: number): Promise<AuditEvent[]>;
  enqueueOutbox(entry: Omit<OutboxEntry, "id" | "createdAt" | "updatedAt" | "state" | "attempts" | "providerMessageId" | "lastError">): Promise<OutboxEntry | null>;
  claimOutbox(now: Date, limit: number): Promise<OutboxEntry[]>;
  updateOutbox(id: number, patch: Partial<Pick<OutboxEntry, "state" | "attempts" | "providerMessageId" | "lastError">>): Promise<void>;
  listOutbox(runId: number): Promise<OutboxEntry[]>;
  /** Suppression des données de bilan d'un candidat (traitements, journal, outbox). Renvoie les fichiers PDF à effacer du stockage. */
  /** Versions rédactionnelles du bilan (système puis administrateur). */
  addVersion(version: NewVersion): Promise<VersionRecord | null>;
  listVersions(runId: number): Promise<VersionRecord[]>;
  updateVersion(id: number, patch: VersionPatch, guard?: { expectedStatus?: VersionStatus }): Promise<VersionRecord | null>;
  eraseCandidate(candidateId: number): Promise<{ runs: number; pdfKeys: string[] }>;
}
