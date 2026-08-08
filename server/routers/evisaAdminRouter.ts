/**
import { generateDossierNumber } from "../services/dossierNumberService";
 * Routeur admin pour la gestion des demandes e-visa
 * Synchronisation en temps réel, notifications et gestion des dossiers
 */

import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import mysql from 'mysql2/promise';
// Générer un numéro de dossier unique
export const evisaAdminRouter = router({
  /**
   * Récupérer toutes les demandes e-visa (admin seulement)
   */
  getAllRequests: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        countryCode: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }: any) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Seuls les administrateurs peuvent accéder à cette ressource',
        });
      }
      try {
        const dbUrl = process.env.DATABASE_URL || '';
        const connection = await mysql.createConnection(dbUrl);
        let whereClause = '1=1';
        const params: any[] = [];
        if (input.status) {
          whereClause += ' AND status = ?';
          params.push(input.status);
        }
        if (input.countryCode) {
          whereClause += ' AND countryCode = ?';
          params.push(input.countryCode);
        if (input.search) {
          whereClause += ' AND (fullName LIKE ? OR email LIKE ?)';
          params.push(`%${input.search}%`, `%${input.search}%`);
        const offset = (input.page - 1) * input.limit;
        // Récupérer les demandes
        const [requests] = await connection.execute(
          `SELECT * FROM evisa_requests WHERE ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
          [...params, input.limit, offset]
        );
        // Récupérer le total
        const [totalResult] = await connection.execute(
          `SELECT COUNT(*) as count FROM evisa_requests WHERE ${whereClause}`,
          params
        await connection.end();
        return {
          requests: requests || [],
          total: (totalResult as any[])[0]?.count || 0,
          page: input.page,
          limit: input.limit,
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des demandes',
    }),
   * Récupérer les détails d'une demande
  getRequestDetails: protectedProcedure
    .input(z.object({ id: z.number() }))
        const [request] = await connection.execute(
          'SELECT * FROM evisa_requests WHERE id = ?',
          [input.id]
        if (!request || (request as any[]).length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Demande non trouvée',
          });
        return (request as any[])[0];
        console.error('Erreur lors de la récupération de la demande:', error);
          message: 'Erreur lors de la récupération de la demande',
   * Mettre à jour le statut d'une demande
  updateRequestStatus: protectedProcedure
        id: z.number(),
        status: z.enum(['pending', 'processing', 'approved', 'rejected']),
        notes: z.string().optional(),
    .mutation(async ({ ctx, input }: any) => {
          message: 'Seuls les administrateurs peuvent effectuer cette action',
        // Récupérer la demande existante
        const existingRequest = (request as any[])[0];
        // Mettre à jour le statut
        await connection.execute(
          `UPDATE evisa_requests 
           SET status = ?, adminNotes = ?, lastStatusUpdateAt = NOW(), lastStatusUpdatedBy = ?, clientConfirmationSentAt = NOW()
           WHERE id = ?`,
          [input.status, input.notes || existingRequest.adminNotes, ctx.user?.email, input.id]
        // TODO: Envoyer un email de confirmation au client
        // const statusMessages: Record<string, string> = {
        //   pending: 'Votre demande est en attente de traitement',
        //   processing: 'Votre demande est en cours de traitement',
        //   approved: 'Votre demande d\'e-visa a été approuvée!',
        //   rejected: 'Votre demande d\'e-visa a été rejetée',
        // };
        return { success: true, message: 'Statut mis à jour avec succès' };
        console.error('Erreur lors de la mise à jour du statut:', error);
          message: 'Erreur lors de la mise à jour du statut',
   * Assigner une demande à un admin
  assignRequest: protectedProcedure
    .input(z.object({ id: z.number(), adminEmail: z.string().email() }))
           SET adminAssignedTo = ?, lastStatusUpdateAt = NOW(), lastStatusUpdatedBy = ?
          [input.adminEmail, ctx.user?.email, input.id]
        return { success: true, message: 'Demande assignée avec succès' };
        console.error('Erreur lors de l\'assignation:', error);
          message: 'Erreur lors de l\'assignation',
   * Ajouter une note admin
  addAdminNote: protectedProcedure
    .input(z.object({ id: z.number(), note: z.string() }))
          'SELECT adminNotes FROM evisa_requests WHERE id = ?',
        const existingNotes = (request as any[])[0]?.adminNotes || '';
        const timestamp = new Date().toLocaleString('fr-FR');
        const newNotes = `${existingNotes}\n[${timestamp}] ${ctx.user?.name}: ${input.note}`;
          'UPDATE evisa_requests SET adminNotes = ? WHERE id = ?',
          [newNotes, input.id]
        return { success: true, message: 'Note ajoutée avec succès' };
        console.error('Erreur lors de l\'ajout de la note:', error);
          message: 'Erreur lors de l\'ajout de la note',
   * Obtenir les statistiques des demandes
  getStatistics: protectedProcedure.query(async ({ ctx }: any) => {
    if (ctx.user?.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Seuls les administrateurs peuvent accéder à cette ressource',
      });
    }
    try {
      const dbUrl = process.env.DATABASE_URL || '';
      const connection = await mysql.createConnection(dbUrl);
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(totalCost) as totalRevenue
        FROM evisa_requests
      `);
      await connection.end();
      return (stats as any[])[0] || {
        total: 0,
        pending: 0,
        processing: 0,
        approved: 0,
        rejected: 0,
        totalRevenue: 0,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération des statistiques',
  }),
   * Générer un numéro de dossier pour une demande
  generateDossierNumber: protectedProcedure
    .input(z.object({ requestId: z.number() }))
        const dossierNumber = generateDossierNumber();
          'UPDATE evisa_requests SET dossierNumber = ?, adminNotificationSentAt = NOW() WHERE id = ?',
          [dossierNumber, input.requestId]
        return { success: true, dossierNumber };
        console.error('Erreur lors de la génération du numéro de dossier:', error);
          message: 'Erreur lors de la génération du numéro de dossier',
});
