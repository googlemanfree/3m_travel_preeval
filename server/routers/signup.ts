/**
 * Routeur tRPC — Inscription Simple
 * Système d'inscription indépendant et simplifié
 */
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { candidates } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { sendVerificationLink } from "../emailService";

const JWT_SECRET = process.env.JWT_SECRET ?? "fallback-secret-change-me";

export const signupRouter = router({
  // ── Inscription Simple ──────────────────────────────────────────────────────
  register: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(2, "Nom requis").max(100),
        email: z.string().email("Email invalide"),
        password: z.string().min(8, "Mot de passe : 8 caractères minimum").max(100),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Base de données indisponible.",
        });
      }

      const cleanEmail = input.email.toLowerCase().trim();
      const fullName = input.fullName.trim();

      // Vérifier si l'email existe déjà
      try {
        const existing = await db
          .select({ id: candidates.id })
          .from(candidates)
          .where(eq(candidates.email, cleanEmail))
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Un compte existe déjà avec cet email.",
          });
        }
      } catch (err: any) {
        if (err.code === "CONFLICT") throw err;
        console.error("[Signup] Email check error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la vérification de l'email.",
        });
      }

      // Hasher le mot de passe
      let passwordHash: string;
      try {
        passwordHash = await bcrypt.hash(input.password, 12);
      } catch (err) {
        console.error("[Signup] Password hash error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du chiffrement du mot de passe.",
        });
      }

      // Générer le token de vérification (24h)
      const verificationToken = jwt.sign(
        { email: cleanEmail, type: "email_verification" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Insérer le candidat avec une requête SQL brute simple
      try {
        await db.execute(
          sql`INSERT INTO candidates (
            fullName,
            email,
            passwordHash,
            emailVerified,
            verificationToken,
            verificationExpiresAt,
            createdAt,
            updatedAt
          ) VALUES (
            ${fullName},
            ${cleanEmail},
            ${passwordHash},
            false,
            ${verificationToken},
            ${expiresAt},
            ${now},
            ${now}
          )`
        );
      } catch (err: any) {
        console.error("[Signup] Insert error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création du compte.",
        });
      }

      // Envoyer l'email de vérification
      try {
        await sendVerificationLink(cleanEmail, fullName, verificationToken);
      } catch (err) {
        console.error("[Signup] Email send error:", err);
        // Ne pas bloquer l'inscription si l'email échoue
      }

      return {
        success: true,
        message: "Inscription réussie ! Un email de confirmation a été envoyé.",
        email: cleanEmail,
      };
    }),

  // ── Vérifier l'email ────────────────────────────────────────────────────────
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Base de données indisponible.",
        });
      }

      // Vérifier le token JWT
      let decoded: any;
      try {
        decoded = jwt.verify(input.token, JWT_SECRET) as any;
      } catch (err) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Lien de vérification expiré ou invalide.",
        });
      }

      if (decoded.type !== "email_verification") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Token invalide.",
        });
      }

      const email = decoded.email;

      // Trouver le candidat
      try {
        const candidate = await db
          .select({ id: candidates.id, emailVerified: candidates.emailVerified })
          .from(candidates)
          .where(eq(candidates.email, email))
          .limit(1);

        if (!candidate.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Compte introuvable.",
          });
        }

        if (candidate[0].emailVerified) {
          return {
            success: true,
            message: "Email déjà vérifié.",
            alreadyVerified: true,
          };
        }

        // Marquer l'email comme vérifié
        await db
          .update(candidates)
          .set({
            emailVerified: true,
            verificationToken: null,
            verificationExpiresAt: null,
          })
          .where(eq(candidates.email, email));

        return {
          success: true,
          message: "Email vérifié avec succès ! Vous pouvez maintenant vous connecter.",
          alreadyVerified: false,
        };
      } catch (err: any) {
        if (err.code) throw err;
        console.error("[Signup] Email verification error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la vérification de l'email.",
        });
      }
    }),

  // ── Renvoyer l'email de vérification ────────────────────────────────────────
  resendVerificationEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Base de données indisponible.",
        });
      }

      const cleanEmail = input.email.toLowerCase().trim();

      // Trouver le candidat
      try {
        const candidate = await db
          .select({
            id: candidates.id,
            fullName: candidates.fullName,
            emailVerified: candidates.emailVerified,
          })
          .from(candidates)
          .where(eq(candidates.email, cleanEmail))
          .limit(1);

        if (!candidate.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Compte introuvable.",
          });
        }

        if (candidate[0].emailVerified) {
          return {
            success: true,
            message: "Cet email est déjà vérifié.",
          };
        }

        // Générer un nouveau token
        const verificationToken = jwt.sign(
          { email: cleanEmail, type: "email_verification" },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        // Mettre à jour le token
        await db
          .update(candidates)
          .set({
            verificationToken,
            verificationExpiresAt: new Date(expiresAt),
          })
          .where(eq(candidates.email, cleanEmail));

        // Envoyer l'email
        try {
          await sendVerificationLink(cleanEmail, candidate[0].fullName, verificationToken);
        } catch (err) {
          console.error("[Signup] Email resend error:", err);
        }

        return {
          success: true,
          message: "Email de vérification renvoyé.",
        };
      } catch (err: any) {
        if (err.code) throw err;
        console.error("[Signup] Resend email error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du renvoi de l'email.",
        });
      }
    }),
});
