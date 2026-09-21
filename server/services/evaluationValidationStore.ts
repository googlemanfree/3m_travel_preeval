import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import {
  evaluationReviewEvents,
  evaluationValidationCases,
  evaluationValidationChanges,
  evaluations,
  type EvaluationValidationCase,
  type InsertEvaluationValidationCase,
} from "../../drizzle/schema";
import { AdminEvaluationVersionSchema, AiEvaluationDraftSchema, WORKFLOW_STATUSES, type ClientReport, type WorkflowStatus } from "../../shared/evaluationValidation";
import { getDb } from "../db";
import type {
  AiDraftWarning,
  EvaluationContext,
  FieldChangeRecord,
  InfoRequest,
  NewValidationCase,
  TransitionEffects,
  ValidationCase,
  UpdateGuard,
  ValidationCasePatch,
  ValidationStore,
} from "./evaluationValidationCore";
import { versionStamp } from "./evaluationValidationCore";

/**
 * Store Drizzle de l'évaluation à validation administrateur. Toutes les écritures d'une transition
 * (état + historique champ par champ + journal d'audit + miroir hérité) se font dans UNE transaction,
 * et le changement d'état est un compare-and-set sous verrou de ligne : deux administrateurs ne
 * peuvent pas publier (ni notifier) la même version en même temps.
 */

// ── Erreurs SQL ──────────────────────────────────────────────────────────────

/** L'erreur et ses `cause` imbriquées (Drizzle enveloppe l'erreur mysql2 d'origine). */
function causes(error: unknown): Array<Record<string, unknown>> {
  const chain: Array<Record<string, unknown>> = [];
  let current: unknown = error;
  for (let depth = 0; current && typeof current === "object" && depth < 6; depth++) {
    chain.push(current as Record<string, unknown>);
    current = (current as { cause?: unknown }).cause;
  }
  return chain;
}

/**
 * Les tables de la validation structurée n'existent pas encore (migration 0072 non appliquée). Un code « table
 * absente » ne suffit pas : l'erreur (ou la requête qu'elle cite) doit nommer une table `evaluation_validation_*`,
 * pour ne pas prendre une AUTRE table manquante pour la migration en attente.
 */
export function isMissingTableError(error: unknown): boolean {
  const chain = causes(error);
  const namesValidationTable = chain.some((entry) => typeof entry.message === "string" && /evaluation_validation_\w+/.test(entry.message));
  return chain.some((entry) => {
    if ((entry.code === "ER_NO_SUCH_TABLE" || entry.errno === 1146) && namesValidationTable) return true;
    return typeof entry.message === "string" && /table\s+['`"]?[\w.]*evaluation_validation_\w+['`"]?\s+doesn'?t exist/i.test(entry.message);
  });
}

export function isDuplicateKeyError(error: unknown): boolean {
  for (const entry of causes(error)) {
    if (entry.code === "ER_DUP_ENTRY" || entry.errno === 1062) return true;
  }
  return false;
}

// ── Conversions ligne ↔ modèle ───────────────────────────────────────────────

const STATUSES = new Set<string>(WORKFLOW_STATUSES);

function toStatus(value: string): WorkflowStatus {
  if (!STATUSES.has(value)) throw new Error(`Statut de workflow inconnu en base : ${value}`);
  return value as WorkflowStatus;
}

function parseJson(text: string | null): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseInfoRequest(text: string | null): InfoRequest | null {
  const value = parseJson(text) as Partial<InfoRequest> | null;
  if (!value || typeof value !== "object" || !Array.isArray(value.items)) return null;
  return {
    message: typeof value.message === "string" ? value.message : "",
    items: value.items.filter((item) => item && typeof item.id === "string" && typeof item.label === "string").map((item) => ({ id: item.id, label: item.label })),
    requestedAt: typeof value.requestedAt === "string" ? value.requestedAt : "",
    response: value.response && typeof value.response === "object" ? (value.response as InfoRequest["response"]) : null,
  };
}

export function fromRow(row: EvaluationValidationCase): ValidationCase {
  const aiDraft = AiEvaluationDraftSchema.safeParse(parseJson(row.aiDraftJson));
  const adminVersion = AdminEvaluationVersionSchema.safeParse(parseJson(row.adminVersionJson));
  const warnings = parseJson(row.aiDraftWarningsJson);
  return {
    id: row.id,
    evaluationId: row.evaluationId,
    versionNumber: row.versionNumber,
    workflowStatus: toStatus(row.workflowStatus),
    aiDraft: aiDraft.success ? aiDraft.data : null,
    aiDraftGeneratedAt: row.aiDraftGeneratedAt,
    aiDraftModel: row.aiDraftModel,
    aiDraftWarnings: Array.isArray(warnings) ? (warnings as AiDraftWarning[]) : [],
    aiDraftError: row.aiDraftError,
    adminVersion: adminVersion.success ? adminVersion.data : null,
    adminVersionUpdatedAt: row.adminVersionUpdatedAt,
    adminVersionUpdatedBy: row.adminVersionUpdatedBy,
    firstValidatedBy: row.firstValidatedBy,
    firstValidatedAt: row.firstValidatedAt,
    infoRequest: parseInfoRequest(row.infoRequestJson),
    infoRequestedAt: row.infoRequestedAt,
    infoRequestedBy: row.infoRequestedBy,
    publishedReport: (parseJson(row.publishedReportJson) as ClientReport | null) ?? null,
    publishedAt: row.publishedAt,
    publishedBy: row.publishedBy,
    publishedChecklist: (parseJson(row.publishedChecklistJson) as ValidationCase["publishedChecklist"]) ?? null,
    emailSubject: row.emailSubject,
    emailSentAt: row.emailSentAt,
    emailError: row.emailError,
    emailClaimedAt: row.emailClaimedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const JSON_COLUMNS = {
  aiDraft: "aiDraftJson",
  aiDraftWarnings: "aiDraftWarningsJson",
  adminVersion: "adminVersionJson",
  infoRequest: "infoRequestJson",
  publishedReport: "publishedReportJson",
  publishedChecklist: "publishedChecklistJson",
} as const;

const PLAIN_COLUMNS = [
  "aiDraftGeneratedAt",
  "aiDraftModel",
  "aiDraftError",
  "adminVersionUpdatedAt",
  "adminVersionUpdatedBy",
  "firstValidatedBy",
  "firstValidatedAt",
  "infoRequestedAt",
  "infoRequestedBy",
  "publishedAt",
  "publishedBy",
  "emailSubject",
  "emailSentAt",
  "emailError",
  "emailClaimedAt",
] as const;

/** Un champ absent (undefined) n'est jamais écrit ; `null` efface explicitement la valeur. */
export function toRowValues(patch: ValidationCasePatch): Partial<InsertEvaluationValidationCase> {
  const out: Record<string, unknown> = {};
  if (patch.workflowStatus !== undefined) out.workflowStatus = patch.workflowStatus;
  for (const [key, column] of Object.entries(JSON_COLUMNS) as Array<[keyof typeof JSON_COLUMNS, string]>) {
    const value = patch[key];
    if (value !== undefined) out[column] = value === null ? null : JSON.stringify(value);
  }
  for (const key of PLAIN_COLUMNS) {
    const value = patch[key];
    if (value !== undefined) out[key] = value;
  }
  return out as Partial<InsertEvaluationValidationCase>;
}

const encodeValue = (value: unknown) => JSON.stringify(value === undefined ? null : value);

function decodeValue(text: string | null): unknown {
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const COUNTRY_BY_CATEGORY: Record<string, string> = { canada: "Canada", schengen: "Espace Schengen" };

// ── Store ────────────────────────────────────────────────────────────────────

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function applyEffects(tx: Tx, target: { evaluationId: number; versionNumber: number }, effects: TransitionEffects | undefined) {
  if (!effects) return;
  if (effects.changes && effects.changes.rows.length > 0) {
    await tx.insert(evaluationValidationChanges).values(
      effects.changes.rows.map((change) => ({
        evaluationId: target.evaluationId,
        versionNumber: target.versionNumber,
        adminEmail: effects.changes!.adminEmail.slice(0, 320),
        field: change.field.slice(0, 80),
        oldValueJson: encodeValue(change.oldValue),
        newValueJson: encodeValue(change.newValue),
      })),
    );
  }
  if (effects.audit) {
    await tx.insert(evaluationReviewEvents).values({
      evaluationId: target.evaluationId,
      adminEmail: effects.audit.adminEmail.slice(0, 320),
      action: effects.audit.action.slice(0, 40),
      note: effects.audit.note ?? null,
    });
  }
  if (effects.legacyPublication) {
    const publication = effects.legacyPublication;
    // Miroir de la publication sur l'ancien modèle : les écrans historiques affichent le dossier comme validé.
    await tx
      .update(evaluations)
      .set({
        status: "reviewed",
        // écrans historiques : « relu par » = premier validateur, « seconde relecture par » = le publicateur (distinct)
        reviewedAt: publication.firstValidatedAt,
        reviewedBy: publication.firstValidatedBy,
        reviewNote: "Validation structurée : rapport publié après relecture administrateur.",
        reviewDraft: publication.reportText,
        reviewDraftUpdatedAt: publication.publishedAt,
        reviewDraftUpdatedBy: publication.publishedBy,
        secondReviewRequired: publication.secondValidatedBy !== null,
        secondReviewedAt: publication.secondValidatedBy ? publication.publishedAt : null,
        secondReviewedBy: publication.secondValidatedBy,
        finalResponseSentAt: publication.publishedAt,
      })
      .where(eq(evaluations.id, target.evaluationId));
  }
}

export class DrizzleValidationStore implements ValidationStore {
  constructor(private readonly db: Db) {}

  async loadEvaluationContext(evaluationId: number): Promise<EvaluationContext | null> {
    const [row] = await this.db
      .select({ id: evaluations.id, fullName: evaluations.fullName, email: evaluations.email, destinationCountry: evaluations.destinationCountry, destinationCategory: evaluations.destinationCategory })
      .from(evaluations)
      .where(eq(evaluations.id, evaluationId))
      .limit(1);
    if (!row) return null;
    return {
      evaluationId: row.id,
      candidateName: row.fullName,
      candidateEmail: row.email,
      candidateCountry: row.destinationCountry?.trim() || COUNTRY_BY_CATEGORY[row.destinationCategory] || "",
    };
  }

  async getLatestCase(evaluationId: number) {
    const [row] = await this.db.select().from(evaluationValidationCases).where(eq(evaluationValidationCases.evaluationId, evaluationId)).orderBy(desc(evaluationValidationCases.versionNumber)).limit(1);
    return row ? fromRow(row) : null;
  }

  async getLatestPublishedCase(evaluationId: number) {
    const [row] = await this.db
      .select()
      .from(evaluationValidationCases)
      .where(and(eq(evaluationValidationCases.evaluationId, evaluationId), isNotNull(evaluationValidationCases.publishedAt), isNotNull(evaluationValidationCases.publishedReportJson)))
      .orderBy(desc(evaluationValidationCases.versionNumber))
      .limit(1);
    return row ? fromRow(row) : null;
  }

  async listCases(evaluationId: number) {
    const rows = await this.db.select().from(evaluationValidationCases).where(eq(evaluationValidationCases.evaluationId, evaluationId)).orderBy(asc(evaluationValidationCases.versionNumber));
    return rows.map(fromRow);
  }

  async insertCase(input: NewValidationCase, effects?: TransitionEffects) {
    try {
      return await this.db.transaction(async (tx) => {
        const [header] = await tx.insert(evaluationValidationCases).values({
          evaluationId: input.evaluationId,
          versionNumber: input.versionNumber,
          ...toRowValues(input),
        });
        const [row] = await tx.select().from(evaluationValidationCases).where(eq(evaluationValidationCases.id, Number(header.insertId))).limit(1);
        await applyEffects(tx, { evaluationId: input.evaluationId, versionNumber: input.versionNumber }, effects);
        return row ? fromRow(row) : null;
      });
    } catch (error) {
      // (evaluationId, versionNumber) est unique : la requête concurrente a gagné, l'appelant relit.
      if (isDuplicateKeyError(error)) return null;
      throw error;
    }
  }

  async updateCaseIf(id: number, expectedStatus: WorkflowStatus, patch: ValidationCasePatch, effects?: TransitionEffects, guard?: UpdateGuard) {
    return this.db.transaction(async (tx) => {
      const [locked] = await tx.select().from(evaluationValidationCases).where(eq(evaluationValidationCases.id, id)).limit(1).for("update");
      if (!locked || locked.workflowStatus !== expectedStatus) return null;
      // Préconditions de contenu, vérifiées sous le même verrou que le statut (voir UpdateGuard).
      if (guard?.adminVersionStamp !== undefined) {
        const stored = AdminEvaluationVersionSchema.safeParse(parseJson(locked.adminVersionJson));
        if (!stored.success || versionStamp(stored.data) !== guard.adminVersionStamp) return null;
      }
      if (guard?.requireNoAiDraft && locked.aiDraftJson !== null) return null;
      if (guard?.emailClaimableSince && locked.emailClaimedAt && locked.emailClaimedAt.getTime() >= guard.emailClaimableSince.getTime()) return null;
      const values = toRowValues(patch);
      if (Object.keys(values).length > 0) await tx.update(evaluationValidationCases).set(values).where(eq(evaluationValidationCases.id, id));
      await applyEffects(tx, { evaluationId: locked.evaluationId, versionNumber: locked.versionNumber }, effects);
      const [fresh] = await tx.select().from(evaluationValidationCases).where(eq(evaluationValidationCases.id, id)).limit(1);
      return fresh ? fromRow(fresh) : null;
    });
  }

  async listChanges(evaluationId: number): Promise<FieldChangeRecord[]> {
    const rows = await this.db
      .select()
      .from(evaluationValidationChanges)
      .where(eq(evaluationValidationChanges.evaluationId, evaluationId))
      .orderBy(asc(evaluationValidationChanges.createdAt), asc(evaluationValidationChanges.id))
      .limit(500);
    return rows.map((row) => ({
      evaluationId: row.evaluationId,
      versionNumber: row.versionNumber,
      adminEmail: row.adminEmail,
      field: row.field,
      oldValue: decodeValue(row.oldValueJson),
      newValue: decodeValue(row.newValueJson),
      createdAt: row.createdAt,
    }));
  }

  async latestStatuses(evaluationIds: number[]) {
    const result = new Map<number, { status: WorkflowStatus; versionNumber: number; updatedAt: Date }>();
    if (evaluationIds.length === 0) return result;
    const rows = await this.db
      .select({ evaluationId: evaluationValidationCases.evaluationId, workflowStatus: evaluationValidationCases.workflowStatus, versionNumber: evaluationValidationCases.versionNumber, updatedAt: evaluationValidationCases.updatedAt })
      .from(evaluationValidationCases)
      .where(inArray(evaluationValidationCases.evaluationId, evaluationIds))
      .orderBy(desc(evaluationValidationCases.versionNumber));
    for (const row of rows) {
      if (!result.has(row.evaluationId)) result.set(row.evaluationId, { status: toStatus(row.workflowStatus), versionNumber: row.versionNumber, updatedAt: row.updatedAt });
    }
    return result;
  }
}

/** Store adossé à la base ; null si aucune base n'est configurée. */
export async function getValidationStore(): Promise<ValidationStore | null> {
  const db = await getDb();
  return db ? new DrizzleValidationStore(db) : null;
}

/**
 * Exécute une lecture de la validation structurée en retombant sur `fallback` quand la migration n'a
 * pas encore été appliquée : le site continue de fonctionner avec l'ancien parcours.
 */
export async function orFallbackWhenTablesMissing<T>(fallback: T, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (isMissingTableError(error)) return fallback;
    throw error;
  }
}
