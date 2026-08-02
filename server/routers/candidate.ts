/**
 * Routeur tRPC — Espace Candidat
 * Gère l'inscription, la connexion, le profil, le dossier, les documents et la messagerie.
 */
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { and, desc, eq, sql } from "drizzle-orm";
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
import { sendVerificationLink, sendVerificationOtp, sendPasswordResetEmail, sendWelcomeEmail } from "../emailService";
import { generateOTP, getOTPExpirationTime, validateOTP } from "../otpService";
import { checkLoginAttempts, recordFailedAttempt, resetLoginAttempts, getRemainingAttempts } from "../loginAttemptsService";

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

      // Générer un token de vérification JWT (24h)
      const verificationToken = jwt.sign({ email: input.email }, JWT_SECRET, { expiresIn: '24h' });

      // Utiliser une requete SQL brute pour eviter les erreurs avec default
      const cleanEmail = input.email.toLowerCase().trim();
      const now = new Date();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Utiliser une requete SQL brute sans la colonne id pour eviter le probleme de default
      await db.execute(
        sql`INSERT INTO candidates (fullName, email, passwordHash, emailVerified, verificationToken, verificationExpiresAt, passwordResetToken, passwordResetExpiresAt, createdAt, updatedAt, lastLoginAt) VALUES (${input.fullName.trim()}, ${cleanEmail}, ${passwordHash}, false, ${verificationToken}, ${expiresAt}, NULL, NULL, ${now}, ${now}, ${now})`
      );

      // Recuperer le candidateId insere
      const inserted = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, cleanEmail)).limit(1);
      if (!inserted.length) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la creation du compte." });
      }
      const candidateId = inserted[0].id;

      // Envoyer l'email de confirmation avec lien
      try {
        await sendVerificationLink(input.email, input.fullName, verificationToken);
      } catch (err) {
        console.error("[Register] Email verification link send error:", err);
      }

      // Stocker le token JWT en base de données
      await db.update(candidates).set({ verificationToken }).where(eq(candidates.email, input.email));

      return { candidateId, requiresEmailVerification: true, message: "Compte créé. Un lien de confirmation a été envoyé à votre adresse email." };
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

      // Vérifier que l'email est confirmé
      if (!candidate.emailVerified) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Veuillez d'abord confirmer votre adresse e-mail en cliquant sur le lien reçu par mail." });
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

  // ── Actions en attente ──────────────────────────────────────────────────────
  getPendingActions: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const actions: any[] = [];

    // Vérifier le statut du dossier
    const candidate = ctx.candidate;

    // Action 1: Paiement en attente (statut documents)
    if (candidate.dossierStatus === "documents") {
      actions.push({
        id: "payment-pending",
        type: "payment",
        title: "Paiement obligatoire",
        description: "Veuillez effectuer le paiement de 65 000 XAF pour finaliser votre dossier.",
        urgency: "high",
        amount: 65000,
        action: {
          label: "Payer maintenant",
          href: "/mon-dossier",
        },
      });
    }

    // Action 2: Documents manquants (statut traitement)
    if (candidate.dossierStatus === "traitement") {
      actions.push({
        id: "documents-pending",
        type: "documents",
        title: "Documents à soumettre",
        description: "Veuillez soumettre vos documents originaux ou une version numérisée professionnelle.",
        urgency: "high",
        action: {
          label: "Soumettre les documents",
          href: "/submit-documents",
        },
      });
    }

    // Action 3: Évaluation en attente (statut evaluation)
    if (candidate.dossierStatus === "evaluation") {
      actions.push({
        id: "evaluation-pending",
        type: "evaluation",
        title: "Évaluation en cours",
        description: "Notre équipe analyse votre profil. Vous recevrez votre bilan dans 48 heures.",
        urgency: "medium",
        action: {
          label: "Consulter mon dossier",
          href: "/mon-dossier",
        },
      });
    }

    return actions;
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
  verifyEmailLink: publicProcedure
    .input(z.object({ token: z.string().min(10) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Vérifier le JWT
      let email: string;
      try {
        const decoded = jwt.verify(input.token, JWT_SECRET) as unknown as { email: string };
        email = decoded.email?.toLowerCase().trim();
        if (!email) throw new Error("Email manquant du token");
      } catch (err) {
        console.error("[verifyEmailLink] JWT verification failed:", err);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Lien de vérification invalide ou expiré." });
      }
      
      console.log(`[verifyEmailLink] Verifying email: ${email}`);
      const rows = await db.select().from(candidates).where(eq(candidates.email, email)).limit(1);
      console.log(`[verifyEmailLink] Found ${rows.length} matching candidate(s)`);
      if (!rows.length) {
        console.log(`[verifyEmailLink] No candidate found with email: ${email}`);
        throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable." });
      }
      const candidate = rows[0];
      if (candidate.emailVerified) {
        const token = signCandidateToken(candidate.id);
        return { success: true, token, message: "Email déjà vérifié." };
      }
      // Pas de vérification d'expiration - le lien n'expire jamais jusqu'à utilisation
      await db.update(candidates).set({ emailVerified: true, verificationToken: null, verificationExpiresAt: null }).where(eq(candidates.id, candidate.id));
      await db.insert(candidateMessages).values({
        candidateId: candidate.id,
        senderRole: "advisor",
        content: `Bienvenue ${candidate.fullName} ! 🎉 Votre compte 3M Travel & Services est activé. Notre équipe vous contactera sous 24h.`,
        isRead: false,
      });
      try { await sendWelcomeEmail(candidate.email, candidate.fullName, candidate.destination ?? "autre"); } catch {}
      const token = signCandidateToken(candidate.id);
      return { success: true, token, message: "Email vérifié avec succès. Bienvenue !" };
    }),

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
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await db.update(candidates).set({ emailOtp: otp, emailOtpExpiresAt: otpExpiresAt }).where(eq(candidates.id, input.candidateId));
      try { await sendVerificationOtp(candidate.email, candidate.fullName, otp); } catch {}
      return { success: true, message: "Nouveau code envoyé à votre adresse email." };
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
      // SANS expiration - le lien n'expire jamais jusqu'à utilisation
      await db.update(candidates).set({ passwordResetToken: resetToken, passwordResetExpiresAt: null }).where(eq(candidates.id, candidate.id));
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
      // Pas de vérification d'expiration - le lien n'expire jamais jusqu'à utilisation
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.update(candidates).set({ passwordHash, passwordResetToken: null, passwordResetExpiresAt: null }).where(eq(candidates.id, candidate.id));
      return { success: true, message: "Mot de passe réinitialisé avec succès." };
    }),

  // ── Renvoyer l'email de vérification ────────────────────────────────────────
  resendVerificationEmail: publicProcedure
    .input(z.object({ email: z.string().email("Email invalide") }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      
      const email = input.email.toLowerCase().trim();
      const rows = await db.select().from(candidates).where(eq(candidates.email, email)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun compte trouvé avec cet email." });
      
      const candidate = rows[0];
      if (candidate.emailVerified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Votre email est déjà vérifié. Vous pouvez vous connecter." });
      }
      
      // Générer un nouveau token JWT (24h)
      const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
      
      // Mettre à jour le token en base de données
      await db.update(candidates).set({ verificationToken }).where(eq(candidates.id, candidate.id));
      
      // Renvoyer l'email de vérification
      try {
        await sendVerificationLink(email, candidate.fullName, verificationToken);
      } catch (err) {
        console.error("[resendVerificationEmail] Error sending email:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de l'envoi de l'email." });
      }
      
      return { success: true, message: "Email de vérification renvoyé avec succès." };
    }),

  // ── Étapes du dossier (statique) ──────────────────────────────────────────
  getDossierSteps: publicProcedure.query(() => {
    return DOSSIER_STEPS;
  }),

  // ── Protocole d'Accord — Signature numérique ──────────────────────────────
  signAgreementProtocol: candidateProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        signatureName: z.string().min(2, "Le nom est requis"),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Récupérer l'application
      const { applications } = await import("../../drizzle/schema");
      const app = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.dossierNumber, input.dossierNumber),
            eq(applications.candidateId, ctx.candidate.id)
          )
        )
        .limit(1);

      if (!app || app.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dossier non trouvé" });
      }

      // Mettre à jour le protocole d'accord
      const now = Math.floor(Date.now() / 1000); // Unix timestamp en secondes
      await db
        .update(applications)
        .set({
          agreementSigned: true,
          agreementSignedAt: now,
          agreementSignatureName: input.signatureName,
          agreementIpAddress: input.ipAddress,
          dossierStatus: "en_evaluation",
          lastStatusUpdateAt: new Date(),
        })
        .where(eq(applications.id, app[0].id));

      // Envoyer un email de confirmation
      try {
        const confirmationHTML = `
          <h2>Protocole d'Accord Signé</h2>
          <p>Bonjour ${app[0].fullName},</p>
          <p>Votre protocole d'accord a été signé avec succès le ${new Date().toLocaleDateString("fr-FR")}.</p>
          <p><strong>Numéro de dossier :</strong> ${input.dossierNumber}</p>
          <p>Vous pouvez maintenant soumettre vos documents dans votre espace candidat.</p>
          <p>Cordialement,<br/>3M Travel & Services</p>
        `;
        const { sendEmail: sendGenericEmail } = await import("../_core/email");
        await sendGenericEmail({ to: app[0].email, subject: `✅ Protocole d'Accord Signé - Dossier ${input.dossierNumber}`, html: confirmationHTML });
      } catch (err) {
        console.warn("Email confirmation failed:", err);
      }

      return { success: true, message: "Protocole d'accord signé avec succès" };
    }),

  // ── Soumettre des documents après signature ────────────────────────────────
  submitDocuments: candidateProcedure
    .input(
      z.object({
        dossierNumber: z.string(),
        documents: z.array(
          z.object({
            fileType: z.string(),
            fileName: z.string(),
            fileUrl: z.string(),
            fileKey: z.string(),
            fileSizeBytes: z.number().optional(),
            mimeType: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { applications } = await import("../../drizzle/schema");
      const app = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.dossierNumber, input.dossierNumber),
            eq(applications.candidateId, ctx.candidate.id)
          )
        )
        .limit(1);

      if (!app || app.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dossier non trouvé" });
      }

      if (!app[0].agreementSigned) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vous devez signer le protocole d'accord avant de soumettre des documents",
        });
      }

      // Mettre à jour le statut de l'application
      await db
        .update(applications)
        .set({
          dossierStatus: "documents_recus",
          documentsReceivedAt: new Date(),
          documentsSubmissionMethod: "en_ligne",
          lastStatusUpdateAt: new Date(),
        })
        .where(eq(applications.id, app[0].id));

      // Envoyer un email de confirmation
      try {
        const confirmationHTML = `
          <h2>Documents Reçus</h2>
          <p>Bonjour ${app[0].fullName},</p>
          <p>Vos ${input.documents.length} document(s) ont été reçus avec succès.</p>
          <p><strong>Numéro de dossier :</strong> ${input.dossierNumber}</p>
          <p>Notre équipe va maintenant analyser votre profil et vos documents.</p>
          <p>Cordialement,<br/>3M Travel & Services</p>
        `;
        const { sendEmail: sendGenericEmail } = await import("../_core/email");
        await sendGenericEmail({ to: app[0].email, subject: `📄 Documents Reçus - Dossier ${input.dossierNumber}`, html: confirmationHTML });
      } catch (err) {
        console.warn("Email confirmation failed:", err);
      }

      return {
        success: true,
        message: "Documents soumis avec succès",
        documentsCount: input.documents.length,
      };
    }),

  // ── Récupérer toutes les données du dossier ────────────────────────────────
  getMyDossierData: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const { applications } = await import("../../drizzle/schema");
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.candidateId, ctx.candidate.id))
      .orderBy(desc(applications.createdAt))
      .limit(1);

    if (!app || app.length === 0) {
      return {
        success: false,
        message: "Aucun dossier trouvé",
        data: null,
      };
    }

    const application = app[0];

    // Récupérer les documents
    const documents = await db
      .select()
      .from(candidateFiles)
      .where(eq(candidateFiles.candidateId, ctx.candidate.id));

    // Récupérer les messages
    const messages = await db
      .select()
      .from(candidateMessages)
      .where(eq(candidateMessages.candidateId, ctx.candidate.id))
      .orderBy(desc(candidateMessages.createdAt));

    return {
      success: true,
      data: {
        application,
        documents,
        messages,
        dossierStatus: application.dossierStatus,
        agreementSigned: application.agreementSigned,
        paymentStatus: application.paymentStatus,
        scoringTotal: application.scoringTotal,
        evaluationScore: application.evaluationScore,
      },
    };
  }),

  /**
   * Recuperer les documents du candidat avec details
   */
  getMyDocuments: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const documents = await db
      .select()
      .from(candidateFiles)
      .where(eq(candidateFiles.candidateId, ctx.candidate.id))
      .orderBy(desc(candidateFiles.uploadedAt));

    return {
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        uploadedAt: doc.uploadedAt,
        fileUrl: doc.fileUrl,
        status: doc.status,
      })),
    };
  }),

  /**
   * Recuperer le bilan du candidat
   */
  getMyBilan: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const { applications, bilans } = await import("../../drizzle/schema");

    // Recuperer l'application du candidat
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.candidateId, ctx.candidate.id))
      .orderBy(desc(applications.createdAt))
      .limit(1);

    if (!app || app.length === 0) {
      return {
        success: false,
        message: "Aucun dossier trouve",
        bilan: null,
      };
    }

    // Recuperer le bilan associe
    const bilanData = await db
      .select()
      .from(bilans)
      .where(eq(bilans.applicationId, app[0].id))
      .limit(1);

    if (!bilanData || bilanData.length === 0) {
      return {
        success: true,
        message: "Bilan non encore disponible",
        bilan: null,
      };
    }

    const bilan = bilanData[0];

    return {
      success: true,
      bilan: {
        id: bilan.id,
        score: bilan.score,
        verdict: bilan.verdict,
        strengths: bilan.strengths,
        weaknesses: bilan.weaknesses,
        recommendations: bilan.recommendations,
        status: bilan.status,
        createdAt: bilan.createdAt,
        sentAt: bilan.sentAt,
        validatedAt: bilan.validatedAt,
        adminNotes: bilan.adminNotes,
      },
    };
  }),

  /**
   * Telecharger un document
   */
  downloadDocument: candidateProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const document = await db
        .select()
        .from(candidateFiles)
        .where(
          and(
            eq(candidateFiles.id, input.documentId),
            eq(candidateFiles.candidateId, ctx.candidate.id)
          )
        )
        .limit(1);

      if (!document || document.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document non trouve",
        });
      }

      return {
        success: true,
        downloadUrl: document[0].fileUrl,
        fileName: document[0].fileName,
      };
    }),

  /**
   * Envoyer une question suite au bilan
   */
  sendBilanQuestion: candidateProcedure
    .input(z.object({
      candidateEmail: z.string().email(),
      dossierNumber: z.string(),
      question: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const message = await db
          .insert(candidateMessages)
          .values({
            candidateId: ctx.candidate.id,
            senderRole: "candidate",
            content: `[QUESTION BILAN ${input.dossierNumber}]\n\n${input.question}`,
            isRead: false,
          })
          .$returningId();

        return {
          success: true,
          message: "Question envoyee avec succes",
          messageId: message[0].id,
        };
      } catch (err) {
        console.error("[Send Bilan Question] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'envoi de la question",
        });
      }
    }),

  /**
   * Demander un rendez-vous suite au bilan
   */
  requestBilanAppointment: candidateProcedure
    .input(z.object({
      candidateEmail: z.string().email(),
      dossierNumber: z.string(),
      preferredDate: z.string(),
      preferredTime: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const appointmentRequest = `[RENDEZ-VOUS ${input.dossierNumber}]\n\nDate preferee: ${input.preferredDate}\nHeure preferee: ${input.preferredTime}\n\nSujet: ${input.reason}`;

        const message = await db
          .insert(candidateMessages)
          .values({
            candidateId: ctx.candidate.id,
            senderRole: "candidate",
            content: appointmentRequest,
            isRead: false,
          })
          .$returningId();

        return {
          success: true,
          message: "Demande de rendez-vous envoyee",
          requestId: message[0].id,
        };
      } catch (err) {
        console.error("[Request Bilan Appointment] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la demande de rendez-vous",
        });
      }
    }),


});
