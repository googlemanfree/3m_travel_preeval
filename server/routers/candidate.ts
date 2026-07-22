/**
 * Routeur tRPC — Espace Candidat
 * Gère l'inscription, la connexion, le profil, le dossier, les documents et la messagerie.
 */
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { and, desc, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
  CandidateFile,
  CandidateMessage,
  candidateFiles,
  candidateMessages,
  candidates,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { sendMagicLinkEmail, sendPasswordResetEmail, sendWelcomeEmail } from "../emailService";

// ─── JWT helpers ─────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? "fallback-secret-change-me";
const JWT_EXPIRES = "30d";

function signCandidateToken(candidateId: number): string {
  return jwt.sign({ sub: candidateId, type: "candidate" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });
}

function verifyCandidateToken(token: string): number {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number; type: string };
    if (payload.type !== "candidate") throw new Error("wrong token type");
    return payload.sub;
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expirée, veuillez vous reconnecter." });
  }
}

// ─── Middleware : extraire le candidat depuis le header Authorization ─────────
async function getCandidateFromHeader(authHeader: string | undefined) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Non authentifié." });
  }
  const token = authHeader.slice(7);
  const candidateId = verifyCandidateToken(token);
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  const rows = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Compte introuvable." });
  return rows[0];
}

// ─── Procédure protégée pour les candidats ───────────────────────────────────
// On crée une procédure custom qui lit le header Authorization candidat
const candidateProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const authHeader = (ctx.req as any)?.headers?.authorization as string | undefined;
  const candidate = await getCandidateFromHeader(authHeader);
  return next({ ctx: { ...ctx, candidate } });
});

// ─── DOSSIER STATUS LABELS ────────────────────────────────────────────────────
export const DOSSIER_STEPS = [
  { key: "nouveau",     label: "Nouveau dossier",       desc: "Votre compte vient d'être créé." },
  { key: "evaluation",  label: "Évaluation en cours",   desc: "Nos experts analysent votre profil." },
  { key: "documents",   label: "Documents requis",      desc: "Veuillez uploader vos pièces justificatives." },
  { key: "traitement",  label: "Traitement du dossier", desc: "Votre dossier est en cours de traitement." },
  { key: "soumis",      label: "Dossier soumis",        desc: "Votre dossier a été soumis aux autorités." },
  { key: "approuve",    label: "Visa approuvé",         desc: "Félicitations ! Votre visa a été approuvé." },
  { key: "refuse",      label: "Dossier refusé",        desc: "Votre dossier a été refusé. Contactez-nous." },
] as const;

// ─── ROUTER ──────────────────────────────────────────────────────────────────
export const candidateRouter = router({
  // ── Inscription ────────────────────────────────────────────────────────────
  register: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(2, "Nom requis"),
        email: z.string().email("Email invalide"),
        password: z.string().min(8, "Mot de passe : 8 caractères minimum"),
        phone: z.string().optional(),
        destination: z.enum(["canada", "luxembourg", "pologne", "europe", "golfe", "autre"]).optional(),
        nationality: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      // Vérifier si l'email existe déjà
      const existing = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Un compte existe déjà avec cet email." });
      }

            const passwordHash = await bcrypt.hash(input.password, 12);
      // Générer un magic link token (valable 24h)
      const magicToken = crypto.randomUUID().replace(/-/g, "");
      const magicExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
      const result = await db.insert(candidates).values({
        fullName: input.fullName,
        email: input.email,
        passwordHash,
        phone: input.phone ?? null,
        destination: input.destination ?? "autre",
        nationality: input.nationality ?? null,
        dossierStatus: "nouveau",
        emailVerified: false,
        magicLinkToken: magicToken,
        magicLinkExpiresAt: magicExpiresAt,
      });
      const candidateId = (result as any).insertId as number;
      // Envoyer l'email avec le magic link
      try {
        await sendMagicLinkEmail(input.email, input.fullName, magicToken, "verify");
      } catch (err) {
        console.error("[Register] Magic link email error:", err);
      }
      return { candidateId, requiresEmailVerification: true, message: "Compte créé. Un lien de connexion a été envoyé à votre email." };
    }),

  // ── Connexion ──────────────────────────────────────────────────────────────
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const rows = await db.select().from(candidates).where(eq(candidates.email, input.email)).limit(1);
      if (!rows.length) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect." });
      }

      const candidate = rows[0];
      const valid = await bcrypt.compare(input.password, candidate.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect." });
      }

      // Mettre à jour lastLoginAt
      await db.update(candidates).set({ lastLoginAt: new Date() }).where(eq(candidates.id, candidate.id));

      const token = signCandidateToken(candidate.id);
      return {
        token,
        candidate: {
          id: candidate.id,
          fullName: candidate.fullName,
          email: candidate.email,
          destination: candidate.destination,
          dossierStatus: candidate.dossierStatus,
        },
      };
    }),

  // ── Profil candidat (lecture) ──────────────────────────────────────────────
  getProfile: candidateProcedure.query(async ({ ctx }) => {
    const c = ctx.candidate;
    return {
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      nationality: c.nationality,
      dateOfBirth: c.dateOfBirth,
      destination: c.destination,
      visaType: c.visaType,
      dossierStatus: c.dossierStatus,
      dossierNote: c.dossierNote,
      formulaChosen: c.formulaChosen,
      scoreResult: c.scoreResult,
      educationLevel: c.educationLevel,
      employmentStatus: c.employmentStatus,
      languageLevel: c.languageLevel,
      createdAt: c.createdAt,
      lastLoginAt: c.lastLoginAt,
    };
  }),

  // ── Mise à jour du profil ──────────────────────────────────────────────────
  updateProfile: candidateProcedure
    .input(
      z.object({
        fullName: z.string().min(2).optional(),
        phone: z.string().optional(),
        nationality: z.string().optional(),
        dateOfBirth: z.string().optional(),
        destination: z.enum(["canada", "luxembourg", "pologne", "europe", "golfe", "autre"]).optional(),
        visaType: z.string().optional(),
        educationLevel: z.string().optional(),
        employmentStatus: z.string().optional(),
        languageLevel: z.string().optional(),
        formulaChosen: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: Record<string, unknown> = {};
      Object.entries(input).forEach(([k, v]) => { if (v !== undefined) updateData[k] = v; });

      await db.update(candidates).set(updateData).where(eq(candidates.id, ctx.candidate.id));
      return { success: true };
    }),

  // ── Liste des documents uploadés ──────────────────────────────────────────
  listDocuments: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const files = await db
      .select()
      .from(candidateFiles)
      .where(eq(candidateFiles.candidateId, ctx.candidate.id))
      .orderBy(desc(candidateFiles.uploadedAt));

    return files as CandidateFile[];
  }),

  // ── Enregistrer un document après upload S3 ───────────────────────────────
  saveDocument: candidateProcedure
    .input(
      z.object({
        fileType: z.enum([
          "cv", "passeport", "diplome", "releve_notes", "photo",
          "justificatif_domicile", "extrait_naissance", "casier_judiciaire", "autre",
        ]),
        fileName: z.string(),
        fileUrl: z.string().url(),
        fileKey: z.string(),
        fileSizeBytes: z.number().optional(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(candidateFiles).values({
        candidateId: ctx.candidate.id,
        fileType: input.fileType,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        fileSizeBytes: input.fileSizeBytes ?? null,
        mimeType: input.mimeType ?? null,
        status: "uploaded",
      });

      // Si le dossier est encore "nouveau", passer à "documents"
      if (ctx.candidate.dossierStatus === "nouveau") {
        await db.update(candidates)
          .set({ dossierStatus: "evaluation" })
          .where(eq(candidates.id, ctx.candidate.id));
      }

      return { success: true };
    }),

  // ── Supprimer un document ─────────────────────────────────────────────────
  deleteDocument: candidateProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(candidateFiles)
        .where(and(eq(candidateFiles.id, input.fileId), eq(candidateFiles.candidateId, ctx.candidate.id)));

      return { success: true };
    }),

  // ── Messagerie : lire les messages ────────────────────────────────────────
  getMessages: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const msgs = await db
      .select()
      .from(candidateMessages)
      .where(eq(candidateMessages.candidateId, ctx.candidate.id))
      .orderBy(candidateMessages.createdAt);

    // Marquer les messages du conseiller comme lus
    await db
      .update(candidateMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(candidateMessages.candidateId, ctx.candidate.id),
          eq(candidateMessages.senderRole, "advisor")
        )
      );

    return msgs as CandidateMessage[];
  }),

  // ── Messagerie : envoyer un message ───────────────────────────────────────
  sendMessage: candidateProcedure
    .input(z.object({ content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(candidateMessages).values({
        candidateId: ctx.candidate.id,
        senderRole: "candidate",
        content: input.content,
        isRead: false,
      });

      return { success: true };
    }),

  // ── Nombre de messages non lus ────────────────────────────────────────────
  unreadCount: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { count: 0 };

    const msgs = await db
      .select({ id: candidateMessages.id })
      .from(candidateMessages)
      .where(
        and(
          eq(candidateMessages.candidateId, ctx.candidate.id),
          eq(candidateMessages.senderRole, "advisor"),
          eq(candidateMessages.isRead, false)
        )
      );

    return { count: msgs.length };
  }),


  // ── Vérification email par OTP ────────────────────────────────────────────
  verifyEmail: publicProcedure
    .input(z.object({ candidateId: z.number(), otp: z.string().length(6) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Compte introuvable." });
      const candidate = rows[0];
      if (candidate.emailVerified) {
        const token = signCandidateToken(input.candidateId);
        return { success: true, token, message: "Email déjà vérifié." };
      }
      if (!candidate.emailOtp || candidate.emailOtp !== input.otp) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Code incorrect. Vérifiez votre email et réessayez." });
      }
      if (!candidate.emailOtpExpiresAt || new Date() > candidate.emailOtpExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ce code a expiré. Demandez un nouveau code." });
      }
      await db.update(candidates).set({ emailVerified: true, emailOtp: null, emailOtpExpiresAt: null }).where(eq(candidates.id, input.candidateId));
      await db.insert(candidateMessages).values({
        candidateId: input.candidateId,
        senderRole: "advisor",
        content: `Bienvenue ${candidate.fullName} ! 🎉 Votre compte 3M Travel & Services est activé. Notre équipe vous contactera sous 24h.`,
        isRead: false,
      });
      try { await sendWelcomeEmail(candidate.email, candidate.fullName, candidate.destination ?? "autre"); } catch {}
      const token = signCandidateToken(input.candidateId);
      return { success: true, token, message: "Email vérifié avec succès. Bienvenue !" };
    }),

  resendOtp: publicProcedure
    .input(z.object({ candidateId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Compte introuvable." });
      const candidate = rows[0];
      if (candidate.emailVerified) return { success: true };
      // Régénérer un magic link
      const magicToken = crypto.randomUUID().replace(/-/g, "");
      const magicExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.update(candidates).set({ magicLinkToken: magicToken, magicLinkExpiresAt: magicExpiresAt }).where(eq(candidates.id, input.candidateId));
      try { await sendMagicLinkEmail(candidate.email, candidate.fullName, magicToken, "verify"); } catch {}
      return { success: true, message: "Un nouveau lien d'activation a été envoyé à votre adresse email." };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(candidates).where(eq(candidates.email, input.email)).limit(1);
      if (!rows.length) return { success: true, message: "Si cet email existe, un lien a été envoyé." };
      const candidate = rows[0];
      const resetToken = crypto.randomUUID().replace(/-/g, "");
      const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.update(candidates).set({ passwordResetToken: resetToken, passwordResetExpiresAt: resetExpiresAt }).where(eq(candidates.id, candidate.id));
      try { await sendPasswordResetEmail(candidate.email, candidate.fullName, resetToken); } catch {}
      return { success: true, message: "Si cet email existe, un lien a été envoyé." };
    }),

  resetPassword: publicProcedure
    .input(z.object({ token: z.string().min(10), newPassword: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(candidates).where(eq(candidates.passwordResetToken, input.token)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Lien invalide ou expiré." });
      const candidate = rows[0];
      if (!candidate.passwordResetExpiresAt || new Date() > candidate.passwordResetExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ce lien a expiré. Veuillez faire une nouvelle demande." });
      }
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.update(candidates).set({ passwordHash, passwordResetToken: null, passwordResetExpiresAt: null }).where(eq(candidates.id, candidate.id));
      return { success: true, message: "Mot de passe réinitialisé avec succès." };
    }),

  verifyMagicLink: publicProcedure
    .input(z.object({ token: z.string().min(10) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(candidates).where(eq(candidates.magicLinkToken, input.token)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Lien invalide ou déjà utilisé." });
      const candidate = rows[0];
      if (!candidate.magicLinkExpiresAt || new Date() > candidate.magicLinkExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ce lien a expiré. Veuillez vous inscrire à nouveau." });
      }
      await db.update(candidates).set({ emailVerified: true, magicLinkToken: null, magicLinkExpiresAt: null }).where(eq(candidates.id, candidate.id));
      if (!candidate.emailVerified) {
        try { await sendWelcomeEmail(candidate.email, candidate.fullName, candidate.destination ?? "autre"); } catch {}
      }
      const token = signCandidateToken(candidate.id);
      return { success: true, token, candidateId: candidate.id, fullName: candidate.fullName };
    }),

  // ── Étapes du dossier (statique) ──────────────────────────────────────────
  getDossierSteps: publicProcedure.query(() => {
    return DOSSIER_STEPS;
  }),
});
