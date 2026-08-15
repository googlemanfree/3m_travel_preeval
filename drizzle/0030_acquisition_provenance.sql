-- Custom SQL migration file, put your code below!
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS acquisitionSource ENUM('facebook', 'whatsapp', 'direct', 'other') NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS acquisitionCampaign VARCHAR(160) NULL;

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS acquisitionSource ENUM('facebook', 'whatsapp', 'direct', 'other') NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS acquisitionCampaign VARCHAR(160) NULL;