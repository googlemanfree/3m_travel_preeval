CREATE TABLE IF NOT EXISTS `flight_loyalty_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidateId` int NOT NULL,
  `availablePoints` int NOT NULL DEFAULT 0,
  `lifetimePoints` int NOT NULL DEFAULT 0,
  `issuedBookings` int NOT NULL DEFAULT 0,
  `tier` enum('explorer','silver','gold','platinum') NOT NULL DEFAULT 'explorer',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `flight_loyalty_accounts_id` PRIMARY KEY(`id`),
  CONSTRAINT `flight_loyalty_accounts_candidateId_unique` UNIQUE(`candidateId`),
  KEY `idx_flight_loyalty_tier` (`tier`)
);

CREATE TABLE IF NOT EXISTS `flight_loyalty_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidateId` int NOT NULL,
  `requestId` int NOT NULL,
  `points` int NOT NULL,
  `reason` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `flight_loyalty_transactions_id` PRIMARY KEY(`id`),
  CONSTRAINT `flight_loyalty_transactions_requestId_unique` UNIQUE(`requestId`),
  KEY `idx_flight_loyalty_candidate_created` (`candidateId`,`createdAt`)
);

CREATE TABLE IF NOT EXISTS `flight_partner_quotes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requestId` int NOT NULL,
  `partnerName` varchar(160) NOT NULL,
  `quotedAmountXaf` int NOT NULL,
  `currency` varchar(8) NOT NULL DEFAULT 'XAF',
  `fareDetails` text,
  `baggageDetails` text,
  `terms` text,
  `sourceReference` varchar(255) NOT NULL,
  `verifiedBy` varchar(320) NOT NULL,
  `verifiedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isActive` boolean NOT NULL DEFAULT TRUE,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `flight_partner_quotes_id` PRIMARY KEY(`id`),
  KEY `idx_flight_partner_quotes_request_active` (`requestId`,`isActive`)
);
