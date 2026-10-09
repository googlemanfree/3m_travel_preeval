-- File admin post-sélection : contrat / lettre d'invitation → Protocole N°02 → procédure
ALTER TABLE `placement_profile_submissions`
  ADD COLUMN `admin_pipeline_stage` ENUM('selected', 'contract_invitation', 'protocol_two', 'procedure_ready') NULL AFTER `status`,
  ADD COLUMN `contract_confirmed_at` timestamp NULL AFTER `admin_pipeline_stage`,
  ADD COLUMN `invitation_confirmed_at` timestamp NULL AFTER `contract_confirmed_at`,
  ADD COLUMN `protocol_two_opened_at` timestamp NULL AFTER `invitation_confirmed_at`;
