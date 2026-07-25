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
  lastActivityAt: timestamp("lastActivityAt"),  // Dernière activité (pour détecter l'inactivité)
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

// ─────────────────────────────────────────────────────────────────────────────
// GESTION AUTOMATIQUE DES CANDIDATURES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Table de suivi des candidatures avec gestion automatique
 * Centralise toutes les candidatures pour un suivi efficace
 */
export const candidateApplications = mysqlTable("candidate_applications", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identifiant unique
  applicationNumber: varchar("applicationNumber", { length: 50 }).notNull().unique(),  // 3M-APP-YYYY-NNNN
  
  // Informations du candidat
  candidateId: int("candidateId"),  // Référence au candidat inscrit (peut être null)
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  whatsappNumber: varchar("whatsappNumber", { length: 50 }),
  
  // Destination et type de visa
  destination: varchar("destination", { length: 100 }).notNull(),
  visaType: varchar("visaType", { length: 100 }).notNull(),
  
  // Profil du candidat
  educationLevel: varchar("educationLevel", { length: 100 }),
  experienceYears: int("experienceYears"),
  languageSkills: varchar("languageSkills", { length: 255 }),
  
  // Scoring automatique (0-100)
  scoringTotal: int("scoringTotal"),  // Score global
  scoringDetails: text("scoringDetails"),  // JSON {education, experience, language, age, etc.}
  scoringBadge: mysqlEnum("scoringBadge", ["excellent", "bon", "moyen", "faible"]),
  
  // Statut de la candidature
  status: mysqlEnum("status", [
    "nouveau",
    "en_evaluation",
    "documents_requis",
    "en_attente",
    "approuve",
    "refuse",
    "archive"
  ]).default("nouveau").notNull(),
  
  // Paiement
  paymentStatus: mysqlEnum("paymentStatus", ["non_paye", "en_attente", "paye", "remboursement"]).default("non_paye").notNull(),
  paymentAmount: int("paymentAmount"),
  paymentDate: timestamp("paymentDate"),
  
  // Documents
  documentsCount: int("documentsCount").default(0),
  documentsUrls: text("documentsUrls"),  // JSON array
  
  // Notifications
  emailSent: boolean("emailSent").default(false),
  whatsappSent: boolean("whatsappSent").default(false),
  lastEmailSentAt: timestamp("lastEmailSentAt"),
  lastWhatsappSentAt: timestamp("lastWhatsappSentAt"),
  
  // Notes et commentaires
  adminNotes: text("adminNotes"),
  internalNotes: text("internalNotes"),
  
  // Suivi du processus
  evaluationCompletedAt: timestamp("evaluationCompletedAt"),
  approvedAt: timestamp("approvedAt"),
  rejectedAt: timestamp("rejectedAt"),
  rejectionReason: text("rejectionReason"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  nextFollowUpAt: timestamp("nextFollowUpAt"),  // Prochaine relance automatique
});

export type CandidateApplication = typeof candidateApplications.$inferSelect;
export type InsertCandidateApplication = typeof candidateApplications.$inferInsert;

/**
 * Historique des changements de statut des candidatures
 * Permet de tracer toutes les modifications
 */
export const applicationStatusHistory = mysqlTable("application_status_history", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  previousStatus: varchar("previousStatus", { length: 50 }).notNull(),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  changedBy: varchar("changedBy", { length: 320 }),  // Email de l'admin qui a fait le changement
  reason: text("reason"),  // Raison du changement
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApplicationStatusHistory = typeof applicationStatusHistory.$inferSelect;
export type InsertApplicationStatusHistory = typeof applicationStatusHistory.$inferInsert;

/**
 * Tâches automatiques planifiées pour chaque candidature
 * Permet de gérer les rappels, les relances, etc.
 */
export const automatedTasks = mysqlTable("automated_tasks", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  taskType: mysqlEnum("taskType", [
    "send_email",
    "send_whatsapp",
    "request_documents",
    "follow_up",
    "payment_reminder",
    "evaluation_reminder",
    "auto_approve",
    "auto_reject"
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed", "cancelled"]).default("pending").notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),  // Quand la tâche doit s'exécuter
  executedAt: timestamp("executedAt"),  // Quand la tâche a été exécutée
  failureReason: text("failureReason"),  // Raison de l'échec si applicable
  retryCount: int("retryCount").default(0),
  maxRetries: int("maxRetries").default(3),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomatedTask = typeof automatedTasks.$inferSelect;
export type InsertAutomatedTask = typeof automatedTasks.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// GESTION DES DOCUMENTS ET PAIEMENTS CLIENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Documents remis par le client (CV, passeport, diplômes, etc.)
 * Génère automatiquement une décharge/reçu
 */
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientDocument = typeof clientDocuments.$inferSelect;
export type InsertClientDocument = typeof clientDocuments.$inferInsert;

/**
 * Paiements reçus du client
 * Génère automatiquement une facture/reçu de paiement
 */
export const clientPayments = mysqlTable("client_payments", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId").notNull(),
  candidateEmail: varchar("candidateEmail", { length: 320 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
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


// ─────────────────────────────────────────────────────────────────────────────
// SYSTÈME D'EMAIL DIFFÉRÉ 48H — BILAN D'ADMISSIBILITÉ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tracking des emails de bilan d'admissibilité envoyés après 48h
 * Permet de tracker quand et à qui les emails ont été envoyés
 */
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


// ─────────────────────────────────────────────────────────────────────────────
// PRISE DE RENDEZ-VOUS EN AGENCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rendez-vous en agence pour consultation physique après évaluation
 * Permet aux candidats de réserver un créneau et aux admins de gérer les disponibilités
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId").notNull(),
  candidateEmail: varchar("candidateEmail", { length: 320 }).notNull(),
  candidateName: varchar("candidateName", { length: 255 }).notNull(),
  candidatePhone: varchar("candidatePhone", { length: 50 }).notNull(),
  
  // Créneau réservé
  appointmentDate: varchar("appointmentDate", { length: 20 }).notNull(),  // Date du rendez-vous (YYYY-MM-DD)
  appointmentTime: varchar("appointmentTime", { length: 10 }).notNull(),  // Heure (HH:MM)
  durationMinutes: int("durationMinutes").default(30).notNull(),  // Durée en minutes
  
  // Localisation
  agencyLocation: varchar("agencyLocation", { length: 255 }).notNull(),  // Douala / Yaoundé / Kinshasa
  agencyAddress: text("agencyAddress"),  // Adresse complète
  agencyPhone: varchar("agencyPhone", { length: 50 }),  // Téléphone de l'agence
  
  // Raison du rendez-vous
  appointmentReason: mysqlEnum("appointmentReason", [
    "initial_consultation",
    "document_submission",
    "payment_cash",
    "follow_up",
    "visa_collection",
    "other"
  ]).default("initial_consultation").notNull(),
  appointmentNotes: text("appointmentNotes"),  // Notes supplémentaires du candidat
  
  // Gestion admin
  confirmedByAdmin: boolean("confirmedByAdmin").default(false).notNull(),
  adminNotes: text("adminNotes"),
  assignedToAgent: varchar("assignedToAgent", { length: 320 }),  // Email de l'agent assigné
  
  // Statut
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled", "no_show"]).default("pending").notNull(),
  completionNotes: text("completionNotes"),  // Notes après le rendez-vous
  
  // Notifications
  emailSent: boolean("emailSent").default(false).notNull(),
  whatsappSent: boolean("whatsappSent").default(false).notNull(),
  reminderSentAt: timestamp("reminderSentAt"),  // Rappel envoyé 24h avant
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Créneaux horaires disponibles par agence
 * Permet aux admins de gérer les disponibilités
 */
export const appointmentSlots = mysqlTable("appointment_slots", {
  id: int("id").autoincrement().primaryKey(),
  agencyLocation: varchar("agencyLocation", { length: 255 }).notNull(),  // Douala / Yaoundé / Kinshasa
  dayOfWeek: int("dayOfWeek").notNull(),  // 0 = Dimanche, 1 = Lundi, etc.
  startTime: varchar("startTime", { length: 10 }).notNull(),  // HH:MM
  endTime: varchar("endTime", { length: 10 }).notNull(),  // HH:MM
  slotDurationMinutes: int("slotDurationMinutes").default(30).notNull(),
  maxAppointmentsPerSlot: int("maxAppointmentsPerSlot").default(1).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppointmentSlot = typeof appointmentSlots.$inferSelect;
export type InsertAppointmentSlot = typeof appointmentSlots.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// MODULE DE TRADUCTION CERTIFIÉE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Langues supportées pour la traduction certifiée
 */
export const translationLanguages = mysqlTable("translation_languages", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),  // fr, en, de, es, etc.
  name: varchar("name", { length: 100 }).notNull(),  // Français, English, Deutsch, etc.
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TranslationLanguage = typeof translationLanguages.$inferSelect;
export type InsertTranslationLanguage = typeof translationLanguages.$inferInsert;

/**
 * Tarification des traductions par type de document et paire de langues
 */
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

export type TranslationPricing = typeof translationPricing.$inferSelect;
export type InsertTranslationPricing = typeof translationPricing.$inferInsert;

/**
 * Demandes de traduction certifiée
 * RÈGLE STRICTE : Statut reste "pending_payment" jusqu'à validation du paiement
 */
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

export type TranslationRequest = typeof translationRequests.$inferSelect;
export type InsertTranslationRequest = typeof translationRequests.$inferInsert;

/**
 * Logs de téléchargement des documents traduits (audit)
 */
export const translationDownloadLogs = mysqlTable("translation_download_logs", {
  id: int("id").autoincrement().primaryKey(),
  translationRequestId: int("translationRequestId").notNull(),
  candidateEmail: varchar("candidateEmail", { length: 320 }).notNull(),
  downloadedAt: timestamp("downloadedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
});

export type TranslationDownloadLog = typeof translationDownloadLogs.$inferSelect;
export type InsertTranslationDownloadLog = typeof translationDownloadLogs.$inferInsert;

/**
 * Dossiers ajoutés manuellement par les administrateurs en agence
 * Système parallèle aux candidatures en ligne pour gérer les clients en agence
 */
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

export type AgencyDossier = typeof agencyDossiers.$inferSelect;
export type InsertAgencyDossier = typeof agencyDossiers.$inferInsert;

/**
 * Historique des modifications des dossiers en agence (audit)
 */
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

export type AgencyDossierHistory = typeof agencyDossierHistory.$inferSelect;
export type InsertAgencyDossierHistory = typeof agencyDossierHistory.$inferInsert;
