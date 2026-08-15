-- Add reversible archive state for client notifications without changing existing records.
ALTER TABLE client_notifications
  ADD COLUMN isArchived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_client_notifications_candidate_archived
  ON client_notifications (candidateId, isArchived, createdAt);
