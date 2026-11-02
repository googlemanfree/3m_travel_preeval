-- Espace client : préférences de notification et connexions récentes. Uniquement de nouvelles tables, idempotent.
CREATE TABLE IF NOT EXISTS candidate_notification_prefs (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  email_enabled TINYINT(1) NOT NULL DEFAULT 1,
  whatsapp_opt_in TINYINT(1) NULL DEFAULT NULL,
  whatsapp_consented_at TIMESTAMP NULL,
  quiet_from TINYINT NULL,
  quiet_to TINYINT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_candidate_notification_prefs (candidate_id)
);

CREATE TABLE IF NOT EXISTS candidate_login_events (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  device_hash CHAR(64) NOT NULL,
  device_label VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_candidate_login_events (candidate_id, created_at)
);
