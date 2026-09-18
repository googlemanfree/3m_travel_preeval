/**
 * Routeur tRPC — Gestion des Candidats
 * Inscription, connexion, profil et dossier candidat
 */

import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { candidates, candidateFiles, candidateMessages } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { duplicateConflictMessage, findPotentialDuplicates, normalizeDuplicateEmail } from "../utils/duplicateDetection";
import { checkLoginAttempts, recordFailedAttempt, resetLoginAttempts } from "../loginAttemptsService";

export const candidateRouter = router({
  /**
   * Inscription d'un candidat
   */
  register: publicProcedure
    .input(z.object({
      fullName: z.string().min(2).max(255),
      email: z.string().email().max(320),
      phone: z.string().min(5).max(50),
      password: z.string().min(8).max(128),
      destination: z.enum(["canada", "luxembourg", "pologne", "europe", "golfe", "autre"]).default("autre"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const cleanEmail = normalizeDuplicateEmail(input.email);
        const duplicates = await findPotentialDuplicates(db, { email: cleanEmail, fullName: input.fullName });
        if (duplicates.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: duplicateConflictMessage(duplicates) });
        }

        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Créer le candidat
        await db.insert(candidates).values({
          fullName: input.fullName,
          email: cleanEmail,
          phone: input.phone,
          passwordHash,
          destination: input.destination,
          dossierStatus: "nouveau",
          emailVerified: false,
        });

        return {
          success: true,
          message: "Inscription réussie. Veuillez vérifier votre email.",
        };
      } catch (err) {
        console.error("[Candidate] Register error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'inscription",
        });
      }
    }),

  /**
   * Connexion d'un candidat
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().email().max(320),
      password: z.string().min(1).max(128),
    }))
    .mutation(async ({ input }) => {
      checkLoginAttempts(input.email);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const candidate = await db
          .select()
          .from(candidates)
          .where(eq(candidates.email, input.email))
          .limit(1);

        if (candidate.length === 0) {
          recordFailedAttempt(input.email);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou mot de passe incorrect",
          });
        }

        const isPasswordValid = await bcrypt.compare(input.password, candidate[0].passwordHash);
        if (!isPasswordValid) {
          recordFailedAttempt(input.email);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou mot de passe incorrect",
          });
        }

        resetLoginAttempts(input.email);
        return {
          success: true,
          candidateId: candidate[0].id,
          email: candidate[0].email,
          fullName: candidate[0].fullName,
        };
      } catch (err) {
        console.error("[Candidate] Login error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la connexion",
        });
      }
    }),

  /**
   * Récupérer le profil d'un candidat
   */
  getProfile: protectedProcedure
    .input(z.object({
      candidateId: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const candidate = await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, input.candidateId))
          .limit(1);

        if (candidate.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Candidat non trouvé",
          });
        }

        return candidate[0];
      } catch (err) {
        console.error("[Candidate] Get profile error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération du profil",
        });
      }
    }),

  /**
   * Mettre à jour le profil d'un candidat
   */
  updateProfile: protectedProcedure
    .input(z.object({
      candidateId: z.number().int().positive(),
      fullName: z.string().max(255).optional(),
      phone: z.string().max(50).optional(),
      nationality: z.string().max(100).optional(),
      educationLevel: z.string().max(100).optional(),
      employmentStatus: z.string().max(100).optional(),
      languageLevel: z.string().max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const updates: Record<string, any> = {};
        if (input.fullName) updates.fullName = input.fullName;
        if (input.phone) updates.phone = input.phone;
        if (input.nationality) updates.nationality = input.nationality;
        if (input.educationLevel) updates.educationLevel = input.educationLevel;
        if (input.employmentStatus) updates.employmentStatus = input.employmentStatus;
        if (input.languageLevel) updates.languageLevel = input.languageLevel;

        await db
          .update(candidates)
          .set(updates)
          .where(eq(candidates.id, input.candidateId));

        return {
          success: true,
          message: "Profil mis à jour avec succès",
        };
      } catch (err) {
        console.error("[Candidate] Update profile error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du profil",
        });
      }
    }),

  /**
   * Récupérer les fichiers d'un candidat
   */
  getFiles: protectedProcedure
    .input(z.object({
      candidateId: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const files = await db
          .select()
          .from(candidateFiles)
          .where(eq(candidateFiles.candidateId, input.candidateId))
          .orderBy(desc(candidateFiles.uploadedAt));

        return files;
      } catch (err) {
        console.error("[Candidate] Get files error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des fichiers",
        });
      }
    }),

  /**
   * Récupérer les messages d'un candidat
   */
  getMessages: protectedProcedure
    .input(z.object({
      candidateId: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const messages = await db
          .select()
          .from(candidateMessages)
          .where(eq(candidateMessages.candidateId, input.candidateId))
          .orderBy(desc(candidateMessages.createdAt));

        return messages;
      } catch (err) {
        console.error("[Candidate] Get messages error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des messages",
        });
      }
    }),

  /**
   * Envoyer un message
   */
  sendMessage: protectedProcedure
    .input(z.object({
      candidateId: z.number().int().positive(),
      content: z.string().min(1).max(2000),
      senderRole: z.enum(["candidate", "advisor"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db.insert(candidateMessages).values({
          candidateId: input.candidateId,
          content: input.content,
          senderRole: input.senderRole,
          isRead: false,
        });

        return {
          success: true,
          message: "Message envoyé avec succès",
        };
      } catch (err) {
        console.error("[Candidate] Send message error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'envoi du message",
        });
      }
    }),
});

export default candidateRouter;
