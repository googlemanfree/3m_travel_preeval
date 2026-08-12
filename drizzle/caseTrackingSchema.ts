import { boolean, date, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 32 }).notNull().unique(),
  candidateId: int("candidateId"),
  legacyApplicationId: int("legacyApplicationId").unique(),
  legacyAgencyDossierId: int("legacyAgencyDossierId").unique(),
  sourceChannel: mysqlEnum("sourceChannel", ["online", "agency_manual", "whatsapp", "email"]).notNull(),
  countryTarget: varchar("countryTarget", { length: 100 }),
  caseType: varchar("caseType", { length: 80 }),
  visaType: varchar("visaType", { length: 100 }),
  currentStatus: varchar("currentStatus", { length: 80 }).notNull().default("nouveau"),
  assignedAdminId: int("assignedAdminId"),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).notNull().default("normal"),
  openedAt: timestamp("openedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("idx_cases_candidate_status").on(table.candidateId, table.currentStatus), index("idx_cases_assignee_status").on(table.assignedAdminId, table.currentStatus)]);

export const caseApplicants = mysqlTable("case_applicants", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(), relationshipType: varchar("relationshipType", { length: 80 }).notNull().default("principal"),
  fullName: varchar("fullName", { length: 255 }).notNull(), dateOfBirth: date("dateOfBirth"), nationality: varchar("nationality", { length: 100 }), passportNumber: varchar("passportNumber", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("idx_case_applicants_case").on(table.caseId)]);

export const caseDocuments = mysqlTable("case_documents", {
  id: int("id").autoincrement().primaryKey(), caseId: int("caseId").notNull(), candidateId: int("candidateId"), legacyCandidateFileId: int("legacyCandidateFileId").unique(),
  documentType: varchar("documentType", { length: 100 }).notNull(), fileName: varchar("fileName", { length: 255 }).notNull(), fileKey: varchar("fileKey", { length: 512 }), mimeType: varchar("mimeType", { length: 100 }), fileSizeBytes: int("fileSizeBytes"),
  uploadedByRole: mysqlEnum("uploadedByRole", ["candidate", "admin", "agency"]).notNull(), reviewStatus: mysqlEnum("reviewStatus", ["received", "pending", "approved", "rejected", "correction_required"]).notNull().default("received"), reviewNote: text("reviewNote"), versionNo: int("versionNo").notNull().default(1), uploadedAt: timestamp("uploadedAt").defaultNow().notNull(), reviewedAt: timestamp("reviewedAt"),
}, table => [index("idx_case_documents_case_status").on(table.caseId, table.reviewStatus), index("idx_case_documents_candidate").on(table.candidateId)]);

export const documentRequirements = mysqlTable("document_requirements", {
  id: int("id").autoincrement().primaryKey(), caseId: int("caseId").notNull(), documentType: varchar("documentType", { length: 100 }).notNull(), isRequired: boolean("isRequired").notNull().default(true),
  status: mysqlEnum("status", ["pending", "received", "approved", "rejected", "waived"]).notNull().default("pending"), dueAt: timestamp("dueAt"), requestedAt: timestamp("requestedAt").defaultNow().notNull(), validatedAt: timestamp("validatedAt"), rejectedAt: timestamp("rejectedAt"), adminComment: text("adminComment"),
}, table => [index("idx_document_requirements_case_status").on(table.caseId, table.status)]);

export const caseStatusHistory = mysqlTable("case_status_history", {
  id: int("id").autoincrement().primaryKey(), caseId: int("caseId").notNull(), oldStatus: varchar("oldStatus", { length: 80 }), newStatus: varchar("newStatus", { length: 80 }).notNull(), changedByRole: mysqlEnum("changedByRole", ["candidate", "admin", "system"]).notNull(), changedById: int("changedById"), comment: text("comment"), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("idx_case_status_history_case_created").on(table.caseId, table.createdAt)]);

export const clientNotifications = mysqlTable("client_notifications", {
  id: int("id").autoincrement().primaryKey(), candidateId: int("candidateId").notNull(), caseId: int("caseId"), type: varchar("type", { length: 80 }).notNull(), title: varchar("title", { length: 255 }).notNull(), body: text("body").notNull(), actionUrl: varchar("actionUrl", { length: 512 }), isRead: boolean("isRead").notNull().default(false), emailSentAt: timestamp("emailSentAt"), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("idx_client_notifications_candidate_read").on(table.candidateId, table.isRead)]);

export const caseTasks = mysqlTable("case_tasks", { id: int("id").autoincrement().primaryKey(), caseId: int("caseId").notNull(), title: varchar("title", { length: 255 }).notNull(), description: text("description"), assignedAdminId: int("assignedAdminId"), dueAt: timestamp("dueAt"), taskStatus: mysqlEnum("taskStatus", ["open", "in_progress", "completed", "cancelled"]).notNull().default("open"), createdByAdminId: int("createdByAdminId"), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull() }, table => [index("idx_case_tasks_assignee_status").on(table.assignedAdminId, table.taskStatus)]);
export const caseAdminNotes = mysqlTable("case_admin_notes", { id: int("id").autoincrement().primaryKey(), caseId: int("caseId").notNull(), adminId: int("adminId"), note: text("note").notNull(), isPrivate: boolean("isPrivate").notNull().default(true), createdAt: timestamp("createdAt").defaultNow().notNull() }, table => [index("idx_case_admin_notes_case_created").on(table.caseId, table.createdAt)]);
export const caseActivityLogs = mysqlTable("case_activity_logs", { id: int("id").autoincrement().primaryKey(), caseId: int("caseId").notNull(), actorRole: mysqlEnum("actorRole", ["candidate", "admin", "system"]).notNull(), actorId: int("actorId"), actionType: varchar("actionType", { length: 100 }).notNull(), entityType: varchar("entityType", { length: 100 }).notNull(), entityId: varchar("entityId", { length: 100 }), description: text("description"), createdAt: timestamp("createdAt").defaultNow().notNull() }, table => [index("idx_case_activity_logs_case_created").on(table.caseId, table.createdAt)]);
