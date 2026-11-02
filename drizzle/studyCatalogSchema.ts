import { date, decimal, index, int, mysqlEnum, mysqlTable, smallint, text, timestamp, tinyint, uniqueIndex, varchar, char } from "drizzle-orm/mysql-core";

/** Catalogue études (migration 0088). Uniquement de nouvelles tables. */
export const studyInstitutions = mysqlTable("study_institutions", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  city: varchar("city", { length: 120 }),
  name: varchar("name", { length: 255 }).notNull(),
  institutionType: mysqlEnum("institution_type", ["university", "college", "business_school", "language_school", "vocational", "other"]).notNull().default("university"),
  publicPrivate: mysqlEnum("public_private", ["public", "private"]),
  accreditationNote: varchar("accreditation_note", { length: 500 }),
  /** Adresse du site de l'établissement : visible de l'administration seulement. */
  adminWebsite: varchar("admin_website", { length: 600 }),
  agencyRelation: mysqlEnum("agency_relation", ["partner", "listed"]).notNull().default("listed"),
  status: mysqlEnum("status", ["draft", "needs_review", "published", "retired"]).notNull().default("needs_review"),
  checkedAt: timestamp("checked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_study_institutions_country").on(table.countryCode, table.status)]);

export const studyPrograms = mysqlTable("study_programs", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  level: mysqlEnum("level", ["language", "certificate", "diploma", "bachelor", "master", "phd", "vocational"]).notNull().default("bachelor"),
  field: varchar("field", { length: 160 }),
  teachingLanguage: varchar("teaching_language", { length: 80 }),
  durationMonths: smallint("duration_months"),
  mode: mysqlEnum("mode", ["on_site", "hybrid"]).notNull().default("on_site"),
  admissionNote: text("admission_note"),
  languageNote: varchar("language_note", { length: 500 }),
  status: mysqlEnum("status", ["draft", "needs_review", "published", "retired"]).notNull().default("needs_review"),
  checkedAt: timestamp("checked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_study_programs_institution").on(table.institutionId, table.status)]);

export const studyIntakes = mysqlTable("study_intakes", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("program_id").notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  applicationsOpenAt: date("applications_open_at", { mode: "string" }),
  applicationDeadline: date("application_deadline", { mode: "string" }),
  documentsDeadline: date("documents_deadline", { mode: "string" }),
  availability: mysqlEnum("availability", ["open", "closing_soon", "closed", "waitlist"]).notNull().default("open"),
  status: mysqlEnum("status", ["draft", "needs_review", "published", "retired"]).notNull().default("needs_review"),
  checkedAt: timestamp("checked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_study_intakes_program").on(table.programId, table.status, table.startDate)]);

export const studyTuitionFees = mysqlTable("study_tuition_fees", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("program_id").notNull(),
  academicYear: varchar("academic_year", { length: 9 }).notNull(),
  studentCategory: mysqlEnum("student_category", ["international", "local"]).notNull().default("international"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: char("currency", { length: 3 }).notNull(),
  period: mysqlEnum("period", ["year", "semester", "total"]).notNull().default("year"),
  applicationFee: decimal("application_fee", { precision: 10, scale: 2 }),
  extraNote: varchar("extra_note", { length: 500 }),
  /** Provenance du montant : visible de l'administration seulement. */
  sourceNote: varchar("source_note", { length: 500 }),
  status: mysqlEnum("status", ["draft", "needs_review", "published", "retired"]).notNull().default("needs_review"),
  checkedAt: timestamp("checked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_study_tuition_fees_program").on(table.programId, table.status)]);

export const studyApplications = mysqlTable("study_applications", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  intakeId: int("intake_id").notNull(),
  preferenceRank: tinyint("preference_rank").notNull().default(1),
  status: mysqlEnum("status", ["submitted_to_agency", "agency_review", "documents_requested", "submitted_to_institution", "offer_conditional", "offer_unconditional", "deposit_paid", "admission_letter_received", "visa_phase", "rejected", "withdrawn"]).notNull().default("submitted_to_agency"),
  consentTextVersion: varchar("consent_text_version", { length: 20 }).notNull(),
  consentAt: timestamp("consent_at").defaultNow().notNull(),
  candidateNote: varchar("candidate_note", { length: 1000 }),
  adminNote: text("admin_note"),
  institutionReference: varchar("institution_reference", { length: 120 }),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  lastStatusAt: timestamp("last_status_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("uq_study_applications_candidate_intake").on(table.candidateId, table.intakeId),
  index("idx_study_applications_status").on(table.status, table.lastStatusAt),
]);

export const studyApplicationEvents = mysqlTable("study_application_events", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("application_id").notNull(),
  actorType: mysqlEnum("actor_type", ["candidate", "admin", "system"]).notNull(),
  actorId: int("actor_id"),
  action: varchar("action", { length: 80 }).notNull(),
  note: varchar("note", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_study_application_events_app").on(table.applicationId, table.createdAt)]);
