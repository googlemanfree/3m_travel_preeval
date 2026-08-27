CREATE TABLE `candidate_access_recovery_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `dossierNumber` varchar(40),
  `newEmail` varchar(320) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `preferredContact` enum('phone','whatsapp','email') NOT NULL,
  `details` varchar(500),
  `status` enum('pending','reviewing','identity_verified','rejected','closed') NOT NULL DEFAULT 'pending',
  `reviewedBy` varchar(320),
  `reviewedAt` timestamp NULL,
  `reviewNote` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `candidate_access_recovery_requests_status_idx` (`status`, `createdAt`)
);
