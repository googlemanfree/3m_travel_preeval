ALTER TABLE `admin_text_templates`
  ADD COLUMN `language` enum('fr','en') NOT NULL DEFAULT 'fr' AFTER `scope`;

CREATE INDEX `admin_text_templates_language_idx` ON `admin_text_templates` (`language`);
