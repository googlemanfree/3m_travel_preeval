CREATE TABLE `admin_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`adminType` enum('evaluation','accompagnement','procedures') NOT NULL,
	`otpCode` varchar(6),
	`otpExpiresAt` timestamp,
	`otpAttempts` int NOT NULL DEFAULT 0,
	`sessionToken` varchar(256),
	`sessionExpiresAt` timestamp,
	`lastLoginAt` timestamp,
	`fullName` varchar(255) NOT NULL,
	`phone` varchar(50),
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `admin_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`adminEmail` varchar(320) NOT NULL,
	`adminType` varchar(50) NOT NULL,
	`action` varchar(255) NOT NULL,
	`targetId` int,
	`targetEmail` varchar(320),
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_logs_id` PRIMARY KEY(`id`)
);
