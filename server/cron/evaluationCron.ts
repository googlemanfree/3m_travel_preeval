import { CronJob } from 'cron';
import { getDb } from '../db';
import { applications } from '../../drizzle/schema';
// import {  from '../../drizzle/schema'; // Table supprimée
import { eq, and, lte, isNull } from 'drizzle-orm';
import { sendEmail } from '../_core/email';

/**
 * Tâche planifiée : S'exécute toutes les heures pour vérifier les bilans arrivés à 48h
 * et envoyer les notifications aux candidats
 */
export async function initEvaluationCron() {
  const job = new CronJob('0 * * * *', async () => {
    console.log('[CRON] Vérification des bilans d\'évaluation à 48h...');

    try {
      const db = await getDb();
      if (!db) {
        console.error('[CRON] Base de données non disponible');
        return;
      }

      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // 1. Rechercher les bilans créés il y a 48h et non encore envoyés
      const pendingBilans = await db
        .select()
        .from(bilans)
        .where(
          and(
            lte(bilans.createdAt, fortyEightHoursAgo),
            eq(bilans.status, 'draft'),
            isNull(bilans.sentAt)
          )
        );

      console.log(`[CRON] ${pendingBilans.length} bilans trouvés pour envoi`);

      for (const bilan of pendingBilans) {
        try {
          // 2. Récupérer l'application associée
          const app = await db
            .select()
            .from(applications)
            .where(eq(applications.id, bilan.applicationId))
            .limit(1);

          if (app.length === 0) {
            console.log(`[CRON] Application non trouvée pour le bilan ${bilan.id}`);
            continue;
          }

          const application = app[0];

          // 3. Envoyer l'email avec le bilan
          const mailContent = `
            <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
              <h2 style="color: #0066cc;">3M Travel Agency</h2>
              <p>Bonjour <strong>${application.fullName}</strong>,</p>
              <p>Le comité d'experts de 3M Travel Agency a finalisé l'étude de votre profil.</p>
              
              <div style="background-color: #f4f6f8; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Résultat de l'analyse :</h3>
                <p><strong>Score d'admissibilité :</strong> ${bilan.score || 75}%</p>
                <p><strong>Avis général :</strong> ${bilan.verdict || 'Favorable sous réserve'}</p>
              </div>

              <p>Pour consulter le rapport détaillé et débloquer la suite de vos démarches :</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://www.3mtravelagency.click/mon-espace?dossier=${application.dossierNumber}" 
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

          // 4. Mettre à jour le statut du bilan
          await db
            .update(bilans)
            .set({
              status: 'sent',
              sentAt: new Date(),
            })
            .where(eq(bilans.id, bilan.id));

          // 5. Mettre à jour le statut du dossier
          await db
            .update(applications)
            .set({
              dossierStatus: 'bilan_envoye',
            })
            .where(eq(applications.id, application.id));

          console.log(`[CRON] Bilan envoyé avec succès pour le dossier ${application.dossierNumber}`);
        } catch (error) {
          console.error(`[CRON] Erreur envoi bilan ${bilan.id}:`, error);
        }
      }

      console.log('[CRON] Vérification des bilans terminée');
    } catch (error) {
      console.error('[CRON] Erreur générale:', error);
    }
  });

  // Démarrer le job
  job.start();
  console.log('[CRON] Job d\'envoi des bilans initialisé (toutes les heures)');

  return job;
}
