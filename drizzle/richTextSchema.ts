import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const adminTextTemplates = mysqlTable("admin_text_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  scope: mysqlEnum("scope", ["candidate_message", "evaluation_message", "general"]).notNull().default("general"),
  contentHtml: text("contentHtml").notNull(),
  contentText: text("contentText").notNull(),
  createdByAdminId: int("createdByAdminId").notNull(),
  updatedByAdminId: int("updatedByAdminId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ scopeIdx: index("admin_text_templates_scope_idx").on(table.scope), updatedIdx: index("admin_text_templates_updated_idx").on(table.updatedAt) }));

export type AdminTextTemplate = typeof adminTextTemplates.$inferSelect;
