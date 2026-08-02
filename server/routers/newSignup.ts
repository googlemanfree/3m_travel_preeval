import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOUVEAU SYSTÈME D'INSCRIPTION INDÉPENDANT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Routeur tRPC complètement séparé pour les inscriptions utilisateurs.
 * Utilise la table user_accounts (nouvelle table indépendante).
 * Formulaire simplifié : nom, email, mot de passe, confirmation.
 */

const JWT_SECRET = process.env.JWT_SECRET || "secret3m";
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 heures

export const newSignupRouter = router({
  /**
   * Procédure d'inscription
   * Crée un nouveau compte utilisateur avec vérification d'email
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

      // Vérifier que les mots de passe correspondent
      if (password !== confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Les mots de passe ne correspondent pas",
        });
      }

      // Vérifier que l'email n'existe pas déjà
      const existingUser = await db.execute(
        sql`SELECT id FROM user_accounts WHERE email = ${email.toLowerCase()}`
      );

      if (existingUser.rows && existingUser.rows.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cet email est déjà utilisé",
        });
      }

      // Hacher le mot de passe
      const passwordHash = await bcrypt.hash(password, 10);

      // Générer le token de vérification
      const verificationToken = jwt.sign(
        { email: email.toLowerCase() },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const verificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY);

      // Insérer le nouvel utilisateur dans la table user_accounts
      try {
        await db.execute(
          sql`INSERT INTO user_accounts (
            fullName,
            email,
            passwordHash,
            emailVerified,
            verificationToken,
            verificationExpiresAt,
            createdAt,
            updatedAt
          ) VALUES (
            ${fullName.trim()},
            ${email.toLowerCase()},
            ${passwordHash},
            false,
            ${verificationToken},
            ${verificationExpiresAt.toISOString()},
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
      const verificationLink = `${process.env.VITE_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;

      // Envoyer l'email de bienvenue (intégration avec le service d'email)
      try {
        // TODO: Intégrer avec le service d'email (Resend, SendGrid, etc.)
        console.log(`Email de bienvenue envoyé à ${email}`);
        console.log(`Lien de vérification: ${verificationLink}`);
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        // Ne pas échouer l'inscription si l'email ne peut pas être envoyé
      }

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
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { token } = input;

      try {
        // Vérifier le token JWT
        const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
        const email = decoded.email;

        // Chercher l'utilisateur avec ce token
        const result = await db.execute(
          sql`SELECT id, emailVerified, verificationExpiresAt FROM user_accounts WHERE email = ${email} AND verificationToken = ${token}`
        );

        if (!result.rows || result.rows.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Token de vérification invalide ou expiré",
          });
        }

        const user = result.rows[0] as any;

        // Vérifier que le token n'a pas expiré
        if (user.verificationExpiresAt && new Date(user.verificationExpiresAt) < new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Le token de vérification a expiré",
          });
        }

        // Mettre à jour l'utilisateur
        await db.execute(
          sql`UPDATE user_accounts 
             SET emailVerified = true, verificationToken = NULL, verificationExpiresAt = NULL, updatedAt = NOW()
             WHERE email = ${email}`
        );

        return {
          success: true,
          message: "Email vérifié avec succès. Vous pouvez maintenant vous connecter.",
          email: email,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof jwt.JsonWebTokenError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Token invalide ou expiré",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la vérification de l'email",
        });
      }
    }),

  /**
   * Procédure de renvoi d'email de vérification
   * Renvoie un nouvel email de vérification si le token a expiré
   */
  resendVerificationEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email invalide"),
      })
    )
    .mutation(async ({ input }) => {
      const { email } = input;

      // Chercher l'utilisateur
      const result = await db.execute(
        sql`SELECT id, emailVerified FROM user_accounts WHERE email = ${email.toLowerCase()}`
      );

      if (!result.rows || result.rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cet email n'existe pas",
        });
      }

      const user = result.rows[0] as any;

      // Vérifier que l'email n'est pas déjà vérifié
      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cet email est déjà vérifié",
        });
      }

      // Générer un nouveau token
      const verificationToken = jwt.sign(
        { email: email.toLowerCase() },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const verificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY);

      // Mettre à jour le token
      await db.execute(
        sql`UPDATE user_accounts 
           SET verificationToken = ${verificationToken}, verificationExpiresAt = ${verificationExpiresAt.toISOString()}, updatedAt = NOW()
           WHERE email = ${email.toLowerCase()}`
      );

      // Construire le lien de vérification
      const verificationLink = `${process.env.VITE_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;

      // Envoyer l'email
      try {
        // TODO: Intégrer avec le service d'email
        console.log(`Email de vérification renvoyé à ${email}`);
        console.log(`Lien de vérification: ${verificationLink}`);
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
      }

      return {
        success: true,
        message: "Un nouvel email de vérification a été envoyé",
        email: email.toLowerCase(),
      };
    }),

  /**
   * Procédure de connexion
   * Authentifie l'utilisateur avec email et mot de passe
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email invalide"),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { email, password } = input;

      // Chercher l'utilisateur
      const result = await db.execute(
        sql`SELECT id, fullName, email, passwordHash, emailVerified FROM user_accounts WHERE email = ${email.toLowerCase()}`
      );

      if (!result.rows || result.rows.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect",
        });
      }

      const user = result.rows[0] as any;

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
        sql`UPDATE user_accounts SET lastLoginAt = NOW() WHERE id = ${user.id}`
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
});
