-- Autorise les demandes 3M Solutions dans la file unifiée admin.
ALTER TABLE `unified_client_requests`
  MODIFY COLUMN `sourceType` ENUM(
    'application',
    'evaluation',
    'consultation',
    'flight',
    'insurance',
    'translation',
    'contact',
    'agency_dossier',
    'tourism',
    'digital'
  ) NOT NULL;
