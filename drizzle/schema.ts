import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Table des demandes de pré-évaluation soumises par les candidats.
 */
export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }),
  nationality: varchar("nationality", { length: 100 }),
  destinationCategory: mysqlEnum("destinationCategory", ["schengen", "canada", "autre"]).notNull(),
  destinationCountry: varchar("destinationCountry", { length: 100 }),
  visaType: mysqlEnum("visaType", [
    "schengen_etude",
    "schengen_tourisme",
    "schengen_travail",
    "canada_rp",
    "canada_etude",
    "canada_tourisme",
    "autre",
  ]).notNull(),
  educationLevel: varchar("educationLevel", { length: 100 }),
  employmentStatus: varchar("employmentStatus", { length: 100 }),
  message: text("message"),
  cvFileUrl: text("cvFileUrl"),
  cvFileName: varchar("cvFileName", { length: 255 }),
  status: mysqlEnum("status", ["pending", "reviewed", "contacted", "closed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = typeof evaluations.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// ESPACE CANDIDAT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Comptes candidats — authentification email + mot de passe (bcrypt).
 * Indépendant du système OAuth Manus pour permettre l'accès sans compte Manus.
 */
export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  // Identité
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  nationality: varchar("nationality", { length: 100 }),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }),
  // Auth
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  // Dossier d'immigration
  destination: mysqlEnum("destination", ["canada", "luxembourg", "pologne", "europe", "golfe", "autre"]).default("autre"),
  visaType: varchar("visaType", { length: 100 }),
  dossierStatus: mysqlEnum("dossierStatus", [
    "nouveau",
    "evaluation",
    "documents",
    "traitement",
    "soumis",
    "approuve",
    "refuse",
  ]).default("nouveau").notNull(),
  dossierNote: text("dossierNote"),         // Note interne du conseiller
  formulaChosen: varchar("formulaChosen", { length: 100 }), // integral / echelonne / garanti
  // Scoring
  scoreResult: varchar("scoreResult", { length: 50 }),
  scoreDetails: text("scoreDetails"),       // JSON des détails du scoring
  // Profil
  educationLevel: varchar("educationLevel", { length: 100 }),
  employmentStatus: varchar("employmentStatus", { length: 100 }),
  languageLevel: varchar("languageLevel", { length: 100 }),
  // Vérification email (OTP à 6 chiffres)
  emailVerified: boolean("emailVerified").default(false).notNull(),
  verificationToken: varchar("verificationToken", { length: 128 }),
  emailOtp: varchar("emailOtp", { length: 10 }),
  emailOtpExpiresAt: timestamp("emailOtpExpiresAt"),
  // Réinitialisation de mot de passe
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetExpiresAt: timestamp("passwordResetExpiresAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

/**
 * Documents uploadés par le candidat (CV, passeport, diplômes, etc.)
 */
export const candidateFiles = mysqlTable("candidate_files", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  fileType: mysqlEnum("fileType", [
    "cv",
    "passeport",
    "diplome",
    "releve_notes",
    "photo",
    "justificatif_domicile",
    "extrait_naissance",
    "casier_judiciaire",
    "autre",
  ]).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),       // URL S3
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileSizeBytes: int("fileSizeBytes"),
  mimeType: varchar("mimeType", { length: 100 }),
  status: mysqlEnum("status", ["uploaded", "verified", "rejected"]).default("uploaded").notNull(),
  rejectionReason: text("rejectionReason"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type CandidateFile = typeof candidateFiles.$inferSelect;
export type InsertCandidateFile = typeof candidateFiles.$inferInsert;

/**
 * Messagerie interne candidat ↔ conseiller 3M
 */
export const candidateMessages = mysqlTable("candidate_messages", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  senderRole: mysqlEnum("senderRole", ["candidate", "advisor"]).notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CandidateMessage = typeof candidateMessages.$inferSelect;
export type InsertCandidateMessage = typeof candidateMessages.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// DOSSIERS D'IMMIGRATION (APPLICATIONS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dossiers d'immigration ouverts par les candidats avec paiement intégré.
 * Chaque dossier correspond à une demande de 65 000 FCFA via CinetPay.
 */
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  // Numéro de dossier lisible : 3M-YYYY-NNNN
  dossierNumber: varchar("dossierNumber", { length: 20 }).notNull().unique(),
  // Candidat (peut être un candidat inscrit ou un visiteur)
  candidateId: int("candidateId"),             // null si soumis sans compte
  // Informations personnelles
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  whatsappNumber: varchar("whatsappNumber", { length: 50 }).notNull(),
  age: int("age"),
  nationality: varchar("nationality", { length: 100 }),
  // Profil académique
  academicLevel: varchar("academicLevel", { length: 100 }),
  experienceYears: int("experienceYears"),
  languageSkills: varchar("languageSkills", { length: 255 }),
  jobSector: varchar("jobSector", { length: 100 }),
  // Destination & formule
  destination: mysqlEnum("destination", ["canada", "luxembourg", "pologne", "europe", "golfe", "oceanie", "caucase", "autre"]).notNull(),
  formulaChosen: mysqlEnum("formulaChosen", ["integral", "echelonne", "garanti"]).default("integral").notNull(),
  // Documents (URLs S3 — JSON array {type, url, key, name})
  documentsUrls: text("documentsUrls"),
  // URLs individuelles des documents principaux
  passportUrl: text("passportUrl"),
  cvUrl: text("cvUrl"),
  diplomaUrl: text("diplomaUrl"),
  // ─── État civil complet ───
  dateOfBirth: varchar("dateOfBirth", { length: 20 }),
  placeOfBirth: varchar("placeOfBirth", { length: 150 }),
  gender: mysqlEnum("gender", ["homme", "femme", "autre"]),
  maritalStatus: mysqlEnum("maritalStatus", ["celibataire", "marie", "divorce", "veuf", "union_libre"]),
  currentAddress: text("currentAddress"),
  currentCity: varchar("currentCity", { length: 100 }),
  currentCountry: varchar("currentCountry", { length: 100 }),
  // ─── Études & Diplômes ───
  diplomaTitle: varchar("diplomaTitle", { length: 255 }),
  diplomaInstitution: varchar("diplomaInstitution", { length: 255 }),
  diplomaYear: int("diplomaYear"),
  fieldOfStudy: varchar("fieldOfStudy", { length: 150 }),
  additionalDiplomas: text("additionalDiplomas"),  // JSON array
  // ─── Situation professionnelle ───
  currentEmployer: varchar("currentEmployer", { length: 255 }),
  currentJobTitle: varchar("currentJobTitle", { length: 150 }),
  monthlyIncome: int("monthlyIncome"),
  incomeCurrency: varchar("incomeCurrency", { length: 10 }).default("XAF"),
  // ─── Ressources financières ───
  bankBalance: int("bankBalance"),
  bankBalanceCurrency: varchar("bankBalanceCurrency", { length: 10 }).default("XAF"),
  hasSponsorship: boolean("hasSponsorship").default(false),
  sponsorName: varchar("sponsorName", { length: 255 }),
  sponsorRelation: varchar("sponsorRelation", { length: 100 }),
  // ─── Situation familiale (regroupement familial) ───
  numberOfChildren: int("numberOfChildren").default(0),
  spouseFullName: varchar("spouseFullName", { length: 255 }),
  spouseNationality: varchar("spouseNationality", { length: 100 }),
  familyMemberInDestination: boolean("familyMemberInDestination").default(false),
  familyMemberRelation: varchar("familyMemberRelation", { length: 100 }),
  familyMemberStatus: varchar("familyMemberStatus", { length: 100 }),  // citoyen / résident / étudiant
  // ─── Type de visa choisi ───
  visaType: varchar("visaType", { length: 50 }),  // etude / travail / tourisme / residence / famille / affaires
  // ─── Scoring automatique sur 100 points ───
  scoringTotal: int("scoringTotal"),
  scoringDetails: text("scoringDetails"),  // JSON {education, experience, language, sector, age}
  scoringBadge: mysqlEnum("scoringBadge", ["eligible", "admissible", "faible"]),
  // Paiement CinetPay
  paymentStatus: mysqlEnum("paymentStatus", ["PENDING", "SUCCESS", "FAILED", "CANCELLED"]).default("PENDING").notNull(),
  paymentTransactionId: varchar("paymentTransactionId", { length: 255 }),
  paymentAmount: int("paymentAmount").default(65000).notNull(),
  paymentCurrency: varchar("paymentCurrency", { length: 10 }).default("XAF").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),   // MTN / ORANGE / CARD
  paymentDate: timestamp("paymentDate"),
  // Statut du dossier
  dossierStatus: mysqlEnum("dossierStatus", [
    "nouveau",
    "paye",
    "en_cours",
    "documents_requis",
    "soumis",
    "approuve",
    "refuse",
  ]).default("nouveau").notNull(),
  adminNote: text("adminNote"),
  // Vérification email avant paiement (OTP à 6 chiffres)
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailOtp: varchar("emailOtp", { length: 10 }),
  emailOtpExpiresAt: timestamp("emailOtpExpiresAt"),
  // ─── Protocole d'Accord — Signature électronique ───
  agreementSigned: boolean("agreementSigned").default(false).notNull(),
  agreementSignedAt: int("agreementSignedAt"),  // Unix timestamp en secondes
  agreementSignatureName: varchar("agreementSignatureName", { length: 255 }),
  agreementIpAddress: varchar("agreementIpAddress", { length: 64 }),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// RÉSERVATIONS DE VOLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Réservations de vols — tunnel de réservation complet
 */
export const flightBookings = mysqlTable("flightBookings", {
  id: int("id").autoincrement().primaryKey(),
  // Référence unique de réservation (ex: 3MF-2026-XXXX)
  bookingRef: varchar("bookingRef", { length: 20 }).notNull().unique(),
  // Informations du vol sélectionné (JSON sérialisé)
  flightData: text("flightData").notNull(), // JSON: {airline, flightNumber, from, to, departure, arrival, duration, stops, class, price}
  // Passagers (JSON sérialisé)
  passengersData: text("passengersData").notNull(), // JSON: [{type, firstName, lastName, dob, nationality, passportNumber, email, phone}]
  // Nombre de passagers par type
  adultsCount: int("adultsCount").default(1).notNull(),
  childrenCount: int("childrenCount").default(0).notNull(),
  infantsCount: int("infantsCount").default(0).notNull(),
  // Prix total
  totalPrice: int("totalPrice").notNull(), // en FCFA
  currency: varchar("currency", { length: 10 }).default("XAF").notNull(),
  // Contact principal
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 50 }).notNull(),
  // Statut de la réservation
  bookingStatus: mysqlEnum("bookingStatus", [
    "pending",      // En attente de confirmation
    "confirmed",    // Confirmée par l'agence
    "paid",         // Paiement reçu
    "ticketed",     // Billet émis
    "cancelled",    // Annulée
  ]).default("pending").notNull(),
  // Note admin
  adminNote: text("adminNote"),
  // Utilisateur connecté (optionnel)
  userId: int("userId"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FlightBooking = typeof flightBookings.$inferSelect;
export type InsertFlightBooking = typeof flightBookings.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// SUIVI DÉTAILLÉ DU DOSSIER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Étapes détaillées de l'avancement du dossier (WES, TCF, IELTS, etc.)
 * Chaque ligne = une étape du processus d'immigration
 */
export const dossierSteps = mysqlTable("dossierSteps", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  // Identification de l'étape
  stepKey: varchar("stepKey", { length: 100 }).notNull(), // ex: "wes_evaluation", "tcf_test", "expression_interet", etc.
  stepLabel: varchar("stepLabel", { length: 255 }).notNull(), // Libellé affiché
  stepCategory: mysqlEnum("stepCategory", [
    "evaluation",    // Évaluation initiale
    "documents",     // Documents à fournir
    "tests",         // Tests de langue (TCF, IELTS, TEF)
    "equivalence",   // Équivalence diplômes (WES, CES)
    "candidature",   // Expression d'intérêt / candidature
    "immigration",   // Procédure immigration officielle
    "visa",          // Visa / permis
    "arrivee",       // Arrivée et installation
  ]).default("documents").notNull(),
  // Statut de l'étape
  status: mysqlEnum("status", [
    "pending",       // En attente
    "in_progress",   // En cours
    "completed",     // Terminé
    "blocked",       // Bloqué / problème
    "not_required",  // Non requis pour ce profil
  ]).default("pending").notNull(),
  // Détails
  description: text("description"),          // Note explicative
  dueDate: timestamp("dueDate"),             // Date limite
  completedAt: timestamp("completedAt"),     // Date de complétion
  documentUrl: text("documentUrl"),          // Lien vers le document associé
  documentName: varchar("documentName", { length: 255 }),
  // Ordre d'affichage
  sortOrder: int("sortOrder").default(0).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DossierStep = typeof dossierSteps.$inferSelect;
export type InsertDossierStep = typeof dossierSteps.$inferInsert;

/**
 * Paiements partiels du candidat (versements échelonnés)
 */
export const dossierPayments = mysqlTable("dossierPayments", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  // Montant
  amount: int("amount").notNull(),           // en FCFA
  currency: varchar("currency", { length: 10 }).default("XAF").notNull(),
  // Méthode de paiement
  paymentMethod: mysqlEnum("paymentMethod", [
    "mtn_momo",
    "orange_money",
    "virement",
    "especes",
    "carte",
    "autre",
  ]).default("autre").notNull(),
  // Référence de transaction
  transactionRef: varchar("transactionRef", { length: 255 }),
  // Statut
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "rejected",
  ]).default("pending").notNull(),
  // Libellé / motif
  label: varchar("label", { length: 255 }),  // ex: "Acompte 1/3", "Solde final"
  note: text("note"),                         // Note admin
  // Date du paiement
  paidAt: timestamp("paidAt"),
  confirmedAt: timestamp("confirmedAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DossierPayment = typeof dossierPayments.$inferSelect;
export type InsertDossierPayment = typeof dossierPayments.$inferInsert;

/**
 * Documents officiels remis au candidat par 3M Travel
 * (lettres, attestations, billets, permis, etc.)
 */
export const dossierDeliveredDocs = mysqlTable("dossierDeliveredDocs", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  // Type de document remis
  docType: mysqlEnum("docType", [
    "lettre_invitation",
    "attestation_inscription",
    "permis_etudes",
    "permis_travail",
    "visa",
    "billet_avion",
    "assurance_voyage",
    "rapport_evaluation",
    "autre",
  ]).default("autre").notNull(),
  docLabel: varchar("docLabel", { length: 255 }).notNull(),
  // Fichier
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 512 }),
  fileName: varchar("fileName", { length: 255 }),
  // Date de remise
  deliveredAt: timestamp("deliveredAt").defaultNow().notNull(),
  // Note
  note: text("note"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DossierDeliveredDoc = typeof dossierDeliveredDocs.$inferSelect;
export type InsertDossierDeliveredDoc = typeof dossierDeliveredDocs.$inferInsert;
