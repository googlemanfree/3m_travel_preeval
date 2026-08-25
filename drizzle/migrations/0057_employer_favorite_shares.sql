CREATE TABLE `placement_employer_favorite_shares` (
  `id` int AUTO_INCREMENT NOT NULL,
  `source_favorite_id` int NOT NULL,
  `organization_id` int NOT NULL,
  `recipient_employer_account_id` int NOT NULL,
  `shared_by_employer_account_id` int NOT NULL,
  `revoked_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `placement_employer_favorite_shares_id` PRIMARY KEY(`id`),
  CONSTRAINT `uniq_favorite_share_recipient` UNIQUE(`source_favorite_id`,`recipient_employer_account_id`),
  KEY `idx_favorite_share_recipient` (`organization_id`,`recipient_employer_account_id`,`revoked_at`)
);
