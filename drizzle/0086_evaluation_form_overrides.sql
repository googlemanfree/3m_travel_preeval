-- Questions modifiables par l'administration (formulaire d'évaluation dynamique) — migration 0086.
-- Uniquement une NOUVELLE table : aucune table existante n'est modifiée.
-- Une règle masque, renomme, rend obligatoire ou facultative, ou ajoute une question pour un contexte
-- (type de projet, visa ou programme, domaine, pays). Un contexte vide signifie « tous ».
CREATE TABLE IF NOT EXISTS evaluation_form_overrides (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  field_key VARCHAR(60) NOT NULL,
  action ENUM('hide', 'relabel', 'require', 'optional', 'add') NOT NULL,
  project_kind ENUM('travail', 'etudes', 'tourisme', 'evisa', 'immigration') NULL,
  program_id VARCHAR(80) NULL,
  domain_id VARCHAR(40) NULL,
  country_code VARCHAR(2) NULL,
  payload TEXT NULL,
  note VARCHAR(300) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_admin_id INT NULL,
  created_by_label VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_evaluation_form_overrides_active (active, project_kind, program_id)
);
