ALTER TABLE `candidates`
  MODIFY COLUMN `preferredLanguage` enum('fr','en') NULL DEFAULT NULL;

UPDATE `candidates`
SET `preferredLanguage` = NULL;
