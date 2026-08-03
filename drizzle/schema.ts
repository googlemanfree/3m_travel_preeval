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
  // Changement de mot de passe obligatoire
  requiresPasswordChange: boolean("requiresPasswordChange").default(true).notNull(),  // Force le changement au 1er login
  passwordChangedAt: timestamp("passwordChangedAt"),  // Quand le mot de passe a été changé pour la dernière fois
  // Réinitialisation de mot de passe
  resetToken: varchar("resetToken", { length: 256 }),  // Token unique pour réinitialiser le mot de passe
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),  // Expiration du token de réinitialisation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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

