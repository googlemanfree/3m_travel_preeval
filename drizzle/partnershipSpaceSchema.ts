import { index, int, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Espace partenaire et versements de commissions (migration 0099). Uniquement de nouvelles tables, reliées aux
 * dossiers de partenariat (migration 0098) par leur identifiant.
 */

/** Lien privé de l'espace partenaire : seul son empreinte est conservée ; révocable, renouvelable par 3M. */
export const partnershipSpaceLinks = mysqlTable("partnership_space_links", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("application_id").notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_partnership_space_token").on(table.tokenHash),
  index("idx_partnership_space_application").on(table.applicationId),
]);

/** Versement d'une commission mensuelle : une ligne par partenaire et par mois (le montant versé est figé). */
export const partnershipPayouts = mysqlTable("partnership_payouts", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("application_id").notNull(),
  period: varchar("period", { length: 7 }).notNull(),
  amountXaf: int("amount_xaf").notNull(),
  paymentsCount: int("payments_count").notNull(),
  reference: varchar("reference", { length: 120 }),
  method: varchar("method", { length: 60 }),
  note: varchar("note", { length: 500 }),
  paidAt: timestamp("paid_at").notNull(),
  paidBy: varchar("paid_by", { length: 320 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("uq_partnership_payout_period").on(table.applicationId, table.period)]);
