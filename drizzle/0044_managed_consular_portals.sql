CREATE TABLE IF NOT EXISTS `managed_consular_portals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `countryCode` varchar(120) NOT NULL,
  `countryName` varchar(160) NOT NULL,
  `officialPortalUrl` text,
  `officialPortalLabel` varchar(255),
  `officialVerifiedAt` varchar(80),
  `verificationStatus` enum('verifie','a_completer') NOT NULL DEFAULT 'a_completer',
  `verificationNote` text,
  `updatedByAdminId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `managed_consular_portals_id` PRIMARY KEY(`id`),
  CONSTRAINT `managed_consular_portals_countryCode_unique` UNIQUE(`countryCode`)
);

CREATE TABLE IF NOT EXISTS `managed_consular_portal_audit_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `portalId` int NOT NULL,
  `countryCode` varchar(120) NOT NULL,
  `action` enum('created','updated') NOT NULL,
  `summary` varchar(500) NOT NULL,
  `previousSnapshotJson` text,
  `nextSnapshotJson` text,
  `actorAdminId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `managed_consular_portal_audit_logs_id` PRIMARY KEY(`id`)
);
