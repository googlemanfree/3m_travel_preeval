import { boolean, date, decimal, index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
export * from "./caseTrackingSchema";
export * from "./evisaCatalogueSchema";
export * from "./routeHealthSchema";
export * from "./richTextSchema";

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
  // Candidat connecté (si applicable — permet de compter ses évaluations)
  candidateId: int("candidateId"),
  // Attribution de campagne : conservée pour relier Facebook/WhatsApp au dossier
  acquisitionSource: mysqlEnum("acquisitionSource", ["facebook", "whatsapp", "direct", "other"]).default("direct").notNull(),
  acquisitionCampaign: varchar("acquisitionCampaign", { length: 160 }),
  // État civil
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }),
  nationality: varchar("nationality", { length: 100 }),
  cityOfResidence: varchar("cityOfResidence", { length: 150 }),
  maritalStatus: varchar("maritalStatus", { length: 50 }),
  numberOfDependents: int("numberOfDependents"),
  // Études
  educationLevel: varchar("educationLevel", { length: 100 }),
  diplomaTitle: varchar("diplomaTitle", { length: 255 }),
  graduationYear: varchar("graduationYear", { length: 10 }),
  fieldOfStudy: varchar("fieldOfStudy", { length: 255 }),
  // Expérience professionnelle
  employmentStatus: varchar("employmentStatus", { length: 100 }),
  currentJobTitle: varchar("currentJobTitle", { length: 255 }),
  yearsOfExperience: varchar("yearsOfExperience", { length: 20 }),
  industrySector: varchar("industrySector", { length: 150 }),
  mainTasks: text("mainTasks"),
  // Compétences linguistiques
  frenchLevel: varchar("frenchLevel", { length: 50 }),
  englishLevel: varchar("englishLevel", { length: 50 }),
  languageTestsTaken: varchar("languageTestsTaken", { length: 255 }),
  // Projet & destination
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
  travelReason: varchar("travelReason", { length: 255 }),
  availableBudget: varchar("availableBudget", { length: 100 }),
  // Parcours d’évaluation contextualisé
  projectType: varchar("projectType", { length: 50 }),
  projectDetailsJson: text("projectDetailsJson"),
  // Historique & antécédents
  priorVisaRefusal: boolean("priorVisaRefusal").default(false),
  priorVisaRefusalCountry: varchar("priorVisaRefusalCountry", { length: 150 }),
  criminalRecord: boolean("criminalRecord").default(false),
  familyAbroad: boolean("familyAbroad").default(false),
  message: text("message"),
  cvFileUrl: text("cvFileUrl"),
  cvFileName: varchar("cvFileName", { length: 255 }),
  status: mysqlEnum("status", ["pending", "reviewed", "contacted", "closed"]).default("pending").notNull(),
  aiReportContent: text("aiReportContent"),
  aiProcessedAt: timestamp("aiProcessedAt"),
  aiProcessingError: text("aiProcessingError"),
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
  acquisitionSource: mysqlEnum("acquisitionSource", ["facebook", "whatsapp", "direct", "other"]).default("direct").notNull(),
  acquisitionCampaign: varchar("acquisitionCampaign", { length: 160 }),
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
  // Profil & Avatar
  educationLevel: varchar("educationLevel", { length: 100 }),
  employmentStatus: varchar("employmentStatus", { length: 100 }),
  languageLevel: varchar("languageLevel", { length: 100 }),
  preferredLanguage: mysqlEnum("preferredLanguage", ["fr", "en"]),
  avatarUrl: text("avatarUrl"),
  // Contrôle anti-robot : présence d’un portrait validé avant l’accès complet
  avatarVerificationStatus: mysqlEnum("avatarVerificationStatus", ["missing", "pending", "verified", "rejected"]).default("missing").notNull(),
  avatarVerificationMethod: mysqlEnum("avatarVerificationMethod", ["camera", "gallery"]).default("gallery"),
  avatarVerificationReason: varchar("avatarVerificationReason", { length: 255 }),
  avatarFaceCount: int("avatarFaceCount").default(0).notNull(),
  avatarVerifiedAt: timestamp("avatarVerifiedAt"),
  // Vérification email (lien de confirmation)
  emailVerified: boolean("emailVerified").default(false).notNull(),
  verificationToken: varchar("verificationToken", { length: 128 }),
  verificationExpiresAt: timestamp("verificationExpiresAt"),
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
    "justificatif_paiement",
    "autre",
  ]).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),       // URL S3
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileSizeBytes: int("fileSizeBytes"),
  mimeType: varchar("mimeType", { length: 100 }),
  status: mysqlEnum("status", ["uploaded", "verified", "rejected"]).default("uploaded").notNull(),
  rejectionReason: text("rejectionReason"),
  correctionComment: text("correctionComment"),
  replacesFileId: int("replacesFileId"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  extractedData: text("extractedData"), // Stocke un JSON structuré des informations clés extraites
});

export type CandidateFile = typeof candidateFiles.$inferSelect;
export type InsertCandidateFile = typeof candidateFiles.$inferInsert;

/**
 * Messagerie interne candidat ↔ conseiller 3M
 */
export const candidateMessages = mysqlTable("candidate_messages", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  notificationId: int("notificationId"),
  senderRole: mysqlEnum("senderRole", ["candidate", "advisor"]).notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentName: varchar("attachmentName", { length: 255 }),
  attachmentMimeType: varchar("attachmentMimeType", { length: 100 }),
  attachmentSizeBytes: int("attachmentSizeBytes"),
  evisaSnapshotJson: text("evisaSnapshotJson"),
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
  gdsReference: varchar("gdsReference", { length: 100 }),
  ticketNumber: varchar("ticketNumber", { length: 100 }),
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
  // Préparation et diffusion du bilan par l’administration
  evaluationScheduledAt: timestamp("evaluationScheduledAt"),
  evaluationDeliveryMessage: text("evaluationDeliveryMessage"),
  evaluationDeliverySubject: varchar("evaluationDeliverySubject", { length: 255 }),
  evaluationDeliveryStatus: mysqlEnum("evaluationDeliveryStatus", ["draft", "scheduled", "sent", "failed"]).default("draft").notNull(),
  evaluationRequiresSecondApproval: boolean("evaluationRequiresSecondApproval").default(false).notNull(),
  evaluationApprovalStatus: mysqlEnum("evaluationApprovalStatus", ["not_required", "pending", "approved", "rejected"]).default("not_required").notNull(),
  evaluationApprovedAt: timestamp("evaluationApprovedAt"),
  evaluationApprovedByAdminId: int("evaluationApprovedByAdminId"),
  evaluationReportPdfKey: varchar("evaluationReportPdfKey", { length: 512 }),
  evaluationReportPdfUrl: varchar("evaluationReportPdfUrl", { length: 512 }),
  evaluationReportViewedAt: timestamp("evaluationReportViewedAt"),
  evaluationReportReminderSentAt: timestamp("evaluationReportReminderSentAt"),
  
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

/** Historique horodaté des changements de statut des dossiers en ligne. */
export const applicationStatusHistory = mysqlTable("application_status_history", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  previousStatus: varchar("previousStatus", { length: 50 }).notNull(),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  changedBy: varchar("changedBy", { length: 320 }),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApplicationStatusHistory = typeof applicationStatusHistory.$inferSelect;


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


// ─────────────────────────────────────────────────────────────────────────────
// TABLES RESTAURÉES — nécessaires pour le panneau admin (connexion OTP,
// gestion des bilans, documents client, dossiers agence)
// ─────────────────────────────────────────────────────────────────────────────

export const aiReportHistory = mysqlTable("ai_report_history", {
  id: int("id").autoincrement().primaryKey(),
  
  // Référence au candidat/dossier
  applicationId: int("applicationId"),  // Référence à la table applications
  candidateId: int("candidateId"),      // Référence à la table candidates
  candidateName: varchar("candidateName", { length: 255 }).notNull(),
  candidateEmail: varchar("candidateEmail", { length: 320 }).notNull(),
  
  // Détails du rapport
  destination: varchar("destination", { length: 100 }).notNull(),
  reportId: varchar("reportId", { length: 100 }).notNull().unique(),  // Identifiant unique du rapport (ex: 3M-AI-TIMESTAMP)
  reportContent: text("reportContent"),  // Contenu du rapport (peut être long)
  
  // Statut d'envoi
  sendStatus: mysqlEnum("sendStatus", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
  sendAttempts: int("sendAttempts").default(0).notNull(),
  lastSendError: text("lastSendError"),  // Message d'erreur si l'envoi a échoué
  
  // Timestamps
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),  // Quand le rapport a été effectivement envoyé
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const adminAccounts = mysqlTable("admin_accounts", {
  id: int("id").autoincrement().primaryKey(),
  // Identifiants
  email: varchar("email", { length: 320 }).notNull().unique(),
  adminType: mysqlEnum("adminType", ["evaluation", "accompagnement", "procedures"]).notNull(),
  // Tous les comptes du back-office partagent le même rôle opérationnel.
  role: mysqlEnum("role", ["admin"]).default("admin").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),  // Mot de passe hashé (bcrypt) - optionnel si OTP
  // OTP
  otpCode: varchar("otpCode", { length: 6 }),  // Code OTP actuel
  otpExpiresAt: timestamp("otpExpiresAt"),  // Expiration du code OTP
  otpAttempts: int("otpAttempts").default(0).notNull(),  // Nombre de tentatives échouées
  // Session
  sessionToken: varchar("sessionToken", { length: 256 }),  // Token de session actuel
  sessionExpiresAt: timestamp("sessionExpiresAt"),  // Expiration de la session
  lastLoginAt: timestamp("lastLoginAt"),  // Dernière connexion
  lastActivityAt: timestamp("lastActivityAt"),  // Dernière activité (pour détecter l'inactivité)
  // Métadonnées
  fullName: varchar("fullName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  maxActiveCases: int("maxActiveCases").default(20).notNull(),
  // Changement de mot de passe obligatoire
  requiresPasswordChange: boolean("requiresPasswordChange").default(true).notNull(),  // Force le changement au 1er login
  passwordChangedAt: timestamp("passwordChangedAt"),  // Quand le mot de passe a été changé pour la dernière fois
  // Réinitialisation de mot de passe
  resetToken: varchar("resetToken", { length: 256 }),  // Token unique pour réinitialiser le mot de passe
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),  // Expiration du token de réinitialisation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Demandes de tourisme, hôtel, véhicule et packs, avec devis confirmé par l’agence. */
export const tourismServiceRequests = mysqlTable("tourism_service_requests", {
  id: int("id").autoincrement().primaryKey(), reference: varchar("reference", { length: 32 }).notNull().unique(),
  fullName: varchar("fullName", { length: 255 }).notNull(), email: varchar("email", { length: 320 }).notNull(), phone: varchar("phone", { length: 50 }).notNull(),
  destination: varchar("destination", { length: 160 }).notNull(), departureDate: date("departureDate"), returnDate: date("returnDate"), travelersCount: int("travelersCount").notNull().default(1),
  serviceTypesJson: text("serviceTypesJson").notNull(), packType: varchar("packType", { length: 80 }), hotelCategory: varchar("hotelCategory", { length: 80 }), vehicleCategory: varchar("vehicleCategory", { length: 80 }), pickupLocation: varchar("pickupLocation", { length: 255 }),
  budgetXaf: int("budgetXaf"), quotedPriceXaf: int("quotedPriceXaf"), notes: text("notes"), adminNotes: text("adminNotes"), enrichmentJson: text("enrichmentJson"),
  status: mysqlEnum("status", ["new", "contacted", "quote_sent", "confirmed", "completed", "cancelled"]).notNull().default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("idx_tourism_service_requests_status_created").on(table.status, table.createdAt)]);

/** Vues de filtres candidates enregistrées par un administrateur authentifié. */
export const adminSavedViews = mysqlTable("admin_saved_views", {
  id: int("id").autoincrement().primaryKey(),
  adminAccountId: int("adminAccountId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  stateJson: text("stateJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Demandes d’assurance voyage transmises par les voyageurs à l’administration. */
export const insuranceRequests = mysqlTable("insurance_requests", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 32 }).notNull().unique(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  dateOfBirth: date("dateOfBirth").notNull(),
  nationality: varchar("nationality", { length: 100 }).notNull(),
  passportNumber: varchar("passportNumber", { length: 64 }).notNull(),
  residenceCountry: varchar("residenceCountry", { length: 100 }).notNull(),
  destinationCountry: varchar("destinationCountry", { length: 100 }).notNull(),
  departureDate: date("departureDate").notNull(),
  returnDate: date("returnDate").notNull(),
  tripPurpose: varchar("tripPurpose", { length: 80 }).notNull(),
  coveragePlan: varchar("coveragePlan", { length: 80 }).notNull(),
  travelersCount: int("travelersCount").notNull(),
  travelersJson: text("travelersJson").notNull(),
  emergencyContactName: varchar("emergencyContactName", { length: 255 }).notNull(),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 50 }).notNull(),
  notes: text("notes"),
  attestationFileKey: varchar("attestationFileKey", { length: 512 }),
  attestationFileName: varchar("attestationFileName", { length: 255 }),
  consentAt: timestamp("consentAt").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "quote_sent", "completed", "cancelled"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Notifications internes du tableau de bord admin
 * Système par sondage (polling) pour les événements importants
 */
export const adminNotifications = mysqlTable("admin_notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["new_evaluation", "new_contact_message", "new_document", "payment_received"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedId: varchar("relatedId", { length: 100 }),
  // Cible : un type d'admin précis, ou tous si vide.
  targetAdminType: mysqlEnum("targetAdminType", ["evaluation", "accompagnement", "procedures"]),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

export const mediaLibrary = mysqlTable("media_library", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["hero", "procedure", "service", "flag", "testimonial", "other"]).default("procedure").notNull(),
  url: text("url").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }).default("image/webp").notNull(),
  uploadedByAdminEmail: varchar("uploadedByAdminEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MediaLibraryItem = typeof mediaLibrary.$inferSelect;
export type InsertMediaLibraryItem = typeof mediaLibrary.$inferInsert;

export const clientDocuments = mysqlTable("client_documents", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId").notNull(),
  candidateEmail: varchar("candidateEmail", { length: 320 }).notNull(),
  documentType: mysqlEnum("documentType", [
    "passport",
    "national_id",
    "driver_license",
    "cv",
    "diploma",
    "certificate",
    "cover_letter",
    "employment_contract",
    "birth_certificate",
    "marriage_certificate",
    "bank_statement",
    "employment_letter",
    "language_test",
    "medical_exam",
    "police_clearance",
    "proof_of_residence",
    "visa",
    "travel_document",
    "insurance_document",
    "medical_document",
    "educational_transcript",
    "other"
  ]).notNull(),
  documentName: varchar("documentName", { length: 255 }).notNull(),
  documentUrl: text("documentUrl"),  // URL du fichier stocké
  fileSize: int("fileSize"),  // Taille en bytes
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  // Traçabilité de la source
  source: mysqlEnum("source", ["online", "scanned_agency", "manual_admin"]).default("online").notNull(),  // Où le document provient
  uploadedByAdmin: varchar("uploadedByAdmin", { length: 320 }),  // Email de l'admin si scanned_agency ou manual_admin
  // Gestion admin
  receivedByAdmin: boolean("receivedByAdmin").default(false).notNull(),
  adminNotes: text("adminNotes"),
  receiptGeneratedAt: timestamp("receiptGeneratedAt"),  // Quand la décharge a été générée
  receiptUrl: text("receiptUrl"),  // URL de la décharge PDF
  receiptNumber: varchar("receiptNumber", { length: 50 }),  // Numéro de décharge unique
  // Classification par IA
  aiClassification: json("aiClassification"),  // Résultats de classification IA: {documentType, confidence, description, suggestedFolder, extractedInfo, warnings}
  aiClassificationConfidence: int("aiClassificationConfidence"),  // Score de confiance 0-100
  aiClassifiedAt: timestamp("aiClassifiedAt"),  // Quand la classification IA a été effectuée
  suggestedFolder: varchar("suggestedFolder", { length: 255 }),  // Dossier suggéré par l'IA
  extractedData: json("extractedData"),  // Données extraites: {documentNumber, issueDate, expiryDate, issuingCountry, holderName}
  status: mysqlEnum("status", ["pending", "received", "verified", "rejected"]).default("pending").notNull(),
  // Validation par l'admin
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  verificationComment: text("verificationComment"),  // Commentaire de l'admin
  verifiedByAdmin: varchar("verifiedByAdmin", { length: 320 }),  // Email de l'admin qui a validé
  verifiedAt: timestamp("verifiedAt"),  // Quand le document a été validé/rejeté
  replacesDocumentId: int("replacesDocumentId"),
  readabilityScore: int("readabilityScore"),  // Score de lisibilité 0-100
  readabilityIssues: json("readabilityIssues"),  // Problèmes de lisibilité détectés
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientDocument = typeof clientDocuments.$inferSelect;
export type InsertClientDocument = typeof clientDocuments.$inferInsert;

export const agencyDossiers = mysqlTable("agency_dossiers", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identité du candidat
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }),
  nationality: varchar("nationality", { length: 100 }),
  
  // Destination et visa
  destination: varchar("destination", { length: 100 }).notNull(),  // Canada, France, Allemagne, etc.
  visaType: varchar("visaType", { length: 100 }).notNull(),  // etude, travail, tourisme, residence, etc.
  
  // Statut du dossier
  status: mysqlEnum("status", [
    "nouveau",
    "en_cours",
    "documents_requis",
    "soumis",
    "approuve",
    "refuse"
  ]).default("nouveau").notNull(),
  
  // Gestion administrative
  createdByAdmin: varchar("createdByAdmin", { length: 320 }).notNull(),  // Email de l'admin qui a créé le dossier
  assignedToAdmin: varchar("assignedToAdmin", { length: 320 }),  // Email de l'admin assigné
  adminNotes: text("adminNotes"),  // Notes internes pour les admins
  
  // Informations supplémentaires
  educationLevel: varchar("educationLevel", { length: 100 }),
  employmentStatus: varchar("employmentStatus", { length: 100 }),
  monthlyIncome: int("monthlyIncome"),
  bankBalance: int("bankBalance"),
  
  // Documents
  cvFileUrl: text("cvFileUrl"),
  cvFileName: varchar("cvFileName", { length: 255 }),
  additionalDocuments: text("additionalDocuments"),  // JSON array of {name, url, uploadedAt}
  
  // Historique des modifications
  lastStatusChangeAt: timestamp("lastStatusChangeAt"),
  lastStatusChangeBy: varchar("lastStatusChangeBy", { length: 320 }),
  
  // Notifications
  welcomeEmailSent: boolean("welcomeEmailSent").default(false).notNull(),
  statusUpdateEmailSent: boolean("statusUpdateEmailSent").default(false).notNull(),
  
  // Métadonnées
  source: mysqlEnum("source", ["manual_admin", "online_form"]).default("manual_admin").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const bilans = mysqlTable("bilans", {
  id: int("id").autoincrement().primaryKey(),
  
  // Référence au dossier
  applicationId: int("applicationId").notNull(),
  dossierNumber: varchar("dossierNumber", { length: 20 }).notNull(),
  
  // Candidat
  candidateEmail: varchar("candidateEmail", { length: 320 }).notNull(),
  candidateName: varchar("candidateName", { length: 255 }).notNull(),
  
  // Bilan généré par IA
  score: int("score").notNull(),  // 0-100
  verdict: mysqlEnum("verdict", [
    "tres_favorable",
    "favorable_sous_reserve",
    "risque_non_admissible"
  ]).notNull(),
  strengths: text("strengths").notNull(),  // JSON array
  weaknesses: text("weaknesses").notNull(),  // JSON array
  recommendations: text("recommendations").notNull(),  // JSON array
  
  // Statut de validation
  status: mysqlEnum("status", [
    "draft",  // Généré par IA, en attente de validation
    "validated",  // Validé par l'admin
    "sent",  // Email envoyé au candidat
    "rejected"  // Rejeté par l'admin
  ]).default("draft").notNull(),
  
  // Validation admin
  validatedBy: varchar("validatedBy", { length: 255 }),  // Nom de l'admin
  validatedAt: timestamp("validatedAt"),
  adminNotes: text("adminNotes"),  // Notes de l'admin avant validation
  
  // Envoi email
  sentAt: timestamp("sentAt"),
  emailTemplate: varchar("emailTemplate", { length: 50 }).default("bilan_standard"),  // bilan_standard, bilan_favorable, etc.
  
  // Timestamps
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const clientPayments = mysqlTable("client_payments", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId").notNull(),
  candidateEmail: varchar("candidateEmail", { length: 320 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
  currency: varchar("currency", { length: 10 }).default("EUR").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", [
    "cash",
    "bank_transfer",
    "card",
    "mobile_money",
    "check",
    "other"
  ]).notNull(),
  paymentDescription: varchar("paymentDescription", { length: 255 }).notNull(),  // Ex: "Frais d'évaluation", "Frais de dossier"
  paidAt: timestamp("paidAt").defaultNow().notNull(),
  // Gestion admin
  confirmedByAdmin: boolean("confirmedByAdmin").default(false).notNull(),
  adminNotes: text("adminNotes"),
  invoiceGeneratedAt: timestamp("invoiceGeneratedAt"),  // Quand la facture a été générée
  invoiceUrl: text("invoiceUrl"),  // URL de la facture PDF
  invoiceNumber: varchar("invoiceNumber", { length: 50 }),  // Numéro de facture unique
  status: mysqlEnum("status", ["pending", "confirmed", "verified", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientPayment = typeof clientPayments.$inferSelect;
export type InsertClientPayment = typeof clientPayments.$inferInsert;

export const agencyDossierHistory = mysqlTable("agency_dossier_history", {
  id: int("id").autoincrement().primaryKey(),
  dossierId: int("dossierId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),  // created, status_changed, notes_added, document_added, etc.
  changedBy: varchar("changedBy", { length: 320 }).notNull(),  // Email de l'admin
  oldValue: text("oldValue"),  // Ancienne valeur (JSON)
  newValue: text("newValue"),  // Nouvelle valeur (JSON)
  details: text("details"),  // Détails supplémentaires
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Commentaires / questions des candidats sur leur bilan d'évaluation,
 * avec réponses en fil de discussion par les admins.
 */
export const evaluationComments = mysqlTable("evaluation_comments", {
  id: int("id").autoincrement().primaryKey(),
  dossierNumber: varchar("dossierNumber", { length: 100 }).notNull(),
  parentCommentId: int("parentCommentId"),
  authorType: mysqlEnum("authorType", ["candidate", "admin"]).notNull(),
  authorId: int("authorId"),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  authorEmail: varchar("authorEmail", { length: 320 }).notNull(),
  content: text("content").notNull(),
  isQuestion: boolean("isQuestion").default(true).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  isResolved: boolean("isResolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EvaluationComment = typeof evaluationComments.$inferSelect;
export type InsertEvaluationComment = typeof evaluationComments.$inferInsert;

/**
 * Transactions de paiement (toutes méthodes confondues) utilisées pour les
 * statistiques du tableau de bord admin.
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  dossierNumber: varchar("dossierNumber", { length: 100 }),
  candidateEmail: varchar("candidateEmail", { length: 320 }),
  candidateName: varchar("candidateName", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
  currency: varchar("currency", { length: 10 }).default("XAF").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  status: mysqlEnum("status", ["pending", "processing", "success", "failed", "cancelled"]).default("pending").notNull(),
  reference: varchar("reference", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  // Identité du visiteur (pas nécessairement un compte inscrit)
  visitorName: varchar("visitorName", { length: 255 }).notNull(),
  visitorEmail: varchar("visitorEmail", { length: 320 }).notNull(),
  visitorPhone: varchar("visitorPhone", { length: 50 }),
  // Conversation
  sessionId: varchar("sessionId", { length: 128 }).notNull(),  // Identifie la session de chat
  senderRole: mysqlEnum("senderRole", ["visitor", "support"]).notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  // Métadonnées
  subject: varchar("subject", { length: 255 }),  // Sujet initial du chat
  status: mysqlEnum("status", ["active", "closed", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const translationLanguages = mysqlTable("translation_languages", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),  // fr, en, de, es, etc.
  name: varchar("name", { length: 100 }).notNull(),  // Français, English, Deutsch, etc.
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const translationPricing = mysqlTable("translation_pricing", {
  id: int("id").autoincrement().primaryKey(),
  documentType: mysqlEnum("documentType", [
    "birth_certificate",
    "diploma",
    "transcript",
    "criminal_record",
    "marriage_certificate",
    "divorce_decree",
    "employment_letter",
    "bank_statement",
    "passport",
    "driver_license",
    "medical_report",
    "other"
  ]).notNull(),
  sourceLanguageCode: varchar("sourceLanguageCode", { length: 10 }).notNull(),
  targetLanguageCode: varchar("targetLanguageCode", { length: 10 }).notNull(),
  pricePerPage: decimal("pricePerPage", { precision: 10, scale: 2 }).notNull(),  // Prix par page
  currency: varchar("currency", { length: 10 }).default("EUR").notNull(),
  turnaroundDays: int("turnaroundDays").default(3).notNull(),  // Délai de traitement en jours
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const translationRequests = mysqlTable("translation_requests", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId"),  // Lié à une évaluation (optionnel)
  candidateEmail: varchar("candidateEmail", { length: 320 }).notNull(),
  candidateName: varchar("candidateName", { length: 255 }).notNull(),
  candidatePhone: varchar("candidatePhone", { length: 50 }),
  
  // Détails de la traduction
  documentType: mysqlEnum("documentType", [
    "birth_certificate",
    "diploma",
    "transcript",
    "criminal_record",
    "marriage_certificate",
    "divorce_decree",
    "employment_letter",
    "bank_statement",
    "passport",
    "driver_license",
    "medical_report",
    "other"
  ]).notNull(),
  sourceLanguageCode: varchar("sourceLanguageCode", { length: 10 }).notNull(),
  targetLanguageCode: varchar("targetLanguageCode", { length: 10 }).notNull(),
  numberOfPages: int("numberOfPages").notNull(),
  
  // Fichier source
  sourceDocumentUrl: text("sourceDocumentUrl").notNull(),
  sourceDocumentName: varchar("sourceDocumentName", { length: 255 }).notNull(),
  sourceDocumentSize: int("sourceDocumentSize"),
  
  // Tarification
  pricePerPage: decimal("pricePerPage", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("EUR").notNull(),
  
  // Paiement
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),  // mobile_money, card, cash
  paymentTransactionId: varchar("paymentTransactionId", { length: 255 }),
  paymentDate: timestamp("paymentDate"),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }),
  invoiceUrl: text("invoiceUrl"),
  
  // Traduction
  status: mysqlEnum("status", [
    "pending_payment",      // En attente de paiement
    "pending_translation",  // Paiement reçu, en attente de traduction
    "in_progress",          // Traduction en cours
    "completed",            // Traduction complétée
    "rejected"              // Demande rejetée
  ]).default("pending_payment").notNull(),
  
  assignedToTranslator: varchar("assignedToTranslator", { length: 320 }),  // Email du traducteur
  translatorNotes: text("translatorNotes"),
  
  // Fichier traduit
  translatedDocumentUrl: text("translatedDocumentUrl"),
  translatedDocumentName: varchar("translatedDocumentName", { length: 255 }),
  translatedDocumentSize: int("translatedDocumentSize"),
  completionDate: timestamp("completionDate"),
  
  // Notifications
  paymentNotificationSent: boolean("paymentNotificationSent").default(false).notNull(),
  completionNotificationSent: boolean("completionNotificationSent").default(false).notNull(),
  
  // Métadonnées
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const evaluationEmails = mysqlTable("evaluation_emails", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId").notNull(),
  candidateEmail: varchar("candidateEmail", { length: 320 }).notNull(),
  candidateName: varchar("candidateName", { length: 255 }).notNull(),
  destinationCountry: varchar("destinationCountry", { length: 100 }).notNull(),
  visaType: varchar("visaType", { length: 100 }).notNull(),
  // Email tracking
  emailType: mysqlEnum("emailType", ["admissibility_report", "reminder", "follow_up"]).default("admissibility_report").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),  // Quand l'email doit être envoyé (createdAt + 48h)
  sentAt: timestamp("sentAt"),  // Quand l'email a été effectivement envoyé
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
  failureReason: text("failureReason"),  // Raison de l'échec si applicable
  // Contenu
  reportContent: text("reportContent"),  // Contenu du rapport HTML
  secureLink: varchar("secureLink", { length: 500 }),  // Lien sécurisé vers l'espace client
  // Métadonnées
  sentVia: varchar("sentVia", { length: 50 }).default("email"),  // email, whatsapp, sms
  openedAt: timestamp("openedAt"),  // Quand l'email a été ouvert (tracking pixel)
  clickedAt: timestamp("clickedAt"),  // Quand le lien a été cliqué
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EvaluationEmail = typeof evaluationEmails.$inferSelect;
export type InsertEvaluationEmail = typeof evaluationEmails.$inferInsert;



/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SYSTÈME D'ÉVALUATION LUXEMBOURG
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Évaluation d'éligibilité pour le Luxembourg avec scoring automatique.
 * Grille de points fixe (algorithme déclaratif, pas d'IA).
 */
export const luxembourgEvaluations = mysqlTable("luxembourg_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  // Informations candidat
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("jobTitle", { length: 255 }).notNull(),
  yearsExperience: int("yearsExperience").notNull(),
  sector: mysqlEnum("sector", [
    "sante", "documentation", "education", "finance", "technologie",
    "administration", "rh", "metiers_mecanique", "autre",
  ]).notNull(),
  // Facteurs de notation déclarés par le candidat
  educationLevel: mysqlEnum("educationLevel", ["master_dual", "licence_cert", "bac_cqp"]).notNull(),
  frenchLevel: mysqlEnum("frenchLevel", ["natif_c2", "b2", "b1"]).notNull(),
  englishLevel: mysqlEnum("englishLevel", ["b2_plus", "b1_b2", "moins_b1", "absent"]).notNull(),
  skillsLevel: mysqlEnum("skillsLevel", ["excellentes", "bonnes", "basiques"]).notNull(),
  softSkills: json("softSkills").$type<string[]>().default([]), // leadership, gestion_stress, adaptabilite, communication
  // Résultat du calcul
  scoreFormation: int("scoreFormation").notNull(),
  scoreExperience: int("scoreExperience").notNull(),
  scoreFrancais: int("scoreFrancais").notNull(),
  scoreAnglais: int("scoreAnglais").notNull(),
  scoreSecteur: int("scoreSecteur").notNull(),
  scoreCompetences: int("scoreCompetences").notNull(),
  scoreBonus: int("scoreBonus").notNull(),
  scoreTotal: int("scoreTotal").notNull(),
  eligibilityStatus: mysqlEnum("eligibilityStatus", ["tres_eligible", "eligible", "moderement_eligible", "non_eligible"]).notNull(),
  // Suivi
  emailSentAt: timestamp("emailSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LuxembourgEvaluation = typeof luxembourgEvaluations.$inferSelect;
export type InsertLuxembourgEvaluation = typeof luxembourgEvaluations.$inferInsert;

/**
 * Évaluations d'éligibilité Visa Études — scoring automatique par grille de
 * points (niveau académique, langue, financement, admission, projet de retour).
 */
export const studyVisaEvaluations = mysqlTable("study_visa_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  targetCountry: varchar("targetCountry", { length: 100 }),
  academicLevel: mysqlEnum("academicLevel", ["master_mention", "licence", "bac2", "bac"]).notNull(),
  gradeLevel: mysqlEnum("gradeLevel", ["tres_bien", "bien", "assez_bien", "passable"]).notNull(),
  languageLevel: mysqlEnum("languageLevel", ["c1_c2", "b2", "b1", "moins_b1"]).notNull(),
  admissionStatus: mysqlEnum("admissionStatus", ["admis", "en_cours", "pas_commence"]).notNull(),
  financialCapacity: mysqlEnum("financialCapacity", ["complete", "partielle", "incertaine"]).notNull(),
  returnTies: mysqlEnum("returnTies", ["solide", "modere", "faible"]).notNull(),
  scoreAcademic: int("scoreAcademic").notNull(),
  scoreGrades: int("scoreGrades").notNull(),
  scoreLanguage: int("scoreLanguage").notNull(),
  scoreAdmission: int("scoreAdmission").notNull(),
  scoreFinancial: int("scoreFinancial").notNull(),
  scoreReturnTies: int("scoreReturnTies").notNull(),
  scoreTotal: int("scoreTotal").notNull(),
  eligibilityStatus: mysqlEnum("eligibilityStatus", ["tres_favorable", "favorable", "a_renforcer", "risque_eleve"]).notNull(),
  emailSentAt: timestamp("emailSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StudyVisaEvaluation = typeof studyVisaEvaluations.$inferSelect;
export type InsertStudyVisaEvaluation = typeof studyVisaEvaluations.$inferInsert;

/**
 * Demandes de consultation avec CV (ex: bouton "Demander ma consultation
 * gratuite" sur les fiches procédure pays). Le CV est analysé automatiquement
 * par IA, puis un admin valide (et peut ajuster) avant l'envoi au candidat.
 */
export const consultationRequests = mysqlTable("consultation_requests", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  targetCountry: varchar("targetCountry", { length: 100 }),
  message: text("message"),
  cvFileUrl: text("cvFileUrl"),
  cvFileName: varchar("cvFileName", { length: 255 }),
  // Analyse automatique par IA
  aiReportContent: text("aiReportContent"),
  aiProcessedAt: timestamp("aiProcessedAt"),
  aiProcessingError: text("aiProcessingError"),
  // Validation admin avant envoi (le rapport IA n'est jamais envoyé tel quel
  // sans relecture humaine)
  status: mysqlEnum("status", ["pending_ai", "pending_review", "validated_sent", "rejected"]).default("pending_ai").notNull(),
  finalReportContent: text("finalReportContent"), // version éventuellement modifiée par l'admin avant envoi
  adminNotes: text("adminNotes"),
  validatedByAdminEmail: varchar("validatedByAdminEmail", { length: 320 }),
  validatedAt: timestamp("validatedAt"),
  sentToClientAt: timestamp("sentToClientAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ConsultationRequest = typeof consultationRequests.$inferSelect;
export type InsertConsultationRequest = typeof consultationRequests.$inferInsert;


/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SYSTÈME D'ÉVALUATION IA ENRICHIE POUR TOUTES DESTINATIONS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Évaluations IA enrichies avec quiz intelligent et recommandations personnalisées
 * pour les 107 destinations disponibles.
 */
export const aiEvaluations = mysqlTable("ai_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Candidat
  candidateId: int("candidateId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  
  // Réponses du quiz
  quizResponses: text("quizResponses").notNull(),  // JSON des réponses
  
  // Résultats IA
  aiScore: int("aiScore"),  // Score total 0-100
  aiRecommendations: text("aiRecommendations"),  // JSON array des recommandations
  aiReport: text("aiReport"),  // Rapport détaillé généré par IA
  aiProcessedAt: timestamp("aiProcessedAt"),
  
  // Destinations recommandées
  recommendedDestinations: text("recommendedDestinations"),  // JSON array {country, score, reason}
  
  // État
  status: mysqlEnum("status", ["draft", "completed", "submitted", "approved", "rejected"]).default("draft").notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiEvaluation = typeof aiEvaluations.$inferSelect;
export type InsertAiEvaluation = typeof aiEvaluations.$inferInsert;

/**
 * Dossiers clients ouverts après évaluation IA et paiement
 */
export const clientDossiers = mysqlTable("client_dossiers", {
  id: int("id").autoincrement().primaryKey(),
  
  // Numéro de dossier unique : 3M-YYYY-XXXX
  dossierNumber: varchar("dossierNumber", { length: 20 }).notNull().unique(),
  
  // Candidat
  candidateId: int("candidateId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  whatsappNumber: varchar("whatsappNumber", { length: 50 }).notNull(),
  
  // Évaluation IA
  aiEvaluationId: int("aiEvaluationId").notNull(),
  aiScore: int("aiScore"),
  recommendedDestination: varchar("recommendedDestination", { length: 100 }),
  
  // Paiement
  paymentStatus: mysqlEnum("paymentStatus", ["PENDING", "SUCCESS", "FAILED", "CANCELLED"]).default("PENDING").notNull(),
  paymentAmount: int("paymentAmount").default(65000).notNull(),  // 65000 FCFA
  paymentCurrency: varchar("paymentCurrency", { length: 10 }).default("XAF").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),  // MTN, ORANGE, CARD
  paymentTransactionId: varchar("paymentTransactionId", { length: 255 }),
  paymentDate: timestamp("paymentDate"),
  
  // État du dossier
  dossierStatus: mysqlEnum("dossierStatus", [
    "nouveau",
    "evaluation_complete",
    "en_attente_paiement",
    "paye",
    "en_attente_documents",
    "documents_recus",
    "en_cours_traitement",
    "approuve",
    "refuse"
  ]).default("nouveau").notNull(),
  
  // Suivi administratif
  adminAssignedTo: varchar("adminAssignedTo", { length: 255 }),
  adminNote: text("adminNote"),
  lastStatusUpdateAt: timestamp("lastStatusUpdateAt"),
  lastStatusUpdatedBy: varchar("lastStatusUpdatedBy", { length: 255 }),
  
  // Documents
  documentsUrls: text("documentsUrls"),  // JSON array {type, url, key, name}
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientDossier = typeof clientDossiers.$inferSelect;
export type InsertClientDossier = typeof clientDossiers.$inferInsert;

/**
 * Historique des mises à jour de dossiers (synchronisation admin-client)
 */
export const dossierUpdates = mysqlTable("dossier_updates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Référence au dossier
  dossierId: int("dossierId").notNull(),
  dossierNumber: varchar("dossierNumber", { length: 20 }).notNull(),
  
  // Type de mise à jour
  updateType: mysqlEnum("updateType", [
    "status_change",
    "document_received",
    "payment_received",
    "admin_note",
    "approval",
    "rejection"
  ]).notNull(),
  
  // Détails
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  description: text("description"),
  
  // Qui a fait la mise à jour
  updatedBy: varchar("updatedBy", { length: 255 }).notNull(),
  
  // Notification
  notificationSent: boolean("notificationSent").default(false).notNull(),
  notificationSentAt: timestamp("notificationSentAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DossierUpdate = typeof dossierUpdates.$inferSelect;
export type InsertDossierUpdate = typeof dossierUpdates.$inferInsert;

export const customerReviews = mysqlTable("customer_reviews", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  destinationCountry: varchar("destinationCountry", { length: 100 }),
  serviceType: varchar("serviceType", { length: 100 }),
  rating: int("rating").notNull(),
  reviewText: text("reviewText").notNull(),
  consentToPublish: boolean("consentToPublish").default(false).notNull(),
  displayNameChoice: mysqlEnum("displayNameChoice", ["full_name", "first_name_only", "initials"]).default("first_name_only").notNull(),
  status: mysqlEnum("status", ["pending_review", "approved", "rejected"]).default("pending_review").notNull(),
  adminNotes: text("adminNotes"),
  reviewedByAdminEmail: varchar("reviewedByAdminEmail", { length: 320 }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CustomerReview = typeof customerReviews.$inferSelect;
export type InsertCustomerReview = typeof customerReviews.$inferInsert;

/**
 * Historique des actions administrateur sur les évaluations et des exports.
 * Table isolée : aucune modification des tables métier existantes.
 */
export const adminActivityLogs = mysqlTable("admin_activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminEmail: varchar("adminEmail", { length: 320 }).notNull(),
  action: mysqlEnum("action", ["status_changed", "csv_exported", "pdf_exported"]).notNull(),
  evaluationType: varchar("evaluationType", { length: 50 }),
  evaluationId: varchar("evaluationId", { length: 100 }),
  oldStatus: varchar("oldStatus", { length: 80 }),
  newStatus: varchar("newStatus", { length: 80 }),
  resultCount: int("resultCount"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;
export type InsertAdminActivityLog = typeof adminActivityLogs.$inferInsert;

/**
 * Audit immuable des décisions humaines prises sur les passeports.
 * La prévalidation automatique est désactivée : chaque décision doit être
 * rattachée à un administrateur identifié et à un document précis.
 */
export const passportVerificationAudits = mysqlTable("passport_verification_audits", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  applicationId: int("applicationId"),
  adminEmail: varchar("adminEmail", { length: 320 }).notNull(),
  decision: mysqlEnum("decision", ["approved", "rejected"]).notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("idx_passport_audit_document_created").on(table.documentId, table.createdAt),
  index("idx_passport_audit_admin_created").on(table.adminEmail, table.createdAt),
]);
export type PassportVerificationAudit = typeof passportVerificationAudits.$inferSelect;
export type InsertPassportVerificationAudit = typeof passportVerificationAudits.$inferInsert;

/**
 * Enregistrement des questions posées à l'assistant Aureol et des réponses fournies.
 * Permet d'analyser les questions fréquentes pour enrichir la base de connaissance.
 */
export const aureolQuestions = mysqlTable("aureol_questions", {
  id: int("id").autoincrement().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  visitorEmail: varchar("visitorEmail", { length: 320 }),
  sourceWidget: varchar("sourceWidget", { length: 50 }).default("copilot_widget").notNull(),
  pagePath: varchar("pagePath", { length: 255 }),
  categoryTag: varchar("categoryTag", { length: 100 }),
  isHelpful: boolean("isHelpful"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AureolQuestion = typeof aureolQuestions.$inferSelect;
export type InsertAureolQuestion = typeof aureolQuestions.$inferInsert;

/**
 * Historique des e-mails envoyés et de leur délivrabilité.
 */
export const emailDeliveryLogs = mysqlTable("email_delivery_logs", {
  id: int("id").autoincrement().primaryKey(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("sent").notNull(),
  providerMessageId: varchar("providerMessageId", { length: 255 }),
  errorDetails: text("errorDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailDeliveryLog = typeof emailDeliveryLogs.$inferSelect;
export type InsertEmailDeliveryLog = typeof emailDeliveryLogs.$inferInsert;

/**
 * Historique des recherches de vols effectuées par les utilisateurs.
 */
export const flightSearchHistory = mysqlTable("flight_search_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userEmail: varchar("userEmail", { length: 320 }),
  origin: varchar("origin", { length: 10 }).notNull(),
  destination: varchar("destination", { length: 10 }).notNull(),
  departureDate: varchar("departureDate", { length: 30 }).notNull(),
  returnDate: varchar("returnDate", { length: 30 }),
  adults: int("adults").default(1).notNull(),
  cabinClass: varchar("cabinClass", { length: 50 }).default("ECONOMY").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FlightSearchHistory = typeof flightSearchHistory.$inferSelect;
export type InsertFlightSearchHistory = typeof flightSearchHistory.$inferInsert;

/**
 * Paramètres généraux de l'agence (ex: taux de commission vol).
 */
export const agencySettings = mysqlTable("agency_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type AgencySetting = typeof agencySettings.$inferSelect;
export type InsertAgencySetting = typeof agencySettings.$inferInsert;

/**
 * Votes anonymes de pertinence sur les réponses de la FAQ publique.
 * Aucun contenu personnel ni adresse IP n'est stocké.
 */
export const faqFeedback = mysqlTable("faq_feedback", {
  id: int("id").autoincrement().primaryKey(),
  questionKey: varchar("questionKey", { length: 191 }).notNull(),
  helpful: boolean("helpful").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FaqFeedback = typeof faqFeedback.$inferSelect;
export type InsertFaqFeedback = typeof faqFeedback.$inferInsert;


export const destinationDocuments = mysqlTable("destination_documents", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  extractedText: text("extracted_text"),
  fileSize: int("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DestinationDocument = typeof destinationDocuments.$inferSelect;
export type NewDestinationDocument = typeof destinationDocuments.$inferInsert;

/**
 * Overrides médias administrables pour les fiches de destination.
 * Les fichiers restent dans S3/Manus Storage ; cette table ne conserve que
 * les références et la traçabilité de la dernière modification.
 */
export const destinationMedia = mysqlTable("destination_media", {
  id: int("id").primaryKey().autoincrement(),
  destinationId: varchar("destinationId", { length: 160 }).notNull().unique(),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 512 }),
  flagUrl: text("flagUrl"),
  flagKey: varchar("flagKey", { length: 512 }),
  imageAlt: varchar("imageAlt", { length: 255 }),
  flagAlt: varchar("flagAlt", { length: 255 }),
  updatedByAdminId: int("updatedByAdminId"),
  updatedByAdminEmail: varchar("updatedByAdminEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("idx_destination_media_updated_at").on(table.updatedAt),
]);

export type DestinationMedia = typeof destinationMedia.$inferSelect;
export type InsertDestinationMedia = typeof destinationMedia.$inferInsert;

export const favoriteFlights = mysqlTable("favorite_flights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  flightData: text("flightData").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const paymentAuditLogs = mysqlTable("payment_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminName: varchar("adminName", { length: 255 }).notNull(),
  adminEmail: varchar("adminEmail", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  paymentId: int("paymentId").notNull(),
  candidateEmail: varchar("candidateEmail", { length: 255 }).notNull(),
  amount: varchar("amount", { length: 50 }).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const savedTravelPlans = mysqlTable("saved_travel_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  origin: varchar("origin", { length: 100 }).notNull(),
  destination: varchar("destination", { length: 100 }).notNull(),
  planContent: text("planContent").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


/**
 * Scan sécurisé de passeport utilisé pour le préremplissage contrôlé des passagers.
 * Les octets restent dans Manus Storage ; la base conserve uniquement les références,
 * l'état de l'analyse et les champs extraits validables par le candidat.
 */
export const passportScanRequests = mysqlTable("passport_scan_requests", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  scanStatus: mysqlEnum("scanStatus", ["pending", "completed", "failed"]).default("pending").notNull(),
  extractedData: json("extractedData"),
  confidence: int("confidence"),
  issues: json("issues"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("idx_passport_scans_candidate").on(table.candidateId),
  index("idx_passport_scans_status").on(table.scanStatus),
]);
export type PassportScanRequest = typeof passportScanRequests.$inferSelect;
export type InsertPassportScanRequest = typeof passportScanRequests.$inferInsert;

/**
 * File d'attente des demandes de réservation de vols à revalider par l'agence.
 * Une demande ne devient jamais automatiquement un billet émis : l'agent doit
 * contrôler le tarif, la disponibilité et le paiement avant l'émission.
 */
export const flightBookingRequests = mysqlTable("flight_booking_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestRef: varchar("requestRef", { length: 32 }).notNull().unique(),
  candidateId: int("candidateId"),
  candidateEmail: varchar("candidateEmail", { length: 320 }).notNull(),
  flightId: varchar("flightId", { length: 255 }).notNull(),
  flightData: json("flightData").notNull(),
  passengerData: json("passengerData").notNull(),
  candidatePhone: varchar("candidatePhone", { length: 32 }),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  status: mysqlEnum("status", ["pending_review", "assigned", "needs_info", "revalidated", "awaiting_payment", "issued", "cancelled"]).default("pending_review").notNull(),
    assignedAgentEmail: varchar("assignedAgentEmail", { length: 320 }),
  agentNotes: text("agentNotes"),
  pnrReference: varchar("pnrReference", { length: 120 }),
  issuedPdfUrl: text("issuedPdfUrl"),
  pnrViewedAt: timestamp("pnrViewedAt"),
  pnrDownloadedAt: timestamp("pnrDownloadedAt"),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentTransactionId: varchar("paymentTransactionId", { length: 120 }),
  clientValidated: boolean("clientValidated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("idx_flight_requests_status").on(table.status),
  index("idx_flight_requests_assignee_status").on(table.assignedAgentEmail, table.status),
  index("idx_flight_requests_candidate").on(table.candidateId),
]);
export type FlightBookingRequest = typeof flightBookingRequests.$inferSelect;
export type InsertFlightBookingRequest = typeof flightBookingRequests.$inferInsert;

export const flightBookingNotifications = mysqlTable("flight_booking_notifications", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  channel: mysqlEnum("channel", ["email", "whatsapp"]).notNull(),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["sent", "failed", "skipped"]).notNull(),
  statusValue: varchar("statusValue", { length: 64 }).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("idx_flight_notifications_request").on(table.requestId, table.createdAt),
]);
export type FlightBookingNotification = typeof flightBookingNotifications.$inferSelect;
export type InsertFlightBookingNotification = typeof flightBookingNotifications.$inferInsert;

export const flightBookingRequestHistory = mysqlTable("flight_booking_request_history", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  changedBy: varchar("changedBy", { length: 320 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("idx_flight_request_history_request").on(table.requestId, table.createdAt),
]);
export type FlightBookingRequestHistory = typeof flightBookingRequestHistory.$inferSelect;
export type InsertFlightBookingRequestHistory = typeof flightBookingRequestHistory.$inferInsert;


export const agencyDossierDocuments = mysqlTable("agency_dossier_documents", {
  id: int("id").autoincrement().primaryKey(),
  dossierId: int("dossierId").notNull(), // Référence à agencyDossiers(id)
  documentType: varchar("documentType", { length: 100 }).notNull(), // passeport, cv, diplome, contrat, autre
  documentName: varchar("documentName", { length: 255 }).notNull(),
  documentUrl: text("documentUrl").notNull(),
  fileSize: int("fileSize"),
  source: mysqlEnum("source", ["agency_scan", "admin_upload", "candidate_upload"]).default("agency_scan").notNull(),
  uploadedBy: varchar("uploadedBy", { length: 320 }).notNull(), // Email de l'admin ou du candidat
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected"]).default("pending").notNull(),
  verificationComment: text("verificationComment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agencyDossierDocumentAnnotations = mysqlTable("agency_dossier_document_annotations", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  dossierId: int("dossierId").notNull(),
  authorEmail: varchar("authorEmail", { length: 320 }).notNull(),
  message: text("message").notNull(),
  areaLabel: varchar("areaLabel", { length: 120 }),
  // Coordonnées en millièmes de pourcentage pour rester indépendantes de la résolution.
  x: int("x"),
  y: int("y"),
  width: int("width"),
  height: int("height"),
  status: mysqlEnum("status", ["open", "resolved"]).default("open").notNull(),
  resolvedBy: varchar("resolvedBy", { length: 320 }),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgencyDossierDocument = typeof agencyDossierDocuments.$inferSelect;
export type InsertAgencyDossierDocument = typeof agencyDossierDocuments.$inferInsert;
export type AgencyDossierDocumentAnnotation = typeof agencyDossierDocumentAnnotations.$inferSelect;
export type InsertAgencyDossierDocumentAnnotation = typeof agencyDossierDocumentAnnotations.$inferInsert;

/**
 * Journal immuable des connexions et actions sensibles effectuées par les administrateurs.
 * Ne stocke jamais de mot de passe, jeton, fichier privé ou contenu de formulaire complet.
 */
export const adminAuditLogs = mysqlTable("admin_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminAccountId: int("adminAccountId"),
  adminEmail: varchar("adminEmail", { length: 320 }).notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  resourceType: varchar("resourceType", { length: 80 }),
  resourceId: varchar("resourceId", { length: 120 }),
  outcome: mysqlEnum("outcome", ["success", "failure"]).default("success").notNull(),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("idx_admin_audit_created").on(table.createdAt),
  index("idx_admin_audit_admin_created").on(table.adminAccountId, table.createdAt),
  index("idx_admin_audit_action_created").on(table.action, table.createdAt),
]);
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLogs.$inferInsert;
