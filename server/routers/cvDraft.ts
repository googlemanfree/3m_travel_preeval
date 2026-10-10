import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminActivityLogs, evaluations } from "../../drizzle/schema";
import { CV_LANGUAGES, CV_STYLES, CV_STYLE_KEYS, styleForCountry, type CvIdentity, type CvLanguage, type CvStyleKey } from "../../shared/cvDraft";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { generateCvDraft, type CvDraftDeps, type CvDraftOutcome } from "../services/cvDraftGenerator";
import { priorityCountryOf, type EvaluationRowForDraft } from "../services/structuredEvaluationDraft";
import { requireValidAdminSession } from "./adminAuth";

export type CvDraftRow = EvaluationRowForDraft & { email?: string | null; phone?: string | null };

export type CvDraftRouterPorts = {
  requireAdmin: (sessionToken: string) => Promise<{ email: string }>;
  loadRow: (evaluationId: number) => Promise<CvDraftRow | null>;
  generate: (row: CvDraftRow, options: { style: CvStyleKey; language: CvLanguage }) => Promise<CvDraftOutcome>;
  logExport: (entry: { adminEmail: string; evaluationId: number; style: CvStyleKey }) => Promise<void>;
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

export const productionPorts: CvDraftRouterPorts = {
  requireAdmin: (sessionToken) => requireValidAdminSession(sessionToken),
  async loadRow(evaluationId) {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const [row] = await db.select().from(evaluations).where(eq(evaluations.id, evaluationId)).limit(1);
    return row ?? null;
  },
  generate: (row, options) => generateCvDraft(row, options, {} satisfies CvDraftDeps),
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
  now: () => Date.now(),
};

const adminInput = z.object({ sessionToken: z.string().min(1), evaluationId: z.number().int().positive() });

export function createCvDraftRouter(ports: CvDraftRouterPorts) {
  const allow = createCvDraftLimiter();
  return router({
    /** Brouillon de CV tiré du CV que le candidat a envoyé pour son évaluation (administrateur uniquement). */
    generate: publicProcedure
      .input(adminInput.extend({ style: z.enum(CV_STYLE_KEYS).optional(), language: z.enum(CV_LANGUAGES).optional() }))
      .mutation(async ({ input }) => {
        const admin = await ports.requireAdmin(input.sessionToken);
        if (!allow(admin.email.toLowerCase(), ports.now())) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Limite atteinte : ${CV_DRAFT_MAX_PER_HOUR} brouillons de CV par heure. Réessayez plus tard.` });
        }
        const row = await ports.loadRow(input.evaluationId);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
        const style = input.style ?? styleForCountry(priorityCountryOf(row));
        const language = input.language ?? CV_STYLES[style].defaultLanguage;
        const outcome = await ports.generate(row, { style, language });
        const identity: CvIdentity = { fullName: row.fullName, email: row.email ?? null, phone: row.phone ?? null, city: row.cityOfResidence ?? null, nationality: row.nationality ?? null };
        // aucune donnée du CV dans le journal : seulement qui, quel dossier, quel résultat
        console.info("[cvDraft] génération", { evaluationId: input.evaluationId, admin: admin.email, style, language, ok: outcome.ok, ...(outcome.ok === false ? { reason: outcome.reason } : {}) });
        return { style, language, identity, outcome };
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
