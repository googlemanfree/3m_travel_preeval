import { index, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Journal des corrections de cohérence appliquées en lot : ancienne et nouvelle valeur, auteur, date — permet l'annulation. Table additive. */
export const dataCoherenceLog = mysqlTable("data_coherence_log", {
  id: int("id").autoincrement().primaryKey(),
  batchId: varchar("batchId", { length: 40 }).notNull(),
  tableName: varchar("tableName", { length: 60 }).notNull(),
  rowId: int("rowId").notNull(),
  field: varchar("field", { length: 60 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  actor: varchar("actor", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revertedAt: timestamp("revertedAt"),
}, table => [index("idx_data_coherence_log_batch").on(table.batchId, table.id)]);
