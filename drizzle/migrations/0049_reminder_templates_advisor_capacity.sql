CREATE TABLE IF NOT EXISTS `procedure_reminder_templates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `procedureType` VARCHAR(80) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `updatedByAdminId` INT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `procedure_reminder_templates_procedureType_unique` (`procedureType`)
);

ALTER TABLE `admin_accounts`
  ADD COLUMN `maxActiveCases` INT NOT NULL DEFAULT 20 AFTER `status`;
