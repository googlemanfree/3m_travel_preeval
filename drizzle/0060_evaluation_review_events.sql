CREATE TABLE `evaluation_review_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `evaluationId` int NOT NULL,
  `adminEmail` varchar(320) NOT NULL,
  `action` varchar(40) NOT NULL,
  `note` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `evaluation_review_events_id` PRIMARY KEY(`id`)
);

CREATE INDEX `idx_evaluation_review_events_evaluation_created`
  ON `evaluation_review_events` (`evaluationId`, `createdAt`);
CREATE INDEX `idx_evaluation_review_events_admin_created`
  ON `evaluation_review_events` (`adminEmail`, `createdAt`);
