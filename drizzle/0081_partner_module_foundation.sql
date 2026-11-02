-- Module « Entreprises & partenaires » — socle (phase 1).
-- Uniquement de NOUVELLES tables : aucune table existante n'est modifiée, donc rien ne casse si cette migration
-- n'est pas encore appliquée (les écrans concernés affichent alors un message clair).

-- Informations d'inscription complémentaires : catégorie précise, mandat, justificatif d'autorisation (stocké en privé).
CREATE TABLE IF NOT EXISTS partner_registration_extras (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  category ENUM('employer', 'recruiter', 'placement_agency') NOT NULL,
  mandate_company VARCHAR(255) NULL,
  mandate_confidential BOOLEAN NOT NULL DEFAULT FALSE,
  authorization_doc_key VARCHAR(512) NULL,
  authorization_doc_name VARCHAR(255) NULL,
  authorization_doc_mime VARCHAR(64) NULL,
  upload_token_hash VARCHAR(128) NULL,
  upload_token_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX uq_partner_registration_extras_request (request_id)
);

-- Fiche de suivi relationnel d'un partenaire (une par organisation).
CREATE TABLE IF NOT EXISTS partner_profiles (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  category ENUM('employer', 'recruiter', 'placement_agency') NOT NULL DEFAULT 'employer',
  relationship_status ENUM('prospect', 'contacted', 'in_verification', 'validated', 'active', 'suspended') NOT NULL DEFAULT 'prospect',
  primary_contact_name VARCHAR(255) NULL,
  primary_contact_email VARCHAR(320) NULL,
  primary_contact_phone VARCHAR(64) NULL,
  primary_contact_role VARCHAR(160) NULL,
  specialties TEXT NULL,
  operating_countries TEXT NULL,
  owner_admin_id INT NULL,
  owner_admin_label VARCHAR(160) NULL,
  next_follow_up_at TIMESTAMP NULL,
  public_display_consent BOOLEAN NOT NULL DEFAULT FALSE,
  public_display_consented_at TIMESTAMP NULL,
  mandate_company VARCHAR(255) NULL,
  mandate_confidential BOOLEAN NOT NULL DEFAULT FALSE,
  internal_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uq_partner_profiles_org (organization_id),
  INDEX idx_partner_profiles_status (relationship_status, next_follow_up_at)
);

-- Historique des échanges et changements de statut (visible de l'administration uniquement).
CREATE TABLE IF NOT EXISTS partner_interactions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  kind ENUM('note', 'call', 'email', 'meeting', 'status_change', 'invitation', 'document') NOT NULL DEFAULT 'note',
  summary TEXT NOT NULL,
  follow_up_at TIMESTAMP NULL,
  created_by_admin_id INT NULL,
  created_by_label VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_partner_interactions_org (organization_id, created_at)
);

-- Invitations personnelles : lien à usage unique, durée limitée, jeton stocké haché.
CREATE TABLE IF NOT EXISTS partner_invitations (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  email VARCHAR(320) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  collaboration_role ENUM('reader', 'manager') NOT NULL DEFAULT 'reader',
  permissions TEXT NULL,
  token_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  revoked_at TIMESTAMP NULL,
  created_by_admin_id INT NULL,
  created_by_account_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX uq_partner_invitations_token (token_hash),
  INDEX idx_partner_invitations_org (organization_id, created_at),
  INDEX idx_partner_invitations_email (email)
);

-- Permissions détaillées d'un utilisateur partenaire (surcharge des valeurs par défaut du rôle).
CREATE TABLE IF NOT EXISTS partner_user_permissions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  permissions TEXT NOT NULL,
  updated_by_label VARCHAR(160) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uq_partner_user_permissions_account (account_id)
);
