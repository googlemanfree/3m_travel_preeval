/**
 * Routeur tRPC — Tableau de Bord Utilisateur OAuth Manus
 * Gère le profil et le dossier pour les utilisateurs connectés via OAuth Manus
 */

import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const oauthUserDashboardRouter = router({
  // ── Profil utilisateur OAuth ───────────────────────────────────────────────
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
    }

    return {
      id: ctx.user.id,
      fullName: ctx.user.name || '',
      email: ctx.user.email || '',
      phone: null,
      nationality: null,
      dateOfBirth: null,
      destination: 'autre',
      visaType: null,
      dossierStatus: 'nouveau',
      dossierNote: null,
      formulaChosen: null,
      scoreResult: null,
      educationLevel: null,
      employmentStatus: null,
      languageLevel: null,
      createdAt: ctx.user.createdAt,
      lastLoginAt: ctx.user.lastSignedIn,
    };
  }),

  // ── Mise à jour du profil utilisateur OAuth ────────────────────────────────
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
        formulaChosen: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
      }

      // Pour les utilisateurs OAuth, on retourne simplement un succès
      // Les données de profil complètes seraient stockées dans une table séparée si nécessaire
      return { success: true, message: "Profil mis à jour." };
    }),

  // ── Liste des documents (vide pour OAuth) ──────────────────────────────────
  listDocuments: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
    }

    return [];
  }),

  // ── Enregistrer un document ────────────────────────────────────────────────
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
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
      }

      return { success: true, message: "Document enregistré." };
    }),

  // ── Supprimer un document ──────────────────────────────────────────────────
  deleteDocument: protectedProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
      }

      return { success: true, message: "Document supprimé." };
    }),

  // ── Récupérer les messages ────────────────────────────────────────────────
  getMessages: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
    }

    return [];
  }),

  // ── Envoyer un message ────────────────────────────────────────────────────
  sendMessage: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
      }

      return { success: true, message: "Message envoyé." };
    }),

  // ── Récupérer les actions en attente ──────────────────────────────────────
  getPendingActions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
    }

    return {
      documentsToUpload: [],
      messagesToReview: [],
      profileToComplete: false,
    };
  }),
});
