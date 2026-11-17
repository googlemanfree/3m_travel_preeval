import { eq, like, sql } from "drizzle-orm";
import { agencySettings } from "../../drizzle/schema";

/**
 * Corbeille réversible des évaluations faites sans compte ni dossier.
 *
 * La table `evaluations` n'a pas de colonne « supprimé le » et la base réelle n'est jamais modifiée par le code : l'archivage est donc un repère
 * dans `agency_settings` (clé `evaluation_archived:<id>`, sans migration), du même modèle que les autres états ponctuels du projet.
 * Aucune donnée n'est supprimée : l'évaluation reste visible dans le tableau des évaluations ; seule la liste des dossiers l'écarte.
 */

export const EVALUATION_ARCHIVE_PREFIX = "evaluation_archived:";

type Db = {
  select: (...args: never[]) => never;
  insert: (...args: never[]) => never;
  update: (...args: never[]) => never;
  delete: (...args: never[]) => never;
};

export async function setEvaluationArchived(db: unknown, evaluationId: number, details: { by: string; reason: string }): Promise<void> {
  const client = db as any;
  const settingKey = `${EVALUATION_ARCHIVE_PREFIX}${evaluationId}`;
  const settingValue = JSON.stringify({ by: details.by, reason: details.reason, at: new Date().toISOString() });
  const [existing] = await client.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, settingKey)).limit(1);
  if (existing) await client.update(agencySettings).set({ settingValue, updatedAt: new Date() }).where(eq(agencySettings.id, existing.id));
  else await client.insert(agencySettings).values({ settingKey, settingValue });
}

export async function clearEvaluationArchived(db: unknown, evaluationId: number): Promise<void> {
  await (db as any).delete(agencySettings).where(eq(agencySettings.settingKey, `${EVALUATION_ARCHIVE_PREFIX}${evaluationId}`));
}

/** Numéros des évaluations archivées. */
export async function listArchivedEvaluationIds(db: unknown): Promise<number[]> {
  const rows: Array<{ settingKey: string }> = await (db as any).select({ settingKey: agencySettings.settingKey }).from(agencySettings).where(like(agencySettings.settingKey, `${EVALUATION_ARCHIVE_PREFIX}%`)).limit(5000);
  return rows.map((row) => Number(row.settingKey.slice(EVALUATION_ARCHIVE_PREFIX.length))).filter((id) => Number.isInteger(id) && id > 0);
}

/** Condition SQL (à placer dans un WHERE sur `evaluations s`) qui écarte les évaluations archivées. */
export const NOT_ARCHIVED_EVALUATION_SQL = `s.id NOT IN (SELECT CAST(SUBSTRING(xs.settingKey, ${EVALUATION_ARCHIVE_PREFIX.length + 1}) AS UNSIGNED) FROM agency_settings xs WHERE xs.settingKey LIKE '${EVALUATION_ARCHIVE_PREFIX}%')`;

export type { Db as EvaluationArchiveDb };
void sql;
