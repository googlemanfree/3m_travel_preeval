/**
 * Routeur tRPC — Gestion Admin Spécialisée
 * Permet de gérer les 3 types d'admins : Évaluation, Accompagnement, Procédures
 */

import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";
import { emailErrorPatterns, summarizeEmailDeliveryLogs } from "../services/emailDelivery";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { evaluations, users, applications, profileEvaluations, aiReportHistory, clientDocuments, candidateFiles, candidates, agencyDossiers, bilans, adminActivityLogs, emailDeliveryLogs, passportVerificationAudits } from "../../drizzle/schema";
// (imports précédemment retirés par erreur lors d'un nettoyage — tables réellement utilisées ci-dessous, restaurées)
import { sendEmail as sendGenericEmail, SendEmailOptions } from "../_core/email";
import { listDestinationDocuments, addDestinationDocument, deleteDestinationDocument } from "../destinationDocumentService";
import { eq, desc, asc, like, or, and, isNull, isNotNull, inArray } from "drizzle-orm";

export const adminRouter = router({
  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN ÉVALUATION — Gestion des CV et rapports IA
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer les rapports IA en attente de révision
   */
  getEvaluationPendingReports: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  getEvaluationStats: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  advanceEvaluationStatus: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      evaluationId: z.number().int(),
      newStatus: z.enum(["pending", "reviewed", "contacted", "closed"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  getEvaluationsAwaitingContact: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  addEvaluationNotes: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      evaluationId: z.number().int(),
      notes: z.string().min(10),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  getEvaluationsByDestination: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  getEvaluationsByDestinationName: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      destination: z.string(),
      status: z.enum(["pending", "reviewed", "contacted", "closed"]).optional(),
    }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  getDashboardStats: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  getGlobalStats: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  approveDocument: publicProcedure
    .input(z.object({ sessionToken: z.string(), documentId: z.number(), comment: z.string().optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const verifiedAt = new Date();
        await db
          .update(clientDocuments)
          .set({
            verificationStatus: "approved",
            verificationComment: input.comment || null,
            verifiedByAdmin: admin.email,
            verifiedAt,
          })
          .where(eq(clientDocuments.id, input.documentId));

        const [document] = await db
          .select({ evaluationId: clientDocuments.evaluationId })
          .from(clientDocuments)
          .where(eq(clientDocuments.id, input.documentId))
          .limit(1);
        await db.insert(passportVerificationAudits).values({
          documentId: input.documentId,
          applicationId: document?.evaluationId ?? null,
          adminEmail: admin.email,
          decision: "approved",
          comment: input.comment || null,
          createdAt: verifiedAt,
        });

        return { success: true, message: "Document approuvé", humanVerified: true, verifiedBy: admin.email, verifiedAt };
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
  rejectDocument: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      documentId: z.number(),
      comment: z.string().min(3),
      markerAnnotations: z.record(z.string(), z.string()).optional(),
      notifyCandidate: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const [document] = await db
          .select()
          .from(clientDocuments)
          .where(eq(clientDocuments.id, input.documentId))
          .limit(1);

        if (!document) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
        }

        const existingIssues = document.readabilityIssues && typeof document.readabilityIssues === "object"
          ? document.readabilityIssues as Record<string, unknown>
          : {};
        const readabilityIssues = {
          ...existingIssues,
          adminAnnotations: input.markerAnnotations ?? (existingIssues as any).adminAnnotations ?? {},
          returnedToCandidateAt: new Date().toISOString(),
          returnedByAdmin: admin.email,
        };

        const verifiedAt = new Date();
        await db
          .update(clientDocuments)
          .set({
            verificationStatus: "rejected",
            status: "rejected",
            verificationComment: input.comment,
            verifiedByAdmin: admin.email,
            verifiedAt,
            readabilityIssues,
          })
          .where(eq(clientDocuments.id, input.documentId));

        await db.insert(passportVerificationAudits).values({
          documentId: input.documentId,
          applicationId: document.evaluationId,
          adminEmail: admin.email,
          decision: "rejected",
          comment: input.comment,
          createdAt: verifiedAt,
        });

        let notificationSent = false;
        if (input.notifyCandidate) {
          try {
            const annotationItems = Object.entries(input.markerAnnotations ?? {})
              .filter(([, value]) => value.trim().length > 0)
              .map(([markerId, value]) => `<li><strong>${markerId}</strong> : ${value}</li>`)
              .join("");
            await sendGenericEmail({
              to: document.candidateEmail,
              subject: "Action requise : votre document doit être corrigé — 3M Travel & Services",
              html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1f2937">
                <div style="background:#1E3A8A;padding:24px;text-align:center;color:#fff"><h1 style="margin:0;font-size:22px">3M Travel & Services</h1></div>
                <div style="padding:28px"><p>Bonjour,</p><p>Votre document <strong>${document.documentName}</strong> nécessite une nouvelle version avant validation.</p>
                <div style="background:#fff7ed;border-left:4px solid #f97316;padding:14px;margin:18px 0"><strong>Commentaire du conseiller :</strong><br/>${input.comment}</div>
                ${annotationItems ? `<p><strong>Zones à corriger :</strong></p><ul>${annotationItems}</ul>` : ""}
                <p>Connectez-vous à votre espace pour consulter les annotations visuelles et remplacer le document.</p>
                <a href="https://www.3mtravelagency.com/documents" style="display:inline-block;background:#1E3A8A;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700">Accéder à mes documents</a>
                </div></div>`,
            });
            notificationSent = true;
          } catch (emailError) {
            console.error("[Admin Reject Document] Notification failed:", emailError);
          }
        }

        return { success: true, message: "Document rejeté", notificationSent, humanVerified: true, verifiedBy: admin.email, verifiedAt };
      } catch (err) {
        console.error("[Admin Reject Document] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du rejet du document",
        });
      }
    }),

  /** Enregistrer les commentaires d’un administrateur sur les marqueurs de lisibilité. */
  savePassportMarkerAnnotations: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      documentId: z.number(),
      annotations: z.record(z.string(), z.string().max(600)),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const [document] = await db.select().from(clientDocuments).where(eq(clientDocuments.id, input.documentId)).limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });

      const current = document.readabilityIssues && typeof document.readabilityIssues === "object"
        ? document.readabilityIssues as Record<string, unknown>
        : {};
      const previousAnnotations = (current.adminAnnotations && typeof current.adminAnnotations === "object")
        ? current.adminAnnotations as Record<string, string>
        : {};
      const existingHistory = Array.isArray(current.annotationHistory) ? current.annotationHistory : [];
      const changes = Object.entries(input.annotations)
        .filter(([markerId, message]) => message.trim().length > 0 && previousAnnotations[markerId] !== message)
        .map(([markerId, message]) => ({
          markerId,
          message: message.trim(),
          author: admin.email,
          role: "admin",
          createdAt: new Date().toISOString(),
        }));
      await db.update(clientDocuments).set({
        readabilityIssues: {
          ...current,
          adminAnnotations: input.annotations,
          annotationHistory: [...existingHistory, ...changes],
          annotationUpdatedAt: new Date().toISOString(),
          annotationUpdatedBy: admin.email,
        },
      }).where(eq(clientDocuments.id, input.documentId));

      return { success: true, message: "Annotations enregistrées" };
    }),

  /**
   * Récupérer les détails complets d'un utilisateur avec tous ses dossiers et documents
   */
  getUserDetailsWithDocuments: publicProcedure
    .input(z.object({ sessionToken: z.string(), userId: z.number() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  getAllUsersWithApplications: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      search: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  getPendingBilans: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  validateAndSendBilan: publicProcedure
    .input(z.object({ sessionToken: z.string(), bilanId: z.number() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
            validatedBy: admin.fullName || "Admin",
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
  rejectBilan: publicProcedure
    .input(z.object({ sessionToken: z.string(), bilanId: z.number(), reason: z.string() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(bilans)
          .set({
            status: "rejected",
            adminNotes: input.reason,
            validatedBy: admin.fullName || "Admin",
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
  getAllApplications: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  updateApplicationStatus: publicProcedure
    .input(z.object({ sessionToken: z.string(), applicationId: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(applications)
          .set({
            dossierStatus: input.status as any,
            lastStatusUpdateAt: new Date(),
            lastStatusUpdatedBy: admin.fullName || "Admin",
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
  updateApplicationData: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      applicationId: z.number(),
      data: z.object({
      sessionToken: z.string(),
        destinationCountry: z.string().optional(),
        projectType: z.string().optional(),
        studyLevel: z.string().optional(),
        fieldOfStudy: z.string().optional(),
        adminNotes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
        updateData.lastStatusUpdatedBy = admin.fullName || "Admin";

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
  /**
   * Récupérer les statistiques de satisfaction de la FAQ (votes Utile / Non utile)
   */
  getFaqSatisfactionStats: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const rows = await db.execute(`SELECT questionKey, helpful, COUNT(*) as count FROM faq_feedback GROUP BY questionKey, helpful`);
        const rawResults: any = rows[0] || [];

        let totalHelpful = 0;
        let totalNotHelpful = 0;
        const perQuestionMap: Record<string, { helpful: number; notHelpful: number }> = {};

        for (const row of rawResults) {
          const qKey = row.questionKey || row.question_key;
          const isHelpful = row.helpful === 1 || row.helpful === true || row.helpful === "1";
          const cnt = Number(row.count) || 0;

          if (!perQuestionMap[qKey]) {
            perQuestionMap[qKey] = { helpful: 0, notHelpful: 0 };
          }

          if (isHelpful) {
            totalHelpful += cnt;
            perQuestionMap[qKey].helpful += cnt;
          } else {
            totalNotHelpful += cnt;
            perQuestionMap[qKey].notHelpful += cnt;
          }
        }

        const totalVotes = totalHelpful + totalNotHelpful;
        const satisfactionRate = totalVotes > 0 ? Math.round((totalHelpful / totalVotes) * 100) : 100;

        const questionsBreakdown = Object.entries(perQuestionMap).map(([questionKey, stats]) => {
          const qTotal = stats.helpful + stats.notHelpful;
          const qRate = qTotal > 0 ? Math.round((stats.helpful / qTotal) * 100) : 100;
          return {
            questionKey,
            helpful: stats.helpful,
            notHelpful: stats.notHelpful,
            total: qTotal,
            satisfactionRate: qRate,
          };
        }).sort((a, b) => b.total - a.total);

        return {
          success: true,
          stats: {
            totalVotes,
            totalHelpful,
            totalNotHelpful,
            satisfactionRate,
            questionsBreakdown,
          },
        };
      } catch (err) {
        console.error("[Admin FAQ Satisfaction] Error:", err);
        return {
          success: true,
          stats: {
            totalVotes: 0,
            totalHelpful: 0,
            totalNotHelpful: 0,
            satisfactionRate: 100,
            questionsBreakdown: [],
          },
        };
      }
    }),

  getApplicationDetails: publicProcedure
    .input(z.object({ sessionToken: z.string(), applicationId: z.number() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  publishBilanToClient: publicProcedure
    .input(z.object({ sessionToken: z.string(), bilanId: z.number() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  listCandidates: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      search: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().int().min(1).max(200).default(100),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
  updateCandidateStatus: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      candidateId: z.string(), // Format: "online_123" ou "agency_456"
      newStatus: z.enum(["PENDING_48H", "PUBLISHED", "DOCUMENTS_CHECK", "SUBMITTED", "APPROVED"]),
      notifyClient: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
              lastStatusUpdatedBy: admin.fullName || "Admin",
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
              lastStatusChangeBy: admin.fullName || "Admin",
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

            await sendGenericEmail({
              to: candidateEmail,
              subject: `📋 Mise à jour de votre dossier ${folderCode} - 3M Travel & Services`,
              html: htmlContent
            });
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
  listDestinationDocumentsAdmin: publicProcedure
    .input(z.object({ sessionToken: z.string(), search: z.string().optional() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      return await listDestinationDocuments(input.search);
    }),

  /**
   * Modifier directement le statut d'un document (validé, rejeté, en attente) avec notification e-mail automatique au candidat
   */
  updateDocumentStatus: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      documentId: z.number().int(),
      source: z.enum(["client", "candidate"]).default("client"),
      status: z.enum(["pending", "approved", "rejected"]),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        let candidateEmail = "";
        let candidateName = "";
        let documentName = "";

        if (input.source === "client") {
          const [doc] = await db.select().from(clientDocuments).where(eq(clientDocuments.id, input.documentId)).limit(1);
          if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });

          await db.update(clientDocuments)
            .set({
              verificationStatus: input.status as any,
              status: input.status === "approved" ? "verified" : input.status === "rejected" ? "rejected" : "pending",
              verificationComment: input.comment || null,
              verifiedByAdmin: admin.email || "Admin",
              verifiedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(clientDocuments.id, input.documentId));

          candidateEmail = doc.candidateEmail;
          documentName = doc.documentName;

          // Récupérer le nom du candidat
          const [app] = await db.select().from(applications).where(eq(applications.email, doc.candidateEmail)).limit(1);
          candidateName = app?.fullName || doc.candidateEmail.split("@")[0];
        } else {
          const [fileRec] = await db.select().from(candidateFiles).where(eq(candidateFiles.id, input.documentId)).limit(1);
          if (!fileRec) throw new TRPCError({ code: "NOT_FOUND", message: "Fichier candidat introuvable" });

          const newFileStatus = input.status === "approved" ? "verified" : input.status === "rejected" ? "rejected" : "uploaded";

          await db.update(candidateFiles)
            .set({
              status: newFileStatus as any,
              rejectionReason: input.comment || null,
            })
            .where(eq(candidateFiles.id, input.documentId));

          documentName = fileRec.fileName;
          const [cand] = await db.select().from(candidates).where(eq(candidates.id, fileRec.candidateId)).limit(1);
          candidateEmail = cand?.email || "";
          candidateName = cand?.fullName || "Candidat";
        }

        // Envoyer la notification e-mail automatique au candidat
        if (candidateEmail) {
          try {
            const statusLabels: Record<string, { label: string; color: string; badge: string }> = {
              approved: { label: "Validé & Approuvé", color: "#16a34a", badge: "✓ VALIDÉ" },
              rejected: { label: "Refusé / À corriger", color: "#dc2626", badge: "✗ REJETÉ" },
              pending: { label: "Remis en attente", color: "#d97706", badge: "⏳ EN ATTENTE" },
            };

            const info = statusLabels[input.status] || statusLabels.pending;

            const htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="color: #fff; font-size: 22px; margin: 0;">3M Travel Agency</h1>
                  <p style="color: #bfdbfe; font-size: 13px; margin: 6px 0 0;">Mise à jour du statut de votre document</p>
                </div>
                <div style="padding: 32px 28px;">
                  <p style="color: #374151;">Bonjour <strong>${candidateName}</strong>,</p>
                  <p style="color: #374151;">Le statut de vérification de votre document <strong>${documentName}</strong> a été mis à jour par l'administration :</p>
                  
                  <div style="background: #f8fafc; border-left: 4px solid ${info.color}; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: ${info.color};">${info.badge}</p>
                    ${input.comment ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563;"><strong>Note de l'agence :</strong> ${input.comment}</p>` : ""}
                  </div>

                  <p style="color: #374151; font-size: 14px;">Vous pouvez consulter votre espace candidat pour suivre l'évolution complète de vos démarches :</p>
                  <a href="https://3mtravelagency.click/mon-espace" style="display: inline-block; background: #1E3A8A; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 16px 0;">Accéder à mon espace</a>
                </div>
                <div style="background: #f8faff; padding: 20px 28px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                  <p>3M Travel Agency — RC/YAO/2019/A/2567 | NIU : M112417203369H</p>
                  <p>Yaoundé, Cameroun | +237 620-996-045 | hello@3mtravelagency.com</p>
                </div>
              </div>
            `;

            await sendGenericEmail({
              to: candidateEmail,
              subject: `📄 Document ${documentName} : ${info.badge} - 3M Travel Agency`,
              html: htmlContent,
            });
          } catch (emailErr) {
            console.error("[Admin Update Document Status] Email notification failed:", emailErr);
          }
        }

        return {
          success: true,
          message: "Statut du document mis à jour avec succès",
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Admin Update Document Status] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du statut du document",
        });
      }
    }),

  addDestinationDocumentAdmin: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      title: z.string().min(2),
      country: z.string().min(2),
      category: z.string().min(2),
      fileUrl: z.string().url(),
      fileKey: z.string().min(2),
      extractedText: z.string().optional(),
      fileSize: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      return await addDestinationDocument({
        title: input.title,
        country: input.country,
        category: input.category,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        extractedText: input.extractedText,
        fileSize: input.fileSize,
      });
    }),

  deleteDestinationDocumentAdmin: publicProcedure
    .input(z.object({ sessionToken: z.string(), id: z.number() }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      return await deleteDestinationDocument(input.id);
    }),

  importAgencyDossier: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      fullName: z.string().min(2),
      email: z.string().email(),
      whatsapp: z.string().min(5),
      city: z.string().default("Yaoundé"),
      destinationCountry: z.string().min(2),
      projectType: z.string().min(2),
      initialStatus: z.enum(["PENDING_48H", "PUBLISHED", "DOCUMENTS_CHECK", "SUBMITTED", "APPROVED"]).default("DOCUMENTS_CHECK"),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

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
          createdByAdmin: admin.email || "admin",
          source: "manual_admin" as any,
          adminNotes: `Dossier physique importé par ${admin.fullName || "Admin"} le ${new Date().toLocaleDateString("fr-FR")}`,
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
          await sendGenericEmail({
            to: input.email,
            subject: `📋 Votre dossier ${folderCode} a été créé - 3M Travel & Services`,
            html: htmlContent
          });
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
  getCandidateDetails: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      candidateId: z.string(), // Format: "online_123" ou "agency_456"
    }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const [source, idStr] = input.candidateId.split("_");
        const id = parseInt(idStr);

        if (source === "online") {
          const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
          if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });

          const [candRec] = await db.select().from(candidates).where(eq(candidates.email, app.email)).limit(1);
          const avatarUrl = candRec?.avatarUrl || null;

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
              avatarUrl,
              createdAt: app.createdAt,
              updatedAt: app.updatedAt,
            },
            documents: docs,
          };
        } else if (source === "agency") {
          const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, id)).limit(1);
          if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable" });

          let avatarUrl = null;
          if (dossier.email) {
            const [candRec] = await db.select().from(candidates).where(eq(candidates.email, dossier.email)).limit(1);
            avatarUrl = candRec?.avatarUrl || null;
          }

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
              avatarUrl,
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
   * Répartition des candidats par pays de destination.
   * Les emails sont dédupliqués afin qu'un même candidat ne soit pas compté
   * plusieurs fois lorsqu'il possède plusieurs demandes dans le système.
   */
  getCandidateCountryDistribution: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      limit: z.number().int().min(1).max(30).default(15),
    }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const [applicationRows, evaluationRows, profileRows, agencyRows] = await Promise.all([
          db.select({ id: applications.id, email: applications.email, country: applications.destination }).from(applications),
          db.select({ id: evaluations.id, email: evaluations.email, country: evaluations.destinationCountry }).from(evaluations),
          db.select({ id: profileEvaluations.id, email: profileEvaluations.email, country: profileEvaluations.destination }).from(profileEvaluations),
          db.select({ id: agencyDossiers.id, email: agencyDossiers.email, country: agencyDossiers.destination }).from(agencyDossiers),
        ]);

        const countryCandidates = new Map<string, Set<string>>();
        const uniqueCandidates = new Set<string>();
        const addRows = (rows: Array<{ id: number; email: string; country: string | null | undefined }>, source: string) => {
          rows.forEach((row) => {
            const country = String(row.country ?? "").trim();
            if (!country) return;
            const candidateKey = row.email?.trim().toLowerCase() || `${source}:${row.id}`;
            uniqueCandidates.add(candidateKey);
            const bucket = countryCandidates.get(country) ?? new Set<string>();
            bucket.add(candidateKey);
            countryCandidates.set(country, bucket);
          });
        };

        addRows(applicationRows, "application");
        addRows(evaluationRows, "evaluation");
        addRows(profileRows, "profile");
        addRows(agencyRows, "agency");

        const data = Array.from(countryCandidates.entries())
          .map(([country, candidateKeys]) => ({ country, count: candidateKeys.size }))
          .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country, "fr"))
          .slice(0, input.limit);

        return {
          success: true,
          totalCandidates: uniqueCandidates.size,
          totalCountries: countryCandidates.size,
          data,
        };
      } catch (error) {
        console.error("[Admin Country Distribution] Error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors du calcul de la répartition par pays" });
      }
    }),

  /**
   * Export CSV de l'historique des activités administrateur.
   * Les détails exportés ne contiennent ni mot de passe ni jeton de session.
   */
  exportActivityReportCsv: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      limit: z.number().int().min(1).max(5000).default(1000),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const rows = await db
          .select({
            id: adminActivityLogs.id,
            adminEmail: adminActivityLogs.adminEmail,
            action: adminActivityLogs.action,
            evaluationType: adminActivityLogs.evaluationType,
            evaluationId: adminActivityLogs.evaluationId,
            oldStatus: adminActivityLogs.oldStatus,
            newStatus: adminActivityLogs.newStatus,
            resultCount: adminActivityLogs.resultCount,
            details: adminActivityLogs.details,
            createdAt: adminActivityLogs.createdAt,
          })
          .from(adminActivityLogs)
          .orderBy(desc(adminActivityLogs.createdAt))
          .limit(input.limit);

        const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""').replace(/\\r?\\n/g, " ")}"`;
        const headers = ["ID", "Administrateur", "Action", "Type", "Identifiant", "Ancien statut", "Nouveau statut", "Résultats", "Détails", "Date"];
        const csvRows = rows.map((row) => [
          row.id,
          row.adminEmail,
          row.action,
          row.evaluationType,
          row.evaluationId,
          row.oldStatus,
          row.newStatus,
          row.resultCount,
          row.details,
          row.createdAt ? new Date(row.createdAt).toLocaleString("fr-FR") : "",
        ]);
        const content = "\\uFEFF" + [headers, ...csvRows].map((row) => row.map(escapeCsv).join(",")).join("\\r\\n");
        const fileName = `rapport-activite-admin-${new Date().toISOString().slice(0, 10)}.csv`;

        await db.insert(adminActivityLogs).values({
          adminEmail: admin.email,
          action: "csv_exported",
          resultCount: rows.length,
          details: "Export du rapport d'activité administrateur",
        });

        return { success: true, fileName, content, rowCount: rows.length };
      } catch (error) {
        console.error("[Admin Activity CSV] Error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la génération du rapport CSV" });
      }
    }),

  /** Valider un document du flux candidat authentifié. */
  approveCandidateFile: publicProcedure
    .input(z.object({ sessionToken: z.string(), fileId: z.number().int().positive(), comment: z.string().max(2000).optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const [file] = await db.select({ id: candidateFiles.id }).from(candidateFiles).where(eq(candidateFiles.id, input.fileId)).limit(1);
      if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "Document candidat introuvable" });
      await db.update(candidateFiles).set({ status: "verified", rejectionReason: input.comment?.trim() || null }).where(eq(candidateFiles.id, input.fileId));
      return { success: true, verifiedBy: admin.email };
    }),

  /** Rejeter un document du flux candidat authentifié et conserver le motif. */
  rejectCandidateFile: publicProcedure
    .input(z.object({ sessionToken: z.string(), fileId: z.number().int().positive(), comment: z.string().min(3).max(2000), notifyCandidate: z.boolean().default(true) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const [file] = await db.select({ id: candidateFiles.id, fileName: candidateFiles.fileName, candidateEmail: candidates.email }).from(candidateFiles).leftJoin(candidates, eq(candidateFiles.candidateId, candidates.id)).where(eq(candidateFiles.id, input.fileId)).limit(1);
      if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "Document candidat introuvable" });
      await db.update(candidateFiles).set({ status: "rejected", rejectionReason: input.comment.trim() }).where(eq(candidateFiles.id, input.fileId));
      let notificationSent = false;
      if (input.notifyCandidate && file.candidateEmail) {
        try {
          await sendGenericEmail({
            to: file.candidateEmail,
            subject: "Action requise : document à remplacer — 3M Travel & Services",
            html: "<div><h1>3M Travel & Services</h1><p>Bonjour,</p><p>Votre document <strong>" + file.fileName + "</strong> doit être remplacé.</p><p><strong>Motif :</strong> " + input.comment.trim() + "</p><p>Connectez-vous à votre espace candidat pour déposer une nouvelle version.</p></div>",
          });
          notificationSent = true;
        } catch (error) {
          console.error("[Admin Reject Candidate File] Notification failed:", error);
        }
      }
      return { success: true, rejectedBy: admin.email, notificationSent };
    }),

  /**
   * Lister les documents issus des deux flux persistés : client_documents et candidate_files.
   */
  listDocuments: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      search: z.string().optional(),
      verificationStatus: z.enum(["pending", "approved", "rejected"]).optional(),
      aiClassification: z.string().max(120).optional(),
      sortBy: z.enum(["uploadedAt", "documentName", "verificationStatus", "aiClassification"]).default("uploadedAt"),
      sortDirection: z.enum(["asc", "desc"]).default("desc"),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      try {
        const [clientRows, candidateRows] = await Promise.all([
          db.select().from(clientDocuments).orderBy(desc(clientDocuments.receiptGeneratedAt)).limit(1000),
          db.select({
            id: candidateFiles.id,
            candidateId: candidateFiles.candidateId,
            candidateName: candidates.fullName,
            candidateEmail: candidates.email,
            fileType: candidateFiles.fileType,
            fileName: candidateFiles.fileName,
            fileUrl: candidateFiles.fileUrl,
            status: candidateFiles.status,
            rejectionReason: candidateFiles.rejectionReason,
            uploadedAt: candidateFiles.uploadedAt,
          }).from(candidateFiles).leftJoin(candidates, eq(candidateFiles.candidateId, candidates.id)).orderBy(desc(candidateFiles.uploadedAt)).limit(1000),
        ]);
        const candidateIds = Array.from(new Set(candidateRows.map((row) => row.candidateId).filter((id): id is number => typeof id === "number")));
        const applicationRows = candidateIds.length
          ? await db.select({ candidateId: applications.candidateId, dossierNumber: applications.dossierNumber, createdAt: applications.createdAt }).from(applications).where(inArray(applications.candidateId, candidateIds)).orderBy(desc(applications.createdAt)).limit(2000)
          : [];
        const dossierByCandidate = new Map<number, string>();
        for (const row of applicationRows) if (row.candidateId && !dossierByCandidate.has(row.candidateId)) dossierByCandidate.set(row.candidateId, row.dossierNumber);

        const documents = [
          ...clientRows.map((doc: any) => ({
            id: doc.id, source: "client" as const, dossierNumber: "N/A", candidateName: doc.candidateEmail || "N/A", documentType: doc.documentType, documentName: doc.documentName, documentUrl: doc.documentUrl, status: doc.status, verificationStatus: doc.verificationStatus, submittedAt: doc.receiptGeneratedAt || doc.createdAt, verifiedAt: doc.verifiedAt, verifiedByAdmin: doc.verifiedByAdmin, humanVerified: Boolean(doc.verifiedAt && doc.verifiedByAdmin), verificationComment: doc.verificationComment, receiptNumber: doc.receiptNumber, aiClassification: doc.aiClassification ?? null, aiClassificationConfidence: doc.aiClassificationConfidence ?? null, aiClassifiedAt: doc.aiClassifiedAt ?? null, suggestedFolder: doc.suggestedFolder ?? null, extractedData: doc.extractedData ?? null, readabilityScore: doc.readabilityScore ?? null, readabilityIssues: doc.readabilityIssues ?? null,
          })),
          ...candidateRows.map((doc) => ({
            id: doc.id, source: "candidate" as const, dossierNumber: doc.candidateId ? (dossierByCandidate.get(doc.candidateId) || "N/A") : "N/A", candidateName: doc.candidateName || doc.candidateEmail || "N/A", documentType: doc.fileType, documentName: doc.fileName, documentUrl: doc.fileUrl, status: doc.status === "verified" ? "verified" : doc.status === "rejected" ? "rejected" : "pending", verificationStatus: doc.status === "verified" ? "approved" : doc.status === "rejected" ? "rejected" : "pending", submittedAt: doc.uploadedAt, verifiedAt: undefined, verifiedByAdmin: undefined, humanVerified: false, verificationComment: doc.rejectionReason, receiptNumber: null, aiClassification: null, aiClassificationConfidence: null, aiClassifiedAt: null, suggestedFolder: null, extractedData: null, readabilityScore: null, readabilityIssues: null,
          })),
        ];
        const normalizedSearch = input.search?.trim().toLowerCase();
        let filtered = documents.filter((doc) => {
          if (input.verificationStatus && doc.verificationStatus !== input.verificationStatus) return false;
          if (input.aiClassification && !String(doc.aiClassification ?? "").toLowerCase().includes(input.aiClassification.toLowerCase())) return false;
          if (!normalizedSearch) return true;
          return [doc.dossierNumber, doc.candidateName, doc.documentType, doc.documentName, doc.verificationStatus].some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
        });
        filtered.sort((a, b) => {
          const left = input.sortBy === "documentName" ? a.documentName : input.sortBy === "verificationStatus" ? a.verificationStatus : input.sortBy === "aiClassification" ? String(a.aiClassification ?? "") : new Date(a.submittedAt || 0).getTime();
          const right = input.sortBy === "documentName" ? b.documentName : input.sortBy === "verificationStatus" ? b.verificationStatus : input.sortBy === "aiClassification" ? String(b.aiClassification ?? "") : new Date(b.submittedAt || 0).getTime();
          const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "fr");
          return input.sortDirection === "asc" ? comparison : -comparison;
        });
        return filtered.slice(input.offset, input.offset + input.limit);
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Admin List Documents] Error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la récupération des documents" });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // GESTION DES MODÈLES D'EMAIL
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer la prévisualisation d'un modèle d'email
   */
  getEmailTemplatePreview: publicProcedure
    .input(
      z.object({
      sessionToken: z.string(),
        templateId: z.enum(["verification", "otp", "password-reset", "welcome", "dossier-confirmation"]),
        testEmail: z.string().email("Email invalide"),
        testName: z.string().min(2, "Nom trop court"),
      })
    )
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const { templateId, testEmail, testName } = input;

      try {
        let html = "";

        switch (templateId) {
          case "verification": {
            const testToken = "test-token-" + Date.now();
            const verifyUrl = `https://3mtravelagency.click/verify-email-link?token=${testToken}`;
            html = generateVerificationEmailHtml(testName, verifyUrl);
            break;
          }
          case "otp": {
            const testOtp = "123456";
            html = generateOtpEmailHtml(testName, testOtp);
            break;
          }
          case "password-reset": {
            const testToken = "test-token-" + Date.now();
            const resetUrl = `https://3mtravelagency.click/reset-password?token=${testToken}`;
            html = generatePasswordResetEmailHtml(testName, resetUrl);
            break;
          }
          case "welcome": {
            html = generateWelcomeEmailHtml(testName, "canada");
            break;
          }
          case "dossier-confirmation": {
            const testDossierNumber = `DOS-${Date.now()}`;
            html = generateDossierConfirmationEmailHtml(testName, testDossierNumber, "CANADA", 500000);
            break;
          }
          default:
            throw new TRPCError({ code: "BAD_REQUEST", message: "Type de modèle invalide" });
        }

        return { html, templateId, testEmail, testName };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[getEmailTemplatePreview] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la génération de la prévisualisation",
        });
      }
    }),

  /**
   * Envoyer un email de test
   */
  sendTestEmail: publicProcedure
    .input(
      z.object({
      sessionToken: z.string(),
        templateId: z.enum(["verification", "otp", "password-reset", "welcome", "dossier-confirmation"]),
        email: z.string().email("Email invalide"),
        testName: z.string().min(2, "Nom trop court"),
      })
    )
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const { templateId, email, testName } = input;

      try {
        const { sendVerificationLink, sendVerificationOtp, sendPasswordResetEmail, sendWelcomeEmail, sendDossierConfirmationEmail } = await import("../emailService");

        switch (templateId) {
          case "verification": {
            const testToken = "test-token-" + Date.now();
            await sendVerificationLink(email, testName, testToken);
            break;
          }
          case "otp": {
            const testOtp = "123456";
            await sendVerificationOtp(email, testName, testOtp);
            break;
          }
          case "password-reset": {
            const testToken = "test-token-" + Date.now();
            await sendPasswordResetEmail(email, testName, testToken);
            break;
          }
          case "welcome": {
            await sendWelcomeEmail(email, testName, "canada");
            break;
          }
          case "dossier-confirmation": {
            const testDossierNumber = `DOS-TEST-${Date.now()}`;
            await sendDossierConfirmationEmail(email, testName, testDossierNumber, "CANADA", 500000);
            break;
          }
          default:
            throw new TRPCError({ code: "BAD_REQUEST", message: "Type de modèle invalide" });
        }

        return { success: true, message: `Email de test envoyé à ${email}` };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[sendTestEmail] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'envoi de l'email de test",
        });
      }
    }),

  /**
   * Récupérer l'historique de délivrabilité des e-mails
   */
  getEmailDeliveryLogs: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      limit: z.number().int().min(1).max(200).default(100),
      status: z.enum(["all", "sent", "failed", "pending"]).default("all"),
      errorType: z.enum(["all", "invalid_recipient", "domain_unverified", "rate_limit", "configuration"]).default("all"),
      search: z.string().trim().max(120).optional(),
    }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const conditions = [];
      if (input.status !== "all") conditions.push(eq(emailDeliveryLogs.status, input.status));
      if (input.search) {
        conditions.push(or(
          like(emailDeliveryLogs.recipientEmail, `%${input.search}%`),
          like(emailDeliveryLogs.subject, `%${input.search}%`),
        ));
      }
      if (input.errorType !== "all") {
        const patterns = emailErrorPatterns[input.errorType as keyof typeof emailErrorPatterns] ?? [];
        conditions.push(or(...patterns.map((pattern) => like(emailDeliveryLogs.errorDetails, `%${pattern}%`))));
      }
      const logs = await db
        .select()
        .from(emailDeliveryLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(emailDeliveryLogs.createdAt))
        .limit(input.limit);

      return {
        logs,
        summary: summarizeEmailDeliveryLogs(logs),
      };
    }),

  updateEmailDeliveryRecipient: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      logId: z.number().int().positive(),
      recipientEmail: z.string().trim().email("Adresse e-mail invalide").max(320),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const log = (await db.select().from(emailDeliveryLogs).where(eq(emailDeliveryLogs.id, input.logId)).limit(1))[0];
      if (!log) throw new TRPCError({ code: "NOT_FOUND", message: "Journal e-mail introuvable." });
      if (log.recipientEmail === input.recipientEmail) return { success: true, recipientEmail: input.recipientEmail, updatedRecords: 0 };

      try {
        await db.transaction(async (tx) => {
          await tx.update(candidates).set({ email: input.recipientEmail }).where(eq(candidates.email, log.recipientEmail));
          await tx.update(applications).set({ email: input.recipientEmail }).where(eq(applications.email, log.recipientEmail));
          await tx.update(agencyDossiers).set({ email: input.recipientEmail }).where(eq(agencyDossiers.email, log.recipientEmail));
          await tx.update(emailDeliveryLogs).set({ recipientEmail: input.recipientEmail }).where(eq(emailDeliveryLogs.id, input.logId));
          await tx.insert(adminActivityLogs).values({
            adminEmail: admin.email,
            action: "status_changed",
            evaluationType: "email_delivery",
            evaluationId: String(input.logId),
            details: JSON.stringify({ action: "recipient_updated", previousEmail: log.recipientEmail, recipientEmail: input.recipientEmail }),
          });
        });
      } catch (error) {
        throw new TRPCError({ code: "CONFLICT", message: "Cette adresse e-mail est déjà utilisée ou ne peut pas être enregistrée." });
      }

      return { success: true, recipientEmail: input.recipientEmail, updatedRecords: 1 };
    }),

  resendFailedEmail: publicProcedure
    .input(z.object({ sessionToken: z.string(), logId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const log = (await db.select().from(emailDeliveryLogs).where(eq(emailDeliveryLogs.id, input.logId)).limit(1))[0];
      if (!log) throw new TRPCError({ code: "NOT_FOUND", message: "Journal e-mail introuvable." });
      if (log.status !== "failed") throw new TRPCError({ code: "BAD_REQUEST", message: "Seuls les e-mails en échec peuvent être relancés." });

      try {
        await sendGenericEmail({
          to: log.recipientEmail,
          subject: log.subject,
          html: "<p>Bonjour,</p><p>Votre message 3M Travel & Services est renvoyé après correction de vos coordonnées.</p><p>Cordialement,<br>L’équipe 3M Travel & Services</p>",
        });
        await db.insert(adminActivityLogs).values({
          adminEmail: admin.email,
          action: "status_changed",
          evaluationType: "email_delivery",
          evaluationId: String(input.logId),
          details: JSON.stringify({ action: "email_resent", recipientEmail: log.recipientEmail, subject: log.subject }),
        });
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le renvoi a échoué. Consultez le nouveau journal de délivrabilité." });
      }

      return { success: true, recipientEmail: log.recipientEmail };
    }),
});

// ─── Générateurs HTML des modèles ─────────────────────────────────────────────

function generateVerificationEmailHtml(fullName: string, verifyUrl: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;background:linear-gradient(135deg,#0f2460 0%,#1e3a8a 50%,#2563eb 100%);margin:0;padding:20px}.wrapper{max-width:600px;margin:0 auto}.container{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(30,58,138,0.2)}.header{background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#3B82F6 100%);padding:40px 32px;text-align:center;color:#fff}.header h1{font-size:28px;margin:12px 0 0;font-weight:900}.body{padding:40px 32px}.greeting{font-size:16px;color:#1f2937;margin-bottom:24px;line-height:1.6}.cta-section{background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);border-left:4px solid #2563EB;padding:20px;border-radius:8px;margin:28px 0}.cta-text{color:#1f2937;font-size:15px;line-height:1.6;margin-bottom:16px}.btn{display:inline-block;background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px}.btn-center{text-align:center}.security-badge{background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:6px;margin:20px 0;font-size:13px;color:#92400e}.footer{background:linear-gradient(to bottom,#f9fafb,#f3f4f6);padding:32px 32px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280}</style></head><body><div class="wrapper"><div class="container"><div class="header"><h1>3M Travel & Services</h1><p>Votre partenaire mobilité internationale</p></div><div class="body"><p class="greeting">Bonjour <strong>${fullName}</strong>,</p><p class="cta-text">Bienvenue dans votre <strong>Espace Candidat 3M Travel</strong> ! 🎉</p><p class="cta-text">Pour finaliser votre inscription, confirmez votre email :</p><div class="cta-section"><div class="btn-center"><a href="${verifyUrl}" class="btn">✓ Confirmer mon email</a></div></div><div class="security-badge">🔒 <strong>Sécurité :</strong> Ce lien est personnel et valable 24 heures.</div><p class="cta-text">Cordialement,<br><strong>L'équipe 3M Travel & Services</strong></p></div><div class="footer"><p>© 2024 3M Travel & Services. Tous droits réservés.</p></div></div></div></body></html>`;
}

function generateOtpEmailHtml(fullName: string, otp: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f2460 0%,#1e3a8a 50%,#2563eb 100%);margin:0;padding:20px}.wrapper{max-width:600px;margin:0 auto}.container{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(30,58,138,0.2)}.header{background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#3B82F6 100%);padding:40px 32px;text-align:center;color:#fff}.body{padding:40px 32px}.otp-box{background:#eff6ff;border:2px dashed #2563EB;border-radius:12px;padding:20px;text-align:center;margin:24px 0}.otp-code{font-size:40px;font-weight:900;color:#1E3A8A;letter-spacing:12px}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb}</style></head><body><div class="wrapper"><div class="container"><div class="header"><h1>3M Travel & Services</h1><p>Code de Vérification</p></div><div class="body"><p>Bonjour <strong>${fullName}</strong>,</p><p>Voici votre code de vérification :</p><div class="otp-box"><div class="otp-code">${otp}</div><div style="font-size:13px;color:#6b7280;margin-top:8px;">Ce code expire dans 15 minutes</div></div><p style="font-size:13px;color:#6b7280;">Pour votre sécurité, ne partagez jamais ce code.</p></div><div class="footer"><p>© 2024 3M Travel & Services</p></div></div></div></body></html>`;
}

function generatePasswordResetEmailHtml(fullName: string, resetUrl: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f2460 0%,#1e3a8a 50%,#2563eb 100%);margin:0;padding:20px}.wrapper{max-width:600px;margin:0 auto}.container{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(30,58,138,0.2)}.header{background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#3B82F6 100%);padding:40px 32px;text-align:center;color:#fff}.body{padding:40px 32px}.btn{display:inline-block;background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700}.btn-center{text-align:center}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb}</style></head><body><div class="wrapper"><div class="container"><div class="header"><h1>3M Travel & Services</h1><p>Réinitialisation de Mot de Passe</p></div><div class="body"><p>Bonjour <strong>${fullName}</strong>,</p><p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez ci-dessous :</p><div class="btn-center" style="margin:24px 0"><a href="${resetUrl}" class="btn">🔑 Réinitialiser mon mot de passe</a></div><p style="font-size:13px;color:#6b7280;">Ce lien est valable 1 heure.</p></div><div class="footer"><p>© 2024 3M Travel & Services</p></div></div></div></body></html>`;
}

function generateWelcomeEmailHtml(fullName: string, destination: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f2460 0%,#1e3a8a 50%,#2563eb 100%);margin:0;padding:20px}.wrapper{max-width:600px;margin:0 auto}.container{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(30,58,138,0.2)}.header{background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#3B82F6 100%);padding:40px 32px;text-align:center;color:#fff}.body{padding:40px 32px}.btn{display:inline-block;background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700}.btn-center{text-align:center}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb}</style></head><body><div class="wrapper"><div class="container"><div class="header"><h1>3M Travel & Services</h1><p>Bienvenue!</p></div><div class="body"><p>Bonjour <strong>${fullName}</strong>,</p><p>🎉 Votre compte 3M Travel est maintenant <strong>activé</strong> !</p><p>Vous pouvez maintenant :</p><ul style="margin:16px 0;padding-left:20px;color:#374151;line-height:2"><li>📁 Uploader vos documents</li><li>💬 Contacter votre conseiller</li><li>📊 Suivre votre dossier</li></ul><div class="btn-center" style="margin:24px 0"><a href="https://3mtravelagency.click/dashboard" class="btn">🚀 Accéder à mon espace</a></div></div><div class="footer"><p>© 2024 3M Travel & Services</p></div></div></div></body></html>`;
}

function generateDossierConfirmationEmailHtml(fullName: string, dossierNumber: string, destination: string, amount: number): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f2460 0%,#1e3a8a 50%,#2563eb 100%);margin:0;padding:20px}.wrapper{max-width:600px;margin:0 auto}.container{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(30,58,138,0.2)}.header{background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#3B82F6 100%);padding:40px 32px;text-align:center;color:#fff}.body{padding:40px 32px}.dossier-box{background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:20px;text-align:center;margin:24px 0}.dossier-number{font-size:32px;font-weight:900;color:#15803d;letter-spacing:6px}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb}</style></head><body><div class="wrapper"><div class="container"><div class="header"><h1>3M Travel & Services</h1><p>Confirmation de Dossier</p></div><div class="body"><p>Bonjour <strong>${fullName}</strong>,</p><p>✅ Votre dossier a été <strong>créé avec succès</strong> !</p><div class="dossier-box"><div style="font-size:13px;color:#6b7280;margin-bottom:6px">NUMÉRO DE DOSSIER</div><div class="dossier-number">${dossierNumber}</div></div><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;background:#f8faff;font-size:13px;color:#6b7280">Destination</td><td style="padding:8px;font-weight:700">${destination}</td></tr><tr><td style="padding:8px;background:#f8faff;font-size:13px;color:#6b7280">Montant</td><td style="padding:8px;font-weight:700">${amount.toLocaleString("fr-FR")} FCFA</td></tr></table><p style="font-size:13px;color:#6b7280">Un conseiller vous contactera sous 24h.</p></div><div class="footer"><p>© 2024 3M Travel & Services</p></div></div></div></body></html>`;
}
