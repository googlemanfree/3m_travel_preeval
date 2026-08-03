import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { evaluations } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { notifyOwner } from "../_core/notification";
import { generateDossierCode } from "../utils/generateDossierCode";
import { getConfirmationEmailHTML, getConfirmationEmailText } from "../utils/confirmationEmail";
import { sendEmail } from "../_core/email";

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

const evaluationInput = z.object({
  // Informations personnelles
  fullName: z.string().min(2, "Le nom complet est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  // Destination
  destinationCategory: destinationCategoryEnum,
  destinationCountry: z.string().optional(),
  visaType: visaTypeEnum,
  // Profil
  educationLevel: z.string().optional(),
  employmentStatus: z.string().optional(),
  // Message
  message: z.string().optional(),
  // CV en base64 (optionnel)
  cvBase64: z.string().optional(),
  cvFileName: z.string().optional(),
  cvMimeType: z.string().optional(),
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
      await db.insert(evaluations).values({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        nationality: input.nationality,
        destinationCategory: input.destinationCategory,
        destinationCountry: input.destinationCountry,
        visaType: input.visaType,
        educationLevel: input.educationLevel,
        employmentStatus: input.employmentStatus,
        message: input.message,
        cvFileUrl: cvFileUrl,
        cvFileName: cvFileName,
        status: "pending",
      });

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

      return { success: true, message: "Votre demande a été soumise avec succès." };
    }),
});
