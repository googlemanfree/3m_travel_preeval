import { TRPCError } from "@trpc/server";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { evaluations } from "../../drizzle/schema";
import { isGridApproved } from "../../shared/bilanAuto/grid";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { configFromEnv, correctRun, eraseBilanData, processOutbox, publishRun, submitForAnalysis } from "../services/bilanAuto/pipeline";
import { renderHtml, renderText } from "../services/bilanAuto/report";
import { RUN_STATE_LABELS, type RunRecord, type RunState } from "../services/bilanAuto/types";
import { bilanAutoTick, getProductionDeps } from "../services/bilanAuto/runtime";
import { requireValidAdminSession } from "./adminAuth";

/**
 * Supervision du bilan automatisé (administrateur). Le bilan « prêt » est validé ici avant publication (mode par défaut) ;
 * l'administrateur peut aussi corriger avec traçabilité, relancer un traitement et lire erreurs, sources et justifications.
 */
const token = z.object({ sessionToken: z.string().min(1).max(512) });

export const BILAN_FILTERS = ["pret", "complement", "incident", "en_cours", "publie", "tous"] as const;
export type BilanFilter = (typeof BILAN_FILTERS)[number];

const FILTER_STATES: Record<Exclude<BilanFilter, "tous" | "pret">, RunState[]> = {
  complement: ["needs_information"],
  incident: ["failed", "retry_pending"],
  en_cours: ["queued", "received", "extracting", "researching", "scoring", "generating", "quality_check"],
  publie: ["published"],
};

export function matchesFilter(run: Pick<RunRecord, "state" | "mode">, filter: BilanFilter): boolean {
  if (filter === "tous") return run.state !== "superseded";
  if (filter === "pret") return run.state === "ready_for_review" && run.mode !== "simulation";
  return FILTER_STATES[filter].includes(run.state);
}

async function requireDeps() {
  const deps = await getProductionDeps();
  if (!deps) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le bilan automatisé n'est pas activé (BILAN_AUTO_ENABLED) ou la base est indisponible." });
  return deps;
}

export function summarize(run: RunRecord, person: { fullName: string; email: string } | undefined) {
  return {
    id: run.id, evaluationId: run.evaluationId, candidateId: run.candidateId, dossierRef: run.dossierRef, fullName: person?.fullName ?? "—", email: person?.email ?? "",
    state: run.state, stateLabel: RUN_STATE_LABELS[run.state], mode: run.mode, reviewStatus: run.reviewStatus, outcome: run.outcome,
    score: run.score, scoreMax: run.scoreMax, thresholdReached: run.thresholdReached, attempts: run.attempts, maxAttempts: run.maxAttempts, lastError: run.lastError,
    notificationState: run.notificationState, complementCount: run.complement?.length ?? 0, flagCount: run.flags.length, rubricVersion: run.rubricVersion,
    createdAt: run.createdAt.toISOString(), updatedAt: run.updatedAt.toISOString(), publishedAt: run.publishedAt?.toISOString() ?? null,
  };
}

export const adminBilanAutoRouter = router({
  /** État d'exploitation, sans aucun secret. */
  status: publicProcedure.input(token).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const config = configFromEnv();
    return {
      enabled: config.enabled, mode: config.mode, notificationsEnabled: config.notificationsEnabled, gridVersion: config.grid.version,
      gridApproved: isGridApproved(config.grid), threshold: config.grid.threshold, allowlistActive: Boolean(config.allowlistEmails),
      visionEnabled: process.env.BILAN_AUTO_VISION_ENABLED === "true",
    };
  }),

  /** Dossiers par statut (filtre « bilan prêt » compris) avec les compteurs de chaque filtre. */
  list: publicProcedure.input(token.extend({ filter: z.enum(BILAN_FILTERS).default("pret"), search: z.string().trim().max(120).optional() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const config = configFromEnv();
    if (!config.enabled) return { enabled: false as const, counts: {} as Record<string, number>, rows: [] };
    const deps = await requireDeps();
    const all = await deps.store.listRuns({ limit: 500 });
    const latestByEvaluation = new Map<number, RunRecord>();
    for (const run of all) if (!latestByEvaluation.has(run.evaluationId)) latestByEvaluation.set(run.evaluationId, run);
    const latest = Array.from(latestByEvaluation.values());
    const counts = Object.fromEntries(BILAN_FILTERS.map((filter) => [filter, latest.filter((run) => matchesFilter(run, filter)).length])) as Record<BilanFilter, number>;
    const selected = latest.filter((run) => matchesFilter(run, input.filter));
    const db = await getDb();
    const people = new Map<number, { fullName: string; email: string }>();
    if (db && selected.length > 0) {
      const rows = await db.select({ id: evaluations.id, fullName: evaluations.fullName, email: evaluations.email }).from(evaluations).where(inArray(evaluations.id, selected.map((run) => run.evaluationId)));
      for (const row of rows) people.set(row.id, { fullName: row.fullName, email: row.email });
    }
    const needle = input.search?.toLowerCase();
    const rows = selected
      .map((run) => summarize(run, people.get(run.evaluationId)))
      .filter((row) => !needle || `${row.fullName} ${row.email} ${row.dossierRef ?? ""}`.toLowerCase().includes(needle));
    return { enabled: true as const, counts, rows };
  }),

  /** Détail : bilan, notes expliquées, faits et provenance, orientations et sources, journal, notifications. */
  get: publicProcedure.input(token.extend({ runId: z.number().int().positive() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    const run = await deps.store.getRun(input.runId);
    if (!run) throw new TRPCError({ code: "NOT_FOUND", message: "Traitement introuvable." });
    const [events, outbox] = await Promise.all([deps.store.listEvents(run.id), deps.store.listOutbox(run.id)]);
    return {
      run: { ...summarize(run, undefined), report: run.report, scoreResult: run.scoreResult, orientations: run.orientations, previous: run.previous, flags: run.flags, complement: run.complement, facts: run.facts, inputSnapshot: { ...run.inputSnapshot, form: undefined }, reportHash: run.reportHash },
      text: run.report ? renderText(run.report) : null,
      html: run.report ? renderHtml(run.report) : null,
      events: events.map((event) => ({ actor: event.actor, action: event.action, detail: event.detail, at: event.at.toISOString() })),
      notifications: outbox.map((entry) => ({ kind: entry.kind, state: entry.state, attempts: entry.attempts, lastError: entry.lastError })),
    };
  }),

  /** Validation administrateur : publie la version exacte du bilan prêt, puis met la notification en file (une seule fois). */
  validate: publicProcedure.input(token.extend({ runId: z.number().int().positive() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    const result = await publishRun(deps, input.runId, admin.email);
    if ("error" in result) throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
    await processOutbox(deps).catch(() => undefined);
    return { published: true, alreadyPublished: result.alreadyPublished };
  }),

  correct: publicProcedure
    .input(token.extend({ runId: z.number().int().positive(), rubric: z.string().max(40), subCriterion: z.string().max(40), points: z.number().int().min(0).max(20), justification: z.string().trim().min(10).max(600) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const deps = await requireDeps();
      const result = await correctRun(deps, input.runId, admin.email, { rubric: input.rubric, subCriterion: input.subCriterion, points: input.points, justification: input.justification });
      if ("error" in result) throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      return { score: result.run.score, reviewStatus: result.run.reviewStatus };
    }),

  /** Relance une nouvelle version (après correction du dossier ou incident résolu). */
  relaunch: publicProcedure.input(token.extend({ evaluationId: z.number().int().positive() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    const result = await submitForAnalysis(deps, input.evaluationId, { force: true, actor: admin.email });
    if (result.status !== "queued") throw new TRPCError({ code: "BAD_REQUEST", message: "Relance impossible : " + ("reason" in result ? result.reason : "traitement déjà existant.") });
    return { runId: result.run.id };
  }),

  /** Exécute un cycle immédiatement (utile pour les dossiers de test sans attendre le prochain passage). */
  runNow: publicProcedure.input(token).mutation(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    if (!configFromEnv().enabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le bilan automatisé n'est pas activé." });
    return bilanAutoTick();
  }),

  /** Demande de suppression traitée par l'agence : efface les données de bilan du candidat. Irréversible, confirmation explicite. */
  eraseCandidateData: publicProcedure.input(token.extend({ candidateId: z.number().int().positive(), confirm: z.literal("SUPPRIMER") })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    const result = await eraseBilanData(deps, input.candidateId, admin.email);
    return { ...result, note: "Les fichiers PDF listés doivent aussi être retirés du stockage (le service de stockage actuel n'expose pas de suppression)." };
  }),
});
