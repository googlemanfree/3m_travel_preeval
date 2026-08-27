CREATE TABLE `candidate_email_change_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `candidateId` int NOT NULL,
  `currentEmail` varchar(320) NOT NULL,
  `newEmail` varchar(320) NOT NULL,
  `currentEmailTokenHash` varchar(128) NOT NULL,
  `newEmailTokenHash` varchar(128) NOT NULL,
  `currentEmailConfirmedAt` timestamp NULL,
  `newEmailConfirmedAt` timestamp NULL,
  `status` enum('pending','confirmed','cancelled','expired') NOT NULL DEFAULT 'pending',
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `candidate_email_change_requests_candidate_idx` (`candidateId`),
  INDEX `candidate_email_change_requests_lookup_idx` (`status`, `expiresAt`)
);
