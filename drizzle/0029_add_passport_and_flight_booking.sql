CREATE TABLE IF NOT EXISTS `passport_scan_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidateId` int NOT NULL,
  `fileKey` varchar(512) NOT NULL,
  `fileUrl` text NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `mimeType` varchar(100) NOT NULL,
  `scanStatus` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
  `extractedData` json,
  `confidence` int,
  `issues` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_passport_scans_candidate` (`candidateId`),
  KEY `idx_passport_scans_status` (`scanStatus`)
);

CREATE TABLE IF NOT EXISTS `flight_booking_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requestRef` varchar(32) NOT NULL,
  `candidateId` int NOT NULL,
  `candidateEmail` varchar(320) NOT NULL,
  `flightId` varchar(255) NOT NULL,
  `flightData` json NOT NULL,
  `passengerData` json NOT NULL,
  `status` enum('pending_review','assigned','needs_info','revalidated','awaiting_payment','issued','cancelled') NOT NULL DEFAULT 'pending_review',
  `assignedAgentEmail` varchar(320),
  `agentNotes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `flight_booking_requests_request_ref_unique` (`requestRef`),
  KEY `idx_flight_requests_status` (`status`),
  KEY `idx_flight_requests_assignee_status` (`assignedAgentEmail`,`status`),
  KEY `idx_flight_requests_candidate` (`candidateId`)
);

CREATE TABLE IF NOT EXISTS `flight_booking_request_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requestId` int NOT NULL,
  `action` varchar(80) NOT NULL,
  `changedBy` varchar(320) NOT NULL,
  `oldValue` text,
  `newValue` text,
  `details` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_flight_request_history_request` (`requestId`,`createdAt`)
);