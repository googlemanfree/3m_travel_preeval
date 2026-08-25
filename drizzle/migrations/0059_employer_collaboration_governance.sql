ALTER TABLE placement_employer_notifications
  MODIFY COLUMN type ENUM('favorite_shared','share_revoked','role_changed','collaborator_suspended','collaborator_reactivated') NOT NULL;

CREATE TABLE IF NOT EXISTS placement_employer_collaboration_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  actor_employer_account_id INT NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  target_employer_account_id INT NULL,
  target_name VARCHAR(255) NULL,
  action VARCHAR(100) NOT NULL,
  share_id INT NULL,
  profile_code VARCHAR(48) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_collaboration_event_organization (organization_id, created_at)
);
