CREATE TABLE `approved_visas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`country` varchar(100) NOT NULL,
	`visaType` varchar(100) NOT NULL,
	`destination` varchar(100) NOT NULL,
	`approvedDate` varchar(20) NOT NULL,
	`testimonial` text,
	`isPublic` boolean NOT NULL DEFAULT true,
	`imageUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approved_visas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `callback_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(30) NOT NULL,
	`email` varchar(320),
	`preferredTime` varchar(100),
	`preferredDate` varchar(20),
	`subject` varchar(255),
	`message` text,
	`status` enum('pending','scheduled','completed','cancelled') NOT NULL DEFAULT 'pending',
	`scheduledAt` timestamp,
	`completedAt` timestamp,
	`adminNotes` text,
	`applicationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `callback_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `country_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`country` varchar(100) NOT NULL,
	`visaType` varchar(100) NOT NULL,
	`visaFee` int NOT NULL,
	`serviceFee` int NOT NULL,
	`guaranteeFee` int DEFAULT 0,
	`translationFee` int DEFAULT 0,
	`otherFees` int DEFAULT 0,
	`processingDays` int NOT NULL,
	`successRate` int DEFAULT 85,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `country_costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dossier_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`dossierNumber` varchar(20) NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`stepsStatus` text NOT NULL DEFAULT ('{"step1":"completed","step2":"pending","step3":"pending","step4":"pending","step5":"pending"}'),
	`step1CompletedAt` timestamp,
	`step2CompletedAt` timestamp,
	`step3CompletedAt` timestamp,
	`step4CompletedAt` timestamp,
	`step5CompletedAt` timestamp,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dossier_progress_id` PRIMARY KEY(`id`)
);
