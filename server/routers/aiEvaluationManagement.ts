
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
  luxembourgEvaluations,
  studyVisaEvaluations,
  consultationRequests,
  applications,
} from "../../drizzle/schema";
import { requireValidAdminSession } from "./adminAuth";

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
        const { priority, suggestedAction } = computePriority({ score: null, hasConverted, ageHours: ageHours(e.createdAt), needsAdminAction: false });
        items.push({
          id: `evaluation-${e.id}`, type: "evaluation", typeLabel: "Pré-évaluation", fullName: e.fullName, email: e.email,
          createdAt: e.createdAt, score: null, hasConverted, priority, suggestedAction,
          destinationCategory: e.destinationCategory, destinationCountry: e.destinationCountry, nationality: e.nationality,
          educationLevel: e.educationLevel, employmentStatus: e.employmentStatus, maritalStatus: e.maritalStatus,
          status: e.status, priorVisaRefusal: e.priorVisaRefusal, criminalRecord: e.criminalRecord, familyAbroad: e.familyAbroad,
          acquisitionSource: e.acquisitionSource, acquisitionCampaign: e.acquisitionCampaign,
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
        const allowed = ["pending", "reviewed", "contacted", "closed"] as const;
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
