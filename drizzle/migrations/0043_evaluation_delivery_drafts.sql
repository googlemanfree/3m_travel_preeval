ALTER TABLE `applications`
  ADD COLUMN `evaluationScheduledAt` timestamp NULL,
  ADD COLUMN `evaluationDeliveryMessage` text NULL,
  ADD COLUMN `evaluationDeliverySubject` varchar(255) NULL,
  ADD COLUMN `evaluationDeliveryStatus` enum('draft','scheduled','sent','failed') NOT NULL DEFAULT 'draft';
