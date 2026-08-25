import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Facteur TOTP chiffré : le secret n’est jamais stocké ni renvoyé en clair après l’enrôlement. */
export const securityTotpFactors = mysqlTable("security_totp_factors", {
  id: int("id").autoincrement().primaryKey(),
  actorType: mysqlEnum("actor_type", ["admin", "employer"]).notNull(),
  actorId: int("actor_id").notNull(),
  secretCiphertext: text("secret_ciphertext").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  enrolledAt: timestamp("enrolled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("uniq_totp_actor").on(table.actorType, table.actorId)]);

/** Chaque code est haché et devient inutilisable après consommation. */
export const securityRecoveryCodes = mysqlTable("security_recovery_codes", {
  id: int("id").autoincrement().primaryKey(),
  actorType: mysqlEnum("actor_type", ["admin", "employer"]).notNull(),
  actorId: int("actor_id").notNull(),
  codeHash: varchar("code_hash", { length: 255 }).notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_recovery_actor").on(table.actorType, table.actorId, table.usedAt)]);

/** Favoris privés, limités aux profils déjà soumis à l’organisation concernée. */
export const placementEmployerFavorites = mysqlTable("placement_employer_favorites", {
  id: int("id").autoincrement().primaryKey(),
  employerAccountId: int("employer_account_id").notNull(),
  submissionId: int("submission_id").notNull(),
  privateNote: text("private_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uniq_employer_favorite_submission").on(table.employerAccountId, table.submissionId),
  index("idx_employer_favorites_account").on(table.employerAccountId, table.createdAt),
]);

/** Partage interne d’un favori : il ne rend aucun nouveau profil visible hors de l’organisation déjà autorisée. */
export const placementEmployerFavoriteShares = mysqlTable("placement_employer_favorite_shares", {
  id: int("id").autoincrement().primaryKey(),
  sourceFavoriteId: int("source_favorite_id").notNull(),
  organizationId: int("organization_id").notNull(),
  recipientEmployerAccountId: int("recipient_employer_account_id").notNull(),
  sharedByEmployerAccountId: int("shared_by_employer_account_id").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uniq_favorite_share_recipient").on(table.sourceFavoriteId, table.recipientEmployerAccountId),
  index("idx_favorite_share_recipient").on(table.organizationId, table.recipientEmployerAccountId, table.revokedAt),
]);

/** Alerte interne limitée à l’organisation : jamais de donnée candidat détaillée dans le message. */
export const placementEmployerNotifications = mysqlTable("placement_employer_notifications", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  recipientEmployerAccountId: int("recipient_employer_account_id").notNull(),
  actorEmployerAccountId: int("actor_employer_account_id"),
  type: mysqlEnum("type", ["favorite_shared", "share_revoked", "role_changed", "collaborator_suspended", "collaborator_reactivated"]).notNull(),
  shareId: int("share_id"),
  message: varchar("message", { length: 500 }).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_employer_notification_recipient").on(table.organizationId, table.recipientEmployerAccountId, table.readAt, table.createdAt)]);

/** Journal organisationnel : conserve la gouvernance sans inclure de documents, contacts ou notes privées. */
export const placementEmployerCollaborationEvents = mysqlTable("placement_employer_collaboration_events", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  actorEmployerAccountId: int("actor_employer_account_id").notNull(),
  actorName: varchar("actor_name", { length: 255 }).notNull(),
  targetEmployerAccountId: int("target_employer_account_id"),
  targetName: varchar("target_name", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(),
  shareId: int("share_id"),
  profileCode: varchar("profile_code", { length: 48 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_collaboration_event_organization").on(table.organizationId, table.createdAt)]);
