ALTER TABLE `candidate_placement_consents`
  ADD COLUMN `pdf_share_consent` boolean NOT NULL DEFAULT false AFTER `status`;

ALTER TABLE `candidate_placement_consents`
  ADD COLUMN `photo_share_consent` boolean NOT NULL DEFAULT false AFTER `pdf_share_consent`;

ALTER TABLE `placement_candidate_profiles`
  ADD COLUMN `summary_status` ENUM('draft', 'approved', 'rejected', 'needs_revalidation') NOT NULL DEFAULT 'draft' AFTER `languages_summary`;

ALTER TABLE `placement_candidate_profiles`
  ADD COLUMN `summary_draft` text NULL AFTER `summary_status`;

ALTER TABLE `placement_candidate_profiles`
  ADD COLUMN `summary_pdf_key` varchar(512) NULL AFTER `summary_draft`;

ALTER TABLE `placement_candidate_profiles`
  ADD COLUMN `summary_fingerprint` varchar(128) NULL AFTER `summary_pdf_key`;

ALTER TABLE `placement_candidate_profiles`
  ADD COLUMN `summary_review_note` text NULL AFTER `summary_fingerprint`;

ALTER TABLE `placement_candidate_profiles`
  ADD COLUMN `summary_validated_at` timestamp NULL AFTER `summary_review_note`;

ALTER TABLE `placement_candidate_profiles`
  ADD COLUMN `summary_validated_by_admin_id` int NULL AFTER `summary_validated_at`;

ALTER TABLE `placement_candidate_profiles`
  ADD COLUMN `summary_updated_at` timestamp NULL AFTER `summary_validated_by_admin_id`;
