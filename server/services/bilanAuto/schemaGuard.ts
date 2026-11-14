import { sql } from "drizzle-orm";
import { getDb } from "../../db";

/**
 * Crée les tables du bilan automatisé si elles manquent (CREATE TABLE IF NOT EXISTS) : les migrations Drizzle ne sont pas rejouées
 * sur l'hébergement actuel. Additif uniquement : aucune table existante n'est modifiée. Appelé une fois par processus, et
 * seulement quand BILAN_AUTO_ENABLED=true — activé ou non, le reste du site ne dépend jamais de ces tables.
 * Retour arrière : DROP TABLE bilan_auto_versions, bilan_auto_sources, bilan_auto_outbox, bilan_auto_events, bilan_auto_runs (aucune autre table ne les référence).
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
  `CREATE TABLE IF NOT EXISTS bilan_auto_sources (
    id INT AUTO_INCREMENT PRIMARY KEY, country VARCHAR(80) NOT NULL, kind VARCHAR(12) NOT NULL, occupation VARCHAR(160) NOT NULL, employer VARCHAR(160) NULL, city VARCHAR(120) NULL,
    amountMin INT NULL, amountMax INT NULL, currency VARCHAR(8) NULL, period VARCHAR(24) NULL, grossOrNet VARCHAR(8) NULL, geography VARCHAR(120) NULL,
    url VARCHAR(700) NOT NULL, title VARCHAR(200) NOT NULL, observedAt VARCHAR(10) NOT NULL, remoteRecruiting VARCHAR(16) NOT NULL DEFAULT 'non_confirmee',
    active TINYINT(1) NOT NULL DEFAULT 1, createdBy VARCHAR(320) NOT NULL, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_bilan_auto_sources_country (country, kind, active)
  )`,
  `CREATE TABLE IF NOT EXISTS bilan_auto_versions (
    id INT AUTO_INCREMENT PRIMARY KEY, runId INT NOT NULL, evaluationId INT NOT NULL, versionNumber INT NOT NULL, authorKind VARCHAR(10) NOT NULL, author VARCHAR(320) NOT NULL,
    reason TEXT NULL, status VARCHAR(12) NOT NULL, baseVersion INT NULL, reportJson MEDIUMTEXT NOT NULL, scoreJson MEDIUMTEXT NULL, sourcesJson TEXT NULL, reportHash VARCHAR(64) NOT NULL,
    pdfKey VARCHAR(512) NULL, publishedAt TIMESTAMP NULL, publishedBy VARCHAR(320) NULL, notifiedAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_bilan_auto_versions_run_number (runId, versionNumber), KEY idx_bilan_auto_versions_evaluation (evaluationId, id)
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
