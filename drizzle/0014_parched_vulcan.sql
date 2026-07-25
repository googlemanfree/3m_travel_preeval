CREATE TABLE `appointment_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agencyLocation` varchar(255) NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10) NOT NULL,
	`slotDurationMinutes` int NOT NULL DEFAULT 30,
	`maxAppointmentsPerSlot` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointment_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
	`candidateEmail` varchar(320) NOT NULL,
	`candidateName` varchar(255) NOT NULL,
	`candidatePhone` varchar(50) NOT NULL,
	`appointmentDate` varchar(20) NOT NULL,
	`appointmentTime` varchar(10) NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 30,
	`agencyLocation` varchar(255) NOT NULL,
	`agencyAddress` text,
	`agencyPhone` varchar(50),
	`appointmentReason` enum('initial_consultation','document_submission','payment_cash','follow_up','visa_collection','other') NOT NULL DEFAULT 'initial_consultation',
	`appointmentNotes` text,
	`confirmedByAdmin` boolean NOT NULL DEFAULT false,
	`adminNotes` text,
	`assignedToAgent` varchar(320),
	`status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
	`completionNotes` text,
	`emailSent` boolean NOT NULL DEFAULT false,
	`whatsappSent` boolean NOT NULL DEFAULT false,
	`reminderSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `translation_download_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`translationRequestId` int NOT NULL,
	`candidateEmail` varchar(320) NOT NULL,
	`downloadedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `translation_download_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `translation_languages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `translation_languages_id` PRIMARY KEY(`id`),
	CONSTRAINT `translation_languages_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `translation_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentType` enum('birth_certificate','diploma','transcript','criminal_record','marriage_certificate','divorce_decree','employment_letter','bank_statement','passport','driver_license','medical_report','other') NOT NULL,
	`sourceLanguageCode` varchar(10) NOT NULL,
	`targetLanguageCode` varchar(10) NOT NULL,
	`pricePerPage` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'EUR',
	`turnaroundDays` int NOT NULL DEFAULT 3,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `translation_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `translation_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int,
	`candidateEmail` varchar(320) NOT NULL,
	`candidateName` varchar(255) NOT NULL,
	`candidatePhone` varchar(50),
	`documentType` enum('birth_certificate','diploma','transcript','criminal_record','marriage_certificate','divorce_decree','employment_letter','bank_statement','passport','driver_license','medical_report','other') NOT NULL,
	`sourceLanguageCode` varchar(10) NOT NULL,
	`targetLanguageCode` varchar(10) NOT NULL,
	`numberOfPages` int NOT NULL,
	`sourceDocumentUrl` text NOT NULL,
	`sourceDocumentName` varchar(255) NOT NULL,
	`sourceDocumentSize` int,
	`pricePerPage` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'EUR',
	`paymentStatus` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`paymentTransactionId` varchar(255),
	`paymentDate` timestamp,
	`invoiceNumber` varchar(50),
	`invoiceUrl` text,
	`status` enum('pending_payment','pending_translation','in_progress','completed','rejected') NOT NULL DEFAULT 'pending_payment',
	`assignedToTranslator` varchar(320),
	`translatorNotes` text,
	`translatedDocumentUrl` text,
	`translatedDocumentName` varchar(255),
	`translatedDocumentSize` int,
	`completionDate` timestamp,
	`paymentNotificationSent` boolean NOT NULL DEFAULT false,
	`completionNotificationSent` boolean NOT NULL DEFAULT false,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `translation_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','translator') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `client_documents` ADD `source` enum('online','scanned_agency','manual_admin') DEFAULT 'online' NOT NULL;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `uploadedByAdmin` varchar(320);