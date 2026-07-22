CREATE TABLE `dossierDeliveredDocs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`docType` enum('lettre_invitation','attestation_inscription','permis_etudes','permis_travail','visa','billet_avion','assurance_voyage','rapport_evaluation','autre') NOT NULL DEFAULT 'autre',
	`docLabel` varchar(255) NOT NULL,
	`fileUrl` text,
	`fileKey` varchar(512),
	`fileName` varchar(255),
	`deliveredAt` timestamp NOT NULL DEFAULT (now()),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dossierDeliveredDocs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dossierPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'XAF',
	`paymentMethod` enum('mtn_momo','orange_money','virement','especes','carte','autre') NOT NULL DEFAULT 'autre',
	`transactionRef` varchar(255),
	`status` enum('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
	`label` varchar(255),
	`note` text,
	`paidAt` timestamp,
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dossierPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dossierSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`stepKey` varchar(100) NOT NULL,
	`stepLabel` varchar(255) NOT NULL,
	`stepCategory` enum('evaluation','documents','tests','equivalence','candidature','immigration','visa','arrivee') NOT NULL DEFAULT 'documents',
	`status` enum('pending','in_progress','completed','blocked','not_required') NOT NULL DEFAULT 'pending',
	`description` text,
	`dueDate` timestamp,
	`completedAt` timestamp,
	`documentUrl` text,
	`documentName` varchar(255),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dossierSteps_id` PRIMARY KEY(`id`)
);
