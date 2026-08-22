/**
 * Routeur tRPC — Espace Candidat
 * Gère l'inscription, la connexion, le profil, le dossier, les documents et la messagerie.
 */
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { and, desc, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { parse as parseCookieHeader } from "cookie";
import { z } from "zod";
import { createHash, randomBytes, randomInt } from "node:crypto";
import {
  Candidate,
  CandidateFile,
  CandidateMessage,
  candidateFiles,
  candidateMessages,
  candidates,
  applicationStatusHistory,
  clientDocuments,
  agencyDossiers,
  agencyDossierDocuments,
  agencyDossierDocumentAnnotations,
  applications,
  favoriteFlights,
  evaluations,
  savedDestinationComparisons,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { sendVerificationLink, sendVerificationOtp, sendPasswordResetEmail, sendWelcomeEmail } from "../emailService";
import { sendEmail as sendGenericEmail } from "../_core/email";
import { storageGetSignedUrl, storagePut } from "../storage";
import { verifyPortraitProof as verifyPortraitProofToken } from "../portraitVerification";
import { GOOGLE_HANDOFF_COOKIE } from "../googleCandidateOAuth";
import { resolveEvaluationDeclaration } from "../../shared/evaluationDeclaration";

// ─── JWT helpers ─────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET est obligatoire pour l’authentification candidat.");
}
const JWT_EXPIRES = "30d";

export function signCandidateToken(candidateId: number): string {
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

function verifyPortraitProof(token: string, candidateEmail: string, avatarUrl?: string) {
  try {
    return verifyPortraitProofToken(token, candidateEmail, avatarUrl);
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Le portrait n’est plus valide. Reprenez une photo puis réessayez." });
  }
}

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function issueVerificationToken() {
  const rawToken = randomBytes(32).toString("hex");
  return { rawToken, tokenHash: hashVerificationToken(rawToken) };
}

export function hashPasswordResetToken(token: string): string {
  return hashVerificationToken(token);
}

export function issuePasswordResetToken() {
  const rawToken = randomBytes(32).toString("hex");
  return { rawToken, tokenHash: hashPasswordResetToken(rawToken) };
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

/** Résout une session candidat facultative sans empêcher la création d’une demande publique. */
export async function findCandidateFromAuthorizationHeader(authHeader: string | undefined) {
  try {
    return await getCandidateFromHeader(authHeader);
  } catch (error) {
    if (error instanceof TRPCError && (error.code === "UNAUTHORIZED" || error.code === "NOT_FOUND")) return null;
    throw error;
  }
}

// ─── Lier un compte plateforme (Google/Facebook/Manus) à un dossier candidat réel ─
// Au lieu de renvoyer des données fictives pour les utilisateurs OAuth, on leur
// associe (ou crée) une vraie ligne dans `candidates`, pour qu'ils bénéficient
// exactement du même système (documents, messages, dossier) que les candidats
// inscrits par email/mot de passe.
export async function getOrCreateCandidateForPlatformUser(user: { id: number; name: string | null; email: string | null }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

  const email = user.email;
  if (!email) throw new TRPCError({ code: "BAD_REQUEST", message: "Adresse email manquante sur le compte." });

  const existing = await db.select().from(candidates).where(eq(candidates.email, email)).limit(1);
  if (existing.length > 0) return existing[0];

  await db.insert(candidates).values({
    fullName: user.name || email.split("@")[0],
    email,
    passwordHash: "",
    emailVerified: true,
    dossierStatus: "nouveau",
    destination: "autre",
  });

  const created = await db.select().from(candidates).where(eq(candidates.email, email)).limit(1);
  if (!created.length) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la création du dossier." });
  return created[0];
}

// ─── Procédure protégée pour les candidats ───────────────────────────────────
// Le portrait est une barrière serveur : seules les mutations d’onboarding
// peuvent être appelées avant la vérification humaine.
const PORTRAIT_ONBOARDING_PATHS = new Set(["candidate.getProfile", "candidate.updateProfile", "candidate.updateAvatar"]);

export function hasUsableCandidatePortrait(candidate: { avatarVerificationStatus?: string | null; avatarUrl?: string | null }) {
  // Les comptes créés avant l’ajout du statut ont parfois une photo valide mais
  // un statut historique « missing » ou « pending ». On ne bloque pas ces
  // candidats : seul un portrait absent ou explicitement rejeté reste bloquant.
  return candidate.avatarVerificationStatus === "verified" || (candidate.avatarVerificationStatus !== "rejected" && Boolean(candidate.avatarUrl));
}

export const candidateProcedure = publicProcedure.use(async ({ ctx, next, path }) => {
  const candidate = ctx.user
    ? await getOrCreateCandidateForPlatformUser(ctx.user)
    : await getCandidateFromHeader((ctx.req as any)?.headers?.authorization as string | undefined);

  if (!candidate.emailVerified) {
    throw new TRPCError({ code: "FORBIDDEN", message: "EMAIL_VERIFICATION_REQUIRED" });
  }

  if (!hasUsableCandidatePortrait(candidate) && !PORTRAIT_ONBOARDING_PATHS.has(path)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Un portrait humain vérifié est obligatoire pour accéder à votre espace et à vos ressources." });
  }

  return next({ ctx: { ...ctx, candidate, isManuUser: Boolean(ctx.user) } });
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
  // ── Finaliser la session courte créée par le callback Google ────────────────
  consumeGoogleOAuth: publicProcedure.mutation(async ({ ctx }) => {
    const handoff = parseCookieHeader(ctx.req.headers.cookie || "")[GOOGLE_HANDOFF_COOKIE];
    const secure = process.env.NODE_ENV === "production";
    ctx.res.clearCookie(GOOGLE_HANDOFF_COOKIE, { httpOnly: true, sameSite: secure ? "none" : "lax", secure, path: "/" });
    if (!handoff) throw new TRPCError({ code: "UNAUTHORIZED", message: "La session Google a expiré. Recommencez la connexion." });

    let candidateId: number;
    try {
      const payload = jwt.verify(handoff, JWT_SECRET) as { candidateId?: number; type?: string };
      if (payload.type !== "candidate_google_handoff" || !payload.candidateId) throw new Error("invalid handoff");
      candidateId = payload.candidateId;
    } catch {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "La session Google est invalide ou expirée. Recommencez la connexion." });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const rows = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
    if (!rows.length || !rows[0].emailVerified) throw new TRPCError({ code: "UNAUTHORIZED", message: "Compte Google non disponible." });
    const candidate = rows[0];
    await db.update(candidates).set({ lastLoginAt: new Date() }).where(eq(candidates.id, candidate.id));
    return {
      token: signCandidateToken(candidate.id),
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        destination: candidate.destination,
        dossierStatus: candidate.dossierStatus,
        avatarUrl: candidate.avatarUrl,
        avatarVerificationStatus: candidate.avatarVerificationStatus,
        requiresPortrait: !hasUsableCandidatePortrait(candidate),
      },
    };
  }),

  // ── Renvoyer l'email de vérification ────────────────────────────────────────
  resendVerificationEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const rows = await db.select().from(candidates).where(eq(candidates.email, input.email)).limit(1);
      // Réponse volontairement identique que le compte existe ou non, pour ne
      // pas laisser deviner quels emails sont inscrits.
      if (!rows.length || rows[0].emailVerified) {
        return { success: true, message: "Si un compte existe avec cet email, un lien de vérification a été envoyé." };
      }

      const candidate = rows[0];
      const { rawToken, tokenHash } = issueVerificationToken();
      const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.update(candidates)
        .set({ verificationToken: tokenHash, verificationExpiresAt })
        .where(eq(candidates.id, candidate.id));

      try {
        await sendVerificationLink(candidate.email, candidate.fullName, rawToken);
      } catch (err) {
        console.error("[ResendVerification] Email send failed:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de l'envoi de l'email." });
      }

      return { success: true, message: "Si un compte existe avec cet email, un lien de vérification a été envoyé." };
    }),


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
        portraitVerificationToken: z.string().min(20, "Portrait vérifié requis"),
        evaluationAlreadyCompleted: z.boolean().default(false),
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

      const portraitProof = verifyPortraitProof(input.portraitVerificationToken, input.email.toLowerCase());
      const passwordHash = await bcrypt.hash(input.password, 12);

      // Générer un token de vérification unique
      const { rawToken, tokenHash } = issueVerificationToken();
      const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

      let candidateId: number;
      try {
        await db.insert(candidates).values({
          fullName: input.fullName,
          email: input.email,
          passwordHash,
          phone: input.phone ?? null,
          destination: input.destination ?? "autre",
          nationality: input.nationality ?? null,
          dossierStatus: "nouveau",
          ...resolveEvaluationDeclaration(input.evaluationAlreadyCompleted),
          emailVerified: false,
          avatarUrl: portraitProof.url,
          avatarVerificationStatus: "verified",
          avatarVerificationMethod: portraitProof.captureMethod,
          avatarVerificationReason: "Portrait humain détecté sur l’appareil du candidat.",
          avatarFaceCount: 1,
          avatarVerifiedAt: new Date(),
          verificationToken: tokenHash,
          verificationExpiresAt,
        });

        // Recuperer le candidateId insere
        const inserted = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, input.email)).limit(1);
        if (!inserted.length) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la creation du compte." });
        }
        candidateId = inserted[0].id;
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        // Ne jamais renvoyer l'erreur brute de la base de données au client
        // (elle peut contenir la requête SQL et ses paramètres, y compris le
        // hash du mot de passe). On la journalise côté serveur uniquement.
        console.error("[Register] Database insert error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création du compte. Veuillez réessayer.",
        });
      }

      // Envoyer l'email de confirmation avec lien
      try {
        await sendVerificationLink(input.email, input.fullName, rawToken);
      } catch (err) {
        console.error("[Register] Email verification link send error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Compte créé, mais l’e-mail d’activation n’a pas pu être envoyé. Utilisez le renvoi d’activation." });
      }

      return {
        candidateId,
        candidateToken: null,
        requiresEmailVerification: true,
        requiresPortrait: false,
        message: "Compte créé avec portrait humain vérifié. Un lien de confirmation a été envoyé à votre adresse email.",
      };
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

      if (!candidate.emailVerified) {
        throw new TRPCError({ code: "FORBIDDEN", message: "EMAIL_VERIFICATION_REQUIRED" });
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
          avatarUrl: candidate.avatarUrl,
          avatarVerificationStatus: candidate.avatarVerificationStatus,
          requiresPortrait: !hasUsableCandidatePortrait(candidate),
        },
      };
    }),

  // ── Profil candidat (lecture) ──────────────────────────────────────────────
  getProfile: candidateProcedure.query(async ({ ctx }) => {
    if ((ctx as any).isManuUser && ctx.user) {
      const linkedCandidate = (ctx as any).candidate as Candidate;
      return {
        id: ctx.user.id,
        fullName: ctx.user.name || '',
        email: ctx.user.email || '',
        phone: null,
        nationality: null,
        dateOfBirth: null,
        destination: 'autre',
        visaType: null,
        dossierStatus: 'nouveau',
        dossierNote: null,
        formulaChosen: null,
        scoreResult: null,
        educationLevel: null,
        employmentStatus: null,
        languageLevel: null,
        preferredLanguage: linkedCandidate.preferredLanguage,
        avatarUrl: linkedCandidate.avatarUrl,
        avatarVerificationStatus: linkedCandidate.avatarVerificationStatus,
        avatarVerificationMethod: linkedCandidate.avatarVerificationMethod,
        avatarVerifiedAt: linkedCandidate.avatarVerifiedAt,
        createdAt: ctx.user.createdAt,
        lastLoginAt: ctx.user.lastSignedIn,
      };
    }
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
      preferredLanguage: c.preferredLanguage,
      avatarUrl: c.avatarUrl,
      avatarVerificationStatus: c.avatarVerificationStatus,
      avatarVerificationMethod: c.avatarVerificationMethod,
      avatarVerifiedAt: c.avatarVerifiedAt,
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
        preferredLanguage: z.enum(["fr", "en"]).optional(),
        formulaChosen: z.string().optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: Record<string, unknown> = {};
      Object.entries(input).forEach(([k, v]) => { if (v !== undefined && k !== "avatarUrl") updateData[k] = v; });
      if (input.avatarUrl !== undefined && input.avatarUrl !== ctx.candidate.avatarUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Utilisez le parcours de vérification pour modifier votre portrait." });
      }

      await db.update(candidates).set(updateData).where(eq(candidates.id, ctx.candidate.id));
      return { success: true };
    }),

  // ── Liste des documents uploadés ──────────────────────────────────────────
  listDocuments: candidateProcedure.query(async ({ ctx }) => {
    if ((ctx as any).isManuUser) return [];
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const files = await db
      .select()
      .from(candidateFiles)
      .where(eq(candidateFiles.candidateId, ctx.candidate.id))
      .orderBy(desc(candidateFiles.uploadedAt));

    return files as CandidateFile[];
  }),

  // ── Mettre à jour la photo de profil ──────────────────────────────────────
  updateAvatar: candidateProcedure
    .input(z.object({ avatarUrl: z.string().url(), portraitVerificationToken: z.string().min(20) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const proof = verifyPortraitProof(input.portraitVerificationToken, ctx.candidate.email, input.avatarUrl);

      await db.update(candidates)
        .set({
          avatarUrl: input.avatarUrl,
          avatarVerificationStatus: "verified",
          avatarVerificationMethod: proof.captureMethod,
          avatarVerificationReason: "Portrait humain vérifié avant enregistrement.",
          avatarFaceCount: 1,
          avatarVerifiedAt: new Date(),
        })
        .where(eq(candidates.id, ctx.candidate.id));

      return { success: true, avatarUrl: input.avatarUrl, avatarVerificationStatus: "verified" as const };
    }),

  // ── Enregistrer un document après upload S3 ───────────────────────────────
  saveDocument: candidateProcedure
    .input(
      z.object({
        fileType: z.enum([
          "cv", "passeport", "diplome", "releve_notes", "photo",
          "justificatif_domicile", "extrait_naissance", "casier_judiciaire", "justificatif_paiement", "autre",
        ]),
        fileName: z.string(),
        fileUrl: z.string().url(),
        fileKey: z.string(),
        fileSizeBytes: z.number().optional(),
        mimeType: z.string().optional(),
        correctionComment: z.string().trim().min(3).max(1000).optional(),
        replacesFileId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.replacesFileId) {
        const [replaced] = await db.select({ id: candidateFiles.id, status: candidateFiles.status, fileType: candidateFiles.fileType })
          .from(candidateFiles)
          .where(and(eq(candidateFiles.id, input.replacesFileId), eq(candidateFiles.candidateId, ctx.candidate.id)))
          .limit(1);
        if (!replaced || replaced.status !== "rejected") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Seul un document rejeté de votre dossier peut être remplacé." });
        }
        if (replaced.fileType !== input.fileType) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Le type de la nouvelle pièce doit correspondre au document à remplacer." });
        }
      }

      let extractionJson: string | null = null;
      try {
        const { extractDocumentInformation } = await import("../services/documentExtractorService");
        const extraction = await extractDocumentInformation(input.fileType, input.fileName);
        extractionJson = JSON.stringify(extraction);
      } catch (err) {
        console.error("Extraction error:", err);
      }

      const insertResult = await db.insert(candidateFiles).values({
        candidateId: ctx.candidate.id,
        fileType: input.fileType,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        fileSizeBytes: input.fileSizeBytes ?? null,
        mimeType: input.mimeType ?? null,
        status: "uploaded",
        correctionComment: input.correctionComment ?? null,
        replacesFileId: input.replacesFileId ?? null,
        extractedData: extractionJson,
      });

      // Si le dossier est encore "nouveau", passer à "documents"
      if (ctx.candidate.dossierStatus === "nouveau") {
        await db.update(candidates)
          .set({ dossierStatus: "evaluation" })
          .where(eq(candidates.id, ctx.candidate.id));
      }

      return { success: true, documentId: Number((insertResult as any)[0]?.insertId || 0) };
    }),

  // ── Supprimer une pièce récente non validée ─────────────────────────────────
  deleteDocument: candidateProcedure
    .input(z.object({ fileId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [document] = await db.select({ id: candidateFiles.id, status: candidateFiles.status })
        .from(candidateFiles)
        .where(and(eq(candidateFiles.id, input.fileId), eq(candidateFiles.candidateId, ctx.candidate.id)))
        .limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable ou non autorisé." });
      if (document.status === "verified") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Un document validé ne peut pas être supprimé depuis votre espace." });
      }
      await db.delete(candidateFiles).where(and(eq(candidateFiles.id, input.fileId), eq(candidateFiles.candidateId, ctx.candidate.id)));
      return { success: true };
    }),

  // ── Commentaires et historique de révision de passeport ───────────────────
  getPassportAnnotationHistory: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const candidate = ctx.candidate as Candidate;
    const documents = await db.select().from(clientDocuments)
      .where(and(eq(clientDocuments.candidateEmail, candidate.email), eq(clientDocuments.documentType, "passport")))
      .orderBy(desc(clientDocuments.updatedAt));

    return documents.map((document) => {
      const analysis = document.readabilityIssues && typeof document.readabilityIssues === "object"
        ? document.readabilityIssues as Record<string, unknown>
        : {};
      return {
        id: document.id,
        documentName: document.documentName,
        status: document.verificationStatus,
        score: document.readabilityScore,
        annotations: analysis.adminAnnotations ?? {},
        history: Array.isArray(analysis.annotationHistory) ? analysis.annotationHistory : [],
        comment: document.verificationComment,
      };
    });
  }),

  replyToPassportMarker: candidateProcedure
    .input(z.object({ documentId: z.number().int(), markerId: z.string().min(1).max(120), message: z.string().min(3).max(600) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const candidate = ctx.candidate as Candidate;
      const [document] = await db.select().from(clientDocuments)
        .where(and(eq(clientDocuments.id, input.documentId), eq(clientDocuments.candidateEmail, candidate.email)))
        .limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });

      const analysis = document.readabilityIssues && typeof document.readabilityIssues === "object"
        ? document.readabilityIssues as Record<string, unknown>
        : {};
      const history = Array.isArray(analysis.annotationHistory) ? analysis.annotationHistory : [];
      await db.update(clientDocuments).set({
        readabilityIssues: {
          ...analysis,
          annotationHistory: [...history, {
            markerId: input.markerId,
            message: input.message.trim(),
            author: candidate.fullName || candidate.email,
            role: "candidate",
            createdAt: new Date().toISOString(),
          }],
        },
      }).where(eq(clientDocuments.id, input.documentId));
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

    const messagesWithSignedAttachments = await Promise.all(msgs.map(async (message) => {
      if (!message.attachmentUrl) return message;
      const key = message.attachmentUrl.replace(/^\/manus-storage\//, "");
      try {
        return { ...message, attachmentSignedUrl: await storageGetSignedUrl(key) };
      } catch {
        return { ...message, attachmentSignedUrl: null };
      }
    }));

    return messagesWithSignedAttachments;
  }),

  // ── Messagerie : envoyer un message ───────────────────────────────────────
  sendMessage: candidateProcedure
    .input(z.object({
      content: z.string().max(2000),
      attachment: z.object({
        dataUrl: z.string().max(8_000_000),
        fileName: z.string().min(1).max(255),
        mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
        sizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
      }).optional(),
    }).refine((input) => input.content.trim().length > 0 || Boolean(input.attachment), {
      message: "Ajoutez un message ou une pièce jointe.",
      path: ["content"],
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      let attachment: { url: string; name: string; mimeType: string; sizeBytes: number } | undefined;
      if (input.attachment) {
        const match = input.attachment.dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
        if (!match || match[1] !== input.attachment.mimeType) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Format de pièce jointe invalide." });
        }
        const buffer = Buffer.from(match[2], "base64");
        if (!buffer.length || buffer.length > 5 * 1024 * 1024 || buffer.length !== input.attachment.sizeBytes) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "La pièce jointe doit peser au maximum 5 Mo." });
        }
        const safeName = input.attachment.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180) || "piece-jointe";
        const stored = await storagePut(
          `candidate-messages/${ctx.candidate.id}/${Date.now()}-${safeName}`,
          buffer,
          input.attachment.mimeType,
        );
        attachment = {
          url: stored.url,
          name: input.attachment.fileName,
          mimeType: input.attachment.mimeType,
          sizeBytes: buffer.length,
        };
      }

      await db.insert(candidateMessages).values({
        candidateId: ctx.candidate.id,
        senderRole: "candidate",
        content: input.content.trim() || "Pièce jointe envoyée.",
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.name,
        attachmentMimeType: attachment?.mimeType,
        attachmentSizeBytes: attachment?.sizeBytes,
        isRead: false,
      });

      return { success: true, attachment };
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
      const rows = await db.select().from(candidates).where(eq(candidates.verificationToken, hashVerificationToken(input.token))).limit(1);
      if (!rows.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lien de vérification invalide ou expiré." });
      }
      const candidate = rows[0];
      if (candidate.emailVerified) {
        const token = signCandidateToken(candidate.id);
        return { success: true, token, message: "Email déjà vérifié." };
      }
      if (!candidate.verificationExpiresAt || new Date() > candidate.verificationExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ce lien a expiré. Veuillez créer un nouveau compte." });
      }
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
      const otp = String(randomInt(100000, 1000000));
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
      const { rawToken, tokenHash } = issuePasswordResetToken();
      const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.update(candidates).set({ passwordResetToken: tokenHash, passwordResetExpiresAt: resetExpiresAt }).where(eq(candidates.id, candidate.id));
      try {
        await sendPasswordResetEmail(candidate.email, candidate.fullName, rawToken);
      } catch (error) {
        console.error("[CandidatePasswordReset] Email send failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le lien n’a pas pu être envoyé. Veuillez réessayer." });
      }
      return { success: true, message: "Si cet email existe, un lien a été envoyé." };
    }),

  resetPassword: publicProcedure
    .input(z.object({ token: z.string().min(10), newPassword: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!/[A-Z]/.test(input.newPassword) || !/[0-9]/.test(input.newPassword)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le mot de passe doit contenir une majuscule et un chiffre." });
      }

      const tokenHash = hashPasswordResetToken(input.token);
      let rows = await db.select().from(candidates).where(eq(candidates.passwordResetToken, tokenHash)).limit(1);
      // Compatibilité de courte durée avec les liens émis avant le stockage haché.
      if (!rows.length) {
        rows = await db.select().from(candidates).where(eq(candidates.passwordResetToken, input.token)).limit(1);
      }
      if (!rows.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Lien invalide ou expiré." });
      const candidate = rows[0];
      if (!candidate.passwordResetExpiresAt || new Date() > candidate.passwordResetExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ce lien a expiré. Veuillez faire une nouvelle demande." });
      }
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.update(candidates).set({ passwordHash, passwordResetToken: null, passwordResetExpiresAt: null }).where(eq(candidates.id, candidate.id));
      return { success: true, message: "Mot de passe réinitialisé avec succès." };
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
        signatureDataUrl: z.string().optional(), // signature dessinée (PNG en base64), optionnelle
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

      // Sauvegarder l'image de la signature dessinée, si fournie
      let signatureImageUrl: string | undefined;
      if (input.signatureDataUrl) {
        try {
          const { storagePut } = await import("../storage");
          const base64Data = input.signatureDataUrl.includes(",") ? input.signatureDataUrl.split(",")[1] : input.signatureDataUrl;
          const buffer = Buffer.from(base64Data, "base64");
          const uploadResult = await storagePut(`signatures/${input.dossierNumber}-${Date.now()}.png`, buffer, "image/png");
          signatureImageUrl = uploadResult.url;
        } catch (err) {
          console.warn("Signature image upload failed:", err);
        }
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
        const { sendEmail } = await import("../_core/email");
        const confirmationHTML = `
          <h2>Protocole d'Accord Signé</h2>
          <p>Bonjour ${app[0].fullName},</p>
          <p>Votre protocole d'accord a été signé avec succès le ${new Date().toLocaleDateString("fr-FR")}.</p>
          <p><strong>Numéro de dossier :</strong> ${input.dossierNumber}</p>
          <p>Vous pouvez maintenant soumettre vos documents dans votre espace candidat.</p>
          <p>Cordialement,<br/>3M Travel & Services</p>
        `;
        await sendEmail({ to: app[0].email, subject: `✅ Protocole d'Accord Signé - Dossier ${input.dossierNumber}`, html: confirmationHTML });
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
        const { sendEmail } = await import("../_core/email");
        const confirmationHTML = `
          <h2>Documents Reçus</h2>
          <p>Bonjour ${app[0].fullName},</p>
          <p>Vos ${input.documents.length} document(s) ont été reçus avec succès.</p>
          <p><strong>Numéro de dossier :</strong> ${input.dossierNumber}</p>
          <p>Notre équipe va maintenant analyser votre profil et vos documents.</p>
          <p>Cordialement,<br/>3M Travel & Services</p>
        `;
        await sendEmail({ to: app[0].email, subject: `📄 Documents Reçus - Dossier ${input.dossierNumber}`, html: confirmationHTML });
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

    // Les dossiers ouverts directement en agence n’étaient pas reliés à une
    // application en ligne. Ils sont maintenant exposés dans le même espace,
    // uniquement lorsque l’adresse e-mail appartient au candidat connecté.
    const [historicalAgencyDossier] = await db
      .select()
      .from(agencyDossiers)
      .where(eq(agencyDossiers.email, ctx.candidate.email))
      .orderBy(desc(agencyDossiers.createdAt))
      .limit(1);

    if (!app.length && !historicalAgencyDossier) {
      return { success: false, message: "Aucun dossier trouvé", data: null };
    }

    const application = app[0] ?? ({
      id: historicalAgencyDossier.id,
      dossierNumber: `3M-AG-${historicalAgencyDossier.id}`,
      candidateId: ctx.candidate.id,
      fullName: historicalAgencyDossier.fullName,
      email: historicalAgencyDossier.email,
      whatsappNumber: historicalAgencyDossier.phone,
      destination: "autre",
      formulaChosen: "integral",
      dossierStatus: historicalAgencyDossier.status === "documents_requis"
        ? "en_attente_documents"
        : historicalAgencyDossier.status === "soumis"
          ? "soumis_agences"
          : historicalAgencyDossier.status === "approuve"
            ? "visa_approuve"
            : historicalAgencyDossier.status === "refuse"
              ? "refuse"
              : historicalAgencyDossier.status === "en_cours"
                ? "en_evaluation"
                : "nouveau",
      agreementSigned: false,
      paymentStatus: "non_paye",
      scoringTotal: null,
      evaluationScore: null,
      createdAt: historicalAgencyDossier.createdAt,
      updatedAt: historicalAgencyDossier.updatedAt,
    } as any);

    const persistedStatusHistory = app[0]
      ? await db.select().from(applicationStatusHistory)
          .where(eq(applicationStatusHistory.applicationId, app[0].id))
          .orderBy(desc(applicationStatusHistory.createdAt))
      : [];
    const statusHistory = persistedStatusHistory.length > 0
      ? persistedStatusHistory
      : [{
          id: 0,
          applicationId: application.id,
          previousStatus: "",
          newStatus: application.dossierStatus,
          changedBy: app[0]?.lastStatusUpdatedBy ?? null,
          reason: app[0]?.adminNote ?? "Dossier créé et enregistré.",
          createdAt: application.createdAt,
          isInitialEntry: true,
        }];

    // Récupérer les documents
    const documents = await db
      .select()
      .from(candidateFiles)
      .where(eq(candidateFiles.candidateId, ctx.candidate.id));

    // Documents déposés ou scannés par l’agence, limités au dossier rattaché à l’e-mail du candidat.
    const agencyDossier = await db
      .select({ id: agencyDossiers.id })
      .from(agencyDossiers)
      .where(eq(agencyDossiers.email, ctx.candidate.email))
      .orderBy(desc(agencyDossiers.createdAt))
      .limit(1);
    const rawAgencyDocuments = agencyDossier[0]
      ? await db
          .select()
          .from(agencyDossierDocuments)
          .where(eq(agencyDossierDocuments.dossierId, agencyDossier[0].id))
          .orderBy(desc(agencyDossierDocuments.createdAt))
      : [];
    const agencyDocuments = await Promise.all(rawAgencyDocuments.map(async document => ({
      ...document,
      documentUrl: await storageGetSignedUrl(document.documentUrl.replace(/^\/manus-storage\//, "")),
    })));
    const evaluationReportPdfUrl = app[0]?.evaluationReportPdfKey
      ? await storageGetSignedUrl(app[0].evaluationReportPdfKey)
      : null;

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
        agencyDocuments,
        evaluationReportPdfUrl,
        messages,
        statusHistory,
        dossierStatus: application.dossierStatus,
        agreementSigned: application.agreementSigned,
        paymentStatus: application.paymentStatus,
        scoringTotal: application.scoringTotal,
        evaluationScore: application.evaluationScore,
        candidate: {
          fullName: ctx.candidate.fullName,
          email: ctx.candidate.email,
          avatarUrl: ctx.candidate.avatarUrl,
        },
      },
    };
  }),

  /**
   * Vérifier un numéro de dossier historique appartenant au candidat connecté.
   * Aucun détail n’est renvoyé si le numéro ne correspond pas à son e-mail ou
   * à son identifiant candidat.
   */
  getDossierByNumber: candidateProcedure
    .input(z.object({ dossierNumber: z.string().trim().min(4).max(32) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { applications } = await import("../../drizzle/schema");
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber))
        .limit(1);

      if (application && (application.candidateId === ctx.candidate.id || application.email.toLowerCase() === ctx.candidate.email.toLowerCase())) {
        return { success: true, source: "online" as const, application };
      }

      const agencyId = /^3M-AG-(\d+)$/i.exec(input.dossierNumber)?.[1];
      if (agencyId) {
        const [agencyDossier] = await db
          .select()
          .from(agencyDossiers)
          .where(eq(agencyDossiers.id, Number(agencyId)))
          .limit(1);
        if (agencyDossier && agencyDossier.email.toLowerCase() === ctx.candidate.email.toLowerCase()) {
          return {
            success: true,
            source: "agency" as const,
            application: {
              id: agencyDossier.id,
              dossierNumber: `3M-AG-${agencyDossier.id}`,
              fullName: agencyDossier.fullName,
              email: agencyDossier.email,
              destination: agencyDossier.destination,
              dossierStatus: agencyDossier.status,
              createdAt: agencyDossier.createdAt,
              updatedAt: agencyDossier.updatedAt,
            },
          };
        }
      }

      return { success: false, message: "Dossier introuvable ou non associé à votre compte." };
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
        rejectionReason: doc.rejectionReason,
        correctionComment: doc.correctionComment,
      })),
    };
  }),

  /**
   * Documents du dossier ouvert en agence, visibles uniquement par le candidat propriétaire.
   */
  getMyAgencyDocuments: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [dossier] = await db
      .select({ id: agencyDossiers.id, destination: agencyDossiers.destination, status: agencyDossiers.status })
      .from(agencyDossiers)
      .where(eq(agencyDossiers.email, ctx.candidate.email))
      .orderBy(desc(agencyDossiers.createdAt))
      .limit(1);

    if (!dossier) return { success: true, dossier: null, documents: [] };

    const rawDocuments = await db
      .select()
      .from(agencyDossierDocuments)
      .where(eq(agencyDossierDocuments.dossierId, dossier.id))
      .orderBy(desc(agencyDossierDocuments.createdAt));

    const annotations = await db
      .select()
      .from(agencyDossierDocumentAnnotations)
      .where(eq(agencyDossierDocumentAnnotations.dossierId, dossier.id))
      .orderBy(desc(agencyDossierDocumentAnnotations.createdAt));

    const documents = await Promise.all(rawDocuments.map(async document => ({
      ...document,
      documentUrl: await storageGetSignedUrl(document.documentUrl.replace(/^\/manus-storage\//, "")),
      annotations: annotations.filter(annotation => annotation.documentId === document.id),
    })));

    return { success: true, dossier, documents };
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

  markEvaluationReportViewed: candidateProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const [application] = await db.select().from(applications)
      .where(eq(applications.candidateId, ctx.candidate.id))
      .orderBy(desc(applications.createdAt))
      .limit(1);
    if (!application?.evaluationReportPdfKey || application.evaluationDeliveryStatus !== "sent") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Aucun bilan finalisé n’est disponible." });
    }
    if (!application.evaluationReportViewedAt) {
      await db.update(applications).set({ evaluationReportViewedAt: new Date(), updatedAt: new Date() }).where(eq(applications.id, application.id));
    }
    return { success: true, firstViewedAt: application.evaluationReportViewedAt ?? new Date() };
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

  // ── Tableau de bord client unifié complet ─────────────────────────────────
  getClientDashboardSummary: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const candidate = ctx.candidate;

    const [
      appRows,
      favFlights,
      evalRows,
      messageRows,
      fileRows,
      agencyDocRows,
    ] = await Promise.all([
      db.select().from(applications).where(eq(applications.candidateId, candidate.id)).orderBy(desc(applications.createdAt)),
      db.select().from(favoriteFlights).where(eq(favoriteFlights.userId, candidate.id)).orderBy(desc(favoriteFlights.createdAt)),
      db.select().from(evaluations).where(eq(evaluations.email, candidate.email)).orderBy(desc(evaluations.createdAt)),
      db.select().from(candidateMessages).where(eq(candidateMessages.candidateId, candidate.id)).orderBy(desc(candidateMessages.createdAt)),
      db.select().from(candidateFiles).where(eq(candidateFiles.candidateId, candidate.id)).orderBy(desc(candidateFiles.uploadedAt)),
      db.select().from(clientDocuments).where(eq(clientDocuments.candidateEmail, candidate.email)).orderBy(desc(clientDocuments.createdAt)),
    ]);

    const activeApp = appRows[0] || null;

    let profileFieldsFilled = 0;
    const totalProfileFields = 5;
    if (candidate.fullName) profileFieldsFilled++;
    if (candidate.email) profileFieldsFilled++;
    if (candidate.phone) profileFieldsFilled++;
    if (candidate.destination) profileFieldsFilled++;
    if (candidate.avatarVerificationStatus === "verified") profileFieldsFilled++;
    const profileCompletionPercent = Math.round((profileFieldsFilled / totalProfileFields) * 100);

    return {
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        destination: candidate.destination,
        avatarUrl: (candidate as any).avatarUrl || null,
        avatarVerificationStatus: candidate.avatarVerificationStatus,
        avatarVerificationMethod: candidate.avatarVerificationMethod,
        avatarVerifiedAt: candidate.avatarVerifiedAt,
        passportNumber: (candidate as any).passportNumber || null,
        dossierNumber: (candidate as any).dossierNumber || activeApp?.dossierNumber || "N/A",
        dossierStatus: (candidate as any).dossierStatus || activeApp?.dossierStatus || "evaluation",
        evaluationDeclarationStatus: candidate.evaluationDeclarationStatus,
        evaluationDeclaredAt: candidate.evaluationDeclaredAt,
        createdAt: candidate.createdAt,
      },
      activeDossier: activeApp,
      applications: appRows,
      favoriteFlights: favFlights,
      evaluations: evalRows,
      messages: messageRows,
      candidateFiles: fileRows,
      agencyDocuments: agencyDocRows,
      stats: {
        totalEvaluations: evalRows.length,
        totalFavoriteFlights: favFlights.length,
        totalDocuments: fileRows.length + agencyDocRows.length,
        unreadMessages: messageRows.filter((m: any) => m.senderRole === "advisor" && !m.isRead).length,
        profileCompletionPercent,
      },
    };
  }),

  saveDestinationComparison: candidateProcedure
    .input(z.object({
      primaryDestinationId: z.string().trim().min(2).max(180),
      secondaryDestinationId: z.string().trim().min(2).max(180),
    }).refine((input) => input.primaryDestinationId !== input.secondaryDestinationId, {
      message: "Choisissez deux destinations différentes.",
      path: ["secondaryDestinationId"],
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const where = and(
        eq(savedDestinationComparisons.candidateId, ctx.candidate.id),
        eq(savedDestinationComparisons.primaryDestinationId, input.primaryDestinationId),
        eq(savedDestinationComparisons.secondaryDestinationId, input.secondaryDestinationId),
      );
      const existing = await db.select().from(savedDestinationComparisons).where(where).limit(1);
      if (existing[0]) {
        await db.update(savedDestinationComparisons).set({ updatedAt: new Date() }).where(eq(savedDestinationComparisons.id, existing[0].id));
        return { comparison: { ...existing[0], updatedAt: new Date() }, alreadySaved: true };
      }
      const inserted = await db.insert(savedDestinationComparisons).values({
        candidateId: ctx.candidate.id,
        primaryDestinationId: input.primaryDestinationId,
        secondaryDestinationId: input.secondaryDestinationId,
      }).$returningId();
      const [comparison] = await db.select().from(savedDestinationComparisons).where(eq(savedDestinationComparisons.id, inserted[0].id)).limit(1);
      return { comparison, alreadySaved: false };
    }),

  listSavedDestinationComparisons: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    return db.select().from(savedDestinationComparisons)
      .where(eq(savedDestinationComparisons.candidateId, ctx.candidate.id))
      .orderBy(desc(savedDestinationComparisons.updatedAt));
  }),

  removeSavedDestinationComparison: candidateProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const row = await db.select({ id: savedDestinationComparisons.id }).from(savedDestinationComparisons)
        .where(and(eq(savedDestinationComparisons.id, input.id), eq(savedDestinationComparisons.candidateId, ctx.candidate.id))).limit(1);
      if (!row[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Comparaison introuvable." });
      await db.delete(savedDestinationComparisons).where(eq(savedDestinationComparisons.id, input.id));
      return { success: true };
    }),

  shareFlightFavoriteEmail: candidateProcedure
    .input(z.object({
      flightId: z.number().int().positive(),
      recipientEmail: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [favorite] = await db.select().from(favoriteFlights).where(and(eq(favoriteFlights.id, input.flightId), eq(favoriteFlights.userId, ctx.candidate.id))).limit(1);
      if (!favorite) throw new TRPCError({ code: "NOT_FOUND", message: "Vol favori introuvable." });

      let flight: Record<string, any> = {};
      try {
        flight = JSON.parse(favorite.flightData) as Record<string, any>;
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Les données de cet itinéraire sont invalides." });
      }
      const departureCity = String(flight.departureCity || flight.departure || "Départ");
      const arrivalCity = String(flight.arrivalCity || flight.arrival || "Destination");
      const subject = `Itinéraire de vol 3M Travel Agency : ${departureCity} ➔ ${arrivalCity}`;
      const textBody = `Bonjour,\n\nVoici un itinéraire de vol partagé par ${ctx.candidate.fullName} via 3M Travel Agency :\n\nTrajet : ${departureCity} vers ${arrivalCity}\nCompagnie : ${String(flight.airline || "À confirmer")}\nPrix estimé : ${String(flight.price ?? "À confirmer")} ${String(flight.currency || "XAF")}\nCabine : ${String(flight.cabinClass || "Économique")}\nDate : ${String(flight.departureDate || "Libre")}\n\nContactez-nous pour réserver dès maintenant !\n3M Travel Agency — hello@3mtravelagency.com`;

      try {
        await sendGenericEmail({
          to: input.recipientEmail,
          subject,
          html: `<p>${textBody.replace(/\n/g, "<br />")}</p>`,
        });
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Échec de l’envoi de l’e-mail." });
      }

      return { success: true, recipientEmail: input.recipientEmail };
    }),
});
