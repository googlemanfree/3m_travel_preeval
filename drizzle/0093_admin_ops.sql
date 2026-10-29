-- Outils d'administration : modèles de bilan versionnés, résultats réels des dossiers, échéanciers de paiement. Uniquement de nouvelles tables, idempotent.
CREATE TABLE IF NOT EXISTS bilan_templates (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  profile VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  body_html MEDIUMTEXT NOT NULL,
  created_by VARCHAR(160) NULL,
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bilan_templates_version (profile, name, version),
  INDEX idx_bilan_templates_profile (profile, archived_at)
);

CREATE TABLE IF NOT EXISTS case_outcomes (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  destination VARCHAR(100) NOT NULL,
  visa_type VARCHAR(100) NOT NULL,
  outcome ENUM('accepted', 'refused', 'withdrawn') NOT NULL,
  decided_on DATE NULL,
  refusal_reason VARCHAR(300) NULL,
  recorded_by VARCHAR(160) NOT NULL,
  voided_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_case_outcomes_candidate (candidate_id),
  INDEX idx_case_outcomes_stats (destination, visa_type, outcome)
);

CREATE TABLE IF NOT EXISTS payment_schedule_items (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  label VARCHAR(160) NOT NULL,
  amount INT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'XAF',
  due_on DATE NOT NULL,
  status ENUM('pending', 'paid', 'waived', 'cancelled') NOT NULL DEFAULT 'pending',
  paid_on DATE NULL,
  note VARCHAR(300) NULL,
  recorded_by VARCHAR(160) NULL,
  created_by VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_schedule_candidate (candidate_id, status),
  INDEX idx_payment_schedule_due (status, due_on)
);
