import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Surcharges administratives des portails institutionnels du registre consulaire. */
export const managedConsularPortals = mysqlTable("managed_consular_portals", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("countryCode", { length: 120 }).notNull().unique(),
  countryName: varchar("countryName", { length: 160 }).notNull(),
  officialPortalUrl: text("officialPortalUrl"),
  officialPortalLabel: varchar("officialPortalLabel", { length: 255 }),
  officialVerifiedAt: varchar("officialVerifiedAt", { length: 80 }),
  verificationStatus: mysqlEnum("verificationStatus", ["verifie", "a_completer"]).default("a_completer").notNull(),
  verificationNote: text("verificationNote"),
  revalidateDueAt: timestamp("revalidateDueAt"),
  lastRevalidationAlertAt: timestamp("lastRevalidationAlertAt"),
  updatedByAdminId: int("updatedByAdminId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Journal avant/après nécessaire à la traçabilité des mises à jour consulaires. */
export const managedConsularPortalAuditLogs = mysqlTable("managed_consular_portal_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  portalId: int("portalId").notNull(),
  countryCode: varchar("countryCode", { length: 120 }).notNull(),
  action: mysqlEnum("action", ["created", "updated"]).notNull(),
  summary: varchar("summary", { length: 500 }).notNull(),
  previousSnapshotJson: text("previousSnapshotJson"),
  nextSnapshotJson: text("nextSnapshotJson"),
  actorAdminId: int("actorAdminId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
