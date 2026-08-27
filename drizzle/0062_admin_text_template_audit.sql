CREATE TABLE `admin_text_template_audit_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `templateId` int NOT NULL,
  `templateName` varchar(120) NOT NULL,
  `scope` enum('candidate_message','evaluation_message','general') NOT NULL,
  `language` enum('fr','en') NOT NULL,
  `action` enum('created','updated','deleted') NOT NULL,
  `actorAdminId` int NOT NULL,
  `contentFingerprint` varchar(64) NOT NULL,
  `reason` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `admin_text_template_audit_events_id` PRIMARY KEY(`id`),
  INDEX `admin_text_template_audit_template_idx` (`templateId`,`createdAt`),
  INDEX `admin_text_template_audit_actor_idx` (`actorAdminId`,`createdAt`)
);
