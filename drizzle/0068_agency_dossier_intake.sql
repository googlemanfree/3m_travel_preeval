ALTER TABLE `agency_dossiers`
  ADD COLUMN `initialPaymentStatus` enum('unknown','pending','paid') NOT NULL DEFAULT 'unknown',
  ADD COLUMN `depositDate` timestamp NULL;

