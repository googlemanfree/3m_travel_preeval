-- Custom SQL migration file, put your code below! --
CREATE TABLE `destination_media` (
  `id` int AUTO_INCREMENT NOT NULL,
  `destinationId` varchar(160) NOT NULL,
  `imageUrl` text,
  `imageKey` varchar(512),
  `flagUrl` text,
  `flagKey` varchar(512),
  `imageAlt` varchar(255),
  `flagAlt` varchar(255),
  `updatedByAdminId` int,
  `updatedByAdminEmail` varchar(320),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `destination_media_id` PRIMARY KEY(`id`),
  CONSTRAINT `destination_media_destinationId_unique` UNIQUE(`destinationId`),
  INDEX `idx_destination_media_updated_at` (`updatedAt`)
);