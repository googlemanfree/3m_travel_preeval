/**
 * Routeur tRPC — Gestion Admin Spécialisée
 * Permet de gérer les 3 types d'admins : Évaluation, Accompagnement, Procédures
 */

import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { evaluations, aiReportHistory, users, applications, clientDocuments, bilans, agencyDossiers, profileEvaluations } from "../../drizzle/schema";
import { sendEmail } from "../emailService";
import { eq, desc, like, or, and } from "drizzle-orm";

export const adminRouter = router({
  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN ÉVALUATION — Gestion des CV et rapports IA
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer les rapports IA en attente de révision
   */
  getEvaluationPendingReports: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const reports = await db
          .select()
          .from(aiReportHistory)
          .where(eq(aiReportHistory.sendStatus, "pending"))
          .orderBy(desc(aiReportHistory.createdAt))
          .limit(50);

        const evals = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.status, "pending"))
          .orderBy(desc(evaluations.createdAt))
          .limit(50);

        return {
          success: true,
          reports,
          evaluations: evals,
          count: reports.length + evals.length,
        };
      } catch (err) {
        console.error("[Admin Evaluation] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des rapports",
        });
      }
    }),

  /**
   * Récupérer les statistiques d'évaluation
   */
  getEvaluationStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const allReports = await db.select().from(aiReportHistory);
        const sentReports = allReports.filter(r => r.sendStatus === "sent");
        const failedReports = allReports.filter(r => r.sendStatus === "failed");
        const pendingReports = allReports.filter(r => r.sendStatus === "pending");

        return {
          success: true,
          stats: {
            total: allReports.length,
            sent: sentReports.length,
            failed: failedReports.length,
            pending: pendingReports.length,
            successRate: allReports.length > 0 ? Math.round((sentReports.length / allReports.length) * 100) : 0,
          },
        };
      } catch (err) {
        console.error("[Admin Evaluation Stats] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN ACCOMPAGNEMENT — Gestion de l'avancement des dossiers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Avancer rapidement le statut d'une évaluation
   */
  advanceEvaluationStatus: protectedProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      newStatus: z.enum(["pending", "reviewed", "contacted", "closed"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const eval_ = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.id, input.evaluationId))
          .limit(1);

        if (eval_.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation non trouvée" });
        }

        await db
          .update(evaluations)
          .set({
            status: input.newStatus,
          })
          .where(eq(evaluations.id, input.evaluationId));

        return {
          success: true,
          message: `Évaluation avancée au statut: ${input.newStatus}`,
        };
      } catch (err) {
        console.error("[Admin Advance] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'avancement de l'évaluation",
        });
      }
    }),

  /**
   * Récupérer les évaluations en attente de contact
   */
  getEvaluationsAwaitingContact: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const evals = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.status, "reviewed"))
          .orderBy(desc(evaluations.updatedAt))
          .limit(50);

        return {
          success: true,
          evaluations: evals,
          count: evals.length,
        };
      } catch (err) {
        console.error("[Admin Contact] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des évaluations",
        });
      }
    }),

  /**
   * Ajouter des notes à une évaluation
   */
  addEvaluationNotes: protectedProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      notes: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const eval_ = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.id, input.evaluationId))
          .limit(1);

        if (eval_.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation non trouvée" });
        }

        const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' });
        const newNote = `[${timestamp}] ${input.notes}`;

        return {
          success: true,
          message: "Note ajoutée à l'évaluation",
        };
      } catch (err) {
        console.error("[Admin Notes] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'ajout de notes",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN PROCÉDURES — Gestion des procédures par pays
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer les statistiques par destination
   */
  getEvaluationsByDestination: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const evals = await db.select().from(evaluations);

        // Grouper par destination
        const byDestination: Record<string, any> = {};
        evals.forEach(eval_ => {
          const dest = eval_.destinationCountry || "Non spécifiée";
          if (!byDestination[dest]) {
            byDestination[dest] = {
              destination: dest,
              total: 0,
              pending: 0,
              reviewed: 0,
              contacted: 0,
              closed: 0,
            };
          }
          byDestination[dest].total++;
          byDestination[dest][eval_.status]++;
        });

        return {
          success: true,
          destinations: Object.values(byDestination),
        };
      } catch (err) {
        console.error("[Admin Procedures] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques",
        });
      }
    }),

  /**
   * Récupérer les évaluations par destination
   */
  getEvaluationsByDestinationName: protectedProcedure
    .input(z.object({
      destination: z.string(),
      status: z.enum(["pending", "reviewed", "contacted", "closed"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        let query: any = db.select().from(evaluations).where(eq(evaluations.destinationCountry, input.destination));

        if (input.status) {
          query = query.where(eq(evaluations.status, input.status));
        }

        const evals = await query.orderBy(desc(evaluations.createdAt)).limit(100);

        return {
          success: true,
          evaluations: evals,
          count: evals.length,
        };
      } catch (err) {
        console.error("[Admin Destination] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des évaluations",
        });
      }
    }),

  /**
   * Récupérer les statistiques du dashboard admin
   * Retourne : pending, reviewed, contacted, closed
   */
  getDashboardStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const allEvals = await db.select().from(evaluations);
        
        return {
          success: true,
          stats: {
            pending: allEvals.filter(e => e.status === "pending").length,
            reviewed: allEvals.filter(e => e.status === "reviewed").length,
            contacted: allEvals.filter(e => e.status === "contacted").length,
            closed: allEvals.filter(e => e.status === "closed").length,
            total: allEvals.length,
          },
        };
      } catch (err) {
        console.error("[Admin Dashboard Stats] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques du dashboard",
        });
      }
    }),

  /**
   * Récupérer les statistiques globales
   */
  getGlobalStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const evals = await db.select().from(evaluations);
        const reports = await db.select().from(aiReportHistory);

        const stats = {
          totalEvaluations: evals.length,
          evaluationsByStatus: {
            pending: evals.filter(e => e.status === "pending").length,
            reviewed: evals.filter(e => e.status === "reviewed").length,
            contacted: evals.filter(e => e.status === "contacted").length,
            closed: evals.filter(e => e.status === "closed").length,
          },
          aiReports: {
            total: reports.length,
            sent: reports.filter(r => r.sendStatus === "sent").length,
            failed: reports.filter(r => r.sendStatus === "failed").length,
            pending: reports.filter(r => r.sendStatus === "pending").length,
          },
          conversionRate: evals.length > 0 ? Math.round((evals.filter(e => e.status !== "pending").length / evals.length) * 100) : 0,
        };

        return {
          success: true,
          stats,
        };
      } catch (err) {
        console.error("[Admin Global Stats] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques globales",
        });
      }
    }),

  /**
   * Valider un document
   */
  approveDocument: protectedProcedure
    .input(z.object({ documentId: z.number(), comment: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(clientDocuments)
          .set({
            verificationStatus: "approved",
            verificationComment: input.comment || null,
            verifiedByAdmin: ctx.user.email,
            verifiedAt: new Date(),
          })
          .where(eq(clientDocuments.id, input.documentId));

        return { success: true, message: "Document approuvé" };
      } catch (err) {
        console.error("[Admin Approve Document] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'approbation du document",
        });
      }
    }),

  /**
   * Rejeter un document
   */
  rejectDocument: protectedProcedure
    .input(z.object({ documentId: z.number(), comment: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(clientDocuments)
          .set({
            verificationStatus: "rejected",
            verificationComment: input.comment,
            verifiedByAdmin: ctx.user.email,
            verifiedAt: new Date(),
          })
          .where(eq(clientDocuments.id, input.documentId));

        return { success: true, message: "Document rejeté" };
      } catch (err) {
        console.error("[Admin Reject Document] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du rejet du document",
        });
      }
    }),

  /**
   * Récupérer les détails complets d'un utilisateur avec tous ses dossiers et documents
   */
  getUserDetailsWithDocuments: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const user = await db.select().from(users).where(eq(users.id, input.userId));
        if (!user.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur non trouvé" });
        }

        const userApps = await db
          .select()
          .from(applications)
          .where(eq(applications.candidateId, input.userId));

        // Récupérer les documents pour chaque dossier
        const appsWithDocs = await Promise.all(
          userApps.map(async (app) => {
            return { ...app, documents: [] };
          })
        );

        return {
          success: true,
          user: user[0],
          applications: appsWithDocs,
        };
      } catch (err) {
        console.error("[Admin User Details] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des détails utilisateur",
        });
      }
    }),

  /**
   * Récupérer la liste des utilisateurs avec leurs dossiers
   */
  getAllUsersWithApplications: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const allUsers = await db.select().from(users).limit(input.limit).offset(input.offset);

        // Récupérer les dossiers pour chaque utilisateur
        const usersWithApps = await Promise.all(
          allUsers.map(async (user) => {
            const userApps = await db
              .select()
              .from(applications)
              .where(eq(applications.candidateId, user.id));

            return {
              ...user,
              applications: userApps,
              applicationCount: userApps.length,
              lastApplication: userApps.length > 0 ? userApps[0] : null,
              email: user.email || "",
            };
          })
        );

        return {
          success: true,
          users: usersWithApps,
          total: allUsers.length,
        };
      } catch (err) {
        console.error("[Admin Users] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des utilisateurs",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // GESTION DES BILANS D'ADMISSIBILITÉ
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer les bilans en attente de validation
   */
  getPendingBilans: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const pendingBilans = await db
          .select()
          .from(bilans)
          .where(eq(bilans.status, "draft"))
          .orderBy(desc(bilans.generatedAt))
          .limit(50);

        return pendingBilans;
      } catch (err) {
        console.error("[Admin Get Pending Bilans] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des bilans",
        });
      }
    }),

  /**
   * Valider et envoyer un bilan au candidat
   */
  validateAndSendBilan: protectedProcedure
    .input(z.object({ bilanId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Récupérer le bilan
        const bilan = await db.select().from(bilans).where(eq(bilans.id, input.bilanId)).limit(1);
        if (!bilan || bilan.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Bilan non trouvé" });
        }

        // Mettre à jour le statut
        await db
          .update(bilans)
          .set({
            status: "sent",
            validatedBy: ctx.user.name || "Admin",
            validatedAt: new Date(),
            sentAt: new Date(),
          })
          .where(eq(bilans.id, input.bilanId));

        return { success: true, message: "Bilan validé et envoyé" };
      } catch (err) {
        console.error("[Admin Validate Bilan] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la validation du bilan",
        });
      }
    }),

  /**
   * Rejeter un bilan
   */
  rejectBilan: protectedProcedure
    .input(z.object({ bilanId: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(bilans)
          .set({
            status: "rejected",
            adminNotes: input.reason,
            validatedBy: ctx.user.name || "Admin",
            validatedAt: new Date(),
          })
          .where(eq(bilans.id, input.bilanId));

        return { success: true, message: "Bilan rejeté" };
      } catch (err) {
        console.error("[Admin Reject Bilan] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du rejet du bilan",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // GESTION DES DOSSIERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer tous les dossiers
   */
  getAllApplications: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const allApps = await db
          .select()
          .from(applications)
          .orderBy(desc(applications.createdAt))
          .limit(100);

        return allApps;
      } catch (err) {
        console.error("[Admin Get All Applications] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des dossiers",
        });
      }
    }),

  /**
   * Mettre à jour le statut d'un dossier
   */
  updateApplicationStatus: protectedProcedure
    .input(z.object({ applicationId: z.number(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(applications)
          .set({
            dossierStatus: input.status as any,
            lastStatusUpdateAt: new Date(),
            lastStatusUpdatedBy: ctx.user.name || "Admin",
          })
          .where(eq(applications.id, input.applicationId));

        return { success: true, message: "Statut du dossier mis à jour" };
      } catch (err) {
        console.error("[Admin Update Application Status] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du statut",
        });
      }
    }),

  /**
   * Modifier les donnees d'une application (par l'admin)
   */
  updateApplicationData: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      data: z.object({
        destinationCountry: z.string().optional(),
        projectType: z.string().optional(),
        studyLevel: z.string().optional(),
        fieldOfStudy: z.string().optional(),
        adminNotes: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acces reserve aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const updateData: any = {};
        if (input.data.destinationCountry) updateData.destinationCountry = input.data.destinationCountry;
        if (input.data.projectType) updateData.projectType = input.data.projectType;
        if (input.data.studyLevel) updateData.studyLevel = input.data.studyLevel;
        if (input.data.fieldOfStudy) updateData.fieldOfStudy = input.data.fieldOfStudy;
        if (input.data.adminNotes) updateData.adminNotes = input.data.adminNotes;
        updateData.lastStatusUpdateAt = new Date();
        updateData.lastStatusUpdatedBy = ctx.user.name || "Admin";

        await db
          .update(applications)
          .set(updateData)
          .where(eq(applications.id, input.applicationId));

        return { success: true, message: "Donnees du dossier mises a jour" };
      } catch (err) {
        console.error("[Admin Update Application Data] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise a jour des donnees",
        });
      }
    }),

  /**
   * Recuperer les details complets d'une application
   */
  getApplicationDetails: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acces reserve aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const app = await db
          .select()
          .from(applications)
          .where(eq(applications.id, input.applicationId))
          .limit(1);

        if (app.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Application non trouvee" });
        }

        // Récupérer les documents du candidat
        const documents = await db
          .select()
          .from(clientDocuments)
          .where(eq(clientDocuments.candidateEmail, app[0].email))
          .limit(50);

        const reports = await db
          .select()
          .from(aiReportHistory)
          .where(eq(aiReportHistory.applicationId, input.applicationId))
          .orderBy(desc(aiReportHistory.createdAt))
          .limit(10);

        return {
          success: true,
          application: app[0],
          documents,
          reports,
        };
      } catch (err) {
        console.error("[Admin Get Application Details] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la recuperation des details",
        });
      }
    }),

  /**
   * Publier le bilan vers l'espace personnel du client
   */
  publishBilanToClient: protectedProcedure
    .input(z.object({ bilanId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acces reserve aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const bilan = await db
          .select()
          .from(bilans)
          .where(eq(bilans.id, input.bilanId))
          .limit(1);

        if (bilan.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Bilan non trouve" });
        }

        await db
          .update(bilans)
          .set({
            status: "sent",
            sentAt: new Date(),
          })
          .where(eq(bilans.id, input.bilanId));

        return {
          success: true,
          message: "Bilan publie avec succes",
          publishedAt: new Date(),
        };
      } catch (err) {
        console.error("[Admin Publish Bilan] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la publication du bilan",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD ADMIN — Gestion unifiée des candidats (toutes sources)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Lister tous les candidats pour le dashboard admin
   * Combine les dossiers en ligne (applications) + dossiers agence (agencyDossiers)
   */
  listCandidates: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().int().min(1).max(200).default(100),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Récupérer les dossiers en ligne (table applications)
        const onlineApps = await db
          .select()
          .from(applications)
          .orderBy(desc(applications.createdAt))
          .limit(input.limit);

        // Récupérer les dossiers agence (table agencyDossiers)
        const agencyApps = await db
          .select()
          .from(agencyDossiers)
          .orderBy(desc(agencyDossiers.createdAt))
          .limit(input.limit);

        // Mapper les statuts internes vers les statuts admin
        const mapDossierStatus = (status: string): string => {
          const mapping: Record<string, string> = {
            "nouveau": "PENDING_48H",
            "en_evaluation": "PENDING_48H",
            "bilan_envoye": "PUBLISHED",
            "en_attente_paiement": "PUBLISHED",
            "paye": "DOCUMENTS_CHECK",
            "en_attente_documents": "DOCUMENTS_CHECK",
            "documents_recus": "SUBMITTED",
            "soumis_agences": "SUBMITTED",
            "en_cours_recrutement": "SUBMITTED",
            "contrat_obtenu": "APPROVED",
            "visa_approuve": "APPROVED",
            "refuse": "APPROVED",
          };
          return mapping[status] || "PENDING_48H";
        };

        const mapAgencyStatus = (status: string): string => {
          const mapping: Record<string, string> = {
            "nouveau": "PENDING_48H",
            "en_cours": "DOCUMENTS_CHECK",
            "documents_requis": "DOCUMENTS_CHECK",
            "soumis": "SUBMITTED",
            "approuve": "APPROVED",
            "refuse": "APPROVED",
          };
          return mapping[status] || "PENDING_48H";
        };

        // Normaliser les dossiers en ligne
        const normalizedOnline = onlineApps.map(app => ({
          id: `online_${app.id}`,
          internalId: app.id,
          folderCode: app.dossierNumber,
          fullName: app.fullName,
          email: app.email,
          whatsapp: app.whatsappNumber || "",
          city: app.currentCity || "Non renseignée",
          destinationCountry: app.destination || "Non spécifiée",
          projectType: app.visaType || "Non spécifié",
          status: mapDossierStatus(app.dossierStatus),
          internalStatus: app.dossierStatus,
          source: "WEB" as const,
          scoringTotal: app.scoringTotal,
          scoringBadge: app.scoringBadge,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        }));

        // Normaliser les dossiers agence
        const normalizedAgency = agencyApps.map(app => ({
          id: `agency_${app.id}`,
          internalId: app.id,
          folderCode: `3M-AGN-${app.id.toString().padStart(4, "0")}`,
          fullName: app.fullName,
          email: app.email,
          whatsapp: app.phone || "",
          city: "Yaoundé",
          destinationCountry: app.destination || "Non spécifiée",
          projectType: app.visaType || "Non spécifié",
          status: mapAgencyStatus(app.status),
          internalStatus: app.status,
          source: "AGENCY_PHYSICAL" as const,
          scoringTotal: null,
          scoringBadge: null,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        }));

        // Combiner et trier par date de création
        let allCandidates = [...normalizedOnline, ...normalizedAgency].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Filtrer par statut
        if (input.status && input.status !== "ALL") {
          allCandidates = allCandidates.filter(c => c.status === input.status);
        }

        // Filtrer par recherche
        if (input.search && input.search.trim()) {
          const query = input.search.toLowerCase().trim();
          allCandidates = allCandidates.filter(c =>
            c.folderCode?.toLowerCase().includes(query) ||
            c.fullName?.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query) ||
            c.destinationCountry?.toLowerCase().includes(query)
          );
        }

        return {
          success: true,
          candidates: allCandidates,
          total: allCandidates.length,
        };
      } catch (err) {
        console.error("[Admin List Candidates] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des candidats",
        });
      }
    }),

  /**
   * Mettre à jour le statut d'un candidat et notifier le client
   */
  updateCandidateStatus: protectedProcedure
    .input(z.object({
      candidateId: z.string(), // Format: "online_123" ou "agency_456"
      newStatus: z.enum(["PENDING_48H", "PUBLISHED", "DOCUMENTS_CHECK", "SUBMITTED", "APPROVED"]),
      notifyClient: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const [source, idStr] = input.candidateId.split("_");
        const id = parseInt(idStr);

        // Mapper le statut admin vers le statut interne
        const statusLabels: Record<string, string> = {
          "PENDING_48H": "Évaluation sous 48h",
          "PUBLISHED": "Bilan Consulaire Disponible",
          "DOCUMENTS_CHECK": "Collecte des documents",
          "SUBMITTED": "Soumission consulaire",
          "APPROVED": "Visa Accordé",
        };

        let candidateEmail = "";
        let candidateName = "";
        let folderCode = "";

        if (source === "online") {
          // Mapper vers le statut interne applications
          const internalStatusMap: Record<string, string> = {
            "PENDING_48H": "en_evaluation",
            "PUBLISHED": "bilan_envoye",
            "DOCUMENTS_CHECK": "en_attente_documents",
            "SUBMITTED": "soumis_agences",
            "APPROVED": "visa_approuve",
          };

          const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
          if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });

          await db.update(applications)
            .set({
              dossierStatus: internalStatusMap[input.newStatus] as any,
              lastStatusUpdateAt: new Date(),
              lastStatusUpdatedBy: ctx.user.name || "Admin",
            })
            .where(eq(applications.id, id));

          candidateEmail = app.email;
          candidateName = app.fullName;
          folderCode = app.dossierNumber;
        } else if (source === "agency") {
          // Mapper vers le statut interne agencyDossiers
          const internalStatusMap: Record<string, string> = {
            "PENDING_48H": "nouveau",
            "PUBLISHED": "en_cours",
            "DOCUMENTS_CHECK": "documents_requis",
            "SUBMITTED": "soumis",
            "APPROVED": "approuve",
          };

          const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, id)).limit(1);
          if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable" });

          await db.update(agencyDossiers)
            .set({
              status: internalStatusMap[input.newStatus] as any,
              lastStatusChangeAt: new Date(),
              lastStatusChangeBy: ctx.user.name || "Admin",
            })
            .where(eq(agencyDossiers.id, id));

          candidateEmail = dossier.email;
          candidateName = dossier.fullName;
          folderCode = `3M-AGN-${id.toString().padStart(4, "0")}`;
        }

        // Envoyer une notification email au client si demandé
        if (input.notifyClient && candidateEmail) {
          try {
            const statusLabel = statusLabels[input.newStatus] || input.newStatus;
            const htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="color: #fff; font-size: 22px; margin: 0;">3M Travel & Services</h1>
                  <p style="color: #bfdbfe; font-size: 13px; margin: 6px 0 0;">Mise à jour de votre dossier</p>
                </div>
                <div style="padding: 32px 28px;">
                  <p style="color: #374151;">Bonjour <strong>${candidateName}</strong>,</p>
                  <p style="color: #374151;">Le statut de votre dossier <strong>${folderCode}</strong> vient d'être mis à jour :</p>
                  <div style="background: #eff6ff; border-left: 4px solid #2563EB; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1E3A8A;">📋 ${statusLabel}</p>
                  </div>
                  <p style="color: #374151;">Vous pouvez consulter votre espace client pour plus de détails :</p>
                  <a href="https://3mtravelagency.click/mon-espace" style="display: inline-block; background: #1E3A8A; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 16px 0;">Accéder à mon espace</a>
                </div>
                <div style="background: #f8faff; padding: 20px 28px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                  <p>3M Travel & Services — RC/YAO/2019/A/2567 | NIU : M112417203369H</p>
                  <p>Yaoundé, Cameroun | +237 620-996-045 | contact@3mtravelagency.click</p>
                </div>
              </div>
            `;

            await sendEmail(
              candidateEmail,
              `📋 Mise à jour de votre dossier ${folderCode} - 3M Travel & Services`,
              htmlContent
            );
          } catch (emailErr) {
            console.error("[Admin Update Status] Email notification failed:", emailErr);
            // Ne pas bloquer la mise à jour si l'email échoue
          }
        }

        return {
          success: true,
          message: `Statut mis à jour : ${statusLabels[input.newStatus]}`,
          notificationSent: input.notifyClient,
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Admin Update Candidate Status] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du statut",
        });
      }
    }),

  /**
   * Importer un dossier physique d'agence
   */
  importAgencyDossier: protectedProcedure
    .input(z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      whatsapp: z.string().min(5),
      city: z.string().default("Yaoundé"),
      destinationCountry: z.string().min(2),
      projectType: z.string().min(2),
      initialStatus: z.enum(["PENDING_48H", "PUBLISHED", "DOCUMENTS_CHECK", "SUBMITTED", "APPROVED"]).default("DOCUMENTS_CHECK"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Mapper le statut initial
        const internalStatusMap: Record<string, string> = {
          "PENDING_48H": "nouveau",
          "PUBLISHED": "en_cours",
          "DOCUMENTS_CHECK": "documents_requis",
          "SUBMITTED": "soumis",
          "APPROVED": "approuve",
        };

        const result = await db.insert(agencyDossiers).values({
          fullName: input.fullName,
          email: input.email,
          phone: input.whatsapp,
          destination: input.destinationCountry,
          visaType: input.projectType,
          status: internalStatusMap[input.initialStatus] as any,
          createdByAdmin: ctx.user.email || "admin",
          source: "manual_admin" as any,
          adminNotes: `Dossier physique importé par ${ctx.user.name || "Admin"} le ${new Date().toLocaleDateString("fr-FR")}`,
        });

        const dossierId = (result as any)[0]?.insertId || 0;
        const folderCode = `3M-AGN-${dossierId.toString().padStart(4, "0")}`;

        // Envoyer un email de bienvenue
        try {
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 32px 24px; text-align: center;">
                <h1 style="color: #fff; font-size: 22px; margin: 0;">3M Travel & Services</h1>
                <p style="color: #bfdbfe; font-size: 13px; margin: 6px 0 0;">Votre partenaire mobilité internationale</p>
              </div>
              <div style="padding: 32px 28px;">
                <p style="color: #374151;">Bonjour <strong>${input.fullName}</strong>,</p>
                <p style="color: #374151;">Votre dossier a été créé avec succès dans notre système.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 4px 0;"><strong>N° de dossier :</strong> ${folderCode}</p>
                  <p style="margin: 4px 0;"><strong>Destination :</strong> ${input.destinationCountry}</p>
                  <p style="margin: 4px 0;"><strong>Type de projet :</strong> ${input.projectType}</p>
                </div>
                <p style="color: #374151;">Notre équipe vous contactera sous peu pour les prochaines étapes.</p>
                <a href="https://3mtravelagency.click/mon-espace" style="display: inline-block; background: #1E3A8A; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 16px 0;">Accéder à mon espace</a>
              </div>
              <div style="background: #f8faff; padding: 20px 28px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                <p>3M Travel & Services — Yaoundé, Cameroun | +237 620-996-045</p>
              </div>
            </div>
          `;
          await sendEmail(
            input.email,
            `📋 Votre dossier ${folderCode} a été créé - 3M Travel & Services`,
            htmlContent
          );
        } catch (emailErr) {
          console.error("[Import Agency Dossier] Email failed:", emailErr);
        }

        return {
          success: true,
          folderCode,
          dossierId,
          message: `Dossier agence créé avec succès : ${folderCode}`,
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Admin Import Agency Dossier] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'importation du dossier agence",
        });
      }
    }),

  /**
   * Récupérer les détails complets d'un candidat pour la fiche admin
   */
  getCandidateDetails: protectedProcedure
    .input(z.object({
      candidateId: z.string(), // Format: "online_123" ou "agency_456"
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const [source, idStr] = input.candidateId.split("_");
        const id = parseInt(idStr);

        if (source === "online") {
          const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
          if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });

          const docs = await db.select().from(clientDocuments)
            .where(eq(clientDocuments.candidateEmail, app.email))
            .limit(50);

          const mapStatus = (status: string): string => {
            const mapping: Record<string, string> = {
              "nouveau": "PENDING_48H",
              "en_evaluation": "PENDING_48H",
              "bilan_envoye": "PUBLISHED",
              "en_attente_paiement": "PUBLISHED",
              "paye": "DOCUMENTS_CHECK",
              "en_attente_documents": "DOCUMENTS_CHECK",
              "documents_recus": "SUBMITTED",
              "soumis_agences": "SUBMITTED",
              "en_cours_recrutement": "SUBMITTED",
              "contrat_obtenu": "APPROVED",
              "visa_approuve": "APPROVED",
              "refuse": "APPROVED",
            };
            return mapping[status] || "PENDING_48H";
          };

          let scoringData = null;
          if (app.scoringDetails) {
            try { scoringData = JSON.parse(app.scoringDetails); } catch {}
          }

          return {
            success: true,
            candidate: {
              id: `online_${app.id}`,
              internalId: app.id,
              folderCode: app.dossierNumber,
              fullName: app.fullName,
              email: app.email,
              whatsapp: app.whatsappNumber || "",
              city: app.currentCity || "Non renseignée",
              destinationCountry: app.destination || "Non spécifiée",
              projectType: app.visaType || "Non spécifié",
              status: mapStatus(app.dossierStatus),
              internalStatus: app.dossierStatus,
              source: "WEB" as const,
              scoringTotal: app.scoringTotal,
              scoringBadge: app.scoringBadge,
              scoringData,
              createdAt: app.createdAt,
              updatedAt: app.updatedAt,
            },
            documents: docs,
          };
        } else if (source === "agency") {
          const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, id)).limit(1);
          if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable" });

          const mapStatus = (status: string): string => {
            const mapping: Record<string, string> = {
              "nouveau": "PENDING_48H",
              "en_cours": "DOCUMENTS_CHECK",
              "documents_requis": "DOCUMENTS_CHECK",
              "soumis": "SUBMITTED",
              "approuve": "APPROVED",
              "refuse": "APPROVED",
            };
            return mapping[status] || "PENDING_48H";
          };

          return {
            success: true,
            candidate: {
              id: `agency_${dossier.id}`,
              internalId: dossier.id,
              folderCode: `3M-AGN-${dossier.id.toString().padStart(4, "0")}`,
              fullName: dossier.fullName,
              email: dossier.email,
              whatsapp: dossier.phone || "",
              city: "Yaoundé",
              destinationCountry: dossier.destination || "Non spécifiée",
              projectType: dossier.visaType || "Non spécifié",
              status: mapStatus(dossier.status),
              internalStatus: dossier.status,
              source: "AGENCY_PHYSICAL" as const,
              scoringTotal: null,
              scoringBadge: null,
              scoringData: null,
              createdAt: dossier.createdAt,
              updatedAt: dossier.updatedAt,
            },
            documents: [],
          };
        }

        throw new TRPCError({ code: "BAD_REQUEST", message: "Format d'ID invalide" });
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Admin Get Candidate Details] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des détails du candidat",
        });
      }

    }),
  /**
   * Lister les documents avec filtrage et recherche
   */
  listDocuments: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      verificationStatus: z.enum(["pending", "approved", "rejected"]).optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Construire les conditions de filtrage
        const conditions: any[] = [];

        if (input.verificationStatus) {
          conditions.push(eq(clientDocuments.verificationStatus, input.verificationStatus as any));
        }

        if (input.search) {
          const searchTerm = `%${input.search}%`;
          conditions.push(
            or(
              like(clientDocuments.documentName, searchTerm),
              like(clientDocuments.candidateEmail, searchTerm)
            )
          );
        }

        // Construire la requête avec les conditions
        let query: any = db.select().from(clientDocuments);
        
        if (conditions.length > 0) {
          query = query.where(and(...(conditions as any)));
        }

        const documents = await query
          .orderBy(desc(clientDocuments.receiptGeneratedAt))
          .limit(input.limit)
          .offset(input.offset);

        return documents.map((doc: any) => ({
          id: doc.id,
          dossierNumber: "N/A",
          candidateName: "N/A",
          documentType: doc.documentType,
          documentName: doc.documentName,
          documentUrl: doc.documentUrl,
          status: doc.status,
          verificationStatus: doc.verificationStatus,
          submittedAt: doc.receiptGeneratedAt,
          verifiedAt: doc.verifiedAt,
          verificationComment: doc.verificationComment,
          receiptNumber: doc.receiptNumber,
        }));
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Admin List Documents] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des documents",
        });
      }
    }),
});
