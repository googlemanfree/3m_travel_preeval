CREATE TABLE payment_receipt_approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source ENUM('online','agency') NOT NULL,
  paymentId INT NOT NULL,
  dossierNumber VARCHAR(50) NOT NULL,
  candidateEmail VARCHAR(320) NOT NULL,
  amount VARCHAR(50) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  approvedByName VARCHAR(255) NOT NULL,
  approvedByEmail VARCHAR(320) NOT NULL,
  approvedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signatureLabel VARCHAR(255) NOT NULL,
  signatureHash VARCHAR(128) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
