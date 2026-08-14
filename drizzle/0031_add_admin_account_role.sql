ALTER TABLE `admin_accounts`
  ADD COLUMN `role` enum('admin','super_admin') NOT NULL DEFAULT 'admin';

UPDATE `admin_accounts`
SET `role` = 'super_admin'
WHERE LOWER(`email`) = 'aureoldonfack@gmail.com';
