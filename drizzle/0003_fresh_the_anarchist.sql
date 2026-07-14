ALTER TABLE `candidates` ADD `emailOtp` varchar(10);--> statement-breakpoint
ALTER TABLE `candidates` ADD `emailOtpExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `candidates` ADD `passwordResetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `candidates` ADD `passwordResetExpiresAt` timestamp;