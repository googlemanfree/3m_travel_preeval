ALTER TABLE `evaluations`
  ADD COLUMN `referenceCode` varchar(32) NULL;

CREATE UNIQUE INDEX `uq_evaluations_reference_code` ON `evaluations` (`referenceCode`);
