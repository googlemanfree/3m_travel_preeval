CREATE TABLE `flightBookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingRef` varchar(20) NOT NULL,
	`flightData` text NOT NULL,
	`passengersData` text NOT NULL,
	`adultsCount` int NOT NULL DEFAULT 1,
	`childrenCount` int NOT NULL DEFAULT 0,
	`infantsCount` int NOT NULL DEFAULT 0,
	`totalPrice` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'XAF',
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(50) NOT NULL,
	`bookingStatus` enum('pending','confirmed','paid','ticketed','cancelled') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flightBookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `flightBookings_bookingRef_unique` UNIQUE(`bookingRef`)
);
--> statement-breakpoint
ALTER TABLE `applications` ADD `agreementSigned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `agreementSignedAt` int;--> statement-breakpoint
ALTER TABLE `applications` ADD `agreementSignatureName` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `agreementIpAddress` varchar(64);