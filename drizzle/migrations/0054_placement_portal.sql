CREATE TABLE IF NOT EXISTS placement_organizations (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_type ENUM('placement_partner', 'employer') NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  country VARCHAR(120) NOT NULL,
  contact_email VARCHAR(320) NOT NULL,
  verification_status ENUM('pending', 'verified', 'suspended') NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP NULL,
  verified_by_admin_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_placement_organizations_status (verification_status, organization_type)
);

CREATE TABLE IF NOT EXISTS placement_employer_accounts (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  session_token_hash VARCHAR(128) NULL,
  session_expires_at TIMESTAMP NULL,
  status ENUM('invited', 'active', 'suspended') NOT NULL DEFAULT 'invited',
  created_by_admin_id INT NOT NULL,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_placement_employer_accounts_email (email),
  INDEX idx_placement_employer_org (organization_id, status)
);

CREATE TABLE IF NOT EXISTS candidate_placement_consents (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  status ENUM('granted', 'withdrawn') NOT NULL DEFAULT 'withdrawn',
  consented_at TIMESTAMP NULL,
  withdrawn_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_candidate_placement_consents_candidate (candidate_id)
);

CREATE TABLE IF NOT EXISTS placement_candidate_profiles (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  profile_code VARCHAR(48) NOT NULL,
  summary TEXT NOT NULL,
  target_destination VARCHAR(120) NOT NULL,
  target_procedure VARCHAR(160) NOT NULL,
  sector VARCHAR(160) NULL,
  years_experience VARCHAR(32) NULL,
  languages_summary VARCHAR(255) NULL,
  created_by_admin_id INT NOT NULL,
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_placement_candidate_profiles_code (profile_code),
  INDEX idx_placement_profiles_candidate (candidate_id, archived_at)
);

CREATE TABLE IF NOT EXISTS placement_profile_submissions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  organization_id INT NOT NULL,
  status ENUM('submitted', 'under_review', 'shortlisted', 'selected', 'not_selected', 'documents_requested', 'procedure_ready', 'withdrawn') NOT NULL DEFAULT 'submitted',
  submitted_by_admin_id INT NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_response_at TIMESTAMP NULL,
  admin_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_placement_submissions_org (organization_id, status)
);

CREATE TABLE IF NOT EXISTS placement_submission_events (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  actor_type ENUM('admin', 'employer', 'candidate', 'system') NOT NULL,
  actor_id INT NULL,
  action VARCHAR(100) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_placement_events_submission (submission_id, created_at)
);
