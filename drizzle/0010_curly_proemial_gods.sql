ALTER TABLE `candidates` ADD `adminNote` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `adminPrivateNote` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `processingSteps` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `honoraires` int;--> statement-breakpoint
ALTER TABLE `candidates` ADD `honorairesNote` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `honorairesStatus` enum('pending','proposed','accepted','refused') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `candidates` ADD `procedureChoisie` varchar(255);