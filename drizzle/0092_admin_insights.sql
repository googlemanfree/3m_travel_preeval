-- Pilotage avancé : demandes d'actions sensibles à double validation et réponses de satisfaction (privées). Uniquement de nouvelles tables, idempotent.
CREATE TABLE IF NOT EXISTS sensitive_action_requests (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  action ENUM('deactivate') NOT NULL DEFAULT 'deactivate',
  candidate_id INT NOT NULL,
  reason VARCHAR(500) NOT NULL,
  requested_by_admin_id INT NOT NULL,
  requested_by_label VARCHAR(160) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  decided_by_label VARCHAR(160) NULL,
  decision_note VARCHAR(500) NULL,
  decided_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sensitive_requests_status (status, created_at),
  INDEX idx_sensitive_requests_candidate (candidate_id, status)
);

CREATE TABLE IF NOT EXISTS satisfaction_responses (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  milestone VARCHAR(40) NOT NULL,
  score TINYINT NOT NULL,
  comment VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_satisfaction_candidate_milestone (candidate_id, milestone),
  INDEX idx_satisfaction_created (created_at)
);
