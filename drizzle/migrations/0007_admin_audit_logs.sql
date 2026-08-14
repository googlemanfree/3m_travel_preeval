CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `adminAccountId` int,
  `adminEmail` varchar(320) NOT NULL,
  `action` varchar(120) NOT NULL,
  `category` varchar(40) NOT NULL,
  `resourceType` varchar(80),
  `resourceId` varchar(120),
  `outcome` enum('success','failure') NOT NULL DEFAULT 'success',
  `details` text,
  `ipAddress` varchar(64),
  `userAgent` varchar(512),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `admin_audit_logs_id` PRIMARY KEY(`id`),
  INDEX `idx_admin_audit_created` (`createdAt`),
  INDEX `idx_admin_audit_admin_created` (`adminAccountId`, `createdAt`),
  INDEX `idx_admin_audit_action_created` (`action`, `createdAt`)
);
