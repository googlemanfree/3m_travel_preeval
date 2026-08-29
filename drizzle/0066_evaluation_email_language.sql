ALTER TABLE `evaluation_emails`
  ADD COLUMN `language` enum('fr','en') NOT NULL DEFAULT 'fr' AFTER `emailType`;
