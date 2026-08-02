/**
 * Routeur tRPC pour les notifications automatiques
 * Gère l'envoi de notifications Email + WhatsApp
 */

import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import type { TRPCError } from '@trpc/server';
import { sendEmail as sendGenericEmail, SendEmailOptions } from '../_core/email';
import {
  sendWhatsAppMessage,
  sendAdmissibilityReportWhatsApp,
  sendPaymentConfirmationWhatsApp,
  sendDualNotification,
  sendPaymentReminderWhatsApp,
  sendDocumentsReceivedWhatsApp,
  sendVisaApprovedWhatsApp,
  sendContractObtainedWhatsApp,
  sendApplicationRejectedWhatsApp,
} from '../whatsappService';


export const notificationRouter = router({
  /**
   * Envoyer une notification de bilan d'admissibilité (Email + WhatsApp)
   */
  sendAdmissibilityNotification: publicProcedure
    .input(
      z.object({
        applicationId: z.string(),
        email: z.string().email(),
        phoneNumber: z.string(),
        candidateName: z.string(),
        destinationCountry: z.string(),
        visaType: z.string(),
        scorePercentage: z.number().min(0).max(100),
        recommendation: z.string(),
      })
    )
    .mutation(async ({ input: data }: { input: any }) => {
      try {
        // Préparer le contenu email
        const emailHtml = `
          <h2>Votre Bilan d'Admissibilité</h2>
          <p>Bonjour ${data.candidateName},</p>
          <p>Votre évaluation pour <strong>${data.destinationCountry}</strong> (${data.visaType}) est prête !</p>
          <h3>📊 Score d'admissibilité : ${data.scorePercentage}%</h3>
          <p>${data.recommendation}</p>
          <p>Consultez votre espace candidat pour les détails complets.</p>
          <p>Cordialement,<br/>3M Travel & Services</p>
        `;

        // Envoyer la notification double
        const result = await sendDualNotification(
          data.email,
          data.phoneNumber,
          `Votre Bilan d'Admissibilité - 3M Travel & Services`,
          emailHtml,
          `🌟 Votre évaluation pour ${data.destinationCountry} est prête ! Score : ${data.scorePercentage}%. Consultez votre email pour les détails.`
        );

        return {
          success: true,
          emailSent: result.emailSent,
          whatsappSent: result.whatsappSent,
          errors: result.errors,
        };
      } catch (error) {
        console.error('[Notification] Erreur lors de l\'envoi du bilan:', error);
        return {
          success: false,
          emailSent: false,
          whatsappSent: false,
          errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
        };
      }
    }),

  /**
   * Envoyer une notification de paiement confirmé
   */
  sendPaymentConfirmedNotification: publicProcedure
    .input(
      z.object({
        transactionId: z.string(),
        email: z.string().email(),
        phoneNumber: z.string(),
        candidateName: z.string(),
        amount: z.string(),
        currency: z.string(),
        invoiceNumber: z.string(),
      })
    )
    .mutation(async ({ input: data }: { input: any }) => {
      try {
        const emailHtml = `
          <h2>Confirmation de Paiement</h2>
          <p>Bonjour ${data.candidateName},</p>
          <p>Votre paiement a été confirmé avec succès ! ✅</p>
          <h3>Détails du Paiement</h3>
          <ul>
            <li><strong>Montant :</strong> ${data.amount} ${data.currency}</li>
            <li><strong>Facture :</strong> ${data.invoiceNumber}</li>
            <li><strong>Transaction :</strong> ${data.transactionId}</li>
          </ul>
          <p>Prochaine étape : Soumettre vos documents.</p>
          <p>Cordialement,<br/>3M Travel & Services</p>
        `;

        const result = await sendDualNotification(
          data.email,
          data.phoneNumber,
          `Confirmation de Paiement - 3M Travel & Services`,
          emailHtml,
          `💳 Votre paiement de ${data.amount} ${data.currency} a été confirmé. Facture : ${data.invoiceNumber}`
        );

        return {
          success: true,
          emailSent: result.emailSent,
          whatsappSent: result.whatsappSent,
        };
      } catch (error) {
        console.error('[Notification] Erreur lors de l\'envoi de confirmation de paiement:', error);
        return {
          success: false,
          emailSent: false,
          whatsappSent: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        };
      }
    }),

  /**
   * Envoyer un rappel de paiement
   */
  sendPaymentReminder: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        phoneNumber: z.string(),
        candidateName: z.string(),
        amount: z.string(),
        currency: z.string(),
        daysOverdue: z.number().optional(),
      })
    )
    .mutation(async ({ input: data }: { input: any }) => {
      try {
        const overdueText = data.daysOverdue
          ? `Votre paiement est en attente depuis ${data.daysOverdue} jour(s).`
          : 'Votre paiement est en attente.';

        const emailHtml = `
          <h2>Rappel - Paiement en Attente</h2>
          <p>Bonjour ${data.candidateName},</p>
          <p>${overdueText}</p>
          <h3>Montant à payer : ${data.amount} ${data.currency}</h3>
          <p>Finalisez votre dossier en procédant au paiement dès maintenant.</p>
          <p>Consultez votre espace candidat pour le lien de paiement.</p>
          <p>Cordialement,<br/>3M Travel & Services</p>
        `;

        const result = await sendPaymentReminderWhatsApp({
          phoneNumber: data.phoneNumber,
          candidateName: data.candidateName,
          amount: data.amount,
          currency: data.currency,
        });

        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        };
      } catch (error) {
        console.error('[Notification] Erreur lors de l\'envoi du rappel:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        };
      }
    }),

  /**
   * Envoyer une notification de documents reçus
   */
  sendDocumentsReceivedNotification: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        phoneNumber: z.string(),
        candidateName: z.string(),
        documentCount: z.number(),
      })
    )
    .mutation(async ({ input: data }: { input: any }) => {
      try {
        const emailHtml = `
          <h2>Documents Reçus</h2>
          <p>Bonjour ${data.candidateName},</p>
          <p>Nous avons reçu et vérifié <strong>${data.documentCount} document(s)</strong>. ✅</p>
          <p>Prochaine étape : Soumission aux agences partenaires.</p>
          <p>Nous vous tiendrons informé de l'avancement.</p>
          <p>Cordialement,<br/>3M Travel & Services</p>
        `;

        const result = await sendDocumentsReceivedWhatsApp({
          phoneNumber: data.phoneNumber,
          candidateName: data.candidateName,
          documentCount: data.documentCount,
        });

        return {
          success: result.success,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('[Notification] Erreur lors de l\'envoi de notification documents:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        };
      }
    }),

  /**
   * Envoyer une notification de visa approuvé
   */
  sendVisaApprovedNotification: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        phoneNumber: z.string(),
        candidateName: z.string(),
        destinationCountry: z.string(),
        visaType: z.string(),
      })
    )
    .mutation(async ({ input: data }: { input: any }) => {
      try {
        const emailHtml = `
          <h2>🎉 Félicitations ! Votre Visa a été Approuvé 🎉</h2>
          <p>Bonjour ${data.candidateName},</p>
          <p>Excellente nouvelle ! Votre visa <strong>${data.visaType}</strong> pour <strong>${data.destinationCountry}</strong> a été approuvé ! ✅</p>
          <p>Consultez votre espace candidat pour les détails et les prochaines étapes.</p>
          <p>Merci de votre confiance !<br/>3M Travel & Services</p>
        `;

        const result = await sendVisaApprovedWhatsApp({
          phoneNumber: data.phoneNumber,
          candidateName: data.candidateName,
          destinationCountry: data.destinationCountry,
          visaType: data.visaType,
        });

        return {
          success: result.success,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('[Notification] Erreur lors de l\'envoi de notification visa:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        };
      }
    }),

  /**
   * Envoyer une notification de contrat obtenu
   */
  sendContractObtainedNotification: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        phoneNumber: z.string(),
        candidateName: z.string(),
        employerName: z.string(),
        position: z.string(),
        destinationCountry: z.string(),
      })
    )
    .mutation(async ({ input: data }: { input: any }) => {
      try {
        const emailHtml = `
          <h2>🎊 Contrat Obtenu 🎊</h2>
          <p>Bonjour ${data.candidateName},</p>
          <p>Excellente nouvelle ! Vous avez obtenu un contrat de travail ! 🎉</p>
          <h3>Détails du Contrat</h3>
          <ul>
            <li><strong>Employeur :</strong> ${data.employerName}</li>
            <li><strong>Poste :</strong> ${data.position}</li>
            <li><strong>Destination :</strong> ${data.destinationCountry}</li>
          </ul>
          <p>Consultez votre espace candidat pour les détails et les prochaines étapes.</p>
          <p>Cordialement,<br/>3M Travel & Services</p>
        `;

        const result = await sendContractObtainedWhatsApp({
          phoneNumber: data.phoneNumber,
          candidateName: data.candidateName,
          employerName: data.employerName,
          position: data.position,
          destinationCountry: data.destinationCountry,
        });

        return {
          success: result.success,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('[Notification] Erreur lors de l\'envoi de notification contrat:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        };
      }
    }),

  /**
   * Envoyer une notification de dossier rejeté
   */
  sendApplicationRejectedNotification: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        phoneNumber: z.string(),
        candidateName: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input: data }: { input: any }) => {
      try {
        const emailHtml = `
          <h2>Mise à Jour de Votre Dossier</h2>
          <p>Bonjour ${data.candidateName},</p>
          <p>Malheureusement, votre dossier n'a pas pu être approuvé.</p>
          <h3>Raison :</h3>
          <p>${data.reason}</p>
          <p>Nous vous invitons à nous contacter pour discuter des options disponibles.</p>
          <p>Cordialement,<br/>3M Travel & Services</p>
        `;

        const result = await sendApplicationRejectedWhatsApp({
          phoneNumber: data.phoneNumber,
          candidateName: data.candidateName,
          reason: data.reason,
        });

        return {
          success: result.success,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('[Notification] Erreur lors de l\'envoi de notification rejet:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        };
      }
    }),

  /**
   * Envoyer un message WhatsApp personnalisé
   */
  sendCustomWhatsAppMessage: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input: data }: { input: any }) => {
      try {
        const result = await sendWhatsAppMessage(data.phoneNumber, data.message);
        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        };
      } catch (error) {
        console.error('[Notification] Erreur lors de l\'envoi du message personnalisé:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        };
      }
    }),
});


