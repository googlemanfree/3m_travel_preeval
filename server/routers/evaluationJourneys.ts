import { TRPCError } from "@trpc/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { evaluations } from "../../drizzle/schema";
import { buildClientPlan } from "../../shared/dynamicForm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireValidAdminSession } from "./adminAuth";

const SCAN_LIMIT = 1000;
const ITEMS_LIMIT = 120;

const tally = <T>(rows: T[], keyOf: (row: T) => string | null, labelOf: (row: T) => string = (row) => String(keyOf(row))) => {
  const counts = new Map<string, { label: string; count: number }>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!key) continue;
    const current = counts.get(key);
    if (current) current.count += 1;
    else counts.set(key, { label: labelOf(row), count: 1 });
  }
  return Array.from(counts, ([key, value]) => ({ key, label: value.label, count: value.count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));
};

const parseDetails = (json: string | null): Record<string, unknown> | null => {
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

/**
 * Pilotage des évaluations par parcours : pays, visa ou programme, domaine, complétude et points à clarifier.
 * Lecture seule, réservée à l'administration ; les anciennes évaluations (sans parcours) sont comptées à part.
 */
export const evaluationJourneysRouter = router({
  adminOverview: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1).max(512),
      country: z.string().trim().max(100).optional(),
      programFamily: z.string().trim().max(60).optional(),
      domainId: z.string().trim().max(40).optional(),
      flaggedOnly: z.boolean().optional(),
      incompleteOnly: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const rows = await db.select({
        id: evaluations.id, referenceCode: evaluations.referenceCode, fullName: evaluations.fullName, status: evaluations.status, createdAt: evaluations.createdAt,
        destinationCountry: evaluations.destinationCountry, projectType: evaluations.projectType, projectDetailsJson: evaluations.projectDetailsJson,
        educationLevel: evaluations.educationLevel, frenchLevel: evaluations.frenchLevel, englishLevel: evaluations.englishLevel,
      }).from(evaluations).orderBy(desc(evaluations.createdAt)).limit(SCAN_LIMIT);

      const analysed = rows.map((row) => {
        const details = parseDetails(row.projectDetailsJson);
        const plan = details ? buildClientPlan({ projectType: row.projectType, country: row.destinationCountry, details, columns: { educationLevel: row.educationLevel ?? "", frenchLevel: row.frenchLevel ?? "", englishLevel: row.englishLevel ?? "" } }) : null;
        return {
          row,
          plan,
          programId: typeof details?.programId === "string" ? details.programId : null,
          programFamily: typeof details?.programFamily === "string" ? details.programFamily : null,
          domainId: typeof details?.domainId === "string" ? details.domainId : null,
        };
      });
      const dynamic = analysed.filter((entry) => entry.plan);

      const filtered = dynamic.filter((entry) =>
        (!input.country || (entry.row.destinationCountry ?? "") === input.country)
        && (!input.programFamily || entry.programFamily === input.programFamily)
        && (!input.domainId || entry.domainId === input.domainId)
        && (!input.flaggedOnly || (entry.plan?.flags.length ?? 0) > 0)
        && (!input.incompleteOnly || (entry.plan?.completeness.missingRequired.length ?? 0) > 0));

      const average = dynamic.length ? Math.round(dynamic.reduce((sum, entry) => sum + (entry.plan?.completeness.percent ?? 0), 0) / dynamic.length) : 0;
      return {
        scanned: rows.length,
        dynamicCount: dynamic.length,
        legacyCount: rows.length - dynamic.length,
        averageCompleteness: average,
        flaggedCount: dynamic.filter((entry) => (entry.plan?.flags.length ?? 0) > 0).length,
        incompleteCount: dynamic.filter((entry) => (entry.plan?.completeness.missingRequired.length ?? 0) > 0).length,
        byCountry: tally(dynamic, (entry) => entry.row.destinationCountry?.trim() || null).slice(0, 25),
        byProgram: tally(dynamic, (entry) => entry.programFamily, (entry) => entry.plan?.programLabel ?? entry.programFamily ?? "").slice(0, 25),
        byDomain: tally(dynamic, (entry) => entry.domainId, (entry) => entry.plan?.domainLabel ?? entry.domainId ?? "").slice(0, 15),
        matching: filtered.length,
        items: filtered.slice(0, ITEMS_LIMIT).map(({ row, plan }) => ({
          id: row.id,
          reference: row.referenceCode,
          fullName: row.fullName,
          status: row.status,
          createdAt: row.createdAt,
          country: row.destinationCountry,
          projectType: row.projectType,
          programLabel: plan?.programLabel ?? "",
          domainLabel: plan?.domainLabel ?? null,
          completeness: plan?.completeness.percent ?? 0,
          missingRequired: plan?.completeness.missingRequired.length ?? 0,
          flags: (plan?.flags ?? []).map((flag) => flag.message),
          firstAction: plan?.staffActions[0]?.text ?? null,
        })),
      };
    }),
});
