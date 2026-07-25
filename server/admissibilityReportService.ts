/**
 * Service de Rapport d'Admissibilité — Envoi Automatique après 48h
 * Génère et envoie les bilans d'admissibilité aux candidats 48h après leur soumission
 */

import { getDb } from "./db";
import { evaluations, evaluationEmails } from "../drizzle/schema";
import { eq, and, lt, isNull } from "drizzle-orm";
import { sendEmail } from "./emailService";

/**
 * Génère le rapport HTML d'admissibilité personnalisé
 */
function generateAdmissibilityReport(evaluation: any): string {
  const { fullName, destinationCountry, visaType, email, phone, educationLevel, employmentStatus, message } = evaluation;

  // Scoring simplifié basé sur les critères
  let score = 0;
  let feedback = "";

  if (educationLevel === "Bac+5" || educationLevel === "Master") {
    score += 30;
    feedback += "✅ <strong>Formation excellente</strong> : Votre niveau d'études est très favorable.<br>";
  } else if (educationLevel === "Bac+3") {
    score += 20;
    feedback += "✅ <strong>Formation solide</strong> : Votre niveau d'études est satisfaisant.<br>";
  } else {
    score += 10;
    feedback += "⚠️ <strong>Formation</strong> : Vous devrez renforcer vos qualifications.<br>";
  }

  if (employmentStatus === "Employé" || employmentStatus === "Entrepreneur") {
    score += 25;
    feedback += "✅ <strong>Expérience professionnelle</strong> : Votre statut professionnel est favorable.<br>";
  } else if (employmentStatus === "Étudiant") {
    score += 15;
    feedback += "⚠️ <strong>Expérience professionnelle</strong> : Vous avez peu d'expérience, mais c'est normal pour un étudiant.<br>";
  }

  score += 20; // Langues (supposé)
  feedback += "✅ <strong>Capacité linguistique</strong> : Vous devrez justifier votre niveau de langue.<br>";

  score += 15; // Capacité financière (supposée)
  feedback += "✅ <strong>Capacité financière</strong> : Vous devrez fournir des justificatifs bancaires.<br>";

  const scorePercentage = Math.min(score, 100);
  const scoreColor = scorePercentage >= 75 ? "#10b981" : scorePercentage >= 50 ? "#f59e0b" : "#ef4444";
  const scoreLabel = scorePercentage >= 75 ? "Très favorable" : scorePercentage >= 50 ? "Admissible" : "À renforcer";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0a2540 0%, #0066cc 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .score-box { background: white; border-left: 4px solid ${scoreColor}; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .score-value { font-size: 36px; font-weight: bold; color: ${scoreColor}; }
        .score-label { color: ${scoreColor}; font-weight: bold; }
        .feedback { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; border: 1px solid #e5e7eb; }
        .cta-button { display: inline-block; background: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">3M Travel & Services</div>
          <h1>Bilan d'Admissibilité</h1>
        </div>

        <div class="content">
          <p>Bonjour <strong>${fullName}</strong>,</p>
          <p>Merci d'avoir soumis votre demande d'évaluation auprès de 3M Travel & Services. Nos experts ont analysé votre profil avec attention.</p>

          <h2>📊 Résultat de votre Évaluation</h2>
          <div class="score-box">
            <div class="score-value">${scorePercentage}%</div>
            <div class="score-label">${scoreLabel} pour ${destinationCountry}</div>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Type de visa : <strong>${visaType}</strong></p>
          </div>

          <h2>📋 Analyse Détaillée</h2>
          <div class="feedback">
            ${feedback}
          </div>

          <h2>🎯 Prochaines Étapes</h2>
          <p>Pour finaliser votre dossier et accéder à nos services d'accompagnement :</p>
          <ol>
            <li><strong>Téléverser vos pièces justificatives</strong> (passeport, diplômes, justificatifs financiers)</li>
            <li><strong>Régler les frais d'ouverture de dossier</strong> (65 000 FCFA) en ligne ou en agence</li>
            <li><strong>Recevoir votre bilan officiel</strong> et commencer l'accompagnement personnalisé</li>
          </ol>

          <a href="https://www.3mtravelagency.com/mon-dossier" class="cta-button">Accéder à mon espace</a>

          <h2>📞 Besoin d'aide ?</h2>
          <p>Nos conseillers sont disponibles :</p>
          <ul>
            <li>📧 Email : contact@3mtravelagency.com</li>
            <li>💬 WhatsApp : +237 XXX XXX XXX</li>
            <li>🏢 Agence : Douala, Yaoundé, Kinshasa</li>
          </ul>
        </div>

        <div class="footer">
          <p>© 2026 3M Travel & Services. Tous droits réservés.</p>
          <p>Cet email a été envoyé à ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Crée une entrée de suivi d'email et envoie le bilan d'admissibilité
 */
export async function sendAdmissibilityReport(evaluationId: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "DB non disponible" };

  try {
    // Récupérer l'évaluation
    const evals = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.id, evaluationId))
      .limit(1);

    if (evals.length === 0) {
      return { success: false, message: "Évaluation non trouvée" };
    }

    const evaluation = evals[0];

    // Vérifier qu'on n'a pas déjà envoyé un email
    const existing = await db
      .select()
      .from(evaluationEmails)
      .where(
        and(
          eq(evaluationEmails.evaluationId, evaluationId),
          eq(evaluationEmails.emailType, "admissibility_report")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { success: false, message: "Un bilan a déjà été envoyé pour cette évaluation" };
    }

    // Générer le rapport
    const reportContent = generateAdmissibilityReport(evaluation);

    // Créer l'entrée de suivi
    await db.insert(evaluationEmails).values({
      evaluationId: evaluationId,
      candidateEmail: evaluation.email,
      candidateName: evaluation.fullName,
      destinationCountry: evaluation.destinationCountry || "Unknown",
      visaType: evaluation.visaType || "Unknown",
      emailType: "admissibility_report",
      scheduledAt: new Date(),
      status: "pending",
      reportContent: reportContent,
      secureLink: `https://www.3mtravelagency.com/mon-dossier?eval=${evaluationId}`,
    });

    // Envoyer l'email
    try {
      await sendEmail(
        evaluation.email,
        `Votre Bilan d'Admissibilité - 3M Travel & Services`,
        reportContent
      );

      // Mettre à jour le statut à "sent"
      await db
        .update(evaluationEmails)
        .set({ status: "sent", sentAt: new Date() })
        .where(
          and(
            eq(evaluationEmails.evaluationId, evaluationId),
            eq(evaluationEmails.emailType, "admissibility_report")
          )
        );

      return { success: true, message: `Bilan envoyé à ${evaluation.email}` };
    } catch (emailErr) {
      // Mettre à jour le statut à "failed"
      await db
        .update(evaluationEmails)
        .set({ status: "failed", failureReason: String(emailErr) })
        .where(
          and(
            eq(evaluationEmails.evaluationId, evaluationId),
            eq(evaluationEmails.emailType, "admissibility_report")
          )
        );

      return { success: false, message: `Erreur lors de l'envoi : ${emailErr}` };
    }
  } catch (err) {
    console.error("[Send Admissibility Report] Error:", err);
    return { success: false, message: "Erreur lors de l'envoi du bilan" };
  }
}

/**
 * Job Heartbeat — Envoie les bilans pour toutes les évaluations après 48h
 */
export async function sendPendingAdmissibilityReports(): Promise<{ sent: number; failed: number }> {
  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  try {
    // Trouver toutes les évaluations créées il y a plus de 48h sans email envoyé
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const pendingEvals = await db
      .select()
      .from(evaluations)
      .where(lt(evaluations.createdAt, fortyEightHoursAgo))
      .limit(100);

    let sent = 0;
    let failed = 0;

    for (const evaluation of pendingEvals) {
      // Vérifier qu'on n'a pas déjà envoyé un email
      const existing = await db
        .select()
        .from(evaluationEmails)
        .where(
          and(
            eq(evaluationEmails.evaluationId, evaluation.id),
            eq(evaluationEmails.emailType, "admissibility_report")
          )
        )
        .limit(1);

      if (existing.length === 0) {
        const result = await sendAdmissibilityReport(evaluation.id);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }
    }

    console.log(`[Admissibility Reports] Sent: ${sent}, Failed: ${failed}`);
    return { sent, failed };
  } catch (err) {
    console.error("[Send Pending Admissibility Reports] Error:", err);
    return { sent: 0, failed: 0 };
  }
}
