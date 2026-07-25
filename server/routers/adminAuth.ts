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

export const adminAuthRouter = router({
  /**
   * Demander un code OTP par email
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
});
