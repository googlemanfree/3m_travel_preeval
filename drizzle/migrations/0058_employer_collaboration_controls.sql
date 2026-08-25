ALTER TABLE placement_employer_accounts
  ADD COLUMN collaboration_role ENUM('reader','manager') NOT NULL DEFAULT 'reader' AFTER status;

CREATE TABLE IF NOT EXISTS placement_employer_notifications (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  recipient_employer_account_id INT NOT NULL,
  actor_employer_account_id INT NULL,
  type ENUM('favorite_shared','share_revoked','role_changed') NOT NULL,
  share_id INT NULL,
  message VARCHAR(500) NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_employer_notification_recipient (organization_id, recipient_employer_account_id, read_at, created_at)
);
