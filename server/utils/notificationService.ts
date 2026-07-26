import { sendEmail } from '../_core/email';

export interface DossierNotification {
  candidateEmail: string;
  candidateName: string;
  dossierNumber: string;
  changeType: 'created' | 'status_updated' | 'document_received' | 'bilan_sent' | 'payment_received' | 'message_received';
  details: Record<string, any>;
}

/**
 * Envoyer une notification email pour un changement de dossier
 */
export async function sendDossierNotification(notification: DossierNotification) {
  const { candidateEmail, candidateName, dossierNumber, changeType, details } = notification;

  let subject = '';
  let htmlContent = '';

  switch (changeType) {
    case 'created':
      subject = `Dossier Créé - N° ${dossierNumber}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
          <h2 style="color: #0066cc;">3M Travel Agency</h2>
          <p>Bonjour <strong>${candidateName}</strong>,</p>
          <p>Votre dossier a été créé avec succès !</p>
          
          <div style="background-color: #f4f6f8; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
            <p><strong>Numéro de Dossier :</strong> ${dossierNumber}</p>
            <p><strong>Destination :</strong> ${details.destination || 'Non spécifiée'}</p>
            <p><strong>Type de Projet :</strong> ${details.projectType || 'Non spécifié'}</p>
          </div>

          <p>Vous pouvez maintenant accéder à votre espace client pour :</p>
          <ul>
            <li>Télécharger les documents requis</li>
            <li>Suivre l'avancement de votre dossier</li>
            <li>Recevoir les mises à jour</li>
          </ul>

          <p style="text-align: center; margin: 30px 0;">
            <a href="https://www.3mtravelagency.click/mon-espace?dossier=${dossierNumber}" 
               style="background-color: #0066cc; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Accéder à mon Espace
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">3M Travel Agency — Yaoundé, Biyem-Assi | www.3mtravelagency.click</p>
        </div>
      `;
      break;

    case 'status_updated':
      subject = `Mise à Jour de Votre Dossier - N° ${dossierNumber}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
          <h2 style="color: #0066cc;">3M Travel Agency</h2>
          <p>Bonjour <strong>${candidateName}</strong>,</p>
          <p>Votre dossier a été mis à jour.</p>
          
          <div style="background-color: #f4f6f8; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
            <p><strong>Numéro de Dossier :</strong> ${dossierNumber}</p>
            <p><strong>Nouveau Statut :</strong> ${details.newStatus || 'Non spécifié'}</p>
            <p><strong>Ancien Statut :</strong> ${details.oldStatus || 'Non spécifié'}</p>
            ${details.notes ? `<p><strong>Notes :</strong> ${details.notes}</p>` : ''}
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="https://www.3mtravelagency.click/mon-espace?dossier=${dossierNumber}" 
               style="background-color: #0066cc; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Voir les Détails
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">3M Travel Agency — Yaoundé, Biyem-Assi | www.3mtravelagency.click</p>
        </div>
      `;
      break;

    case 'document_received':
      subject = `Documents Reçus - N° ${dossierNumber}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
          <h2 style="color: #0066cc;">3M Travel Agency</h2>
          <p>Bonjour <strong>${candidateName}</strong>,</p>
          <p>Vos documents ont été reçus et enregistrés.</p>
          
          <div style="background-color: #f4f6f8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
            <p><strong>Numéro de Dossier :</strong> ${dossierNumber}</p>
            <p><strong>Documents Reçus :</strong> ${details.documentCount || 0}</p>
            <p><strong>Date de Réception :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="https://www.3mtravelagency.click/mon-espace?dossier=${dossierNumber}" 
               style="background-color: #0066cc; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Voir mes Documents
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">3M Travel Agency — Yaoundé, Biyem-Assi | www.3mtravelagency.click</p>
        </div>
      `;
      break;

    case 'bilan_sent':
      subject = `Votre Bilan d'Admissibilité - N° ${dossierNumber}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
          <h2 style="color: #0066cc;">3M Travel Agency</h2>
          <p>Bonjour <strong>${candidateName}</strong>,</p>
          <p>Votre bilan d'admissibilité est maintenant disponible !</p>
          
          <div style="background-color: #f4f6f8; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <p><strong>Numéro de Dossier :</strong> ${dossierNumber}</p>
            <p><strong>Score :</strong> ${details.score || 'N/A'}%</p>
            <p><strong>Verdict :</strong> ${details.verdict || 'N/A'}</p>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="https://www.3mtravelagency.click/mon-espace?dossier=${dossierNumber}" 
               style="background-color: #0066cc; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Consulter mon Bilan
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">3M Travel Agency — Yaoundé, Biyem-Assi | www.3mtravelagency.click</p>
        </div>
      `;
      break;

    case 'payment_received':
      subject = `Paiement Reçu - N° ${dossierNumber}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
          <h2 style="color: #0066cc;">3M Travel Agency</h2>
          <p>Bonjour <strong>${candidateName}</strong>,</p>
          <p>Votre paiement a été reçu et enregistré.</p>
          
          <div style="background-color: #f4f6f8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
            <p><strong>Numéro de Dossier :</strong> ${dossierNumber}</p>
            <p><strong>Montant :</strong> ${details.amount || 'N/A'} XAF</p>
            <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            <p><strong>Référence :</strong> ${details.reference || 'N/A'}</p>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="https://www.3mtravelagency.click/mon-espace?dossier=${dossierNumber}" 
               style="background-color: #0066cc; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Voir ma Facture
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">3M Travel Agency — Yaoundé, Biyem-Assi | www.3mtravelagency.click</p>
        </div>
      `;
      break;

    case 'message_received':
      subject = `Nouveau Message - N° ${dossierNumber}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #0a2540; padding: 20px;">
          <h2 style="color: #0066cc;">3M Travel Agency</h2>
          <p>Bonjour <strong>${candidateName}</strong>,</p>
          <p>Vous avez reçu un nouveau message de notre équipe.</p>
          
          <div style="background-color: #f4f6f8; border-left: 4px solid #9c27b0; padding: 15px; margin: 20px 0;">
            <p><strong>Numéro de Dossier :</strong> ${dossierNumber}</p>
            <p><strong>Message :</strong></p>
            <p style="margin-top: 10px; font-style: italic;">${details.message || 'N/A'}</p>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="https://www.3mtravelagency.click/mon-espace?dossier=${dossierNumber}" 
               style="background-color: #0066cc; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Lire le Message
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">3M Travel Agency — Yaoundé, Biyem-Assi | www.3mtravelagency.click</p>
        </div>
      `;
      break;

    default:
      return;
  }

  try {
    await sendEmail({
      to: candidateEmail,
      subject,
      html: htmlContent,
    });
    console.log(`[Notification] Email envoyé à ${candidateEmail} pour ${changeType}`);
  } catch (error) {
    console.error(`[Notification] Erreur lors de l'envoi de l'email à ${candidateEmail}:`, error);
  }
}
