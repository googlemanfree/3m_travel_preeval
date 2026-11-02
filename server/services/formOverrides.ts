import { asc, eq } from "drizzle-orm";
import { evaluationFormOverrides } from "../../drizzle/schema";
import { parseOverridePayload, type FormOverride } from "../../shared/dynamicForm";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const TTL_MS = 30_000;
let cache: { at: number; list: FormOverride[] } | null = null;

export const rowToOverride = (row: typeof evaluationFormOverrides.$inferSelect): FormOverride => ({
  id: row.id,
  fieldKey: row.fieldKey,
  action: row.action,
  projectKind: row.projectKind ?? null,
  programId: row.programId ?? null,
  domainId: row.domainId ?? null,
  countryCode: row.countryCode ?? null,
  payload: parseOverridePayload(row.payload),
  active: Boolean(row.active),
});

/**
 * Règles actives, mises en cache quelques secondes. Ne lève jamais : sans la table (migration 0086 non appliquée) ou sans
 * base, le formulaire reste celui du moteur, sans règle.
 */
export async function loadFormOverrides(db: Db | null | undefined): Promise<FormOverride[]> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.list;
  if (!db) return cache?.list ?? [];
  try {
    const rows = await db.select().from(evaluationFormOverrides).where(eq(evaluationFormOverrides.active, true)).orderBy(asc(evaluationFormOverrides.id)).limit(500);
    cache = { at: now, list: rows.map(rowToOverride) };
  } catch {
    cache = { at: now, list: [] };
  }
  return cache.list;
}

/** Dernières règles connues, sans accès à la base : pour les traitements en arrière-plan. */
export const cachedFormOverrides = (): FormOverride[] => cache?.list ?? [];

/** À appeler après chaque modification par l'administration. */
export function invalidateFormOverrides(): void {
  cache = null;
}
