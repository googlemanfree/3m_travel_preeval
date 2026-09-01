import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clientDocuments, evaluations } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { notifyOwner } from "../_core/notification";
import { generateDossierCode } from "../utils/generateDossierCode";
import { getConfirmationEmailHTML, getConfirmationEmailText } from "../utils/confirmationEmail";
import { sendEvaluationReceptionEmail } from "../emailService";
import { extractCVFieldsForForm, extractCVFieldsFromImage, extractTextFromPDF, getPdfPageCount } from "../aiEvaluationService";
import { generateGeminiEvaluationDraft } from "../geminiEvaluationDraftService";
import { logger } from "../_core/logger";
import { and, eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";
import { candidateProcedure } from "./candidate";
import { requireValidAdminSession } from "./adminAuth";

const visaTypeEnum = z.enum([
  "schengen_etude",
  "schengen_tourisme",
  "schengen_travail",
  "canada_rp",
  "canada_etude",
  "canada_tourisme",
  "autre",
]);

const destinationCategoryEnum = z.enum(["schengen", "canada", "autre"]);
const acquisitionSourceEnum = z.enum(["facebook", "whatsapp", "direct", "other"]);
const DOCUMENT_UPLOAD_TTL_MS = 30 * 60 * 1000;
const MAX_EVALUATION_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_EVALUATION_DOCUMENT_MIME_TYPES = new Set(["application/pdf", "application/x-pdf", "text/pdf", "application/octet-stream", "image/jpeg", "image/png"]);
const evaluationDocumentTypeEnum = z.enum(["passport", "cv", "diploma", "certificate", "birth_certificate", "bank_statement", "language_test", "educational_transcript", "proof_of_residence", "other"]);
const orientationAlternativeCandidates: Record<string, string[]> = {
  Canada: ["France", "Belgique", "Allemagne", "Luxembourg", "Royaume-Uni"],
  Luxembourg: ["France", "Belgique", "Allemagne", "Canada"],
  France: ["Belgique", "Allemagne", "Luxembourg", "Canada"],
  Belgique: ["France", "Allemagne", "Luxembourg", "Canada"],
  Allemagne: ["France", "Belgique", "Luxembourg", "Canada"],
  "Royaume-Uni": ["Canada", "France", "Belgique", "Allemagne"],
};

function hasExpectedEvaluationSignature(fileName: string, mimeType: string, buffer: Buffer): boolean {
  const startsWith = (...signature: number[]) => signature.every((value, index) => buffer[index] === value);
  const normalizedMime = mimeType.toLowerCase().trim();
  if (new Set(["application/pdf", "application/x-pdf", "text/pdf", "application/octet-stream"]).has(normalizedMime)) {
    return /\.pdf$/i.test(fileName) && startsWith(0x25, 0x50, 0x44, 0x46);
  }
  if (normalizedMime === "image/png") return startsWith(0x89, 0x50, 0x4e, 0x47);
  if (normalizedMime === "image/jpeg") return startsWith(0xff, 0xd8, 0xff);
  return false;
}

function getEvaluationUploadSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Configuration de sécurité des documents indisponible." });
  return secret;
}

export function createEvaluationUploadToken(evaluationId: number, email: string): string {
  const expiresAt = Date.now() + DOCUMENT_UPLOAD_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ evaluationId, email: email.toLowerCase(), expiresAt })).toString("base64url");
  const signature = createHmac("sha256", getEvaluationUploadSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyEvaluationUploadToken(token: string, evaluationId: number, email: string): void {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) throw new TRPCError({ code: "FORBIDDEN", message: "Lien de dépôt invalide ou expiré." });
  const expected = createHmac("sha256", getEvaluationUploadSecret()).update(payload).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new TRPCError({ code: "FORBIDDEN", message: "Lien de dépôt invalide ou expiré." });
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { evaluationId: number; email: string; expiresAt: number };
    if (parsed.evaluationId !== evaluationId || parsed.email !== email.toLowerCase() || !Number.isFinite(parsed.expiresAt) || parsed.expiresAt < Date.now()) throw new Error("invalid");
  } catch {
    throw new TRPCError({ code: "FORBIDDEN", message: "Lien de dépôt invalide ou expiré." });
  }
}

const evaluationInput = z.object({
  // État civil & famille
  fullName: z.string().min(2, "Le nom complet est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  cityOfResidence: z.string().optional(),
  maritalStatus: z.string().optional(),
  numberOfDependents: z.number().min(0).max(20).optional(),
  // Études & académique
  educationLevel: z.string().optional(),
  diplomaTitle: z.string().optional(),
  graduationYear: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  // Expérience professionnelle
  employmentStatus: z.string().optional(),
  currentJobTitle: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  industrySector: z.string().optional(),
  mainTasks: z.string().optional(),
  // Compétences linguistiques
  frenchLevel: z.string().optional(),
  englishLevel: z.string().optional(),
  languageTestsTaken: z.string().optional(),
  // Projet & destination
  destinationCategory: destinationCategoryEnum,
  destinationCountry: z.string().optional(),
  visaType: visaTypeEnum,
  travelReason: z.string().optional(),
  availableBudget: z.string().optional(),
  // Parcours choisi et réponses propres au projet
  projectType: z.enum(["travail", "etudes", "tourisme", "evisa", "immigration"]).optional(),
  projectDetails: z.record(z.string(), z.string().max(1000)).optional(),
  // Historique & antécédents
  priorVisaRefusal: z.boolean().optional(),
  priorVisaRefusalCountry: z.string().optional(),
  criminalRecord: z.boolean().optional(),
  familyAbroad: z.boolean().optional(),
  // Message
  message: z.string().optional(),
  // CV en base64 (optionnel)
  cvBase64: z.string().optional(),
  cvFileName: z.string().optional(),
  cvMimeType: z.string().optional(),
  // Attribution de campagne pour relier l’entrée Facebook/WhatsApp au dossier
  acquisitionSource: acquisitionSourceEnum.default("direct"),
  acquisitionCampaign: z.string().trim().max(160).optional(),
  geminiAnalysisConsent: z.boolean().default(false),
});

// Schéma pour le formulaire multi-projets
const multiProjectEvaluationInput = z.object({
  // Étape 1 : Infos générales
  fullName: z.string().min(2, "Le nom complet est requis"),
  email: z.string().email("Email invalide"),
  whatsappPhone: z.string().min(8, "Numéro WhatsApp invalide"),
  age: z.number().int().min(16).max(100).optional(),
  currentCity: z.string().optional(),
  nationality: z.string().optional(),
  destinationCategory: destinationCategoryEnum,
  destinationCountry: z.string().min(2, "Pays de destination requis"),
  projectType: z.enum(["travail", "etudes", "tourisme"]),

  // Étape 2 : Champs conditionnels
  // TRAVAIL
  sector: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  educationLevel: z.string().optional(),
  languages: z.string().optional(),
  cvAvailable: z.boolean().optional(),

  // ÉTUDES
  diplomaLevel: z.string().optional(),
  averageGrade: z.string().optional(),
  admissionLetter: z.boolean().optional(),
  financialGuarantee: z.string().optional(),
  transcriptAvailable: z.boolean().optional(),

  // TOURISME
  visitReason: z.string().optional(),
  travelHistory: z.string().optional(),
  previousRefusal: z.boolean().optional(),
  socialTies: z.string().optional(),
  cvLink: z.string().url("Lien CV invalide").optional(),
  canadaLanguageTest: z.string().max(500).optional(),
  canadaStudyPlan: z.string().max(1000).optional(),
  luxEmployerStatus: z.enum(["aucun", "candidatures", "contact", "offre"]).optional(),
  luxAademStatus: z.string().max(500).optional(),
  franceProjectStatus: z.string().max(500).optional(),
  belgiumRegion: z.string().max(120).optional(),
  germanyLanguageLevel: z.string().max(120).optional(),
  germanyRecognitionStatus: z.string().max(500).optional(),
  geminiAnalysisConsent: z.boolean().default(false),
  dynamicResponses: z.array(z.object({
    question: z.string().trim().min(3).max(260),
    answer: z.string().trim().min(1).max(1000),
  })).max(5).default([]),
});

export const evaluationRouter = router({
  geminiOrientationPreview: publicProcedure.input(z.object({ destinationCountry: z.string().min(2).max(80), projectType: z.enum(["travail", "etudes", "tourisme"]), nationality: z.string().max(120).optional(), age: z.number().int().min(16).max(100).optional(), sector: z.string().max(300).optional(), yearsOfExperience: z.number().min(0).max(80).optional(), educationLevel: z.string().max(120).optional(), languages: z.string().max(500).optional(), financialGuarantee: z.string().max(500).optional(), countryDetails: z.record(z.string(), z.union([z.string().max(1000), z.number(), z.boolean()])).default({}), consent: z.literal(true) })).mutation(async ({ input }) => {
    const alternatives = (orientationAlternativeCandidates[input.destinationCountry] ?? ["Canada", "France", "Belgique", "Allemagne", "Luxembourg"]).filter((country) => country !== input.destinationCountry);
    return generateGeminiEvaluationDraft({ destinationCountry: input.destinationCountry, projectType: input.projectType, nationality: input.nationality, age: input.age, sector: input.sector, yearsOfExperience: input.yearsOfExperience, educationLevel: input.educationLevel, languages: input.languages, financialGuarantee: input.financialGuarantee, countryDetails: input.countryDetails, alternativeCountries: alternatives });
  }),

  submitEvaluation: publicProcedure
    .input(multiProjectEvaluationInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Base de données non disponible");
      }

      const dossierCode = generateDossierCode();
      const reviewDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      // Créer un enregistrement d'évaluation multi-projets
      const evaluationData = {
        fullName: input.fullName,
        email: input.email,
        phone: input.whatsappPhone,
        nationality: input.nationality,
        cityOfResidence: input.currentCity,
        dateOfBirth: undefined,
        destinationCategory: input.destinationCategory,
        destinationCountry: input.destinationCountry,
        visaType: (input.destinationCountry === "Canada" ? (input.projectType === "travail" ? "canada_travail" : input.projectType === "etudes" ? "canada_etude" : "canada_tourisme") : ["France", "Belgique", "Allemagne", "Luxembourg"].includes(input.destinationCountry) ? (`schengen_${input.projectType === "etudes" ? "etude" : input.projectType}` as const) : "autre") as any,
        projectType: input.projectType,
        projectDetailsJson: JSON.stringify({
          destinationCountry: input.destinationCountry,
          projectType: input.projectType,
          age: input.age,
          cvLink: input.cvLink,
          currentCity: input.currentCity,
          sector: input.sector,
          yearsOfExperience: input.yearsOfExperience,
          languages: input.languages,
          cvAvailable: input.cvAvailable,
          diplomaLevel: input.diplomaLevel,
          averageGrade: input.averageGrade,
          admissionLetter: input.admissionLetter,
          financialGuarantee: input.financialGuarantee,
          transcriptAvailable: input.transcriptAvailable,
          visitReason: input.visitReason,
          travelHistory: input.travelHistory,
          previousRefusal: input.previousRefusal,
          socialTies: input.socialTies,
          canadaLanguageTest: input.canadaLanguageTest,
          canadaStudyPlan: input.canadaStudyPlan,
          luxEmployerStatus: input.luxEmployerStatus,
          luxAademStatus: input.luxAademStatus,
          franceProjectStatus: input.franceProjectStatus,
          belgiumRegion: input.belgiumRegion,
          germanyLanguageLevel: input.germanyLanguageLevel,
          germanyRecognitionStatus: input.germanyRecognitionStatus,
          preparatoryAnalysisConsent: input.geminiAnalysisConsent,
          preparatoryAnalysisConsentRecordedAt: input.geminiAnalysisConsent ? new Date().toISOString() : null,
          dynamicResponses: input.dynamicResponses,
        }),
        cvFileUrl: undefined,
        cvFileName: undefined,
        referenceCode: dossierCode,
        reviewDeadline,
        status: "pending" as const,
      };

      const inserted = await db.insert(evaluations).values(evaluationData).$returningId();
      const evaluationId = inserted[0]?.id;
      if (!evaluationId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La référence d’évaluation n’a pas pu être créée." });
      if (input.geminiAnalysisConsent) {
        const alternatives = (orientationAlternativeCandidates[input.destinationCountry] ?? ["Canada", "France", "Belgique", "Allemagne", "Luxembourg"]).filter((country) => country !== input.destinationCountry);
        const dynamicDetails = Object.fromEntries(input.dynamicResponses.flatMap((response, index) => [
          [`question_complementaire_${index + 1}`, response.question],
          [`reponse_complementaire_${index + 1}`, response.answer],
        ]));
        void (async () => {
          try {
            const draft = await generateGeminiEvaluationDraft({
              destinationCountry: input.destinationCountry,
              projectType: input.projectType,
              nationality: input.nationality,
              age: input.age,
              sector: input.sector,
              yearsOfExperience: input.yearsOfExperience,
              educationLevel: input.educationLevel,
              languages: input.languages,
              financialGuarantee: input.financialGuarantee,
              countryDetails: {
                canadaLanguageTest: input.canadaLanguageTest,
                canadaStudyPlan: input.canadaStudyPlan,
                luxEmployerStatus: input.luxEmployerStatus,
                luxAademStatus: input.luxAademStatus,
                franceProjectStatus: input.franceProjectStatus,
                belgiumRegion: input.belgiumRegion,
                germanyLanguageLevel: input.germanyLanguageLevel,
                germanyRecognitionStatus: input.germanyRecognitionStatus,
                ...dynamicDetails,
              },
              alternativeCountries: alternatives,
            });
            await db.update(evaluations).set({ aiReportContent: JSON.stringify(draft), aiProcessedAt: new Date(), aiProcessingError: null }).where(eq(evaluations.id, evaluationId));
            logger.info("evaluation.preparation_draft.completed", { evaluationId });
          } catch {
            await db.update(evaluations).set({ aiProcessingError: "Brouillon préparatoire indisponible ; revue manuelle requise." }).where(eq(evaluations.id, evaluationId));
            logger.info("evaluation.preparation_draft.unavailable", { evaluationId });
          }
        })();
      }

      // Notifier le propriétaire
      const projectTypeLabels: Record<string, string> = {
        travail: "Visa Travail",
        etudes: "Visa Études",
        tourisme: "Visa Tourisme",
      };

      try {
        await notifyOwner({
          title: `Nouvelle évaluation multi-projets : ${input.fullName}`,
          content: `
**Candidat :** ${input.fullName}
**Email :** ${input.email}
**WhatsApp :** ${input.whatsappPhone}
**Nationalité :** ${input.nationality || "Non précisée"}
**Type de projet :** ${projectTypeLabels[input.projectType]}
**Ville actuelle :** ${input.currentCity || "Non précisée"}
          `.trim(),
        });
      } catch (notifErr) {
        console.warn("[MultiProjectEvaluation] Notification failed:", notifErr);
      }

      const emailSent = await sendEvaluationReceptionEmail({
        to: input.email,
        fullName: input.fullName,
        referenceCode: dossierCode,
        destinationCountry: input.destinationCountry,
      });
      if (emailSent) {
        await db.update(evaluations).set({ receiptSentAt: new Date() }).where(eq(evaluations.id, evaluationId));
      }

      return { success: true, evaluationId, documentUploadToken: createEvaluationUploadToken(evaluationId, input.email), message: "Votre évaluation est reçue et placée en revue humaine.", dossierCode, reviewDeadline, emailSent };
    }),

  uploadSupportingDocument: publicProcedure.input(z.object({ evaluationId: z.number().int().positive(), email: z.string().email(), uploadToken: z.string().min(30), documentType: evaluationDocumentTypeEnum, fileName: z.string().min(1).max(180), mimeType: z.string().refine((value) => ALLOWED_EVALUATION_DOCUMENT_MIME_TYPES.has(value), "Format non autorisé."), sizeBytes: z.number().int().positive().max(MAX_EVALUATION_DOCUMENT_BYTES), fileBase64: z.string().min(8) })).mutation(async ({ input }) => {
    verifyEvaluationUploadToken(input.uploadToken, input.evaluationId, input.email);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données non disponible." });
    const [evaluation] = await db.select({ id: evaluations.id }).from(evaluations).where(and(eq(evaluations.id, input.evaluationId), eq(evaluations.email, input.email))).limit(1);
    if (!evaluation) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
    const base64 = input.fileBase64.includes(",") ? input.fileBase64.split(",")[1] : input.fileBase64;
    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length || buffer.length !== input.sizeBytes || buffer.length > MAX_EVALUATION_DOCUMENT_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier est invalide ou dépasse 10 Mo." });
    if (!hasExpectedEvaluationSignature(input.fileName, input.mimeType, buffer)) throw new TRPCError({ code: "BAD_REQUEST", message: "Le contenu du fichier ne correspond pas au format déclaré." });
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-150) || "document";
    const stored = await storagePut(`evaluation-documents/${input.evaluationId}/${Date.now()}-${safeName}`, buffer, input.mimeType);
    const result = await db.insert(clientDocuments).values({ evaluationId: input.evaluationId, candidateEmail: input.email.toLowerCase(), documentType: input.documentType, documentName: safeName, documentUrl: stored.url, fileSize: buffer.length, source: "online", receivedByAdmin: false }).$returningId();
    return { success: true, documentId: result[0]?.id, documentName: safeName };
  }),

  submit: publicProcedure
    .input(evaluationInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Base de données non disponible");
      }

      // Règle des 2 évaluations gratuites maximum, par adresse email.
      const previousCount = await db.select().from(evaluations).where(eq(evaluations.email, input.email));
      if (previousCount.length >= 2) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "⚠️ Vous avez atteint la limite maximale de 2 évaluations gratuites. Pour toute analyse complémentaire ou pour faire le point sur votre dossier, veuillez contacter directement notre direction au +237 698 104 832 ou vous rendre en agence à Biyem-Assi (Yaoundé).",
        });
      }

      let cvFileUrl: string | undefined;
      let cvFileName: string | undefined;

      // Upload du CV si fourni
      if (input.cvBase64 && input.cvFileName) {
        try {
          const base64Data = input.cvBase64.includes(",")
            ? input.cvBase64.split(",")[1]
            : input.cvBase64;
          const fileBuffer = Buffer.from(base64Data!, "base64");
          const mimeType = input.cvMimeType || "application/octet-stream";
          const safeFileName = input.cvFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storageKey = `cv-uploads/${Date.now()}_${safeFileName}`;

          const { url } = await storagePut(storageKey, fileBuffer, mimeType);
          cvFileUrl = url;
          cvFileName = input.cvFileName;
        } catch (err) {
          console.error("[Evaluation] CV upload failed:", err);
          // On continue sans le CV si l'upload échoue
        }
      }

      const dossierCode = generateDossierCode();
      const reviewDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      // Insérer en base de données
      const inserted = await db.insert(evaluations).values({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        acquisitionSource: input.acquisitionSource,
        acquisitionCampaign: input.acquisitionCampaign,
        dateOfBirth: input.dateOfBirth,
        nationality: input.nationality,
        cityOfResidence: input.cityOfResidence,
        maritalStatus: input.maritalStatus,
        numberOfDependents: input.numberOfDependents,
        educationLevel: input.educationLevel,
        diplomaTitle: input.diplomaTitle,
        graduationYear: input.graduationYear,
        fieldOfStudy: input.fieldOfStudy,
        employmentStatus: input.employmentStatus,
        currentJobTitle: input.currentJobTitle,
        yearsOfExperience: input.yearsOfExperience,
        industrySector: input.industrySector,
        mainTasks: input.mainTasks,
        frenchLevel: input.frenchLevel,
        englishLevel: input.englishLevel,
        languageTestsTaken: input.languageTestsTaken,
        destinationCategory: input.destinationCategory,
        destinationCountry: input.destinationCountry,
        visaType: input.visaType,
        travelReason: input.travelReason,
        availableBudget: input.availableBudget,
        projectType: input.projectType,
        projectDetailsJson: input.projectDetails || input.geminiAnalysisConsent ? JSON.stringify({
          ...(input.projectDetails ?? {}),
          preparatoryAnalysisConsent: input.geminiAnalysisConsent,
          preparatoryAnalysisConsentRecordedAt: input.geminiAnalysisConsent ? new Date().toISOString() : null,
        }) : undefined,
        priorVisaRefusal: input.priorVisaRefusal,
        priorVisaRefusalCountry: input.priorVisaRefusalCountry,
        criminalRecord: input.criminalRecord,
        familyAbroad: input.familyAbroad,
        message: input.message,
        cvFileUrl: cvFileUrl,
        cvFileName: cvFileName,
        referenceCode: dossierCode,
        reviewDeadline,
        status: "pending",
      }).$returningId();

      const evaluationId = inserted[0]?.id;

      // Le parcours historique est conservé, mais aucun score ni rapport
      // OpenAI n’est plus produit. Le brouillon Gemini est facultatif,
      // expressément consenti et ne reçoit jamais le CV ou une pièce jointe.
      if (evaluationId && input.geminiAnalysisConsent && input.projectType && ["travail", "etudes", "tourisme"].includes(input.projectType)) {
        const projectType = input.projectType as "travail" | "etudes" | "tourisme";
        const destinationCountry = input.destinationCountry || input.destinationCategory;
        const alternatives = (orientationAlternativeCandidates[destinationCountry ?? ""] ?? ["Canada", "France", "Belgique", "Allemagne", "Luxembourg"]).filter((country) => country !== destinationCountry);
        (async () => {
          try {
            const draft = await generateGeminiEvaluationDraft({
              destinationCountry,
              projectType,
              nationality: input.nationality,
              sector: input.industrySector || input.currentJobTitle,
              yearsOfExperience: input.yearsOfExperience ? Number(input.yearsOfExperience) : undefined,
              educationLevel: input.educationLevel,
              languages: [input.frenchLevel, input.englishLevel, input.languageTestsTaken].filter(Boolean).join(", "),
              financialGuarantee: input.availableBudget,
              countryDetails: input.projectDetails ?? {},
              alternativeCountries: alternatives,
            });
            await db.update(evaluations).set({
              aiReportContent: JSON.stringify(draft),
              aiProcessedAt: new Date(),
              aiProcessingError: null,
            }).where(eq(evaluations.id, evaluationId));
            logger.info("evaluation.preparation_draft.completed", { evaluationId });
          } catch {
            try {
              await db.update(evaluations).set({ aiProcessingError: "Brouillon préparatoire indisponible ; revue manuelle requise." }).where(eq(evaluations.id, evaluationId));
            } catch {}
          }
        })();
      }

      // Notifier le propriétaire du site
      const visaLabels: Record<string, string> = {
        schengen_etude: "Schengen - Visa Étude",
        schengen_tourisme: "Schengen - Visa Tourisme",
        schengen_travail: "Schengen - Visa Travail",
        canada_rp: "Canada - Résidence Permanente",
        canada_etude: "Canada - Visa Étude",
        canada_tourisme: "Canada - Visa Tourisme",
        autre: "Autre pays",
      };

      try {
        await notifyOwner({
          title: `Nouvelle pré-évaluation : ${input.fullName}`,
          content: `
**Candidat :** ${input.fullName}
**Email :** ${input.email}
**Téléphone :** ${input.phone}
**Nationalité :** ${input.nationality || "Non précisée"}
**Type de visa :** ${visaLabels[input.visaType] || input.visaType}
**Pays de destination :** ${input.destinationCountry || input.destinationCategory}
**Niveau d'études :** ${input.educationLevel || "Non précisé"}
**Situation professionnelle :** ${input.employmentStatus || "Non précisée"}
**CV joint :** ${cvFileName ? `Oui (${cvFileName})` : "Non"}
**Message :** ${input.message || "Aucun message"}
          `.trim(),
        });
      } catch (notifErr) {
        console.warn("[Evaluation] Notification failed:", notifErr);
      }

      const emailSent = await sendEvaluationReceptionEmail({
        to: input.email,
        fullName: input.fullName,
        referenceCode: dossierCode,
        destinationCountry: input.destinationCountry,
      });
      if (emailSent && evaluationId) {
        await db.update(evaluations).set({ receiptSentAt: new Date() }).where(eq(evaluations.id, evaluationId));
      }

      return { success: true, message: "Votre évaluation est reçue et placée en revue humaine.", emailSent, dossierCode, reviewDeadline };
    }),

  /** Évaluations du candidat connecté : uniquement les éléments de suivi
   * nécessaires et la réponse effectivement validée par un conseiller. */
  getMyEvaluations: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Base de données non disponible");

    const rows = await db.select().from(evaluations)
      .where(eq(evaluations.email, ctx.candidate.email))
      .orderBy(evaluations.createdAt);

    return rows.map((evaluation) => ({
      id: evaluation.id,
      referenceCode: evaluation.referenceCode,
      destinationCategory: evaluation.destinationCategory,
      destinationCountry: evaluation.destinationCountry,
      projectType: evaluation.projectType,
      status: evaluation.status,
      createdAt: evaluation.createdAt,
      receiptSentAt: evaluation.receiptSentAt,
      reviewDeadline: evaluation.reviewDeadline,
      reviewedAt: evaluation.reviewedAt,
      reviewedBy: evaluation.reviewedBy,
      secondReviewRequired: evaluation.secondReviewRequired,
      secondReviewedAt: evaluation.secondReviewedAt,
      secondReviewedBy: evaluation.secondReviewedBy,
      finalReviewedAt: evaluation.secondReviewRequired ? evaluation.secondReviewedAt : evaluation.reviewedAt,
      finalReviewedBy: evaluation.secondReviewRequired ? evaluation.secondReviewedBy : evaluation.reviewedBy,
      finalResponseSentAt: evaluation.finalResponseSentAt,
      reviewDraft: evaluation.finalResponseSentAt && (!evaluation.secondReviewRequired || evaluation.secondReviewedAt) ? evaluation.reviewDraft : null,
    }));
  }),

  /**
   * Liste des pré-évaluations pour le tableau de bord admin, avec le statut
   * de l'analyse IA automatique (terminée / en cours / échouée).
   */
  listForAdmin: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new Error("Base de données non disponible");

      const rows = await db.select().from(evaluations).orderBy(evaluations.createdAt);
      const total = rows.length;
      const page = rows.slice(input.offset, input.offset + input.limit).reverse();

      return { items: page, total };
    }),

  /** Analyse temporaire d'un CV pour pré-remplir le formulaire, sans créer
   * de dossier, stocker de document ni envoyer de demande. */
  extractFromCV: publicProcedure
    .input(z.object({
      cvBase64: z.string().min(32).max(7_200_000),
      cvMimeType: z.enum(["application/pdf", "image/png", "image/jpeg", "image/jpg"]).optional(),
      selectedPages: z.array(z.number().int().min(1).max(200)).min(1).max(20).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const mimeType = input.cvMimeType === "image/jpg" ? "image/jpeg" : (input.cvMimeType ?? "application/pdf");
        const base64Data = input.cvBase64.includes(",") ? input.cvBase64.split(",")[1] : input.cvBase64;
        const cvBuffer = Buffer.from(base64Data ?? "", "base64");
        const isPdf = mimeType === "application/pdf";
        const isPng = mimeType === "image/png" && cvBuffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        const isJpeg = mimeType === "image/jpeg" && cvBuffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
        if (!cvBuffer.length || cvBuffer.length > 5 * 1024 * 1024 || (isPdf && cvBuffer.subarray(0, 4).toString() !== "%PDF") || (!isPdf && !isPng && !isJpeg)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CV PDF, JPG ou PNG invalide ou trop volumineux." });
        }
        if (isPdf) {
          const totalPages = await getPdfPageCount(cvBuffer);
          const selectedPages = input.selectedPages?.filter((page, index, pages) => pages.indexOf(page) === index).sort((a, b) => a - b);
          if (selectedPages?.some((page) => page > totalPages)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Sélection de pages invalide : ce CV contient ${totalPages} page(s).` });
          }
          const cvText = await extractTextFromPDF(cvBuffer, selectedPages);
          if (cvText.trim().length < 20) {
            return { success: false, fields: {}, prefilledCount: 0, message: "Le texte du CV n’a pas pu être lu. Vous pouvez compléter le formulaire manuellement." };
          }
          const fields = (await extractCVFieldsForForm(cvText)) ?? {};
          return { success: true, source: "pdf" as const, analysedPages: selectedPages ?? Array.from({ length: totalPages }, (_, index) => index + 1), fields, prefilledCount: Object.keys(fields).length };
        }
        const fields = (await extractCVFieldsFromImage(`data:${mimeType};base64,${base64Data}`)) ?? {};
        return { success: true, source: "image" as const, fields, prefilledCount: Object.keys(fields).length };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("evaluation.cv_prefill.failed", {}, error);
        return { success: false, fields: {}, prefilledCount: 0, message: "L’analyse automatique n’est pas disponible. Vous pouvez compléter le formulaire manuellement." };
      }
    }),

  /** Lit le nombre de pages pour laisser le candidat choisir un sous-ensemble avant extraction. */
  inspectPdfPages: publicProcedure
    .input(z.object({ cvBase64: z.string().min(32).max(7_200_000) }))
    .mutation(async ({ input }) => {
      const base64Data = input.cvBase64.includes(",") ? input.cvBase64.split(",")[1] : input.cvBase64;
      const cvBuffer = Buffer.from(base64Data ?? "", "base64");
      if (!cvBuffer.length || cvBuffer.length > 5 * 1024 * 1024 || cvBuffer.subarray(0, 4).toString() !== "%PDF") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CV PDF invalide ou trop volumineux." });
      }
      const totalPages = await getPdfPageCount(cvBuffer);
      return { totalPages: Math.min(totalPages, 200) };
    }),
});
