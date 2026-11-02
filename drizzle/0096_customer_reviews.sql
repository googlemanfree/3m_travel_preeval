-- Avis clients (table `customer_reviews`, déclarée dans drizzle/schema.ts). Aucune migration du dépôt ne la créait : sur une base
-- fabriquée uniquement à partir des fichiers .sql, la page d'accueil lisait une table absente. Idempotent : sans effet si elle existe déjà.
CREATE TABLE IF NOT EXISTS customer_reviews (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  destinationCountry VARCHAR(100) NULL,
  serviceType VARCHAR(100) NULL,
  rating INT NOT NULL,
  reviewText TEXT NOT NULL,
  consentToPublish TINYINT(1) NOT NULL DEFAULT 0,
  displayNameChoice ENUM('full_name','first_name_only','initials') NOT NULL DEFAULT 'first_name_only',
  status ENUM('pending_review','approved','rejected') NOT NULL DEFAULT 'pending_review',
  adminNotes TEXT NULL,
  reviewedByAdminEmail VARCHAR(320) NULL,
  reviewedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_reviews_status (status)
);
