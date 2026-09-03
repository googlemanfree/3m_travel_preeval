import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { agencyDossiers, applications, candidates } from '../../drizzle/schema';
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { sendDossierConfirmationEmail } from '../emailService';
import { assertApplicationCanEnterStatus } from '../utils/applicationGates';
import crypto from 'crypto';

// Générer un numéro de dossier unique au format #3M-AAAA-XXXX
async function generateDossierNumber(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const year = new Date().getFullYear();
  const count = await (db as any).query.applications.findMany();
  const yearCount = count.filter((app: any) => new Date(app.createdAt).getFullYear() === year).length;
  
  const sequence = String(yearCount + 1).padStart(4, '0');
  return `#3M-${year}-${sequence}`;
}

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

        // La création officielle ne doit jamais contourner les deux prérequis.
        // Le dépôt préparatoire agence possède son propre formulaire et reste inchangé.
        let candidate = await (db as any).query.candidates.findFirst({
          where: eq(candidates.email, input.email),
        });
        if (!candidate) {
          return { success: false, error: 'Un compte candidat, une évaluation validée et un paiement confirmé sont requis avant la création du dossier officiel.' };
        }
        const [latestApplication] = await db.select({
          paymentStatus: applications.paymentStatus,
          evaluationDeliveryStatus: applications.evaluationDeliveryStatus,
        }).from(applications)
          .where(eq(applications.candidateId, candidate.id))
          .orderBy(desc(applications.createdAt))
          .limit(1);
        const [paidAgencyDossier] = await db.select({ id: agencyDossiers.id }).from(agencyDossiers)
          .where(and(isNull(agencyDossiers.deletedAt), eq(agencyDossiers.email, candidate.email), eq(agencyDossiers.initialPaymentStatus, "paid")))
          .orderBy(desc(agencyDossiers.createdAt))
          .limit(1);
        const agencyPaymentConfirmed = Boolean(paidAgencyDossier);
        const evaluationValidated = (candidate.evaluationDeclarationStatus === 'validated' && Boolean(candidate.evaluationReviewedAt)) || latestApplication?.evaluationDeliveryStatus === 'sent';
        const paymentConfirmed = latestApplication?.paymentStatus === 'SUCCESS' || agencyPaymentConfirmed;
        if (!evaluationValidated || !paymentConfirmed) {
          return { success: false, error: 'Création bloquée : l’évaluation doit être validée et le paiement confirmé avant l’ouverture du dossier officiel.' };
        }

        // Créer le candidat s'il n'existe pas (conservé pour compatibilité historique,
        // mais rendu inatteignable par la garde ci-dessus).
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
        }

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
          });
        
        // Récupérer l'application créée
        const application = await (db as any).query.applications.findFirst({
          where: eq(applications.dossierNumber, dossierNumber),
        });

        // Envoyer l'email de confirmation
        try {
          await sendDossierConfirmationEmail(
            input.email,
            input.fullName,
            dossierNumber,
            input.destinationCountry,
            65000
          );
        } catch (emailError) {
          console.warn('Erreur envoi email:', emailError);
          // Continuer même si l'email échoue
        }

        return {
          success: true,
          dossier: {
            id: application.id,
            dossierNumber,
            accessCode,
            candidateName: input.fullName,
            email: input.email,
          },
        };
      } catch (error) {
        console.error('Erreur création dossier manuel:', error);
        return {
          success: false,
          error: 'Erreur lors de la création du dossier',
        };
      }
    }),

  getDossierByNumber: protectedProcedure
    .input(z.object({ dossierNumber: z.string() }))
    .query(async ({ input }) => {
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

        return {
          success: true,
          dossier: application,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Erreur lors de la récupération du dossier',
        };
      }
    }),

  updateDossierStatus: protectedProcedure
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        if (ctx.user?.role !== 'admin') {
          return {
            success: false,
            error: 'Accès refusé',
          };
        }

        const application = await (db as any).query.applications.findFirst({
          where: eq(applications.dossierNumber, input.dossierNumber),
        });
        if (!application) {
          return { success: false, error: 'Dossier non trouvé' };
        }
        assertApplicationCanEnterStatus(application, input.dossierStatus);

        await db
          .update(applications)
          .set({
            dossierStatus: input.dossierStatus,
            updatedAt: new Date(),
          })
          .where(eq(applications.dossierNumber, input.dossierNumber));
        
        const updated = await (db as any).query.applications.findFirst({
          where: eq(applications.dossierNumber, input.dossierNumber),
        });

        return {
          success: true,
          dossier: updated,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Erreur lors de la mise à jour',
        };
      }
    }),
});
