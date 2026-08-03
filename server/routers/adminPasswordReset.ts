/**
 * Routeur tRPC — Réinitialisation de Mot de Passe Admin
 * Système sécurisé de réinitialisation de mot de passe pour les administrateurs
 */

import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getDb } from "../db";
import { adminAccounts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { getPasswordResetEmailTemplate, getPasswordResetSuccessEmailTemplate } from "../_core/emailTemplates";

// Générer un token de réinitialisation sécurisé
function generateResetToken(): string {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export const adminPasswordResetRouter = router({
  /**
   * Demander une réinitialisation de mot de passe
   * Envoie un email avec un lien de réinitialisation
   */
  requestReset: publicProcedure
    .input(z.object({
      email: z.string().email("Email invalide"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      // Chercher l'admin par email
      const rows = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.email, input.email))
        .limit(1);

      if (rows.length === 0) {
        // Ne pas révéler si l'email existe ou non (sécurité)
        console.log(`[Admin Password Reset] Reset requested for non-existent email: ${input.email}`);
        return {
          success: true,
          message: "Si cet email est associé à un compte administrateur, vous recevrez un lien de réinitialisation.",
        };
      }

      const admin = rows[0];

      if (admin.status !== "active") {
        console.log(`[Admin Password Reset] Reset requested for inactive admin: ${input.email}`);
        return {
          success: true,
          message: "Si cet email est associé à un compte administrateur, vous recevrez un lien de réinitialisation.",
        };
      }

      // Générer un token de réinitialisation
      const resetToken = generateResetToken();
      const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 heure

      // Mettre à jour le token dans la BD
      await db
        .update(adminAccounts)
        .set({
          resetToken,
          resetTokenExpiresAt,
        })
        .where(eq(adminAccounts.id, admin.id));

      // Construire le lien de réinitialisation
      const resetLink = `${process.env.VITE_APP_URL || "https://www.3mtravelagency.click"}/admin/reset-password?token=${resetToken}`;

      // Envoyer l'email
      try {
        const emailTemplate = getPasswordResetEmailTemplate({
          adminName: admin.fullName || admin.email,
          adminEmail: admin.email,
          resetLink,
          expiresIn: "1 heure",
          timestamp: new Date(),
        });

        await sendEmail({
          to: admin.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });

        console.log(`[Admin Password Reset] Reset email sent to ${admin.email}`);
      } catch (emailError) {
        console.error(`[Admin Password Reset] Failed to send reset email to ${admin.email}:`, emailError);
        // Ne pas échouer la mutation si l'email n'est pas envoyé
      }

      return {
        success: true,
        message: "Si cet email est associé à un compte administrateur, vous recevrez un lien de réinitialisation.",
      };
    }),

  /**
   * Valider un token de réinitialisation
   */
  validateResetToken: publicProcedure
    .input(z.object({
      token: z.string().min(1, "Token manquant"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const rows = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.resetToken, input.token))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Token de réinitialisation invalide" });
      }

      const admin = rows[0];

      // Vérifier que le token n'a pas expiré
      if (!admin.resetTokenExpiresAt || new Date() > admin.resetTokenExpiresAt) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Le lien de réinitialisation a expiré" });
      }

      return {
        success: true,
        email: admin.email,
        fullName: admin.fullName,
      };
    }),

  /**
   * Réinitialiser le mot de passe avec un token valide
   */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string().min(1, "Token manquant"),
      newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
      confirmPassword: z.string().min(1, "Confirmation manquante"),
    }))
    .mutation(async ({ input }) => {
      // Valider que les mots de passe correspondent
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Les mots de passe ne correspondent pas" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      // Chercher l'admin par token
      const rows = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.resetToken, input.token))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Token de réinitialisation invalide" });
      }

      const admin = rows[0];

      // Vérifier que le token n'a pas expiré
      if (!admin.resetTokenExpiresAt || new Date() > admin.resetTokenExpiresAt) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Le lien de réinitialisation a expiré" });
      }

      // Hasher le nouveau mot de passe
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      const now = new Date();

      // Mettre à jour le mot de passe et nettoyer le token
      await db
        .update(adminAccounts)
        .set({
          passwordHash,
          passwordChangedAt: now,
          resetToken: null,
          resetTokenExpiresAt: null,
          requiresPasswordChange: false,
          sessionToken: null,
          sessionExpiresAt: null,
        })
        .where(eq(adminAccounts.id, admin.id));

      // Envoyer un email de confirmation
      try {
        const emailTemplate = getPasswordResetSuccessEmailTemplate({
          adminName: admin.fullName || admin.email,
          adminEmail: admin.email,
          timestamp: now,
        });

        await sendEmail({
          to: admin.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });

        console.log(`[Admin Password Reset] Password reset confirmation sent to ${admin.email}`);
      } catch (emailError) {
        console.error(`[Admin Password Reset] Failed to send confirmation email to ${admin.email}:`, emailError);
      }

      return {
        success: true,
        message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
      };
    }),
});
