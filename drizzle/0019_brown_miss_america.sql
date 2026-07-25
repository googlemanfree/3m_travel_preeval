ALTER TABLE `applications` MODIFY COLUMN `dossierStatus` enum('nouveau','en_evaluation','bilan_envoye','en_attente_paiement','paye','en_attente_documents','documents_recus','soumis_agences','en_cours_recrutement','contrat_obtenu','visa_approuve','refuse') NOT NULL DEFAULT 'nouveau';--> statement-breakpoint
ALTER TABLE `applications` ADD `evaluationStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `evaluationCompletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `evaluationReportUrl` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `evaluationScore` int;--> statement-breakpoint
ALTER TABLE `applications` ADD `evaluationBadge` varchar(50);--> statement-breakpoint
ALTER TABLE `applications` ADD `documentsSubmissionMethod` enum('en_ligne','agence_physique');--> statement-breakpoint
ALTER TABLE `applications` ADD `documentsReceivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `documentsVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `documentsVerifiedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `submittedToAgenciesAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `submittedToAgenciesBy` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `recruitmentPartnerName` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `recruitmentPartnerReference` varchar(100);--> statement-breakpoint
ALTER TABLE `applications` ADD `adminAssignedTo` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `lastStatusUpdateAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `lastStatusUpdatedBy` varchar(255);