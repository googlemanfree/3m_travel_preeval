-- Fiches de synthèse candidat (PDF 1 page) pour employeurs / agences de placement
CREATE TABLE IF NOT EXISTS candidate_synthesis_share_consents (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL UNIQUE,
  status ENUM('granted', 'withdrawn') NOT NULL DEFAULT 'withdrawn',
  consented_at TIMESTAMP NULL,
  withdrawn_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_synthesis_sheets (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  status ENUM('draft', 'validated', 'rejected', 'needs_revalidation') NOT NULL DEFAULT 'draft',
  draft_json LONGTEXT NULL,
  content_json LONGTEXT NULL,
  source_fingerprint VARCHAR(512) NOT NULL DEFAULT '',
  portrait_url TEXT NULL,
  missing_json TEXT NULL,
  unverified_json TEXT NULL,
  generated_by_admin_email VARCHAR(320) NULL,
  validated_by_admin_email VARCHAR(320) NULL,
  rejected_by_admin_email VARCHAR(320) NULL,
  rejection_reason TEXT NULL,
  generated_at TIMESTAMP NULL,
  validated_at TIMESTAMP NULL,
  rejected_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_synthesis_sheets_candidate (candidate_id, status, version),
  INDEX idx_synthesis_sheets_status (status, updated_at)
);

CREATE TABLE IF NOT EXISTS candidate_synthesis_events (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sheet_id INT NOT NULL,
  candidate_id INT NOT NULL,
  actor_type ENUM('admin', 'employer', 'agency', 'candidate', 'system') NOT NULL,
  actor_ref VARCHAR(320) NULL,
  action VARCHAR(80) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_synthesis_events_sheet (sheet_id, created_at),
  INDEX idx_synthesis_events_candidate (candidate_id, created_at)
);
