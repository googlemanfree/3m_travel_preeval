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
  oldPassportAvailable: boolean("oldPassportAvailable").default(false),
  idCardAvailable: boolean("idCardAvailable").default(false),
  
  // ─── Situation familiale ───
  maritalStatus: mysqlEnum("maritalStatus", ["single", "married", "divorced", "widowed", "civil_union"]),
  spouseName: varchar("spouseName", { length: 255 }),
  numberOfChildren: int("numberOfChildren").default(0),
  dependents: int("dependents").default(0),
  familyInDestination: boolean("familyInDestination").default(false),
  familyMemberRelation: varchar("familyMemberRelation", { length: 100 }),
  familyMemberStatus: varchar("familyMemberStatus", { length: 100 }),
  
  // ─── Études et formation ───
  educationLevel: varchar("educationLevel", { length: 100 }),
  latestDiploma: varchar("latestDiploma", { length: 255 }),
  fieldOfStudy: varchar("fieldOfStudy", { length: 150 }),
  diplomaYear: int("diplomaYear"),
  institution: varchar("institution", { length: 255 }),
  diplomasAvailable: boolean("diplomasAvailable").default(false),
  
  // ─── Parcours professionnel ───
  currentProfession: varchar("currentProfession", { length: 150 }),
  currentEmployer: varchar("currentEmployer", { length: 255 }),
  yearsOfExperience: int("yearsOfExperience"),
  previousExperiences: text("previousExperiences"),  // JSON array
  monthlyIncome: int("monthlyIncome"),
  cvAvailable: boolean("cvAvailable").default(false),
  jobOfferAvailable: boolean("jobOfferAvailable").default(false),
  
  // ─── Situation financière ───
  bankBalance: int("bankBalance"),
  bankBalanceAverage6Months: int("bankBalanceAverage6Months"),
  hasSponsor: boolean("hasSponsor").default(false),
  sponsorName: varchar("sponsorName", { length: 255 }),
  fundSource: varchar("fundSource", { length: 100 }),
  realEstate: boolean("realEstate").default(false),
  businessActivity: boolean("businessActivity").default(false),
  debts: boolean("debts").default(false),
  
  // ─── Historique de voyage ───
  countriesVisited: text("countriesVisited"),  // JSON array
  visasObtained: text("visasObtained"),  // JSON array
  visaRefusals: boolean("visaRefusals").default(false),
  overstayHistory: boolean("overstayHistory").default(false),
  deportationOrRefusal: boolean("deportationOrRefusal").default(false),
  previousApplications: text("previousApplications"),  // JSON array
  
  // ─── Admissibilité ───
  criminalRecord: boolean("criminalRecord").default(false),
  immigrationIssues: boolean("immigrationIssues").default(false),
  medicalConcerns: boolean("medicalConcerns").default(false),
  falseDeclaration: boolean("falseDeclaration").default(false),
  specialNeeds: text("specialNeeds"),
  
  // ─── Documents disponibles ───
  documentsAvailable: text("documentsAvailable"),  // JSON array: ["passport", "photos", "diplomas", "cv", "bank_statements", "birth_certificate", "marriage_certificate", "invitation_letter", "admission_letter", "language_results", "eca", "police_certificate", "other"]
  
  // ─── Sections conditionnelles (Étudiant) ───
  desiredProgram: varchar("desiredProgram", { length: 255 }),
  desiredEducationLevel: varchar("desiredEducationLevel", { length: 100 }),
  targetInstitution: varchar("targetInstitution", { length: 255 }),
  admissionLetterAvailable: boolean("admissionLetterAvailable").default(false),
  intendedStartDate: varchar("intendedStartDate", { length: 20 }),
  studyBudget: int("studyBudget"),
  studyFunder: varchar("studyFunder", { length: 100 }),
  academicProject: text("academicProject"),
  postStudiesProject: text("postStudiesProject"),
  companions: text("companions"),  // JSON array
  
  // ─── Sections conditionnelles (Visiteur) ───
  visitReason: varchar("visitReason", { length: 100 }),
  visitType: mysqlEnum("visitType", ["tourism", "family", "business", "event", "other"]),
  plannedStayDuration: varchar("plannedStayDuration", { length: 50 }),
  estimatedTravelDate: varchar("estimatedTravelDate", { length: 20 }),
  plannedAccommodation: varchar("plannedAccommodation", { length: 100 }),
  invitingPerson: varchar("invitingPerson", { length: 255 }),
  invitationLetterAvailable: boolean("invitationLetterAvailable").default(false),
  stayFunder: varchar("stayFunder", { length: 100 }),
  tiesInHomeCountry: text("tiesInHomeCountry"),  // JSON array: ["employment", "business", "property", "family", "studies"]
  
  // ─── Sections conditionnelles (Travailleur) ───
  desiredPosition: varchar("desiredPosition", { length: 150 }),
  targetCity: varchar("targetCity", { length: 100 }),
  relatedExperience: int("relatedExperience"),
  relatedDiplomas: text("relatedDiplomas"),  // JSON array
  languageLevel: varchar("languageLevel", { length: 50 }),
  departureAvailability: varchar("departureAvailability", { length: 50 }),
  
  // ─── Sections conditionnelles (Résidence permanente) ───
  targetCategory: varchar("targetCategory", { length: 100 }),
  age: int("age"),
  ecaAvailable: boolean("ecaAvailable").default(false),
  experienceYears: int("experienceYears"),
  experienceInDestination: boolean("experienceInDestination").default(false),
  provincialNomination: boolean("provincialNomination").default(false),
  availableFunds: int("availableFunds"),
  policeCertificatesAvailable: boolean("policeCertificatesAvailable").default(false),
  
  // ─── Métadonnées ───
  status: mysqlEnum("status", ["draft", "submitted", "reviewed", "contacted", "closed"]).default("submitted").notNull(),
  submissionNotes: text("submissionNotes"),
  adminNotes: text("adminNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProfileEvaluation = typeof profileEvaluations.$inferSelect;
export type InsertProfileEvaluation = typeof profileEvaluations.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// CHAT DE SUPPORT — CONTACT EN DIRECT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Messages de chat en direct depuis la page Contact
 * Permet aux clients de communiquer directement avec le support
 */
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

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIQUE D'ENVOI DES RAPPORTS IA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Historique des rapports d'évaluation IA envoyés aux candidats
 * Permet de tracer les envois, les dates et les statuts
 */
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

export type AIReportHistory = typeof aiReportHistory.$inferSelect;
export type InsertAIReportHistory = typeof aiReportHistory.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// COMPTES ADMIN SÉPARÉS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Comptes administrateurs avec authentification OTP
 * Séparé du système OAuth pour une gestion admin indépendante
 */
export const adminAccounts = mysqlTable("admin_accounts", {
  id: int("id").autoincrement().primaryKey(),
  // Identifiants
  email: varchar("email", { length: 320 }).notNull().unique(),
  adminType: mysqlEnum("adminType", ["evaluation", "accompagnement", "procedures"]).notNull(),
  // OTP
  otpCode: varchar("otpCode", { length: 6 }),  // Code OTP actuel
  otpExpiresAt: timestamp("otpExpiresAt"),  // Expiration du code OTP
  otpAttempts: int("otpAttempts").default(0).notNull(),  // Nombre de tentatives échouées
  // Session
  sessionToken: varchar("sessionToken", { length: 256 }),  // Token de session actuel
  sessionExpiresAt: timestamp("sessionExpiresAt"),  // Expiration de la session
  lastLoginAt: timestamp("lastLoginAt"),  // Dernière connexion
  // Métadonnées
  fullName: varchar("fullName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminAccount = typeof adminAccounts.$inferSelect;
export type InsertAdminAccount = typeof adminAccounts.$inferInsert;

/**
 * Logs d'audit pour tracer les actions admin
 */
export const adminLogs = mysqlTable("admin_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  adminEmail: varchar("adminEmail", { length: 320 }).notNull(),
  adminType: varchar("adminType", { length: 50 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),  // Ex: "advance_status", "send_message", "add_notes"
  targetId: int("targetId"),  // ID de l'évaluation/dossier affecté
  targetEmail: varchar("targetEmail", { length: 320 }),  // Email du candidat affecté
  details: text("details"),  // Détails JSON de l'action
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;
