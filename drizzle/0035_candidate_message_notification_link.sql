-- Migration non destructive : relation optionnelle message candidat -> notification source
SET @has_notification_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'candidate_messages'
    AND column_name = 'notificationId'
);
SET @sql := IF(
  @has_notification_id = 0,
  'ALTER TABLE candidate_messages ADD COLUMN notificationId INT NULL AFTER candidateId',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index léger pour retrouver rapidement le message associé à une notification.
SET @has_index := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'candidate_messages'
    AND index_name = 'candidate_messages_notification_id_idx'
);
SET @sql_index := IF(
  @has_index = 0,
  'CREATE INDEX candidate_messages_notification_id_idx ON candidate_messages (notificationId)',
  'SELECT 1'
);
PREPARE stmt_index FROM @sql_index;
EXECUTE stmt_index;
DEALLOCATE PREPARE stmt_index;

-- Les messages historiques restent valides et ne sont pas associés artificiellement à une notification.
INSERT INTO __drizzle_migrations (hash, created_at)
SELECT '0035_candidate_message_notification_link', UNIX_TIMESTAMP() * 1000
WHERE NOT EXISTS (
  SELECT 1 FROM __drizzle_migrations WHERE hash = '0035_candidate_message_notification_link'
);
