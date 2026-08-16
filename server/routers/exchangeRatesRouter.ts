import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import mysql from 'mysql2/promise';

/**
 * Routeur pour la gestion et la persistance des taux de change (XAF, EUR, USD) avec historique
 */
export const exchangeRatesRouter = router({
  getRates: publicProcedure.query(async () => {
    try {
      const dbUrl = process.env.DATABASE_URL || '';
      const connection = await mysql.createConnection(dbUrl);

      // S'assurer que la table existe
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS exchange_rates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          eurToXaf DECIMAL(10,2) NOT NULL DEFAULT 656.00,
          usdToXaf DECIMAL(10,2) NOT NULL DEFAULT 600.00,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      const [rows]: any = await connection.execute('SELECT * FROM exchange_rates ORDER BY id DESC LIMIT 1');
      await connection.end();

      if (rows && rows.length > 0) {
        return {
          success: true,
          eurToXaf: Number(rows[0].eurToXaf),
          usdToXaf: Number(rows[0].usdToXaf),
          updatedAt: rows[0].updatedAt,
        };
      }

      return { success: true, eurToXaf: 656, usdToXaf: 600, updatedAt: new Date() };
    } catch (error) {
      console.error('Erreur getRates:', error);
      return { success: true, eurToXaf: 656, usdToXaf: 600, updatedAt: new Date() };
    }
  }),

  updateRates: publicProcedure
    .input(
      z.object({
        eurToXaf: z.number().positive(),
        usdToXaf: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        await connection.execute(`
          CREATE TABLE IF NOT EXISTS exchange_rates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            eurToXaf DECIMAL(10,2) NOT NULL DEFAULT 656.00,
            usdToXaf DECIMAL(10,2) NOT NULL DEFAULT 600.00,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);

        await connection.execute(
          'INSERT INTO exchange_rates (eurToXaf, usdToXaf) VALUES (?, ?)',
          [input.eurToXaf, input.usdToXaf]
        );

        await connection.end();
        return { success: true, eurToXaf: input.eurToXaf, usdToXaf: input.usdToXaf };
      } catch (error: any) {
        console.error('Erreur updateRates:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),
});
