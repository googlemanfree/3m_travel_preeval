-- Protocole d'Accord N°02 (post-sélection) — champs d'audit sur applications
ALTER TABLE `applications`
  ADD COLUMN `secondAgreementReadyAt` timestamp NULL,
  ADD COLUMN `secondAgreementReadyBy` varchar(320) NULL,
  ADD COLUMN `secondAgreementEmployer` varchar(255) NULL,
  ADD COLUMN `secondAgreementPosition` varchar(255) NULL,
  ADD COLUMN `secondAgreementFormula` varchar(20) NULL,
  ADD COLUMN `secondAgreementSigned` boolean NOT NULL DEFAULT false,
  ADD COLUMN `secondAgreementSignedAt` int NULL,
  ADD COLUMN `secondAgreementSignatureName` varchar(255) NULL,
  ADD COLUMN `secondAgreementIpAddress` varchar(64) NULL;
