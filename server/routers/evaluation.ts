import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { evaluations } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { notifyOwner } from "../_core/notification";
import { generateDossierCode } from "../utils/generateDossierCode";
import { getConfirmationEmailHTML, getConfirmationEmailText } from "../utils/confirmationEmail";
import { sendEmail } from "../_core/email";
import { extractCVFieldsForForm, extractCVFieldsFromImage, extractTextFromPDF, generateAIEvaluationReport, getPdfPageCount } from "../aiEvaluationService";
import { computeDestinationScore } from "../destinationScoringEngine";
import { logger } from "../_core/logger";
import { eq } from "drizzle-orm";
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
});

// Schéma pour le formulaire multi-projets
const multiProjectEvaluationInput = z.object({
  // Étape 1 : Infos générales
  fullName: z.string().min(2, "Le nom complet est requis"),
  email: z.string().email("Email invalide"),
  whatsappPhone: z.string().min(8, "Numéro WhatsApp invalide"),
  currentCity: z.string().optional(),
  nationality: z.string().optional(),
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
});

export const evaluationRouter = router({
  submitEvaluation: publicProcedure
    .input(multiProjectEvaluationInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Base de données non disponible");
      }

      // Créer un enregistrement d'évaluation multi-projets
      const evaluationData = {
        fullName: input.fullName,
        email: input.email,
        phone: input.whatsappPhone,
        nationality: input.nationality,
        dateOfBirth: undefined,
        destinationCategory: "autre" as const,
        destinationCountry: undefined,
        visaType: "autre" as const,
        educationLevel: input.educationLevel,
        employmentStatus: undefined,
        message: JSON.stringify({
          projectType: input.projectType,
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
        }),
        cvFileUrl: undefined,
        cvFileName: undefined,
        status: "pending" as const,
      };

      await db.insert(evaluations).values(evaluationData);

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

      // Générer le code dossier
      const dossierCode = generateDossierCode();

      // Envoyer l'email de confirmation
      try {
        const emailHTML = getConfirmationEmailHTML({
          fullName: input.fullName,
          dossierCode,
          projectType: input.projectType,
        });
        await sendEmail({
          to: input.email,
          subject: `Confirmation - Numéro de dossier ${dossierCode}`,
          html: emailHTML,
        });
      } catch (emailErr) {
        console.warn("[MultiProjectEvaluation] Email confirmation failed:", emailErr);
      }

      return { success: true, message: "Votre demande a été soumise avec succès. Vérifiez votre email pour le numéro de dossier.", dossierCode };
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
          message: "⚠️ Vous avez atteint la limite maximale de 2 évaluations gratuites. Pour toute analyse complémentaire ou pour faire le point sur votre dossier, veuillez contacter directement notre direction au +1 672 897 2999 ou vous rendre en agence à Biyem-Assi (Yaoundé).",
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
        projectDetailsJson: input.projectDetails ? JSON.stringify(input.projectDetails) : undefined,
        priorVisaRefusal: input.priorVisaRefusal,
        priorVisaRefusalCountry: input.priorVisaRefusalCountry,
        criminalRecord: input.criminalRecord,
        familyAbroad: input.familyAbroad,
        message: input.message,
        cvFileUrl: cvFileUrl,
        cvFileName: cvFileName,
        status: "pending",
      }).$returningId();

      const evaluationId = inserted[0]?.id;

      // Scoring déterministe par pays + rapport IA explicatif. Le calcul est
      // lancé en arrière-plan pour ne pas ralentir la confirmation de dépôt.
      // Aucun nouveau champ SQL n'est requis : le score et sa grille sont
      // conservés au début de aiReportContent, puis affichés dans l'espace
      // candidat avec le rapport généré.
      if (evaluationId) {
        (async () => {
          try {
            const scoring = computeDestinationScore({
              destinationCategory: input.destinationCategory,
              destinationCountry: input.destinationCountry,
              educationLevel: input.educationLevel,
              yearsOfExperience: input.yearsOfExperience,
              frenchLevel: input.frenchLevel,
              englishLevel: input.englishLevel,
              currentJobTitle: input.currentJobTitle,
              industrySector: input.industrySector,
              priorVisaRefusal: input.priorVisaRefusal,
              criminalRecord: input.criminalRecord,
              familyAbroad: input.familyAbroad,
            });

            let cvText = "";
            if (input.cvBase64) {
              const base64Data = input.cvBase64.includes(",") ? input.cvBase64.split(",")[1] : input.cvBase64;
              const cvBuffer = Buffer.from(base64Data!, "base64");
              cvText = await extractTextFromPDF(cvBuffer);
            }

            const scoreSummary = [
              `SCORE D'ADMISSIBILITÉ : ${scoring.scoreTotal}/100`,
              `STATUT : ${scoring.statusLabel}`,
              `STRATÉGIE : ${scoring.strategyType}`,
              "DÉTAIL DU SCORE :",
              ...scoring.breakdown.map((item) => `- ${item.label}: ${item.points}/${item.max}`),
              `VOIE RECOMMANDÉE : ${scoring.recommendedPath}`,
              `CONTEXTE : ${scoring.legalContext}`,
              "DOCUMENTS À PRÉPARER :",
              ...scoring.documentChecklist.map((document) => `- ${document}`),
            ].join("\\n");

            const openaiKey = process.env.OPENAI_API_KEY;
            const contextForAI = `${cvText || "CV non fourni — analyse basée sur les informations déclarées."}\\n\\n--- SCORE VÉRIFIABLE ---\\n${scoreSummary}`;
            const report = await generateAIEvaluationReport(
              contextForAI,
              input.fullName,
              input.destinationCountry || input.destinationCategory,
              openaiKey
            );

            await db.update(evaluations).set({
              aiReportContent: `${scoreSummary}\n\n--- ANALYSE DU DOSSIER ---\n${report}`,
              aiProcessedAt: new Date(),
              aiProcessingError: null,
            }).where(eq(evaluations.id, evaluationId));
            logger.info("evaluation.ai_analysis.completed", { evaluationId, score: scoring.scoreTotal, strategy: scoring.strategyType });
          } catch (err) {
            logger.error("evaluation.ai_analysis.failed", { evaluationId }, err);
            try {
              await db.update(evaluations).set({ aiProcessingError: err instanceof Error ? err.message : String(err) }).where(eq(evaluations.id, evaluationId));
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

      let emailSent = false;
      try {
        await sendEmail({
          to: input.email,
          subject: "Confirmation de réception de votre évaluation — 3M Travel & Services",
          html: `<p>Bonjour <strong>${input.fullName}</strong>,</p><p>Nous avons bien reçu votre évaluation de profil${input.destinationCountry ? ` pour ${input.destinationCountry}` : ""}.</p><p>Votre demande est enregistrée. Le résultat sera disponible dans votre espace candidat et notre équipe vous recontactera si nécessaire.</p><p>Cordialement,<br>L’équipe 3M Travel & Services</p>`,
        });
        emailSent = true;
      } catch (emailErr) {
        logger.error("evaluation.candidate_confirmation_failed", { email: input.email }, emailErr);
      }

      return { success: true, message: "Votre demande a été soumise avec succès.", emailSent };
    }),

  /**
   * Évaluations (pré-évaluations générales) du candidat connecté, avec le
   * rapport IA quand il est disponible — pour "Mon Espace".
   */
  getMyEvaluations: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Base de données non disponible");

    const rows = await db.select().from(evaluations)
      .where(eq(evaluations.email, ctx.candidate.email))
      .orderBy(evaluations.createdAt);

    return rows;
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
