-- Séjours pour visiteurs et touristes : programmes organisés ou accompagnés par l'agence et demandes des candidats. Uniquement de nouvelles tables, idempotent.
CREATE TABLE IF NOT EXISTS stay_programs (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL,
  city VARCHAR(120) NULL,
  title VARCHAR(255) NOT NULL,
  category ENUM('discovery', 'family_visit', 'events', 'language_stay', 'wellness', 'business_visit', 'other') NOT NULL DEFAULT 'discovery',
  summary VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  duration_days_min SMALLINT NULL,
  duration_days_max SMALLINT NULL,
  season_note VARCHAR(300) NULL,
  included_note VARCHAR(1000) NULL,
  visa_note VARCHAR(1000) NULL,
  price_from DECIMAL(12, 2) NULL,
  price_currency CHAR(3) NULL,
  price_basis VARCHAR(80) NULL,
  price_source_note VARCHAR(500) NULL,
  price_checked_at TIMESTAMP NULL,
  provider_note VARCHAR(500) NULL,
  status ENUM('draft', 'needs_review', 'published', 'retired') NOT NULL DEFAULT 'needs_review',
  checked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_stay_programs_country (country_code, status)
);

CREATE TABLE IF NOT EXISTS stay_requests (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  program_id INT NOT NULL,
  preferred_start DATE NULL,
  travelers TINYINT NOT NULL DEFAULT 1,
  status ENUM('requested', 'quote_prepared', 'confirmed', 'declined', 'cancelled') NOT NULL DEFAULT 'requested',
  consent_text_version VARCHAR(20) NOT NULL,
  consent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  candidate_note VARCHAR(1000) NULL,
  admin_note TEXT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_status_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_stay_requests_candidate_program (candidate_id, program_id),
  INDEX idx_stay_requests_status (status, last_status_at)
);

CREATE TABLE IF NOT EXISTS stay_request_events (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  actor_type ENUM('candidate', 'admin', 'system') NOT NULL,
  actor_id INT NULL,
  action VARCHAR(80) NOT NULL,
  note VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_stay_request_events_request (request_id, created_at)
);
