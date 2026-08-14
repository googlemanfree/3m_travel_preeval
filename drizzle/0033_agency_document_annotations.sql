-- Historique des demandes de correction ciblées sur les documents d’agence.
-- Migration additive : aucune donnée existante n’est supprimée.
CREATE TABLE IF NOT EXISTS agency_dossier_document_annotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  documentId INT NOT NULL,
  dossierId INT NOT NULL,
  authorEmail VARCHAR(320) NOT NULL,
  message TEXT NOT NULL,
  areaLabel VARCHAR(120) NULL,
  x INT NULL,
  y INT NULL,
  width INT NULL,
  height INT NULL,
  status ENUM('open', 'resolved') NOT NULL DEFAULT 'open',
  resolvedBy VARCHAR(320) NULL,
  resolvedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_annotation_document (documentId),
  INDEX idx_annotation_dossier (dossierId),
  INDEX idx_annotation_status (status)
); 
