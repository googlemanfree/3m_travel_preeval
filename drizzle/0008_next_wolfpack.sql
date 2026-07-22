ALTER TABLE `applications` ADD `agreementSigned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `agreementSignedAt` int;--> statement-breakpoint
ALTER TABLE `applications` ADD `agreementSignatureName` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `agreementIpAddress` varchar(64);--> statement-breakpoint
ALTER TABLE `applications` ADD `evaluationEmailSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `evaluationEmailScheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `appointmentScheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `appointmentConfirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `appointmentConfirmationEmailSentAt` timestamp;