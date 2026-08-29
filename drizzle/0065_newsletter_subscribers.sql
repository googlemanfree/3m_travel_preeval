CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `email` varchar(320) NOT NULL,
  `language` varchar(2) NOT NULL DEFAULT 'fr',
  `consentGiven` boolean NOT NULL DEFAULT true,
  `subscribedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `unsubscribedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
  CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`)
);
CREATE INDEX `newsletter_subscribers_active_idx` ON `newsletter_subscribers` (`unsubscribedAt`, `subscribedAt`);
