-- Files de profils B2B + demandes d'accès publiques (agences / employeurs)
ALTER TABLE `placement_candidate_profiles`
  ADD COLUMN `profile_pool` ENUM('eligible_evaluation', 'top_talent') NOT NULL DEFAULT 'eligible_evaluation' AFTER `languages_summary`;

CREATE TABLE IF NOT EXISTS `placement_access_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organization_type` ENUM('placement_partner', 'employer') NOT NULL,
  `legal_name` varchar(255) NOT NULL,
  `country` varchar(120) NOT NULL,
  `contact_name` varchar(255) NOT NULL,
  `contact_email` varchar(320) NOT NULL,
  `contact_phone` varchar(64) NULL,
  `website` varchar(320) NULL,
  `message` text NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `reviewed_at` timestamp NULL,
  `reviewed_by_admin_id` int NULL,
  `review_note` text NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_placement_access_requests_status` (`status`, `created_at`)
);
