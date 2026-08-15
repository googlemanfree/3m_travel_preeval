-- Migration non destructive : pièces jointes des messages candidat-conseiller
SET @db_name = DATABASE();

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'candidate_messages'
      AND column_name = 'attachmentUrl'
  ),
  'SELECT 1',
  'ALTER TABLE `candidate_messages` ADD COLUMN `attachmentUrl` TEXT NULL'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'candidate_messages'
      AND column_name = 'attachmentName'
  ),
  'SELECT 1',
  'ALTER TABLE `candidate_messages` ADD COLUMN `attachmentName` VARCHAR(255) NULL'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'candidate_messages'
      AND column_name = 'attachmentMimeType'
  ),
  'SELECT 1',
  'ALTER TABLE `candidate_messages` ADD COLUMN `attachmentMimeType` VARCHAR(100) NULL'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'candidate_messages'
      AND column_name = 'attachmentSizeBytes'
  ),
  'SELECT 1',
  'ALTER TABLE `candidate_messages` ADD COLUMN `attachmentSizeBytes` INT NULL'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
