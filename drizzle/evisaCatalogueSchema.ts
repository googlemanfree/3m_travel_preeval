import { boolean, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Surcharges administrables du catalogue e‑Visa public.
 * Une entrée portant le même slug qu’une fiche standard remplace cette fiche ;
 * isActive=false la masque sans effacer les instantanés déjà envoyés aux clients.
 */
export const managedEvisaDestinations = mysqlTable("managed_evisa_destinations", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  country: varchar("country", { length: 160 }).notNull(),
  capital: varchar("capital", { length: 160 }).notNull(),
  flag: varchar("flag", { length: 16 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  visaType: varchar("visaType", { length: 160 }).notNull(),
  duration: varchar("duration", { length: 160 }).notNull(),
  delay: varchar("delay", { length: 160 }).notNull(),
  requirements: text("requirements").notNull(),
  fee: varchar("fee", { length: 160 }).notNull(),
  notes: text("notes").notNull(),
  imageUrl: text("imageUrl"),
  officialPortalUrl: varchar("officialPortalUrl", { length: 1000 }).notNull(),
  officialPortalLabel: varchar("officialPortalLabel", { length: 255 }).notNull(),
  officialVerifiedAt: varchar("officialVerifiedAt", { length: 80 }).notNull(),
  highlightsJson: text("highlightsJson"),
  emblemsJson: text("emblemsJson"),
  stepsJson: text("stepsJson"),
  isActive: boolean("isActive").default(true).notNull(),
  createdByAdminId: int("createdByAdminId").notNull(),
  updatedByAdminId: int("updatedByAdminId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const evisaCatalogueAuditLogs = mysqlTable("evisa_catalogue_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  destinationId: int("destinationId"),
  destinationSlug: varchar("destinationSlug", { length: 100 }).notNull(),
  action: varchar("action", { length: 32 }).notNull(),
  summary: varchar("summary", { length: 500 }).notNull(),
  previousSnapshotJson: text("previousSnapshotJson"),
  nextSnapshotJson: text("nextSnapshotJson"),
  actorAdminId: int("actorAdminId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
