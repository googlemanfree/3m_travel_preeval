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
	CONSTRAINT `approved_visas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(300) NOT NULL,
	`excerpt` varchar(500),
	`content` text NOT NULL,
	`category` enum('Visas','Études','Voyages','Immigration','Conseils','Actualités') NOT NULL,
	`authorName` varchar(100),
	`authorId` int,
	`imageUrl` varchar(500),
	`tags` text,
	`isPublished` boolean NOT NULL DEFAULT false,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`readTimeMinutes` int DEFAULT 5,
	`viewCount` int DEFAULT 0,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `callback_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`phone` varchar(30) NOT NULL,
	`email` varchar(320),
	`subject` varchar(255),
	`preferredTime` varchar(100),
	`status` enum('pending','contacted','resolved','cancelled') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `callback_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `country_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`country` varchar(100) NOT NULL,
	`visaType` varchar(100) NOT NULL,
	`visaFee` int NOT NULL DEFAULT 0,
	`serviceFee` int NOT NULL DEFAULT 0,
	`guaranteeFee` int DEFAULT 0,
	`translationFee` int DEFAULT 0,
	`otherFees` int DEFAULT 0,
	`processingDays` int DEFAULT 30,
	`successRate` int DEFAULT 75,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `country_costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dossier_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`currentStep` varchar(50) NOT NULL DEFAULT 'nouveau',
	`completedSteps` text,
	`notes` text,
	`updatedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dossier_progress_id` PRIMARY KEY(`id`)
);
