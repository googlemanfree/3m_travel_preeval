import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { ApplicationPackSchema, draftHasMinimumContent, supportingFactsFromDocuments, writeApplicationPackJson } from "../../shared/applicationPack";
import { CV_LANGUAGES, CV_STYLES, CV_STYLE_KEYS, CvDraftSchema, styleForCountry, type CvIdentity, type CvLanguage, type CvStyleKey } from "../../shared/cvDraft";
import { adminActivityLogs, agencyDossierDocuments, agencyDossiers, candidateFiles, candidates, evaluations } from "../../drizzle/schema";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { generateCvDraft, type CvDraftDeps, type CvDraftOutcome } from "../services/cvDraftGenerator";
import { generateMotivationLetter } from "../services/motivationLetterDraft";
import { priorityCountryOf, type EvaluationRowForDraft } from "../services/structuredEvaluationDraft";
import { requireValidAdminSession } from "./adminAuth";

export type CvDraftRow = EvaluationRowForDraft & { email?: string | null; phone?: string | null; projectDetailsJson?: string | null };

export type CvDraftRouterPorts = {
  requireAdmin: (sessionToken: string) => Promise<{ email: string }>;
  loadRow: (evaluationId: number) => Promise<CvDraftRow | null>;
  loadSupportingFacts: (evaluationId: number, email?: string | null) => Promise<string[]>;
  generate: (row: CvDraftRow, options: { style: CvStyleKey; language: CvLanguage; targetRole?: string | null; supportingFacts?: string[] }) => Promise<CvDraftOutcome>;
  saveProjectDetails: (evaluationId: number, projectDetailsJson: string) => Promise<void>;
  logExport: (entry: { adminEmail: string; evaluationId: number; style: CvStyleKey }) => Promise<void>;
  logRelease: (entry: { adminEmail: string; evaluationId: number; style: CvStyleKey; action: "released" | "revoked" }) => Promise<void>;
  now: () => number;
};

/** Plafond par administrateur : chaque génération est un appel facturé au modèle. */
export const CV_DRAFT_MAX_PER_HOUR = 20;
const WINDOW_MS = 60 * 60 * 1000;

export function createCvDraftLimiter(max = CV_DRAFT_MAX_PER_HOUR, windowMs = WINDOW_MS) {
  const hits = new Map<string, number[]>();
  return (key: string, now: number): boolean => {
    const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    hits.set(key, [...recent, now]);
    return true;
  };
}

async function loadSupportingFactsForEvaluation(evaluationId: number, email?: string | null): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const docs: Array<{ documentType?: string | null; documentName?: string | null; fileName?: string | null; verificationStatus?: string | null; status?: string | null }> = [];
  const [evaluation] = await db.select({
    cvFileName: evaluations.cvFileName,
    diplomaTitle: evaluations.diplomaTitle,
    currentJobTitle: evaluations.currentJobTitle,
    languageTestsTaken: evaluations.languageTestsTaken,
    email: evaluations.email,
  }).from(evaluations).where(eq(evaluations.id, evaluationId)).limit(1);
  const resolvedEmail = (email || evaluation?.email || "").trim().toLowerCase();
  if (evaluation?.cvFileName) docs.push({ documentType: "CV", documentName: evaluation.cvFileName, status: "received" });
  if (evaluation?.diplomaTitle) docs.push({ documentType: "Diplôme", documentName: evaluation.diplomaTitle, status: "received" });
  if (evaluation?.currentJobTitle) docs.push({ documentType: "Expérience", documentName: evaluation.currentJobTitle, status: "received" });
  if (evaluation?.languageTestsTaken) docs.push({ documentType: "Test de langue", documentName: evaluation.languageTestsTaken, status: "received" });

  if (resolvedEmail) {
    const candidate = (await db.select({ id: candidates.id }).from(candidates).where(sql`LOWER(${candidates.email}) = ${resolvedEmail}`).limit(1))[0];
    if (candidate) {
      const files = await db.select({
        fileType: candidateFiles.fileType,
        fileName: candidateFiles.fileName,
        status: candidateFiles.status,
      }).from(candidateFiles).where(eq(candidateFiles.candidateId, candidate.id)).orderBy(desc(candidateFiles.uploadedAt)).limit(40);
      for (const file of files) docs.push({ documentType: file.fileType, fileName: file.fileName, status: file.status });
    }
    const agencyRows = await db.select({
      documentType: agencyDossierDocuments.documentType,
      documentName: agencyDossierDocuments.documentName,
      verificationStatus: agencyDossierDocuments.verificationStatus,
    }).from(agencyDossierDocuments)
      .innerJoin(agencyDossiers, eq(agencyDossierDocuments.dossierId, agencyDossiers.id))
      .where(sql`LOWER(${agencyDossiers.email}) = ${resolvedEmail}`)
      .orderBy(desc(agencyDossierDocuments.uploadedAt))
      .limit(40);
    for (const row of agencyRows) docs.push({ documentType: row.documentType, documentName: row.documentName, verificationStatus: row.verificationStatus });
  }

  return supportingFactsFromDocuments(docs).map((fact) => fact.label);
}

export const productionPorts: CvDraftRouterPorts = {
  requireAdmin: (sessionToken) => requireValidAdminSession(sessionToken),
  async loadRow(evaluationId) {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const [row] = await db.select().from(evaluations).where(eq(evaluations.id, evaluationId)).limit(1);
    return row ?? null;
  },
  loadSupportingFacts: loadSupportingFactsForEvaluation,
  generate: (row, options) => generateCvDraft(row, options, {} satisfies CvDraftDeps),
  async saveProjectDetails(evaluationId, projectDetailsJson) {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    await db.update(evaluations).set({ projectDetailsJson }).where(eq(evaluations.id, evaluationId));
  },
  async logExport(entry) {
    const db = await getDb();
    if (!db) return;
    await db.insert(adminActivityLogs).values({
      adminEmail: entry.adminEmail,
      action: "pdf_exported",
      evaluationType: "cv_draft",
      evaluationId: String(entry.evaluationId),
      details: JSON.stringify({ style: entry.style }),
    });
  },
  async logRelease(entry) {
    const db = await getDb();
    if (!db) return;
    await db.insert(adminActivityLogs).values({
      adminEmail: entry.adminEmail,
      action: entry.action === "released" ? "cv_pack_released" : "cv_pack_revoked",
      evaluationType: "cv_draft",
      evaluationId: String(entry.evaluationId),
      details: JSON.stringify({ style: entry.style }),
    });
  },
  now: () => Date.now(),
};

const adminInput = z.object({ sessionToken: z.string().min(1), evaluationId: z.number().int().positive() });

export function createCvDraftRouter(ports: CvDraftRouterPorts) {
  const allow = createCvDraftLimiter();
  return router({
    /** Brouillon de CV tiré du CV d’évaluation + libellés des pièces fournies (administrateur uniquement). */
    generate: publicProcedure
      .input(adminInput.extend({
        style: z.enum(CV_STYLE_KEYS).optional(),
        language: z.enum(CV_LANGUAGES).optional(),
        targetRole: z.string().trim().max(160).optional(),
      }))
      .mutation(async ({ input }) => {
        const admin = await ports.requireAdmin(input.sessionToken);
        if (!allow(admin.email.toLowerCase(), ports.now())) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Limite atteinte : ${CV_DRAFT_MAX_PER_HOUR} brouillons de CV par heure. Réessayez plus tard.` });
        }
        const row = await ports.loadRow(input.evaluationId);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
        const style = input.style ?? styleForCountry(priorityCountryOf(row));
        const language = input.language ?? CV_STYLES[style].defaultLanguage;
        const supportingFacts = await ports.loadSupportingFacts(input.evaluationId, row.email);
        const outcome = await ports.generate(row, { style, language, targetRole: input.targetRole, supportingFacts });
        const identity: CvIdentity = { fullName: row.fullName, email: row.email ?? null, phone: row.phone ?? null, city: row.cityOfResidence ?? null, nationality: row.nationality ?? null };
        console.info("[cvDraft] génération", { evaluationId: input.evaluationId, admin: admin.email, style, language, facts: supportingFacts.length, ok: outcome.ok, ...(outcome.ok === false ? { reason: outcome.reason } : {}) });
        return { style, language, identity, supportingFacts, outcome };
      }),

    /** Lettre de motivation à partir du brouillon déjà relu (pas du fichier CV brut). */
    generateMotivation: publicProcedure
      .input(adminInput.extend({
        language: z.enum(CV_LANGUAGES),
        targetRole: z.string().trim().max(160).optional(),
        draft: CvDraftSchema,
      }))
      .mutation(async ({ input }) => {
        const admin = await ports.requireAdmin(input.sessionToken);
        if (!allow(`motivation:${admin.email.toLowerCase()}`, ports.now())) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Limite atteinte : ${CV_DRAFT_MAX_PER_HOUR} générations par heure. Réessayez plus tard.` });
        }
        const row = await ports.loadRow(input.evaluationId);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
        if (!draftHasMinimumContent(input.draft)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Complétez d’abord le brouillon de CV (accroche + expériences ou formations)." });
        }
        const outcome = await generateMotivationLetter({
          language: input.language,
          destination: priorityCountryOf(row),
          targetRole: input.targetRole,
          draft: input.draft,
        });
        console.info("[cvDraft] lettre", { evaluationId: input.evaluationId, admin: admin.email, ok: outcome.ok });
        return { outcome };
      }),

    /** Publie le pack (CV + lettre optionnelle) dans l’espace candidat. */
    releaseToClient: publicProcedure
      .input(adminInput.extend({
        style: z.enum(CV_STYLE_KEYS),
        language: z.enum(CV_LANGUAGES),
        includeContact: z.boolean(),
        targetRole: z.string().trim().max(160).nullable().optional(),
        draft: CvDraftSchema,
        motivationLetter: z.string().trim().max(4000).nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const admin = await ports.requireAdmin(input.sessionToken);
        const row = await ports.loadRow(input.evaluationId);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
        if (!draftHasMinimumContent(input.draft)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Le CV est trop incomplet pour être publié au candidat." });
        }
        const pack = ApplicationPackSchema.parse({
          releasedAt: new Date(ports.now()).toISOString(),
          releasedBy: admin.email,
          style: input.style,
          language: input.language,
          includeContact: input.includeContact,
          targetRole: input.targetRole ?? null,
          draft: input.draft,
          motivationLetter: input.motivationLetter?.trim() ? input.motivationLetter.trim() : null,
        });
        const nextJson = writeApplicationPackJson(row.projectDetailsJson, pack);
        await ports.saveProjectDetails(input.evaluationId, nextJson);
        await ports.logRelease({ adminEmail: admin.email, evaluationId: input.evaluationId, style: input.style, action: "released" });
        return { ok: true as const, releasedAt: pack.releasedAt };
      }),

    revokeRelease: publicProcedure.input(adminInput).mutation(async ({ input }) => {
      const admin = await ports.requireAdmin(input.sessionToken);
      const row = await ports.loadRow(input.evaluationId);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
      const nextJson = writeApplicationPackJson(row.projectDetailsJson, null);
      await ports.saveProjectDetails(input.evaluationId, nextJson);
      await ports.logRelease({ adminEmail: admin.email, evaluationId: input.evaluationId, style: "europe", action: "revoked" });
      return { ok: true as const };
    }),

    /** Trace l'export du PDF dans le journal d'activité (sans le contenu du CV). */
    logExport: publicProcedure.input(adminInput.extend({ style: z.enum(CV_STYLE_KEYS) })).mutation(async ({ input }) => {
      const admin = await ports.requireAdmin(input.sessionToken);
      await ports.logExport({ adminEmail: admin.email, evaluationId: input.evaluationId, style: input.style });
      return { ok: true as const };
    }),
  });
}

export const cvDraftRouter = createCvDraftRouter(productionPorts);
