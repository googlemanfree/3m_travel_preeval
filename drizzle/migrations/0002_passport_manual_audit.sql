-- Audit immuable des décisions humaines prises sur les passeports.
-- Migration additive : aucune table métier existante n’est supprimée ou modifiée.
CREATE TABLE IF NOT EXISTS `passport_verification_audits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `documentId` INT NOT NULL,
  `applicationId` INT NULL,
  `adminEmail` VARCHAR(320) NOT NULL,
  `decision` ENUM('approved','rejected') NOT NULL,
  `comment` TEXT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_passport_audit_document_created` (`documentId`,`createdAt`),
  INDEX `idx_passport_audit_admin_created` (`adminEmail`,`createdAt`)
);
