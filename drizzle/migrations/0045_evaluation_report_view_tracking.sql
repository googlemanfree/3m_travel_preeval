ALTER TABLE `applications`
  ADD COLUMN `evaluationReportViewedAt` timestamp NULL,
  ADD COLUMN `evaluationReportReminderSentAt` timestamp NULL;
