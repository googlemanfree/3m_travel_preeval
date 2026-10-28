import { date, decimal, index, int, mysqlEnum, mysqlTable, smallint, text, timestamp, tinyint, uniqueIndex, varchar, char } from "drizzle-orm/mysql-core";

/** Séjours pour visiteurs et touristes (migration 0090). Uniquement de nouvelles tables. */
export const stayPrograms = mysqlTable("stay_programs", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  city: varchar("city", { length: 120 }),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["discovery", "family_visit", "events", "language_stay", "wellness", "business_visit", "other"]).notNull().default("discovery"),
  summary: varchar("summary", { length: 500 }).notNull(),
  description: text("description").notNull(),
  durationDaysMin: smallint("duration_days_min"),
  durationDaysMax: smallint("duration_days_max"),
  seasonNote: varchar("season_note", { length: 300 }),
  includedNote: varchar("included_note", { length: 1000 }),
  visaNote: varchar("visa_note", { length: 1000 }),
  priceFrom: decimal("price_from", { precision: 12, scale: 2 }),
  priceCurrency: char("price_currency", { length: 3 }),
  priceBasis: varchar("price_basis", { length: 80 }),
  /** Provenance du prix : visible de l'administration seulement. */
  priceSourceNote: varchar("price_source_note", { length: 500 }),
  priceCheckedAt: timestamp("price_checked_at"),
  /** Prestataire ou partenaire : visible de l'administration seulement. */
  providerNote: varchar("provider_note", { length: 500 }),
  status: mysqlEnum("status", ["draft", "needs_review", "published", "retired"]).notNull().default("needs_review"),
  checkedAt: timestamp("checked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_stay_programs_country").on(table.countryCode, table.status)]);

export const stayRequests = mysqlTable("stay_requests", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  programId: int("program_id").notNull(),
  preferredStart: date("preferred_start", { mode: "string" }),
  travelers: tinyint("travelers").notNull().default(1),
  status: mysqlEnum("status", ["requested", "quote_prepared", "confirmed", "declined", "cancelled"]).notNull().default("requested"),
  consentTextVersion: varchar("consent_text_version", { length: 20 }).notNull(),
  consentAt: timestamp("consent_at").defaultNow().notNull(),
  candidateNote: varchar("candidate_note", { length: 1000 }),
  adminNote: text("admin_note"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  lastStatusAt: timestamp("last_status_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("uq_stay_requests_candidate_program").on(table.candidateId, table.programId),
  index("idx_stay_requests_status").on(table.status, table.lastStatusAt),
]);

export const stayRequestEvents = mysqlTable("stay_request_events", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("request_id").notNull(),
  actorType: mysqlEnum("actor_type", ["candidate", "admin", "system"]).notNull(),
  actorId: int("actor_id"),
  action: varchar("action", { length: 80 }).notNull(),
  note: varchar("note", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_stay_request_events_request").on(table.requestId, table.createdAt)]);
