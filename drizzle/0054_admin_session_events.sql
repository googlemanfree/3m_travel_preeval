CREATE TABLE `admin_session_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `adminId` int NOT NULL,
  `eventType` enum('login','renewed','revoked_all') NOT NULL,
  `expiresAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
