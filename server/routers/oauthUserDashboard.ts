/**
 * Routeur tRPC — Tableau de Bord Utilisateur OAuth (Google / Facebook / Manus)
 *
 * Les utilisateurs connectés via un fournisseur social n'ont pas de ligne dans
 * `candidates` (pas de mot de passe). On leur associe (ou crée à la première
 * visite) une vraie ligne candidate liée par email, puis on réutilise
 * exactement la même logique — mêmes tables, mêmes statuts, mêmes actions —
 * que pour les candidats inscrits par email/mot de passe. Plus aucune donnée
 * fictive : upload, messages et profil sont réellement enregistrés en base.
 */

import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { candidates, candidateFiles, candidateMessages, Candidate, CandidateFile, CandidateMessage } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { getOrCreateCandidateForPlatformUser } from "./candidate";

export const oauthUserDashboardRouter = router({
  // ── Profil utilisateur OAuth (lié à un vrai dossier candidat) ──────────────
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
    const c = (await getOrCreateCandidateForPlatformUser(ctx.user)) as Candidate;

    return {
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      nationality: c.nationality,
      dateOfBirth: c.dateOfBirth,
      destination: c.destination,
      visaType: c.visaType,
      dossierStatus: c.dossierStatus,
      dossierNote: c.dossierNote,
      formulaChosen: c.formulaChosen,
      scoreResult: c.scoreResult,
      educationLevel: c.educationLevel,
      employmentStatus: c.employmentStatus,
      languageLevel: c.languageLevel,
      preferredLanguage: c.preferredLanguage,
      createdAt: c.createdAt,
      lastLoginAt: c.lastLoginAt,
    };
  }),

  // ── Mise à jour du profil (réellement enregistrée) ──────────────────────────
  updateProfile: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(2).optional(),
        phone: z.string().optional(),
        nationality: z.string().optional(),
        dateOfBirth: z.string().optional(),
        destination: z.enum(["canada", "luxembourg", "pologne", "europe", "golfe", "autre"]).optional(),
        visaType: z.string().optional(),
        educationLevel: z.string().optional(),
        employmentStatus: z.string().optional(),
        languageLevel: z.string().optional(),
        preferredLanguage: z.enum(["fr", "en"]).optional(),
        formulaChosen: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
      const c = (await getOrCreateCandidateForPlatformUser(ctx.user)) as Candidate;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: Record<string, unknown> = {};
      Object.entries(input).forEach(([k, v]) => { if (v !== undefined) updateData[k] = v; });

      await db.update(candidates).set(updateData).where(eq(candidates.id, c.id));
      return { success: true, message: "Profil mis à jour." };
    }),

  // ── Liste des documents (réellement stockés) ────────────────────────────────
  listDocuments: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
    const c = (await getOrCreateCandidateForPlatformUser(ctx.user)) as Candidate;
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const files = await db
      .select()
      .from(candidateFiles)
      .where(eq(candidateFiles.candidateId, c.id))
      .orderBy(desc(candidateFiles.uploadedAt));

    return files as CandidateFile[];
  }),

  // ── Enregistrer un document après upload S3 (réellement inséré) ────────────
  saveDocument: protectedProcedure
    .input(
      z.object({
        fileType: z.enum([
          "cv", "passeport", "diplome", "releve_notes", "photo",
          "justificatif_domicile", "extrait_naissance", "casier_judiciaire", "autre",
        ]),
        fileName: z.string(),
        fileUrl: z.string().url(),
        fileKey: z.string(),
        fileSizeBytes: z.number().optional(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
      const c = (await getOrCreateCandidateForPlatformUser(ctx.user)) as Candidate;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(candidateFiles).values({
        candidateId: c.id,
        fileType: input.fileType,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        fileSizeBytes: input.fileSizeBytes ?? null,
        mimeType: input.mimeType ?? null,
        status: "uploaded",
      });

      if (c.dossierStatus === "nouveau") {
        await db.update(candidates).set({ dossierStatus: "evaluation" }).where(eq(candidates.id, c.id));
      }

      return { success: true, message: "Document enregistré." };
    }),

  // ── Supprimer un document (réellement supprimé) ─────────────────────────────
  deleteDocument: protectedProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
      const c = (await getOrCreateCandidateForPlatformUser(ctx.user)) as Candidate;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(candidateFiles)
        .where(and(eq(candidateFiles.id, input.fileId), eq(candidateFiles.candidateId, c.id)));

      return { success: true, message: "Document supprimé." };
    }),

  // ── Messagerie : lire les messages (réellement stockés) ─────────────────────
  getMessages: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
    const c = (await getOrCreateCandidateForPlatformUser(ctx.user)) as Candidate;
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const msgs = await db
      .select()
      .from(candidateMessages)
      .where(eq(candidateMessages.candidateId, c.id))
      .orderBy(candidateMessages.createdAt);

    await db
      .update(candidateMessages)
      .set({ isRead: true })
      .where(and(eq(candidateMessages.candidateId, c.id), eq(candidateMessages.senderRole, "advisor")));

    return msgs as CandidateMessage[];
  }),

  // ── Messagerie : envoyer un message (réellement enregistré) ─────────────────
  sendMessage: protectedProcedure
    .input(z.object({ content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
      const c = (await getOrCreateCandidateForPlatformUser(ctx.user)) as Candidate;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(candidateMessages).values({
        candidateId: c.id,
        senderRole: "candidate",
        content: input.content,
        isRead: false,
      });

      return { success: true, message: "Message envoyé." };
    }),

  // ── Actions en attente (calculées à partir du vrai statut du dossier) ───────
  getPendingActions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
    const c = (await getOrCreateCandidateForPlatformUser(ctx.user)) as Candidate;

    const actions: any[] = [];

    if (c.dossierStatus === "documents") {
      actions.push({
        id: "payment-pending",
        type: "payment",
        title: "Paiement obligatoire",
        description: "Veuillez effectuer le paiement de 65 000 XAF pour finaliser votre dossier.",
        urgency: "high",
        amount: 65000,
        action: { label: "Payer maintenant", href: "/mon-dossier" },
      });
    }

    if (c.dossierStatus === "traitement") {
      actions.push({
        id: "documents-pending",
        type: "documents",
        title: "Documents à soumettre",
        description: "Veuillez soumettre vos documents originaux ou une version numérisée professionnelle.",
        urgency: "high",
        action: { label: "Soumettre les documents", href: "/submit-documents" },
      });
    }

    if (c.dossierStatus === "evaluation") {
      actions.push({
        id: "evaluation-pending",
        type: "evaluation",
        title: "Évaluation en cours",
        description: "Notre équipe analyse votre profil. Vous recevrez votre bilan dans 48 heures.",
        urgency: "medium",
        action: { label: "Consulter mon dossier", href: "/mon-dossier" },
      });
    }

    return actions;
  }),
});
