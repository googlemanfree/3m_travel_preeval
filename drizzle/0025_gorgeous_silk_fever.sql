CREATE TABLE `evaluation_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dossierNumber` varchar(20) NOT NULL,
	`applicationId` int,
	`authorType` enum('candidate','admin') NOT NULL,
	`authorId` int,
	`authorName` varchar(255) NOT NULL,
	`authorEmail` varchar(320) NOT NULL,
	`content` text NOT NULL,
	`isQuestion` boolean NOT NULL DEFAULT true,
	`isResolved` boolean NOT NULL DEFAULT false,
	`parentCommentId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluation_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evisa_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`nationality` varchar(100),
	`dateOfBirth` varchar(20),
	`countryCode` varchar(3) NOT NULL,
	`countryName` varchar(100) NOT NULL,
	`evisaType` varchar(100),
	`visaFee` int NOT NULL DEFAULT 0,
	`accompanimentFee` int NOT NULL DEFAULT 25000,
	`totalCost` int NOT NULL DEFAULT 25000,
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`status` enum('pending','submitted','processing','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`dossierNumber` varchar(50),
	`documents` text,
	`passportFile` text,
	`passportFileName` varchar(255),
	`passportFileSize` int,
	`passportUploadedAt` timestamp,
	`notes` text,
	`adminNotes` text,
	`adminAssignedTo` varchar(255),
	`lastStatusUpdateAt` timestamp,
	`lastStatusUpdatedBy` varchar(255),
	`adminNotificationSentAt` timestamp,
	`clientConfirmationSentAt` timestamp,
	`submittedAt` timestamp,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evisa_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `evisa_requests_dossierNumber_unique` UNIQUE(`dossierNumber`)
);
--> statement-breakpoint
CREATE TABLE `evisas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryCode` varchar(3) NOT NULL,
	`countryName` varchar(100) NOT NULL,
	`countryFlag` varchar(10),
	`continent` varchar(50) NOT NULL,
	`region` varchar(100),
	`description` text,
	`evisaType` varchar(100) NOT NULL,
	`visaFee` int NOT NULL DEFAULT 0,
	`accompanimentFee` int NOT NULL DEFAULT 25000,
	`totalCost` int NOT NULL DEFAULT 25000,
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`processingTime` varchar(100) NOT NULL,
	`validity` varchar(100) NOT NULL,
	`stayDuration` varchar(100),
	`requirements` text,
	`documents` text,
	`eligibility` text,
	`restrictions` text,
	`advantages` text,
	`additionalInfo` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`isPopular` boolean NOT NULL DEFAULT false,
	`lastUpdatedBy` varchar(255),
	`aiGenerated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evisas_id` PRIMARY KEY(`id`),
	CONSTRAINT `evisas_countryCode_unique` UNIQUE(`countryCode`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`candidateId` int NOT NULL,
	`dossierNumber` varchar(50) NOT NULL,
	`transactionId` varchar(100) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'XAF',
	`description` text,
	`status` enum('pending','processing','success','failed','cancelled') NOT NULL DEFAULT 'pending',
	`cinetpayTransactionId` varchar(100),
	`cinetpayReference` varchar(100),
	`paymentMethod` varchar(50),
	`ipAddress` varchar(45),
	`userAgent` text,
	`initiatedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_transactionId_unique` UNIQUE(`transactionId`)
);
--> statement-breakpoint
ALTER TABLE `admin_accounts` MODIFY COLUMN `lastLoginAt` timestamp DEFAULT null;--> statement-breakpoint
ALTER TABLE `applications` MODIFY COLUMN `emailOtp` varchar(10) DEFAULT null;--> statement-breakpoint
ALTER TABLE `applications` MODIFY COLUMN `emailOtpExpiresAt` timestamp DEFAULT null;--> statement-breakpoint
ALTER TABLE `callback_requests` MODIFY COLUMN `status` enum('pending','scheduled','completed','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `phone` varchar(50) DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `nationality` varchar(100) DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `dateOfBirth` varchar(20) DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `visaType` varchar(100) DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `dossierNote` text DEFAULT (null);--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `formulaChosen` varchar(100) DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `scoreResult` varchar(50) DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `scoreDetails` text DEFAULT (null);--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `educationLevel` varchar(100) DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `employmentStatus` varchar(100) DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `languageLevel` varchar(100) DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `emailOtp` varchar(10) DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `emailOtpExpiresAt` timestamp DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `passwordResetToken` varchar(128) DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `passwordResetExpiresAt` timestamp DEFAULT null;--> statement-breakpoint
ALTER TABLE `candidates` MODIFY COLUMN `lastLoginAt` timestamp DEFAULT null;--> statement-breakpoint
ALTER TABLE `dossier_progress` MODIFY COLUMN `currentStep` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `callback_requests` ADD `message` text;--> statement-breakpoint
ALTER TABLE `callback_requests` ADD `preferredDate` varchar(50);--> statement-breakpoint
ALTER TABLE `callback_requests` ADD `applicationId` int;--> statement-breakpoint
ALTER TABLE `callback_requests` ADD `adminNotes` text;--> statement-breakpoint
ALTER TABLE `callback_requests` ADD `scheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `callback_requests` ADD `completedAt` timestamp;--> statement-breakpoint
ALTER TABLE `dossier_progress` ADD `dossierNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `dossier_progress` ADD `stepsStatus` text;--> statement-breakpoint
ALTER TABLE `dossier_progress` ADD `adminNotes` text;--> statement-breakpoint
ALTER TABLE `dossier_progress` DROP COLUMN `completedSteps`;--> statement-breakpoint
ALTER TABLE `dossier_progress` DROP COLUMN `notes`;--> statement-breakpoint
ALTER TABLE `dossier_progress` DROP COLUMN `updatedBy`;