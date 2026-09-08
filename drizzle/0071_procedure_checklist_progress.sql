CREATE TABLE IF NOT EXISTS `procedure_checklist_progress` (
  `id` int AUTO_INCREMENT NOT NULL,
  `dossierKey` varchar(64) NOT NULL,
  `candidateId` int NOT NULL,
  `destination` varchar(100),
  `visaType` varchar(100),
  `completedStepIds` text NOT NULL,
  `updatedByRole` enum('candidate','admin','system') NOT NULL DEFAULT 'candidate',
  `updatedById` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE now(),
  CONSTRAINT `procedure_checklist_progress_id` PRIMARY KEY(`id`),
  CONSTRAINT `procedure_checklist_progress_dossierKey_unique` UNIQUE(`dossierKey`),
  INDEX `idx_checklist_progress_candidate` (`candidateId`,`updatedAt`),
  INDEX `idx_checklist_progress_destination` (`destination`,`visaType`)
);
