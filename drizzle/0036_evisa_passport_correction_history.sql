CREATE TABLE IF NOT EXISTS `evisa_passport_correction_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `requestId` int NOT NULL,
  `actorEmail` varchar(255),
  `actorName` varchar(255),
  `source` varchar(32) NOT NULL DEFAULT 'candidate',
  `changedFields` text NOT NULL,
  `previousData` longtext,
  `nextData` longtext NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `idx_evisa_passport_history_request_created` (`requestId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
