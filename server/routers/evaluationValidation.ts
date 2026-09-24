import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { evaluations } from "../../drizzle/schema";
import { CV_MAX_BASE64_LENGTH, checkCvUpload, safeCvFileName } from "../../shared/evaluationCv";
import { AdminEvaluationVersionSchema, ClientTextViolationError, SensitiveDataError, WORKFLOW_STATUS_LABELS } from "../../shared/evaluationValidation";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { storagePut } from "../storage";
import {
  ValidationFlowError,
  attachCandidateCv,
  buildAdminView,
  buildCandidateView,
  findAdminView,
  publishEvaluation,
  requestInformation,
  resendNotification,
  saveAdminVersion,
  startReevaluation,
  submitCandidateReply,
  type CandidateCv,
  type ValidationDeps,
  type ValidationFlowErrorCode,
} from "../services/evaluationValidationCore";
import { isMissingTableError } from "../services/evaluationValidationStore";
import { buildDefaultDeps, runAiDraft, type AiDraftRunOptions } from "../services/structuredEvaluationPipeline";
import { requireValidAdminSession } from "./adminAuth";
import type { candidateProcedure as CandidateProcedure } from "./candidate";

/**
 * Évaluation à validation administrateur obligatoire.
 *  - côté administrateur : brouillon IA, version modifiable, aperçu client, checklist, quatre actions ;
 *  - côté candidat : uniquement l'avis d'attente, les demandes de complément et le rapport PUBLIÉ.
 * Les ports (session admin, propriété d'une évaluation, dépendances) sont injectables pour les tests.
 */

const FLOW_TO_TRPC: Record<ValidationFlowErrorCode, TRPCError["code"]> = {
  NOT_FOUND: "NOT_FOUND",
  INVALID_STATE: "CONFLICT",
  STALE_VERSION: "CONFLICT",
  CONFLICT: "CONFLICT",
  INVALID_INPUT: "BAD_REQUEST",
  CHECKLIST_INCOMPLETE: "BAD_REQUEST",
  INCOMPLETE_VERSION: "BAD_REQUEST",
  NO_RECIPIENT: "BAD_REQUEST",
  CV_REQUIRED: "PRECONDITION_FAILED",
  SECOND_VALIDATION_REQUIRED: "FORBIDDEN",
};

/** Traduit une erreur métier en erreur tRPC ; null si elle n'est pas reconnue. */
export function toTrpcError(error: unknown): TRPCError | null {
  if (error instanceof TRPCError) return error;
  if (error instanceof ValidationFlowError) return new TRPCError({ code: FLOW_TO_TRPC[error.code], message: error.message });
  if (error instanceof ClientTextViolationError || error instanceof SensitiveDataError) return new TRPCError({ code: "BAD_REQUEST", message: error.message });
  if (isMissingTableError(error)) {
    return new TRPCError({ code: "PRECONDITION_FAILED", message: "La validation structurée n’est pas encore activée sur ce serveur : la migration 0072 doit être appliquée." });
  }
  return null;
}

async function guard<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toTrpcError(error) ?? error;
  }
}

export type CandidateIdentity = { id: number; email: string };

export type ValidationRouterPorts = {
  resolveDeps: () => Promise<ValidationDeps>;
  requireAdmin: (sessionToken: string) => Promise<{ email: string }>;
  /** Évaluation la plus récente du candidat (lien par e-mail ou par identifiant, comme le tableau de bord). */
  findOwnEvaluation: (candidate: CandidateIdentity) => Promise<{ id: number; referenceCode: string | null; cv: CandidateCv } | null>;
  ownsEvaluation: (candidate: CandidateIdentity, evaluationId: number) => Promise<boolean>;
  /** Enregistre le fichier du CV dans le stockage et renvoie son lien. */
  storeCv: (file: { evaluationId: number; fileName: string; mimeType: string; bytes: Uint8Array }) => Promise<string>;
  aiRun?: AiDraftRunOptions;
};

const ownedBy = (candidate: CandidateIdentity) => and(eq(evaluations.email, candidate.email), or(isNull(evaluations.candidateId), eq(evaluations.candidateId, candidate.id)));

export const productionPorts: ValidationRouterPorts = {
  async resolveDeps() {
    const deps = await buildDefaultDeps();
    if (!deps) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    return deps;
  },
  requireAdmin: (sessionToken) => requireValidAdminSession(sessionToken),
  async findOwnEvaluation(candidate) {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const [row] = await db
      .select({ id: evaluations.id, referenceCode: evaluations.referenceCode, cvFileUrl: evaluations.cvFileUrl, cvFileName: evaluations.cvFileName })
      .from(evaluations)
      .where(ownedBy(candidate))
      .orderBy(desc(evaluations.createdAt))
      .limit(1);
    if (!row) return null;
    const onFile = Boolean(row.cvFileUrl?.trim());
    return { id: row.id, referenceCode: row.referenceCode, cv: { onFile, fileName: onFile ? (row.cvFileName?.trim() || null) : null } };
  },
  async storeCv(file) {
    const { url } = await storagePut(`cv-uploads/${file.evaluationId}_${Date.now()}_${safeCvFileName(file.fileName)}`, Buffer.from(file.bytes), file.mimeType);
    return url;
  },
  async ownsEvaluation(candidate, evaluationId) {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const [row] = await db.select({ id: evaluations.id }).from(evaluations).where(and(eq(evaluations.id, evaluationId), ownedBy(candidate))).limit(1);
    return Boolean(row);
  },
};

const evaluationId = z.number().int().positive();
const adminInput = z.object({ sessionToken: z.string().min(1), evaluationId });

export function createEvaluationValidationRouter(ports: ValidationRouterPorts, candidateProc: typeof CandidateProcedure) {
  const adminView = async (deps: ValidationDeps, id: number) => buildAdminView(deps, id);

  return router({
    // ── Administrateur ─────────────────────────────────────────────────────
    /** Lecture seule : `view` vaut null tant que l'évaluation n'a pas été ouverte dans la validation structurée. */
    getCase: publicProcedure.input(adminInput).query(({ input }) =>
      guard(async () => {
        await ports.requireAdmin(input.sessionToken);
        return { view: await findAdminView(await ports.resolveDeps(), input.evaluationId) };
      }),
    ),

    /** Ouvre l'évaluation dans la validation structurée (sans lancer l'IA), p. ex. pour une saisie manuelle. */
    openCase: publicProcedure.input(adminInput).mutation(({ input }) =>
      guard(async () => {
        const admin = await ports.requireAdmin(input.sessionToken);
        const deps = await ports.resolveDeps();
        const view = await adminView(deps, input.evaluationId);
        return { view, openedBy: admin.email };
      }),
    ),

    /** Statuts de workflow d'une liste d'évaluations (pastilles du tableau de bord). Vide tant que la migration n'est pas appliquée. */
    listStatuses: publicProcedure.input(z.object({ sessionToken: z.string().min(1), evaluationIds: z.array(evaluationId).max(500) })).query(({ input }) =>
      guard(async () => {
        await ports.requireAdmin(input.sessionToken);
        try {
          const deps = await ports.resolveDeps();
          const statuses = await deps.store.latestStatuses(input.evaluationIds);
          return Array.from(statuses.entries()).map(([id, entry]) => ({ evaluationId: id, status: entry.status, label: WORKFLOW_STATUS_LABELS[entry.status], versionNumber: entry.versionNumber, updatedAt: entry.updatedAt.toISOString() }));
        } catch (error) {
          if (isMissingTableError(error)) return [];
          throw error;
        }
      }),
    ),

    generateAiDraft: publicProcedure.input(adminInput).mutation(({ input }) =>
      guard(async () => {
        await ports.requireAdmin(input.sessionToken);
        const deps = await ports.resolveDeps();
        await runAiDraft(deps, input.evaluationId, { ...ports.aiRun, explicit: true });
        return adminView(deps, input.evaluationId);
      }),
    ),

    saveDraft: publicProcedure.input(adminInput.extend({ version: AdminEvaluationVersionSchema })).mutation(({ input }) =>
      guard(async () => {
        const admin = await ports.requireAdmin(input.sessionToken);
        const deps = await ports.resolveDeps();
        const { changedFields } = await saveAdminVersion(deps, admin, input.evaluationId, input.version);
        return { changedFields, view: await adminView(deps, input.evaluationId) };
      }),
    ),

    requestInfo: publicProcedure.input(adminInput.extend({ message: z.string().max(2000), items: z.array(z.string().max(300)).max(12) })).mutation(({ input }) =>
      guard(async () => {
        const admin = await ports.requireAdmin(input.sessionToken);
        const deps = await ports.resolveDeps();
        await requestInformation(deps, admin, input.evaluationId, { message: input.message, items: input.items });
        return { view: await adminView(deps, input.evaluationId) };
      }),
    ),

    publish: publicProcedure
      .input(adminInput.extend({ checklist: z.record(z.string(), z.boolean()), sendEmail: z.boolean(), reviewedVersionStamp: z.string().min(8).max(64) }))
      .mutation(({ input }) =>
        guard(async () => {
          const admin = await ports.requireAdmin(input.sessionToken);
          const deps = await ports.resolveDeps();
          const result = await publishEvaluation(deps, admin, input.evaluationId, { checklist: input.checklist, sendEmail: input.sendEmail, reviewedVersionStamp: input.reviewedVersionStamp });
          const view = await adminView(deps, input.evaluationId);
          return result.outcome === "published"
            ? { outcome: result.outcome, emailAttempted: result.emailAttempted, emailSent: result.emailSent, emailError: result.emailError, firstValidatedBy: null, view }
            : { outcome: result.outcome, emailAttempted: false, emailSent: false, emailError: null, firstValidatedBy: result.firstValidatedBy, view };
        }),
      ),

    /** `emailReviewed` : confirmation explicite de la relecture de l'e-mail, requise si elle n'a pas été cochée à la publication. */
    resendEmail: publicProcedure.input(adminInput.extend({ emailReviewed: z.boolean().optional() })).mutation(({ input }) =>
      guard(async () => {
        const admin = await ports.requireAdmin(input.sessionToken);
        const deps = await ports.resolveDeps();
        const result = await resendNotification(deps, admin, input.evaluationId, { emailReviewed: input.emailReviewed });
        return { emailSent: result.emailSent, emailError: result.emailError, view: await adminView(deps, input.evaluationId) };
      }),
    ),

    startReevaluation: publicProcedure.input(adminInput.extend({ reason: z.string().min(3).max(500) })).mutation(({ input }) =>
      guard(async () => {
        const admin = await ports.requireAdmin(input.sessionToken);
        const deps = await ports.resolveDeps();
        await startReevaluation(deps, admin, input.evaluationId, { reason: input.reason });
        return { view: await adminView(deps, input.evaluationId) };
      }),
    ),

    // ── Candidat : jamais de brouillon, de score initial ni de commentaire interne ──
    myEvaluation: candidateProc.query(({ ctx }) =>
      guard(async () => {
        const candidate = { id: ctx.candidate.id, email: ctx.candidate.email };
        const own = await ports.findOwnEvaluation(candidate);
        const empty = { available: true as const, evaluationId: null, referenceCode: null, view: buildCandidateView({ latest: null, latestPublished: null, cv: { onFile: true, fileName: null } }) };
        if (!own) return empty;
        try {
          const deps = await ports.resolveDeps();
          const [latest, latestPublished] = await Promise.all([deps.store.getLatestCase(own.id), deps.store.getLatestPublishedCase(own.id)]);
          return { available: true as const, evaluationId: own.id, referenceCode: own.referenceCode, view: buildCandidateView({ latest, latestPublished, cv: own.cv }) };
        } catch (error) {
          // migration non appliquée : l'ancien parcours reste en vigueur (le dépôt du CV reste possible)
          if (isMissingTableError(error)) return { available: false as const, evaluationId: own.id, referenceCode: own.referenceCode, view: buildCandidateView({ latest: null, latestPublished: null, cv: own.cv }) };
          throw error;
        }
      }),
    ),

    /** Dépôt (ou remplacement) du CV : PDF, JPG ou PNG de 5 Mo maximum, type vérifié sur le contenu du fichier. */
    attachCv: candidateProc
      .input(z.object({ evaluationId, fileName: z.string().min(1).max(255), base64: z.string().min(4).max(CV_MAX_BASE64_LENGTH) }))
      .mutation(({ ctx, input }) =>
        guard(async () => {
          const candidate = { id: ctx.candidate.id, email: ctx.candidate.email };
          if (!(await ports.ownsEvaluation(candidate, input.evaluationId))) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
          const checked = checkCvUpload(input.base64);
          if (checked.ok === false) throw new TRPCError({ code: "BAD_REQUEST", message: checked.message });
          const deps = await ports.resolveDeps();
          const fileName = safeCvFileName(input.fileName);
          const cv = await attachCandidateCv(deps, input.evaluationId, {
            fileName,
            upload: () => ports.storeCv({ evaluationId: input.evaluationId, fileName, mimeType: checked.mime, bytes: checked.bytes }),
          });
          return { cv };
        }),
      ),

    respondToInfoRequest: candidateProc
      .input(z.object({ evaluationId, answers: z.array(z.object({ id: z.string().min(1).max(20), answer: z.string().max(2000) })).max(12), note: z.string().max(2000) }))
      .mutation(({ ctx, input }) =>
        guard(async () => {
          const candidate = { id: ctx.candidate.id, email: ctx.candidate.email };
          if (!(await ports.ownsEvaluation(candidate, input.evaluationId))) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
          const deps = await ports.resolveDeps();
          await submitCandidateReply(deps, input.evaluationId, { answers: input.answers, note: input.note });
          const [latest, latestPublished, context] = await Promise.all([deps.store.getLatestCase(input.evaluationId), deps.store.getLatestPublishedCase(input.evaluationId), deps.store.loadEvaluationContext(input.evaluationId)]);
          return { view: buildCandidateView({ latest, latestPublished, cv: { onFile: context?.cvOnFile === true, fileName: context?.cvFileName ?? null } }) };
        }),
      ),
  });
}

export function evaluationValidationRouterFor(candidateProc: typeof CandidateProcedure) {
  return createEvaluationValidationRouter(productionPorts, candidateProc);
}
