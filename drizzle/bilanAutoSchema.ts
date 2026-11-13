import { boolean, index, int, mediumtext, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Bilan automatisé (projet TRAVAIL) — tables additives, aucune colonne ajoutée aux tables existantes.
 * - `bilan_auto_runs` : un traitement = une version des entrées + une version du barème (faits, notation, orientations, rapport en JSON) ;
 * - `bilan_auto_events` : journal d'audit (qui, quoi, quand) ;
 * - `bilan_auto_outbox` : notifications à envoyer (déduplication par clé unique).
 * Les CV complets ne sont jamais stockés ici : seulement des références de stockage et des empreintes.
 */
export const bilanAutoRuns = mysqlTable("bilan_auto_runs", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId").notNull(),
  candidateId: int("candidateId"),
  dossierRef: varchar("dossierRef", { length: 64 }),
  submissionId: varchar("submissionId", { length: 64 }).notNull(),
  inputVersion: varchar("inputVersion", { length: 64 }).notNull(),
  rubricVersion: varchar("rubricVersion", { length: 40 }).notNull(),
  promptVersion: varchar("promptVersion", { length: 40 }).notNull(),
  model: varchar("model", { length: 80 }),
  idempotencyKey: varchar("idempotencyKey", { length: 191 }).notNull(),
  mode: varchar("mode", { length: 24 }).notNull(),
  state: varchar("state", { length: 32 }).notNull(),
  attempts: int("attempts").default(0).notNull(),
  maxAttempts: int("maxAttempts").default(4).notNull(),
  nextAttemptAt: timestamp("nextAttemptAt"),
  lockedBy: varchar("lockedBy", { length: 80 }),
  lockedAt: timestamp("lockedAt"),
  lastError: text("lastError"),
  outcome: varchar("outcome", { length: 2 }),
  score: int("score"),
  scoreMax: int("scoreMax"),
  thresholdReached: boolean("thresholdReached"),
  inputSnapshotJson: mediumtext("inputSnapshotJson").notNull(),
  factsJson: mediumtext("factsJson"),
  scoreJson: mediumtext("scoreJson"),
  orientationsJson: mediumtext("orientationsJson"),
  reportJson: mediumtext("reportJson"),
  reportHash: varchar("reportHash", { length: 64 }),
  pdfKey: varchar("pdfKey", { length: 512 }),
  complementJson: text("complementJson"),
  previousJson: text("previousJson"),
  flagsJson: text("flagsJson"),
  reviewStatus: varchar("reviewStatus", { length: 16 }).default("none").notNull(),
  validatedBy: varchar("validatedBy", { length: 320 }),
  validatedAt: timestamp("validatedAt"),
  publishedAt: timestamp("publishedAt"),
  notificationState: varchar("notificationState", { length: 24 }).default("none").notNull(),
  supersededById: int("supersededById"),
  costEurMilli: int("costEurMilli"),
  tokensUsed: int("tokensUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("uq_bilan_auto_runs_idempotency").on(table.idempotencyKey),
  index("idx_bilan_auto_runs_state").on(table.state, table.nextAttemptAt),
  index("idx_bilan_auto_runs_evaluation").on(table.evaluationId, table.id),
  index("idx_bilan_auto_runs_candidate").on(table.candidateId, table.id),
  index("idx_bilan_auto_runs_review").on(table.reviewStatus, table.state),
]);
export type BilanAutoRunRow = typeof bilanAutoRuns.$inferSelect;

export const bilanAutoEvents = mysqlTable("bilan_auto_events", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId"),
  evaluationId: int("evaluationId").notNull(),
  actor: varchar("actor", { length: 320 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("idx_bilan_auto_events_run").on(table.runId, table.id)]);

export const bilanAutoOutbox = mysqlTable("bilan_auto_outbox", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId").notNull(),
  dedupKey: varchar("dedupKey", { length: 191 }).notNull(),
  channel: varchar("channel", { length: 16 }).notNull(),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  kind: varchar("kind", { length: 32 }).notNull(),
  state: varchar("state", { length: 24 }).default("pending").notNull(),
  attempts: int("attempts").default(0).notNull(),
  providerMessageId: varchar("providerMessageId", { length: 191 }),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("uq_bilan_auto_outbox_dedup").on(table.dedupKey),
  index("idx_bilan_auto_outbox_state").on(table.state, table.id),
]);

/** Référentiel des sources (offres et repères salariaux) saisi par l'agence : seul ce qui est daté, sourcé et récent est publié dans un bilan. */
export const bilanAutoSources = mysqlTable("bilan_auto_sources", {
  id: int("id").autoincrement().primaryKey(),
  country: varchar("country", { length: 80 }).notNull(),
  kind: varchar("kind", { length: 12 }).notNull(),
  occupation: varchar("occupation", { length: 160 }).notNull(),
  employer: varchar("employer", { length: 160 }),
  city: varchar("city", { length: 120 }),
  amountMin: int("amountMin"),
  amountMax: int("amountMax"),
  currency: varchar("currency", { length: 8 }),
  period: varchar("period", { length: 24 }),
  grossOrNet: varchar("grossOrNet", { length: 8 }),
  geography: varchar("geography", { length: 120 }),
  url: varchar("url", { length: 700 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  observedAt: varchar("observedAt", { length: 10 }).notNull(),
  remoteRecruiting: varchar("remoteRecruiting", { length: 16 }).default("non_confirmee").notNull(),
  active: boolean("active").default(true).notNull(),
  createdBy: varchar("createdBy", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("idx_bilan_auto_sources_country").on(table.country, table.kind, table.active)]);
