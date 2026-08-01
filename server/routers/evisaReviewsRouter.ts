/**
 * Routeur pour la gestion des avis d'e-visas
 * Procédures pour créer, lister et modérer les avis clients
 */

import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const evisaReviewsRouter = router({
  /**
   * Récupérer tous les avis approuvés pour un e-visa
   */
  getReviewsByCountry: publicProcedure
    .input(
      z.object({
        countryCode: z.string(),
        limit: z.number().default(10),
        offset: z.number().default(0),
        rating: z.number().optional(),
      })
    )
    .query(async ({ input }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const mysql = await import('mysql2/promise');
        const connection = await mysql.createConnection(dbUrl);

        let query = `
          SELECT id, candidateName, rating, title, comment, travelDate, visaObtained, helpful, unhelpful, createdAt
          FROM evisaReviews
          WHERE evisaCountryCode = ? AND status = 'approved'
        `;
        const params: any[] = [input.countryCode];

        if (input.rating) {
          query += ` AND rating = ?`;
          params.push(input.rating);
        }

        query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
        params.push(input.limit, input.offset);

        const [reviews] = await connection.execute(query, params);

        // Récupérer le nombre total d'avis
        let countQuery = `SELECT COUNT(*) as total FROM evisaReviews WHERE evisaCountryCode = ? AND status = 'approved'`;
        const countParams: any[] = [input.countryCode];

        if (input.rating) {
          countQuery += ` AND rating = ?`;
          countParams.push(input.rating);
        }

        const [countResult] = await connection.execute(countQuery, countParams);
        const total = (countResult as any[])[0]?.total || 0;

        // Calculer les statistiques
        const statsQuery = `
          SELECT 
            AVG(rating) as averageRating,
            COUNT(*) as totalReviews,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as fiveStars,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as fourStars,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as threeStars,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as twoStars,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as oneStar,
            SUM(CASE WHEN visaObtained = true THEN 1 ELSE 0 END) as visaObtainedCount
          FROM evisaReviews
          WHERE evisaCountryCode = ? AND status = 'approved'
        `;

        const [statsResult] = await connection.execute(statsQuery, [input.countryCode]);
        const stats = (statsResult as any[])[0] || {};

        await connection.end();

        return {
          reviews: reviews || [],
          total,
          stats: {
            averageRating: Math.round(stats.averageRating * 10) / 10 || 0,
            totalReviews: stats.totalReviews || 0,
            fiveStars: stats.fiveStars || 0,
            fourStars: stats.fourStars || 0,
            threeStars: stats.threeStars || 0,
            twoStars: stats.twoStars || 0,
            oneStar: stats.oneStar || 0,
            visaObtainedCount: stats.visaObtainedCount || 0,
          },
        };
      } catch (error: any) {
        console.error('Erreur lors de la récupération des avis:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la récupération des avis',
        });
      }
    }),

  /**
   * Créer un nouvel avis
   */
  createReview: protectedProcedure
    .input(
      z.object({
        countryCode: z.string(),
        rating: z.number().min(1).max(5),
        title: z.string().min(5).max(100),
        comment: z.string().min(10).max(1000),
        travelDate: z.string().optional(),
        visaObtained: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const candidateId = ctx.user?.id;
        const candidateName = ctx.user?.name || 'Anonyme';

        if (!candidateId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Vous devez être connecté',
          });
        }

        const dbUrl = process.env.DATABASE_URL || '';
        const mysql = await import('mysql2/promise');
        const connection = await mysql.createConnection(dbUrl);

        // Vérifier que l'e-visa existe
        const [evisa] = await connection.execute(
          `SELECT * FROM evisas WHERE countryCode = ? AND isActive = true`,
          [input.countryCode]
        );

        if (!evisa || (evisa as any[]).length === 0) {
          await connection.end();
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'E-visa non trouvé',
          });
        }

        // Vérifier si l'utilisateur a déjà laissé un avis pour ce pays
        const [existingReview] = await connection.execute(
          `SELECT id FROM evisaReviews WHERE evisaCountryCode = ? AND candidateId = ?`,
          [input.countryCode, candidateId]
        );

        if (existingReview && (existingReview as any[]).length > 0) {
          await connection.end();
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Vous avez déjà laissé un avis pour ce pays',
          });
        }

        // Créer l'avis
        await connection.execute(
          `INSERT INTO evisaReviews (evisaCountryCode, candidateId, candidateName, rating, title, comment, travelDate, visaObtained, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [input.countryCode, candidateId, candidateName, input.rating, input.title, input.comment, input.travelDate || null, input.visaObtained]
        );

        await connection.end();

        return {
          success: true,
          message: 'Avis créé avec succès. Il sera publié après modération.',
        };
      } catch (error: any) {
        console.error('Erreur lors de la création de l\'avis:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la création de l\'avis',
        });
      }
    }),

  /**
   * Marquer un avis comme utile
   */
  markHelpful: publicProcedure
    .input(
      z.object({
        reviewId: z.number(),
        helpful: z.boolean(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const mysql = await import('mysql2/promise');
        const connection = await mysql.createConnection(dbUrl);

        if (input.helpful) {
          await connection.execute(
            `UPDATE evisaReviews SET helpful = helpful + 1 WHERE id = ?`,
            [input.reviewId]
          );
        } else {
          await connection.execute(
            `UPDATE evisaReviews SET unhelpful = unhelpful + 1 WHERE id = ?`,
            [input.reviewId]
          );
        }

        await connection.end();

        return { success: true };
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour de l\'avis:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour de l\'avis',
        });
      }
    }),

  /**
   * Récupérer les avis en attente de modération (admin)
   */
  getPendingReviews: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }: any) => {
      try {
        // Vérifier que l'utilisateur est admin
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Accès refusé',
          });
        }

        const dbUrl = process.env.DATABASE_URL || '';
        const mysql = await import('mysql2/promise');
        const connection = await mysql.createConnection(dbUrl);

        const [reviews] = await connection.execute(
          `SELECT * FROM evisaReviews WHERE status = 'pending' ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
          [input.limit, input.offset]
        );

        const [countResult] = await connection.execute(
          `SELECT COUNT(*) as total FROM evisaReviews WHERE status = 'pending'`
        );

        const total = (countResult as any[])[0]?.total || 0;

        await connection.end();

        return {
          reviews: reviews || [],
          total,
        };
      } catch (error: any) {
        console.error('Erreur lors de la récupération des avis en attente:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la récupération des avis',
        });
      }
    }),

  /**
   * Approuver ou rejeter un avis (admin)
   */
  moderateReview: protectedProcedure
    .input(
      z.object({
        reviewId: z.number(),
        approved: z.boolean(),
        adminNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        // Vérifier que l'utilisateur est admin
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Accès refusé',
          });
        }

        const dbUrl = process.env.DATABASE_URL || '';
        const mysql = await import('mysql2/promise');
        const connection = await mysql.createConnection(dbUrl);

        const status = input.approved ? 'approved' : 'rejected';

        await connection.execute(
          `UPDATE evisaReviews SET status = ?, adminNote = ? WHERE id = ?`,
          [status, input.adminNote || null, input.reviewId]
        );

        await connection.end();

        return {
          success: true,
          message: `Avis ${input.approved ? 'approuvé' : 'rejeté'} avec succès`,
        };
      } catch (error: any) {
        console.error('Erreur lors de la modération de l\'avis:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la modération de l\'avis',
        });
      }
    }),

  /**
   * Supprimer un avis (admin)
   */
  deleteReview: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input, ctx }: any) => {
      try {
        // Vérifier que l'utilisateur est admin
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Accès refusé',
          });
        }

        const dbUrl = process.env.DATABASE_URL || '';
        const mysql = await import('mysql2/promise');
        const connection = await mysql.createConnection(dbUrl);

        await connection.execute(`DELETE FROM evisaReviews WHERE id = ?`, [input.reviewId]);

        await connection.end();

        return { success: true, message: 'Avis supprimé avec succès' };
      } catch (error: any) {
        console.error('Erreur lors de la suppression de l\'avis:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la suppression de l\'avis',
        });
      }
    }),
});
