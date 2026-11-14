import type { AuditEvent, BilanAutoStore, NewRun, NewVersion, OutboxEntry, RunFilter, RunPatch, RunRecord, RunState, VersionPatch, VersionRecord, VersionStatus } from "./types";

/** Implémentation en mémoire : tests et mode simulation. Mêmes garanties d'atomicité que la version MySQL (verrou, clé unique, déduplication). */
export class MemoryBilanAutoStore implements BilanAutoStore {
  private runs: RunRecord[] = [];
  private events: AuditEvent[] = [];
  private outbox: OutboxEntry[] = [];
  private seq = 0;
  private versions: VersionRecord[] = [];
  private versionSeq = 0;
  private outboxSeq = 0;
  constructor(private readonly clock: () => Date = () => new Date()) {}

  private clone<T>(value: T): T { return structuredClone(value); }

  async findByIdempotencyKey(key: string) { const run = this.runs.find((entry) => entry.idempotencyKey === key); return run ? this.clone(run) : null; }

  async insertRun(run: NewRun) {
    if (this.runs.some((entry) => entry.idempotencyKey === run.idempotencyKey)) return null;
    const now = this.clock();
    const record: RunRecord = { ...this.clone(run), id: ++this.seq, createdAt: now, updatedAt: now };
    this.runs.push(record);
    return this.clone(record);
  }

  async getRun(id: number) { const run = this.runs.find((entry) => entry.id === id); return run ? this.clone(run) : null; }

  async listRuns(filter: RunFilter) {
    return this.runs
      .filter((run) => (!filter.states || filter.states.includes(run.state)) && (!filter.reviewStatus || run.reviewStatus === filter.reviewStatus) && (filter.evaluationId === undefined || run.evaluationId === filter.evaluationId) && (filter.candidateId === undefined || run.candidateId === filter.candidateId))
      .sort((a, b) => b.id - a.id)
      .slice(0, filter.limit ?? 200)
      .map((run) => this.clone(run));
  }

  async latestRunForEvaluation(evaluationId: number) {
    const run = [...this.runs].filter((entry) => entry.evaluationId === evaluationId).sort((a, b) => b.id - a.id)[0];
    return run ? this.clone(run) : null;
  }

  async previousRunsForCandidate(candidateId: number, evaluationId: number, excludeRunId: number) {
    return this.runs
      .filter((run) => run.candidateId === candidateId && run.id !== excludeRunId && run.report !== null && run.mode !== "simulation" && ["published", "ready_for_review", "superseded"].includes(run.state) && run.score !== null)
      .filter((run) => run.evaluationId !== evaluationId || run.id < excludeRunId)
      .sort((a, b) => b.id - a.id)
      .map((run) => this.clone(run));
  }

  async claimNext(workerId: string, now: Date, lockTtlMs: number) {
    const due = this.runs
      .filter((run) => (run.state === "queued" || run.state === "retry_pending") && (!run.nextAttemptAt || run.nextAttemptAt <= now) && (!run.lockedBy || (run.lockedAt && now.getTime() - run.lockedAt.getTime() > lockTtlMs)))
      .sort((a, b) => a.id - b.id)[0];
    if (!due) return null;
    due.lockedBy = workerId;
    due.lockedAt = now;
    due.updatedAt = now;
    return this.clone(due);
  }

  async updateRun(id: number, patch: RunPatch, guard?: { lockedBy?: string; expectedState?: RunState }) {
    const run = this.runs.find((entry) => entry.id === id);
    if (!run) return null;
    if (guard?.lockedBy !== undefined && run.lockedBy !== guard.lockedBy) return null;
    if (guard?.expectedState !== undefined && run.state !== guard.expectedState) return null;
    Object.assign(run, this.clone(patch), { updatedAt: this.clock() });
    return this.clone(run);
  }

  async countRunsSince(since: Date) { return this.runs.filter((run) => run.createdAt >= since).length; }
  async sumCostSince(since: Date) { return this.runs.filter((run) => run.createdAt >= since).reduce((sum, run) => sum + (run.costEur ?? 0), 0); }

  async addEvent(event: AuditEvent) { this.events.push(this.clone(event)); }
  async listEvents(runId: number) { return this.events.filter((event) => event.runId === runId).map((event) => this.clone(event)); }

  async enqueueOutbox(entry: Parameters<BilanAutoStore["enqueueOutbox"]>[0]) {
    if (this.outbox.some((existing) => existing.dedupKey === entry.dedupKey)) return null;
    const now = this.clock();
    const created: OutboxEntry = { ...entry, id: ++this.outboxSeq, state: "pending", attempts: 0, providerMessageId: null, lastError: null, createdAt: now, updatedAt: now };
    this.outbox.push(created);
    return this.clone(created);
  }

  async claimOutbox(_now: Date, limit: number) {
    const pending = this.outbox.filter((entry) => entry.state === "pending" && entry.attempts < 5).slice(0, limit);
    for (const entry of pending) entry.attempts += 1;
    return pending.map((entry) => this.clone(entry));
  }

  async updateOutbox(id: number, patch: Parameters<BilanAutoStore["updateOutbox"]>[1]) {
    const entry = this.outbox.find((item) => item.id === id);
    if (entry) Object.assign(entry, patch, { updatedAt: this.clock() });
  }

  async listOutbox(runId: number) { return this.outbox.filter((entry) => entry.runId === runId).map((entry) => this.clone(entry)); }

  async addVersion(version: NewVersion) {
    if (this.versions.some((entry) => entry.runId === version.runId && entry.versionNumber === version.versionNumber)) return null;
    const now = this.clock();
    const record: VersionRecord = { ...this.clone(version), id: ++this.versionSeq, createdAt: now, updatedAt: now };
    this.versions.push(record);
    return this.clone(record);
  }
  async listVersions(runId: number) { return this.versions.filter((entry) => entry.runId === runId).sort((a, b) => a.versionNumber - b.versionNumber).map((entry) => this.clone(entry)); }
  async updateVersion(id: number, patch: VersionPatch, guard?: { expectedStatus?: VersionStatus }) {
    const version = this.versions.find((entry) => entry.id === id);
    if (!version) return null;
    if (guard?.expectedStatus !== undefined && version.status !== guard.expectedStatus) return null;
    Object.assign(version, this.clone(patch), { updatedAt: this.clock() });
    return this.clone(version);
  }

  async eraseCandidate(candidateId: number) {
    const mine = this.runs.filter((run) => run.candidateId === candidateId);
    const ids = new Set(mine.map((run) => run.id));
    const pdfKeys = mine.map((run) => run.pdfKey).filter((key): key is string => Boolean(key));
    this.runs = this.runs.filter((run) => !ids.has(run.id));
    this.events = this.events.filter((event) => event.runId === null || !ids.has(event.runId));
    this.outbox = this.outbox.filter((entry) => !ids.has(entry.runId));
    this.versions = this.versions.filter((entry) => !ids.has(entry.runId));
    return { runs: ids.size, pdfKeys };
  }
}
