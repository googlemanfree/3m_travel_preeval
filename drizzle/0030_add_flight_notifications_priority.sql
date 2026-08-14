ALTER TABLE `flight_booking_requests`
  ADD COLUMN `candidatePhone` varchar(32) NULL,
  ADD COLUMN `priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal';

CREATE TABLE `flight_booking_notifications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `requestId` int NOT NULL,
  `channel` enum('email','whatsapp') NOT NULL,
  `recipient` varchar(320) NOT NULL,
  `status` enum('sent','failed','skipped') NOT NULL,
  `statusValue` varchar(64) NOT NULL,
  `errorMessage` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `flight_booking_notifications_id` PRIMARY KEY(`id`),
  KEY `idx_flight_notifications_request` (`requestId`, `createdAt`)
);
