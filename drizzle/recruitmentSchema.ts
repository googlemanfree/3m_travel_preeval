import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Besoins de recrutement, présentations, entretiens, notifications, historique (migration 0083). Uniquement de nouvelles tables. */

export const recruitmentNeeds = mysqlTable("recruitment_needs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  createdByAccountId: int("created_by_account_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  companyName: varchar("company_name", { length: 255 }),
  beneficiaryConfidential: boolean("beneficiary_confidential").notNull().default(false),
  missions: text("missions").notNull(),
  country: varchar("country", { length: 120 }).notNull(),
  workLocation: varchar("work_location", { length: 200 }),
  salaryGross: int("salary_gross"),
  salaryCurrency: varchar("salary_currency", { length: 8 }),
  salaryPeriod: mysqlEnum("salary_period", ["hour", "month", "year"]),
  contractDuration: varchar("contract_duration", { length: 120 }),
  requiredSkills: text("required_skills"),
  requiredQualifications: text("required_qualifications"),
  requiredExperience: varchar("required_experience", { length: 300 }),
  requiredLanguages: varchar("required_languages", { length: 300 }),
  recognitionsRequired: text("recognitions_required"),
  foreignApplications: mysqlEnum("foreign_applications", ["yes", "no", "tbc"]).notNull().default("tbc"),
  noLocalWorkAuth: mysqlEnum("no_local_work_auth", ["yes", "no", "tbc"]).notNull().default("tbc"),
  reviewResidenceCountries: text("review_residence_countries"),
  intlSupport: mysqlEnum("intl_support", ["yes", "no", "to_specify"]).notNull().default("to_specify"),
  intlSupportDetail: text("intl_support_detail"),
  status: mysqlEnum("status", ["received", "under_review", "verified", "needs_info", "closed", "rejected"]).notNull().default("received"),
  adminNote: text("admin_note"),
  verifiedAt: timestamp("verified_at"),
  verifiedByAdminId: int("verified_by_admin_id"),
  relatedCvthequeProfileId: int("related_cvtheque_profile_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_recruitment_needs_org").on(table.organizationId, table.status, table.createdAt),
  index("idx_recruitment_needs_status").on(table.status, table.createdAt),
]);

export const needCandidates = mysqlTable("need_candidates", {
  id: int("id").autoincrement().primaryKey(),
  needId: int("need_id").notNull(),
  cvthequeProfileId: int("cvtheque_profile_id").notNull(),
  origin: mysqlEnum("origin", ["employer", "admin"]).notNull().default("employer"),
  status: mysqlEnum("status", ["proposed", "admin_review", "candidate_contacted", "candidate_interested", "candidate_declined", "presented", "interview_requested", "interview_scheduled", "interview_done", "employer_selected", "employer_not_selected", "closed"]).notNull().default("proposed"),
  employerDecision: mysqlEnum("employer_decision", ["pending", "selected", "not_selected", "on_hold"]).notNull().default("pending"),
  employerComment: varchar("employer_comment", { length: 1000 }),
  adminNote: text("admin_note"),
  candidateRespondedAt: timestamp("candidate_responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("uq_need_candidates_pair").on(table.needId, table.cvthequeProfileId),
  index("idx_need_candidates_profile").on(table.cvthequeProfileId, table.status),
]);

export const interviewRequests = mysqlTable("interview_requests", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  requestedByAccountId: int("requested_by_account_id").notNull(),
  cvthequeProfileId: int("cvtheque_profile_id").notNull(),
  needId: int("need_id"),
  proposedSlots: varchar("proposed_slots", { length: 500 }),
  mode: mysqlEnum("mode", ["video", "phone", "onsite", "undecided"]).notNull().default("undecided"),
  message: varchar("message", { length: 1000 }),
  status: mysqlEnum("status", ["received", "accepted", "candidate_confirmed", "scheduled", "done", "declined", "cancelled"]).notNull().default("received"),
  scheduledAt: timestamp("scheduled_at"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_interview_requests_org").on(table.organizationId, table.status, table.createdAt),
  index("idx_interview_requests_profile").on(table.cvthequeProfileId, table.status),
]);

export const partnerNotifications = mysqlTable("partner_notifications", {
  id: int("id").autoincrement().primaryKey(),
  recipientKind: mysqlEnum("recipient_kind", ["admin", "organization", "candidate"]).notNull(),
  organizationId: int("organization_id"),
  candidateId: int("candidate_id"),
  kind: varchar("kind", { length: 60 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: varchar("message", { length: 500 }).notNull(),
  relatedType: varchar("related_type", { length: 40 }),
  relatedId: int("related_id"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_partner_notifications_org").on(table.recipientKind, table.organizationId, table.readAt, table.createdAt),
  index("idx_partner_notifications_candidate").on(table.recipientKind, table.candidateId, table.readAt, table.createdAt),
]);

export const recruitmentEvents = mysqlTable("recruitment_events", {
  id: int("id").autoincrement().primaryKey(),
  subjectType: mysqlEnum("subject_type", ["need", "need_candidate", "interview"]).notNull(),
  subjectId: int("subject_id").notNull(),
  organizationId: int("organization_id"),
  actorType: mysqlEnum("actor_type", ["admin", "employer", "candidate", "system"]).notNull(),
  actorLabel: varchar("actor_label", { length: 160 }),
  action: varchar("action", { length: 80 }).notNull(),
  note: varchar("note", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_recruitment_events_subject").on(table.subjectType, table.subjectId, table.createdAt)]);
