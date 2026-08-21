CREATE TABLE email_delivery_incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  advisorEmail VARCHAR(320) NOT NULL,
  thresholdId INT NOT NULL,
  failureCount INT NOT NULL,
  thresholdValue INT NOT NULL,
  status ENUM('open', 'acknowledged') NOT NULL DEFAULT 'open',
  triggeredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledgedAt TIMESTAMP NULL,
  acknowledgedByAdminEmail VARCHAR(320) NULL,
  INDEX idx_email_incident_advisor_time (advisorEmail, triggeredAt),
  INDEX idx_email_incident_status_time (status, triggeredAt)
);
