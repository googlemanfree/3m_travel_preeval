-- Catalogue mondial des parcours (travail, études, visiteur) : uniquement de nouvelles tables, idempotent.
CREATE TABLE IF NOT EXISTS country_pathways (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL,
  pathway ENUM('work', 'study', 'visit') NOT NULL,
  coverage ENUM('named', 'to_document', 'not_offered') NOT NULL DEFAULT 'to_document',
  summary TEXT NULL,
  status ENUM('draft', 'needs_review', 'published', 'retired') NOT NULL DEFAULT 'needs_review',
  schema_version INT NOT NULL DEFAULT 1,
  checked_at TIMESTAMP NULL,
  checked_by_admin_id INT NULL,
  checked_by_label VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_country_pathways_country_pathway (country_code, pathway),
  INDEX idx_country_pathways_status (status, pathway)
);

CREATE TABLE IF NOT EXISTS country_visa_programs (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL,
  pathway ENUM('work', 'study', 'visit') NOT NULL,
  program_ref VARCHAR(80) NULL,
  official_name VARCHAR(200) NOT NULL,
  name_fr VARCHAR(200) NULL,
  legal_basis VARCHAR(300) NULL,
  route_type ENUM('employer', 'qualified', 'transfer', 'seasonal', 'jobseeker', 'quota', 'points') NULL,
  offer_required ENUM('yes', 'no', 'depends') NULL,
  sponsor_licence_required BOOLEAN NULL,
  labour_market_test BOOLEAN NULL,
  salary_note TEXT NULL,
  duration_note TEXT NULL,
  renewable BOOLEAN NULL,
  family_allowed BOOLEAN NULL,
  residence_path_note TEXT NULL,
  fees_note TEXT NULL,
  processing_note TEXT NULL,
  status ENUM('draft', 'needs_review', 'published', 'retired') NOT NULL DEFAULT 'needs_review',
  checked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_country_visa_programs_country (country_code, pathway, status)
);

CREATE TABLE IF NOT EXISTS country_sources (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL,
  pathway ENUM('work', 'study', 'visit') NOT NULL,
  label VARCHAR(200) NOT NULL,
  url VARCHAR(600) NOT NULL,
  authority ENUM('immigration', 'embassy', 'ministry', 'education', 'employment', 'other') NOT NULL DEFAULT 'other',
  status ENUM('verified', 'needs_review', 'missing') NOT NULL DEFAULT 'needs_review',
  note VARCHAR(300) NULL,
  checked_at TIMESTAMP NULL,
  checked_by_admin_id INT NULL,
  checked_by_label VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_country_sources_country (country_code, pathway)
);

CREATE TABLE IF NOT EXISTS procedure_steps (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  program_id INT NOT NULL,
  step_no INT NOT NULL,
  actor ENUM('employer', 'candidate', 'authority', 'agency', 'institution') NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  documents_json JSON NULL,
  delay_note VARCHAR(300) NULL,
  fee_note VARCHAR(300) NULL,
  official_url VARCHAR(600) NULL,
  status ENUM('draft', 'needs_review', 'published', 'retired') NOT NULL DEFAULT 'needs_review',
  checked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_procedure_steps_program (program_id, step_no)
);
