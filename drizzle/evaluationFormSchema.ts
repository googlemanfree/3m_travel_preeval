import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Questions modifiables par l'administration (migration 0086). Uniquement une nouvelle table. */
export const evaluationFormOverrides = mysqlTable("evaluation_form_overrides", {
  id: int("id").autoincrement().primaryKey(),
  fieldKey: varchar("field_key", { length: 60 }).notNull(),
  action: mysqlEnum("action", ["hide", "relabel", "require", "optional", "add"]).notNull(),
  projectKind: mysqlEnum("project_kind", ["travail", "etudes", "tourisme", "evisa", "immigration"]),
  programId: varchar("program_id", { length: 80 }),
  domainId: varchar("domain_id", { length: 40 }),
  countryCode: varchar("country_code", { length: 2 }),
  payload: text("payload"),
  note: varchar("note", { length: 300 }),
  active: boolean("active").notNull().default(true),
  createdByAdminId: int("created_by_admin_id"),
  createdByLabel: varchar("created_by_label", { length: 160 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_evaluation_form_overrides_active").on(table.active, table.projectKind, table.programId)]);
