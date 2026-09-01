ALTER TABLE `evaluations`
  ADD COLUMN `secondReviewRequired` boolean NOT NULL DEFAULT false,
  ADD COLUMN `secondReviewedAt` timestamp NULL,
  ADD COLUMN `secondReviewedBy` varchar(320) NULL,
  ADD COLUMN `secondReviewNote` text NULL;

CREATE INDEX `idx_evaluations_second_review` ON `evaluations` (`secondReviewRequired`, `secondReviewedAt`, `reviewedAt`);

-- Cette migration est additive : aucune donnée existante n’est supprimée ni remplacée.
