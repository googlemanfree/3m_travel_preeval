import { index, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Contrôle à la réception des documents (lisibilité, pages, empreinte, doublon), date de validité et vérification par l'agence.
 * Table additive : ne modifie ni `client_documents` ni `evaluations`. `source` = « evaluation_cv » (CV de l'évaluation, refId = id de l'évaluation)
 * ou « client_document » (refId = id dans `client_documents`).
 */
export const documentIntake = mysqlTable("document_intake", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 20 }).notNull(),
  refId: int("refId").notNull(),
  evaluationId: int("evaluationId").notNull(),
  documentType: varchar("documentType", { length: 40 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  pages: int("pages"),
  textChars: int("textChars").default(0).notNull(),
  kind: varchar("kind", { length: 16 }).notNull(),
  status: varchar("status", { length: 16 }).notNull(),
  issuesJson: text("issuesJson"),
  expiresOn: varchar("expiresOn", { length: 10 }),
  verification: varchar("verification", { length: 16 }).default("non_verifie").notNull(),
  verificationNote: text("verificationNote"),
  verifiedBy: varchar("verifiedBy", { length: 320 }),
  verifiedAt: timestamp("verifiedAt"),
  duplicateOf: int("duplicateOf"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("idx_document_intake_evaluation").on(table.evaluationId, table.id),
  index("idx_document_intake_sha").on(table.sha256),
  index("idx_document_intake_ref").on(table.source, table.refId),
]);
