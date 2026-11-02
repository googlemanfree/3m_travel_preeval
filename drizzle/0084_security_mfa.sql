CREATE TABLE IF NOT EXISTS `security_totp_factors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actor_type` ENUM('admin','employer') NOT NULL,
  `actor_id` INT NOT NULL,
  `secret_ciphertext` TEXT NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT FALSE,
  `enrolled_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_totp_actor` (`actor_type`, `actor_id`)
);

CREATE TABLE IF NOT EXISTS `security_recovery_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actor_type` ENUM('admin','employer') NOT NULL,
  `actor_id` INT NOT NULL,
  `code_hash` VARCHAR(255) NOT NULL,
  `used_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_recovery_actor` (`actor_type`, `actor_id`, `used_at`)
);
