import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { sendPasswordResetEmail } from "../emailService";
import { checkLoginAttempts, recordFailedAttempt, resetLoginAttempts } from "../loginAttemptsService";

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
        fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(255),
        email: z.string().email("Email invalide").max(320),
        password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(128),
        confirmPassword: z.string().max(128),
      })
    )
    .mutation(async () => {
      throw new TRPCError({ code: "FORBIDDEN", message: "Ce parcours d’inscription est désactivé. Utilisez l’inscription avec portrait humain obligatoire." });
    }),

  registerLegacy: publicProcedure
    .input(z.never())
    .mutation(async () => {
      throw new TRPCError({ code: "FORBIDDEN", message: "Inscription héritée désactivée." });
    }),

  /*
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

  */

  /**
   * Procédure de vérification d'email
   * Valide le token et marque l'email comme vérifié
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().max(512) }))
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
    .input(z.object({ email: z.string().email().max(320) }))
    .mutation(async ({ input }) => {
      const { email } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Chercher l'utilisateur
      const result = await db.execute(
        sql`SELECT id, fullName, emailVerified FROM simple_users WHERE email = ${email.toLowerCase()}`
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

      const baseUrl = (process.env.APP_BASE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "");
      const verificationLink = `${baseUrl}/confirm-email?token=${encodeURIComponent(verificationToken)}`;
      const fullName = String(user.fullName || email);

      try {
        await sendEmail({
          to: email,
          subject: "✓ Confirmez votre email - 3M Travel & Services",
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:40px;text-align:center;color:#fff"><h1 style="margin:0">Confirmez votre email</h1></div><div style="padding:40px;background:#f9fafb"><p>Bonjour <strong>${fullName}</strong>,</p><p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte 3M Travel :</p><p style="text-align:center;margin-top:30px"><a href="${verificationLink}" style="background:linear-gradient(135deg,#1E3A8A,#2563EB);color:#fff;padding:12px 32px;text-decoration:none;border-radius:8px;display:inline-block">✓ Confirmer mon email</a></p><p style="font-size:13px;color:#6b7280;margin-top:20px">Ce lien est valable <strong>24 heures</strong>. Ne le partagez avec personne.</p></div></div>`,
        });
      } catch (emailErr) {
        console.warn("[simpleAuth] Verification email send failed:", emailErr);
      }

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
        email: z.string().email().max(320),
        password: z.string().min(1).max(128),
      })
    )
    .mutation(async ({ input }) => {
      const { email, password } = input;
      checkLoginAttempts(email);

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.execute(
        sql`SELECT id, fullName, email, passwordHash, emailVerified FROM simple_users WHERE email = ${email.toLowerCase()}`
      );

      if (!(result as any).rows || (result as any).rows.length === 0) {
        recordFailedAttempt(email);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect",
        });
      }

      const user = (result as any).rows[0];

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        recordFailedAttempt(email);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect",
        });
      }

      if (!user.emailVerified) {
        recordFailedAttempt(email);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Veuillez vérifier votre email avant de vous connecter",
        });
      }

      resetLoginAttempts(email);
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
    .input(z.object({ email: z.string().email().max(320) }))
    .mutation(async ({ input }) => {
      const { email } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Chercher l'utilisateur
      const result = await db.execute(
        sql`SELECT id, fullName FROM simple_users WHERE email = ${email.toLowerCase()}`
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

      await sendPasswordResetEmail(email, String(user.fullName || email), resetToken).catch((err) =>
        console.warn("[simpleAuth] Password reset email failed:", err)
      );

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
        token: z.string().max(512),
        password: z.string().min(8).max(128),
        confirmPassword: z.string().max(128),
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
