import { index, int, mediumtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Programme de partenariat « agence de voyage / particulier » (migration 0098). Uniquement de nouvelles tables :
 * aucune table existante n'est modifiée. Le lien avec le suivi des parrainages se fait par `ambassadors.id`.
 */

/** Candidature, protocole d'accord émis, signatures et activation d'un partenaire. */
export const partnershipApplications = mysqlTable("partnership_applications", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["travel_agency", "individual"]).notNull(),
  status: mysqlEnum("status", ["submitted", "in_review", "protocol_issued", "partner_signed", "active", "rejected", "suspended"]).notNull().default("submitted"),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 100 }).notNull(),
  city: varchar("city", { length: 120 }),
  companyName: varchar("company_name", { length: 255 }),
  representativeRole: varchar("representative_role", { length: 160 }),
  legalRegistration: varchar("legal_registration", { length: 120 }),
  taxId: varchar("tax_id", { length: 80 }),
  licenceNumber: varchar("licence_number", { length: 120 }),
  website: varchar("website", { length: 255 }),
  yearsActive: int("years_active"),
  channels: varchar("channels", { length: 255 }),
  volumeBand: varchar("volume_band", { length: 10 }),
  message: text("message"),
  consentPrivacyAt: timestamp("consent_privacy_at").notNull(),
  codeOfConductAt: timestamp("code_of_conduct_at").notNull(),
  sourceIp: varchar("source_ip", { length: 64 }),
  adminNote: text("admin_note"),
  rejectionReason: varchar("rejection_reason", { length: 500 }),
  // Conditions fixées par l'administration à l'émission du protocole.
  commissionRateBps: int("commission_rate_bps"),
  termMonths: int("term_months"),
  attributionMonths: int("attribution_months"),
  paymentDelayDays: int("payment_delay_days"),
  territory: varchar("territory", { length: 200 }),
  // Texte figé du protocole émis : ce que le partenaire signe est exactement ce que 3M a émis.
  protocolVersion: varchar("protocol_version", { length: 40 }),
  protocolText: mediumtext("protocol_text"),
  protocolFingerprint: varchar("protocol_fingerprint", { length: 64 }),
  protocolIssuedAt: timestamp("protocol_issued_at"),
  protocolIssuedBy: varchar("protocol_issued_by", { length: 320 }),
  signTokenHash: varchar("sign_token_hash", { length: 128 }),
  signTokenExpiresAt: timestamp("sign_token_expires_at"),
  partnerSignedAt: timestamp("partner_signed_at"),
  partnerSignatureName: varchar("partner_signature_name", { length: 255 }),
  partnerSignatureIp: varchar("partner_signature_ip", { length: 64 }),
  partnerSignatureKey: varchar("partner_signature_key", { length: 512 }),
  partnerSignedPdfKey: varchar("partner_signed_pdf_key", { length: 512 }),
  countersignedAt: timestamp("countersigned_at"),
  countersignedBy: varchar("countersigned_by", { length: 320 }),
  finalPdfKey: varchar("final_pdf_key", { length: 512 }),
  // Activation : lien avec le suivi des parrainages.
  ambassadorId: int("ambassador_id"),
  referralCode: varchar("referral_code", { length: 16 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_partnership_email_kind").on(table.email, table.kind),
  index("idx_partnership_status").on(table.status, table.createdAt),
]);

/** Historique horodaté de chaque dossier (visible de l'administration uniquement). */
export const partnershipEvents = mysqlTable("partnership_events", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("application_id").notNull(),
  kind: varchar("kind", { length: 40 }).notNull(),
  summary: varchar("summary", { length: 500 }).notNull(),
  actor: varchar("actor", { length: 320 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("idx_partnership_events_application").on(table.applicationId, table.createdAt)]);

export type PartnershipApplicationRow = typeof partnershipApplications.$inferSelect;
