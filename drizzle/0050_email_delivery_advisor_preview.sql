ALTER TABLE email_delivery_logs
  ADD COLUMN triggeredByAdminEmail VARCHAR(320) NULL,
  ADD COLUMN contentHtml TEXT NULL;
