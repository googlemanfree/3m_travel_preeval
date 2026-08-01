/**
 * Routeur pour les fonctionnalités de réassurance et suivi dynamique
 * Inclut : barre de progression, galerie de visas, calculateur de budget, rappels téléphoniques
 */

import { protectedProcedure, publicProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import mysql from 'mysql2/promise';

export const reassuranceRouter = {
  /**
   * Récupérer la progression du dossier
   */
  getApplicationProgress: protectedProcedure
    .input(z.object({ dossierNumber: z.string() }))
    .query(async ({ input, ctx }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        // Récupérer le dossier
        const [applications] = await connection.execute(`
          SELECT * FROM applications WHERE dossierNumber = ? AND candidateId = ?
        `, [input.dossierNumber, ctx.user.id]);

        if (!applications || (applications as any[]).length === 0) {
          await connection.end();
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Dossier non trouvé',
          });
        }

        const app = (applications as any[])[0];

        // Calculer la progression
        let progress = 0;
        const steps = [
          { name: 'Évaluation', completed: !!app.evaluationScore },
          { name: 'Bilan', completed: !!app.billingStatus },
          { name: 'Traduction', completed: !!app.translationStatus },
          { name: 'Soumission', completed: !!app.submissionStatus },
          { name: 'Visa', completed: app.status === 'approved' },
        ];

        const completedSteps = steps.filter((s) => s.completed).length;
        progress = (completedSteps / steps.length) * 100;

        await connection.end();

        return {
          dossierNumber: input.dossierNumber,
          progress: Math.round(progress),
          steps,
          currentStep: steps.find((s) => !s.completed)?.name || 'Terminé',
        };
      } catch (error) {
        console.error('Erreur lors de la récupération de la progression:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération de la progression',
        });
      }
    }),

  /**
   * Récupérer la galerie de visas accordés
   */
  getApprovedVisasGallery: publicProcedure
    .input(
      z.object({
        limit: z.number().default(12),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        // Récupérer les visas publiés
        const [visas] = await connection.execute(`
          SELECT * FROM approvedVisasGallery 
          WHERE isPublished = TRUE 
          ORDER BY approvalDate DESC 
          LIMIT ? OFFSET ?
        `, [input.limit, input.offset]);

        // Compter le total
        const [countResult] = await connection.execute(`
          SELECT COUNT(*) as total FROM approvedVisasGallery WHERE isPublished = TRUE
        `);

        await connection.end();

        return {
          data: visas || [],
          total: (countResult as any[])[0]?.total || 0,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error('Erreur lors de la récupération de la galerie:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération de la galerie',
        });
      }
    }),

  /**
   * Publier un visa dans la galerie (admin)
   */
  publishVisaToGallery: protectedProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        candidateName: z.string(),
        destination: z.string(),
        visaType: z.string(),
        approvalDate: z.date(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        // Vérifier que l'utilisateur est admin
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Accès réservé aux administrateurs',
          });
        }

        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        await connection.execute(`
          INSERT INTO approvedVisasGallery 
          (dossierNumber, candidateName, destination, visaType, approvalDate, imageUrl, isPublished)
          VALUES (?, ?, ?, ?, ?, ?, TRUE)
          ON DUPLICATE KEY UPDATE 
          candidateName = ?, destination = ?, visaType = ?, approvalDate = ?, imageUrl = ?, isPublished = TRUE
        `, [
          input.dossierNumber,
          input.candidateName,
          input.destination,
          input.visaType,
          input.approvalDate,
          input.imageUrl || null,
          input.candidateName,
          input.destination,
          input.visaType,
          input.approvalDate,
          input.imageUrl || null,
        ]);

        await connection.end();

        return { success: true, message: 'Visa publié dans la galerie' };
      } catch (error) {
        console.error('Erreur lors de la publication du visa:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la publication du visa',
        });
      }
    }),

  /**
   * Demander un rappel téléphonique
   */
  requestCallback: protectedProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        phoneNumber: z.string(),
        preferredTime: z.string().optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        await connection.execute(`
          INSERT INTO callbackRequests 
          (candidateId, dossierNumber, phoneNumber, preferredTime, reason, status)
          VALUES (?, ?, ?, ?, ?, 'pending')
        `, [ctx.user.id, input.dossierNumber, input.phoneNumber, input.preferredTime || null, input.reason || null]);

        await connection.end();

        return {
          success: true,
          message: 'Demande de rappel envoyée. Nous vous contacterons bientôt.',
        };
      } catch (error) {
        console.error('Erreur lors de la demande de rappel:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la demande de rappel',
        });
      }
    }),

  /**
   * Récupérer les demandes de rappel (admin)
   */
  getCallbackRequests: protectedProcedure
    .input(
      z.object({
        status: z.enum(['pending', 'scheduled', 'completed', 'cancelled']).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }: any) => {
      try {
        // Vérifier que l'utilisateur est admin
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Accès réservé aux administrateurs',
          });
        }

        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        let query = 'SELECT * FROM callbackRequests WHERE 1=1';
        const params: any[] = [];

        if (input.status) {
          query += ' AND status = ?';
          params.push(input.status);
        }

        query += ' ORDER BY requestedAt DESC LIMIT ? OFFSET ?';
        params.push(input.limit, input.offset);

        const [requests] = await connection.execute(query, params);

        await connection.end();

        return {
          data: requests || [],
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des demandes',
        });
      }
    }),

  /**
   * Récupérer les estimations de budget par pays
   */
  getBudgetEstimate: publicProcedure
    .input(
      z.object({
        countryCode: z.string(),
        visaType: z.string().optional(),
      })
    )
    .query(async ({ input }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        let query = 'SELECT * FROM budgetEstimates WHERE countryCode = ?';
        const params: any[] = [input.countryCode];

        if (input.visaType) {
          query += ' AND visaType = ?';
          params.push(input.visaType);
        }

        const [estimates] = await connection.execute(query, params);

        await connection.end();

        return {
          data: estimates || [],
        };
      } catch (error) {
        console.error('Erreur lors de la récupération du budget:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération du budget',
        });
      }
    }),

  /**
   * Ajouter une estimation de budget (admin)
   */
  addBudgetEstimate: protectedProcedure
    .input(
      z.object({
        countryCode: z.string(),
        countryName: z.string(),
        visaType: z.string(),
        tuitionFees: z.number().default(0),
        financialGuarantee: z.number().default(0),
        visaFees: z.number().default(0),
        otherFees: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        // Vérifier que l'utilisateur est admin
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Accès réservé aux administrateurs',
          });
        }

        const totalEstimate =
          input.tuitionFees +
          input.financialGuarantee +
          input.visaFees +
          input.otherFees;

        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        await connection.execute(`
          INSERT INTO budgetEstimates 
          (countryCode, countryName, visaType, tuitionFees, financialGuarantee, visaFees, otherFees, totalEstimate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          tuitionFees = ?, financialGuarantee = ?, visaFees = ?, otherFees = ?, totalEstimate = ?
        `, [
          input.countryCode,
          input.countryName,
          input.visaType,
          input.tuitionFees,
          input.financialGuarantee,
          input.visaFees,
          input.otherFees,
          totalEstimate,
          input.tuitionFees,
          input.financialGuarantee,
          input.visaFees,
          input.otherFees,
          totalEstimate,
        ]);

        await connection.end();

        return {
          success: true,
          message: 'Estimation de budget ajoutée',
          totalEstimate,
        };
      } catch (error) {
        console.error('Erreur lors de l\'ajout du budget:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'ajout du budget',
        });
      }
    }),
};
