CREATE TABLE email_delivery_incident_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  incidentId INT NOT NULL,
  commentText TEXT NOT NULL,
  createdByAdminEmail VARCHAR(320) NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_incident_comment_incident_time (incidentId, createdAt)
);
