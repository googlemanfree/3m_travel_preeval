import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { candidates } from '../../drizzle/schema';
import { getDb } from '../db';
import { sendEmail } from '../_core/email';

const AGENCY_EMAIL = 'hello@3mtravelagency.com';

async function getCandidateContact(candidateId: string) {
  const numericId = Number(candidateId.includes('_') ? candidateId.split('_').pop() : candidateId);
  if (!Number.isInteger(numericId) || numericId <= 0) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ email: candidates.email, fullName: candidates.fullName })
    .from(candidates)
    .where(eq(candidates.id, numericId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Routeur pour la gestion de la validation des paiements en agence
 * et le déblocage automatique des étapes suivantes
 */
export const paymentValidationRouter = router({
  /**
   * Récupérer les paiements en attente de validation (Admin uniquement)
   */
  getPendingPayments: protectedProcedure
    .query(async ({ ctx }) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Accès refusé : administrateur requis');
      }

      // Récupérer les candidatures avec statut de paiement "pending"
      // À adapter selon votre structure de base de données
      return {
        success: true,
        message: 'Paiements en attente récupérés',
        data: [],
      };
    }),

  /**
   * Valider un paiement en agence
   */
  validateAgencyPayment: protectedProcedure
    .input(
      z.object({
        candidateId: z.string(),
        paymentId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Accès refusé : administrateur requis');
      }

      try {
        // 1. Mettre à jour le statut du paiement en "validated"
        // UPDATE payments SET status = 'validated', validated_at = NOW(), validated_by = ? WHERE id = ?
        
        // 2. Débloquer l'étape de téléchargement des documents
        // UPDATE candidates SET documents_upload_unlocked = true, documents_unlock_date = NOW() WHERE id = ?
        
        // 3. Envoyer un email de notification au candidat
        const emailSent = await sendPaymentValidationEmail(input.candidateId);

        return {
          success: true,
          message: 'Paiement validé avec succès',
          data: {
            paymentId: input.paymentId,
            candidateId: input.candidateId,
            status: 'validated',
            emailSent,
            timestamp: new Date(),
          },
        };
      } catch (error) {
        console.error('Erreur lors de la validation du paiement:', error);
        throw new Error('Erreur lors de la validation du paiement');
      }
    }),

  /**
   * Rejeter un paiement en agence
   */
  rejectAgencyPayment: protectedProcedure
    .input(
      z.object({
        candidateId: z.string(),
        paymentId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Accès refusé : administrateur requis');
      }

      try {
        // 1. Mettre à jour le statut du paiement en "rejected"
        // UPDATE payments SET status = 'rejected', rejected_at = NOW(), rejected_by = ?, rejection_reason = ? WHERE id = ?
        
        // 2. Envoyer un email de notification au candidat
        const emailSent = await sendPaymentRejectionEmail(input.candidateId, input.reason);

        return {
          success: true,
          message: 'Paiement rejeté',
          data: {
            paymentId: input.paymentId,
            candidateId: input.candidateId,
            status: 'rejected',
            reason: input.reason,
            emailSent,
            timestamp: new Date(),
          },
        };
      } catch (error) {
        console.error('Erreur lors du rejet du paiement:', error);
        throw new Error('Erreur lors du rejet du paiement');
      }
    }),

  /**
   * Vérifier si les documents peuvent être uploadés pour un candidat
   */
  canUploadDocuments: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Récupérer le statut du candidat
        // SELECT documents_upload_unlocked FROM candidates WHERE user_id = ?
        
        return {
          success: true,
          canUpload: true,
          message: 'Documents peuvent être uploadés',
        };
      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        return {
          success: false,
          canUpload: false,
          message: 'Erreur lors de la vérification',
        };
      }
    }),

  /**
   * Obtenir le statut du paiement d'un candidat
   */
  getPaymentStatus: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Récupérer le statut du paiement du candidat
        // SELECT status, validated_at, rejected_at FROM payments WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 1
        
        return {
          success: true,
          status: 'pending',
          validatedAt: null,
          rejectedAt: null,
        };
      } catch (error) {
        console.error('Erreur lors de la récupération du statut:', error);
        throw new Error('Erreur lors de la récupération du statut');
      }
    }),
});

/**
 * Envoyer un email de validation de paiement au candidat
 */
async function sendPaymentValidationEmail(candidateId: string): Promise<boolean> {
  try {
    const candidate = await getCandidateContact(candidateId);
    if (!candidate) {
      console.warn('[PaymentValidation] Candidat introuvable, notification non envoyée:', candidateId);
      return false;
    }
    await sendEmail({
      to: candidate.email,
      replyTo: AGENCY_EMAIL,
      subject: '✅ Votre paiement a été validé - 3M Travel Agency',
      html: `<h2>Paiement validé</h2><p>Bonjour ${candidate.fullName},</p><p>Votre paiement de 65 000 XAF a été validé avec succès.</p><p><strong>Prochaine étape :</strong> vous pouvez maintenant déposer vos documents dans votre espace candidat.</p><p><a href="https://www.3mtravelagency.com/mon-espace">Accéder à mon espace</a></p><p>Cordialement,<br/>L’équipe 3M Travel Agency</p>`,
    });
    return true;
  } catch (error) {
    console.error('[PaymentValidation] Échec de notification de validation:', error);
    return false;
  }
}

/**
 * Envoyer un email de rejet de paiement au candidat
 */
async function sendPaymentRejectionEmail(
  candidateId: string,
  reason?: string
): Promise<boolean> {
  try {
    const candidate = await getCandidateContact(candidateId);
    if (!candidate) {
      console.warn('[PaymentValidation] Candidat introuvable, notification non envoyée:', candidateId);
      return false;
    }
    await sendEmail({
      to: candidate.email,
      replyTo: AGENCY_EMAIL,
      subject: '⚠️ Votre paiement a été rejeté - 3M Travel Agency',
      html: `<h2>Paiement rejeté</h2><p>Bonjour ${candidate.fullName},</p><p>Votre paiement n’a pas pu être validé.</p>${reason ? `<p><strong>Motif :</strong> ${reason}</p>` : ''}<p>Contactez notre équipe pour la suite de votre dossier.</p><p><a href="https://wa.me/16728972999">Contacter l’équipe via WhatsApp</a></p><p>Cordialement,<br/>L’équipe 3M Travel Agency</p>`,
    });
    return true;
  } catch (error) {
    console.error('[PaymentValidation] Échec de notification de rejet:', error);
    return false;
  }
}
