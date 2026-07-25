CREATE TABLE `ai_report_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int,
	`candidateId` int,
	`candidateName` varchar(255) NOT NULL,
	`candidateEmail` varchar(320) NOT NULL,
	`destination` varchar(100) NOT NULL,
	`reportId` varchar(100) NOT NULL,
	`reportContent` text,
	`sendStatus` enum('pending','sent','failed','bounced') NOT NULL DEFAULT 'pending',
	`sendAttempts` int NOT NULL DEFAULT 0,
	`lastSendError` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_report_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_report_history_reportId_unique` UNIQUE(`reportId`)
);
