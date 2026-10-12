-- Dossier de traitement actif : celui ouvert / choisi par le client, synchronisé admin.
ALTER TABLE candidates
  ADD COLUMN activeDossierNumber VARCHAR(50) NULL,
  ADD COLUMN activeDossierSetAt TIMESTAMP NULL;

CREATE INDEX idx_candidates_active_dossier ON candidates (activeDossierNumber);