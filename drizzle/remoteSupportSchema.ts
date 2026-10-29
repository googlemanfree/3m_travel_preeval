import { date, index, int, mediumtext, mysqlEnum, mysqlTable, smallint, text, timestamp, tinyint, uniqueIndex, varchar, char } from "drizzle-orm/mysql-core";

/** Accompagnement à distance (migration 0091). Uniquement de nouvelles tables. */
export const remoteSlots = mysqlTable("remote_slots", {
  id: int("id").autoincrement().primaryKey(),
  startsAt: timestamp("starts_at").notNull(),
  durationMin: smallint("duration_min").notNull().default(30),
  channel: mysqlEnum("channel", ["video", "whatsapp", "phone"]).notNull().default("video"),
  /** Lien de visio : visible du candidat seulement une fois le créneau réservé par lui. */
  joinUrl: varchar("join_url", { length: 500 }),
  topic: varchar("topic", { length: 200 }),
  status: mysqlEnum("status", ["open", "booked", "done", "cancelled", "no_show"]).notNull().default("open"),
  candidateId: int("candidate_id"),
  candidateNote: varchar("candidate_note", { length: 500 }),
  bookedAt: timestamp("booked_at"),
  reminderSentAt: timestamp("reminder_sent_at"),
  minutesText: text("minutes_text"),
  createdBy: varchar("created_by", { length: 160 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_remote_slots_start").on(table.startsAt, table.status), index("idx_remote_slots_candidate").on(table.candidateId, table.status)]);

export const caseNextActions = mysqlTable("case_next_actions", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  action: varchar("action", { length: 300 }).notNull(),
  ownerAdminId: int("owner_admin_id"),
  ownerLabel: varchar("owner_label", { length: 160 }),
  dueOn: date("due_on", { mode: "string" }),
  status: mysqlEnum("status", ["open", "done", "cancelled"]).notNull().default("open"),
  /** Étape simple montrée au candidat (mode pas à pas) ; l'action interne, elle, ne l'est jamais. */
  candidateVisible: tinyint("candidate_visible").notNull().default(0),
  candidateText: varchar("candidate_text", { length: 300 }),
  doneAt: timestamp("done_at"),
  createdBy: varchar("created_by", { length: 160 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_case_next_actions_queue").on(table.status, table.ownerAdminId, table.dueOn), index("idx_case_next_actions_candidate").on(table.candidateId, table.status)]);

export const remoteAcknowledgements = mysqlTable("remote_acknowledgements", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  bodyText: text("body_text").notNull(),
  bodyHash: char("body_hash", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined", "cancelled"]).notNull().default("pending"),
  typedName: varchar("typed_name", { length: 255 }),
  declineReason: varchar("decline_reason", { length: 500 }),
  answeredAt: timestamp("answered_at"),
  ipHash: char("ip_hash", { length: 64 }),
  createdBy: varchar("created_by", { length: 160 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_remote_ack_candidate").on(table.candidateId, table.status)]);

/** Pilotage avancé (migration 0092) : demandes d'actions sensibles et satisfaction. */
export const sensitiveActionRequests = mysqlTable("sensitive_action_requests", {
  id: int("id").autoincrement().primaryKey(),
  action: mysqlEnum("action", ["deactivate"]).notNull().default("deactivate"),
  candidateId: int("candidate_id").notNull(),
  reason: varchar("reason", { length: 500 }).notNull(),
  requestedByAdminId: int("requested_by_admin_id").notNull(),
  requestedByLabel: varchar("requested_by_label", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  decidedByLabel: varchar("decided_by_label", { length: 160 }),
  decisionNote: varchar("decision_note", { length: 500 }),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_sensitive_requests_status").on(table.status, table.createdAt), index("idx_sensitive_requests_candidate").on(table.candidateId, table.status)]);

export const satisfactionResponses = mysqlTable("satisfaction_responses", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  milestone: varchar("milestone", { length: 40 }).notNull(),
  score: tinyint("score").notNull(),
  comment: varchar("comment", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_satisfaction_created").on(table.createdAt)]);

/** Outils d'administration (migration 0093) : modèles de bilan, résultats réels, échéanciers. */
export const bilanTemplates = mysqlTable("bilan_templates", {
  id: int("id").autoincrement().primaryKey(),
  profile: varchar("profile", { length: 40 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  version: int("version").notNull().default(1),
  bodyHtml: mediumtext("body_html").notNull(),
  createdBy: varchar("created_by", { length: 160 }),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("uq_bilan_templates_version").on(table.profile, table.name, table.version), index("idx_bilan_templates_profile").on(table.profile, table.archivedAt)]);

export const caseOutcomes = mysqlTable("case_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  destination: varchar("destination", { length: 100 }).notNull(),
  visaType: varchar("visa_type", { length: 100 }).notNull(),
  outcome: mysqlEnum("outcome", ["accepted", "refused", "withdrawn"]).notNull(),
  decidedOn: date("decided_on", { mode: "string" }),
  refusalReason: varchar("refusal_reason", { length: 300 }),
  recordedBy: varchar("recorded_by", { length: 160 }).notNull(),
  voidedAt: timestamp("voided_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_case_outcomes_candidate").on(table.candidateId), index("idx_case_outcomes_stats").on(table.destination, table.visaType, table.outcome)]);

export const paymentScheduleItems = mysqlTable("payment_schedule_items", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  amount: int("amount").notNull(),
  currency: char("currency", { length: 3 }).notNull().default("XAF"),
  dueOn: date("due_on", { mode: "string" }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "waived", "cancelled"]).notNull().default("pending"),
  paidOn: date("paid_on", { mode: "string" }),
  note: varchar("note", { length: 300 }),
  recordedBy: varchar("recorded_by", { length: 160 }),
  createdBy: varchar("created_by", { length: 160 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_payment_schedule_candidate").on(table.candidateId, table.status), index("idx_payment_schedule_due").on(table.status, table.dueOn)]);

/** Gouvernance du contenu (migration 0094) : relectures des pages et « Quoi de neuf ». */
export const contentReviews = mysqlTable("content_reviews", {
  id: int("id").autoincrement().primaryKey(),
  pagePath: varchar("page_path", { length: 190 }).notNull(),
  reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
  reviewedBy: varchar("reviewed_by", { length: 160 }).notNull(),
  note: varchar("note", { length: 300 }),
}, (table) => [uniqueIndex("uq_content_reviews_path").on(table.pagePath)]);

export const contentUpdates = mysqlTable("content_updates", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  summary: varchar("summary", { length: 600 }).notNull(),
  pagePath: varchar("page_path", { length: 190 }),
  published: tinyint("published").notNull().default(0),
  publishedAt: timestamp("published_at"),
  archivedAt: timestamp("archived_at"),
  createdBy: varchar("created_by", { length: 160 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_content_updates_published").on(table.published, table.archivedAt, table.publishedAt)]);
