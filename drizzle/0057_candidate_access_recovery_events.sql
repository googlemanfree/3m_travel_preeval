CREATE TABLE `candidate_access_recovery_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `requestId` int NOT NULL,
  `adminEmail` varchar(320) NOT NULL,
  `action` enum('reviewing','identity_verified','rejected','closed') NOT NULL,
  `note` varchar(500) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `candidate_access_recovery_events_request_idx` (`requestId`, `createdAt`)
);
