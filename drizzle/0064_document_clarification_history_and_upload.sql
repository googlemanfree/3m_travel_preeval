ALTER TABLE `document_clarification_requests` ADD `dueAt` timestamp NULL;
--> statement-breakpoint
ALTER TABLE `document_clarification_requests` ADD `uploadedCandidateFileId` int NULL;
--> statement-breakpoint
ALTER TABLE `document_clarification_requests` ADD `uploadedAt` timestamp NULL;
--> statement-breakpoint
CREATE INDEX `idx_document_clarifications_candidate_due` ON `document_clarification_requests` (`candidateId`,`status`,`dueAt`);
--> statement-breakpoint
CREATE TABLE `document_clarification_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clarificationRequestId` int NOT NULL,
  `candidateId` int NOT NULL,
  `actorRole` enum('candidate','advisor','system') NOT NULL,
  `eventType` varchar(80) NOT NULL,
  `message` text,
  `candidateMessageId` int,
  `advisorMessageId` int,
  `candidateFileId` int,
  `actorAdminId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `document_clarification_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_document_clarification_events_request_created` ON `document_clarification_events` (`clarificationRequestId`,`createdAt`);
--> statement-breakpoint
CREATE INDEX `idx_document_clarification_events_candidate_created` ON `document_clarification_events` (`candidateId`,`createdAt`);
