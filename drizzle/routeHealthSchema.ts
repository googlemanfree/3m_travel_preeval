import { int, index, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const site404Config = mysqlTable("site_404_config", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull().default("Page introuvable"),
  message: text("message").notNull(),
  linksJson: text("linksJson").notNull().default("[]"),
  isActive: int("isActive").notNull().default(1),
  updatedByAdminId: int("updatedByAdminId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const route404Events = mysqlTable("route_404_events", {
  id: int("id").autoincrement().primaryKey(),
  path: varchar("path", { length: 512 }).notNull(),
  referrer: varchar("referrer", { length: 1000 }),
  userAgent: varchar("userAgent", { length: 512 }),
  occurrenceCount: int("occurrenceCount").notNull().default(1),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().onUpdateNow().notNull(),
  firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
}, (table) => ({ pathIdx: index("route_404_events_path_idx").on(table.path), lastSeenIdx: index("route_404_events_last_seen_idx").on(table.lastSeenAt) }));

export const externalLinkChecks = mysqlTable("external_link_checks", {
  id: int("id").autoincrement().primaryKey(),
  url: varchar("url", { length: 2000 }).notNull().unique(),
  label: varchar("label", { length: 255 }),
  status: mysqlEnum("status", ["pending", "ok", "broken", "redirect", "timeout", "error"]).notNull().default("pending"),
  httpStatus: int("httpStatus"),
  responseMs: int("responseMs"),
  errorMessage: varchar("errorMessage", { length: 1000 }),
  checkedAt: timestamp("checkedAt"),
  createdByAdminId: int("createdByAdminId"),
  updatedByAdminId: int("updatedByAdminId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ statusIdx: index("external_link_checks_status_idx").on(table.status), checkedIdx: index("external_link_checks_checked_idx").on(table.checkedAt) }));

export type Site404Config = typeof site404Config.$inferSelect;
export type Route404Event = typeof route404Events.$inferSelect;
export type ExternalLinkCheck = typeof externalLinkChecks.$inferSelect;
