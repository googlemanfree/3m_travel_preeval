-- Uniformisation des comptes administrateurs : aucun compte ne conserve un rôle super_admin.
-- Les droits opérationnels restent protégés par une session admin valide côté serveur.
UPDATE `admin_accounts` SET `role` = 'admin' WHERE `role` <> 'admin';

ALTER TABLE `admin_accounts`
  MODIFY COLUMN `role` enum('admin') NOT NULL DEFAULT 'admin';
