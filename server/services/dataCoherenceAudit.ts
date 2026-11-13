import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { applications, candidates, evaluations } from "../../drizzle/schema";
import { dataCoherenceLog } from "../../drizzle/dataCoherenceSchema";
import { ISSUE_LABELS, canonicalCountry, checkRecordCoherence, normalizeDestination, projectKindOf, type CoherenceIssue } from "../../shared/dataCoherence";
import { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * Audit de cohérence des données (lecture seule) puis corrections EN LOT, prévisualisées, journalisées et annulables.
 * Périmètre des corrections : pays (orthographe canonique), zone et code de visa de la table des évaluations, uniquement quand le pays est
 * reconnu. Aucune date, aucun nom, aucune coordonnée n'est jamais modifié automatiquement : ces anomalies sont signalées pour correction humaine.
 */

export const MAX_BATCH = 500;

const DDL = `CREATE TABLE IF NOT EXISTS data_coherence_log (
  id INT AUTO_INCREMENT PRIMARY KEY, batchId VARCHAR(40) NOT NULL, tableName VARCHAR(60) NOT NULL, rowId INT NOT NULL, field VARCHAR(60) NOT NULL,
  oldValue TEXT NULL, newValue TEXT NULL, actor VARCHAR(320) NOT NULL, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, revertedAt TIMESTAMP NULL,
  KEY idx_data_coherence_log_batch (batchId, id)
)`;
let ensured = false;
export async function ensureCoherenceLogTable(db: Db): Promise<void> {
  if (ensured) return;
  await db.execute(sql.raw(DDL));
  ensured = true;
}

export type EvaluationRow = {
  id: number; referenceCode: string | null; destinationCountry: string | null; destinationCategory: string | null; visaType: string | null; projectType: string | null;
  dateOfBirth: string | null; yearsOfExperience: string | null; graduationYear: string | null; email: string | null; phone: string | null; projectDetailsJson: string | null;
};

const ageFromDetails = (json: string | null): number | null => {
  if (!json) return null;
  try { const value = Number((JSON.parse(json) as { age?: unknown }).age); return Number.isFinite(value) ? value : null; } catch { return null; }
};

export function issuesForEvaluation(row: EvaluationRow, now: Date): CoherenceIssue[] {
  return checkRecordCoherence({ ...row, age: ageFromDetails(row.projectDetailsJson) }, now);
}

export type FieldChange = { rowId: number; field: "destinationCountry" | "destinationCategory" | "visaType"; oldValue: string | null; newValue: string };

/** Corrections proposées pour une évaluation. Le visa n'est recalculé que si le projet est connu ; un pays non reconnu n'est jamais touché. */
export function proposeEvaluationFixes(row: EvaluationRow): FieldChange[] {
  if (!canonicalCountry(row.destinationCountry)) return [];
  const projectKnown = projectKindOf(row.projectType) !== "autre";
  const normalized = normalizeDestination({ destinationCountry: row.destinationCountry, destinationCategory: row.destinationCategory, visaType: projectKnown ? row.visaType : null, projectType: row.projectType });
  const changes: FieldChange[] = [];
  if (row.destinationCountry !== normalized.destinationCountry) changes.push({ rowId: row.id, field: "destinationCountry", oldValue: row.destinationCountry, newValue: normalized.destinationCountry });
  if (row.destinationCategory !== normalized.destinationCategory) changes.push({ rowId: row.id, field: "destinationCategory", oldValue: row.destinationCategory, newValue: normalized.destinationCategory });
  if (projectKnown && row.visaType !== normalized.visaType) changes.push({ rowId: row.id, field: "visaType", oldValue: row.visaType, newValue: normalized.visaType });
  return changes;
}

export type AuditReport = {
  generatedAt: string;
  scanned: { evaluations: number; candidates: number; applications: number };
  rowsWithIssues: number;
  byCode: Array<{ code: string; label: string; severity: string; count: number; samples: Array<{ source: string; id: number; reference: string | null; message: string }> }>;
  fixable: { rows: number; changes: number };
};

const SAMPLES = 5;

async function loadEvaluations(db: Db, limit: number): Promise<EvaluationRow[]> {
  return db.select({ id: evaluations.id, referenceCode: evaluations.referenceCode, destinationCountry: evaluations.destinationCountry, destinationCategory: evaluations.destinationCategory, visaType: evaluations.visaType, projectType: evaluations.projectType, dateOfBirth: evaluations.dateOfBirth, yearsOfExperience: evaluations.yearsOfExperience, graduationYear: evaluations.graduationYear, email: evaluations.email, phone: evaluations.phone, projectDetailsJson: evaluations.projectDetailsJson }).from(evaluations).orderBy(desc(evaluations.id)).limit(limit) as unknown as Promise<EvaluationRow[]>;
}

export async function buildAuditReport(db: Db, now: Date = new Date(), limit = 5000): Promise<AuditReport> {
  const buckets = new Map<string, AuditReport["byCode"][number]>();
  let rowsWithIssues = 0;
  let fixRows = 0;
  let fixChanges = 0;
  const record = (source: string, id: number, reference: string | null, issues: CoherenceIssue[]) => {
    if (issues.length > 0) rowsWithIssues += 1;
    for (const issue of issues) {
      const bucket = buckets.get(issue.code) ?? { code: issue.code, label: ISSUE_LABELS[issue.code] ?? issue.code, severity: issue.severity, count: 0, samples: [] };
      bucket.count += 1;
      if (bucket.samples.length < SAMPLES) bucket.samples.push({ source, id, reference, message: issue.message });
      buckets.set(issue.code, bucket);
    }
  };

  const evalRows = await loadEvaluations(db, limit);
  for (const row of evalRows) {
    record("evaluation", row.id, row.referenceCode, issuesForEvaluation(row, now));
    const changes = proposeEvaluationFixes(row);
    if (changes.length > 0) { fixRows += 1; fixChanges += changes.length; }
  }
  // Comptes et dossiers : champs libres (pays, type de visa) — contrôlés mais jamais modifiés automatiquement.
  const candidateRows = await db.select({ id: candidates.id, destination: candidates.destination, visaType: candidates.visaType, dateOfBirth: candidates.dateOfBirth, email: candidates.email, phone: candidates.phone }).from(candidates).orderBy(desc(candidates.id)).limit(limit);
  for (const row of candidateRows) {
    const issues = checkRecordCoherence({ destinationCountry: row.destination, dateOfBirth: row.dateOfBirth, email: row.email, phone: row.phone }, now);
    if (row.visaType && projectKindOf(row.visaType) === "autre" && !/^autre$/i.test(row.visaType.trim())) issues.push({ code: "VISA_INCONNU", severity: "avertissement", field: "visaType", message: `Type de visa « ${row.visaType} » non reconnu.` });
    record("candidat", row.id, null, issues);
  }
  const applicationRows = await db.select({ id: applications.id, destination: applications.destination, visaType: applications.visaType, dossierNumber: applications.dossierNumber }).from(applications).orderBy(desc(applications.id)).limit(limit);
  for (const row of applicationRows) {
    const issues = checkRecordCoherence({ destinationCountry: row.destination });
    if (row.visaType && projectKindOf(row.visaType) === "autre" && !/^autre$/i.test(row.visaType.trim())) issues.push({ code: "VISA_INCONNU", severity: "avertissement", field: "visaType", message: `Type de visa « ${row.visaType} » non reconnu.` });
    record("dossier", row.id, row.dossierNumber ?? null, issues);
  }

  const order = { erreur: 0, avertissement: 1, info: 2 } as Record<string, number>;
  return {
    generatedAt: now.toISOString(),
    scanned: { evaluations: evalRows.length, candidates: candidateRows.length, applications: applicationRows.length },
    rowsWithIssues,
    byCode: Array.from(buckets.values()).sort((a, b) => order[a.severity] - order[b.severity] || b.count - a.count),
    fixable: { rows: fixRows, changes: fixChanges },
  };
}

export type FixPreview = { total: number; shown: FieldChange[]; truncated: boolean };

export async function previewFixes(db: Db): Promise<FixPreview> {
  const rows = await loadEvaluations(db, 5000);
  const all = rows.flatMap((row) => proposeEvaluationFixes(row));
  return { total: all.length, shown: all.slice(0, 200), truncated: all.length > 200 };
}

export async function applyFixes(db: Db, actor: string, expectedChanges: number): Promise<{ batchId: string; applied: number }> {
  await ensureCoherenceLogTable(db);
  const rows = await loadEvaluations(db, 5000);
  const changes = rows.flatMap((row) => proposeEvaluationFixes(row));
  if (changes.length !== expectedChanges) throw new Error(`Les données ont changé depuis l'aperçu (${changes.length} correction(s) au lieu de ${expectedChanges}) : relisez l'aperçu.`);
  if (changes.length > MAX_BATCH) throw new Error(`Lot trop grand (${changes.length} > ${MAX_BATCH}) : traitez-le en plusieurs fois après correction des cas les plus fréquents.`);
  const batchId = randomUUID().slice(0, 36);
  for (const change of changes) {
    // la condition « valeur encore inchangée » évite d'écraser une modification faite entre l'aperçu et l'application
    const column = change.field === "destinationCountry" ? evaluations.destinationCountry : change.field === "destinationCategory" ? evaluations.destinationCategory : evaluations.visaType;
    const guard = change.oldValue === null ? isNull(column) : eq(column, change.oldValue as never);
    const result = await db.update(evaluations).set({ [change.field]: change.newValue } as never).where(and(eq(evaluations.id, change.rowId), guard));
    const header = Array.isArray(result) ? result[0] : result;
    if (Number((header as { affectedRows?: number })?.affectedRows ?? 0) > 0) {
      await db.insert(dataCoherenceLog).values({ batchId, tableName: "evaluations", rowId: change.rowId, field: change.field, oldValue: change.oldValue, newValue: change.newValue, actor });
    }
  }
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(dataCoherenceLog).where(eq(dataCoherenceLog.batchId, batchId));
  return { batchId, applied: Number(n) };
}

export async function listBatches(db: Db) {
  await ensureCoherenceLogTable(db);
  const rows = await db.select({ batchId: dataCoherenceLog.batchId, actor: dataCoherenceLog.actor, createdAt: sql<Date>`min(${dataCoherenceLog.createdAt})`, changes: sql<number>`count(*)`, reverted: sql<number>`sum(${dataCoherenceLog.revertedAt} is not null)` }).from(dataCoherenceLog).groupBy(dataCoherenceLog.batchId, dataCoherenceLog.actor).orderBy(desc(sql`min(${dataCoherenceLog.createdAt})`)).limit(30);
  return rows.map((row) => ({ batchId: row.batchId, actor: row.actor, createdAt: new Date(row.createdAt).toISOString(), changes: Number(row.changes), reverted: Number(row.reverted) }));
}

/** Annulation : restaure l'ancienne valeur seulement si la valeur actuelle est encore celle posée par le lot (une modification ultérieure est respectée). */
export async function revertBatch(db: Db, batchId: string): Promise<{ restored: number; skipped: number }> {
  await ensureCoherenceLogTable(db);
  const entries = await db.select().from(dataCoherenceLog).where(and(eq(dataCoherenceLog.batchId, batchId), isNull(dataCoherenceLog.revertedAt)));
  let restored = 0;
  let skipped = 0;
  for (const entry of entries) {
    const column = entry.field === "destinationCountry" ? evaluations.destinationCountry : entry.field === "destinationCategory" ? evaluations.destinationCategory : evaluations.visaType;
    const result = await db.update(evaluations).set({ [entry.field]: entry.oldValue } as never).where(and(eq(evaluations.id, entry.rowId), eq(column, entry.newValue as never)));
    const header = Array.isArray(result) ? result[0] : result;
    if (Number((header as { affectedRows?: number })?.affectedRows ?? 0) > 0) restored += 1; else skipped += 1;
    await db.update(dataCoherenceLog).set({ revertedAt: new Date() }).where(eq(dataCoherenceLog.id, entry.id));
  }
  return { restored, skipped };
}
