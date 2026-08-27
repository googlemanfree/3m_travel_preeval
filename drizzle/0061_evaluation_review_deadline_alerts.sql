ALTER TABLE `evaluations`
  ADD COLUMN `reviewDeadlineAlertedAt` timestamp NULL AFTER `reviewDeadline`;

ALTER TABLE `admin_notifications`
  MODIFY COLUMN `type` enum('new_evaluation','new_contact_message','new_document','payment_received','simulator_load_failed','evaluation_review_deadline') NOT NULL;

CREATE INDEX `evaluations_review_deadline_alert_idx`
  ON `evaluations` (`reviewDeadline`, `reviewDeadlineAlertedAt`, `reviewedAt`);
