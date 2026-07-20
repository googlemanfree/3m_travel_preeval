ALTER TABLE `applications` ADD `dateOfBirth` varchar(20);--> statement-breakpoint
ALTER TABLE `applications` ADD `placeOfBirth` varchar(150);--> statement-breakpoint
ALTER TABLE `applications` ADD `gender` enum('homme','femme','autre');--> statement-breakpoint
ALTER TABLE `applications` ADD `maritalStatus` enum('celibataire','marie','divorce','veuf','union_libre');--> statement-breakpoint
ALTER TABLE `applications` ADD `currentAddress` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `currentCity` varchar(100);--> statement-breakpoint
ALTER TABLE `applications` ADD `currentCountry` varchar(100);--> statement-breakpoint
ALTER TABLE `applications` ADD `diplomaTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `diplomaInstitution` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `diplomaYear` int;--> statement-breakpoint
ALTER TABLE `applications` ADD `fieldOfStudy` varchar(150);--> statement-breakpoint
ALTER TABLE `applications` ADD `additionalDiplomas` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `currentEmployer` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `currentJobTitle` varchar(150);--> statement-breakpoint
ALTER TABLE `applications` ADD `monthlyIncome` int;--> statement-breakpoint
ALTER TABLE `applications` ADD `incomeCurrency` varchar(10) DEFAULT 'XAF';--> statement-breakpoint
ALTER TABLE `applications` ADD `bankBalance` int;--> statement-breakpoint
ALTER TABLE `applications` ADD `bankBalanceCurrency` varchar(10) DEFAULT 'XAF';--> statement-breakpoint
ALTER TABLE `applications` ADD `hasSponsorship` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `applications` ADD `sponsorName` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `sponsorRelation` varchar(100);--> statement-breakpoint
ALTER TABLE `applications` ADD `numberOfChildren` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `applications` ADD `spouseFullName` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `spouseNationality` varchar(100);--> statement-breakpoint
ALTER TABLE `applications` ADD `familyMemberInDestination` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `applications` ADD `familyMemberRelation` varchar(100);--> statement-breakpoint
ALTER TABLE `applications` ADD `familyMemberStatus` varchar(100);--> statement-breakpoint
ALTER TABLE `applications` ADD `visaType` varchar(50);