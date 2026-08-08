import { protectedProcedure, router } from '../_core/trpc';
import { generateDossierNumber } from "../services/dossierNumberService";
import { z } from 'zod';
import { getDb } from '../db';
import { applications, candidates } from '../../drizzle/schema';
import { eq, sql } from "drizzle-orm";
import { sendDossierConfirmationEmail } from '../emailService';
import crypto from 'crypto';

// Générer un numéro de dossier unique au format #3M-AAAA-XXXX
export const adminDossierRouter = router({
  createManualDossier: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string(),
        nationality: z.string(),
        destinationCountry: z.string(),
        visaType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Vérifier que l'utilisateur est admin
        if (ctx.user?.role !== 'admin') {
          return {
            success: false,
            error: 'Accès refusé - Admin requis',
          };
        }
        // Générer le numéro de dossier
        const dossierNumber = await generateDossierNumber();
        const accessCode = crypto.randomBytes(6).toString('hex').toUpperCase();
        // Vérifier si le candidat existe
        let candidate = await (db as any).query.candidates.findFirst({
          where: eq(candidates.email, input.email),
        });
        // Créer le candidat s'il n'existe pas
        if (!candidate) {
          // Générer un mot de passe temporaire
          const tempPassword = crypto.randomBytes(16).toString('hex');
          
          const now = new Date();
          await db.execute(
            sql`INSERT INTO candidates (fullName, email, passwordHash, emailVerified, verificationToken, verificationExpiresAt, passwordResetToken, passwordResetExpiresAt, createdAt, updatedAt, lastLoginAt) VALUES (${input.fullName}, ${input.email.toLowerCase().trim()}, ${tempPassword}, true, '', NULL, NULL, NULL, ${now}, ${now}, ${now})`
          );
          // Récupérer le candidat créé
          candidate = await (db as any).query.candidates.findFirst({
            where: eq(candidates.email, input.email),
          });
        // Créer l'application/dossier
        await db
          .insert(applications)
          .values({
            candidateId: candidate.id,
            dossierNumber,
            fullName: input.fullName,
            email: input.email,
            whatsappNumber: input.phone,
            nationality: input.nationality,
            destination: input.destinationCountry.toLowerCase() as any,
            visaType: input.visaType,
            dossierStatus: 'nouveau',
            paymentStatus: 'PENDING',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        // Récupérer l'application créée
        const application = await (db as any).query.applications.findFirst({
          where: eq(applications.dossierNumber, dossierNumber),
        // Envoyer l'email de confirmation
        try {
          await sendDossierConfirmationEmail(
            input.email,
            input.fullName,
            input.destinationCountry,
            65000
        } catch (emailError) {
          console.warn('Erreur envoi email:', emailError);
          // Continuer même si l'email échoue
        return {
          success: true,
          dossier: {
            id: application.id,
            accessCode,
            candidateName: input.fullName,
          },
        };
      } catch (error) {
        console.error('Erreur création dossier manuel:', error);
          success: false,
          error: 'Erreur lors de la création du dossier',
      }
    }),
  getDossierByNumber: protectedProcedure
    .input(z.object({ dossierNumber: z.string() }))
    .query(async ({ input }) => {
          where: eq(applications.dossierNumber, input.dossierNumber),
          with: {
            candidate: true,
        if (!application) {
            error: 'Dossier non trouvé',
          dossier: application,
          error: 'Erreur lors de la récupération du dossier',
  updateDossierStatus: protectedProcedure
        dossierNumber: z.string(),
        dossierStatus: z.enum([
          'nouveau',
          'en_evaluation',
          'bilan_envoye',
          'en_attente_paiement',
          'paye',
          'en_attente_documents',
          'documents_recus',
          'soumis_agences',
          'en_cours_recrutement',
          'contrat_obtenu',
          'visa_approuve',
          'refuse',
        ]),
            error: 'Accès refusé',
          .update(applications)
          .set({
            dossierStatus: input.dossierStatus,
          })
          .where(eq(applications.dossierNumber, input.dossierNumber));
        const updated = await (db as any).query.applications.findFirst({
          dossier: updated,
          error: 'Erreur lors de la mise à jour',
});
