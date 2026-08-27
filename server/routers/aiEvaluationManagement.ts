
/**
 * Routeur tRPC — Gestion IA des évaluations (vue unifiée admin)
 *
 * Regroupe les évaluations générales, Luxembourg, visa études et consultations
 * dans une liste filtrable. Les mutations d’administration restent isolées et
 * enregistrent chaque action dans admin_activity_logs.
 */

import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
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
import { buildEvaluationResponseTemplate, getEvaluationResponseTemplates } from "../services/evaluationResponseTemplates";
import { generateGeminiEvaluationDraft, type GeminiEvaluationDraftInput } from "../geminiEvaluationDraftService";
import { caseActivityLogs, cases, documentRequirements } from "../../drizzle/caseTrackingSchema";

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
  projectType?: string | null;
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
  luxembourgReview?: {
    state: "ready_to_verify" | "needs_human_review" | "missing_information";
    label: string;
    detail: string;
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

function normalizeComparableText(value: string | null | undefined) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function internalLuxembourgReview(evaluation: typeof evaluations.$inferSelect): UnifiedItem["luxembourgReview"] {
  if (evaluation.destinationCountry !== "Luxembourg") return null;
  const details = parseProjectDetails(evaluation.projectDetailsJson);
  const education = normalizeComparableText(evaluation.educationLevel ?? textDetail(details.educationLevel, 120) ?? textDetail(details.diplomaLevel, 120));
  const years = typeof details.yearsOfExperience === "number" ? details.yearsOfExperience : Number(evaluation.yearsOfExperience);
  const hasRecognizedLevel = /\b(bts|hnd|licence|license|bachelor|master)\b|diplome professionnel superieur/.test(education);
  const hasLowerLevel = /\b(bac|baccalaureat|bepc|cap|cep)\b/.test(education);

  if (!education || !Number.isFinite(years)) {
    return { state: "missing_information", label: "Grille Luxembourg à compléter", detail: "Le niveau de diplôme déclaré et la durée d’expérience doivent être confirmés par un conseiller avant toute orientation." };
  }
  if (hasRecognizedLevel && years >= 2) {
    return { state: "ready_to_verify", label: "Pré-requis internes déclarés à vérifier", detail: "Diplôme déclaré au niveau BTS/HND/Licence/Master ou professionnel supérieur et au moins 2 ans d’expérience déclarés. Cette indication ne confirme ni un canal, ni une autorisation, ni une admissibilité." };
  }
  const educationDetail = hasLowerLevel ? "niveau déclaré inférieur au BTS" : "niveau de diplôme à confirmer";
  const experienceDetail = years < 2 ? "moins de 2 ans d’expérience déclarés" : "expérience à confirmer";
  return { state: "needs_human_review", label: "Analyse humaine requise avant orientation", detail: `Grille interne : ${educationDetail} et/ou ${experienceDetail}. Le conseiller examine les possibilités au cas par cas ; aucune exclusion ni réorientation n’est automatique.` };
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

const preparationRetryInput = z.object({
  sessionToken: z.string().min(1),
  evaluationId: z.number().int().positive(),
  reason: z.string().trim().min(8, "Indiquez le motif de la relance.").max(800),
});

const responseTemplateInput = z.object({
  sessionToken: z.string().min(1),
  evaluationId: z.number().int().positive(),
  templateKey: z.enum(["travail", "etudes", "tourisme"]),
});

const documentRequirementInput = z.object({
  sessionToken: z.string().min(1),
  evaluationId: z.number().int().positive(),
  documentType: z.string().trim().min(3, "Indiquez la pièce demandée.").max(100),
  candidateComment: z.string().trim().min(3, "Ajoutez une indication utile pour le candidat.").max(1000),
  dueAt: z.string().datetime().optional(),
  reason: z.string().trim().min(8, "Indiquez le motif de la demande.").max(800),
});

const documentRequirementUpdateInput = documentRequirementInput.extend({ requirementId: z.number().int().positive() });

const documentRequirementWithdrawalInput = z.object({
  sessionToken: z.string().min(1),
  evaluationId: z.number().int().positive(),
  requirementId: z.number().int().positive(),
  reason: z.string().trim().min(8, "Indiquez le motif du retrait.").max(800),
});

const PREPARATION_DETAIL_KEYS = [
  "canadaLanguageTest", "canadaStudyPlan", "luxEmployerStatus", "luxAademStatus", "franceProjectStatus",
  "belgiumRegion", "germanyLanguageLevel", "germanyRecognitionStatus",
] as const;

const PREPARATION_ALTERNATIVES: Record<string, string[]> = {
  Canada: ["France", "Belgique", "Allemagne", "Luxembourg", "Royaume-Uni"],
  Luxembourg: ["France", "Belgique", "Allemagne", "Canada"],
  France: ["Belgique", "Allemagne", "Luxembourg", "Canada"],
  Belgique: ["France", "Allemagne", "Luxembourg", "Canada"],
  Allemagne: ["France", "Belgique", "Luxembourg", "Canada"],
  "Royaume-Uni": ["Canada", "France", "Belgique", "Allemagne"],
};

function parseProjectDetails(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function textDetail(value: unknown, maximum = 1000): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, maximum) || undefined : undefined;
}

async function requireEvaluationCandidate(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, evaluationId: number) {
  const [evaluation] = await db.select({
    id: evaluations.id,
    candidateId: evaluations.candidateId,
    referenceCode: evaluations.referenceCode,
    destinationCountry: evaluations.destinationCountry,
    projectType: evaluations.projectType,
    createdAt: evaluations.createdAt,
  }).from(evaluations).where(eq(evaluations.id, evaluationId)).limit(1);
  if (!evaluation) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
  if (!evaluation.candidateId) throw new TRPCError({ code: "BAD_REQUEST", message: "Le candidat doit d’abord disposer d’un compte rattaché à cette évaluation." });
  return evaluation;
}

async function ensureEvaluationCase(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, evaluation: Awaited<ReturnType<typeof requireEvaluationCandidate>>) {
  const caseNumber = evaluation.referenceCode || `EVAL-${evaluation.id}`;
  const [existing] = await db.select().from(cases).where(eq(cases.caseNumber, caseNumber)).limit(1);
  if (existing) return existing;
  await db.insert(cases).values({
    caseNumber,
    candidateId: evaluation.candidateId,
    sourceChannel: "online",
    countryTarget: evaluation.destinationCountry ?? null,
    caseType: evaluation.projectType ?? "evaluation",
    currentStatus: "documents_review",
    openedAt: evaluation.createdAt,
  });
  const [created] = await db.select().from(cases).where(eq(cases.caseNumber, caseNumber)).limit(1);
  if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de préparer le dossier documentaire." });
  return created;
}

function retryInputFromEvaluation(evaluation: typeof evaluations.$inferSelect): GeminiEvaluationDraftInput | null {
  const projectType = evaluation.projectType;
  if (projectType !== "travail" && projectType !== "etudes" && projectType !== "tourisme") return null;
  const details = parseProjectDetails(evaluation.projectDetailsJson);
  if (details.preparatoryAnalysisConsent !== true) return null;
  const countryDetails: Record<string, string | number | boolean | undefined> = {};
  for (const key of PREPARATION_DETAIL_KEYS) countryDetails[key] = textDetail(details[key]);
  if (Array.isArray(details.dynamicResponses)) {
    details.dynamicResponses.slice(0, 5).forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const response = item as Record<string, unknown>;
      const question = textDetail(response.question, 260);
      const answer = textDetail(response.answer, 1000);
      if (question) countryDetails[`question_complementaire_${index + 1}`] = question;
      if (answer) countryDetails[`reponse_complementaire_${index + 1}`] = answer;
    });
  }
  const destinationCountry = evaluation.destinationCountry?.trim();
  if (!destinationCountry) return null;
  return {
    destinationCountry,
    projectType,
    nationality: evaluation.nationality ?? undefined,
    sector: textDetail(details.sector, 300) ?? evaluation.industrySector ?? undefined,
    yearsOfExperience: typeof details.yearsOfExperience === "number" ? details.yearsOfExperience : Number(evaluation.yearsOfExperience) || undefined,
    educationLevel: evaluation.educationLevel ?? textDetail(details.diplomaLevel, 120),
    languages: textDetail(details.languages, 500),
    financialGuarantee: textDetail(details.financialGuarantee, 500),
    countryDetails,
    alternativeCountries: (PREPARATION_ALTERNATIVES[destinationCountry] ?? ["Canada", "France", "Belgique", "Allemagne", "Luxembourg"]).filter((country) => country !== destinationCountry),
  };
}

export const aiEvaluationManagementRouter = router({
  listEvaluationDocumentRequirements: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), evaluationId: z.number().int().positive() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const evaluation = await requireEvaluationCandidate(db, input.evaluationId);
      const [operationalCase] = await db.select({ id: cases.id }).from(cases).where(eq(cases.caseNumber, evaluation.referenceCode || `EVAL-${evaluation.id}`)).limit(1);
      if (!operationalCase) return [];
      return db.select({ id: documentRequirements.id, documentType: documentRequirements.documentType, status: documentRequirements.status, dueAt: documentRequirements.dueAt, requestedAt: documentRequirements.requestedAt, adminComment: documentRequirements.adminComment })
        .from(documentRequirements).where(eq(documentRequirements.caseId, operationalCase.id)).orderBy(desc(documentRequirements.requestedAt));
    }),

  createEvaluationDocumentRequirement: publicProcedure
    .input(documentRequirementInput)
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const evaluation = await requireEvaluationCandidate(db, input.evaluationId);
      const operationalCase = await ensureEvaluationCase(db, evaluation);
      const [duplicate] = await db.select({ id: documentRequirements.id }).from(documentRequirements)
        .where(and(eq(documentRequirements.caseId, operationalCase.id), eq(documentRequirements.documentType, input.documentType))).limit(1);
      if (duplicate) throw new TRPCError({ code: "CONFLICT", message: "Cette pièce est déjà demandée pour ce dossier." });
      const result = await db.insert(documentRequirements).values({ caseId: operationalCase.id, documentType: input.documentType, isRequired: true, status: "pending", dueAt: input.dueAt ? new Date(input.dueAt) : null, adminComment: input.candidateComment });
      const requirementId = Number((result as any)[0]?.insertId || 0);
      await db.insert(caseActivityLogs).values({ caseId: operationalCase.id, actorRole: "admin", actorId: admin.id, actionType: "document_requirement_created", entityType: "document_requirement", entityId: requirementId ? String(requirementId) : null, description: `Pièce demandée : ${input.documentType}. Motif : ${input.reason}` });
      return { success: true, requirementId };
    }),

  updateEvaluationDocumentRequirement: publicProcedure
    .input(documentRequirementUpdateInput)
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const evaluation = await requireEvaluationCandidate(db, input.evaluationId);
      const operationalCase = await ensureEvaluationCase(db, evaluation);
      const [requirement] = await db.select({ id: documentRequirements.id, status: documentRequirements.status }).from(documentRequirements).where(and(eq(documentRequirements.id, input.requirementId), eq(documentRequirements.caseId, operationalCase.id))).limit(1);
      if (!requirement || requirement.status === "waived") throw new TRPCError({ code: "NOT_FOUND", message: "Demande de pièce introuvable ou déjà retirée." });
      await db.update(documentRequirements).set({ documentType: input.documentType, adminComment: input.candidateComment, dueAt: input.dueAt ? new Date(input.dueAt) : null }).where(eq(documentRequirements.id, requirement.id));
      await db.insert(caseActivityLogs).values({ caseId: operationalCase.id, actorRole: "admin", actorId: admin.id, actionType: "document_requirement_updated", entityType: "document_requirement", entityId: String(requirement.id), description: `Demande modifiée : ${input.documentType}. Motif : ${input.reason}` });
      return { success: true };
    }),

  withdrawEvaluationDocumentRequirement: publicProcedure
    .input(documentRequirementWithdrawalInput)
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const evaluation = await requireEvaluationCandidate(db, input.evaluationId);
      const operationalCase = await ensureEvaluationCase(db, evaluation);
      const [requirement] = await db.select({ id: documentRequirements.id }).from(documentRequirements).where(and(eq(documentRequirements.id, input.requirementId), eq(documentRequirements.caseId, operationalCase.id))).limit(1);
      if (!requirement) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de pièce introuvable." });
      await db.update(documentRequirements).set({ status: "waived" }).where(eq(documentRequirements.id, requirement.id));
      await db.insert(caseActivityLogs).values({ caseId: operationalCase.id, actorRole: "admin", actorId: admin.id, actionType: "document_requirement_withdrawn", entityType: "document_requirement", entityId: String(requirement.id), description: `Demande retirée. Motif : ${input.reason}` });
      return { success: true };
    }),
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
        const luxembourgReview = internalLuxembourgReview(e);
        const { priority, suggestedAction } = computePriority({ score: null, hasConverted, ageHours: ageHours(e.createdAt), needsAdminAction: !e.reviewedAt || reviewOverdue });
        items.push({
          id: `evaluation-${e.id}`, type: "evaluation", typeLabel: "Pré-évaluation", fullName: e.fullName, email: e.email,
          createdAt: e.createdAt, score: null, hasConverted, priority, suggestedAction,
          destinationCategory: e.destinationCategory, destinationCountry: e.destinationCountry, projectType: e.projectType, nationality: e.nationality,
          educationLevel: e.educationLevel, employmentStatus: e.employmentStatus, maritalStatus: e.maritalStatus,
          status: e.status, priorVisaRefusal: e.priorVisaRefusal, criminalRecord: e.criminalRecord, familyAbroad: e.familyAbroad,
          acquisitionSource: e.acquisitionSource, acquisitionCampaign: e.acquisitionCampaign,
          referenceCode: e.referenceCode, reviewDeadline: e.reviewDeadline, reviewDraft: e.reviewDraft, reviewedAt: e.reviewedAt, finalResponseSentAt: e.finalResponseSentAt,
          preparationState: preparationDraft ? "ready" : e.aiProcessingError ? "unavailable" : "not_requested",
          preparationDraft,
          luxembourgReview,
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

      const reviewedEvaluations = genEvals.filter((evaluation) => Boolean(evaluation.reviewedAt));
      const reviewedWithinTarget = reviewedEvaluations.filter((evaluation) => Boolean(evaluation.reviewDeadline && evaluation.reviewedAt && new Date(evaluation.reviewedAt).getTime() <= new Date(evaluation.reviewDeadline).getTime())).length;
      const reviewHours = reviewedEvaluations.map((evaluation) => (new Date(evaluation.reviewedAt!).getTime() - new Date(evaluation.createdAt).getTime()) / (1000 * 60 * 60)).filter((hours) => Number.isFinite(hours) && hours >= 0);
      const days = Array.from({ length: 7 }, (_, index) => {
        const day = new Date(now - (6 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        return {
          day,
          received: genEvals.filter((evaluation) => new Date(evaluation.createdAt).toISOString().slice(0, 10) === day).length,
          reviewed: genEvals.filter((evaluation) => evaluation.reviewedAt && new Date(evaluation.reviewedAt).toISOString().slice(0, 10) === day).length,
        };
      });
      const reviewSla = {
        targetHours: 24,
        received: genEvals.length,
        pending: genEvals.filter((evaluation) => !evaluation.reviewedAt).length,
        overdue: genEvals.filter((evaluation) => !evaluation.reviewedAt && evaluation.reviewDeadline && new Date(evaluation.reviewDeadline).getTime() <= now).length,
        reviewedWithinTarget,
        reviewedLate: reviewedEvaluations.length - reviewedWithinTarget,
        onTimeRate: reviewedEvaluations.length ? Math.round((reviewedWithinTarget / reviewedEvaluations.length) * 100) : null,
        averageReviewHours: reviewHours.length ? Math.round((reviewHours.reduce((total, hours) => total + hours, 0) / reviewHours.length) * 10) / 10 : null,
        days,
      };

      return { items: items.slice(0, input.limit), summary, reviewSla };
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

    getResponseTemplates: publicProcedure
      .input(z.object({ sessionToken: z.string().min(1) }))
      .query(async ({ input }) => {
        await requireValidAdminSession(input.sessionToken);
        return { templates: getEvaluationResponseTemplates() };
      }),

    applyResponseTemplate: publicProcedure
      .input(responseTemplateInput)
      .mutation(async ({ input }) => {
        await requireValidAdminSession(input.sessionToken);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
        const [evaluation] = await db.select({ id: evaluations.id, fullName: evaluations.fullName, destinationCountry: evaluations.destinationCountry, projectType: evaluations.projectType, reviewedAt: evaluations.reviewedAt }).from(evaluations).where(eq(evaluations.id, input.evaluationId)).limit(1);
        if (!evaluation) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
        if (evaluation.reviewedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette réponse est déjà validée et ne peut plus être remplacée." });
        if (evaluation.projectType !== input.templateKey) throw new TRPCError({ code: "BAD_REQUEST", message: "Ce modèle ne correspond pas au type de projet de l’évaluation." });
        const draft = buildEvaluationResponseTemplate(input.templateKey, evaluation);
        if (!draft) throw new TRPCError({ code: "BAD_REQUEST", message: "Modèle de réponse indisponible." });
        return { draft };
      }),

    retryEvaluationPreparation: publicProcedure
      .input(preparationRetryInput)
      .mutation(async ({ input }) => {
        const admin = await requireValidAdminSession(input.sessionToken);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
        const [evaluation] = await db.select().from(evaluations).where(eq(evaluations.id, input.evaluationId)).limit(1);
        if (!evaluation) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
        if (evaluation.reviewedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette évaluation est déjà validée ; aucune relance de brouillon n’est autorisée." });
        const preparedInput = retryInputFromEvaluation(evaluation);
        if (!preparedInput) throw new TRPCError({ code: "BAD_REQUEST", message: "La relance requiert un consentement enregistré et des réponses déclarées exploitables." });
        try {
          const draft = await generateGeminiEvaluationDraft(preparedInput);
          await db.update(evaluations).set({ aiReportContent: JSON.stringify(draft), aiProcessedAt: new Date(), aiProcessingError: null }).where(eq(evaluations.id, evaluation.id));
          await db.insert(evaluationReviewEvents).values({ evaluationId: evaluation.id, adminEmail: admin.email, action: "preparation_restarted", note: input.reason });
          return { success: true };
        } catch {
          await db.update(evaluations).set({ aiProcessingError: "Brouillon préparatoire indisponible ; revue manuelle requise." }).where(eq(evaluations.id, evaluation.id));
          await db.insert(evaluationReviewEvents).values({ evaluationId: evaluation.id, adminEmail: admin.email, action: "preparation_retry_unavailable", note: input.reason });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le brouillon n’a pas pu être préparé. La revue manuelle reste disponible." });
        }
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
