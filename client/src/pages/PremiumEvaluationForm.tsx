/**
 * Routeur tRPC — Authentification Admin OTP
 * Système d'authentification séparé pour les administrateurs
 */

import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { adminAccounts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../emailService";

// Générer un code OTP aléatoire à 6 chiffres
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Générer un token de session
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Récupérer la liste des emails admin autorisés
 */
export async function getAuthorizedAdminEmails() {
  const db = await getDb();
  if (!db) return [];

  try {
    const admins = await db
      .select({ email: adminAccounts.email, fullName: adminAccounts.fullName, adminType: adminAccounts.adminType })
      .from(adminAccounts)
      .where(eq(adminAccounts.status, "active"));
    return admins;
  } catch (err) {
    console.error("[Admin Auth] Error fetching authorized emails:", err);
    return [];
  }
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

export const adminAuthRouter = router({
  /**
   * Récupérer la liste des emails admin autorisés
   */
  getAuthorizedEmails: publicProcedure
    .query(async () => {
      return await getAuthorizedAdminEmails();
    }),

  /**
   * Démander un code OTP par email
   */
  requestOTP: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Vérifier que l'email existe dans les comptes admin
        const admin = await db
          .select()
          .from(adminAccounts)
          .where(eq(adminAccounts.email, input.email))
          .limit(1);

        if (admin.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cet email n'est pas enregistré comme compte administrateur",
          });
        }

        if (admin[0].status !== "active") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Ce compte administrateur est inactif",
          });
        }

        // Générer un code OTP
        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expire dans 10 minutes

        // Sauvegarder le code OTP
        await db
          .update(adminAccounts)
          .set({
            otpCode,
            otpExpiresAt,
            otpAttempts: 0,
          })
          .where(eq(adminAccounts.email, input.email));

        // Envoyer l'email avec le code OTP
        try {
          const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Connexion Admin 3M Travel</h2>
            <p>Bonjour ${admin[0].fullName},</p>
            <p>Voici votre code de connexion sécurisé :</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #1e40af; letter-spacing: 5px; margin: 0;">${otpCode}</h1>
            </div>
            <p style="color: #666;">Ce code expire dans <strong>10 minutes</strong>.</p>
            <p style="color: #666;">Si vous n'avez pas demandé cette connexion, ignorez cet email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">3M Travel & Services - Pré-évaluation Visa & Immigration</p>
          </div>`;

          await sendEmail(
            input.email,
            "🔐 Votre code OTP - 3M Travel Admin",
            htmlContent
          );
        } catch (emailErr) {
          console.error("[Admin Auth] Email send failed:", emailErr);
          // Continue même si l'email échoue (pour le développement)
        }

        return {
          success: true,
          message: "Code OTP envoyé à votre email",
          adminType: admin[0].adminType,
        };
      } catch (err) {
        console.error("[Admin Auth] Request OTP error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la demande du code OTP",
        });
      }
    }),

  /**
   * Vérifier le code OTP et créer une session
   */
  verifyOTP: publicProcedure
    .input(z.object({
      email: z.string().email(),
      otpCode: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const admin = await db
          .select()
          .from(adminAccounts)
          .where(eq(adminAccounts.email, input.email))
          .limit(1);

        if (admin.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Compte administrateur non trouvé",
          });
        }

        // Vérifier que le code OTP n'a pas expiré
        if (!admin[0].otpExpiresAt || new Date() > admin[0].otpExpiresAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Code OTP expiré. Demandez un nouveau code.",
          });
        }

        // Vérifier le code OTP
        if (admin[0].otpCode !== input.otpCode) {
          // Incrémenter le compteur de tentatives
          const newAttempts = (admin[0].otpAttempts || 0) + 1;

          if (newAttempts >= 5) {
            // Bloquer le compte après 5 tentatives échouées
            await db
              .update(adminAccounts)
              .set({ status: "suspended" })
              .where(eq(adminAccounts.email, input.email));

            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Trop de tentatives échouées. Compte temporairement suspendu.",
            });
          }

          await db
            .update(adminAccounts)
            .set({ otpAttempts: newAttempts })
            .where(eq(adminAccounts.email, input.email));

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Code OTP incorrect. ${5 - newAttempts} tentatives restantes.`,
          });
        }

        // Générer un token de session
        const sessionToken = generateSessionToken();
        const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
        const now = new Date();

        // Mettre à jour le compte avec la session
        await db
          .update(adminAccounts)
          .set({
            sessionToken,
            sessionExpiresAt,
            otpCode: null,
            otpExpiresAt: null,
            otpAttempts: 0,
            lastLoginAt: now,
            lastActivityAt: now,
          })
          .where(eq(adminAccounts.email, input.email));

        return {
          success: true,
          sessionToken,
          adminType: admin[0].adminType,
          fullName: admin[0].fullName,
          email: admin[0].email,
          message: "Connexion réussie",
        };
      } catch (err) {
        console.error("[Admin Auth] Verify OTP error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la vérification du code OTP",
        });
      }
    }),

  /**
   * Vérifier la session admin actuelle
   */
  verifySession: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const admin = await db
          .select()
          .from(adminAccounts)
          .where(eq(adminAccounts.sessionToken, input.sessionToken))
          .limit(1);

        if (admin.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Session invalide",
          });
        }

        // Vérifier que la session n'a pas expiré
        if (!admin[0].sessionExpiresAt || new Date() > admin[0].sessionExpiresAt) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Session expirée",
          });
        }

        // Vérifier l'inactivité (12 heures)
        const lastActivity = admin[0].lastActivityAt ? new Date(admin[0].lastActivityAt) : new Date();
        const now = new Date();
        const inactivityMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
        const INACTIVITY_THRESHOLD_MINUTES = 12 * 60; // 12 heures

        if (inactivityMinutes > INACTIVITY_THRESHOLD_MINUTES) {
          // Invalider la session après 12h d'inactivité
          await db
            .update(adminAccounts)
            .set({
              sessionToken: null,
              sessionExpiresAt: null,
            })
            .where(eq(adminAccounts.email, admin[0].email));

          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Session expirée après 12 heures d'inactivité. Veuillez vous reconnecter.",
          });
        }

        // Mettre à jour l'heure de la dernière activité
        await db
          .update(adminAccounts)
          .set({ lastActivityAt: now })
          .where(eq(adminAccounts.email, admin[0].email));

        return {
          success: true,
          admin: {
            id: admin[0].id,
            email: admin[0].email,
            adminType: admin[0].adminType,
            fullName: admin[0].fullName,
          },
        };
      } catch (err) {
        console.error("[Admin Auth] Verify session error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la vérification de la session",
        });
      }
    }),

  /**
   * Déconnexion admin
   */
  logout: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(adminAccounts)
          .set({
            sessionToken: null,
            sessionExpiresAt: null,
          })
          .where(eq(adminAccounts.sessionToken, input.sessionToken));

        return {
          success: true,
          message: "Déconnexion réussie",
        };
      } catch (err) {
        console.error("[Admin Auth] Logout error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la déconnexion",
        });
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
      await requireValidAdminSession(input.sessionToken);

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
   * Inviter (créer) un nouveau compte administrateur et l'informer par email.
   * L'authentification admin se fait ensuite normalement par OTP — pas de mot
   * de passe ni de lien d'activation à part : dès que le compte existe, il
   * peut se connecter sur /admin/login avec son email.
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
      const inviter = await requireValidAdminSession(input.sessionToken);

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

      await db.insert(adminAccounts).values({
        email: input.email,
        fullName: input.fullName,
        phone: input.phone,
        adminType: input.adminType,
        status: "active",
      });

      try {
        const loginUrl = `${process.env.APP_URL ?? "https://3mtravelagency.click"}/admin/login`;
        const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Accès Administrateur — 3M Travel</h2>
          <p>Bonjour ${input.fullName},</p>
          <p>${inviter.fullName} vous a donné accès à l'espace administrateur de 3M Travel & Services, avec le rôle <strong>${input.adminType}</strong>.</p>
          <p>Pour vous connecter, rendez-vous sur la page ci-dessous et entrez votre email : un code de connexion à usage unique vous sera envoyé automatiquement, aucun mot de passe n'est nécessaire.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${loginUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Se connecter</a>
          </div>
          <p style="color: #666;">Si vous ne vous attendiez pas à cet accès, contactez l'équipe 3M Travel.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">3M Travel & Services - Pré-évaluation Visa & Immigration</p>
        </div>`;

        await sendEmail(input.email, "🔐 Votre accès administrateur - 3M Travel", htmlContent);
      } catch (emailErr) {
        console.error("[Admin Auth] Invite email send failed:", emailErr);
        // Le compte est créé même si l'email échoue — on le signale à l'appelant.
        return {
          success: true,
          emailSent: false,
          message: "Compte créé, mais l'email n'a pas pu être envoyé. Communiquez l'accès manuellement.",
        };
      }

      return { success: true, emailSent: true, message: "Invitation envoyée avec succès." };
    }),

  /**
   * Renvoyer l'email d'information d'accès à un administrateur existant.
   */
  resendInvite: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      email: z.string().email(),
      customSubject: z.string().optional(),
      customBody: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);

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

      try {
        const loginUrl = `${process.env.APP_URL ?? "https://3mtravelagency.click"}/admin/login`;
        const subject = input.customSubject || "🔐 Rappel — Accès administrateur 3M Travel";
        const bodyText = input.customBody
          ? input.customBody.replace(/\{inviteLink\}/g, loginUrl)
          : `Pour rappel, vous avez accès à l'espace administrateur de 3M Travel & Services.`;
        const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Rappel — Accès Administrateur 3M Travel</h2>
          <p>Bonjour ${admin.fullName},</p>
          <p style="white-space: pre-line;">${bodyText}</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${loginUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Se connecter</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">3M Travel & Services - Pré-évaluation Visa & Immigration</p>
        </div>`;

        await sendEmail(input.email, subject, htmlContent);
      } catch (emailErr) {
        console.error("[Admin Auth] Resend invite email failed:", emailErr);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Échec de l'envoi de l'email." });
      }

      return { success: true, message: "Email renvoyé avec succès." };
    }),
});
