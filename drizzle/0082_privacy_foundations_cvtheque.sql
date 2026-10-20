-- Confidentialité dès la conception (fondations) + CVthèque contrôlée — migration 0082.
-- Uniquement de NOUVELLES tables : aucune table existante n'est modifiée.

-- Journal unifié des consultations sensibles, téléchargements, transmissions, modifications, suppressions.
-- Aucune donnée sensible n'y figure : identifiants, actions, dates ; l'adresse IP est conservée sous forme d'empreinte.
CREATE TABLE IF NOT EXISTS privacy_audit_events (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_type ENUM('admin', 'employer', 'candidate', 'system') NOT NULL,
  actor_id INT NULL,
  actor_label VARCHAR(160) NULL,
  organization_id INT NULL,
  action VARCHAR(80) NOT NULL,
  resource_type VARCHAR(60) NULL,
  resource_id VARCHAR(120) NULL,
  outcome ENUM('success', 'denied', 'failure') NOT NULL DEFAULT 'success',
  details VARCHAR(500) NULL,
  ip_hash VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_privacy_audit_created (created_at),
  INDEX idx_privacy_audit_actor (actor_type, actor_id, action, created_at),
  INDEX idx_privacy_audit_resource (resource_type, resource_id)
);

-- Journal des consentements (ajout seulement) : version du texte, accord ou retrait, date.
CREATE TABLE IF NOT EXISTS consent_records (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  subject_type ENUM('candidate', 'partner_user') NOT NULL,
  subject_id INT NOT NULL,
  kind VARCHAR(60) NOT NULL,
  version VARCHAR(32) NOT NULL,
  granted BOOLEAN NOT NULL,
  source VARCHAR(40) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_consent_records_subject (subject_type, subject_id, kind, created_at)
);

-- Registre des prestataires et destinataires : aucune intégration ne peut être activée sans examen enregistré.
CREATE TABLE IF NOT EXISTS data_processors (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  hosting_country VARCHAR(120) NULL,
  data_categories VARCHAR(255) NOT NULL,
  contract_basis VARCHAR(255) NULL,
  safeguards_status ENUM('unreviewed', 'reviewed', 'refused') NOT NULL DEFAULT 'unreviewed',
  integration_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  reviewed_by_admin_id INT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uq_data_processors_name (name)
);

-- Prestataires repérés dans le code : tous « non examinés » tant qu'un administrateur n'a pas documenté leurs garanties.
INSERT IGNORE INTO data_processors (name, purpose, data_categories, notes) VALUES
  ('Plateforme d''hébergement et de stockage de fichiers', 'Hébergement du site, de la base de données et des documents déposés', 'Toutes les données du site, documents compris', 'Pays d''hébergement et garanties contractuelles à confirmer.'),
  ('Serveur d''envoi d''e-mails (SMTP)', 'Envoi des notifications et réponses', 'Adresse e-mail, nom, contenu des messages (sans pièce sensible)', 'Prestataire et pays à confirmer.'),
  ('Google (connexion par compte Google)', 'Authentification facultative des candidats', 'Adresse e-mail, nom, photo de profil Google', 'À examiner.'),
  ('Google Gemini (analyse assistée)', 'Analyse assistée des évaluations, uniquement sous consentement du candidat', 'Réponses de l''évaluation, extraits de CV', 'À examiner : ne jamais activer sans consentement.'),
  ('CinetPay (paiement en ligne)', 'Paiement des frais', 'Références de paiement, montant, coordonnées de facturation', 'À examiner.'),
  ('Twilio (messagerie mobile)', 'Messages de suivi', 'Numéro de téléphone, contenu du message', 'Usage à confirmer.');

-- Présence d'un candidat dans la CVthèque : uniquement des informations professionnelles déclarées, jamais de pièce ni de nationalité.
CREATE TABLE IF NOT EXISTS cvtheque_profiles (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  candidate_id INT NOT NULL,
  job_title VARCHAR(160) NULL,
  sector VARCHAR(160) NULL,
  skills TEXT NULL,
  education_level VARCHAR(60) NULL,
  experience_years INT NULL,
  languages TEXT NULL,
  availability VARCHAR(32) NULL,
  destinations TEXT NULL,
  residence_country VARCHAR(120) NULL,
  work_authorization ENUM('none', 'other_country', 'application_in_progress', 'not_specified') NOT NULL DEFAULT 'not_specified',
  visibility_state ENUM('draft', 'pending_review', 'published', 'withdrawn', 'rejected') NOT NULL DEFAULT 'draft',
  verification_levels TEXT NULL,
  search_text TEXT NULL,
  published_at TIMESTAMP NULL,
  withdrawn_at TIMESTAMP NULL,
  reviewed_at TIMESTAMP NULL,
  reviewed_by_admin_id INT NULL,
  review_note TEXT NULL,
  next_review_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uq_cvtheque_profiles_profile (profile_id),
  INDEX idx_cvtheque_profiles_state (visibility_state, published_at),
  INDEX idx_cvtheque_profiles_candidate (candidate_id)
);

-- « Ma sélection » d'un utilisateur partenaire dans la CVthèque (distincte des favoris des profils envoyés par 3M).
CREATE TABLE IF NOT EXISTS partner_selections (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  account_id INT NOT NULL,
  cvtheque_profile_id INT NOT NULL,
  note VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX uq_partner_selections_account_profile (account_id, cvtheque_profile_id),
  INDEX idx_partner_selections_org (organization_id)
);

-- Transmission encadrée d'une pièce privée : demande motivée, destinataire précis, lien temporaire, enregistrement.
CREATE TABLE IF NOT EXISTS document_transmissions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  file_id INT NOT NULL,
  file_label VARCHAR(255) NOT NULL,
  purpose VARCHAR(500) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  issued_by_admin_id INT NOT NULL,
  issued_by_label VARCHAR(160) NULL,
  link_expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_document_transmissions_candidate (candidate_id, created_at)
);
