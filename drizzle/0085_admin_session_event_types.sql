-- Allow the security journal to record the event types used by adminAuth.login.
-- The historical table used an ENUM limited to login/renewed/revoked_all,
-- while the application also records login_failed, login_blocked,
-- twofactor_failed and login_attempts_reset.
ALTER TABLE `admin_session_events`
  MODIFY COLUMN `eventType` VARCHAR(80) NOT NULL;
