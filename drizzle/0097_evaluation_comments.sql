-- Commentaires et questions liés aux bilans d'évaluation.
-- Idempotent : crée la table uniquement lorsqu'elle est absente.
CREATE TABLE IF NOT EXISTS evaluation_comments (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  dossierNumber VARCHAR(100) NOT NULL,
  parentCommentId INT NULL,
  authorType ENUM('candidate','admin') NOT NULL,
  authorId INT NULL,
  authorName VARCHAR(255) NOT NULL,
  authorEmail VARCHAR(320) NOT NULL,
  content TEXT NOT NULL,
  isQuestion TINYINT(1) NOT NULL DEFAULT 1,
  isRead TINYINT(1) NOT NULL DEFAULT 0,
  readAt TIMESTAMP NULL,
  isResolved TINYINT(1) NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
