/**
 * Routeur pour la gestion des e-visas
 * Procédures pour lister, créer et gérer les demandes e-visa
 */

import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { candidateProcedure } from './candidate';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { randomBytes } from 'node:crypto';
import mysql from 'mysql2/promise';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';
import { storagePut } from '../storage';
import { sendEmail } from '../_core/email';
import { buildPassportCorrectionAudit } from '../services/passportCorrectionHistory';
import { requireValidAdminSession } from './adminAuth';

function esc(v: string | number | undefined | null): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const evisaRouter = router({
  /**
   * Récupérer tous les e-visas disponibles avec filtres
   */
  getAllEvisas: publicProcedure
    .input(
      z.object({
        region: z.string().max(100).optional(),
        search: z.string().max(200).optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
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
    .input(z.object({ countryCode: z.string().max(100) }))
    .query(async ({ input }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);
        const queryTerm = input.countryCode.toLowerCase().trim();
        let [evisa] = await connection.execute(`
          SELECT * FROM evisas 
          WHERE (LOWER(countryCode) = ? OR LOWER(countryName) LIKE ? OR LOWER(id) = ?) AND isActive = true
          LIMIT 1
        `, [queryTerm, `%${queryTerm}%`, queryTerm]);

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
        if (error instanceof TRPCError) throw error;
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
        dossierNumber: z.string().max(50),
        countryCode: z.string().max(10),
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

        // Récupérer les informations de l'e-visa pour connaître les documents requis
        const evisaResult = await db.execute(sql`
          SELECT * FROM evisas WHERE countryCode = ${input.countryCode} AND isActive = true
        `);

        const evisas = (evisaResult as any).rows || [];
        if (!evisas || evisas.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'E-visa non trouvé',
          });
        }

        // Vérifier que le dossier existe
        const appResult = await db.execute(sql`
          SELECT * FROM applications WHERE dossierNumber = ${input.dossierNumber} AND candidateId = ${candidateId}
        `);

        const applications = (appResult as any).rows || [];
        if (!applications || applications.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Dossier non trouvé',
          });
        }

        const documentsJson = JSON.stringify(input.documents || {});
        // Créer la demande d'e-visa
        await db.execute(sql`
          INSERT INTO evisaApplications (
            candidateId,
            dossierNumber,
            evisaCountryCode,
            status,
            paymentAmount,
            documents
          ) VALUES (${candidateId}, ${input.dossierNumber}, ${input.countryCode}, 'pending', ${evisas[0].price}, ${documentsJson})
        `);

        // Demande enregistrée avec succès
        console.log(`[Evisa Application] Créée pour dossier ${input.dossierNumber} et pays ${input.countryCode}`);

        return {
          success: true,
          message: 'Demande d\'e-visa créée avec succès',
          evisaCountryCode: input.countryCode,
        };
      } catch (error: any) {
        console.error('Erreur lors de la création de la demande d\'e-visa:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création de la demande',
        });
      }
    }),

  /**
   * Récupérer les demandes d'e-visa du candidat
   */
  getMyEvisaApplications: protectedProcedure
    .input(z.object({ dossierNumber: z.string().max(50).optional() }))
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
        applicationId: z.number().int().positive(),
        status: z.enum(['pending', 'approved', 'rejected', 'processing', 'completed']),
        rejectionReason: z.string().max(2000).optional(),
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
        applicationId: z.number().int().positive(),
        amount: z.number().positive(),
        description: z.string().max(500),
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
        const transactionRef = `EVISA-${Date.now()}-${randomBytes(4).toString("hex")}`;

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
        applicationId: z.number().int().positive(),
        transactionId: z.string().max(64),
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
        fullName: z.string().min(1, 'Le nom complet est requis').max(255),
        email: z.string().email('Email invalide').max(320),
        phone: z.string().min(1, 'Le téléphone est requis').max(50),
        nationality: z.string().max(100).optional(),
        dateOfBirth: z.string().max(20).optional(),
        countryCode: z.string().min(1, 'Le code pays est requis').max(10),
        countryName: z.string().min(1, 'Le nom du pays est requis').max(100),
        evisaType: z.string().max(100).optional(),
        visaFee: z.number().min(0).default(0),
        accompanimentFee: z.number().min(0).default(25000),
        totalCost: z.number().positive().default(25000),
        currency: z.string().max(10).default('XOF'),
        notes: z.string().max(2000).optional(),
        passportFile: z.string().max(500).optional(),
        passportFileName: z.string().max(255).optional(),
        passportFileSize: z.number().int().min(0).optional(),
        passportExtractedData: z.record(z.string(), z.unknown()).optional(),
        passportValidatedData: z.record(z.string(), z.unknown()).optional(),
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
            passportFile,
            passportFileName,
            passportFileSize,
            passportUploadedAt,
            status,
            createdAt,
            updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', NOW(), NOW())
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
          input.passportFile || null,
          input.passportFileName || null,
          input.passportFileSize || null,
          input.passportFile ? new Date() : null,
        ];

        const [result] = await connection.execute(query, params);
        const requestId = (result as any).insertId;

        if (input.passportValidatedData) {
          const audit = buildPassportCorrectionAudit(
            input.passportExtractedData || {},
            input.passportValidatedData || {},
          );

          await connection.execute(
            `INSERT INTO evisa_passport_correction_history
              (requestId, actorEmail, actorName, source, changedFields, previousData, nextData)
             VALUES (?, ?, ?, 'candidate', ?, ?, ?)`,
            [
              requestId,
              input.email,
              input.fullName,
              JSON.stringify(audit.changedFields),
              JSON.stringify(audit.previousData),
              JSON.stringify(audit.nextData),
            ]
          );
        }

        await connection.end();

        return {
          success: true,
          message: 'Demande d\'e-visa soumise avec succès',
          requestId,
        };
      } catch (error: any) {
        console.error('Erreur lors de la soumission de la demande d\'e-visa:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la soumission de la demande',
        });
      }
    }),

  /**
   * Demandes d'e-visa du candidat connecté (suivi espace client). L'e-mail vient du compte authentifié, jamais
   * d'un paramètre : l'ancienne version publique livrait `SELECT *` (passeport, date de naissance, téléphone,
   * notes internes) pour n'importe quelle adresse e-mail connue.
   */
  getMyEvisaRequests: candidateProcedure
    .query(async ({ ctx }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);
        const [requests] = await connection.execute(`
          SELECT id, countryCode, countryName, evisaType, totalCost, currency, status, issuedPdfUrl, createdAt, updatedAt
          FROM evisa_requests
          WHERE email = ?
          ORDER BY createdAt DESC
        `, [ctx.candidate.email]);
        await connection.end();
        return { success: true, data: requests || [] };
      } catch (error) {
        console.error('Erreur lors de la récupération des e-visa requests:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des demandes d\'e-visa',
        });
      }
    }),

  /**
   * Téléversement administrateur du document e-Visa final approuvé (PDF),
   * mise à jour du statut en 'approved' et envoi synchrone par e-mail au client.
   */
  adminUploadEvisaPdf: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().min(1),
        requestId: z.number().int().positive(),
        fileBase64: z.string().min(1),
        fileName: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ input }: any) => {
      let connection: mysql.Connection | null = null;
      try {
        // Ne jamais accepter la simple présence d’un jeton : il doit correspondre
        // à un compte administrateur actif, non expiré et autorisé côté serveur.
        await requireValidAdminSession(input.sessionToken);

        const rawBase64 = input.fileBase64.replace(/^data:application\/pdf;base64,/i, '').replace(/\s/g, '');
        if (rawBase64.length > 16 * 1024 * 1024) {
          throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'Le PDF e-Visa dépasse la taille autorisée.' });
        }
        const buffer = Buffer.from(rawBase64, 'base64');
        if (!buffer.length || buffer.length > 12 * 1024 * 1024 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seul un document PDF e-Visa valide peut être téléversé.' });
        }
        const safeName = input.fileName.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
        if (!safeName.toLowerCase().endsWith('.pdf')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Le document final doit porter une extension .pdf.' });
        }
        const dbUrl = process.env.DATABASE_URL || '';
        connection = await mysql.createConnection(dbUrl);

        // Récupérer la demande e-visa
        const [rows]: any = await connection.execute(`
          SELECT * FROM evisa_requests WHERE id = ?
        `, [input.requestId]);

        if (!rows || rows.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Demande d\'e-visa introuvable.' });
        }

        const req = rows[0];

        // Stocker le fichier PDF via storagePut
        const storageKey = `evisa-docs/${input.requestId}-${Date.now()}-${safeName}`;
        const stored = await storagePut(storageKey, buffer, 'application/pdf');

        // Mettre à jour la base de données
        await connection.execute(`
          UPDATE evisa_requests 
          SET status = 'approved', issuedPdfUrl = ?, updatedAt = NOW() 
          WHERE id = ?
        `, [stored.url, input.requestId]);

        // La demande est déjà validée et son PDF est dans l’espace candidat.
        // L’échec e-mail est donc journalisé sans annuler ni masquer ce résultat.
        let emailSent = true;
        try {
          await sendEmail({
          to: req.email,
          subject: `[3M Travel] Votre e-Visa pour ${req.countryName} est disponible - Dossier #${req.id}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff;">
              <h2 style="color: #1e3a8a; margin-top: 0;">Votre e-Visa est approuvé et disponible !</h2>
              <p>Bonjour <strong>${esc(req.fullName)}</strong>,</p>
              <p>Nous avons le plaisir de vous informer que votre demande d'e-Visa pour <strong>${esc(req.countryName)}</strong> a été traitée avec succès et approuvée par les services consulaires.</p>
              <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #bbf7d0;">
                <p style="margin: 0 0 8px 0; color: #166534;"><strong>Destination :</strong> ${esc(req.countryName)}</p>
                <p style="margin: 0 0 8px 0; color: #166534;"><strong>Référence de demande :</strong> #${req.id}</p>
                <p style="margin: 0; color: #166534;"><strong>Statut :</strong> Approuvé & Prêt au voyage</p>
              </div>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${stored.url}" target="_blank" style="background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">Télécharger mon e-Visa officiel (PDF)</a>
              </p>
              <p>Vous pouvez également retrouver ce document à tout moment dans votre espace personnel sur notre site.</p>
              <p style="margin-top: 30px; font-size: 13px; color: #64748b;">Cordialement,<br/><strong>L'équipe 3M Travel & Services</strong></p>
            </div>
          `,
          });
        } catch (emailError) {
          emailSent = false;
          console.error('Notification e-mail e-Visa non envoyée après validation:', emailError);
        }

        return { success: true, pdfUrl: stored.url, emailSent };
      } catch (error: any) {
        console.error('Erreur lors du téléversement administrateur de l\'e-Visa:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors du téléversement du document e-Visa',
        });
      } finally {
        await connection?.end().catch(() => undefined);
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

  /**
   * Sauvegarder un brouillon e-Visa dans le cloud (associé à un email)
   */
  saveCloudDraft: publicProcedure
    .input(z.object({
      email: z.string().email().max(320),
      countryCode: z.string().max(10),
      // Un brouillon de formulaire tient en quelques Ko : sans borne, n'importe qui pouvait remplir la base.
      draftData: z.any().refine(value => JSON.stringify(value ?? null).length <= 50_000, "Brouillon trop volumineux"),
    }))
    .mutation(async ({ input }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);
        // S'assurer que la table evisa_drafts existe
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS evisa_drafts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            countryCode VARCHAR(50) NOT NULL,
            draftData TEXT NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_email_country (email, countryCode)
          )
        `);
        await connection.execute(`
          INSERT INTO evisa_drafts (email, countryCode, draftData)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE draftData = VALUES(draftData), updatedAt = CURRENT_TIMESTAMP
        `, [input.email, input.countryCode, JSON.stringify(input.draftData)]);
        await connection.end();
        return { success: true, message: 'Brouillon synchronisé avec succès dans le cloud.' };
      } catch (error: any) {
        console.error('Erreur cloud draft save:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Une erreur interne est survenue' });
      }
    }),

  /**
   * Indique seulement si un brouillon e-Visa existe dans le cloud pour cette adresse et ce pays. Le contenu
   * (identité, passeport…) n'est jamais renvoyé : l'appel est public et l'e-mail n'est pas une preuve, et le
   * formulaire n'utilise que ce signal pour afficher le badge « Synchronisé Cloud ».
   */
  getCloudDraft: publicProcedure
    .input(z.object({ email: z.string().email().max(320), countryCode: z.string().max(10) }))
    .query(async ({ input }: any) => {
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS evisa_drafts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            countryCode VARCHAR(50) NOT NULL,
            draftData TEXT NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_email_country (email, countryCode)
          )
        `);
        const [rows]: any = await connection.execute(`
          SELECT id FROM evisa_drafts WHERE email = ? AND countryCode = ? LIMIT 1
        `, [input.email, input.countryCode]);
        await connection.end();
        if (rows && rows.length > 0) {
          return { success: true, data: { synced: true } };
        }
        return { success: true, data: null };
      } catch (error) {
        console.error('Erreur cloud draft get:', error);
        return { success: true, data: null };
      }
    }),

  /**
   * Générer un récapitulatif PDF proforma de la demande e-Visa avant validation finale
   */
  generateProformaPdf: publicProcedure
    .input(
      z.object({
        fullName: z.string().max(255),
        email: z.string().max(320),
        phone: z.string().max(50),
        countryName: z.string().max(100),
        totalCost: z.number().positive(),
        currency: z.string().max(10),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Helvetica', Arial, sans-serif; color: #1e293b; padding: 40px; }
              .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
              .title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
              .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
              .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
              .label { font-weight: bold; color: #475569; }
              .value { color: #0f172a; }
              .total { font-size: 18px; font-weight: bold; color: #1e3a8a; border-top: 2px solid #cbd5e1; padding-top: 10px; margin-top: 10px; }
              .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #e2e8f0; paddingTop: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">3M TRAVEL & SERVICES</div>
                <div class="subtitle">Agence de Mobilité Internationale & E-Visas</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: bold; color: #2563eb;">PROFORMA DE DEMANDE</div>
                <div style="font-size: 12px; color: #64748b;">Date : ${new Date().toLocaleDateString('fr-FR')}</div>
              </div>
            </div>

            <div class="box">
              <h3 style="margin-top: 0; color: #1e3a8a; font-size: 16px;">Informations du Candidat</h3>
              <div class="row"><span class="label">Nom complet :</span> <span class="value">${input.fullName}</span></div>
              <div class="row"><span class="label">E-mail :</span> <span class="value">${input.email}</span></div>
              <div class="row"><span class="label">Téléphone :</span> <span class="value">${input.phone}</span></div>
              <div class="row"><span class="label">Destination :</span> <span class="value">${input.countryName}</span></div>
            </div>

            <div class="box">
              <h3 style="margin-top: 0; color: #1e3a8a; font-size: 16px;">Détail des Frais d'Accompagnement</h3>
              <div class="row"><span class="label">Procédure e-Visa (${input.countryName})</span> <span class="value">${input.totalCost.toLocaleString()} ${input.currency}</span></div>
              <div class="row"><span class="label">Frais de dossier et traduction</span> <span class="value">Inclus</span></div>
              <div class="total row"><span>Total à régler :</span> <span>${input.totalCost.toLocaleString()} ${input.currency}</span></div>
            </div>

            <div class="footer">
              <p>3M Travel & Services SARL — Document généré automatiquement avant validation finale.</p>
              <p>Ce document atteste de la préparation de votre dossier e-Visa. Il ne constitue pas un visa officiel.</p>
            </div>
          </body>
          </html>
        `;

        const fileKey = `proforma_evisa_${Date.now()}.html`;
        const buffer = Buffer.from(htmlContent, 'utf-8');
        const upload = await storagePut(fileKey, buffer, 'text/html');

        return { success: true, url: upload.url };
      } catch (error: any) {
        console.error('Erreur proforma PDF:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Une erreur interne est survenue' });
      }
    }),

  getExchangeRates: publicProcedure.query(async () => {
    return { success: true, eurToXaf: 656, usdToXaf: 600 };
  }),

  updateExchangeRates: publicProcedure
    .input(z.object({ eurToXaf: z.number().positive(), usdToXaf: z.number().positive() }))
    .mutation(async ({ input }) => {
      return { success: true, eurToXaf: input.eurToXaf, usdToXaf: input.usdToXaf };
    }),
});
