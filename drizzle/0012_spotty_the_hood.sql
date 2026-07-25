CREATE TABLE `client_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
	`candidateEmail` varchar(320) NOT NULL,
	`documentType` enum('passport','cv','diploma','birth_certificate','marriage_certificate','bank_statement','employment_letter','language_test','medical_exam','police_clearance','other') NOT NULL,
	`documentName` varchar(255) NOT NULL,
	`documentUrl` text,
	`fileSize` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`receivedByAdmin` boolean NOT NULL DEFAULT false,
	`adminNotes` text,
	`receiptGeneratedAt` timestamp,
	`receiptUrl` text,
	`receiptNumber` varchar(50),
	`status` enum('pending','received','verified','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
	`candidateEmail` varchar(320) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'EUR',
	`paymentMethod` enum('cash','bank_transfer','card','mobile_money','check','other') NOT NULL,
	`paymentDescription` varchar(255) NOT NULL,
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedByAdmin` boolean NOT NULL DEFAULT false,
	`adminNotes` text,
	`invoiceGeneratedAt` timestamp,
	`invoiceUrl` text,
	`invoiceNumber` varchar(50),
	`status` enum('pending','confirmed','verified','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_payments_id` PRIMARY KEY(`id`)
);
