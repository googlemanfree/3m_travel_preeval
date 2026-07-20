ALTER TABLE `applications` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `emailOtp` varchar(10);--> statement-breakpoint
ALTER TABLE `applications` ADD `emailOtpExpiresAt` timestamp;