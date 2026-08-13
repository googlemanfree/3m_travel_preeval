ALTER TABLE `candidates`
  ADD COLUMN `preferredLanguage` enum('fr','en') NOT NULL DEFAULT 'fr';

UPDATE `candidates`
SET `preferredLanguage` = 'fr'
WHERE `preferredLanguage` IS NULL;

-- La valeur par défaut et la contrainte NOT NULL couvrent les futurs comptes.
