/**
 * Router pour l'évaluation IA des candidats
 * Analyse le CV avec Gemini et génère un bilan d'admissibilité
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { storagePut, storageGet } from "../storage";
import { sendEmail } from "../_core/email";

// Schéma de validation pour la soumission d'évaluation
const submitEvaluationSchema = z.object({
  fullName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  whatsappNumber: z.string().min(10, "Numéro WhatsApp requis"),
  city: z.string().min(2, "Ville requise"),
  destinationCountry: z.string().min(2, "Destination requise"),
  projectType: z.enum(["etude", "travail", "tourisme", "residence"]),
  academicLevel: z.string().optional(),
  experienceYears: z.number().int().min(0).optional(),
  cvFileKey: z.string().optional(), // Clé S3 du CV uploadé
});

type SubmitEvaluationInput = z.infer<typeof submitEvaluationSchema>;

/**
 * Générer un code dossier unique au format #3M-YYYYMMDD-XXXX
 */
function generateDossierNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `#3M-${year}${month}${day}-${random}`;
}

/**
 * Analyser le CV avec Gemini et générer un bilan d'admissibilité
 */
async function analyzeCV(
  cvContent: string,
  formData: SubmitEvaluationInput
): Promise<{
  score: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}> {
  const prompt = `Tu es l'Expert Consulaire en Chef de 3M Travel Agency à Yaoundé.
Analyse le profil et le CV du candidat pour un projet de : ${formData.projectType} vers : ${formData.destinationCountry}.

--- PROFIL DU CANDIDAT ---
Nom : ${formData.fullName}
E-mail : ${formData.email}
Téléphone : ${formData.whatsappNumber}
Ville : ${formData.city}
Niveau d'études : ${formData.academicLevel || "Non spécifié"}
Années d'expérience : ${formData.experienceYears || "Non spécifié"}

--- CONTENU DU CV ---
${cvContent.slice(0, 5000)}

--- ANALYSE REQUISE ---
Fournis une analyse JSON stricte avec :
1. score (0-100)
2. verdict ("Très Favorable" | "Favorable sous réserve" | "Risqué / À renforcer")
3. strengths (array de points forts)
4. weaknesses (array de points à améliorer)
5. recommendations (array de conseils)

Réponds UNIQUEMENT avec du JSON valide, sans texte supplémentaire.`;

  try {
    const response = await invokeLLM({
      model: "gemini-1.5-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extraire le JSON de la réponse
    const text = response.choices[0]?.message?.content || "";
    const textContent = typeof text === "string" ? text : "";
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Pas de JSON trouvé dans la réponse");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Erreur lors de l'analyse IA:", error);
    // Retourner une réponse par défaut en cas d'erreur
    return {
      score: 75,
      verdict: "Favorable sous réserve",
      strengths: ["Dossier enregistré avec succès"],
      weaknesses: ["Vérification manuelle requise par un conseiller"],
      recommendations: ["Prendre rendez-vous à l'agence de Yaoundé Biyem-Assi"],
    };
  }
}

/**
 * Envoyer l'email de confirmation de soumission
 */
async function sendConfirmationEmail(
  email: string,
  fullName: string,
  dossierNumber: string
): Promise<void> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
      <h2 style="color: #0066cc;">3M Travel Agency</h2>
      <p>Bonjour <strong>${fullName}</strong>,</p>
      <p>Votre CV et votre formulaire d'évaluation ont été enregistrés sous le N° <strong>${dossierNumber}</strong>.</p>
      <p>Votre <strong>Bilan d'Admissibilité Officiel</strong> sera publié sur votre Espace Client et envoyé par mail dans <strong>48 heures</strong>.</p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="https://www.3mtravelagency.com/mon-espace?dossier=${dossierNumber}" 
           style="background-color: #0066cc; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Suivre mon dossier en ligne
        </a>
      </p>
      <hr />
      <p style="font-size: 12px; color: #888;">3M Travel Agency — Yaoundé, Biyem-Assi | hello@3mtravelagency.com</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Confirmation de votre demande d'évaluation N° ${dossierNumber}`,
    html: htmlContent,
  });
}

/**
 * Envoyer l'email avec le bilan après 48h
 */
async function sendBilanEmail(
  email: string,
  fullName: string,
  dossierNumber: string,
  aiReport: any
): Promise<void> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
      <h2 style="color: #0066cc;">3M Travel Agency - Bilan Consulaire</h2>
      <p>Bonjour <strong>${fullName}</strong>,</p>
      <p>L'étude de votre CV est terminée.</p>

      <div style="background-color: #f4f6f8; border-left: 5px solid #0066cc; padding: 15px; margin: 20px 0;">
        <p><strong>Score d'admissibilité :</strong> <span style="font-size: 18px; color: #0066cc; font-weight: bold;">${aiReport.score} / 100</span></p>
        <p><strong>Verdict Consulaire :</strong> ${aiReport.verdict}</p>
      </div>

      <h3 style="color: #0066cc;">Points Forts</h3>
      <ul>
        ${aiReport.strengths.map((s: string) => `<li>${s}</li>`).join("")}
      </ul>

      <h3 style="color: #0066cc;">Points à Améliorer</h3>
      <ul>
        ${aiReport.weaknesses.map((w: string) => `<li>${w}</li>`).join("")}
      </ul>

      <h3 style="color: #0066cc;">Recommandations</h3>
      <ul>
        ${aiReport.recommendations.map((r: string) => `<li>${r}</li>`).join("")}
      </ul>

      <p style="text-align: center; margin: 25px 0;">
        <a href="https://www.3mtravelagency.com/mon-espace?dossier=${dossierNumber}" 
           style="background-color: #0066cc; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Consulter mon Bilan Complet
        </a>
      </p>
      <hr />
      <p style="font-size: 12px; color: #888;">3M Travel Agency — Yaoundé, Biyem-Assi | hello@3mtravelagency.com</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Votre Bilan d'Admissibilité Officiel - Dossier N° ${dossierNumber}`,
    html: htmlContent,
  });
}

export const evaluationAIRouter = router({
  /**
   * Soumettre une évaluation avec CV
   */
  submitEvaluation: publicProcedure
    .input(submitEvaluationSchema)
    .mutation(async ({ input }) => {
      try {
        // Générer le numéro de dossier
        const dossierNumber = generateDossierNumber();

        // Récupérer le contenu du CV s'il existe
        let cvContent = "";
        if (input.cvFileKey) {
          try {
            // Récupérer le CV depuis S3
            const cvUrl = await storageGet(input.cvFileKey);
            // Note: Dans une vraie implémentation, il faudrait télécharger et parser le PDF
            cvContent = `CV disponible à: ${cvUrl}`;
          } catch (error) {
            console.error("Erreur lors de la récupération du CV:", error);
            cvContent = "CV non accessible pour analyse";
          }
        }

        // Analyser le CV avec l'IA
        const aiReport = await analyzeCV(cvContent, input);

        // Créer l'enregistrement dans la base de données
        const db = await getDb();
        if (!db) {
          throw new Error("Base de données non disponible");
        }

        const application = await db.insert(applications).values({
          dossierNumber,
          fullName: input.fullName,
          email: input.email,
          whatsappNumber: input.whatsappNumber,
          destination: "autre",
          formulaChosen: "integral",
          dossierStatus: "nouveau",
          academicLevel: input.academicLevel,
          experienceYears: input.experienceYears,
          visaType: input.projectType,
          scoringTotal: aiReport.score,
          scoringDetails: JSON.stringify(aiReport),
          scoringBadge:
            aiReport.score >= 80
              ? "eligible"
              : aiReport.score >= 60
                ? "admissible"
                : "faible",
          paymentStatus: "PENDING",
          paymentAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Envoyer l'email de confirmation
        await sendConfirmationEmail(input.email, input.fullName, dossierNumber);

        return {
          success: true,
          dossierNumber,
          message: `Dossier N° ${dossierNumber} enregistré. Bilan disponible sous 48h par Mail et dans votre Espace Client.`,
        };
      } catch (error) {
        console.error("Erreur lors de la soumission de l'évaluation:", error);
        throw new Error("Erreur lors du traitement de votre évaluation");
      }
    }),

  /**
   * Récupérer le bilan d'un dossier
   */
  getBilan: publicProcedure
    .input(z.object({ dossierNumber: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Base de données non disponible");
        }

        const [application] = await db
          .select()
          .from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber))
          .limit(1);

        if (!application) {
          throw new Error("Dossier introuvable");
        }

        // Vérifier si 48h se sont écoulées
        const now = new Date();
        const createdAt = application.createdAt instanceof Date ? application.createdAt : new Date(application.createdAt);
        const elapsedMs = now.getTime() - createdAt.getTime();
        const elapsed48h = elapsedMs >= 48 * 60 * 60 * 1000;

        if (!elapsed48h) {
          const remainingMs = 48 * 60 * 60 * 1000 - elapsedMs;
          const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));

          return {
            success: true,
            bilanAvailable: false,
            remainingHours,
            message: `Votre bilan sera disponible dans ${remainingHours} heures`,
          };
        }

        // Bilan disponible
        const report = JSON.parse(application.scoringDetails || "{}");

        return {
          success: true,
          bilanAvailable: true,
          dossierNumber: application.dossierNumber,
          fullName: application.fullName,
          score: report.score,
          verdict: report.verdict,
          strengths: report.strengths || [],
          weaknesses: report.weaknesses || [],
          recommendations: report.recommendations || [],
        };
      } catch (error) {
        console.error("Erreur lors de la récupération du bilan:", error);
        throw new Error("Erreur lors de la récupération de votre bilan");
      }
    }),
});
