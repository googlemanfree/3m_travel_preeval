-- Espace partenaire et versements de commissions (suite de la migration 0098).
-- Uniquement de NOUVELLES tables : aucune table existante n'est modifiée ; rien ne casse si cette migration n'est pas
-- encore appliquée (l'espace partenaire et le relevé affichent alors un message clair).

-- Lien privé de l'espace partenaire : seul l'empreinte du jeton est conservée (révocable, renouvelable).
CREATE TABLE IF NOT EXISTS partnership_space_links (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX uq_partnership_space_token (token_hash),
  INDEX idx_partnership_space_application (application_id)
);

-- Versement d'une commission mensuelle : une ligne par partenaire et par mois (montant versé figé).
CREATE TABLE IF NOT EXISTS partnership_payouts (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  period VARCHAR(7) NOT NULL,
  amount_xaf INT NOT NULL,
  payments_count INT NOT NULL,
  reference VARCHAR(120) NULL,
  method VARCHAR(60) NULL,
  note VARCHAR(500) NULL,
  paid_at TIMESTAMP NOT NULL,
  paid_by VARCHAR(320) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX uq_partnership_payout_period (application_id, period)
);
