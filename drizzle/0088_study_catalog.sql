-- Catalogue études : écoles, programmes, rentrées, scolarités et candidatures via l'agence. Uniquement de nouvelles tables, idempotent.
CREATE TABLE IF NOT EXISTS study_institutions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL,
  city VARCHAR(120) NULL,
  name VARCHAR(255) NOT NULL,
  institution_type ENUM('university', 'college', 'business_school', 'language_school', 'vocational', 'other') NOT NULL DEFAULT 'university',
  public_private ENUM('public', 'private') NULL,
  accreditation_note VARCHAR(500) NULL,
  admin_website VARCHAR(600) NULL,
  agency_relation ENUM('partner', 'listed') NOT NULL DEFAULT 'listed',
  status ENUM('draft', 'needs_review', 'published', 'retired') NOT NULL DEFAULT 'needs_review',
  checked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_study_institutions_country (country_code, status)
);

CREATE TABLE IF NOT EXISTS study_programs (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  institution_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  level ENUM('language', 'certificate', 'diploma', 'bachelor', 'master', 'phd', 'vocational') NOT NULL DEFAULT 'bachelor',
  field VARCHAR(160) NULL,
  teaching_language VARCHAR(80) NULL,
  duration_months SMALLINT NULL,
  mode ENUM('on_site', 'hybrid') NOT NULL DEFAULT 'on_site',
  admission_note TEXT NULL,
  language_note VARCHAR(500) NULL,
  status ENUM('draft', 'needs_review', 'published', 'retired') NOT NULL DEFAULT 'needs_review',
  checked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_study_programs_institution (institution_id, status)
);

CREATE TABLE IF NOT EXISTS study_intakes (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  program_id INT NOT NULL,
  label VARCHAR(120) NOT NULL,
  start_date DATE NOT NULL,
  applications_open_at DATE NULL,
  application_deadline DATE NULL,
  documents_deadline DATE NULL,
  availability ENUM('open', 'closing_soon', 'closed', 'waitlist') NOT NULL DEFAULT 'open',
  status ENUM('draft', 'needs_review', 'published', 'retired') NOT NULL DEFAULT 'needs_review',
  checked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_study_intakes_program (program_id, status, start_date)
);

CREATE TABLE IF NOT EXISTS study_tuition_fees (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  program_id INT NOT NULL,
  academic_year VARCHAR(9) NOT NULL,
  student_category ENUM('international', 'local') NOT NULL DEFAULT 'international',
  amount DECIMAL(12, 2) NOT NULL,
  currency CHAR(3) NOT NULL,
  period ENUM('year', 'semester', 'total') NOT NULL DEFAULT 'year',
  application_fee DECIMAL(10, 2) NULL,
  extra_note VARCHAR(500) NULL,
  source_note VARCHAR(500) NULL,
  status ENUM('draft', 'needs_review', 'published', 'retired') NOT NULL DEFAULT 'needs_review',
  checked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_study_tuition_fees_program (program_id, status)
);

CREATE TABLE IF NOT EXISTS study_applications (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  intake_id INT NOT NULL,
  preference_rank TINYINT NOT NULL DEFAULT 1,
  status ENUM('submitted_to_agency', 'agency_review', 'documents_requested', 'submitted_to_institution', 'offer_conditional', 'offer_unconditional', 'deposit_paid', 'admission_letter_received', 'visa_phase', 'rejected', 'withdrawn') NOT NULL DEFAULT 'submitted_to_agency',
  consent_text_version VARCHAR(20) NOT NULL,
  consent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  candidate_note VARCHAR(1000) NULL,
  admin_note TEXT NULL,
  institution_reference VARCHAR(120) NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_status_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_study_applications_candidate_intake (candidate_id, intake_id),
  INDEX idx_study_applications_status (status, last_status_at)
);

CREATE TABLE IF NOT EXISTS study_application_events (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  actor_type ENUM('candidate', 'admin', 'system') NOT NULL,
  actor_id INT NULL,
  action VARCHAR(80) NOT NULL,
  note VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_study_application_events_app (application_id, created_at)
);
