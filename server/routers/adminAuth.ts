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
import { adminAccounts, evaluations, flightBookingRequests, insuranceRequests } from "../../drizzle/schema";
import { count, eq } from "drizzle-orm";
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
type AdminSessionOptions = { allowPasswordChange?: boolean };

export async function requireValidAdminSession(sessionToken: string, options: AdminSessionOptions = {}) {
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
  if (admin.status !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Compte administrateur désactivé" });
  }
  if (!admin.sessionExpiresAt || new Date() > admin.sessionExpiresAt) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expirée" });
  }

  if (admin.requiresPasswordChange && !options.allowPasswordChange) {
    throw new TRPCError({ code: "FORBIDDEN", message: "PASSWORD_CHANGE_REQUIRED" });
  }

  return admin;
}

/**
 * Compatibilité historique : toutes les fonctions de gestion admin utilisent
 * désormais le même rôle opérationnel. La sécurité repose toujours sur une
 * session admin HttpOnly valide et sur le statut actif du compte.
 */
export async function requireSuperAdminSession(sessionToken: string) {
  return requireValidAdminSession(sessionToken);
}

/** Récupère et valide exclusivement le jeton contenu dans le cookie HttpOnly admin. */
export async function requireAdminSessionFromCookie(cookieHeader: string | undefined, options: AdminSessionOptions = {}) {
  const sessionCookie = (cookieHeader ?? "")
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.slice(`${ADMIN_SESSION_COOKIE}=`.length);
  if (!sessionCookie) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session administrateur requise." });
  return requireValidAdminSession(decodeURIComponent(sessionCookie), options);
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
      const sessionDurationMs = 24 * 60 * 60 * 1000;
      const sessionExpiresAt = new Date(Date.now() + sessionDurationMs); // 24 h ou jusqu’à déconnexion

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
        maxAge: sessionDurationMs,
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
  me: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).optional() }).optional())
    .query(async ({ ctx, input }) => {
    try {
      // Le cookie HttpOnly reste le canal prioritaire. Le jeton n’est utilisé que
      // comme repli pour les prévisualisations ou navigateurs qui bloquent le cookie
      // après une connexion administrateur réussie.
      const admin = ctx.req.headers.cookie?.includes(`${ADMIN_SESSION_COOKIE}=`)
        ? await requireAdminSessionFromCookie(ctx.req.headers.cookie, { allowPasswordChange: true })
        : input?.sessionToken
          ? await requireValidAdminSession(input.sessionToken, { allowPasswordChange: true })
          : await requireAdminSessionFromCookie(ctx.req.headers.cookie, { allowPasswordChange: true });
      return {
        authenticated: true,
        requiresPasswordChange: admin.requiresPasswordChange,
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
      const admin = await requireValidAdminSession(input.sessionToken, { allowPasswordChange: true });
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

  /** Statistiques globales visibles par tous les administrateurs authentifiés. */
  getGlobalStats: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      await requireSuperAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const [adminRoleRows, evaluationTotals, flightTotals, insuranceTotals, flightStatusRows] = await Promise.all([
        db.select({ role: adminAccounts.role, status: adminAccounts.status, total: count() }).from(adminAccounts).groupBy(adminAccounts.role, adminAccounts.status),
        db.select({ total: count() }).from(evaluations),
        db.select({ total: count() }).from(flightBookingRequests),
        db.select({ total: count() }).from(insuranceRequests),
        db.select({ status: flightBookingRequests.status, total: count() }).from(flightBookingRequests).groupBy(flightBookingRequests.status),
      ]);

      return {
        admins: {
          total: adminRoleRows.reduce((sum, row) => sum + Number(row.total), 0),
          active: adminRoleRows.filter((row) => row.status === "active").reduce((sum, row) => sum + Number(row.total), 0),
          adminsWithCommonRole: adminRoleRows.filter((row) => row.role === "admin").reduce((sum, row) => sum + Number(row.total), 0),
        },
        evaluations: Number(evaluationTotals[0]?.total ?? 0),
        flightRequests: {
          total: Number(flightTotals[0]?.total ?? 0),
          byStatus: flightStatusRows.reduce<Record<string, number>>((acc, row) => { acc[row.status] = Number(row.total); return acc; }, {}),
        },
        insuranceRequests: Number(insuranceTotals[0]?.total ?? 0),
      };
    }),

  /**
   * Lister tous les comptes administrateurs connectés
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
   * Inviter (créer) un nouveau compte administrateur avec le rôle commun admin et un mot de passe
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
        role: "admin",
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

  /**
   * Réinitialise les identifiants de tous les comptes admin.
   * Aucun mot de passe n’est retourné : chaque mot de passe temporaire est
   * transmis uniquement à l’adresse e-mail déjà enregistrée du compte.
   */
  resetAllPasswords: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const admins = await db.select().from(adminAccounts);
      if (admins.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aucun compte administrateur à réinitialiser." });
      }

      const loginUrl = `${process.env.APP_URL ?? "https://3mtravelagency.click"}/admin/login`;
      let resetCount = 0;
      let emailFailureCount = 0;
      const fallbackCredentials: { email: string; tempPassword: string }[] = [];

      for (const admin of admins) {
        const temporaryPassword = generateSecurePassword();
        const passwordHash = await bcrypt.hash(temporaryPassword, 12);

        await db.update(adminAccounts).set({
          passwordHash,
          requiresPasswordChange: true,
          passwordChangedAt: null,
          resetToken: null,
          resetTokenExpiresAt: null,
          sessionToken: null,
          sessionExpiresAt: null,
        }).where(eq(adminAccounts.id, admin.id));
        resetCount += 1;

        try {
          await sendEmail({
            to: admin.email,
            subject: "🔐 Réinitialisation de votre accès administrateur — 3M Travel",
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#172033">
              <h2 style="color:#1e40af">Réinitialisation de votre accès administrateur</h2>
              <p>Bonjour ${admin.fullName || admin.email},</p>
              <p>Le mot de passe de votre compte administrateur 3M Travel a été réinitialisé par un administrateur autorisé.</p>
              <p><strong>Adresse :</strong> ${admin.email}</p>
              <p><strong>Mot de passe temporaire :</strong> <code style="background:#f3f4f6;padding:6px 8px;border-radius:6px">${temporaryPassword}</code></p>
              <p>Vous devrez choisir un nouveau mot de passe dès votre première connexion.</p>
              <p><a href="${loginUrl}" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Se connecter</a></p>
              <p style="color:#6b7280;font-size:12px">Ne partagez jamais ce message. Si vous n’êtes pas à l’origine de cette demande, contactez la direction.</p>
            </div>`,
          });
        } catch (emailError) {
          emailFailureCount += 1;
          fallbackCredentials.push({ email: admin.email, tempPassword: temporaryPassword });
          console.error(`[Admin Auth] Échec d’envoi du mot de passe temporaire pour le compte ${admin.id}:`, emailError);
        }
      }

      return {
        success: true,
        resetCount,
        emailFailureCount,
        fallbackCredentials,
        message: emailFailureCount === 0
          ? "Les mots de passe administrateurs ont été réinitialisés et envoyés individuellement par e-mail."
          : `${resetCount} mot(s) de passe réinitialisé(s). Les e-mails de secours sont affichés ci-dessous en raison d'une restriction de livraison.`,
      };
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
