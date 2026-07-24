CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorName` varchar(255) NOT NULL,
	`visitorEmail` varchar(320) NOT NULL,
	`visitorPhone` varchar(50),
	`sessionId` varchar(128) NOT NULL,
	`senderRole` enum('visitor','support') NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`subject` varchar(255),
	`status` enum('active','closed','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
