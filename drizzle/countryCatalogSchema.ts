import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Catalogue mondial des parcours (migration 0087). Uniquement de nouvelles tables.
 * Une fiche (pays × parcours) n'est visible d'un candidat qu'une fois « publiée », donc appuyée par une source officielle relue.
 */
export const countryPathways = mysqlTable("country_pathways", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  pathway: mysqlEnum("pathway", ["work", "study", "visit"]).notNull(),
  coverage: mysqlEnum("coverage", ["named", "to_document", "not_offered"]).notNull().default("to_document"),
  summary: text("summary"),
  status: mysqlEnum("status", ["draft", "needs_review", "published", "retired"]).notNull().default("needs_review"),
  schemaVersion: int("schema_version").notNull().default(1),
  checkedAt: timestamp("checked_at"),
  checkedByAdminId: int("checked_by_admin_id"),
  checkedByLabel: varchar("checked_by_label", { length: 160 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("uq_country_pathways_country_pathway").on(table.countryCode, table.pathway),
  index("idx_country_pathways_status").on(table.status, table.pathway),
]);

export const countryVisaPrograms = mysqlTable("country_visa_programs", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  pathway: mysqlEnum("pathway", ["work", "study", "visit"]).notNull(),
  /** Identifiant du programme du formulaire dynamique (ex. travail-employeur), si le dispositif y correspond. */
  programRef: varchar("program_ref", { length: 80 }),
  officialName: varchar("official_name", { length: 200 }).notNull(),
  nameFr: varchar("name_fr", { length: 200 }),
  legalBasis: varchar("legal_basis", { length: 300 }),
  routeType: mysqlEnum("route_type", ["employer", "qualified", "transfer", "seasonal", "jobseeker", "quota", "points"]),
  offerRequired: mysqlEnum("offer_required", ["yes", "no", "depends"]),
  sponsorLicenceRequired: boolean("sponsor_licence_required"),
  labourMarketTest: boolean("labour_market_test"),
  /** Notes en texte libre, chacune avec sa source : aucune valeur chiffrée n'est figée dans le schéma. */
  salaryNote: text("salary_note"),
  durationNote: text("duration_note"),
  renewable: boolean("renewable"),
  familyAllowed: boolean("family_allowed"),
  residencePathNote: text("residence_path_note"),
  feesNote: text("fees_note"),
  processingNote: text("processing_note"),
  status: mysqlEnum("status", ["draft", "needs_review", "published", "retired"]).notNull().default("needs_review"),
  checkedAt: timestamp("checked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_country_visa_programs_country").on(table.countryCode, table.pathway, table.status),
]);

export const countrySources = mysqlTable("country_sources", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  pathway: mysqlEnum("pathway", ["work", "study", "visit"]).notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  url: varchar("url", { length: 600 }).notNull(),
  authority: mysqlEnum("authority", ["immigration", "embassy", "ministry", "education", "employment", "other"]).notNull().default("other"),
  status: mysqlEnum("status", ["verified", "needs_review", "missing"]).notNull().default("needs_review"),
  note: varchar("note", { length: 300 }),
  checkedAt: timestamp("checked_at"),
  checkedByAdminId: int("checked_by_admin_id"),
  checkedByLabel: varchar("checked_by_label", { length: 160 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_country_sources_country").on(table.countryCode, table.pathway),
]);

/** « Comment faire » étape par étape pour un dispositif : qui fait quoi, pièces, délai et frais indicatifs, lien officiel. */
export const procedureSteps = mysqlTable("procedure_steps", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("program_id").notNull(),
  stepNo: int("step_no").notNull(),
  actor: mysqlEnum("actor", ["employer", "candidate", "authority", "agency", "institution"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  documentsJson: json("documents_json").$type<string[]>(),
  delayNote: varchar("delay_note", { length: 300 }),
  feeNote: varchar("fee_note", { length: 300 }),
  officialUrl: varchar("official_url", { length: 600 }),
  status: mysqlEnum("status", ["draft", "needs_review", "published", "retired"]).notNull().default("needs_review"),
  checkedAt: timestamp("checked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_procedure_steps_program").on(table.programId, table.stepNo),
]);
