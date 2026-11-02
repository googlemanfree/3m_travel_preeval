import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Confidentialité dès la conception + CVthèque contrôlée (migration 0082). Uniquement de nouvelles tables. */

export const privacyAuditEvents = mysqlTable("privacy_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  actorType: mysqlEnum("actor_type", ["admin", "employer", "candidate", "system"]).notNull(),
  actorId: int("actor_id"),
  actorLabel: varchar("actor_label", { length: 160 }),
  organizationId: int("organization_id"),
  action: varchar("action", { length: 80 }).notNull(),
  resourceType: varchar("resource_type", { length: 60 }),
  resourceId: varchar("resource_id", { length: 120 }),
  outcome: mysqlEnum("outcome", ["success", "denied", "failure"]).notNull().default("success"),
  details: varchar("details", { length: 500 }),
  ipHash: varchar("ip_hash", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_privacy_audit_created").on(table.createdAt),
  index("idx_privacy_audit_actor").on(table.actorType, table.actorId, table.action, table.createdAt),
  index("idx_privacy_audit_resource").on(table.resourceType, table.resourceId),
]);

export const consentRecords = mysqlTable("consent_records", {
  id: int("id").autoincrement().primaryKey(),
  subjectType: mysqlEnum("subject_type", ["candidate", "partner_user"]).notNull(),
  subjectId: int("subject_id").notNull(),
  kind: varchar("kind", { length: 60 }).notNull(),
  version: varchar("version", { length: 32 }).notNull(),
  granted: boolean("granted").notNull(),
  source: varchar("source", { length: 40 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_consent_records_subject").on(table.subjectType, table.subjectId, table.kind, table.createdAt)]);

export const dataProcessors = mysqlTable("data_processors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  purpose: varchar("purpose", { length: 255 }).notNull(),
  hostingCountry: varchar("hosting_country", { length: 120 }),
  dataCategories: varchar("data_categories", { length: 255 }).notNull(),
  contractBasis: varchar("contract_basis", { length: 255 }),
  safeguardsStatus: mysqlEnum("safeguards_status", ["unreviewed", "reviewed", "refused"]).notNull().default("unreviewed"),
  integrationEnabled: boolean("integration_enabled").notNull().default(false),
  notes: text("notes"),
  reviewedByAdminId: int("reviewed_by_admin_id"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("uq_data_processors_name").on(table.name)]);

export const cvthequeProfiles = mysqlTable("cvtheque_profiles", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profile_id").notNull(),
  candidateId: int("candidate_id").notNull(),
  jobTitle: varchar("job_title", { length: 160 }),
  sector: varchar("sector", { length: 160 }),
  skills: text("skills"),
  educationLevel: varchar("education_level", { length: 60 }),
  experienceYears: int("experience_years"),
  languages: text("languages"),
  availability: varchar("availability", { length: 32 }),
  destinations: text("destinations"),
  residenceCountry: varchar("residence_country", { length: 120 }),
  workAuthorization: mysqlEnum("work_authorization", ["none", "other_country", "application_in_progress", "not_specified"]).notNull().default("not_specified"),
  visibilityState: mysqlEnum("visibility_state", ["draft", "pending_review", "published", "withdrawn", "rejected"]).notNull().default("draft"),
  verificationLevels: text("verification_levels"),
  searchText: text("search_text"),
  publishedAt: timestamp("published_at"),
  withdrawnAt: timestamp("withdrawn_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedByAdminId: int("reviewed_by_admin_id"),
  reviewNote: text("review_note"),
  nextReviewAt: timestamp("next_review_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("uq_cvtheque_profiles_profile").on(table.profileId),
  index("idx_cvtheque_profiles_state").on(table.visibilityState, table.publishedAt),
  index("idx_cvtheque_profiles_candidate").on(table.candidateId),
]);

export const partnerSelections = mysqlTable("partner_selections", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  accountId: int("account_id").notNull(),
  cvthequeProfileId: int("cvtheque_profile_id").notNull(),
  note: varchar("note", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_partner_selections_account_profile").on(table.accountId, table.cvthequeProfileId),
  index("idx_partner_selections_org").on(table.organizationId),
]);

export const documentTransmissions = mysqlTable("document_transmissions", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  fileId: int("file_id").notNull(),
  fileLabel: varchar("file_label", { length: 255 }).notNull(),
  purpose: varchar("purpose", { length: 500 }).notNull(),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  issuedByAdminId: int("issued_by_admin_id").notNull(),
  issuedByLabel: varchar("issued_by_label", { length: 160 }),
  linkExpiresAt: timestamp("link_expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_document_transmissions_candidate").on(table.candidateId, table.createdAt)]);
