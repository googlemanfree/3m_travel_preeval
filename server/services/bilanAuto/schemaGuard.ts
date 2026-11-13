import { sql } from "drizzle-orm";
import { getDb } from "../../db";

/**
 * Crée les tables du bilan automatisé si elles manquent (CREATE TABLE IF NOT EXISTS) : les migrations Drizzle ne sont pas rejouées
 * sur l'hébergement actuel. Additif uniquement : aucune table existante n'est modifiée. Appelé une fois par processus, et
 * seulement quand BILAN_AUTO_ENABLED=true — activé ou non, le reste du site ne dépend jamais de ces tables.
 * Retour arrière : DROP TABLE bilan_auto_outbox, bilan_auto_events, bilan_auto_runs (aucune autre table ne les référence).
 */
const DDL = [
  `CREATE TABLE IF NOT EXISTS bilan_auto_runs (
    id INT AUTO_INCREMENT PRIMARY KEY, evaluationId INT NOT NULL, candidateId INT NULL, dossierRef VARCHAR(64) NULL,
    submissionId VARCHAR(64) NOT NULL, inputVersion VARCHAR(64) NOT NULL, rubricVersion VARCHAR(40) NOT NULL, promptVersion VARCHAR(40) NOT NULL,
    model VARCHAR(80) NULL, idempotencyKey VARCHAR(191) NOT NULL, mode VARCHAR(24) NOT NULL, state VARCHAR(32) NOT NULL,
    attempts INT NOT NULL DEFAULT 0, maxAttempts INT NOT NULL DEFAULT 4, nextAttemptAt TIMESTAMP NULL, lockedBy VARCHAR(80) NULL, lockedAt TIMESTAMP NULL,
    lastError TEXT NULL, outcome VARCHAR(2) NULL, score INT NULL, scoreMax INT NULL, thresholdReached TINYINT(1) NULL,
    inputSnapshotJson MEDIUMTEXT NOT NULL, factsJson MEDIUMTEXT NULL, scoreJson MEDIUMTEXT NULL, orientationsJson MEDIUMTEXT NULL, reportJson MEDIUMTEXT NULL,
    reportHash VARCHAR(64) NULL, pdfKey VARCHAR(512) NULL, complementJson TEXT NULL, previousJson TEXT NULL, flagsJson TEXT NULL,
    reviewStatus VARCHAR(16) NOT NULL DEFAULT 'none', validatedBy VARCHAR(320) NULL, validatedAt TIMESTAMP NULL, publishedAt TIMESTAMP NULL,
    notificationState VARCHAR(24) NOT NULL DEFAULT 'none', supersededById INT NULL, costEurMilli INT NULL, tokensUsed INT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_bilan_auto_runs_idempotency (idempotencyKey), KEY idx_bilan_auto_runs_state (state, nextAttemptAt),
    KEY idx_bilan_auto_runs_evaluation (evaluationId, id), KEY idx_bilan_auto_runs_candidate (candidateId, id), KEY idx_bilan_auto_runs_review (reviewStatus, state)
  )`,
  `CREATE TABLE IF NOT EXISTS bilan_auto_events (
    id INT AUTO_INCREMENT PRIMARY KEY, runId INT NULL, evaluationId INT NOT NULL, actor VARCHAR(320) NOT NULL, action VARCHAR(64) NOT NULL, detail TEXT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY idx_bilan_auto_events_run (runId, id)
  )`,
  `CREATE TABLE IF NOT EXISTS bilan_auto_outbox (
    id INT AUTO_INCREMENT PRIMARY KEY, runId INT NOT NULL, dedupKey VARCHAR(191) NOT NULL, channel VARCHAR(16) NOT NULL, recipient VARCHAR(320) NOT NULL,
    kind VARCHAR(32) NOT NULL, state VARCHAR(24) NOT NULL DEFAULT 'pending', attempts INT NOT NULL DEFAULT 0, providerMessageId VARCHAR(191) NULL, lastError TEXT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_bilan_auto_outbox_dedup (dedupKey), KEY idx_bilan_auto_outbox_state (state, id)
  )`,
];

let ensured = false;
export async function ensureBilanAutoTables(): Promise<boolean> {
  if (ensured) return true;
  const db = await getDb();
  if (!db) return false;
  try {
    for (const statement of DDL) await db.execute(sql.raw(statement));
    ensured = true;
    return true;
  } catch (error) {
    console.error("[bilanAuto] création des tables impossible :", error instanceof Error ? error.message : error);
    return false;
  }
}
export const resetBilanAutoSchemaGuardForTests = () => { ensured = false; };
