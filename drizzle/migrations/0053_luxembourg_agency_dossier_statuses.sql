ALTER TABLE `agency_dossiers`
  MODIFY COLUMN `status` ENUM(
    'nouveau',
    'en_cours',
    'documents_requis',
    'recherche_employeur',
    'validation_adem',
    'soumis',
    'approuve',
    'refuse'
  ) NOT NULL DEFAULT 'nouveau';
