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
