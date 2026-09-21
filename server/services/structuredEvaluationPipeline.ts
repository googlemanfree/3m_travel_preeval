import { eq } from "drizzle-orm";
import { evaluations } from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import { getDb } from "../db";
import { ValidationFlowError, ensureCase, recordAiDraft, type Mailer, type ValidationCase, type ValidationDeps } from "./evaluationValidationCore";
import { getValidationStore, isMissingTableError } from "./evaluationValidationStore";
import { NO_CONSENT_MESSAGE, generateStructuredDraft, hasAnalysisConsent, type EvaluationRowForDraft, type StructuredDraftDeps } from "./structuredEvaluationDraft";

/**
 * Câblage de production de l'évaluation structurée : e-mail SMTP, base de données, génération IA.
 * L'ouverture du dossier à la soumission ne doit JAMAIS faire échouer la soumission du candidat.
 */

/** Adaptateur SMTP : `sendEmail` n'envoie que du HTML et lève une erreur en cas d'échec. */
export const smtpMailer: Mailer = {
  async send(message) {
    await sendEmail({ to: message.to, subject: message.subject, html: message.html });
  },
};

/**
 * Lien sécurisé du message : l'espace candidat (`/mon-espace`), protégé par la connexion — jamais un lien vers
 * un brouillon. Attention : `/evaluation` est le FORMULAIRE d'évaluation, pas l'espace où le rapport est publié.
 */
export function defaultPortalUrl(): string {
  return `${(process.env.SITE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "")}/mon-espace`;
}

export async function buildDefaultDeps(): Promise<ValidationDeps | null> {
  const store = await getValidationStore();
  return store ? { store, mailer: smtpMailer, now: () => new Date(), portalUrl: defaultPortalUrl() } : null;
}

export async function loadEvaluationRow(evaluationId: number): Promise<EvaluationRowForDraft | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(evaluations).where(eq(evaluations.id, evaluationId)).limit(1);
  return row ?? null;
}

export type AiDraftRunOptions = {
  loadRow?: (evaluationId: number) => Promise<EvaluationRowForDraft | null>;
  generator?: StructuredDraftDeps;
  /** Demande explicite d'un administrateur : l'absence de consentement lui est signalée au lieu d'être ignorée. */
  explicit?: boolean;
  /** Appelée juste avant l'appel (payant) au modèle ; renvoie false pour l'annuler (plafond de débit). */
  beforeGenerate?: () => boolean;
};

// ── Coût maîtrisé : une seule analyse à la fois par évaluation, et un plafond de débit pour les analyses automatiques ──

const inFlight = new Map<number, Promise<ValidationCase>>();

const BACKGROUND_WINDOW_MS = 60_000;
/** Analyses automatiques (déclenchées par une soumission publique) autorisées par minute et par processus. */
export const BACKGROUND_MAX_RUNS_PER_WINDOW = 20;
let backgroundRuns: number[] = [];

/** Plafond de débit des analyses déclenchées par les soumissions : borne la dépense même sous une rafale de demandes. */
export function allowBackgroundAnalysis(nowMs: number): boolean {
  backgroundRuns = backgroundRuns.filter((startedAt) => nowMs - startedAt < BACKGROUND_WINDOW_MS);
  if (backgroundRuns.length >= BACKGROUND_MAX_RUNS_PER_WINDOW) return false;
  backgroundRuns.push(nowMs);
  return true;
}

export function resetBackgroundAnalysisLimiter() {
  backgroundRuns = [];
  inFlight.clear();
}

async function runAiDraftOnce(deps: ValidationDeps, evaluationId: number, options: AiDraftRunOptions): Promise<ValidationCase> {
  const current = await ensureCase(deps, evaluationId);
  const canGenerate = !current.aiDraft && (current.workflowStatus === "dossier_recu" || current.workflowStatus === "attente_validation_admin");
  if (!canGenerate) return current;
  const row = await (options.loadRow ?? loadEvaluationRow)(evaluationId);
  if (!row) return current;
  if (!hasAnalysisConsent(row)) {
    if (options.explicit) throw new ValidationFlowError("INVALID_STATE", NO_CONSENT_MESSAGE);
    return current;
  }
  if (options.beforeGenerate && !options.beforeGenerate()) {
    console.warn("[structuredEvaluation] plafond de débit atteint : analyse automatique différée (l’administrateur peut la lancer)", { evaluationId });
    return current;
  }
  const outcome = await generateStructuredDraft(row, deps.now(), options.generator);
  return recordAiDraft(deps, evaluationId, outcome);
}

/**
 * Génère et enregistre le brouillon IA (interne). Sans effet si un brouillon existe déjà ou si le dossier
 * a dépassé l'étape « en attente de validation » : aucun appel au modèle n'est alors facturé. Sans le
 * consentement du candidat à l'analyse IA, le modèle n'est jamais appelé (la revue reste manuelle). Deux
 * demandes simultanées pour la même évaluation (soumission + clic d'un administrateur) partagent UNE analyse.
 */
export function runAiDraft(deps: ValidationDeps, evaluationId: number, options: AiDraftRunOptions = {}): Promise<ValidationCase> {
  const existing = inFlight.get(evaluationId);
  if (existing) return existing;
  const running = runAiDraftOnce(deps, evaluationId, options).finally(() => {
    inFlight.delete(evaluationId);
  });
  inFlight.set(evaluationId, running);
  return running;
}

/**
 * Appelé à la soumission d'une évaluation : crée le dossier « DOSSIER REÇU » tout de suite, puis lance
 * l'analyse IA en arrière-plan. Ne lève jamais (la soumission du candidat prime) ; sans la migration 0072,
 * le site continue avec l'ancien parcours.
 */
export async function openStructuredEvaluation(evaluationId: number, options: { background?: boolean; deps?: ValidationDeps | null; run?: AiDraftRunOptions } = {}): Promise<void> {
  try {
    const deps = options.deps === undefined ? await buildDefaultDeps() : options.deps;
    if (!deps) return;
    await ensureCase(deps, evaluationId);
    // le plafond de débit ne s'applique qu'aux analyses AUTOMATIQUES (jamais à un clic d'administrateur)
    const analysis = runAiDraft(deps, evaluationId, { beforeGenerate: () => allowBackgroundAnalysis(deps.now().getTime()), ...options.run }).catch((error) => {
      if (!isMissingTableError(error)) console.error("[structuredEvaluation] analyse IA en échec", { evaluationId, error: error instanceof Error ? error.message : error });
    });
    if (options.background === false) await analysis;
  } catch (error) {
    if (!isMissingTableError(error)) console.error("[structuredEvaluation] ouverture du dossier en échec", { evaluationId, error: error instanceof Error ? error.message : error });
  }
}
