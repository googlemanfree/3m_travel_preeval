ALTER TABLE `applications`
  ADD COLUMN `paymentSecretCodeHash` varchar(128) NULL,
  ADD COLUMN `paymentSecretCodeSubmittedAt` timestamp NULL,
  ADD COLUMN `paymentValidatedAt` timestamp NULL,
  ADD COLUMN `paymentValidatedBy` varchar(320) NULL;

-- Le code secret brut n’est jamais stocké. La validation admin compare une empreinte SHA-256.
