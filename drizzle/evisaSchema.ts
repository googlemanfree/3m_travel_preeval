import { pgTable, text, timestamp, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { mysqlTable, varchar, timestamp as mysqlTimestamp, int, text as mysqlText } from "drizzle-orm/mysql-core";

// Table des demandes spécifiques e-Visa ciblées par pays
export const evisaRequests = mysqlTable("evisa_requests", {
  id: int("id").primaryKey().autoincrement(),
  reference: varchar("reference", { length: 64 }).notNull().unique(),
  candidateId: int("candidate_id"),
  candidateEmail: varchar("candidate_email", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  countryCode: varchar("country_code", { length: 32 }).notNull(), // ex: "dubai", "turquie", "vietnam"
  countryName: varchar("country_name", { length: 128 }).notNull(), // ex: "Dubaï / Émirats Arabes Unis"
  formDataJson: mysqlText("form_data_json").notNull(), // Stocke les données spécifiques au formulaire du pays
  documentsJson: mysqlText("documents_json"), // Liste des chemins de documents téléversés pour cet e-Visa
  aiAssessmentJson: mysqlText("ai_assessment_json"), // Analyse IA d'éligibilité et conseils
  status: varchar("status", { length: 64 }).notNull().default("new"), // new, processing, approved, rejected
  adminNotes: mysqlText("admin_notes"),
  createdAt: mysqlTimestamp("created_at").notNull().defaultNow(),
  updatedAt: mysqlTimestamp("updated_at").notNull().defaultNow(),
});
