ALTER TABLE `client_documents` ADD `verificationStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `verificationComment` text;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `verifiedByAdmin` varchar(320);--> statement-breakpoint
ALTER TABLE `client_documents` ADD `verifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `readabilityScore` int;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `readabilityIssues` json;