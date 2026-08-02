import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ROUTEUR D'AUTHENTIFICATION SIMPLE ET ROBUSTE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Système d'inscription et d'authentification complètement indépendant.
 * Utilise la table simple_users (nouvelle table dédiée).
 * Fonctionnalités: inscription, vérification email, connexion, réinitialisation mot de passe.
 */

const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 heures
const RESET_TOKEN_EXPIRY = 1 * 60 * 60 * 1000; // 1 heure

// Fonction utilitaire pour générer un token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Fonction pour formater la date
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export const simpleAuthRouter = router({
  /**
   * Procédure d'inscription
   * Crée un nouveau compte utilisateur
   */
  register: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
        email: z.string().email("Email invalide"),
        password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { fullName, email, password, confirmPassword } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Vérifier que les mots de passe correspondent
      if (password !== confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Les mots de passe ne correspondent pas",
        });
      }

      // Vérifier que l'email n'existe pas déjà
      const existingUser = await db.execute(
        sql`SELECT id FROM simple_users WHERE email = ${email.toLowerCase()}`
      );

      if ((existingUser as any).rows && (existingUser as any).rows.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cet email est déjà utilisé",
        });
      }

      // Hacher le mot de passe
      const passwordHash = await bcrypt.hash(password, 10);

      // Générer le token de vérification
      const verificationToken = generateToken();
      const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

      // Insérer le nouvel utilisateur
      try {
        await db.execute(
          sql`INSERT INTO simple_users (
            fullName,
            email,
            passwordHash,
            emailVerified,
            verificationToken,
            verificationTokenExpiry,
            createdAt,
            updatedAt
          ) VALUES (
            ${fullName.trim()},
            ${email.toLowerCase()},
            ${passwordHash},
            false,
            ${verificationToken},
            ${formatDate(verificationTokenExpiry)},
            NOW(),
            NOW()
          )`
        );
      } catch (error) {
        console.error("Erreur lors de l'insertion:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création du compte",
        });
      }

      // Construire le lien de vérification
      const verificationLink = `${process.env.VITE_APP_URL || "http://localhost:3000"}/confirm-email?token=${verificationToken}`;

      // TODO: Envoyer l'email de vérification
      console.log(`Email de vérification envoyé à ${email}`);
      console.log(`Lien: ${verificationLink}`);

      return {
        success: true,
        message: "Compte créé avec succès. Vérifiez votre email pour confirmer votre inscription.",
        email: email.toLowerCase(),
      };
    }),

  /**
   * Procédure de vérification d'email
   * Valide le token et marque l'email comme vérifié
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const { token } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Chercher l'utilisateur avec ce token
      const result = await db.execute(
        sql`SELECT id, email, emailVerified, verificationTokenExpiry FROM simple_users WHERE verificationToken = ${token}`
      );

      if (!(result as any).rows || (result as any).rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token de vérification invalide",
        });
      }

      const user = (result as any).rows[0];

      // Vérifier que le token n'a pas expiré
      if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Le token de vérification a expiré",
        });
      }

      // Mettre à jour l'utilisateur
      await db.execute(
        sql`UPDATE simple_users 
           SET emailVerified = true, verificationToken = NULL, verificationTokenExpiry = NULL, updatedAt = NOW()
           WHERE id = ${user.id}`
      );

      return {
        success: true,
        message: "Email vérifié avec succès. Vous pouvez maintenant vous connecter.",
        email: user.email,
      };
    }),

  /**
   * Procédure de renvoi d'email de vérification
   */
  resendVerificationEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { email } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Chercher l'utilisateur
      const result = await db.execute(
        sql`SELECT id, emailVerified FROM simple_users WHERE email = ${email.toLowerCase()}`
      );

      if (!(result as any).rows || (result as any).rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cet email n'existe pas",
        });
      }

      const user = (result as any).rows[0];

      // Vérifier que l'email n'est pas déjà vérifié
      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cet email est déjà vérifié",
        });
      }

      // Générer un nouveau token
      const verificationToken = generateToken();
      const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

      // Mettre à jour le token
      await db.execute(
        sql`UPDATE simple_users 
           SET verificationToken = ${verificationToken}, verificationTokenExpiry = ${formatDate(verificationTokenExpiry)}, updatedAt = NOW()
           WHERE id = ${user.id}`
      );

      // Construire le lien de vérification
      const verificationLink = `${process.env.VITE_APP_URL || "http://localhost:3000"}/confirm-email?token=${verificationToken}`;

      // TODO: Envoyer l'email
      console.log(`Email de vérification renvoyé à ${email}`);
      console.log(`Lien: ${verificationLink}`);

      return {
        success: true,
        message: "Un nouvel email de vérification a été envoyé",
      };
    }),

  /**
   * Procédure de connexion
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { email, password } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Chercher l'utilisateur
      const result = await db.execute(
        sql`SELECT id, fullName, email, passwordHash, emailVerified FROM simple_users WHERE email = ${email.toLowerCase()}`
      );

      if (!(result as any).rows || (result as any).rows.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect",
        });
      }

      const user = (result as any).rows[0];

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect",
        });
      }

      // Vérifier que l'email est vérifié
      if (!user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Veuillez vérifier votre email avant de vous connecter",
        });
      }

      // Mettre à jour lastLoginAt
      await db.execute(
        sql`UPDATE simple_users SET lastLoginAt = NOW() WHERE id = ${user.id}`
      );

      return {
        success: true,
        message: "Connexion réussie",
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        },
      };
    }),

  /**
   * Procédure pour demander une réinitialisation de mot de passe
   */
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { email } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Chercher l'utilisateur
      const result = await db.execute(
        sql`SELECT id FROM simple_users WHERE email = ${email.toLowerCase()}`
      );

      if (!(result as any).rows || (result as any).rows.length === 0) {
        // Ne pas révéler si l'email existe ou non (sécurité)
        return {
          success: true,
          message: "Si cet email existe, un lien de réinitialisation a été envoyé",
        };
      }

      const user = (result as any).rows[0];

      // Générer un token de réinitialisation
      const resetToken = generateToken();
      const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY);

      // Mettre à jour le token
      await db.execute(
        sql`UPDATE simple_users 
           SET resetToken = ${resetToken}, resetTokenExpiry = ${formatDate(resetTokenExpiry)}, updatedAt = NOW()
           WHERE id = ${user.id}`
      );

      // Construire le lien de réinitialisation
      const resetLink = `${process.env.VITE_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

      // TODO: Envoyer l'email
      console.log(`Email de réinitialisation envoyé à ${email}`);
      console.log(`Lien: ${resetLink}`);

      return {
        success: true,
        message: "Si cet email existe, un lien de réinitialisation a été envoyé",
      };
    }),

  /**
   * Procédure pour réinitialiser le mot de passe
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string().min(8),
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { token, password, confirmPassword } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Vérifier que les mots de passe correspondent
      if (password !== confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Les mots de passe ne correspondent pas",
        });
      }

      // Chercher l'utilisateur avec ce token
      const result = await db.execute(
        sql`SELECT id, resetTokenExpiry FROM simple_users WHERE resetToken = ${token}`
      );

      if (!(result as any).rows || (result as any).rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token de réinitialisation invalide",
        });
      }

      const user = (result as any).rows[0];

      // Vérifier que le token n'a pas expiré
      if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Le lien de réinitialisation a expiré",
        });
      }

      // Hacher le nouveau mot de passe
      const passwordHash = await bcrypt.hash(password, 10);

      // Mettre à jour le mot de passe
      await db.execute(
        sql`UPDATE simple_users 
           SET passwordHash = ${passwordHash}, resetToken = NULL, resetTokenExpiry = NULL, updatedAt = NOW()
           WHERE id = ${user.id}`
      );

      return {
        success: true,
        message: "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
      };
    }),
});
