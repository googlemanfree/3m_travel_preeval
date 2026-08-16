ALTER TABLE `applications`
  ADD COLUMN `evaluationRequiresSecondApproval` boolean NOT NULL DEFAULT false,
  ADD COLUMN `evaluationApprovalStatus` enum('not_required','pending','approved','rejected') NOT NULL DEFAULT 'not_required',
  ADD COLUMN `evaluationApprovedAt` timestamp NULL,
  ADD COLUMN `evaluationApprovedByAdminId` int NULL,
  ADD COLUMN `evaluationReportPdfKey` varchar(512) NULL,
  ADD COLUMN `evaluationReportPdfUrl` varchar(512) NULL;

CREATE TABLE `evaluation_bilan_versions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicationId` int NOT NULL,
  `versionNumber` int NOT NULL,
  `contentJson` text NOT NULL,
  `reportHtml` text NOT NULL,
  `createdByAdminAccountId` int NOT NULL,
  `requiresSecondApproval` boolean NOT NULL DEFAULT false,
  `approvalStatus` enum('draft','pending','approved','rejected','sent') NOT NULL DEFAULT 'draft',
  `approvedByAdminAccountId` int NULL,
  `approvalComment` text NULL,
  `approvedAt` timestamp NULL,
  `pdfKey` varchar(512) NULL,
  `pdfUrl` varchar(512) NULL,
  `sentAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_evaluation_bilan_versions_application` (`applicationId`,`versionNumber`),
  KEY `idx_evaluation_bilan_versions_approval` (`approvalStatus`,`createdAt`)
);
