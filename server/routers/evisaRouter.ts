/**
 * Routeur pour la gestion des e-visas
 * Procédures pour lister, créer et gérer les demandes e-visa
 */

import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import mysql from 'mysql2/promise';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';

export const evisaRouter = router({
  /**
   * Récupérer tous les e-visas disponibles avec filtres
   */
  getAllEvisas: publicProcedure
    .input(
      z.object({
        region: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);
        
        let query = 'SELECT * FROM evisas WHERE isActive = true';
        const params: any[] = [];

        if (input.region) {
          query += ' AND region = ?';
          params.push(input.region);
        }

        if (input.search) {
          const searchTerm = `%${input.search}%`;
          query += ' AND (countryName LIKE ? OR description LIKE ?)';
          params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY countryName ASC LIMIT ? OFFSET ?';
        params.push(input.limit, input.offset);

        const [evisas] = await connection.execute(query, params);
        await connection.end();

        return { success: true, data: evisas || [] };
      } catch (error) {
        console.error('Erreur lors de la récupération des e-visas:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des e-visas',
        });
      }
    }),

  /**
   * Récupérer les régions disponibles
   */
  getRegions: publicProcedure.query(async () => {
    try {
      const dbUrl = process.env.DATABASE_URL || '';
      const connection = await mysql.createConnection(dbUrl);
      const [regions] = await connection.execute(`
        SELECT DISTINCT region FROM evisas 
        WHERE isActive = true AND region IS NOT NULL
        ORDER BY region ASC
      `);
      await connection.end();

      return { success: true, data: regions || [] };
    } catch (error) {
      console.error('Erreur lors de la récupération des régions:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération des régions',
      });
    }
  }),

  /**
   * Récupérer les détails d'un e-visa
   */
  getEvisaByCountry: publicProcedure
    .input(z.object({ countryCode: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);
        const [evisa] = await connection.execute(`
          SELECT * FROM evisas 
          WHERE countryCode = ? AND isActive = true
        `, [input.countryCode]);
        await connection.end();

        if (!evisa || (evisa as any[]).length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'E-visa non trouvé',
          });
        }

        return { success: true, data: (evisa as any[])[0] };
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'e-visa:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération de l\'e-visa',
        });
      }
    }),

  /**
   * Créer une demande d'e-visa
   */
  createEvisaApplication: protectedProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        countryCode: z.string(),
        documents: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
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

        // Vérifier que l'e-visa existe
        const evisaResult = await db.execute(sql.raw(`
          SELECT * FROM evisas WHERE countryCode = '${input.countryCode}' AND isActive = true
        `));

        const evisas = (evisaResult as any).rows || [];
        if (!evisas || evisas.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'E-visa non trouvé',
          });
        }

        // Vérifier que le dossier existe
        const appResult = await db.execute(sql.raw(`
          SELECT * FROM applications WHERE dossierNumber = '${input.dossierNumber}' AND candidateId = '${candidateId}'
        `));

        const applications = (appResult as any).rows || [];
        if (!applications || applications.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Dossier non trouvé',
          });
        }

        // Créer la demande d'e-visa
        await db.execute(sql.raw(`
          INSERT INTO evisaApplications (
            candidateId, 
            dossierNumber, 
            evisaCountryCode, 
            status, 
            paymentAmount, 
            documents
          ) VALUES ('${candidateId}', '${input.dossierNumber}', '${input.countryCode}', 'pending', ${evisas[0].price}, '${JSON.stringify(input.documents || {})}')
        `));

        return {
          success: true,
          message: 'Demande d\'e-visa créée avec succès',
          evisaCountryCode: input.countryCode,
        };
      } catch (error: any) {
        console.error('Erreur lors de la création de la demande d\'e-visa:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la création de la demande',
        });
      }
    }),

  /**
   * Récupérer les demandes d'e-visa du candidat
   */
  getMyEvisaApplications: protectedProcedure
    .input(z.object({ dossierNumber: z.string().optional() }))
    .query(async ({ input, ctx }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        let query = `
          SELECT 
            ea.*,
            e.countryName,
            e.region,
            e.processingTime,
            e.validityDays,
            e.requirements,
            e.documents as requiredDocuments,
            e.description
          FROM evisaApplications ea
          JOIN evisas e ON ea.evisaCountryCode = e.countryCode
          WHERE ea.candidateId = ?
        `;
        const params: any[] = [ctx.user.id];

        if (input.dossierNumber) {
          query += ' AND ea.dossierNumber = ?';
          params.push(input.dossierNumber);
        }

        query += ' ORDER BY ea.createdAt DESC';

        const [applications] = await connection.execute(query, params);
        await connection.end();

        return { success: true, data: applications || [] };
      } catch (error) {
        console.error('Erreur lors de la récupération des demandes d\'e-visa:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des demandes',
        });
      }
    }),

  /**
   * Mettre à jour le statut d'une demande d'e-visa (admin)
   */
  updateEvisaApplicationStatus: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        status: z.enum(['pending', 'approved', 'rejected', 'processing', 'completed']),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Accès refusé',
        });
      }

      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        const approvalDate = input.status === 'approved' ? new Date() : null;
        const rejectionReason = input.status === 'rejected' && input.rejectionReason ? input.rejectionReason : null;

        const query = `
          UPDATE evisaApplications 
          SET status = ?, approvalDate = ?, rejectionReason = ?, updatedAt = ?
          WHERE id = ?
        `;

        await connection.execute(query, [
          input.status,
          approvalDate,
          rejectionReason,
          new Date(),
          input.applicationId,
        ]);

        await connection.end();

        return {
          success: true,
          message: 'Statut de la demande mis à jour',
        };
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour du statut',
        });
      }
    }),

  /**
   * Initier le paiement d'une demande d'e-visa
   */
  initiateEvisaPayment: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        amount: z.number(),
        description: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        // Vérifier que la demande appartient au candidat
        const [application] = await connection.execute(`
          SELECT * FROM evisaApplications WHERE id = ? AND candidateId = ?
        `, [input.applicationId, ctx.user.id]);

        if (!application || (application as any[]).length === 0) {
          await connection.end();
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Demande d\'e-visa non trouvée',
          });
        }

        // Générer une référence de transaction unique
        const transactionRef = `EVISA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Mettre à jour le statut du paiement
        await connection.execute(`
          UPDATE evisaApplications 
          SET paymentStatus = 'pending', transactionId = ?
          WHERE id = ?
        `, [transactionRef, input.applicationId]);

        await connection.end();

        return {
          success: true,
          transactionRef,
          amount: input.amount,
          description: input.description,
        };
      } catch (error) {
        console.error('Erreur lors de l\'initiation du paiement:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'initiation du paiement',
        });
      }
    }),

  /**
   * Confirmer le paiement d'une demande d'e-visa
   */
  confirmEvisaPayment: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        transactionId: z.string(),
        status: z.enum(['paid', 'failed']),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        // Vérifier que la demande appartient au candidat
        const [application] = await connection.execute(`
          SELECT * FROM evisaApplications WHERE id = ? AND candidateId = ?
        `, [input.applicationId, ctx.user.id]);

        if (!application || (application as any[]).length === 0) {
          await connection.end();
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Demande d\'e-visa non trouvée',
          });
        }

        // Mettre à jour le statut du paiement
        await connection.execute(`
          UPDATE evisaApplications 
          SET paymentStatus = ?, transactionId = ?, updatedAt = ?
          WHERE id = ?
        `, [input.status, input.transactionId, new Date(), input.applicationId]);

        await connection.end();

        return {
          success: true,
          message: input.status === 'paid' ? 'Paiement confirmé avec succès' : 'Paiement échoué',
        };
      } catch (error) {
        console.error('Erreur lors de la confirmation du paiement:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la confirmation du paiement',
        });
      }
    }),

  /**
   * Soumettre une demande d'e-visa
   */
  submitRequest: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(1, 'Le nom complet est requis'),
        email: z.string().email('Email invalide'),
        phone: z.string().min(1, 'Le téléphone est requis'),
        nationality: z.string().optional(),
        dateOfBirth: z.string().optional(),
        countryCode: z.string().min(1, 'Le code pays est requis'),
        countryName: z.string().min(1, 'Le nom du pays est requis'),
        evisaType: z.string().optional(),
        visaFee: z.number().default(0),
        accompanimentFee: z.number().default(25000),
        totalCost: z.number().default(25000),
        currency: z.string().default('XOF'),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);

        const query = `
          INSERT INTO evisa_requests (
            fullName,
            email,
            phone,
            nationality,
            dateOfBirth,
            countryCode,
            countryName,
            evisaType,
            visaFee,
            accompanimentFee,
            totalCost,
            currency,
            notes,
            status,
            createdAt,
            updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', NOW(), NOW())
        `;

        const params = [
          input.fullName,
          input.email,
          input.phone,
          input.nationality || null,
          input.dateOfBirth || null,
          input.countryCode,
          input.countryName,
          input.evisaType || 'Tourism',
          input.visaFee,
          input.accompanimentFee,
          input.totalCost,
          input.currency,
          input.notes || null,
        ];

        const [result] = await connection.execute(query, params);
        await connection.end();

        return {
          success: true,
          message: 'Demande d\'e-visa soumise avec succès',
          requestId: (result as any).insertId,
        };
      } catch (error: any) {
        console.error('Erreur lors de la soumission de la demande d\'e-visa:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la soumission de la demande',
        });
      }
    }),

  /**
   * Récupérer les statistiques des e-visas
   */
  getEvisaStats: publicProcedure.query(async () => {
    try {
      const dbUrl = process.env.DATABASE_URL || '';
      const connection = await mysql.createConnection(dbUrl);

      const [stats] = await connection.execute(`
        SELECT 
          COUNT(DISTINCT countryCode) as totalCountries,
          COUNT(DISTINCT region) as totalRegions,
          MIN(price) as minPrice,
          MAX(price) as maxPrice,
          AVG(price) as avgPrice
        FROM evisas 
        WHERE isActive = true
      `);

      const [applicationStats] = await connection.execute(`
        SELECT 
          COUNT(*) as totalApplications,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvedCount,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejectedCount,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processingCount,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount
        FROM evisaApplications
      `);

      await connection.end();

      return {
        success: true,
        data: {
          evisas: (stats as any[])?.[0] || {},
          applications: (applicationStats as any[])?.[0] || {},
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération des statistiques',
      });
    }
  }),
});
