-- v168: human portrait gate and administrative booking references
-- Safe additive migration. No existing data is deleted.
ALTER TABLE candidates
  ADD COLUMN avatarVerificationStatus ENUM('missing','pending','verified','rejected') NOT NULL DEFAULT 'missing',
  ADD COLUMN avatarVerificationMethod ENUM('camera','gallery') NULL DEFAULT 'gallery',
  ADD COLUMN avatarVerificationReason VARCHAR(255) NULL,
  ADD COLUMN avatarFaceCount INT NOT NULL DEFAULT 0,
  ADD COLUMN avatarVerifiedAt TIMESTAMP NULL;

ALTER TABLE applications
  ADD COLUMN gdsReference VARCHAR(100) NULL,
  ADD COLUMN ticketNumber VARCHAR(100) NULL;
