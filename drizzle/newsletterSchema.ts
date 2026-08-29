import { boolean, index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Abonnements newsletter publics, sans profilage ni envoi automatique implicite. */
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  language: varchar("language", { length: 2 }).notNull().default("fr"),
  consentGiven: boolean("consentGiven").notNull().default(true),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("newsletter_subscribers_active_idx").on(table.unsubscribedAt, table.subscribedAt),
]);

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;
