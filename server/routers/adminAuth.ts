/**
 * Routeur tRPC — Authentification Admin (Email + Mot de passe)
 * Système d'authentification séparé pour les administrateurs (Évaluation,
 * Accompagnement, Procédures), indépendant du compte plateforme et du
 * compte candidat.
 */

import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getDb } from "../db";
import { adminAccounts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { getPasswordChangedEmailTemplate, getPasswordChangeFailedEmailTemplate } from "../_core/emailTemplates";
import { randomBytes, randomInt } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";

// Générer un token de session
function generateSessionToken(): string {
  return randomBytes(48).toString("base64url");
}

/**
 * Valide un sessionToken admin et retourne le compte admin correspondant.
 * Lève une TRPCError UNAUTHORIZED si la session est invalide/expirée.
 */
export async function requireValidAdminSession(sessionToken: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

  const rows = await db
    .select()
    .from(adminAccounts)
    .where(eq(adminAccounts.sessionToken, sessionToken))
    .limit(1);

  if (rows.length === 0) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Session invalide" });
  }

  const admin = rows[0];
  if (!admin.sessionExpiresAt || new Date() > admin.sessionExpiresAt) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expirée" });
  }

  return admin;
}

/** Valide une session et réserve la gestion des comptes aux Super administrateurs. */
export async function requireSuperAdminSession(sessionToken: string) {
  const admin = await requireValidAdminSession(sessionToken);
  if (admin.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Droits Super administrateur requis." });
  }
  return admin;
}

/** Récupère et valide exclusivement le jeton contenu dans le cookie HttpOnly admin. */
export async function requireAdminSessionFromCookie(cookieHeader: string | undefined) {
  const sessionCookie = (cookieHeader ?? "")
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.slice(`${ADMIN_SESSION_COOKIE}=`.length);
  if (!sessionCookie) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session administrateur requise." });
  return requireValidAdminSession(decodeURIComponent(sessionCookie));
}

export const adminAuthRouter = router({
  /**
   * Connexion administrateur par email + mot de passe.
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const rows = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.email, input.email))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect." });
      }

      const admin = rows[0];

      if (admin.status !== "active") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ce compte administrateur est désactivé." });
      }

      if (!admin.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect." });
      }

      const valid = await bcrypt.compare(input.password, admin.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect." });
      }

      const sessionToken = generateSessionToken();
      const sessionExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12h

      await db
        .update(adminAccounts)
        .set({
          sessionToken,
          sessionExpiresAt,
          lastLoginAt: new Date(),
          lastActivityAt: new Date(),
        })
        .where(eq(adminAccounts.id, admin.id));

      ctx.res.cookie(ADMIN_SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 12 * 60 * 60 * 1000,
      });

      return {
        success: true,
        sessionToken,
        adminType: admin.adminType,
        role: admin.role,
        fullName: admin.fullName,
        email: admin.email,
        requiresPasswordChange: admin.requiresPasswordChange || false,  // Indique si le changement de mot de passe est obligatoire
      };
    }),

  /** Vérifie la session HttpOnly côté serveur pour protéger l’interface admin. */
  me: publicProcedure.query(async ({ ctx }) => {
    try {
      const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      return {
        authenticated: true,
        admin: { email: admin.email, fullName: admin.fullName, adminType: admin.adminType, role: admin.role },
      } as const;
    } catch {
      return { authenticated: false } as const;
    }
  }),

  /**
   * Changer son propre mot de passe (admin déjà connecté).
   */
  changePassword: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      if (!admin.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Mot de passe actuel incorrect." });
      }

      const valid = await bcrypt.compare(input.currentPassword, admin.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Mot de passe actuel incorrect." });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      const now = new Date();
      
      await db.update(adminAccounts).set({ 
        passwordHash,
        passwordChangedAt: now,
        requiresPasswordChange: false  // Marquer que le changement de mot de passe est complété
      }).where(eq(adminAccounts.id, admin.id));

      // Envoyer un email de notification
      try {
        const emailTemplate = getPasswordChangedEmailTemplate({
          adminName: admin.fullName || admin.email,
          adminEmail: admin.email,
          adminType: admin.adminType,
          timestamp: now,
        });

        await sendEmail({
          to: admin.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });

        console.log(`[Admin Auth] Password change notification sent to ${admin.email}`);
      } catch (emailError) {
        console.error(`[Admin Auth] Failed to send password change notification to ${admin.email}:`, emailError);
        // Ne pas échouer la mutation si l'email n'est pas envoyé
      }

      return { success: true, message: "Mot de passe mis à jour. Un email de confirmation a été envoyé." };
    }),

  /**
   * Déconnexion.
   */
  logout: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(adminAccounts)
          .set({ sessionToken: null, sessionExpiresAt: null })
          .where(eq(adminAccounts.sessionToken, input.sessionToken));

        ctx.res.clearCookie(ADMIN_SESSION_COOKIE, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
        });

        return { success: true, message: "Déconnexion réussie" };
      } catch (err) {
        console.error("[Admin Auth] Logout error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la déconnexion" });
      }
    }),

  /**
   * Lister tous les comptes administrateurs (réservé aux admins connectés)
   */
  listAdmins: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
    }))
    .query(async ({ input }) => {
      await requireSuperAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const admins = await db
        .select({
          id: adminAccounts.id,
          email: adminAccounts.email,
          fullName: adminAccounts.fullName,
          phone: adminAccounts.phone,
          adminType: adminAccounts.adminType,
          status: adminAccounts.status,
          createdAt: adminAccounts.createdAt,
          lastLoginAt: adminAccounts.lastLoginAt,
        })
        .from(adminAccounts);

      return { success: true, admins };
    }),

  /**
   * Inviter (créer) un nouveau compte administrateur avec un mot de passe
   * généré automatiquement, envoyé par email.
   */
  inviteAdmin: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      email: z.string().email(),
      fullName: z.string().min(2),
      phone: z.string().optional(),
      adminType: z.enum(["evaluation", "accompagnement", "procedures"]),
    }))
    .mutation(async ({ input }) => {
      const inviter = await requireSuperAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const existing = await db
        .select({ id: adminAccounts.id })
        .from(adminAccounts)
        .where(eq(adminAccounts.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Un compte admin existe déjà avec cet email." });
      }

      // Génère un mot de passe temporaire sécurisé (12 caractères, alphanumérique + symbole).
      const tempPassword = generateSecurePassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      await db.insert(adminAccounts).values({
        email: input.email,
        fullName: input.fullName,
        phone: input.phone,
        adminType: input.adminType,
        passwordHash,
        status: "active",
      });

      try {
        const loginUrl = `${process.env.APP_URL ?? "https://3mtravelagency.click"}/admin/login`;
        const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Accès Administrateur — 3M Travel</h2>
          <p>Bonjour ${input.fullName},</p>
          <p>${inviter.fullName} vous a donné accès à l'espace administrateur de 3M Travel & Services, avec le rôle <strong>${input.adminType}</strong>.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Email :</strong> ${input.email}</p>
            <p style="margin: 4px 0;"><strong>Mot de passe temporaire :</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;">${tempPassword}</code></p>
          </div>
          <p>Merci de changer ce mot de passe dès votre première connexion.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${loginUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Se connecter</a>
          </div>
          <p style="color: #666;">Si vous ne vous attendiez pas à cet accès, contactez l'équipe 3M Travel.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">3M Travel & Services - Pré-évaluation Visa & Immigration</p>
        </div>`;

        await sendEmail({ to: input.email, subject: "🔐 Votre accès administrateur - 3M Travel", html: htmlContent });
      } catch (emailErr) {
        console.error("[Admin Auth] Invite email send failed:", emailErr);
        return {
          success: true,
          emailSent: false,
          tempPassword,
          message: "Compte créé, mais l'email n'a pas pu être envoyé. Communiquez le mot de passe manuellement.",
        };
      }

      return { success: true, emailSent: true, message: "Invitation envoyée avec succès." };
    }),

  /**
   * Réinitialiser le mot de passe d'un administrateur existant et le renvoyer par email.
   */
  resendInvite: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      email: z.string().email(),
      customSubject: z.string().optional(),
      customBody: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await requireSuperAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const rows = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.email, input.email))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aucun compte admin avec cet email." });
      }

      const admin = rows[0];
      const newPassword = generateSecurePassword();
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await db.update(adminAccounts).set({ passwordHash }).where(eq(adminAccounts.id, admin.id));

      try {
        const loginUrl = `${process.env.APP_URL ?? "https://3mtravelagency.click"}/admin/login`;
        const subject = input.customSubject || "🔐 Nouveau mot de passe — Accès administrateur 3M Travel";
        const bodyText = input.customBody
          ? input.customBody.replace(/\{inviteLink\}/g, loginUrl)
          : `Voici votre nouveau mot de passe temporaire pour accéder à l'espace administrateur.`;
        const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Nouveau mot de passe — 3M Travel</h2>
          <p>Bonjour ${admin.fullName},</p>
          <p style="white-space: pre-line;">${bodyText}</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Email :</strong> ${admin.email}</p>
            <p style="margin: 4px 0;"><strong>Nouveau mot de passe :</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;">${newPassword}</code></p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${loginUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Se connecter</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">3M Travel & Services - Pré-évaluation Visa & Immigration</p>
        </div>`;

        await sendEmail({ to: input.email, subject, html: htmlContent });
      } catch (emailErr) {
        console.error("[Admin Auth] Resend invite email failed:", emailErr);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Échec de l'envoi de l'email." });
      }

      return { success: true, message: "Nouveau mot de passe envoyé par email." };
    }),
});

/**
 * Génère un mot de passe temporaire lisible mais sécurisé
 * (12 caractères : lettres majuscules/minuscules, chiffres, 1 symbole).
 */
function generateSecurePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%*?";
  const all = upper + lower + digits;

  let pwd = "";
  pwd += upper[randomInt(upper.length)];
  pwd += lower[randomInt(lower.length)];
  pwd += digits[randomInt(digits.length)];
  pwd += symbols[randomInt(symbols.length)];
  for (let i = 0; i < 8; i++) {
    pwd += all[randomInt(all.length)];
  }
  const chars = pwd.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
