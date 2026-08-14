CREATE TABLE IF NOT EXISTS `agency_dossier_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dossierId` int NOT NULL,
  `documentType` varchar(100) NOT NULL,
  `documentName` varchar(255) NOT NULL,
  `documentUrl` text NOT NULL,
  `fileSize` int NULL,
  `source` enum('agency_scan','admin_upload','candidate_upload') NOT NULL DEFAULT 'agency_scan',
  `uploadedBy` varchar(320) NOT NULL,
  `verificationStatus` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  `verificationComment` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `agency_dossier_documents_dossier_idx` (`dossierId`),
  KEY `agency_dossier_documents_status_idx` (`verificationStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
