-- c9852dc8: real ambassador referrals and commission tracking.
-- Safe to apply once: creates only the new table and nullable referral column.
CREATE TABLE `ambassadors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(50),
  `country` varchar(100),
  `referralCode` varchar(16) NOT NULL,
  `commissionRateBps` int NOT NULL DEFAULT 1500,
  `status` enum('active','suspended') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ambassadors_email_unique` (`email`),
  UNIQUE KEY `ambassadors_referralCode_unique` (`referralCode`),
  KEY `idx_ambassadors_referral_code` (`referralCode`)
);

ALTER TABLE `applications`
  ADD COLUMN `referredByCode` varchar(16) NULL;
