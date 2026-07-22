import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { evaluations } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { notifyOwner } from "../_core/notification";
import { generateAIEvaluationReport, extractTextFromPDF } from "../aiEvaluationService";
import { sendEvaluationReportEmail } from "../emailService";

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

export const evaluationRouter = router({
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

      // Générer le rapport IA automatique
      let aiReport: string | undefined;
      let aiError: string | undefined;
      try {
        let cvText = "";
        // Extraire le texte du CV si fourni
        if (input.cvBase64) {
          try {
            const base64Data = input.cvBase64.includes(",")
              ? input.cvBase64.split(",")[1]
              : input.cvBase64;
            const fileBuffer = Buffer.from(base64Data!, "base64");
            cvText = await extractTextFromPDF(fileBuffer);
          } catch {
            cvText = `Candidat: ${input.fullName}, Destination: ${input.destinationCountry || input.destinationCategory}, Niveau: ${input.educationLevel || "non précisé"}`;
          }
        } else {
          cvText = `Candidat: ${input.fullName}, Destination: ${input.destinationCountry || input.destinationCategory}, Niveau: ${input.educationLevel || "non précisé"}, Emploi: ${input.employmentStatus || "non précisé"}, Message: ${input.message || "aucun"}`;
        }

        const destination = input.destinationCountry || input.destinationCategory;
        aiReport = await generateAIEvaluationReport(
          cvText,
          input.fullName,
          destination,
          process.env.OPENAI_API_KEY
        );

        // Envoyer le rapport par email
        if (aiReport) {
          try {
            const dossierNum = `3M-EVAL-${Date.now().toString().slice(-6)}`;
            await sendEvaluationReportEmail(input.email, input.fullName, dossierNum, aiReport);
          } catch (emailErr) {
            console.warn("[Evaluation] Email send failed:", emailErr);
          }
        }
      } catch (err) {
        console.error("[Evaluation] AI report generation failed:", err);
        aiError = "Rapport en cours de préparation par notre équipe.";
      }

      return {
        success: true,
        message: aiReport
          ? "Votre rapport d'évaluation a été généré avec succès."
          : "Votre demande a été soumise avec succès.",
        report: aiReport,
        aiError,
      };
    }),
});
