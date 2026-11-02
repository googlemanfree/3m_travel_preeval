-- Besoins de recrutement, présentations de candidats, demandes d'entretien, notifications et historique — migration 0083.
-- Uniquement de NOUVELLES tables : aucune table existante n'est modifiée.

-- Besoin de recrutement déposé par une entreprise partenaire (ou proposition de poste liée à un profil).
CREATE TABLE IF NOT EXISTS recruitment_needs (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  created_by_account_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  company_name VARCHAR(255) NULL,
  beneficiary_confidential BOOLEAN NOT NULL DEFAULT FALSE,
  missions TEXT NOT NULL,
  country VARCHAR(120) NOT NULL,
  work_location VARCHAR(200) NULL,
  salary_gross INT NULL,
  salary_currency VARCHAR(8) NULL,
  salary_period ENUM('hour', 'month', 'year') NULL,
  contract_duration VARCHAR(120) NULL,
  required_skills TEXT NULL,
  required_qualifications TEXT NULL,
  required_experience VARCHAR(300) NULL,
  required_languages VARCHAR(300) NULL,
  recognitions_required TEXT NULL,
  foreign_applications ENUM('yes', 'no', 'tbc') NOT NULL DEFAULT 'tbc',
  no_local_work_auth ENUM('yes', 'no', 'tbc') NOT NULL DEFAULT 'tbc',
  review_residence_countries TEXT NULL,
  intl_support ENUM('yes', 'no', 'to_specify') NOT NULL DEFAULT 'to_specify',
  intl_support_detail TEXT NULL,
  status ENUM('received', 'under_review', 'verified', 'needs_info', 'closed', 'rejected') NOT NULL DEFAULT 'received',
  admin_note TEXT NULL,
  verified_at TIMESTAMP NULL,
  verified_by_admin_id INT NULL,
  related_cvtheque_profile_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_recruitment_needs_org (organization_id, status, created_at),
  INDEX idx_recruitment_needs_status (status, created_at)
);

-- Candidats présentés pour un besoin : relie l'entreprise, le poste et le profil, avec le statut de chaque étape.
CREATE TABLE IF NOT EXISTS need_candidates (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  need_id INT NOT NULL,
  cvtheque_profile_id INT NOT NULL,
  origin ENUM('employer', 'admin') NOT NULL DEFAULT 'employer',
  status ENUM('proposed', 'admin_review', 'candidate_contacted', 'candidate_interested', 'candidate_declined', 'presented', 'interview_requested', 'interview_scheduled', 'interview_done', 'employer_selected', 'employer_not_selected', 'closed') NOT NULL DEFAULT 'proposed',
  employer_decision ENUM('pending', 'selected', 'not_selected', 'on_hold') NOT NULL DEFAULT 'pending',
  employer_comment VARCHAR(1000) NULL,
  admin_note TEXT NULL,
  candidate_responded_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uq_need_candidates_pair (need_id, cvtheque_profile_id),
  INDEX idx_need_candidates_profile (cvtheque_profile_id, status)
);

-- Demandes d'entretien : l'administration vérifie l'offre, confirme l'intérêt du candidat et coordonne.
CREATE TABLE IF NOT EXISTS interview_requests (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  requested_by_account_id INT NOT NULL,
  cvtheque_profile_id INT NOT NULL,
  need_id INT NULL,
  proposed_slots VARCHAR(500) NULL,
  mode ENUM('video', 'phone', 'onsite', 'undecided') NOT NULL DEFAULT 'undecided',
  message VARCHAR(1000) NULL,
  status ENUM('received', 'accepted', 'candidate_confirmed', 'scheduled', 'done', 'declined', 'cancelled') NOT NULL DEFAULT 'received',
  scheduled_at TIMESTAMP NULL,
  admin_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_interview_requests_org (organization_id, status, created_at),
  INDEX idx_interview_requests_profile (cvtheque_profile_id, status)
);

-- Notifications du module : jamais de pièce ni de donnée sensible dans le message.
CREATE TABLE IF NOT EXISTS partner_notifications (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  recipient_kind ENUM('admin', 'organization', 'candidate') NOT NULL,
  organization_id INT NULL,
  candidate_id INT NULL,
  kind VARCHAR(60) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message VARCHAR(500) NOT NULL,
  related_type VARCHAR(40) NULL,
  related_id INT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_partner_notifications_org (recipient_kind, organization_id, read_at, created_at),
  INDEX idx_partner_notifications_candidate (recipient_kind, candidate_id, read_at, created_at)
);

-- Historique des besoins, présentations et entretiens (qui, quoi, quand).
CREATE TABLE IF NOT EXISTS recruitment_events (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  subject_type ENUM('need', 'need_candidate', 'interview') NOT NULL,
  subject_id INT NOT NULL,
  organization_id INT NULL,
  actor_type ENUM('admin', 'employer', 'candidate', 'system') NOT NULL,
  actor_label VARCHAR(160) NULL,
  action VARCHAR(80) NOT NULL,
  note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recruitment_events_subject (subject_type, subject_id, created_at)
);
