-- Retour arrière des index recommandés (aucune donnée n'est touchée).
DROP INDEX idx_client_documents_evaluation ON client_documents;
DROP INDEX idx_client_documents_email_type ON client_documents;
DROP INDEX idx_candidate_files_candidate_type ON candidate_files;
DROP INDEX idx_applications_candidate ON applications;
DROP INDEX idx_applications_email ON applications;
DROP INDEX idx_applications_deleted_created ON applications;
DROP INDEX idx_agency_dossiers_email ON agency_dossiers;
DROP INDEX idx_agency_dossiers_deleted_created ON agency_dossiers;
DROP INDEX idx_evaluations_email ON evaluations;
DROP INDEX idx_evaluations_candidate ON evaluations;
DROP INDEX idx_candidates_status_deleted_created ON candidates;
