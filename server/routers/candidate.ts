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
  dossierSteps,
  dossierPayments,
  dossierDeliveredDocs,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { sendVerificationLink, sendPasswordResetEmail, sendWelcomeEmail } from "../emailService";

// Admin middleware inline — accès via header x-admin-token ou rôle admin Manus
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const adminToken = (ctx as any).req?.headers?.["x-admin-token"];
  const isAdminToken = adminToken === (process.env.ADMIN_SECRET ?? "3m-admin-2026");
  const isManusAdmin = (ctx as any).user?.role === "admin";
  if (!isAdminToken && !isManusAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès administrateur requis." });
  }
  return next({ ctx });
});

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

      // Générer un OTP à 6 chiffres
      // Générer un token de confirmation (UUID sans tirets)
      const confirmToken = crypto.randomUUID().replace(/-/g, "");
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

      const result = await db.insert(candidates).values({
        fullName: input.fullName,
        email: input.email,
        passwordHash,
        phone: input.phone ?? null,
        destination: input.destination ?? "autre",
        nationality: input.nationality ?? null,
        dossierStatus: "nouveau",
        emailVerified: false,
        verificationToken: confirmToken,
        emailOtpExpiresAt: tokenExpiresAt,
      });

      const candidateId = (result as any).insertId as number;

      // Envoyer l'email avec le lien de confirmation
      try {
        await sendVerificationLink(input.email, input.fullName, confirmToken);
      } catch (err) {
        console.error("[Register] Email confirmation send error:", err);
      }

      return { candidateId, requiresEmailVerification: true, message: "Compte créé. Vérifiez votre boîte email pour activer votre compte." };
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

      // Vérifier que l'email est validé
      if (!candidate.emailVerified) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `Veuillez valider votre adresse e-mail avant de vous connecter. Vérifiez votre boîte mail (code OTP envoyé à l'inscription).`,
        });
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
          emailVerified: candidate.emailVerified,
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


  // ── Vérification email par lien de confirmation ──────────────────────────
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().min(10) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(candidates).where(eq(candidates.verificationToken, input.token)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Lien de confirmation invalide ou déjà utilisé." });
      const candidate = rows[0];
      if (candidate.emailVerified) {
        const token = signCandidateToken(candidate.id);
        return { success: true, token, candidateId: candidate.id, message: "Email déjà vérifié. Vous pouvez vous connecter." };
      }
      if (candidate.emailOtpExpiresAt && new Date() > candidate.emailOtpExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ce lien a expiré (24h). Veuillez vous réinscrire ou demander un nouveau lien." });
      }
      await db.update(candidates).set({ emailVerified: true, verificationToken: null, emailOtpExpiresAt: null }).where(eq(candidates.id, candidate.id));
      await db.insert(candidateMessages).values({
        candidateId: candidate.id,
        senderRole: "advisor",
        content: `Bienvenue ${candidate.fullName} ! 🎉 Votre compte 3M Travel & Services est activé. Notre équipe vous contactera sous 24h pour la suite de votre dossier.`,
        isRead: false,
      });
      try { await sendWelcomeEmail(candidate.email, candidate.fullName, candidate.destination ?? "autre"); } catch {}
      const jwtToken = signCandidateToken(candidate.id);
      return { success: true, token: jwtToken, candidateId: candidate.id, message: "Compte activé avec succès ! Bienvenue dans votre espace candidat." };
    }),

  // ── Renvoyer le lien de confirmation ──────────────────────────────────────
  resendConfirmationLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(candidates).where(eq(candidates.email, input.email)).limit(1);
      if (!rows.length) return { success: true, message: "Si cet email existe, un nouveau lien a été envoyé." };
      const candidate = rows[0];
      if (candidate.emailVerified) return { success: true, message: "Votre compte est déjà activé. Connectez-vous." };
      const confirmToken = crypto.randomUUID().replace(/-/g, "");
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.update(candidates).set({ verificationToken: confirmToken, emailOtpExpiresAt: tokenExpiresAt }).where(eq(candidates.id, candidate.id));
      try { await sendVerificationLink(candidate.email, candidate.fullName, confirmToken); } catch {}
      return { success: true, message: "Un nouveau lien de confirmation a été envoyé à votre adresse email." };
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

  // ── Résumé complet du dossier (étapes + paiements + docs remis) ──────────────
  getDossierSummary: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = ctx.candidate;

    const [steps, payments, deliveredDocs] = await Promise.all([
      db.select().from(dossierSteps).where(eq(dossierSteps.candidateId, c.id)).orderBy(dossierSteps.sortOrder),
      db.select().from(dossierPayments).where(eq(dossierPayments.candidateId, c.id)).orderBy(desc(dossierPayments.createdAt)),
      db.select().from(dossierDeliveredDocs).where(eq(dossierDeliveredDocs.candidateId, c.id)).orderBy(desc(dossierDeliveredDocs.deliveredAt)),
    ]);

    const totalPaid = payments
      .filter((p: any) => p.status === "confirmed")
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const formulaPrices: Record<string, number> = {
      integral: 500000, echelonne: 500000, garanti: 750000,
    };
    const totalAmount = formulaPrices[c.formulaChosen ?? "integral"] ?? 500000;

    return {
      candidate: {
        id: c.id, fullName: c.fullName, email: c.email, phone: c.phone,
        nationality: c.nationality, dateOfBirth: c.dateOfBirth,
        destination: c.destination, visaType: c.visaType,
        dossierStatus: c.dossierStatus, dossierNote: c.dossierNote,
        formulaChosen: c.formulaChosen, scoreResult: c.scoreResult,
        educationLevel: c.educationLevel, employmentStatus: c.employmentStatus,
        languageLevel: c.languageLevel, createdAt: c.createdAt, lastLoginAt: c.lastLoginAt,
      },
      steps,
      payments,
      deliveredDocs,
      financials: {
        totalPaid,
        totalAmount,
        remainingAmount: Math.max(0, totalAmount - totalPaid),
        paymentCount: payments.filter((p: any) => p.status === "confirmed").length,
      },
    };
  }),

  // ── Étapes du dossier (statique) ──────────────────────────────────────────
  getDossierSteps: publicProcedure.query(() => {
    return DOSSIER_STEPS;
  }),

  // ── ADMIN : Lister tous les candidats ─────────────────────────────────────────
  adminListCandidates: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select({
      id: candidates.id,
      fullName: candidates.fullName,
      email: candidates.email,
      phone: candidates.phone,
      nationality: candidates.nationality,
      destination: candidates.destination,
      visaType: candidates.visaType,
      dossierStatus: candidates.dossierStatus,
      formulaChosen: candidates.formulaChosen,
      scoreResult: candidates.scoreResult,
      educationLevel: candidates.educationLevel,
      employmentStatus: candidates.employmentStatus,
      languageLevel: candidates.languageLevel,
      dossierNote: candidates.dossierNote,
      createdAt: candidates.createdAt,
      lastLoginAt: candidates.lastLoginAt,
    }).from(candidates).orderBy(desc(candidates.createdAt));
  }),

  adminUpdateCandidateStatus: adminProcedure
    .input(z.object({
      candidateId: z.number(),
      dossierStatus: z.string().optional(),
      dossierNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const updates: Record<string, unknown> = {};
      if (input.dossierStatus !== undefined) updates.dossierStatus = input.dossierStatus;
      if (input.dossierNote !== undefined) updates.dossierNote = input.dossierNote;
      await db.update(candidates).set(updates).where(eq(candidates.id, input.candidateId));
      return { success: true };
    }),

  adminAddStep: adminProcedure
    .input(z.object({
      candidateId: z.number(),
      stepLabel: z.string().min(1),
      stepCategory: z.string().default("general"),
      description: z.string().optional(),
      status: z.enum(["pending", "in_progress", "completed", "blocked", "not_required"]).default("pending"),
      sortOrder: z.number().default(0),
      dueDate: z.number().optional(),
      documentUrl: z.string().optional(),
      documentName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(dossierSteps).values({
        candidateId: input.candidateId,
        stepLabel: input.stepLabel,
        stepKey: input.stepLabel.toLowerCase().replace(/\s+/g, "_"),
        stepCategory: input.stepCategory as any,
        description: input.description ?? null,
        status: input.status,
        sortOrder: input.sortOrder,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        documentUrl: input.documentUrl ?? null,
        documentName: input.documentName ?? null,
      });
      return { success: true };
    }),

  adminUpdateStep: adminProcedure
    .input(z.object({
      stepId: z.number(),
      status: z.enum(["pending", "in_progress", "completed", "blocked", "not_required"]).optional(),
      description: z.string().optional(),
      dueDate: z.number().optional(),
      documentUrl: z.string().optional(),
      documentName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const updates: Record<string, unknown> = {};
      if (input.status !== undefined) {
        updates.status = input.status;
        if (input.status === "completed") updates.completedAt = new Date();
      }
      if (input.description !== undefined) updates.description = input.description;
      if (input.dueDate !== undefined) updates.dueDate = new Date(input.dueDate);
      if (input.documentUrl !== undefined) updates.documentUrl = input.documentUrl;
      if (input.documentName !== undefined) updates.documentName = input.documentName;
      await db.update(dossierSteps).set(updates).where(eq(dossierSteps.id, input.stepId));
      return { success: true };
    }),

  adminDeleteStep: adminProcedure
    .input(z.object({ stepId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(dossierSteps).where(eq(dossierSteps.id, input.stepId));
      return { success: true };
    }),

  adminAddPayment: adminProcedure
    .input(z.object({
      candidateId: z.number(),
      amount: z.number().positive(),
      paymentMethod: z.enum(["mtn_momo", "orange_money", "virement", "especes", "carte", "autre"]),
      label: z.string().optional(),
      transactionRef: z.string().optional(),
      status: z.enum(["confirmed", "pending", "rejected"]).default("confirmed"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(dossierPayments).values({
        candidateId: input.candidateId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        label: input.label ?? null,
        transactionRef: input.transactionRef ?? null,
        status: input.status,
      });
      return { success: true };
    }),

  adminDeliverDocument: adminProcedure
    .input(z.object({
      candidateId: z.number(),
      docLabel: z.string().min(1),
      fileUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(dossierDeliveredDocs).values({
        candidateId: input.candidateId,
        docLabel: input.docLabel,
        fileUrl: input.fileUrl ?? null,
        note: input.notes ?? null,
      });
      return { success: true };
    }),

  adminGetCandidateSummary: adminProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [candidateRows, steps, payments, deliveredDocs] = await Promise.all([
        db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1),
        db.select().from(dossierSteps).where(eq(dossierSteps.candidateId, input.candidateId)).orderBy(dossierSteps.sortOrder),
        db.select().from(dossierPayments).where(eq(dossierPayments.candidateId, input.candidateId)).orderBy(desc(dossierPayments.createdAt)),
        db.select().from(dossierDeliveredDocs).where(eq(dossierDeliveredDocs.candidateId, input.candidateId)).orderBy(desc(dossierDeliveredDocs.deliveredAt)),
      ]);
      if (!candidateRows.length) throw new TRPCError({ code: "NOT_FOUND" });
      const c = candidateRows[0];
      const totalPaid = payments.filter((p: any) => p.status === "confirmed").reduce((sum: number, p: any) => sum + p.amount, 0);
      const formulaPrices: Record<string, number> = { integral: 500000, echelonne: 500000, garanti: 750000 };
      const totalAmount = formulaPrices[c.formulaChosen ?? "integral"] ?? 500000;
      return {
        candidate: c,
        steps,
        payments,
        deliveredDocs,
        financials: {
          totalPaid,
          totalAmount,
          remainingAmount: Math.max(0, totalAmount - totalPaid),
          paymentCount: payments.filter((p: any) => p.status === "confirmed").length,
        },
      };
    }),
});
