import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Module « Entreprises & partenaires » (migration 0081). Uniquement de nouvelles tables, reliées aux organisations et
 * comptes employeurs existants (placement_organizations, placement_employer_accounts) par leur identifiant.
 */

/** Informations d'inscription complémentaires : catégorie précise, mandat, justificatif d'autorisation privé. */
export const partnerRegistrationExtras = mysqlTable("partner_registration_extras", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("request_id").notNull(),
  category: mysqlEnum("category", ["employer", "recruiter", "placement_agency"]).notNull(),
  mandateCompany: varchar("mandate_company", { length: 255 }),
  mandateConfidential: boolean("mandate_confidential").notNull().default(false),
  authorizationDocKey: varchar("authorization_doc_key", { length: 512 }),
  authorizationDocName: varchar("authorization_doc_name", { length: 255 }),
  authorizationDocMime: varchar("authorization_doc_mime", { length: 64 }),
  uploadTokenHash: varchar("upload_token_hash", { length: 128 }),
  uploadTokenExpiresAt: timestamp("upload_token_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("uq_partner_registration_extras_request").on(table.requestId)]);

/** Fiche de suivi relationnel d'un partenaire (une par organisation). */
export const partnerProfiles = mysqlTable("partner_profiles", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  category: mysqlEnum("category", ["employer", "recruiter", "placement_agency"]).notNull().default("employer"),
  relationshipStatus: mysqlEnum("relationship_status", ["prospect", "contacted", "in_verification", "validated", "active", "suspended"]).notNull().default("prospect"),
  primaryContactName: varchar("primary_contact_name", { length: 255 }),
  primaryContactEmail: varchar("primary_contact_email", { length: 320 }),
  primaryContactPhone: varchar("primary_contact_phone", { length: 64 }),
  primaryContactRole: varchar("primary_contact_role", { length: 160 }),
  specialties: text("specialties"),
  operatingCountries: text("operating_countries"),
  ownerAdminId: int("owner_admin_id"),
  ownerAdminLabel: varchar("owner_admin_label", { length: 160 }),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  publicDisplayConsent: boolean("public_display_consent").notNull().default(false),
  publicDisplayConsentedAt: timestamp("public_display_consented_at"),
  mandateCompany: varchar("mandate_company", { length: 255 }),
  mandateConfidential: boolean("mandate_confidential").notNull().default(false),
  internalNote: text("internal_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("uq_partner_profiles_org").on(table.organizationId),
  index("idx_partner_profiles_status").on(table.relationshipStatus, table.nextFollowUpAt),
]);

/** Historique des échanges et changements de statut (visible de l'administration uniquement). */
export const partnerInteractions = mysqlTable("partner_interactions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  kind: mysqlEnum("kind", ["note", "call", "email", "meeting", "status_change", "invitation", "document"]).notNull().default("note"),
  summary: text("summary").notNull(),
  followUpAt: timestamp("follow_up_at"),
  createdByAdminId: int("created_by_admin_id"),
  createdByLabel: varchar("created_by_label", { length: 160 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_partner_interactions_org").on(table.organizationId, table.createdAt)]);

/** Invitations personnelles : lien à usage unique, durée limitée, jeton stocké haché. */
export const partnerInvitations = mysqlTable("partner_invitations", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  collaborationRole: mysqlEnum("collaboration_role", ["reader", "manager"]).notNull().default("reader"),
  permissions: text("permissions"),
  tokenHash: varchar("token_hash", { length: 128 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  revokedAt: timestamp("revoked_at"),
  createdByAdminId: int("created_by_admin_id"),
  createdByAccountId: int("created_by_account_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_partner_invitations_token").on(table.tokenHash),
  index("idx_partner_invitations_org").on(table.organizationId, table.createdAt),
  index("idx_partner_invitations_email").on(table.email),
]);

/** Permissions détaillées d'un utilisateur partenaire (surcharge des valeurs par défaut du rôle). */
export const partnerUserPermissions = mysqlTable("partner_user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("account_id").notNull(),
  permissions: text("permissions").notNull(),
  updatedByLabel: varchar("updated_by_label", { length: 160 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("uq_partner_user_permissions_account").on(table.accountId)]);
