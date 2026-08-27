ALTER TABLE `evaluations`
  ADD COLUMN `reviewDeadline` timestamp NULL,
  ADD COLUMN `receiptSentAt` timestamp NULL,
  ADD COLUMN `reviewDraft` text NULL,
  ADD COLUMN `reviewDraftUpdatedAt` timestamp NULL,
  ADD COLUMN `reviewDraftUpdatedBy` varchar(320) NULL,
  ADD COLUMN `reviewedAt` timestamp NULL,
  ADD COLUMN `reviewedBy` varchar(320) NULL,
  ADD COLUMN `reviewNote` text NULL,
  ADD COLUMN `finalResponseSentAt` timestamp NULL;

CREATE INDEX `idx_evaluations_review_deadline` ON `evaluations` (`status`, `reviewDeadline`);
