ALTER TABLE `candidates` ADD `magicLinkToken` varchar(128);--> statement-breakpoint
ALTER TABLE `candidates` ADD `magicLinkExpiresAt` timestamp;