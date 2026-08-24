CREATE TABLE IF NOT EXISTS `footer_engagement_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `surface` enum('footer_shortcut','footer_social') NOT NULL,
  `target_key` varchar(80) NOT NULL,
  `href` varchar(512) NOT NULL,
  `language` enum('fr','en') NOT NULL DEFAULT 'fr',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `footer_engagement_events_id` PRIMARY KEY(`id`),
  INDEX `footer_engagement_surface_created_idx` (`surface`, `created_at`),
  INDEX `footer_engagement_target_created_idx` (`target_key`, `created_at`)
);
