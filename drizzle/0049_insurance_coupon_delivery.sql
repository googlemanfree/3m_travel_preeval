ALTER TABLE insurance_requests
  ADD COLUMN couponFileKey varchar(512) NULL,
  ADD COLUMN couponFileName varchar(255) NULL,
  ADD COLUMN couponGeneratedAt timestamp NULL,
  ADD COLUMN couponEmailSentAt timestamp NULL,
  ADD COLUMN attestationEmailSentAt timestamp NULL;
