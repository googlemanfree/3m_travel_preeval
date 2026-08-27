import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const adminTextTemplates = mysqlTable("admin_text_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  scope: mysqlEnum("scope", ["candidate_message", "evaluation_message", "general"]).notNull().default("general"),
  language: mysqlEnum("language", ["fr", "en"]).notNull().default("fr"),
  contentHtml: text("contentHtml").notNull(),
  contentText: text("contentText").notNull(),
  createdByAdminId: int("createdByAdminId").notNull(),
  updatedByAdminId: int("updatedByAdminId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ scopeIdx: index("admin_text_templates_scope_idx").on(table.scope), languageIdx: index("admin_text_templates_language_idx").on(table.language), updatedIdx: index("admin_text_templates_updated_idx").on(table.updatedAt) }));

export type AdminTextTemplate = typeof adminTextTemplates.$inferSelect;

/**
 * Journal immuable des modifications de modèles administratifs. Le contenu
 * n’est pas recopié : seule son empreinte permet d’établir la traçabilité.
 */
export const adminTextTemplateAuditEvents = mysqlTable("admin_text_template_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  templateName: varchar("templateName", { length: 120 }).notNull(),
  scope: mysqlEnum("scope", ["candidate_message", "evaluation_message", "general"]).notNull(),
  language: mysqlEnum("language", ["fr", "en"]).notNull(),
  action: mysqlEnum("action", ["created", "updated", "deleted"]).notNull(),
  actorAdminId: int("actorAdminId").notNull(),
  contentFingerprint: varchar("contentFingerprint", { length: 64 }).notNull(),
  reason: varchar("reason", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  templateIdx: index("admin_text_template_audit_template_idx").on(table.templateId, table.createdAt),
  actorIdx: index("admin_text_template_audit_actor_idx").on(table.actorAdminId, table.createdAt),
}));

export type AdminTextTemplateAuditEvent = typeof adminTextTemplateAuditEvents.$inferSelect;
