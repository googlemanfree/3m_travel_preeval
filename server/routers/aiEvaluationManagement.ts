
/**
 * Routeur tRPC — Gestion IA des évaluations (vue unifiée admin)
 *
 * Regroupe les évaluations générales, Luxembourg, visa études et consultations
 * dans une liste filtrable. Les mutations d’administration restent isolées et
 * enregistrent chaque action dans admin_activity_logs.
 */

import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  adminActivityLogs,
  evaluations,
  evaluationReviewEvents,
  luxembourgEvaluations,
  studyVisaEvaluations,
  consultationRequests,
  applications,
} from "../../drizzle/schema";
import { requireValidAdminSession } from "./adminAuth";
import { sendValidatedEvaluationResponseEmail } from "../emailService";

type Priority = "haute" | "moyenne" | "basse";
type EvaluationType = "evaluation" | "luxembourg" | "etudes" | "consultation";

interface UnifiedItem {
  id: string;
  type: EvaluationType;
  typeLabel: string;
  fullName: string;
  email: string;
  createdAt: Date;
  score: number | null;
  hasConverted: boolean;
  priority: Priority;
  suggestedAction: string;
  destinationCategory?: string | null;
  destinationCountry?: string | null;
  nationality?: string | null;
  educationLevel?: string | null;
  employmentStatus?: string | null;
  maritalStatus?: string | null;
  status?: string | null;
  priorVisaRefusal?: boolean | null;
  criminalRecord?: boolean | null;
  familyAbroad?: boolean | null;
  acquisitionSource?: "facebook" | "whatsapp" | "direct" | "other" | null;
  acquisitionCampaign?: string | null;
  referenceCode?: string | null;
  reviewDeadline?: Date | null;
  reviewDraft?: string | null;
  reviewedAt?: Date | null;
  finalResponseSentAt?: Date | null;
  preparationState?: "ready" | "unavailable" | "not_requested";
  preparationDraft?: {
    summary: string;
    strengths: string[];
    gapsToClarify: string[];
    documentPriorities: string[];
    advisorQuestions: string[];
  } | null;
}

function preparationTextList(value: unknown, maximum: number): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, maximum)
    : [];
}

function parsePreparationDraft(value: string | null): UnifiedItem["preparationDraft"] {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || typeof parsed.summary !== "string") return null;
    return {
      summary: parsed.summary.trim().slice(0, 600),
      strengths: preparationTextList(parsed.strengths, 4),
      gapsToClarify: preparationTextList(parsed.gapsToClarify, 6),
      documentPriorities: preparationTextList(parsed.documentPriorities, 6),
      advisorQuestions: preparationTextList(parsed.advisorQuestions, 5),
    };
  } catch {
    return null;
  }
}

function computePriority(args: { score: number | null; hasConverted: boolean; ageHours: number; needsAdminAction: boolean }): { priority: Priority; suggestedAction: string } {
  if (args.hasConverted) return { priority: "basse", suggestedAction: "Déjà converti en dossier — suivi normal" };
  if (args.needsAdminAction) return { priority: "haute", suggestedAction: "Action admin requise (validation en attente)" };
  if (args.score !== null && args.score >= 70 && args.ageHours > 24) return { priority: "haute", suggestedAction: "Profil très favorable non recontacté depuis 24h — relancer en priorité" };
  if (args.score !== null && args.score >= 70) return { priority: "moyenne", suggestedAction: "Profil favorable — prévoir un contact rapide" };
  if (args.score !== null && args.score < 45) return { priority: "basse", suggestedAction: "Profil à renforcer — orientation ou formation complémentaire à proposer" };
  return { priority: "moyenne", suggestedAction: "À examiner" };
}

const statusInput = z.object({
  sessionToken: z.string().min(1),
  evaluationType: z.enum(["evaluation", "consultation"]),
  evaluationId: z.number().int().positive(),
  newStatus: z.string().min(1).max(80),
});

const exportInput = z.object({
  sessionToken: z.string().min(1),
  action: z.enum(["csv_exported", "pdf_exported"]),
  resultCount: z.number().int().min(0).max(10000),
  details: z.string().max(5000).optional(),
});

const reviewDraftInput = z.object({
  sessionToken: z.string().min(1),
  evaluationId: z.number().int().positive(),
  draft: z.string().trim().min(20, "Le projet de réponse doit contenir au moins 20 caractères.").max(8000),
  reason: z.string().trim().min(8, "Indiquez le motif de la modification.").max(800),
});

export const aiEvaluationManagementRouter = router({
  getUnifiedDashboard: publicProcedure
    .input(z.object({ sessionToken: z.string(), limit: z.number().min(1).max(1000).default(500) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const [genEvals, luxEvals, etudesEvals, consultations, applicationRows] = await Promise.all([
        db.select().from(evaluations),
        db.select().from(luxembourgEvaluations),
        db.select().from(studyVisaEvaluations),
        db.select().from(consultationRequests),
        db.select({ email: applications.email }).from(applications),
      ]);

      const convertedEmails = new Set(applicationRows.map((a) => a.email.toLowerCase()));
      const now = Date.now();
      const ageHours = (d: Date) => (now - new Date(d).getTime()) / (1000 * 60 * 60);
      const items: UnifiedItem[] = [];

      for (const e of genEvals) {
        const hasConverted = convertedEmails.has(e.email.toLowerCase());
        const reviewOverdue = Boolean(e.reviewDeadline && new Date(e.reviewDeadline).getTime() <= now && !e.reviewedAt);
        const preparationDraft = parsePreparationDraft(e.aiReportContent);
        const { priority, suggestedAction } = computePriority({ score: null, hasConverted, ageHours: ageHours(e.createdAt), needsAdminAction: !e.reviewedAt || reviewOverdue });
        items.push({
          id: `evaluation-${e.id}`, type: "evaluation", typeLabel: "Pré-évaluation", fullName: e.fullName, email: e.email,
          createdAt: e.createdAt, score: null, hasConverted, priority, suggestedAction,
          destinationCategory: e.destinationCategory, destinationCountry: e.destinationCountry, nationality: e.nationality,
          educationLevel: e.educationLevel, employmentStatus: e.employmentStatus, maritalStatus: e.maritalStatus,
          status: e.status, priorVisaRefusal: e.priorVisaRefusal, criminalRecord: e.criminalRecord, familyAbroad: e.familyAbroad,
          acquisitionSource: e.acquisitionSource, acquisitionCampaign: e.acquisitionCampaign,
          referenceCode: e.referenceCode, reviewDeadline: e.reviewDeadline, reviewDraft: e.reviewDraft, reviewedAt: e.reviewedAt, finalResponseSentAt: e.finalResponseSentAt,
          preparationState: preparationDraft ? "ready" : e.aiProcessingError ? "unavailable" : "not_requested",
          preparationDraft,
        });
      }

      for (const e of luxEvals) {
        const hasConverted = convertedEmails.has(e.email.toLowerCase());
        const { priority, suggestedAction } = computePriority({ score: e.scoreTotal, hasConverted, ageHours: ageHours(e.createdAt), needsAdminAction: false });
        items.push({ id: `luxembourg-${e.id}`, type: "luxembourg", typeLabel: "Éval. Luxembourg", fullName: e.fullName, email: e.email, createdAt: e.createdAt, score: e.scoreTotal, hasConverted, priority, suggestedAction });
      }

      for (const e of etudesEvals) {
        const hasConverted = convertedEmails.has(e.email.toLowerCase());
        const { priority, suggestedAction } = computePriority({ score: e.scoreTotal, hasConverted, ageHours: ageHours(e.createdAt), needsAdminAction: false });
        items.push({ id: `etudes-${e.id}`, type: "etudes", typeLabel: "Éval. Visa Études", fullName: e.fullName, email: e.email, createdAt: e.createdAt, score: e.scoreTotal, hasConverted, priority, suggestedAction });
      }

      for (const c of consultations) {
        const hasConverted = convertedEmails.has(c.email.toLowerCase());
        const needsAdminAction = c.status === "pending_review";
        const { priority, suggestedAction } = computePriority({ score: null, hasConverted, ageHours: ageHours(c.createdAt), needsAdminAction });
        items.push({ id: `consultation-${c.id}`, type: "consultation", typeLabel: "Consultation + CV", fullName: c.fullName, email: c.email, createdAt: c.createdAt, score: null, hasConverted, priority, suggestedAction, destinationCountry: c.targetCountry, status: c.status });
      }

      const priorityOrder: Record<Priority, number> = { haute: 0, moyenne: 1, basse: 2 };
      items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      const summary = {
        total: items.length,
        haute: items.filter((i) => i.priority === "haute").length,
        moyenne: items.filter((i) => i.priority === "moyenne").length,
        basse: items.filter((i) => i.priority === "basse").length,
        converted: items.filter((i) => i.hasConverted).length,
      };

      return { items: items.slice(0, input.limit), summary };
    }),

  updateEvaluationStatus: publicProcedure
    .input(statusInput)
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      if (input.evaluationType === "evaluation") {
        const allowed = ["pending", "contacted", "closed"] as const;
        if (!allowed.includes(input.newStatus as (typeof allowed)[number])) throw new TRPCError({ code: "BAD_REQUEST", message: "Statut invalide pour cette évaluation." });
        const current = await db.select({ status: evaluations.status }).from(evaluations).where(eq(evaluations.id, input.evaluationId)).limit(1);
        if (!current[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
        await db.update(evaluations).set({ status: input.newStatus as (typeof allowed)[number] }).where(eq(evaluations.id, input.evaluationId));
        await db.insert(adminActivityLogs).values({ adminEmail: admin.email, action: "status_changed", evaluationType: input.evaluationType, evaluationId: String(input.evaluationId), oldStatus: current[0].status, newStatus: input.newStatus, details: "Modification rapide depuis le dashboard IA" });
        return { success: true, status: input.newStatus };
      }

      const allowed = ["pending_ai", "pending_review", "validated_sent", "rejected"] as const;
      if (!allowed.includes(input.newStatus as (typeof allowed)[number])) throw new TRPCError({ code: "BAD_REQUEST", message: "Statut invalide pour cette consultation." });
      const current = await db.select({ status: consultationRequests.status }).from(consultationRequests).where(eq(consultationRequests.id, input.evaluationId)).limit(1);
      if (!current[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Consultation introuvable." });
      await db.update(consultationRequests).set({ status: input.newStatus as (typeof allowed)[number] }).where(eq(consultationRequests.id, input.evaluationId));
      await db.insert(adminActivityLogs).values({ adminEmail: admin.email, action: "status_changed", evaluationType: input.evaluationType, evaluationId: String(input.evaluationId), oldStatus: current[0].status, newStatus: input.newStatus, details: "Modification rapide depuis le dashboard IA" });
      return { success: true, status: input.newStatus };
    }),

    saveEvaluationReviewDraft: publicProcedure
      .input(reviewDraftInput)
      .mutation(async ({ input }) => {
        const admin = await requireValidAdminSession(input.sessionToken);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
        const current = await db.select({ id: evaluations.id, reviewedAt: evaluations.reviewedAt }).from(evaluations).where(eq(evaluations.id, input.evaluationId)).limit(1);
        if (!current[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
        if (current[0].reviewedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette réponse est déjà validée. Créez une nouvelle évaluation pour toute reprise." });
        await db.update(evaluations).set({ reviewDraft: input.draft, reviewDraftUpdatedAt: new Date(), reviewDraftUpdatedBy: admin.email }).where(eq(evaluations.id, input.evaluationId));
        await db.insert(evaluationReviewEvents).values({ evaluationId: input.evaluationId, adminEmail: admin.email, action: "draft_saved", note: input.reason });
        return { success: true };
      }),

    validateAndSendEvaluationResponse: publicProcedure
      .input(z.object({ sessionToken: z.string().min(1), evaluationId: z.number().int().positive(), validationNote: z.string().trim().min(8, "Indiquez la décision ou le motif de validation.").max(800) }))
      .mutation(async ({ input }) => {
        const admin = await requireValidAdminSession(input.sessionToken);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
        const current = await db.select().from(evaluations).where(eq(evaluations.id, input.evaluationId)).limit(1);
        const evaluation = current[0];
        if (!evaluation) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
        if (!evaluation.reviewDraft?.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Enregistrez un projet de réponse avant de le valider." });
        if (!evaluation.reviewedAt) {
          await db.update(evaluations).set({ status: "reviewed", reviewedAt: new Date(), reviewedBy: admin.email, reviewNote: input.validationNote }).where(eq(evaluations.id, input.evaluationId));
          await db.insert(evaluationReviewEvents).values({ evaluationId: evaluation.id, adminEmail: admin.email, action: "validated", note: input.validationNote });
        }
        const delivered = await sendValidatedEvaluationResponseEmail({ to: evaluation.email, fullName: evaluation.fullName, referenceCode: evaluation.referenceCode ?? `EVAL-${evaluation.id}`, response: evaluation.reviewDraft });
        if (delivered) {
          await db.update(evaluations).set({ finalResponseSentAt: new Date() }).where(eq(evaluations.id, evaluation.id));
          await db.insert(evaluationReviewEvents).values({ evaluationId: evaluation.id, adminEmail: admin.email, action: "response_sent", note: "Réponse validée envoyée par e-mail." });
        }
        return { success: true, delivered };
      }),

    recordExport: publicProcedure
    .input(exportInput)
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      await db.insert(adminActivityLogs).values({ adminEmail: admin.email, action: input.action, resultCount: input.resultCount, details: input.details ?? null });
      return { success: true };
    }),

  getActivityHistory: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), limit: z.number().int().min(1).max(100).default(30) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      return db.select().from(adminActivityLogs).orderBy(desc(adminActivityLogs.createdAt)).limit(input.limit);
    }),
});
