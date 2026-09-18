/**
 * Routeur tRPC — Gestion des Dossiers en Agence
 * Permet aux administrateurs d'ajouter et gérer des dossiers manuellement
 */

import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { agencyDossiers, agencyDossierDocuments, agencyDossierHistory, candidates } from "../../drizzle/schema";

function esc(v: string): string { return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
import { eq, and, or, like, desc, isNull, isNotNull, sql, count, inArray } from "drizzle-orm";
import { sendEmail as sendGenericEmail, SendEmailOptions } from "../_core/email";
import { AGENCY_DOSSIER_STATUS_VALUES, isLuxembourgEmploymentProcedure, isLuxembourgEmploymentStatus } from "../../shared/agencyDossierStatus";
import { duplicateConflictMessage, findPotentialDuplicates, normalizeDuplicateEmail } from "../utils/duplicateDetection";

export const agencyDossierRouter = router({
  /**
   * Créer un nouveau dossier en agence
   */
  createDossier: protectedProcedure
    .input(z.object({
      fullName: z.string().min(2).max(255),
      email: z.string().email().max(320),
      phone: z.string().min(5).max(50),
      dateOfBirth: z.string().max(20).optional(),
      nationality: z.string().max(100).optional(),
      destination: z.string().min(2).max(100),
      visaType: z.string().min(2).max(100),
      educationLevel: z.string().max(100).optional(),
      employmentStatus: z.string().max(100).optional(),
      monthlyIncome: z.number().min(0).optional(),
      bankBalance: z.number().min(0).optional(),
      adminNotes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent créer des dossiers en agence",
        });
      }

      try {
        const cleanEmail = normalizeDuplicateEmail(input.email);
        const duplicates = await findPotentialDuplicates(db, { email: cleanEmail, fullName: input.fullName });
        if (duplicates.length > 0) throw new TRPCError({ code: "CONFLICT", message: duplicateConflictMessage(duplicates) });
        const result = await db.insert(agencyDossiers).values({
          fullName: input.fullName,
          email: cleanEmail,
          phone: input.phone,
          dateOfBirth: input.dateOfBirth,
          nationality: input.nationality,
          destination: input.destination,
          visaType: input.visaType,
          educationLevel: input.educationLevel,
          employmentStatus: input.employmentStatus,
          monthlyIncome: input.monthlyIncome,
          bankBalance: input.bankBalance,
          adminNotes: input.adminNotes,
          createdByAdmin: ctx.user.email || "unknown",
          source: "manual_admin" as any,
        });

        const dossierId = (result as any)[0].insertId;

        await db.insert(agencyDossierHistory).values({
          dossierId: dossierId,
          action: "created",
          changedBy: ctx.user.email || "unknown",
          oldValue: null,
          newValue: JSON.stringify(input),
          details: "Dossier créé manuellement par l'administrateur",
        });

        try {
          const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Bienvenue chez 3M Travel & Services</h2>
            <p>Bonjour ${esc(input.fullName)},</p>
            <p>Votre dossier a été créé avec succès dans notre système.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Détails de votre dossier:</h3>
              <p><strong>Destination:</strong> ${esc(input.destination)}</p>
              <p><strong>Type de Visa:</strong> ${esc(input.visaType)}</p>
              <p><strong>Statut:</strong> Nouveau</p>
            </div>
            <p>Notre équipe examinera votre dossier et vous contactera sous peu avec les prochaines étapes.</p>
            <p style="color: #666;">Cordialement,<br/>L'équipe 3M Travel & Services</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">3M Travel & Services - Pré-évaluation Visa & Immigration</p>
          </div>`;

          await sendGenericEmail({
            to: input.email,
            subject: "📋 Votre dossier a été créé - 3M Travel & Services",
            html: htmlContent
          });
        } catch (emailErr) {
          console.error("[Agency Dossier] Welcome email failed:", emailErr);
        }

        return {
          success: true,
          dossierId,
          message: "Dossier créé avec succès",
        };
      } catch (err) {
        console.error("[Agency Dossier] Create error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création du dossier",
        });
      }
    }),

  /**
   * Modifier les métadonnées d’un pré-dossier avant inscription.
   * L’identité et le contexte pays/visa restent éditables uniquement par un admin,
   * avec une trace avant/après pour préserver la continuité agence → espace client.
   */
  updateDossier: protectedProcedure
    .input(z.object({
      dossierId: z.number().int().positive(),
      fullName: z.string().min(2).max(255),
      email: z.string().email().max(320),
      phone: z.string().min(5).max(50),
      dateOfBirth: z.string().max(20).optional(),
      nationality: z.string().max(100).optional(),
      destination: z.string().min(2).max(100),
      visaType: z.string().min(2).max(100),
      educationLevel: z.string().max(100).optional(),
      employmentStatus: z.string().max(100).optional(),
      monthlyIncome: z.number().min(0).optional(),
      bankBalance: z.number().min(0).optional(),
      adminNotes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Seuls les administrateurs peuvent modifier un pré-dossier." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const [existing] = await db.select().from(agencyDossiers).where(and(eq(agencyDossiers.id, input.dossierId), isNull(agencyDossiers.deletedAt))).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Pré-dossier introuvable ou supprimé." });
      const next = {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth || null,
        nationality: input.nationality || null,
        destination: input.destination,
        visaType: input.visaType,
        educationLevel: input.educationLevel || null,
        employmentStatus: input.employmentStatus || null,
        monthlyIncome: input.monthlyIncome ?? null,
        bankBalance: input.bankBalance ?? null,
        adminNotes: input.adminNotes || null,
      };
      await db.update(agencyDossiers).set(next).where(eq(agencyDossiers.id, input.dossierId));
      await db.insert(agencyDossierHistory).values({
        dossierId: input.dossierId,
        action: "metadata_updated",
        changedBy: ctx.user.email || "unknown",
        oldValue: JSON.stringify(existing),
        newValue: JSON.stringify(next),
        details: "Métadonnées du pré-dossier modifiées par un administrateur",
      });
      return { success: true, dossierId: input.dossierId };
    }),

  /**
   * Récupérer tous les dossiers en agence
   */
  getDossiers: protectedProcedure
    .input(z.object({
      status: z.string().max(50).optional(),
      destination: z.string().max(100).optional(),
      search: z.string().trim().max(120).optional(),
      includeDeleted: z.boolean().optional().default(false),
      limit: z.number().int().min(1).max(200).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent accéder aux dossiers en agence",
        });
      }

      try {
        const visibilityWhere = input.includeDeleted ? isNotNull(agencyDossiers.deletedAt) : isNull(agencyDossiers.deletedAt);
        const searchTerm = input.search?.trim();
        const whereClause = searchTerm
          ? and(visibilityWhere, or(
              like(agencyDossiers.fullName, `%${searchTerm}%`),
              like(agencyDossiers.email, `%${searchTerm}%`),
              like(agencyDossiers.phone, `%${searchTerm}%`),
              sql`CAST(${agencyDossiers.id} AS CHAR) LIKE ${`%${searchTerm}%`}`,
            ))
          : visibilityWhere;
        const dossiers = await db
          .select()
          .from(agencyDossiers)
          .where(whereClause)
          .orderBy(desc(agencyDossiers.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        const [countRow] = await db.select({ total: count() }).from(agencyDossiers).where(whereClause);
        const total = Number(countRow?.total ?? 0);
        const emailKeys = dossiers.map((dossier) => dossier.email.toLowerCase());
        const candidateRows = emailKeys.length
          ? await db.select({ id: candidates.id, email: candidates.email, fullName: candidates.fullName }).from(candidates).where(inArray(candidates.email, emailKeys))
          : [];
        const candidateByEmail = new Map(candidateRows.map((candidate) => [candidate.email.toLowerCase(), candidate]));
        const dossiersWithAccount = dossiers.map((dossier) => {
          const account = candidateByEmail.get(dossier.email.toLowerCase());
          return {
            ...dossier,
            linkedCandidateId: account?.id ?? null,
            linkedCandidateEmail: account?.email ?? null,
            linkedCandidateName: account?.fullName ?? null,
          };
        });

        return {
          dossiers: dossiersWithAccount,
          total,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (err) {
        console.error("[Agency Dossier] Get dossiers error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des dossiers",
        });
      }
    }),

  /**
   * Récupérer un dossier spécifique
   */
  getDossierById: protectedProcedure
    .input(z.object({
      dossierId: z.number().int().positive(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent accéder aux dossiers en agence",
        });
      }

      try {
        const dossier = await db
          .select()
          .from(agencyDossiers)
          .where(eq(agencyDossiers.id, input.dossierId))
          .limit(1);

        if (dossier.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dossier non trouvé",
          });
        }

        const history = await db
          .select()
          .from(agencyDossierHistory)
          .where(eq(agencyDossierHistory.dossierId, input.dossierId))
          .orderBy(desc(agencyDossierHistory.createdAt))
          .limit(200);

        return {
          dossier: dossier[0],
          history,
        };
      } catch (err) {
        console.error("[Agency Dossier] Get dossier error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération du dossier",
        });
      }
    }),

  /**
   * Mettre à jour le statut d'un dossier
   */
  updateStatus: protectedProcedure
    .input(z.object({
      dossierId: z.number().int().positive(),
      newStatus: z.enum(AGENCY_DOSSIER_STATUS_VALUES),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent modifier les dossiers",
        });
      }

      try {
        const dossier = await db
          .select()
          .from(agencyDossiers)
          .where(eq(agencyDossiers.id, input.dossierId))
          .limit(1);

        if (dossier.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dossier non trouvé",
          });
        }

        if (
          isLuxembourgEmploymentStatus(input.newStatus) &&
          !isLuxembourgEmploymentProcedure(dossier[0].destination, dossier[0].visaType)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cette étape est réservée aux procédures de travail au Luxembourg.",
          });
        }

        if (input.newStatus === "en_cours") {
          const dossierHasCv = Boolean(dossier[0].cvFileUrl || dossier[0].cvFileName);
          const cvDocuments = dossierHasCv
            ? [{ id: -1 }]
            : await db
                .select({ id: agencyDossierDocuments.id })
                .from(agencyDossierDocuments)
                .where(and(
                  eq(agencyDossierDocuments.dossierId, input.dossierId),
                  or(
                    like(agencyDossierDocuments.documentType, "%cv%"),
                    like(agencyDossierDocuments.documentName, "%cv%"),
                    like(agencyDossierDocuments.documentType, "%curriculum%"),
                    like(agencyDossierDocuments.documentName, "%curriculum%"),
                  ),
                ))
                .limit(1);

          if (cvDocuments.length === 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Un CV exploitable doit être déposé avant le passage du pré-dossier en cours.",
            });
          }
        }

        const oldStatus = dossier[0].status;

        await db
          .update(agencyDossiers)
          .set({
            status: input.newStatus as any,
            lastStatusChangeAt: new Date(),
            lastStatusChangeBy: ctx.user.email || "unknown",
          })
          .where(eq(agencyDossiers.id, input.dossierId));

        await db.insert(agencyDossierHistory).values({
          dossierId: input.dossierId,
          action: "status_changed",
          changedBy: ctx.user.email || "unknown",
          oldValue: oldStatus || "",
          newValue: input.newStatus,
          details: input.notes || "Statut mis à jour",
        });

        try {
          const statusMessages: Record<string, string> = {
            nouveau: "Votre dossier a été créé",
            en_cours: "Votre dossier est en cours de traitement",
            documents_requis: "Des documents supplémentaires sont requis",
            recherche_employeur: "Votre dossier est à l’étape de recherche d’employeur",
            validation_adem: "Votre dossier est à l’étape de validation de l’ADEM",
            soumis: "Votre dossier a été soumis",
            approuve: "Félicitations! Votre dossier a été approuvé",
            refuse: "Votre dossier a été refusé",
          };

          const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Mise à jour de votre dossier</h2>
            <p>Bonjour ${esc(dossier[0].fullName)},</p>
            <p>${statusMessages[input.newStatus]}</p>
            ${input.notes ? `<p><strong>Message:</strong> ${esc(input.notes)}</p>` : ""}
            <p>Cordialement,<br/>L'équipe 3M Travel & Services</p>
          </div>`;

          await sendGenericEmail({
            to: dossier[0].email,
            subject: "📋 Mise à jour de votre dossier - 3M Travel & Services",
            html: htmlContent
          });
        } catch (emailErr) {
          console.error("[Agency Dossier] Status update email failed:", emailErr);
        }

        return {
          success: true,
          message: "Statut mis à jour avec succès",
        };
      } catch (err) {
        console.error("[Agency Dossier] Update status error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du statut",
        });
      }
    }),

  /**
   * Ajouter des notes au dossier
   */
  validateEvaluation: protectedProcedure
    .input(z.object({ dossierId: z.number().int().positive(), note: z.string().trim().max(1000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Seuls les administrateurs peuvent valider une évaluation" });
      const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, input.dossierId)).limit(1);
      if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence non trouvé" });
      const validatedAt = new Date();
      const validatedBy = ctx.user.email || "unknown";
      await db.update(agencyDossiers).set({ evaluationValidatedAt: validatedAt, evaluationValidatedBy: validatedBy, evaluationValidationNote: input.note?.trim() || "Évaluation validée manuellement par l’administration." }).where(eq(agencyDossiers.id, input.dossierId));
      await db.insert(agencyDossierHistory).values({ dossierId: input.dossierId, action: "evaluation_validated", changedBy: validatedBy, oldValue: dossier.evaluationValidatedAt ? "validated" : "pending", newValue: "validated", details: input.note?.trim() || "Évaluation validée indépendamment du rattachement automatique." });
      return { success: true, validatedAt, validatedBy };
    }),
  addNotes: protectedProcedure
    .input(z.object({
      dossierId: z.number().int().positive(),
      notes: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent ajouter des notes",
        });
      }

      try {
        const dossier = await db
          .select()
          .from(agencyDossiers)
          .where(eq(agencyDossiers.id, input.dossierId))
          .limit(1);

        if (dossier.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dossier non trouvé",
          });
        }

        const oldNotes = dossier[0].adminNotes;

        await db
          .update(agencyDossiers)
          .set({
            adminNotes: input.notes,
          })
          .where(eq(agencyDossiers.id, input.dossierId));

        await db.insert(agencyDossierHistory).values({
          dossierId: input.dossierId,
          action: "notes_added",
          changedBy: ctx.user.email || "unknown",
          oldValue: oldNotes || "",
          newValue: input.notes,
          details: "Notes administrateur mises à jour",
        });

        return {
          success: true,
          message: "Notes ajoutées avec succès",
        };
      } catch (err) {
        console.error("[Agency Dossier] Add notes error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'ajout des notes",
        });
      }
    }),

  /**
   * Supprimer un dossier
   */
  deleteDossier: protectedProcedure
    .input(z.object({
      dossierId: z.number().int().positive(),
      confirmation: z.literal("SUPPRIMER"),
      reason: z.string().trim().min(8).max(500),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent supprimer des dossiers",
        });
      }

      try {
        const dossier = await db
          .select()
          .from(agencyDossiers)
          .where(eq(agencyDossiers.id, input.dossierId))
          .limit(1);

        if (dossier.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dossier non trouvé",
          });
        }

        await db.update(agencyDossiers).set({
          deletedAt: new Date(),
          deletedBy: ctx.user.email || "unknown",
          deletionReason: input.reason,
        }).where(eq(agencyDossiers.id, input.dossierId));

        await db.insert(agencyDossierHistory).values({
          dossierId: input.dossierId,
          action: "deleted",
          changedBy: ctx.user.email || "unknown",
          oldValue: JSON.stringify(dossier[0]),
          newValue: null,
          details: `Dossier placé dans la corbeille. Motif : ${input.reason}`,
        });

        return {
          success: true,
          message: "Dossier placé dans la corbeille. Il peut être restauré par un administrateur.",
        };
      } catch (err) {
        console.error("[Agency Dossier] Delete error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la suppression du dossier",
        });
      }
    }),

  restoreDossier: protectedProcedure
    .input(z.object({ dossierId: z.number().int().positive(), reason: z.string().trim().min(3).max(500) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Seuls les administrateurs peuvent restaurer un dossier" });
      const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, input.dossierId)).limit(1);
      if (!dossier || !dossier.deletedAt) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable dans la corbeille" });
      if (Date.now() - dossier.deletedAt.getTime() > 30 * 24 * 60 * 60 * 1000) throw new TRPCError({ code: "BAD_REQUEST", message: "La période de restauration de 30 jours est expirée" });
      await db.update(agencyDossiers).set({ deletedAt: null, deletedBy: null, deletionReason: null }).where(eq(agencyDossiers.id, input.dossierId));
      await db.insert(agencyDossierHistory).values({ dossierId: input.dossierId, action: "restored", changedBy: ctx.user.email || "unknown", oldValue: "corbeille", newValue: "actif", details: `Dossier restauré. Motif : ${input.reason}` });
      return { success: true };
    }),

  sendManualReminder: protectedProcedure
    .input(z.object({ dossierId: z.number().int().positive(), message: z.string().trim().min(10).max(1200) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Seuls les administrateurs peuvent envoyer une relance" });
      const [dossier] = await db.select().from(agencyDossiers).where(and(eq(agencyDossiers.id, input.dossierId), isNull(agencyDossiers.deletedAt))).limit(1);
      if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier actif introuvable" });
      await sendGenericEmail({ to: dossier.email, subject: "Rappel concernant votre dossier — 3M Travel & Services", html: `<p>Bonjour ${esc(dossier.fullName)},</p><p>${esc(input.message).replace(/\n/g, "<br/>")}</p><p>Cordialement,<br/>3M Travel &amp; Services</p>` });
      await db.insert(agencyDossierHistory).values({ dossierId: input.dossierId, action: "manual_reminder", changedBy: ctx.user.email || "unknown", oldValue: null, newValue: null, details: "Relance manuelle envoyée" });
      return { success: true };
    }),
});

