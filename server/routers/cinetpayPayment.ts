import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { applications, candidates } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const cinetpayPaymentRouter = router({
  initiateDossierPayment: protectedProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        amount: z.number().default(65000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Récupérer le dossier
        const application = await (db as any).query.applications.findFirst({
          where: eq(applications.dossierNumber, input.dossierNumber),
          with: {
            candidate: true,
          },
        });

        if (!application) {
          return {
            success: false,
            error: 'Dossier non trouvé',
          };
        }

        // Vérifier que l'utilisateur est propriétaire du dossier
        if (application.candidateId !== ctx.user?.id) {
          return {
            success: false,
            error: 'Accès non autorisé',
          };
        }

        // Générer une transaction ID unique
        const transactionId = `3M-${input.dossierNumber}-${Date.now()}`;

        // Sauvegarder la transaction en attente
        // TODO: Créer une table transactions si elle n'existe pas

        return {
          success: true,
          transactionId,
          amount: input.amount,
          currency: 'XAF',
          candidateName: application.candidate?.fullName || 'Candidat',
          email: application.candidate?.email || '',
          dossierNumber: input.dossierNumber,
        };
      } catch (error) {
        console.error('Erreur initiation paiement:', error);
        return {
          success: false,
          error: 'Erreur lors de l\'initialisation du paiement',
        };
      }
    }),

  getDossierPaymentInfo: protectedProcedure
    .input(z.object({ dossierNumber: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const application = await (db as any).query.applications.findFirst({
          where: eq(applications.dossierNumber, input.dossierNumber),
          with: {
            candidate: true,
          },
        });

        if (!application) {
          return {
            success: false,
            error: 'Dossier non trouvé',
          };
        }

        // Vérifier que l'utilisateur est propriétaire du dossier
        if (application.candidateId !== ctx.user?.id) {
          return {
            success: false,
            error: 'Accès non autorisé',
          };
        }

        return {
          success: true,
          dossierNumber: application.dossierNumber,
          candidateName: application.candidate?.fullName || 'Candidat',
          email: application.candidate?.email || '',
          amount: 65000,
          currency: 'XAF',
          paymentStatus: application.paymentStatus,
        };
      } catch (error) {
        console.error('Erreur récupération info paiement:', error);
        return {
          success: false,
          error: 'Erreur lors de la récupération des informations',
        };
      }
    }),

  verifyPaymentStatus: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ input }) => {
      try {
        // TODO: Vérifier le statut de la transaction via l'API CinetPay
        // const response = await fetch('https://api.cinetpay.com/v1/check_payment', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${process.env.CINETPAY_API_KEY}`,
        //   },
        //   body: JSON.stringify({
        //     apikey: process.env.CINETPAY_API_KEY,
        //     site_id: process.env.CINETPAY_SITE_ID,
        //     transaction_id: input.transactionId,
        //   }),
        // });

        return {
          success: true,
          status: 'pending',
        };
      } catch (error) {
        console.error('Erreur vérification paiement:', error);
        return {
          success: false,
          error: 'Erreur lors de la vérification du paiement',
        };
      }
    }),
});
