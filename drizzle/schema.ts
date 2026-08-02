import { boolean, decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "translator"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOUVEAU SYSTÈME D'INSCRIPTION INDÉPENDANT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Table complètement séparée pour les inscriptions utilisateurs.
 * Formulaire simplifié : nom, email, mot de passe, confirmation.
 * Système indépendant du code existant pour éviter les conflits SQL.
 */
export const userAccounts = mysqlTable("user_accounts", {
  id: int("id").primaryKey().autoincrement(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  
  // Vérification d'email
  emailVerified: boolean("emailVerified").default(false).notNull(),
  verificationToken: varchar("verificationToken", { length: 128 }),
  verificationExpiresAt: timestamp("verificationExpiresAt"),
  
  // Réinitialisation de mot de passe
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetExpiresAt: timestamp("passwordResetExpiresAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

export type UserAccount = typeof userAccounts.$inferSelect;
export type InsertUserAccount = typeof userAccounts.$inferInsert;

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
  id: int("id").primaryKey().autoincrement(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  verificationToken: varchar("verificationToken", { length: 128 }),
  verificationExpiresAt: timestamp("verificationExpiresAt"),
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetExpiresAt: timestamp("passwordResetExpiresAt"),
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
  // Statut du dossier — Processus visa travail
  dossierStatus: mysqlEnum("dossierStatus", [
    "nouveau",
    "en_evaluation",
    "bilan_envoye",
    "en_attente_paiement",
    "paye",
    "en_attente_documents",
    "documents_recus",
    "soumis_agences",
    "en_cours_recrutement",
    "contrat_obtenu",
    "visa_approuve",
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
  // Processus d'evaluation 48h
  evaluationStartedAt: timestamp("evaluationStartedAt"),
  evaluationCompletedAt: timestamp("evaluationCompletedAt"),
  evaluationReportUrl: text("evaluationReportUrl"),
  evaluationScore: int("evaluationScore"),
  evaluationBadge: varchar("evaluationBadge", { length: 50 }),
  
  // Gestion des documents (originaux vs scan pro)
  documentsSubmissionMethod: mysqlEnum("documentsSubmissionMethod", ["en_ligne", "agence_physique"]),
  documentsReceivedAt: timestamp("documentsReceivedAt"),
  documentsVerifiedAt: timestamp("documentsVerifiedAt"),
  documentsVerifiedBy: varchar("documentsVerifiedBy", { length: 255 }),
  
  // Soumission aux agences de recrutement
  submittedToAgenciesAt: timestamp("submittedToAgenciesAt"),
  submittedToAgenciesBy: varchar("submittedToAgenciesBy", { length: 255 }),
  recruitmentPartnerName: varchar("recruitmentPartnerName", { length: 255 }),
  recruitmentPartnerReference: varchar("recruitmentPartnerReference", { length: 100 }),
  
  // Suivi administratif
  adminAssignedTo: varchar("adminAssignedTo", { length: 255 }),
  lastStatusUpdateAt: timestamp("lastStatusUpdateAt"),
  lastStatusUpdatedBy: varchar("lastStatusUpdatedBy", { length: 255 }),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// FORMULAIRE D'ÉVALUATION DE PROFIL PREMIUM (MULTI-ÉTAPES)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Évaluations de profil complètes — formulaire multi-étapes pour toutes destinations
 */
export const profileEvaluations = mysqlTable("profile_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  
  // ─── Choix principal ───
  destination: varchar("destination", { length: 100 }).notNull(),  // Canada, France, Allemagne, etc.
  projectType: mysqlEnum("projectType", [
    "student",
    "visitor",
    "worker",
    "permanent_residence",
    "family_reunification",
    "other"
  ]).notNull(),
  currentCountry: varchar("currentCountry", { length: 100 }),
  communicationLanguage: mysqlEnum("communicationLanguage", ["fr", "en"]).default("fr"),
  
  // ─── Informations personnelles ───
  fullName: varchar("fullName", { length: 255 }).notNull(),
  gender: mysqlEnum("gender", ["homme", "femme", "autre"]),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }),
  placeOfBirth: varchar("placeOfBirth", { length: 150 }),
  nationality: varchar("nationality", { length: 100 }),
  currentAddress: text("currentAddress"),
  whatsappPhone: varchar("whatsappPhone", { length: 50 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  
  // ─── Passeport et identité ───
  passportNumber: varchar("passportNumber", { length: 50 }),
  passportCountry: varchar("passportCountry", { length: 100 }),
  passportIssueDate: varchar("passportIssueDate", { length: 20 }),
  passportExpiryDate: varchar("passportExpiryDate", { length: 20 }),
  passportCopyAvailable: boolean("passportCopyAvailable").default(false),
  
  // ─── Éducation ───
  educationLevel: varchar("educationLevel", { length: 100 }),
  diplomaTitle: varchar("diplomaTitle", { length: 255 }),
  diplomaInstitution: varchar("diplomaInstitution", { length: 255 }),
  diplomaYear: int("diplomaYear"),
  fieldOfStudy: varchar("fieldOfStudy", { length: 150 }),
  additionalDiplomas: text("additionalDiplomas"),  // JSON array
  
  // ─── Expérience professionnelle ───
  employmentStatus: varchar("employmentStatus", { length: 100 }),
  currentEmployer: varchar("currentEmployer", { length: 255 }),
  currentJobTitle: varchar("currentJobTitle", { length: 150 }),
  yearsOfExperience: int("yearsOfExperience"),
  jobSector: varchar("jobSector", { length: 100 }),
  monthlyIncome: int("monthlyIncome"),
  incomeCurrency: varchar("incomeCurrency", { length: 10 }).default("XAF"),
  
  // ─── Compétences linguistiques ───
  languageSkills: varchar("languageSkills", { length: 255 }),
  englishLevel: varchar("englishLevel", { length: 50 }),
  frenchLevel: varchar("frenchLevel", { length: 50 }),
  otherLanguages: varchar("otherLanguages", { length: 255 }),
  
  // ─── Ressources financières ───
  bankBalance: int("bankBalance"),
  bankBalanceCurrency: varchar("bankBalanceCurrency", { length: 10 }).default("XAF"),
  hasSponsorship: boolean("hasSponsorship").default(false),
  sponsorName: varchar("sponsorName", { length: 255 }),
  sponsorRelation: varchar("sponsorRelation", { length: 100 }),
  
  // ─── Situation familiale ───
  maritalStatus: mysqlEnum("maritalStatus", ["celibataire", "marie", "divorce", "veuf", "union_libre"]),
  numberOfChildren: int("numberOfChildren").default(0),
  spouseFullName: varchar("spouseFullName", { length: 255 }),
  spouseNationality: varchar("spouseNationality", { length: 100 }),
  familyMemberInDestination: boolean("familyMemberInDestination").default(false),
  familyMemberRelation: varchar("familyMemberRelation", { length: 100 }),
  
  // ─── Détails du projet ───
  projectDescription: text("projectDescription"),
  studyProgram: varchar("studyProgram", { length: 255 }),
  workJobOffer: varchar("workJobOffer", { length: 255 }),
  
  // ─── Scoring automatique ───
  scoringTotal: int("scoringTotal"),
  scoringDetails: text("scoringDetails"),  // JSON {education, experience, language, sector, age}
  scoringBadge: mysqlEnum("scoringBadge", ["eligible", "admissible", "faible"]),
  
  // ─── Documents uploadés ───
  passportCopyUrl: text("passportCopyUrl"),
  cvUrl: text("cvUrl"),
  diplomaCopyUrl: text("diplomaCopyUrl"),
  
  // ─── État ───
  status: mysqlEnum("status", ["draft", "submitted", "reviewed", "completed"]).default("draft").notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProfileEvaluation = typeof profileEvaluations.$inferSelect;
export type InsertProfileEvaluation = typeof profileEvaluations.$inferInsert;
