import { index, int, mysqlEnum, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Journal minimal des clics de navigation publique. Il ne stocke aucune
 * identité, information de contact, contenu saisi ou donnée de dossier.
 */
export const footerEngagementEvents = mysqlTable("footer_engagement_events", {
  id: int("id").autoincrement().primaryKey(),
  surface: mysqlEnum("surface", ["footer_shortcut", "footer_social"]).notNull(),
  targetKey: varchar("target_key", { length: 80 }).notNull(),
  href: varchar("href", { length: 512 }).notNull(),
  language: mysqlEnum("language", ["fr", "en"]).notNull().default("fr"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  surfaceCreatedIdx: index("footer_engagement_surface_created_idx").on(table.surface, table.createdAt),
  targetCreatedIdx: index("footer_engagement_target_created_idx").on(table.targetKey, table.createdAt),
}));

export type FooterEngagementEvent = typeof footerEngagementEvents.$inferSelect;
