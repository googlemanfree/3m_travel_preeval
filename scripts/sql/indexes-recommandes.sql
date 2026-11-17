-- Index recommandés pour la base de 3M TRAVEL AGENCY (à appliquer par l'hébergeur / Manus, jamais automatiquement par l'application).
-- Chaque instruction est indépendante : si un index du même nom existe déjà, MySQL répond « Duplicate key name » et l'on passe à la suivante.
-- À lancer hors des heures de pointe ; sur des tables de quelques dizaines de milliers de lignes, quelques secondes par index.
-- Retour arrière : voir scripts/sql/indexes-recommandes-retour.sql.

-- Documents déposés (comptage par adresse, documents d'une évaluation, CV déposé à l'évaluation)
CREATE INDEX idx_client_documents_evaluation ON client_documents (evaluationId);
CREATE INDEX idx_client_documents_email_type ON client_documents (candidateEmail, documentType);

-- Fichiers des comptes (pièces et CV d'un compte)
CREATE INDEX idx_candidate_files_candidate_type ON candidate_files (candidateId, fileType);

-- Dossiers en ligne (retrouver le dossier d'un compte, trier la liste par date en ignorant la corbeille)
CREATE INDEX idx_applications_candidate ON applications (candidateId);
CREATE INDEX idx_applications_email ON applications (email);
CREATE INDEX idx_applications_deleted_created ON applications (deletedAt, createdAt);

-- Dossiers agence
CREATE INDEX idx_agency_dossiers_email ON agency_dossiers (email);
CREATE INDEX idx_agency_dossiers_deleted_created ON agency_dossiers (deletedAt, createdAt);

-- Évaluations (retrouver les évaluations d'une adresse ou d'un compte)
CREATE INDEX idx_evaluations_email ON evaluations (email);
CREATE INDEX idx_evaluations_candidate ON evaluations (candidateId);

-- Comptes à ouvrir (liste « pré-dossiers » : statut, corbeille, date)
CREATE INDEX idx_candidates_status_deleted_created ON candidates (dossierStatus, deletedAt, createdAt);
