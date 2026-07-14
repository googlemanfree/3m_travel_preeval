CREATE TABLE `candidate_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`fileType` enum('cv','passeport','diplome','releve_notes','photo','justificatif_domicile','extrait_naissance','casier_judiciaire','autre') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileSizeBytes` int,
	`mimeType` varchar(100),
	`status` enum('uploaded','verified','rejected') NOT NULL DEFAULT 'uploaded',
	`rejectionReason` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidate_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidate_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`senderRole` enum('candidate','advisor') NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidate_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`nationality` varchar(100),
	`dateOfBirth` varchar(20),
	`passwordHash` varchar(255) NOT NULL,
	`destination` enum('canada','luxembourg','pologne','europe','golfe','autre') DEFAULT 'autre',
	`visaType` varchar(100),
	`dossierStatus` enum('nouveau','evaluation','documents','traitement','soumis','approuve','refuse') NOT NULL DEFAULT 'nouveau',
	`dossierNote` text,
	`formulaChosen` varchar(100),
	`scoreResult` varchar(50),
	`scoreDetails` text,
	`educationLevel` varchar(100),
	`employmentStatus` varchar(100),
	`languageLevel` varchar(100),
	`emailVerified` boolean NOT NULL DEFAULT false,
	`verificationToken` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastLoginAt` timestamp,
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidates_email_unique` UNIQUE(`email`)
);
