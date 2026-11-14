import { and, asc, desc, eq, gte, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { bilanAutoEvents, bilanAutoOutbox, bilanAutoRuns, bilanAutoVersions, type BilanAutoRunRow } from "../../../drizzle/bilanAutoSchema";
import { getDb } from "../../db";
import type { AuditEvent, BilanAutoStore, NewRun, NewVersion, OutboxEntry, RunFilter, RunPatch, RunRecord, RunState, VersionPatch, VersionRecord, VersionStatus } from "./types";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const parse = <T,>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
};
const json = (value: unknown) => (value === null || value === undefined ? null : JSON.stringify(value));

export function rowToRun(row: BilanAutoRunRow): RunRecord {
  return {
    id: row.id, evaluationId: row.evaluationId, candidateId: row.candidateId, dossierRef: row.dossierRef, submissionId: row.submissionId,
    inputVersion: row.inputVersion, rubricVersion: row.rubricVersion, promptVersion: row.promptVersion, model: row.model, idempotencyKey: row.idempotencyKey,
    mode: row.mode as RunRecord["mode"], state: row.state as RunState, attempts: row.attempts, maxAttempts: row.maxAttempts, nextAttemptAt: row.nextAttemptAt,
    lockedBy: row.lockedBy, lockedAt: row.lockedAt, lastError: row.lastError, outcome: (row.outcome as RunRecord["outcome"]) ?? null,
    score: row.score, scoreMax: row.scoreMax, thresholdReached: row.thresholdReached,
    inputSnapshot: parse(row.inputSnapshotJson, {} as RunRecord["inputSnapshot"]),
    facts: parse(row.factsJson, null), scoreResult: parse(row.scoreJson, null), orientations: parse(row.orientationsJson, null),
    report: parse(row.reportJson, null), reportHash: row.reportHash, pdfKey: row.pdfKey,
    complement: parse(row.complementJson, null), previous: parse(row.previousJson, null), flags: parse(row.flagsJson, []),
    reviewStatus: row.reviewStatus as RunRecord["reviewStatus"], validatedBy: row.validatedBy, validatedAt: row.validatedAt, publishedAt: row.publishedAt,
    notificationState: row.notificationState as RunRecord["notificationState"], supersededById: row.supersededById,
    costEur: row.costEurMilli === null ? null : row.costEurMilli / 1000, tokensUsed: row.tokensUsed, createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
}

/** Les dates sérialisées dans les JSON (nextAttempt…) ne sont pas des colonnes JSON : on traduit champ par champ. */
function patchToValues(patch: RunPatch): Partial<typeof bilanAutoRuns.$inferInsert> {
  const values: Record<string, unknown> = {};
  const direct = ["candidateId", "dossierRef", "inputVersion", "rubricVersion", "promptVersion", "model", "mode", "state", "attempts", "maxAttempts", "nextAttemptAt", "lockedBy", "lockedAt", "lastError", "outcome", "score", "scoreMax", "thresholdReached", "reportHash", "pdfKey", "reviewStatus", "validatedBy", "validatedAt", "publishedAt", "notificationState", "supersededById", "tokensUsed"] as const;
  for (const key of direct) if (key in patch) values[key] = (patch as Record<string, unknown>)[key];
  if ("inputSnapshot" in patch) values.inputSnapshotJson = json(patch.inputSnapshot);
  if ("facts" in patch) values.factsJson = json(patch.facts);
  if ("scoreResult" in patch) values.scoreJson = json(patch.scoreResult);
  if ("orientations" in patch) values.orientationsJson = json(patch.orientations);
  if ("report" in patch) values.reportJson = json(patch.report);
  if ("complement" in patch) values.complementJson = json(patch.complement);
  if ("previous" in patch) values.previousJson = json(patch.previous);
  if ("flags" in patch) values.flagsJson = json(patch.flags ?? []);
  if ("costEur" in patch) values.costEurMilli = patch.costEur === null || patch.costEur === undefined ? null : Math.round(patch.costEur * 1000);
  return values as Partial<typeof bilanAutoRuns.$inferInsert>;
}

const affected = (result: unknown): number => {
  const header = Array.isArray(result) ? result[0] : result;
  return Number((header as { affectedRows?: number })?.affectedRows ?? 0);
};

function rowToVersion(row: typeof bilanAutoVersions.$inferSelect): VersionRecord {
  return {
    id: row.id, runId: row.runId, evaluationId: row.evaluationId, versionNumber: row.versionNumber, authorKind: row.authorKind as VersionRecord["authorKind"], author: row.author, reason: row.reason,
    status: row.status as VersionStatus, baseVersion: row.baseVersion, report: parse(row.reportJson, {} as VersionRecord["report"]), scoreResult: parse(row.scoreJson, null), sources: parse(row.sourcesJson, []),
    reportHash: row.reportHash, pdfKey: row.pdfKey, publishedAt: row.publishedAt, publishedBy: row.publishedBy, notifiedAt: row.notifiedAt, createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
}

function versionPatchToValues(patch: VersionPatch): Partial<typeof bilanAutoVersions.$inferInsert> {
  const values: Record<string, unknown> = {};
  for (const key of ["authorKind", "author", "reason", "status", "baseVersion", "reportHash", "pdfKey", "publishedAt", "publishedBy", "notifiedAt"] as const) if (key in patch) values[key] = (patch as Record<string, unknown>)[key];
  if ("report" in patch) values.reportJson = JSON.stringify(patch.report);
  if ("scoreResult" in patch) values.scoreJson = json(patch.scoreResult);
  if ("sources" in patch) values.sourcesJson = JSON.stringify(patch.sources ?? []);
  return values as Partial<typeof bilanAutoVersions.$inferInsert>;
}

export const isDuplicateKey = (error: unknown) => {
  const e = error as { errno?: number; code?: string; cause?: { errno?: number; code?: string } };
  return e?.errno === 1062 || e?.code === "ER_DUP_ENTRY" || e?.cause?.errno === 1062 || e?.cause?.code === "ER_DUP_ENTRY";
};

export class DrizzleBilanAutoStore implements BilanAutoStore {
  constructor(private readonly db: Db) {}

  static async create(): Promise<DrizzleBilanAutoStore | null> {
    const db = await getDb();
    return db ? new DrizzleBilanAutoStore(db) : null;
  }

  async findByIdempotencyKey(key: string) {
    const [row] = await this.db.select().from(bilanAutoRuns).where(eq(bilanAutoRuns.idempotencyKey, key)).limit(1);
    return row ? rowToRun(row) : null;
  }

  async insertRun(run: NewRun) {
    try {
      const values = patchToValues(run as RunPatch) as typeof bilanAutoRuns.$inferInsert;
      const inserted = await this.db.insert(bilanAutoRuns).values({ ...values, evaluationId: run.evaluationId, submissionId: run.submissionId, idempotencyKey: run.idempotencyKey, inputSnapshotJson: JSON.stringify(run.inputSnapshot), inputVersion: run.inputVersion, rubricVersion: run.rubricVersion, promptVersion: run.promptVersion, mode: run.mode, state: run.state }).$returningId();
      return this.getRun(inserted[0].id);
    } catch (error) {
      if (isDuplicateKey(error)) return null;
      throw error;
    }
  }

  async getRun(id: number) {
    const [row] = await this.db.select().from(bilanAutoRuns).where(eq(bilanAutoRuns.id, id)).limit(1);
    return row ? rowToRun(row) : null;
  }

  async listRuns(filter: RunFilter) {
    const conditions = [
      filter.states ? inArray(bilanAutoRuns.state, filter.states) : undefined,
      filter.reviewStatus ? eq(bilanAutoRuns.reviewStatus, filter.reviewStatus) : undefined,
      filter.evaluationId !== undefined ? eq(bilanAutoRuns.evaluationId, filter.evaluationId) : undefined,
      filter.candidateId !== undefined ? eq(bilanAutoRuns.candidateId, filter.candidateId) : undefined,
    ].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));
    const rows = await this.db.select().from(bilanAutoRuns).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(bilanAutoRuns.id)).limit(filter.limit ?? 200);
    return rows.map(rowToRun);
  }

  async latestRunForEvaluation(evaluationId: number) {
    const [row] = await this.db.select().from(bilanAutoRuns).where(eq(bilanAutoRuns.evaluationId, evaluationId)).orderBy(desc(bilanAutoRuns.id)).limit(1);
    return row ? rowToRun(row) : null;
  }

  async previousRunsForCandidate(candidateId: number, evaluationId: number, excludeRunId: number) {
    const rows = await this.db.select().from(bilanAutoRuns)
      .where(and(eq(bilanAutoRuns.candidateId, candidateId), ne(bilanAutoRuns.id, excludeRunId), ne(bilanAutoRuns.mode, "simulation"), inArray(bilanAutoRuns.state, ["published", "ready_for_review", "superseded"]), sql`${bilanAutoRuns.reportJson} IS NOT NULL`, or(ne(bilanAutoRuns.evaluationId, evaluationId), lt(bilanAutoRuns.id, excludeRunId))))
      .orderBy(desc(bilanAutoRuns.id)).limit(10);
    return rows.map(rowToRun).filter((run) => run.score !== null);
  }

  async claimNext(workerId: string, now: Date, lockTtlMs: number) {
    const expired = new Date(now.getTime() - lockTtlMs);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const [candidate] = await this.db.select({ id: bilanAutoRuns.id }).from(bilanAutoRuns)
        .where(and(inArray(bilanAutoRuns.state, ["queued", "retry_pending"]), or(isNull(bilanAutoRuns.nextAttemptAt), sql`${bilanAutoRuns.nextAttemptAt} <= ${now}`), or(isNull(bilanAutoRuns.lockedBy), lt(bilanAutoRuns.lockedAt, expired))))
        .orderBy(asc(bilanAutoRuns.id)).limit(1);
      if (!candidate) return null;
      // Réservation atomique : une seule instance gagne la condition « encore libre ou verrou expiré ».
      const result = await this.db.update(bilanAutoRuns).set({ lockedBy: workerId, lockedAt: now })
        .where(and(eq(bilanAutoRuns.id, candidate.id), inArray(bilanAutoRuns.state, ["queued", "retry_pending"]), or(isNull(bilanAutoRuns.lockedBy), lt(bilanAutoRuns.lockedAt, expired))));
      if (affected(result) > 0) return this.getRun(candidate.id);
    }
    return null;
  }

  async updateRun(id: number, patch: RunPatch, guard?: { lockedBy?: string; expectedState?: RunState }) {
    const conditions = [eq(bilanAutoRuns.id, id), guard?.lockedBy !== undefined ? eq(bilanAutoRuns.lockedBy, guard.lockedBy) : undefined, guard?.expectedState !== undefined ? eq(bilanAutoRuns.state, guard.expectedState) : undefined].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));
    const values = patchToValues(patch);
    if (Object.keys(values).length === 0) return this.getRun(id);
    const result = await this.db.update(bilanAutoRuns).set(values).where(and(...conditions));
    if (affected(result) === 0) return null;
    return this.getRun(id);
  }

  async countRunsSince(since: Date) {
    const [row] = await this.db.select({ n: sql<number>`count(*)` }).from(bilanAutoRuns).where(gte(bilanAutoRuns.createdAt, since));
    return Number(row?.n ?? 0);
  }

  async sumCostSince(since: Date) {
    const [row] = await this.db.select({ total: sql<number>`coalesce(sum(${bilanAutoRuns.costEurMilli}), 0)` }).from(bilanAutoRuns).where(gte(bilanAutoRuns.createdAt, since));
    return Number(row?.total ?? 0) / 1000;
  }

  async addEvent(event: AuditEvent) {
    await this.db.insert(bilanAutoEvents).values({ runId: event.runId, evaluationId: event.evaluationId, actor: event.actor.slice(0, 320), action: event.action.slice(0, 64), detail: event.detail?.slice(0, 4000) ?? null, createdAt: event.at });
  }

  async listEvents(runId: number) {
    const rows = await this.db.select().from(bilanAutoEvents).where(eq(bilanAutoEvents.runId, runId)).orderBy(asc(bilanAutoEvents.id));
    return rows.map((row): AuditEvent => ({ runId: row.runId, evaluationId: row.evaluationId, actor: row.actor, action: row.action, detail: row.detail, at: row.createdAt }));
  }

  async enqueueOutbox(entry: Parameters<BilanAutoStore["enqueueOutbox"]>[0]) {
    try {
      const inserted = await this.db.insert(bilanAutoOutbox).values({ runId: entry.runId, dedupKey: entry.dedupKey, channel: entry.channel, recipient: entry.recipient, kind: entry.kind }).$returningId();
      const [row] = await this.db.select().from(bilanAutoOutbox).where(eq(bilanAutoOutbox.id, inserted[0].id)).limit(1);
      return row ? this.toOutbox(row) : null;
    } catch (error) {
      if (isDuplicateKey(error)) return null; // déjà en file : pas de doublon
      throw error;
    }
  }

  private toOutbox(row: typeof bilanAutoOutbox.$inferSelect): OutboxEntry {
    return { id: row.id, runId: row.runId, dedupKey: row.dedupKey, channel: row.channel as OutboxEntry["channel"], recipient: row.recipient, kind: row.kind as OutboxEntry["kind"], state: row.state as OutboxEntry["state"], attempts: row.attempts, providerMessageId: row.providerMessageId, lastError: row.lastError, createdAt: row.createdAt, updatedAt: row.updatedAt };
  }

  async claimOutbox(_now: Date, limit: number) {
    const claimed: OutboxEntry[] = [];
    const pending = await this.db.select().from(bilanAutoOutbox).where(and(eq(bilanAutoOutbox.state, "pending"), lt(bilanAutoOutbox.attempts, 5))).orderBy(asc(bilanAutoOutbox.id)).limit(limit);
    for (const row of pending) {
      // Réserve l'envoi : seul le processus qui passe attempts de n à n+1 envoie ce message.
      const result = await this.db.update(bilanAutoOutbox).set({ attempts: row.attempts + 1 }).where(and(eq(bilanAutoOutbox.id, row.id), eq(bilanAutoOutbox.state, "pending"), eq(bilanAutoOutbox.attempts, row.attempts)));
      if (affected(result) > 0) claimed.push(this.toOutbox({ ...row, attempts: row.attempts + 1 }));
    }
    return claimed;
  }

  async updateOutbox(id: number, patch: Parameters<BilanAutoStore["updateOutbox"]>[1]) {
    await this.db.update(bilanAutoOutbox).set(patch).where(eq(bilanAutoOutbox.id, id));
  }

  async listOutbox(runId: number) {
    const rows = await this.db.select().from(bilanAutoOutbox).where(eq(bilanAutoOutbox.runId, runId)).orderBy(asc(bilanAutoOutbox.id));
    return rows.map((row) => this.toOutbox(row));
  }

  async addVersion(version: NewVersion) {
    try {
      const inserted = await this.db.insert(bilanAutoVersions).values({ ...(versionPatchToValues(version) as typeof bilanAutoVersions.$inferInsert), runId: version.runId, evaluationId: version.evaluationId, versionNumber: version.versionNumber, reportJson: JSON.stringify(version.report), reportHash: version.reportHash, authorKind: version.authorKind, author: version.author, status: version.status }).$returningId();
      const [row] = await this.db.select().from(bilanAutoVersions).where(eq(bilanAutoVersions.id, inserted[0].id)).limit(1);
      return row ? rowToVersion(row) : null;
    } catch (error) {
      if (isDuplicateKey(error)) return null;
      throw error;
    }
  }

  async listVersions(runId: number) {
    const rows = await this.db.select().from(bilanAutoVersions).where(eq(bilanAutoVersions.runId, runId)).orderBy(asc(bilanAutoVersions.versionNumber));
    return rows.map(rowToVersion);
  }

  async updateVersion(id: number, patch: VersionPatch, guard?: { expectedStatus?: VersionStatus }) {
    const values = versionPatchToValues(patch);
    if (Object.keys(values).length === 0) return null;
    const conditions = [eq(bilanAutoVersions.id, id), guard?.expectedStatus !== undefined ? eq(bilanAutoVersions.status, guard.expectedStatus) : undefined].filter((c): c is NonNullable<typeof c> => Boolean(c));
    const result = await this.db.update(bilanAutoVersions).set(values).where(and(...conditions));
    if (affected(result) === 0) return null;
    const [row] = await this.db.select().from(bilanAutoVersions).where(eq(bilanAutoVersions.id, id)).limit(1);
    return row ? rowToVersion(row) : null;
  }

  async eraseCandidate(candidateId: number) {
    const rows = await this.db.select({ id: bilanAutoRuns.id, pdfKey: bilanAutoRuns.pdfKey }).from(bilanAutoRuns).where(eq(bilanAutoRuns.candidateId, candidateId));
    const ids = rows.map((row) => row.id);
    if (ids.length === 0) return { runs: 0, pdfKeys: [] };
    await this.db.delete(bilanAutoOutbox).where(inArray(bilanAutoOutbox.runId, ids));
    await this.db.delete(bilanAutoVersions).where(inArray(bilanAutoVersions.runId, ids));
    await this.db.delete(bilanAutoEvents).where(inArray(bilanAutoEvents.runId, ids));
    await this.db.delete(bilanAutoRuns).where(inArray(bilanAutoRuns.id, ids));
    return { runs: ids.length, pdfKeys: rows.map((row) => row.pdfKey).filter((key): key is string => Boolean(key)) };
  }
}
