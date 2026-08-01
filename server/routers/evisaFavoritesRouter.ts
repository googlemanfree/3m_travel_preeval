/**
 * Routeur pour la gestion des favoris d'e-visas
 */

import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';
import { getDb } from '../db';

export const evisaFavoritesRouter = router({
  // Ajouter un e-visa aux favoris
  addFavorite: protectedProcedure
    .input(
      z.object({
        countryCode: z.string(),
        countryName: z.string(),
        price: z.number().optional(),
        processingTime: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const candidateId = ctx.user?.id;
        if (!candidateId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Vous devez être connecté',
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Base de données non disponible',
          });
        }

        // Utiliser une requête SQL brute pour INSERT ... ON DUPLICATE KEY UPDATE
        await db.execute(sql.raw(`
          INSERT INTO evisaFavorites (candidateId, countryCode, countryName, price, processingTime)
          VALUES ('${candidateId}', '${input.countryCode}', '${input.countryName}', ${input.price || null}, '${input.processingTime || null}')
          ON DUPLICATE KEY UPDATE addedAt = CURRENT_TIMESTAMP
        `));

        return {
          success: true,
          message: `${input.countryName} ajouté aux favoris`,
        };
      } catch (error) {
        console.error('Erreur lors de l\'ajout aux favoris:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'ajout aux favoris',
        });
      }
    }),

  // Retirer un e-visa des favoris
  removeFavorite: protectedProcedure
    .input(z.object({ countryCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const candidateId = ctx.user?.id;
        if (!candidateId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Vous devez être connecté',
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Base de données non disponible',
          });
        }

        await db.execute(sql.raw(`
          DELETE FROM evisaFavorites WHERE candidateId = '${candidateId}' AND countryCode = '${input.countryCode}'
        `));

        return {
          success: true,
          message: 'Retiré des favoris',
        };
      } catch (error) {
        console.error('Erreur lors de la suppression des favoris:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la suppression des favoris',
        });
      }
    }),

  // Récupérer tous les favoris de l'utilisateur
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    try {
      const candidateId = ctx.user?.id;
      if (!candidateId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Vous devez être connecté',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Base de données non disponible',
        });
      }

      const favorites = await db.execute(sql.raw(`
        SELECT 
          id,
          countryCode,
          countryName,
          price,
          processingTime,
          addedAt
        FROM evisaFavorites
        WHERE candidateId = '${candidateId}'
        ORDER BY addedAt DESC
      `));

      return {
        data: (favorites as any).rows || [],
        count: ((favorites as any).rows || []).length,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération des favoris',
      });
    }
  }),

  // Vérifier si un e-visa est dans les favoris
  isFavorite: protectedProcedure
    .input(z.object({ countryCode: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const candidateId = ctx.user?.id;
        if (!candidateId) {
          return { isFavorite: false };
        }

        const db = await getDb();
        if (!db) {
          return { isFavorite: false };
        }

        const result = await db.execute(sql.raw(`
          SELECT id FROM evisaFavorites WHERE candidateId = '${candidateId}' AND countryCode = '${input.countryCode}' LIMIT 1
        `));

        return {
          isFavorite: ((result as any).rows || []).length > 0,
        };
      } catch (error) {
        console.error('Erreur lors de la vérification des favoris:', error);
        return { isFavorite: false };
      }
    }),

  // Vérifier les favoris pour plusieurs pays
  checkFavorites: protectedProcedure
    .input(z.object({ countryCodes: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      try {
        const candidateId = ctx.user?.id;
        if (!candidateId) {
          return { favorites: {} };
        }

        if (input.countryCodes.length === 0) {
          return { favorites: {} };
        }

        const db = await getDb();
        if (!db) {
          const favorites: Record<string, boolean> = {};
          input.countryCodes.forEach((code) => {
            favorites[code] = false;
          });
          return { favorites };
        }

        const codesStr = input.countryCodes.map(c => `'${c}'`).join(',');
        const result = await db.execute(sql.raw(`
          SELECT countryCode FROM evisaFavorites
          WHERE candidateId = '${candidateId}' AND countryCode IN (${codesStr})
        `));

        const favorites: Record<string, boolean> = {};
        input.countryCodes.forEach((code) => {
          favorites[code] = ((result as any).rows || []).some((row: any) => row.countryCode === code);
        });

        return { favorites };
      } catch (error) {
        console.error('Erreur lors de la vérification des favoris:', error);
        const favorites: Record<string, boolean> = {};
        input.countryCodes.forEach((code) => {
          favorites[code] = false;
        });
        return { favorites };
      }
    }),

  // Supprimer tous les favoris
  clearFavorites: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const candidateId = ctx.user?.id;
      if (!candidateId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Vous devez être connecté',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Base de données non disponible',
        });
      }

      await db.execute(sql.raw(`
        DELETE FROM evisaFavorites WHERE candidateId = '${candidateId}'
      `));

      return {
        success: true,
        message: 'Tous les favoris ont été supprimés',
      };
    } catch (error) {
      console.error('Erreur lors de la suppression des favoris:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la suppression des favoris',
      });
    }
  }),
});
