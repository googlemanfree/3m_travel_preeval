/**
 * Routeur tRPC — Gestion IA des évaluations (vue unifiée admin)
 *
 * Regroupe toutes les évaluations (générales, Luxembourg, visa études,
 * consultations avec CV) en une seule liste, avec une priorité et une
 * action suggérée calculées automatiquement — pour aider les admins à
 * savoir qui recontacter en premier, sans avoir à ouvrir 4 tableaux de bord
 * séparés.
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { evaluations, luxembourgEvaluations, studyVisaEvaluations, consultationRequests, applications } from "../../drizzle/schema";
import { requireValidAdminSession } from "./adminAuth";

type Priority = "haute" | "moyenne" | "basse";

interface UnifiedItem {
  id: string; // préfixé par type pour rester unique tous systèmes confondus
  type: "evaluation" | "luxembourg" | "etudes" | "consultation";
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
}

function computePriority(args: { score: number | null; hasConverted: boolean; ageHours: number; needsAdminAction: boolean }): { priority: Priority; suggestedAction: string } {
  if (args.hasConverted) {
    return { priority: "basse", suggestedAction: "Déjà converti en dossier — suivi normal" };
  }
  if (args.needsAdminAction) {
    return { priority: "haute", suggestedAction: "Action admin requise (validation en attente)" };
  }
  if (args.score !== null && args.score >= 70 && args.ageHours > 24) {
    return { priority: "haute", suggestedAction: "Profil très favorable non recontacté depuis 24h — relancer en priorité" };
  }
  if (args.score !== null && args.score >= 70) {
    return { priority: "moyenne", suggestedAction: "Profil favorable — prévoir un contact rapide" };
  }
  if (args.score !== null && args.score < 45) {
    return { priority: "basse", suggestedAction: "Profil à renforcer — orientation ou formation complémentaire à proposer" };
  }
  return { priority: "moyenne", suggestedAction: "À examiner" };
}

export const aiEvaluationManagementRouter = router({
  getUnifiedDashboard: publicProcedure
    .input(z.object({ sessionToken: z.string(), limit: z.number().min(1).max(200).default(100) }))
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
          id: `evaluation-${e.id}`,
          type: "evaluation",
          typeLabel: "Pré-évaluation",
          fullName: e.fullName,
          email: e.email,
          createdAt: e.createdAt,
          score: null,
          hasConverted,
          priority,
          suggestedAction,
          destinationCategory: e.destinationCategory,
          destinationCountry: e.destinationCountry,
          nationality: e.nationality,
          educationLevel: e.educationLevel,
          employmentStatus: e.employmentStatus,
          maritalStatus: e.maritalStatus,
          status: e.status,
          priorVisaRefusal: e.priorVisaRefusal,
          criminalRecord: e.criminalRecord,
          familyAbroad: e.familyAbroad,
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
        items.push({ id: `consultation-${c.id}`, type: "consultation", typeLabel: "Consultation + CV", fullName: c.fullName, email: c.email, createdAt: c.createdAt, score: null, hasConverted, priority, suggestedAction });
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
});
