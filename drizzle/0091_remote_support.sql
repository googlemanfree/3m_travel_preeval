-- Accompagnement à distance : rendez-vous en ligne, prochaine action par dossier, accusés de réception. Uniquement de nouvelles tables, idempotent.
CREATE TABLE IF NOT EXISTS remote_slots (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration_min SMALLINT NOT NULL DEFAULT 30,
  channel ENUM('video', 'whatsapp', 'phone') NOT NULL DEFAULT 'video',
  join_url VARCHAR(500) NULL,
  topic VARCHAR(200) NULL,
  status ENUM('open', 'booked', 'done', 'cancelled', 'no_show') NOT NULL DEFAULT 'open',
  candidate_id INT NULL,
  candidate_note VARCHAR(500) NULL,
  booked_at TIMESTAMP NULL,
  reminder_sent_at TIMESTAMP NULL,
  minutes_text TEXT NULL,
  created_by VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_remote_slots_start (starts_at, status),
  INDEX idx_remote_slots_candidate (candidate_id, status)
);

CREATE TABLE IF NOT EXISTS case_next_actions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  action VARCHAR(300) NOT NULL,
  owner_admin_id INT NULL,
  owner_label VARCHAR(160) NULL,
  due_on DATE NULL,
  status ENUM('open', 'done', 'cancelled') NOT NULL DEFAULT 'open',
  candidate_visible TINYINT(1) NOT NULL DEFAULT 0,
  candidate_text VARCHAR(300) NULL,
  done_at TIMESTAMP NULL,
  created_by VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_next_actions_queue (status, owner_admin_id, due_on),
  INDEX idx_case_next_actions_candidate (candidate_id, status)
);

CREATE TABLE IF NOT EXISTS remote_acknowledgements (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  body_text TEXT NOT NULL,
  body_hash CHAR(64) NOT NULL,
  status ENUM('pending', 'accepted', 'declined', 'cancelled') NOT NULL DEFAULT 'pending',
  typed_name VARCHAR(255) NULL,
  decline_reason VARCHAR(500) NULL,
  answered_at TIMESTAMP NULL,
  ip_hash CHAR(64) NULL,
  created_by VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_remote_ack_candidate (candidate_id, status)
);
