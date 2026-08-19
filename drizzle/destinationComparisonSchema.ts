import { int, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Comparaisons de destinations enregistrées par un candidat connecté. */
export const savedDestinationComparisons = mysqlTable(
  "saved_destination_comparisons",
  {
    id: int("id").autoincrement().primaryKey(),
    candidateId: int("candidateId").notNull(),
    primaryDestinationId: varchar("primaryDestinationId", { length: 180 }).notNull(),
    secondaryDestinationId: varchar("secondaryDestinationId", { length: 180 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("saved_destination_comparisons_candidate_pair_unique").on(
      table.candidateId,
      table.primaryDestinationId,
      table.secondaryDestinationId,
    ),
  ],
);
