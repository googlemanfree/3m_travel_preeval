import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Organismes de placement ou employeurs, créés et vérifiés exclusivement par 3M. */
export const placementOrganizations = mysqlTable("placement_organizations", {
  id: int("id").autoincrement().primaryKey(),
  organizationType: mysqlEnum("organization_type", ["placement_partner", "employer"]).notNull(),
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  country: varchar("country", { length: 120 }).notNull(),
  contactEmail: varchar("contact_email", { length: 320 }).notNull(),
  verificationStatus: mysqlEnum("verification_status", ["pending", "verified", "suspended"]).notNull().default("pending"),
  verifiedAt: timestamp("verified_at"),
  verifiedByAdminId: int("verified_by_admin_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_placement_organizations_status").on(table.verificationStatus, table.organizationType)]);

/** Accès de portail remis manuellement après vérification de l’organisation. */
export const placementEmployerAccounts = mysqlTable("placement_employer_accounts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  sessionTokenHash: varchar("session_token_hash", { length: 128 }),
  sessionExpiresAt: timestamp("session_expires_at"),
  status: mysqlEnum("status", ["invited", "active", "suspended"]).notNull().default("invited"),
  createdByAdminId: int("created_by_admin_id").notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_placement_employer_org").on(table.organizationId, table.status)]);

/** Consentement explicite, révocable et horodaté du candidat au partage d’un profil anonymisé. */
export const candidatePlacementConsents = mysqlTable("candidate_placement_consents", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull().unique(),
  status: mysqlEnum("status", ["granted", "withdrawn"]).notNull().default("withdrawn"),
  consentedAt: timestamp("consented_at"),
  withdrawnAt: timestamp("withdrawn_at"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/** Fiche de placement anonymisée : aucun téléphone, e-mail, CV brut, passeport ou adresse. */
export const placementCandidateProfiles = mysqlTable("placement_candidate_profiles", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  profileCode: varchar("profile_code", { length: 48 }).notNull().unique(),
  summary: text("summary").notNull(),
  targetDestination: varchar("target_destination", { length: 120 }).notNull(),
  targetProcedure: varchar("target_procedure", { length: 160 }).notNull(),
  sector: varchar("sector", { length: 160 }),
  yearsExperience: varchar("years_experience", { length: 32 }),
  languagesSummary: varchar("languages_summary", { length: 255 }),
  createdByAdminId: int("created_by_admin_id").notNull(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_placement_profiles_candidate").on(table.candidateId, table.archivedAt)]);

/** Soumission d’un profil déjà consenti vers un organisme vérifié, jamais publique. */
export const placementProfileSubmissions = mysqlTable("placement_profile_submissions", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profile_id").notNull(),
  organizationId: int("organization_id").notNull(),
  status: mysqlEnum("status", ["submitted", "under_review", "shortlisted", "selected", "not_selected", "documents_requested", "procedure_ready", "withdrawn"]).notNull().default("submitted"),
  submittedByAdminId: int("submitted_by_admin_id").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  lastResponseAt: timestamp("last_response_at"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_placement_submissions_org").on(table.organizationId, table.status)]);

/** Journal d’audit de chaque remise ou retour, sans divulgation de données de contact. */
export const placementSubmissionEvents = mysqlTable("placement_submission_events", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submission_id").notNull(),
  actorType: mysqlEnum("actor_type", ["admin", "employer", "candidate", "system"]).notNull(),
  actorId: int("actor_id"),
  action: varchar("action", { length: 100 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_placement_events_submission").on(table.submissionId, table.createdAt)]);
