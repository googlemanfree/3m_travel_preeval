CREATE TABLE `document_clarification_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `candidateId` int NOT NULL,
  `documentLabel` varchar(180) NOT NULL,
  `requestMessage` text NOT NULL,
  `status` enum('pending','answered','closed') NOT NULL DEFAULT 'pending',
  `responseMessage` text,
  `answeredByAdminId` int,
  `candidateMessageId` int,
  `advisorMessageId` int,
  `notificationId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `answeredAt` timestamp,
  `closedAt` timestamp,
  CONSTRAINT `document_clarification_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_document_clarifications_candidate_status` ON `document_clarification_requests` (`candidateId`,`status`,`createdAt`);
--> statement-breakpoint
CREATE INDEX `idx_document_clarifications_status_created` ON `document_clarification_requests` (`status`,`createdAt`);
