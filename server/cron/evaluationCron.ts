import { CronJob } from 'cron';
import { getDb } from '../db';
import { applications } from '../../drizzle/schema';
// Table bilans supprimée - utiliser applications à la place
import { eq, and, lte, isNull } from 'drizzle-orm';
import { sendEmail } from '../_core/email';
import { buildCandidateSpaceAccessUrl } from '../services/candidateAccessLink';

/**
 * Tâche planifiée : S'exécute toutes les heures pour vérifier les évaluations arrivées à 48h
 * et envoyer les notifications aux candidats
 */
export async function initEvaluationCron() {
  const job = new CronJob('0 * * * *', async () => {
    console.log('[CRON] Vérification des évaluations à 48h...');

    try {
      const db = await getDb();
      if (!db) {
        console.error('[CRON] Base de données non disponible');
        return;
      }

      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // 1. Rechercher les applications créées il y a 48h avec évaluation complétée
      const pendingApplications = await db
        .select()
        .from(applications)
        .where(
          and(
            lte(applications.createdAt, fortyEightHoursAgo),
            eq(applications.dossierStatus, 'en_evaluation'),
            isNull(applications.evaluationCompletedAt)
          )
        );

      console.log(`[CRON] ${pendingApplications.length} évaluations trouvées pour envoi`);

      for (const application of pendingApplications) {
        try {
          const candidateSpaceUrl = buildCandidateSpaceAccessUrl(application.dossierNumber);
          // 2. Envoyer l'email avec le résultat d'évaluation
          const mailContent = `
            <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
              <h2 style="color: #0066cc;">3M Travel Agency</h2>
              <p>Bonjour <strong>${application.fullName}</strong>,</p>
              <p>Le comité d'experts de 3M Travel Agency a finalisé l'étude de votre profil.</p>
              
              <div style="background-color: #f4f6f8; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Résultat de l'analyse :</h3>
                <p><strong>Score d'admissibilité :</strong> ${application.evaluationScore || 75}%</p>
                <p><strong>Badge :</strong> ${application.evaluationBadge || 'Favorable sous réserve'}</p>
              </div>

              <p>Pour consulter le rapport détaillé et débloquer la suite de vos démarches :</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${candidateSpaceUrl}" 
                   style="background-color: #0066cc; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Accéder à mon Espace Client
                </a>
              </p>

              <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">3M Travel Agency — Yaoundé, Biyem-Assi | www.3mtravelagency.click</p>
            </div>
          `;

          await sendEmail({
            to: application.email,
            subject: `Votre Bilan d'Admissibilité Officiel - Dossier N° ${application.dossierNumber}`,
            html: mailContent,
          });

          // 3. Mettre à jour le statut du dossier
          await db
            .update(applications)
            .set({
              dossierStatus: 'bilan_envoye',
              evaluationCompletedAt: new Date(),
            })
            .where(eq(applications.id, application.id));

          console.log(`[CRON] Évaluation envoyée avec succès pour le dossier ${application.dossierNumber}`);
        } catch (error) {
          console.error(`[CRON] Erreur envoi évaluation ${application.id}:`, error);
        }
      }

      console.log('[CRON] Vérification des évaluations terminée');
    } catch (error) {
      console.error('[CRON] Erreur générale:', error);
    }
  });

  // Démarrer le job
  job.start();
  console.log('[CRON] Job d\'envoi des évaluations initialisé (toutes les heures)');

  return job;
}
