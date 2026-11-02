-- Gouvernance du contenu : relectures des pages publiques et « Quoi de neuf » daté. Uniquement de nouvelles tables, idempotent.
CREATE TABLE IF NOT EXISTS content_reviews (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  page_path VARCHAR(190) NOT NULL,
  reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by VARCHAR(160) NOT NULL,
  note VARCHAR(300) NULL,
  UNIQUE KEY uq_content_reviews_path (page_path)
);

CREATE TABLE IF NOT EXISTS content_updates (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  summary VARCHAR(600) NOT NULL,
  page_path VARCHAR(190) NULL,
  published TINYINT(1) NOT NULL DEFAULT 0,
  published_at TIMESTAMP NULL,
  archived_at TIMESTAMP NULL,
  created_by VARCHAR(160) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_content_updates_published (published, archived_at, published_at)
);
