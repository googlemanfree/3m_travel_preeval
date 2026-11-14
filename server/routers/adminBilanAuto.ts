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
import { EditorialError, changeScore, compareReports, ensureBaseVersion, notifyPublished, publishVersion, saveDraft } from "../services/bilanAuto/versions";
import { parseEditableText, sectionsToEditableText } from "../../shared/bilanAuto/editableText";
import { renderPdf } from "../services/bilanAuto/reportPdf";
import { toClientReport } from "../services/bilanAuto/dbAdapters";
import { DrizzleSourcesStore, SourceInputSchema } from "../services/bilanAuto/sources";
import { ensureBilanAutoTables } from "../services/bilanAuto/schemaGuard";

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

const editorial = async <T,>(action: () => Promise<T>): Promise<T> => {
  try { return await action(); } catch (error) {
    if (error instanceof EditorialError) throw new TRPCError({ code: "BAD_REQUEST", message: error.problems.length ? `${error.message} ${error.problems.join(" · ")}` : error.message });
    throw error;
  }
};
const sectionInput = z.object({ id: z.string().max(40), title: z.string().max(200), paragraphs: z.array(z.string().max(4000)).max(60), bullets: z.array(z.string().max(2000)).max(60) });

const versionMeta = (version: { versionNumber: number; authorKind: string; author: string; reason: string | null; status: string; baseVersion: number | null; reportHash: string; pdfKey: string | null; publishedAt: Date | null; publishedBy: string | null; notifiedAt: Date | null; createdAt: Date; updatedAt: Date }) => ({
  versionNumber: version.versionNumber, authorKind: version.authorKind, author: version.author, reason: version.reason, status: version.status, baseVersion: version.baseVersion, reportHash: version.reportHash.slice(0, 12),
  hasPdf: Boolean(version.pdfKey), publishedAt: version.publishedAt?.toISOString() ?? null, publishedBy: version.publishedBy, notified: Boolean(version.notifiedAt), createdAt: version.createdAt.toISOString(), updatedAt: version.updatedAt.toISOString(),
});

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

async function sourcesStore() {
  if (!configFromEnv().enabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le bilan automatisé n'est pas activé." });
  const db = await getDb();
  if (!db || !(await ensureBilanAutoTables())) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return new DrizzleSourcesStore(db);
}

export const adminBilanAutoRouter = router({
  /** Référentiel des sources (offres, repères salariaux) saisies par l'agence. */
  listSources: publicProcedure.input(token).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const entries = await (await sourcesStore()).list();
    return entries.map((entry) => ({ ...entry, createdAt: entry.createdAt.toISOString() }));
  }),
  createSource: publicProcedure.input(token.extend({ source: SourceInputSchema })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const src = input.source;
    const created = await (await sourcesStore()).create({ ...src, employer: src.employer ?? null, city: src.city ?? null, amountMin: src.amountMin ?? null, amountMax: src.amountMax ?? null, currency: src.currency ?? null, period: src.period ?? null, grossOrNet: src.grossOrNet ?? null, geography: src.geography ?? null, createdBy: admin.email });
    return { id: created.id };
  }),
  setSourceActive: publicProcedure.input(token.extend({ id: z.number().int().positive(), active: z.boolean() })).mutation(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    await (await sourcesStore()).setActive(input.id, input.active);
    return { ok: true };
  }),
  deleteSource: publicProcedure.input(token.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    await (await sourcesStore()).remove(input.id);
    return { ok: true };
  }),

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

  // ── Éditeur du bilan : brouillons, notes contrôlées, aperçu, publication, historique ───────────────────────────────

  /** État de l'éditeur : version de travail (dernière non remplacée), historique, textes à copier, autres traitements corrigés du même dossier. */
  editor: publicProcedure.input(token.extend({ runId: z.number().int().positive() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    return editorial(async () => {
      const run = await deps.store.getRun(input.runId);
      if (!run || !run.report) throw new EditorialError("Ce traitement n'a pas encore de bilan rédigé.");
      const base = run.mode === "simulation" ? null : await ensureBaseVersion(deps, run);
      const versions = await deps.store.listVersions(run.id);
      const current = [...versions].reverse().find((entry) => entry.status !== "remplacee") ?? base;
      const report = current?.report ?? run.report;
      const others = (await deps.store.listRuns({ evaluationId: run.evaluationId, limit: 20 })).filter((other) => other.id !== run.id && other.state !== "superseded");
      return {
        run: summarize(run, undefined),
        editable: run.mode !== "simulation" && ["ready_for_review", "published"].includes(run.state),
        currentVersion: current ? versionMeta(current) : null,
        versions: versions.map(versionMeta),
        sections: report.sections,
        score: current?.scoreResult ?? run.scoreResult,
        plainText: renderText(report),
        html: renderHtml(report),
        editableText: sectionsToEditableText(report.sections),
        otherRuns: others.map((other) => ({ id: other.id, state: other.state, stateLabel: RUN_STATE_LABELS[other.state], createdAt: other.createdAt.toISOString() })),
      };
    });
  }),

  saveDraft: publicProcedure.input(token.extend({ runId: z.number().int().positive(), sections: z.array(sectionInput).max(40), reason: z.string().trim().max(300).optional() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    return editorial(async () => versionMeta(await saveDraft(deps, input.runId, admin.email, { sections: input.sections, reason: input.reason })));
  }),

  /** Mode « texte simple » : le texte est relu section par section puis enregistré comme un brouillon. */
  saveDraftText: publicProcedure.input(token.extend({ runId: z.number().int().positive(), text: z.string().max(120_000), reason: z.string().trim().max(300).optional() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    return editorial(async () => {
      const run = await deps.store.getRun(input.runId);
      if (!run) throw new EditorialError("Traitement introuvable.");
      const base = await ensureBaseVersion(deps, run);
      const versions = await deps.store.listVersions(run.id);
      const current = [...versions].reverse().find((entry) => entry.status !== "remplacee") ?? base;
      const unlocked = current.report.sections.filter((section) => !section.locked);
      const parsed = parseEditableText(input.text, unlocked.length);
      if (parsed.ok === false) throw new EditorialError(parsed.error);
      return versionMeta(await saveDraft(deps, input.runId, admin.email, { sections: parsed.sections.map((section, index) => ({ id: unlocked[index].id, ...section })), reason: input.reason }));
    });
  }),

  changeScore: publicProcedure.input(token.extend({ runId: z.number().int().positive(), rubric: z.string().max(40), subCriterion: z.string().max(40), points: z.number().int().min(0).max(20), justification: z.string().trim().min(10).max(600) })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    return editorial(async () => {
      const version = await changeScore(deps, input.runId, admin.email, { rubric: input.rubric, subCriterion: input.subCriterion, points: input.points, justification: input.justification });
      return { ...versionMeta(version), score: version.report.score, verdict: version.report.verdictLabel };
    });
  }),

  /** Aperçu tel que le candidat le verra (sans le publier). */
  preview: publicProcedure.input(token.extend({ runId: z.number().int().positive(), versionNumber: z.number().int().positive().optional() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    return editorial(async () => {
      const run = await deps.store.getRun(input.runId);
      if (!run) throw new EditorialError("Traitement introuvable.");
      const versions = await deps.store.listVersions(run.id);
      const version = input.versionNumber ? versions.find((entry) => entry.versionNumber === input.versionNumber) : [...versions].reverse().find((entry) => entry.status !== "remplacee");
      if (!version) throw new EditorialError("Version introuvable.");
      return { report: toClientReport(version.report, { id: run.id, scoreResult: version.scoreResult, orientations: run.orientations, validatedBy: version.authorKind === "admin" ? version.author : run.validatedBy }, true, deps.now().toISOString().slice(0, 10)), status: version.status };
    });
  }),

  /** Publication d'une version : « sans notification » ou « et notifier » (jamais d'e-mail à l'enregistrement). */
  publishVersion: publicProcedure.input(token.extend({ runId: z.number().int().positive(), versionNumber: z.number().int().positive(), notify: z.boolean() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    const result = await editorial(() => publishVersion(deps, input.runId, input.versionNumber, admin.email, { notify: input.notify }));
    if (input.notify) await processOutbox(deps).catch(() => undefined);
    return { versionNumber: result.version.versionNumber, notified: result.notified, alreadyPublished: result.alreadyPublished };
  }),

  notifyCandidate: publicProcedure.input(token.extend({ runId: z.number().int().positive() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    const result = await editorial(() => notifyPublished(deps, input.runId, admin.email));
    await processOutbox(deps).catch(() => undefined);
    return result;
  }),

  /** Comparaison de deux versions du même traitement, ou d'une version avec la proposition d'un autre traitement du dossier. */
  compare: publicProcedure.input(token.extend({ runId: z.number().int().positive(), fromVersion: z.number().int().positive(), toVersion: z.number().int().positive().optional(), otherRunId: z.number().int().positive().optional() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    return editorial(async () => {
      const versions = await deps.store.listVersions(input.runId);
      const from = versions.find((entry) => entry.versionNumber === input.fromVersion);
      if (!from) throw new EditorialError("Version introuvable.");
      let to = input.toVersion ? versions.find((entry) => entry.versionNumber === input.toVersion) : undefined;
      if (input.otherRunId) {
        const other = await deps.store.getRun(input.otherRunId);
        if (!other || other.evaluationId !== from.evaluationId) throw new EditorialError("Ce traitement n'appartient pas au même dossier.");
        const otherVersions = await deps.store.listVersions(other.id);
        to = otherVersions[otherVersions.length - 1] ?? (other.report ? ({ report: other.report } as never) : undefined);
      }
      if (!to) throw new EditorialError("Version à comparer introuvable.");
      return { diff: compareReports(from.report, to.report) };
    });
  }),

  /** Télécharge le PDF d'une version : celui qui a été publié, ou un aperçu marqué « brouillon » pour une version non publiée. */
  downloadPdf: publicProcedure.input(token.extend({ runId: z.number().int().positive(), versionNumber: z.number().int().positive().optional() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const deps = await requireDeps();
    return editorial(async () => {
      const run = await deps.store.getRun(input.runId);
      if (!run) throw new EditorialError("Traitement introuvable.");
      const versions = await deps.store.listVersions(run.id);
      const version = input.versionNumber ? versions.find((entry) => entry.versionNumber === input.versionNumber) : [...versions].reverse().find((entry) => entry.status !== "remplacee");
      if (!version) throw new EditorialError("Version introuvable.");
      const bytes = await renderPdf(version.report, { draft: version.status === "brouillon" });
      return { fileName: `bilan-${run.dossierRef ?? run.evaluationId}-v${version.versionNumber}${version.status === "brouillon" ? "-brouillon" : ""}.pdf`, base64: bytes.toString("base64"), draft: version.status === "brouillon" };
    });
  }),
});
