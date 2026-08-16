CREATE TABLE IF NOT EXISTS `unified_client_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sourceType` enum('application','evaluation','consultation','flight','insurance','translation','contact','agency_dossier') NOT NULL,
  `sourceRecordId` int NOT NULL,
  `candidateId` int,
  `caseId` int,
  `displayReference` varchar(64) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(50),
  `destination` varchar(100),
  `requestTypeLabel` varchar(120) NOT NULL,
  `workflowStatus` enum('new','qualifying','waiting_customer','documents_review','payment_review','processing','submitted','completed','closed','rejected') NOT NULL DEFAULT 'new',
  `priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `assignedAdminAccountId` int,
  `firstRespondedAt` timestamp NULL,
  `dueAt` timestamp NULL,
  `lastActivityAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_unified_request_source` (`sourceType`, `sourceRecordId`),
  KEY `idx_unified_request_queue` (`workflowStatus`, `assignedAdminAccountId`, `dueAt`),
  KEY `idx_unified_request_candidate` (`candidateId`, `email`)
);

CREATE TABLE IF NOT EXISTS `unified_client_request_history` (
  `id` int AUTO_INCREMENT NOT NULL,
  `requestId` int NOT NULL,
  `actionType` varchar(80) NOT NULL,
  `previousValue` varchar(120),
  `newValue` varchar(120),
  `comment` text,
  `actorAdminAccountId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_unified_request_history_request` (`requestId`, `createdAt`)
);
